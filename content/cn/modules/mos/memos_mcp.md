---
title: MCP (Model Context Protocol) 设置指南
desc: Model Context Protocol (MCP) 是一个标准协议，使AI助手能够安全地访问和交互本地和远程资源。在MemOS项目中，MCP为内存操作提供了标准化接口，允许外部应用程序通过定义良好的工具和资源与内存系统交互。
---


## 配置

### 环境变量

在项目根目录创建 `.env` 文件，包含以下配置：

```bash
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1

# 内存系统配置
MOS_TEXT_MEM_TYPE=tree_text

# Neo4j 配置（tree_text 内存类型必需）
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
```

## 启动 MCP 服务器

### 方法 1：使用内置服务器脚本

```bash
# 导航到项目根目录
cd /path/to/MemOS

# 使用默认 stdio 传输运行
python src/memos/api/mcp_serve.py

# 使用 HTTP 传输运行
python src/memos/api/mcp_serve.py --transport http --host localhost --port 8000

# 使用 SSE 传输运行（已弃用但仍支持）
python src/memos/api/mcp_serve.py --transport sse --host localhost --port 8000
```

### 方法 2：使用示例脚本

```bash
# 导航到示例目录
cd examples/mem_mcp

# 运行服务器
python simple_fastmcp_serve.py --transport http --port 8000
```

### 传输选项

MCP 服务器支持三种传输方式：

1. **stdio**（默认）：标准输入/输出，用于本地应用程序
2. **http**：基于HTTP的传输，用于Web应用程序
3. **sse**：服务器发送事件（已弃用但仍支持）

### 命令行参数

- `--transport`：选择传输方式（`stdio`、`http`、`sse`）
- `--host`：HTTP/SSE 传输的主机地址（默认：`localhost`）
- `--port`：HTTP/SSE 传输的端口号（默认：`8000`）

## MCP 客户端使用

### 基本客户端示例

项目包含一个示例客户端，演示如何与 MCP 服务器交互：

```bash
# 确保 MCP 服务器在 HTTP 传输上运行
cd examples/mem_mcp
python simple_fastmcp_serve.py --transport http --port 8000

# 在另一个终端中运行客户端
cd examples/mem_mcp
python simple_fastmcp_client.py
```

## MCP 配置

为了在 Cursor IDE 中集成 MemOS MCP 服务器，请将此配置添加到您的 `desktop_config.json` 和其他本地 MCP：

```json
{
  "mcpServers": {
    "memos-fastmcp": {
      "command": "/path/to/your/conda/envs/memos/bin/python",
      "args": [
        "-m", "memos.api.mcp_serve",
        "--transport", "stdio"
      ],
    //   "cwd": "/path/to/your/MemOS pip user is optional",
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key-here",
        "OPENAI_API_BASE": "https://api.openai.com/v1",
        "MOS_TEXT_MEM_TYPE": "tree_text",
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your-neo4j-password"
      }
    }
  }
}
``` 