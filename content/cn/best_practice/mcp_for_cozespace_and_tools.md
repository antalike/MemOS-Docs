---
title: 在Coze空间配置Memos的MCP以及工具插件
---

本指南将帮助您在Coze空间中配置MemOS的MCP服务以及创建自定义工具插件，实现智能体与记忆系统的无缝集成。

## Coze空间MCP配置

::steps{}

### 启动MCP模块

首先需要启动MCP模块，并映射域名为HTTPS（需要自己申请配置）：

```bash
python examples/mem_mcp/simple_fast_mcp_serve.py --transport http
```

::note
**HTTPS要求**<br>注意需要自行配置HTTPS地址，Coze空间要求使用安全连接。
::

### 打开Coze空间并配置工具

1. 打开Coze空间并进入工具配置页面

![Coze空间配置页面](https://statics.memtensor.com.cn/memos/coze_space_1.png)

### 添加自定义工具

在工具配置页面中添加自定义工具：

![添加自定义工具](https://statics.memtensor.com.cn/memos/coze_space_2.png)

### 配置MCP并增加工具

配置MCP连接并添加所需的工具功能：

![配置MCP工具](https://statics.memtensor.com.cn/memos/coze_space_3.png)

::note
**HTTPS配置提醒**<br>请确保在配置过程中使用正确的HTTPS地址用户需要自行配置https路由。
::

::

## 自定义Coze工具

对于需要使用自己服务器部署http服务的用户，可以直接使用Coze的IDE创建自定义工具。以下以`add_memory`为例：

::steps{}

### 启动MemOS服务

首先启动MemOS API服务：

```bash
python /MemOS/src/memos/api/product_api.py --port 9002
```

### 在Coze上配置工具插件

1. 选择IDE插件创建方式
2. 配置请求自己部署的HTTP服务

![Coze IDE插件配置](https://statics.memtensor.com.cn/memos/coze_tools_1.png)

### 配置add_memory操作

在Coze IDE中配置`add_memory`操作并发布：

![配置add_memory操作](https://statics.memtensor.com.cn/memos/coze_tools_2.png)
详细代码如下

```python
import json
import requests
from runtime import Args
from typings.add_memory.add_memory import Input, Output

def handler(args: Args[Input])->Output:
    memory_content = args.input.memory_content
    user_id = args.input.user_id
    mem_cube_id = args.input.mem_cube_id
    # 发送POST请求到产品添加接口
    url = "http://xxxxxxxxxx/product/add"
    payload = json.dumps({
        "memory_content": memory_content,
        "user_id": user_id,
        "mem_cube_id": mem_cube_id
    })
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    return json.loads(response.text)
````

::note
**IDE配置**<br>在IDE中可以自定义工具的参数、返回值格式等，确保与MemOS API接口一致。 采用此方法完成 search 接口以及用户注册接口的编写，并点点击发布
::

### 发布并使用插件

发布完成后，可以在"我的资源"中查看插件，以插件形式融入智能体工作流：

![发布后的插件资源](https://statics.memtensor.com.cn/memos/coze_tools_3.png)

### 构建智能体并测试

构建最简易智能体后，即可进行记忆操作测试：

1. 创建新的智能体
2. 添加已发布的记忆插件
3. 配置工作流
4. 测试记忆存储和检索功能

::

通过以上配置，您就可以在Coze空间中成功集成MemOS的记忆功能，为您的智能体提供强大的记忆能力。
