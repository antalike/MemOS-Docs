---
title: Claude MCP
---


## 1. 配置 MCP 与 MemOS 云服务

在客户端中填写如下配置：

```json
{
  "mcpServers": {
    "memos-api-mcp": {
      "timeout": 60,
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@memtensor/memos-api-mcp"
      ],
      "env": {
        "MEMOS_API_KEY": "mpg-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "MEMOS_USER_ID": "your-user-id",
        "MEMOS_CHANNEL": "MODELSCOPE"
      }
    }
  }
}
```

环境变量获取方式：
- `MEMOS_API_KEY`: 在MemOS官网[API控制台](https://memos-dashboard.openmem.net/cn/apikeys/)上注册账号，然后在接口密钥页面新建api-key并复制粘贴在此处。

![在MemOS API控制台上新建api-key](https://cdn.memtensor.com.cn/img/1763452232848_t268eh_compressed.png)

- `MEMOS_USER_ID`: 确定性的用户自定义个人标识符。
  - 对于同一用户，该环境变量需要在不同设备/客户端中保持一致；
  - 请不要使用随机值、设备ID或聊天会话ID作为用户标识符；
  - 推荐使用：个人email地址、姓名全称或员工ID作为用户标识符。

- `MEMOS_CHANNEL`: 填写为"MODELSCOPE"即可。


## 2. 在 Claude 客服端中使用
在Claude Desktop中使用MemOS，需点击左下角头像 -> "Settings" -> "Developer" -> "Edit Config"， 并粘贴配置到Claude_desktop_config.json文件中，最后重启客户端，观察到memos-api-mcp服务处于running状态即可在聊天中使用。

![在Claude中使用MemOS-验证](https://cdn.memtensor.com.cn/img/1763105334517_9ayhrp_compressed.png)

为了提升使用效果，建议用户在Claude Desktop中使用MemOS时修改作用于所有对话的用户偏好设置，具体方法为点击左下角头像 -> "General", 在"What personal preferences should Claude consider in responses?"下面的输入框中粘贴如下内容：

```
你是MemOS记忆管理助手，致力于提供高效的记忆管理服务，基于用户过往的对话内容抽取记忆，并通过记忆检索提升用户与AI对话的一致性和个性化水平。在每次回答用户的问题之前，你需要调用memos-api-mcp的search_memory服务，利用恰当的检索词在用户的个人记忆库中搜索和当前话题有关的记忆。在基于这些记忆完成回答后，再调用memos-api-mcp的add_message服务，将当前对话内容摘要记录下来。（请注意，调用add_message这一步是必须进行的，无论用户说了什么或问了什么问题都要记录下来，否则在后续的对话中，search_memory将无法获取到更细致的用户信息，进而导致你不能准确地回答用户问题。）
```

![在Claude Desktop中使用MemOS-修改用户偏好](https://cdn.memtensor.com.cn/img/1763105396189_i1tupr_compressed.png)

下面是在Claude Desktop中使用MemOS的示例，用户可借此判断是否已经成功在Claude Desktop中配置MemOS。

![在Claude Desktop中使用MemOS的示例](https://cdn.memtensor.com.cn/img/1763105412700_asgfq9_compressed.png)
