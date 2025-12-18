---
title: 多模态消息
desc: 添加消息时，将图片和文档集成到与MemOS的交互中。
---

MemOS 不仅支持文本，还支持多模态数据，包括文档和图片。用户可以将文本、文档和图片无缝整合到与 MemOS 的交互中，使系统能够从多种媒体类型提取相关信息，丰富记忆内容，并增强记忆系统的能力。

## 1. 如何添加多模态消息

:::note{icon="websymbol:chat"}
当消息包含多模态内容时，由于文件记忆的加工时间较长，您传入的`async_mode`字段失效，此时默认使用“异步模式”。您可通过`get/status`接口查询文件记忆的处理进度。
:::

当用户上传文档或图片时，MemOS 会提取文本、视觉信息和其他相关细节，并处理为用户记忆。

**添加消息**

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "MemOS_user_001",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "text",
                  "text": "我正在研究MemOS。"
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                  }
                }
            ]
        },
        {"role": "assistant", "content": "好的，需要我为您解答吗？"}
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

**检索记忆**

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "帮我总结一下这张图",
  "user_id": "MemOS_user_001",
  "conversation_id": "1214"
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

# 替换打印部分
print("结果：")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

**输出结果**

## 2. 媒体类型

MemOS 目前支持以下的媒体类型：

1.  **图片** - JPG、PNG 及其他常见图片格式
    
2.  **文档** - PDF、DOCX、 DOC、 TXT
    

## 3. 文件上传限制

1.  添加消息时，每次请求上传的文件不超过20个，单文件大小不超过 100 MB、200页。
    
2.  当文件数量、单文件大小或页数超出上述限制时，本次任务将被判定为“处理失败”。您需根据限制要求调整后，重新发起请求。
    

## 4. 使用示例

### 4.1 上传图片消息

**使用图片网址**

添加消息时，可以直接上传图片的网址。

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "MemOS_user_001",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                  }
                }
            ]
        }
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

**使用 Base64 图像编码上传本地图片**

上传本地图像或者直接嵌入图像，可以使用 Base64 图像编码。

```python
import os
import requests
import json
import base64

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# 图像文件的路径地址
image_path = "path/to/your/image.jpg"

# 使用 Base64 为图像编码
with open(image_path, "rb") as image_file:
    base64_image = base64.b64encode(image_file.read()).decode("utf-8")

data = {
    "user_id": "MemOS_user_001",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                }
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 4.2 上传文档

**使用文档网址**

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "MemOS_user_001",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "file",
                  "file": {
                    "file_data": "https://cdn.memtensor.com.cn/file/MemOS: A Memory OS for AI System.pdf"
                  }
                }
            ]
        }
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

**使用 Base64 图像编码上传本地文档**

```python
import os
import requests
import json
import base64

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# 文档文件的路径地址
document_path = "path/to/your/document.pdf"

# 将文件转换为 Base64 字符串的函数
def file_to_base64(file_path):
    with open(file_path, "rb") as file:
        return base64.b64encode(file.read()).decode('utf-8')

# 使用 Base64 为文档编码
base64_document = file_to_base64(document_path)

data = {
    "user_id": "MemOS_user_001",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                    "type": "file",
                    "file": {"file_data": base64_document}
                }
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print("结果：")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 4.3 完整示例

以下是一个完整的示例，展示如何添加用户与助手包含了不同媒体类型的对话消息：

```python
import os
import json
import requests

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "MemOS_user_001",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "我在研究MemOS。"
                }  # 文本消息
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                    }
                }  # 上传图片
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "file",
                    "file": {
                        "file_data": "https://cdn.memtensor.com.cn/file/MemOS: A Memory OS for AI System.pdf"
                    }
                }  # 上传文档
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```
