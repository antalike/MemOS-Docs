---
title: 用 MemOS 为 AI 应用构建共享知识库
desc: 应用负责归属与共享，MemOS 负责文档解析与检索，让有权限的用户围绕同一份知识库提问。
---

产品手册放在云盘，新人指南留在群聊，客服政策存于同事电脑。新人入职的前半周，常常花在寻找最新版本上。

Memmy 通过基于 MemOS 接口的知识库能力解决这个问题：每个人维护自己的资料库，也可以共享给同事。成员通过同一个检索接口，查询同一份内容。

实现的关键在于分工。MemOS 没有“共享知识库”或“列出全部知识库”的接口，共享由 Memmy 在应用层实现。本文通过一个可在本地运行的 Demo，展示两层如何配合。

## 先明确两层分工

共享知识库在界面上是一项功能，底层包含两种职责：

| 负责方 | 管理内容 | 实现方式 |
| --- | --- | --- |
| MemOS | 文档原文、解析、分段与可检索记忆片段 | `/create/knowledgebase`、`/add/knowledgebase-file`、`/search/memory` 等接口 |
| 应用 | 知识库归属、共享对象、当前用户是否有权查看 | 应用数据库中的归属与共享关系 |

MemOS 回答“资料里写了什么”，应用确定“这个人能否读取”。检索时，应用计算当前用户可见的 `knowledgebase_ids`，将明确的列表交给 `/search/memory`。

这样的权限模型可以按团队、项目或有效期设计。应用也承担权限检查的责任，因此 Demo 将未授权用户的访问验证作为完整场景。

## Demo 中的三个角色

```text
alice · 产品负责人
创建“产品手册”，上传手册和新人指南，
并把知识库共享给 bob。

bob · 客户成功
切换到自己的账号，在“共享知识库”中看到资料，
可以提问，但不能上传、删除或再次共享。

cara · 新同事
未加入共享名单，侧边栏不显示该知识库。
```

alice 验证写入路径，bob 验证只读访问，cara 验证隔离。

## 一次回答背后的流程

```text
用户打开知识库页面
  │
  ├─ 应用按当前 user_id 加载“我的”与“共享给我”的列表
  │
  ├─ 拥有者上传文档
  │   → /add/knowledgebase-file
  │   → 轮询 /get/knowledgebase-file，等待 completed
  │
  ├─ 拥有者输入对方用户 ID
  │   → 应用在自己的数据库写入共享关系，此步不调用 MemOS
  │
  ├─ 成员提问
  │   → 应用确认访问权限
  │   → 调用一次 /search/memory：user_id + knowledgebase_ids
  │   → 模型基于召回片段回答
  │
  └─ 可选：通过 /add/message 将本轮写入当前用户的记忆
```

知识库内容由获准成员共享同一份，个人记忆按 `user_id` 保持各自范围。bob 可以读取 alice 维护的手册，但不会因此取得 alice 的个人偏好；bob 的偏好也不会传回 alice。

## 先运行 Demo

完整项目：[共享知识库 Demo](https://github.com/shinetata/MemOS-KnowledgeBase-Practice)。

准备 MemOS API Key 和兼容 OpenAI 的模型服务：

```bash
git clone https://github.com/shinetata/MemOS-KnowledgeBase-Practice.git
cd MemOS-KnowledgeBase-Practice
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

填写 `.env`：

```bash
MEMOS_API_KEY=YOUR_MEMOS_API_KEY
MEMOS_BASE_URL=https://memos.memtensor.cn/api/openmem/v1
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_BASE_URL=YOUR_OPENAI_BASE_URL
OPENAI_MODEL=YOUR_MODEL_NAME
```

```bash
python app.py
```

打开 [http://127.0.0.1:8765](http://127.0.0.1:8765)。Demo 内置 `alice`、`bob`、`cara` 三个用户，可通过左上角头像切换。共享时输入对方用户 ID，例如 `bob`；当前用户 ID 显示在侧边栏。

建议按完整流程体验：用 `alice` 建库 → 上传示例文档 → 等待可用 → 共享给 `bob` → 切换到 `bob` 提问 → 切换到 `cara` 验证不可见。`cara` 仍可进行普通问答，回复会说明没有参考知识库，与 bob 带引用的回答形成对照。

## 四个关键实现选择

Demo 的核心位于 `memos_client.py`、`store.py`、`app.py` 三个文件，下面的代码分别对应其中的实现。

### 选择一：文档解析交给 MemOS

创建知识库返回的 ID，直接保存在应用中并关联当前用户，成为权限关系的连接依据：

```python
kb_id = memos.create_knowledgebase(name, description)
store.create_kb(kb_id, owner_id, name, description)
```

文件编码为 Data URI 后，交给 `/add/knowledgebase-file`。解析、分段与索引都在 MemOS 完成：

```python
encoded = base64.b64encode(content).decode("ascii")
memos.post("/add/knowledgebase-file", {
    "knowledgebase_id": kb_id,
    "file": [{
        "type": "document",
        "name": filename,
        "content": f"data:{mime};base64,{encoded}",
    }],
})
```

新上传文件通常返回 `running`，页面轮询 `/get/knowledgebase-file`，直到 `completed` 或 `failed`。解析完成前，检索无法召回该文档。Demo 在处理期间持续轮询，让用户看到状态变化。

### 选择二：共享是应用数据库中的一条关系

拥有者输入对方 ID 后，应用检查权限和账号是否存在，再写入共享关系，此步不调用 MemOS：

```python
def share_kb(self, owner_id, kb_id, member_id):
    if not self.can_manage(owner_id, kb_id):
        raise PermissionError("只有拥有者可以共享")
    if not self.get_user(member_id):
        raise KeyError("用户 ID 不存在")
    self.insert_share(kb_id, member_id)
```

Demo 通过稳定用户 ID 匹配成员。应用也可以像 Memmy 一样，先把手机号或邮箱解析为账号，再保存对应用户 ID。成员打开页面时，应用读取自己的两类关系：

```python
owned = store.list_owned(user_id)
shared = store.list_shared(user_id)
```

拥有者可上传、删除与共享，成员只能浏览文件并提问。

### 选择三：通过 knowledgebase_ids 落实权限范围

生成回答前，应用先验证访问权限，再将 ID 传入检索：

```python
kb = require_view(user_id, kb_id)
retrieved = memos.search_memory(
    query=query,
    user_id=user_id,
    knowledgebase_ids=[kb["kb_id"]],
    conversation_id=conversation_id,
)
```

公开接口默认不检索任何知识库，显式传入的 ID 才会参与。`knowledgebase_ids` 承接服务端权限计算结果，每个 ID 都应属于当前用户的获准范围。Demo 只针对当前打开的知识库提问，因此传一个 ID；需要跨全部可见知识库提问时，则传入当前用户可访问的完整列表。

### 选择四：一次检索，两类记忆

一次 `/search/memory` 可以同时返回知识库片段与当前用户的事实、偏好：

```python
context_data = {
    "query": query,
    "user_id": user_id,
    "conversation_id": conversation_id,
    "knowledgebase_ids": [kb_id],
    "include_memory_view": ["detail_factual", "preference"],
    "memory_limit_number": 9,
    "relativity": 0.45,
}
```

提示词应明确两者用途：政策、流程和额度来自知识库；个人偏好可以影响表达，但以文档规则为准。知识库缺乏依据时，助手应说明，而非编造手册中没有的规定。

随后可通过 `/add/message` 将本轮写入当前 `user_id`。bob 下次提问时，MemOS 会带入 bob 自己的偏好，实现资料共享、个人记忆各自保留。

## 验收检查

接入后走完三个角色，确认：

1. `alice` 建库、上传文档、等待可用，再共享给 `bob`，写入路径完整。
2. `bob` 在共享列表看到知识库并提问，界面不提供上传、删除入口；直接调用写入接口也会被服务端的拥有者权限检查拒绝。
3. `cara` 的侧边栏不显示该知识库，即使猜到 ID 并直接发给 API，也会被应用拒绝。她仍可问一般问题，但检索范围没有知识库，回答没有知识库引用。

第三项往往容易遗漏。服务端需要在每次检索前重新计算可见范围，前端隐藏只负责界面呈现。

## 代码位置

- 仓库：[MemOS-KnowledgeBase-Practice](https://github.com/shinetata/MemOS-KnowledgeBase-Practice)

页面从左到右为窄导航栏、个人与共享知识库列表、当前库的文件面板，以及针对当前库的大问答区。核心检索逻辑集中在 `memos_client.py` 的这个方法中：

```python
def search_memory(self, query, user_id, knowledgebase_ids, conversation_id):
    return self._post("/search/memory", {
        "query": query,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "knowledgebase_ids": knowledgebase_ids,
        "include_memory_view": ["detail_factual", "preference"],
        "memory_limit_number": 9,
        "relativity": 0.45,
    })
```

知识库资料在授权成员之间共享，用户记忆保持个人范围。应用计算可见范围，MemOS 负责文档处理与检索。
