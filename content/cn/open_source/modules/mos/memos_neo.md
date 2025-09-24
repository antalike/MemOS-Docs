---
title: MemOS NEO 版本
desc: 使用 `MOS.simple()` 在几分钟内快速启动 MemOS - 构建内存增强应用程序的最快方式。
---

## 快速设置

### 环境变量

设置您的API凭据：

```bash
export OPENAI_API_KEY="sk-your-api-key-here"
export OPENAI_API_BASE="https://api.openai.com/v1"  # 可选
export MOS_TEXT_MEM_TYPE="general_text"  #或者 "tree_text" 用于高级功能

#提示：general_text 在初始化 MOS 时仅支持单用户
```

### 快速初始化

```python
from memos.mem_os.main import MOS

# 自动配置实例
memory = MOS.simple()
```

::note
**警告：**<br>`MOS.simple()` 将使用默认的嵌入模型和大小 text-embedding-3-large dim-size 3027，如果您之前使用过其他版本的 memos，您需要删除目录 ~/.memos 以获得新的 qdrant 适配新的embedding 或者是删除neo4j的db 因为之前的dim 是768。
::

## 基本用法

```python
#!/usr/bin/env python3
import os
from memos.mem_os.main import MOS

# 设置环境变量
os.environ["OPENAI_API_KEY"] = "sk-your-api-key"
os.environ["MOS_TEXT_MEM_TYPE"] = "general_text"

# 创建内存系统
memory = MOS.simple()

# 添加内存
memory.add("我最喜欢的颜色是蓝色")
memory.add("我是一名软件工程师")
memory.add("我住在旧金山")

# 使用内存上下文聊天
response = memory.chat("用户喜欢的颜色是什么？")
print(response)  # "喜欢的颜色是蓝色！"

response = memory.chat("告诉我关于用户工作和位置")
print(response)  # 使用存储的内存来回应
```

## 内存类型

### 通用文本内存（推荐初学者使用）
- **存储**：本地JSON文件 + Qdrant向量数据库
- **设置**：无外部依赖
- **最适合**：大多数用例，快速原型开发

```bash
export MOS_TEXT_MEM_TYPE="general_text"
```

### 树形文本内存（高级）
- **存储**：Neo4j图数据库
- **设置**：需要Neo4j服务器
- **最适合**：复杂关系推理

```bash
export MOS_TEXT_MEM_TYPE="tree_text"
export NEO4J_URI="bolt://localhost:7687"  # 可选
export NEO4J_PASSWORD="your-password"     # 可选
```

## Neo版本概述

`MOS.simple()` 使用合理的默认值自动创建完整配置：

### 默认设置
- **LLM**：GPT-4o-mini，温度 0.8
- **嵌入器**：OpenAI text-embedding-3-large
- **分块**：512 tokens，重叠 128
- **图数据库**：neo4j 的图数据库

### 默认配置工具

MemOS 在 `default_config.py` 中提供三个主要配置工具：

- **`get_default_config()`**：使用合理默认值创建完整的 MOS 配置
- **`get_default_cube_config()`**：为内存存储创建 MemCube 配置
- **`get_default()`**：同时返回 MOS 配置和 MemCube 实例

```python
from memos.mem_os.utils.default_config import get_default, get_default_cube_config

# 获取 MOS 配置和 MemCube 实例
mos_config, default_cube = get_default(
    openai_api_key="sk-your-key",
    text_mem_type="general_text"
)

# 或者只创建 MemCube 配置
cube_config = get_default_cube_config(
    openai_api_key="sk-your-key",
    text_mem_type="general_text"
)
```

### 手动配置（可选）

如果您需要更多控制，请使用配置工具：

```python
from memos.mem_os.main import MOS
from memos.mem_os.utils.default_config import get_default_config

# 自定义配置
config = get_default_config(
    openai_api_key="sk-your-key",
    text_mem_type="general_text",
    user_id="my_user",
    model_name="gpt-4",           # 不同的模型
    temperature=0.5,              # 较低的创造性
    chunk_size=256,               # 较小的块
    top_k=10                      # 更多搜索结果
)

memory = MOS(config)
```

### 高级功能

启用附加功能：

```python
config = get_default_config(
    openai_api_key="sk-your-key",
    enable_activation_memory=True,    # KV-cache 内存
    enable_mem_scheduler=True,        # 后台处理
)
```


## 其他提示

1. **从简单开始**：最初使用 `general_text` 内存类型
2. **环境设置**：将API密钥保存在环境变量中
3. **内存质量**：添加具体、事实性的信息以获得最佳结果
4. **批量操作**：一起添加多个相关内存
5. **用户上下文**：仅在多用户场景中为 `tree_text` 使用 `user_id` 参数

## 故障排除

### 常见问题

**缺少API密钥错误**：
```bash
# 确保环境变量已设置
echo $OPENAI_API_KEY
```

**Neo4j连接错误**（tree_text模式）：
```bash
# 检查Neo4j是否正在运行（本地用户使用桌面版或企业版neo4j）
``` 