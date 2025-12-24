---
title: Multimodal Messages
desc: Integrate images and documents into interactions with MemOS when adding messages.
---

MemOS supports not only text but also multimodal data, including documents and images. Users can seamlessly integrate text, documents, and images into interactions with MemOS, enabling the system to extract relevant information from multiple media types, enriching memory content, and enhancing the capabilities of the memory system.

## 1. How to Add Multimodal Messages

:::note 
Note<br>
When the message contains multimodal content, due to the longer processing time for file memories, the `async_mode` field you pass in will be invalid, and "Async Mode" will be used by default. You can query the processing progress of file memories via the `get/status` interface.
:::

When users upload documents or images, MemOS extracts text, visual information, and other relevant details, and processes them into user memory.

### Add Message

```python
import os
import requests
import json

# Replace with your MemOS API Key
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
                  "text": "I am researching MemOS."
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                  }
                }
            ]
        },
        {"role": "assistant", "content": "Okay, do you need me to answer anything for you?"}
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

### Retrieve Memory

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "Help me summarize this image",
  "user_id": "MemOS_user_001",
  "conversation_id": "1214"
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

# Replace print part
print("Result:")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Output Result
```python
{
  "code": 0,
  "data": {
    "memory_detail_list": [
      {
        "id": "a5136287-de10-4df2-afc5-e412cdb8b649",
        "memory_key": "Researching MemOS",
        "memory_value": "The user is researching MemOS and shared a relevant image at 7:07 AM on December 18, 2025 (UTC).",
        "memory_type": "WorkingMemory",
        "create_time": 1766041646311,
        "conversation_id": "1211",
        "status": "activated",
        "confidence": 0.99,
        "tags": [
          "Research",
          "MemOS",
          "Image Sharing"
        ],
        "update_time": 1766041689234,
        "relativity": 0.5170716
      },
      {
        "id": "4a1d42f4-c9fa-41bf-805d-2ea985bba984",
        "memory_key": "MemOS Feature Overview",
        "memory_value": "MemOS is an intelligent memory system capable of storing information through adding paths and retrieving information through query functions. The system supports various document formats such as PDF and DOC, and utilizes AI for intelligent response and processing.",
        "memory_type": "WorkingMemory",
        "create_time": 1766041689091,
        "conversation_id": "1211",
        "status": "activated",
        "confidence": 0.99,
        "tags": [
          "MemOS",
          "Intelligent Memory",
          "Information Storage",
          "Query Function",
          "image",
          "visual"
        ],
        "update_time": 1766041689234,
        "relativity": 0.38406307
      }
    ],
    "preference_detail_list": [],
    "tool_memory_detail_list": [],
    "preference_note": ""
  },
  "message": "ok"
}
```

## 2. Media Types

MemOS currently supports the following media types:

1.  **Images** - JPG, PNG, and other common image formats
    
2.  **Documents** - PDF, DOCX, DOC, TXT
    

## 3. File Upload Limits

1.  When adding messages, upload no more than 20 files per request, with a single file size not exceeding 100 MB and 200 pages.
    
2.  When the number of files, single file size, or number of pages exceeds the above limits, the task will be judged as "Processing Failed". You need to adjust according to the limit requirements and re-initiate the request.
    

## 4. Usage Examples

### Upload Image Message

**Using Image URL**

When adding messages, you can directly upload the URL of the image.

```python
import os
import requests
import json

# Replace with your MemOS API Key
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

**Using Base64 Image Encoding for Local Images**

To upload local images or embed images directly, you can use Base64 image encoding.

```python
import os
import requests
import json
import base64

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# Path to image file
image_path = "path/to/your/image.jpg"

# Encode image with Base64
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

### Upload Document Message

**Using Document URL**

```python
import os
import requests
import json

# Replace with your MemOS API Key
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

**Using Base64 Encoding for Local Documents**

```python
import os
import requests
import json
import base64

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# Path to document file
document_path = "path/to/your/document.pdf"

# Function to convert file to Base64 string
def file_to_base64(file_path):
    with open(file_path, "rb") as file:
        return base64.b64encode(file.read()).decode('utf-8')

# Encode document with Base64
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

print("Result:")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Complete Example

The following is a complete example showing how to add conversation messages containing different media types between the user and the assistant:

```python
import os
import json
import requests

# Replace with your MemOS API Key
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
                    "text": "I am researching MemOS."
                }  # Text message
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
                }  # Upload image
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
                }  # Upload document
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
