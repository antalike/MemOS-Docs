---
title: MemOS MCP Integration Guide
description: Configure MemOS MCP services on platforms like Coze to achieve seamless integration between intelligent agents and memory systems
---

This guide will help you configure MemOS MCP services on platforms like Coze Space, enabling seamless integration between intelligent agents and memory systems.

## Choose MCP Deployment Method

MemOS provides two MCP deployment methods. Choose according to your needs:

::tabs
:::Cloud MCP (Recommended)

### Using MemOS Cloud Service

If you want quick access without deploying your own server, we recommend using the official MemOS cloud service.

**Advantages:**
- ✅ Ready to use, no deployment needed
- ✅ High availability guarantee
- ✅ Automatic scaling and maintenance
- ✅ Support for multiple clients (Claude, Cursor, Cline, etc.)

**Configuration:**

Please visit [MemOS Cloud MCP Configuration Guide](https://memos-docs.openmem.net/en/mcp_agent/mcp/guide) for detailed configuration instructions.

Main steps:
1. Register an account at [MemOS API Console](https://memos-dashboard.openmem.net/en/apikeys/) and obtain API Key
2. Configure `@memtensor/memos-api-mcp` service in MCP client
3. Set environment variables (`MEMOS_API_KEY`, `MEMOS_USER_ID`, `MEMOS_CHANNEL`)
:::

:::Self-Hosted MCP

### Deploy MCP Service Yourself

If you need private deployment or customization, you can deploy MCP service on your own server.

**Advantages:**
- ✅ Fully private data
- ✅ Customizable configuration
- ✅ Complete service control
- ✅ Suitable for enterprise internal use

**Prerequisites:**
- Python 3.9+
- Neo4j database (or other supported graph databases)
- HTTPS domain (for platforms like Coze)

Continue reading below for detailed deployment steps.
:::

::

---

## Self-Hosted MCP Service Configuration

The following content is for users who need to deploy MCP service themselves.

## Architecture Overview

Self-hosted MCP service uses the following architecture:

```
Client (Coze/Claude etc.) 
    ↓ [HTTPS]
MCP Server (Port 8002)
    ↓ [HTTP Call]
Server API (Port 8001)
    ↓
MemOS Core Service
```

**Component Description:**
- **Server API**: Provides REST API interface (`/product/*`), handles memory CRUD operations
- **MCP Server**: Exposes MCP protocol via HTTP transport, calls Server API to complete operations
- **HTTPS Reverse Proxy**: Platforms like Coze require HTTPS secure connections

::steps{level="3"}

### Step 1: Start Server API

Server API is the backend of MCP service, providing actual memory management functions.

```bash
cd /path/to/MemOS
python src/memos/api/server_api.py --port 8001
```

Verify if Server API is running properly:

```bash
curl http://localhost:8001/docs
```

Step 1: Open Coze Space and Configure Tools

1. Open Coze Space and navigate to the tool configuration page

![Coze Space Configuration Page](https://statics.memtensor.com.cn/memos/coze_space_1.png)

### Step 2: Add Custom MCP Tools

Add custom tools in the tool configuration page:

![Add Custom Tools](https://statics.memtensor.com.cn/memos/coze_space_2.png)

### Step 3: Configure MCP Connection URL

Configure MCP connection URL using your configured HTTPS address:

```
https://your-domain.com/mcp
```

![Configure MCP Tools](https://statics.memtensor.com.cn/memos/coze_space_3.png)

Available MCP tools:
- **add_memory**: Add new memory
- **search_memories**: Search existing memories
- **chat**: Memory-based conversation

::note
**Test Connection**<br>
After configuration, test MCP connection in Coze to ensure all tools can be called successfully.
::

::

---─────────────────────────────────────────────────╮
│       MemOS MCP via Server API                   │
│       Transport:   HTTP                          │
│       Server URL:  http://localhost:8002/mcp     │
╰──────────────────────────────────────────────────╯
```

**Environment Variable Configuration (Optional):**

Configure Server API address via `.env` file or environment variables:

```bash
export MEMOS_API_BASE_URL="http://localhost:8001/product"
```

::note
**Tool List**<br>
MCP service provides the following tools:
- `add_memory`: Add memory
- `search_memories`: Search memories
- `chat`: Chat with memory system

For complete tool list, refer to `examples/mem_mcp/simple_fastmcp_serve.py`
::

### Step 3: Configure HTTPS Reverse Proxy

Platforms like Coze require HTTPS connections. You need to configure HTTPS reverse proxy (like Nginx) to forward traffic to MCP service.

**Nginx Configuration Example:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /mcp {
        proxy_pass http://localhost:8002/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE support
        proxy_buffering off;
        proxy_cache off;
    }
}
```

::warning
**HTTPS Certificate**<br>
Ensure you use a valid SSL certificate. Self-signed certificates may not be accepted by platforms like Coze. You can get free certificates from Let's Encrypt.
::

### Step 4: Test MCP Service

Use client test script to verify the service:

```bash
cd /path/to/MemOS
python examples/mem_mcp/simple_fastmcp_client.py
```

Successful output example:

```
Working FastMCP Client
========================================
Connected to MCP server

  1. Adding memory...
    Result: Memory added successfully
  
  2. Searching memories...
    Result: [search results]
  
  3. Chatting...
    Result: [AI response]

✓ All tests completed!
```

::

## Configure MCP in Coze Space

After service deployment, configure MCP connection in Coze Space.

::steps{level="3"}

### Open Coze Space and Configure Tools

1. Open Coze Space and navigate to the tool configuration page

![Coze Space Configuration Page](https://statics.memtensor.com.cn/memos/coze_space_1.png)

### Add Custom Tools

Add custom tools in the tool configuration page:

![Add Custom Tools](https://statics.memtensor.com.cn/memos/coze_space_2.png)

###Direct REST API Integration (Advanced)

For scenarios requiring more flexible integration, you can directly use Server API's REST interface.
::

::steps{level="3"}

### Step 1: Start Server API

```bash
cd /path/to/MemOS
python src/memos/api/server_api.py --port 8001
```

### Step 2: Configure Custom Tools in Coze IDE

1. Select "IDE Plugin" creation method in Coze
2. Configure requests to your deployed Server API service

![Coze IDE Plugin Configuration](https://statics.memtensor.com.cn/memos/coze_tools_1.png)

### Step 3: Implement add_memory Tool

![Configure add_memory Operation](https://statics.memtensor.com.cn/memos/coze_tools_2.png)

**Code Example:**

```python
import json
import requests
from runtime import Args
from typings.add_memory.add_memory import Input, Output

def handler(args: Args[Input]) -> Output:
    """Add memory to MemOS"""
    memory_content = args.input.memory_content
    user_id = args.input.user_id
    cube_id = args.input.cube_id
    
    # Call Server API's add interface
    url = "https://your-domain.com:8001/product/add"
    payload = json.dumps({
        "user_id": user_id,
        "messages": memory_content,  # Supports string or message array
        "writable_cube_ids": [cube_id] if cube_id else None
    })
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, data=payload, timeout=30)
    response.raise_for_status()
    
    return response.json()
```

**Other Tool Implementations:**

Similarly implement search and chat tools:

```python
# Search Tool
def search_handler(args: Args[Input]) -> Output:
    url = "https://your-domain.com:8001/product/search"
    payload = {
        "user_id": args.input.user_id,
        "query": args.input.query,
        "readable_cube_ids": args.input.cube_ids,
        "top_k": args.input.top_k or 5
    }
    response = requests.post(url, json=payload, timeout=30)
    return response.json()

# Chat Tool
def chat_handler(args: Args[Input]) -> Output:
    url = "https://your-domain.com:8001/product/chat/complete"
    payload = {
        "user_id": args.input.user_id,
        "query": args.input.query
    }
    response = requests.post(url, json=payload, timeout=30)
    return response.json()
```

::note
**Server API Parameter Description**<br>
- **messages**: Memory content, supports string or standard message format array
- **writable_cube_ids**: List of writable cube IDs for multi-tenant scenarios
- **readable_cube_ids**: List of readable cube IDs for searching
- **top_k**: Maximum number of search results to return

For complete API documentation, refer to detailed examples in `examples/api/server_router_api.py`.
::

### Step 4: Publish and Test Tools

After publishing, you can view the plugin in "My Resources":

![Published Plugin Resources](https://statics.memtensor.com.cn/memos/coze_tools_3.png)

### Step 5: Integrate into Agent Workflow

Add the plugin to your agent workflow:

1. Create a new agent or edit an existing one
2. Add the published MemOS plugin to the tool list
3. Configure the workflow to call memory tools
4. Test memory storage and retrieval functions

::

---

## FAQ

### Q1: MCP service cannot connect to Server API

**Solution:**
- Check if Server API is running properly: `curl http://localhost:8001/product/docs`
- Verify environment variable `MEMOS_API_BASE_URL` is configured correctly
- Check MCP service logs to confirm the call address

### Q2: Coze cannot connect to MCP service

**Solution:**
- Ensure HTTPS connection is used
- Check if SSL certificate is valid
- Test reverse proxy configuration: `curl https://your-domain.com/mcp`
- Check firewall and security group settings

### Q3: Neo4j connection failed

**Solution:**
- Ensure Neo4j service is running properly
- Check connection information in configuration file (uri, user, password)
- Refer to `examples/data/config/tree_config_shared_database.json` for configuration examples

### Q4: How to view complete API examples?

**Reference Files:**
- MCP Server: `examples/mem_mcp/simple_fastmcp_serve.py`
- MCP Client: `examples/mem_mcp/simple_fastmcp_client.py`
- API Testing: `examples/api/server_router_api.py`

---

## Summary

Through this guide, you can:
- ✅ Choose the appropriate MCP deployment method (cloud service or self-hosted)
- ✅ Complete the full MCP service deployment process
- ✅ Integrate MemOS memory functionality in platforms like Coze
- ✅ Direct integration using REST API

Whichever method you choose, MemOS can provide powerful memory management
### Build Agent and Test

After building the simplest intelligent agent, you can perform memory operation tests:

1. Create a new intelligent agent
2. Add the published memory plugin
3. Configure workflow
4. Test memory storage and retrieval functions

Through the above configuration, you can successfully integrate MemOS memory functionality in Coze Space, providing powerful memory capabilities for your intelligent agents. 
