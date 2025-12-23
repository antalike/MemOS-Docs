---
title: Knowledge Base
desc: Create project-associated knowledge bases and combine user memory with knowledge bases to supplement knowledge when retrieving memories.
---

## 1. MemOS Knowledge Base vs Traditional RAG

Unlike the static storage of traditional RAG, MemOS makes the knowledge base a part of "memory". AI applications with "memory" can not only query information more accurately but also better understand the context and the user. Let's look at two real-world scenarios to compare the two solutions:

**Shopping Customer Service Robot**

**Background**

```python
DAY 1 User asks: I have a three-month-old Golden Retriever. Which dog food is better? By the way, it doesn't eat chicken flavor.
DAY 1 User bought A Lamb Puppy Food recommended by the assistant.
DAY 10 User asks: The dog gets diarrhea eating this food. I want to switch to another one.
```

**RAG Solution**

```python
# Retrieve fragments related to "puppy food recommendation" and "diarrhea" based on user input, but failed to recall "user's dog doesn't eat chicken flavor". Retrieved knowledge:

1. Common reasons for dog food diarrhea: Can switch to hypoallergenic dog food.
2. Hypoallergenic puppy food recommendations: B (Chicken), C (Salmon).

# 🤦 Shopping Assistant: If diarrhea occurs now, you can try B (Chicken flavor) or C (Salmon).
```

**MemOS Solution**

```python
# Retrieve relevant memories based on user input, perceiving that the user's dog is a three-month-old Golden Retriever puppy, doesn't like chicken, and needs a recommendation for puppy food that won't cause diarrhea. Retrieved memories:

1. User has a three-month-old Golden Retriever at home, weighing about 6kg.
2. User's dog doesn't eat chicken flavor dog food.
3. User previously bought Lamb Puppy Food.
4. Common reasons for dog food diarrhea: Can switch to hypoallergenic dog food.
5. Hypoallergenic puppy food recommendations: B (Chicken), C (Salmon).

# ✅ Shopping Assistant: You mentioned before that the dog is a 3-month-old Golden Retriever and cannot eat chicken flavor, so I have excluded all chicken flavor puppy foods for you. You bought Lamb + Salmon puppy food before. If diarrhea occurs now, you can try the gentler C (Salmon Puppy Hypoallergenic).
```

**Enterprise Knowledge Base Assistant**

**Background**

```python
DAY 1 Employee asks: My computer is a MacBook Pro 13-inch with Intel chip. How do I install the company intranet proxy?
DAY 1 Assistant provided installation steps for the Intel version.
DAY 20 Employee asks: The intranet proxy won't open. Which version should I reinstall?
```

**RAG Solution**

```python
# Retrieve content related to "intranet proxy" and "won't open" based on user input, but failed to recall "user's device model". Retrieved knowledge:

1. Intranet proxy common troubleshooting
2. Mac M1/M2 (ARM) version intranet proxy installation instructions
3. Windows intranet proxy client installation instructions
4. Network connection and certificate issues
5. General FAQ

# 🤦 Knowledge Base Assistant: Please try to re-download and install the latest Mac M1/M2 (ARM) version or Windows intranet proxy client. Here are the installation steps: ...
```

**MemOS Solution**

```python
# Retrieve memories related to "intranet proxy" and "won't open" based on employee question, automatically identifying the employee's device model. Retrieved memories:

1. User installed the company intranet proxy 20 days ago, device is MacBook Pro 13 (Intel)
2. Intranet proxy common troubleshooting
3. Intel version intranet proxy installation instructions

# ✅ Knowledge Base Assistant: You are using a MacBook Pro with Intel chip. It is recommended to reinstall the Intel version of the intranet proxy client. Here are the download link and installation steps for the Intel version: ...
```

::note{icon="ri:triangular-flag-fill"}
**&nbsp;Advantage Summary**<br>
RAG excels at retrieving information semantically similar to the query from the knowledge base, but it is **stateless**: every query is independent, lacking understanding of the specific user and context.<br>

MemOS can understand information such as **relationships, time, and preferences**, associating the current question with historical memories, and finding and using knowledge with "context":<br>

* **Understands Users**: MemOS knows "who you are" and "what you are doing". Just ask a question, and MemOS automatically completes the context.<br>

* **Personalization**: For different roles and work habits, MemOS can remember "this customer doesn't like overly aggressive sales", "you use Python more often than Java", "you asked about reimbursement policy last time, do you need to enter the application process this time".<br>

* **Knowledge Evolution**: When there are "rules of thumb" in actual processes that are not written in documents, MemOS will precipitate them as new memories, continuously supplementing and improving the knowledge system.
::


## 2. How It Works

1.  **Upload**: Create a knowledge base via Console or API and upload documents.

2.  **Validation**: Complete authentication and validate document format, size, etc.

3.  **Storage**: After successful upload, documents are saved by MemOS and enter the processing queue.

4.  **Parsing**: Parse original document content according to different file types.

5.  **Intelligent Segmentation**: Split documents into finer-grained content fragments based on title, structure, and semantics.

6.  **Generate Memory**: MemOS generates knowledge memories based on fragmented content, forming a complete project memory bank together with user long-term memories.

7.  **Embedding and Indexing**: Write all memory content into the database and build embedding indexes to support millisecond-level retrieval.


## 3. Knowledge Base Requirements

### Capacity Limits

MemOS Cloud Service currently provides various pricing plans from Free to Enterprise for all developers. Different versions have different limits on knowledge base capacity and quantity.

::note
Currently, all versions are free for a limited time. Welcome to visit [Official Website - Pricing](https://memos.openmem.net/cn/pricing) to apply for the version that meets your needs.
::

| **Version** | **Knowledge Base Storage Limits** |
| :--- | :--- |
| **Free Plan** | Knowledge Base Count: 10; Single KB Storage: 1G |
| **Starter Plan** | Knowledge Base Count: 30; Single KB Storage: 10G |
| **Pro Plan** | Knowledge Base Count: 100; Single KB Storage: 100G |


::warning
&nbsp;Note<br>
When your service level is downgraded, if existing knowledge bases exceed the capacity limit of the current version, MemOS will **not clear existing knowledge base data**, but will restrict the following operations:<br>

* Cannot create new knowledge bases
* Cannot continue to upload new documents

Relevant functions can be restored after adjusting usage to within the capacity range of the current version.
::

### Document Limits

1.  Supported document types for upload: PDF, DOCX, DOC, TXT

2.  Single file size limit: Not exceeding 100 MB, 200 pages

3.  Maximum number of files per upload: Not exceeding 20

::warning
&nbsp;Note<br>
When the number of files in a single upload, single file size, or page count exceeds the above limits, the upload task will be determined as **processing failed**.<br>
Please adjust the files according to the limit requirements and resubmit the upload request.
::

## 4. Usage Examples

Here is a complete knowledge base usage example to help you quickly get started building your exclusive "Knowledge Base Assistant".

### Create Knowledge Base: Financial Reimbursement Knowledge Base

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "knowledgebase_name": "Financial Reimbursement Knowledge Base",
    "knowledgebase_description": "Summary of all financial reimbursement related knowledge of the company"
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/create/knowledgebase"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Output]
"result": {
  "code": 0,
  "data": {
    "id": "base3c88e38e-396c-4abb-aa00-1f0b66fe9794"
  },
  "message": "ok"
}
```
::

### Upload Document: Software Procurement Reimbursement Policy

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "knowledgebase_id": "base3c88e38e-396c-4abb-aa00-1f0b66fe9794",
    "file": [
        {"content": "https://cdn.memtensor.com.cn/file/Software_Procurement_Reimbursement_Policy.pdf"}
    ]
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/knowledgebase-file"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Output]
"result": {
  "code": 0,
  "data": [
    {
      "id": "1f35642253606ed1e9dd8cd8113a8998",
      "name": "Software_Procurement_Reimbursement_Policy.pdf",
      "sizeMB": 0.06331157684326172,
      "status": "PROCESSING"
    }
  ],
  "message": "ok"
}
```
::

### Add User Conversation

::note{icon="websymbol:chat"}
&nbsp;Session A: Occurred on 2025-06-10<br>
<div style="padding-left: 2em;">
The designer indicated in the chat that their position is [Designer in Creative Platform Department].
</div>
::

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "designer_001",
    "conversation_id": "0610",
    "messages": [
    {
        "role": "user",
        "content": "I am a designer in the Creative Platform Department."
    },
    {
        "role": "assistant",
        "content": "Okay, I've noted that."
    }
    ]
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

### Retrieve Knowledge Base Memory

::note{icon="websymbol:chat"}
&nbsp;Session A: Occurred on 2025-12-12<br>
<div style="padding-left: 2em;">
In a new session, the user asks about [Software Reimbursement Policy]. MemOS automatically recalls [Knowledge Base Memory: Software Reimbursement Policy Content] and [User Memory: Creative Platform Designer], thereby answering with more specific and "user-aware" software reimbursement content.
</div>
::
  
::code-group

```python [Python (HTTP)]
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "designer_001",
    "conversation_id": "1211",
    "query": "Check the software procurement reimbursement limit for me.",
    "knowledgebase_ids":["base3c88e38e-396c-4abb-aa00-1f0b66fe9794"]
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))


# Prettify JSON output
json_res = res.json()
print(json.dumps(json_res, indent=2, ensure_ascii=False))
```

```python [Output]
"memory_detail_list": [
  {
    "id": "2c760355-de4b-4a8f-b98d-b92851d23fa7",
    "memory_key": "Software Procurement Reimbursement Policy (Trial Version)",
    "memory_value": "This policy aims to regulate the company's procurement and reimbursement processes for various software, requiring all software procurement to follow specific procurement amount limits for certain categories. The procurement limit for design software is 1000 yuan, applicable to graphic design, video editing, and prototype design, examples include Photoshop and Premiere. The procurement limit for code/development software is 1500 yuan, applicable scope includes IDEs and development frameworks, examples are PyCharm and Visual Studio. The procurement limit for office software is 800 yuan, applicable to document editing and spreadsheet processing, examples include Office suite and WPS. The procurement limit for data analysis software is 1200 yuan, applicable scope is data statistics and visualization, examples include Tableau and Power BI. The procurement limit for security and protection software is 1000 yuan, applicable to antivirus and firewalls. The procurement limit for collaboration/project management software is 900 yuan, examples include Jira and Slack. The procurement limit for special industry software is 2000 yuan, requiring special approval. All procurement must comply with company budget and information security requirements; software exceeding the limit requires business justification and special approval.",
    "memory_type": "WorkingMemory",
    "create_time": 1765525947718,
    "conversation_id": "default_session",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "Software Procurement",
      "Reimbursement Policy",
      "Approval Process",
      "Budget",
      "Information Security",
      "mode:fine",
      "multimodal:file"
    ],
    "update_time": 1765525947720,
    "relativity": 0.89308184
  },
  {
    "id": "81fd1e79-65be-4d4e-81e0-8f76ba697c55",
    "memory_key": "Position Info",
    "memory_value": "The user is a designer in the Creative Platform Department.",
    "memory_type": "WorkingMemory",
    "create_time": 1765526247112,
    "conversation_id": "0610",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "Position",
      "Department",
      "Design"
    ],
    "update_time": 1765526247113,
    "relativity": 1.6319022e-05
  }
]
```
::

### Feedback Optimization for Knowledge Base

In enterprises, it often happens that corporate policies/knowledge are updated but the knowledge base is not updated in time. Currently, MemOS supports memory feedback for the knowledge base through **natural language conversation**, which is used to quickly update knowledge base memories, thereby improving accuracy and timeliness.

Try it out, drive the knowledge base to always stay up-to-date with the simplest interaction.

::note{icon="websymbol:chat"}
&nbsp;Session A: Occurred on 2025-12-12<br>
<div style="padding-left: 2em;">
In another new session, the financial supervisor provides feedback [The procurement limit for office software is 600 yuan, not 800 yuan].
</div>
::

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "finance_supervisor",
    "conversation_id": "1212",
    "feedback_content": "The procurement limit for office software is 600 yuan, not 800 yuan.",
    "allow_knowledgebase_ids":["base3c88e38e-396c-4abb-aa00-1f0b66fe9794"]
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/feedback"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

::note{icon="websymbol:chat"}
&nbsp;Session A: Occurred on 2025-12-12<br>
<div style="padding-left: 2em;">
When any other user searches for [Software Reimbursement Policy], they get a new high-weight memory [The procurement limit for office software is 600 yuan, not 800 yuan].
</div>
::

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "user_001",
    "conversation_id": "1211",
    "query": "Check the software procurement reimbursement limit for me.",
    "knowledgebase_ids":["base3c88e38e-396c-4abb-aa00-1f0b66fe9794"]
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))


# Prettify JSON output
json_res = res.json()
print(json.dumps(json_res, indent=2, ensure_ascii=False))
```

Output result as follows (simplified):

```python
"memory_detail_list": [
  {
    "id": "8a4f3d2e-c417-4e53-bc25-54451abd5ac8",
    "memory_key": "Software Procurement Reimbursement Policy (Trial Version)",
    "memory_value": "This policy aims to regulate the company's procurement and reimbursement processes for various software, requiring all software procurement to follow specific procurement amount limits for certain categories. The procurement limit for design software is 1000 yuan, applicable to graphic design, video editing, and prototype design, examples include Photoshop and Premiere. The procurement limit for code/development software is 1500 yuan, applicable scope includes IDEs and development frameworks, examples are PyCharm and Visual Studio. The procurement limit for office software is 800 yuan, applicable to document editing and spreadsheet processing, examples include Office suite and WPS. The procurement limit for data analysis software is 1200 yuan, applicable scope is data statistics and visualization, examples include Tableau and Power BI. The procurement limit for security and protection software is 1000 yuan, applicable to antivirus and firewalls. The procurement limit for collaboration/project management software is 900 yuan, examples include Jira and Slack. The procurement limit for special industry software is 2000 yuan, requiring special approval. All procurement must comply with company budget and information security requirements; software exceeding the limit requires business justification and special approval.",
    "memory_type": "LongTermMemory",
    "create_time": 1765525947718,
    "conversation_id": "default_session",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "Software Procurement",
      "Reimbursement Policy",
      "Approval Process",
      "Budget",
      "Information Security",
      "mode:fine",
      "multimodal:file"
    ],
    "update_time": 1765525947720,
    "relativity": 0.8931847
  },
  {
    "id": "a72a04d1-d7ba-4ebd-9410-0097bfa6c20d",
    "memory_key": "Office Software Procurement Limit",
    "memory_value": "User confirmed that the procurement limit for office software is 600 yuan, not 800 yuan.",
    "memory_type": "WorkingMemory",
    "create_time": 1765531700539,
    "conversation_id": "1212",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "Procurement",
      "Office Software",
      "Budget"
    ],
    "update_time": 1765531700540,
    "relativity": 0.7196722
  }
]
```

[Console - Knowledge Base](https://memos-dashboard.openmem.net/knowledgeBase/) displays details of all corrections or completions of knowledge base memories through natural language interaction.

![image.png](https://cdn.memtensor.com.cn/img/1765970178683_5tuxe4_compressed.png)

::note
For a complete list of feedback API fields, formats, etc., please see the [Add Feedback Interface Documentation](/api_docs/message/add_feedback).
::
