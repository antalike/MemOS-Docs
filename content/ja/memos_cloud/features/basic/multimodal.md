---
title: マルチモーダルメッセージ
desc: メッセージを追加する際に、画像とドキュメントをMemOSとのインタラクションに統合します。
---
::warning
**[この記事は【記憶追加-addMessageインターフェース】内のマルチモーダルデータの追加方法について詳しく紹介するものです。こちらをクリックして詳細な API ドキュメントを直接ご確認いただけます](/api_docs/core/add_message)**
::

MemOS はテキストだけでなく、ドキュメントや画像を含むマルチモーダルデータにも対応しています。ユーザーは、テキスト、ドキュメント、画像をMemOSとのインタラクションにシームレスに統合でき、システムは複数のメディアタイプから関連情報を抽出し、記憶内容を豊かにし、記憶システムの能力を強化できます。

## 1. マルチモーダルメッセージを追加する方法

:::note 
注意<br>
メッセージにマルチモーダルコンテンツが含まれる場合、ファイル記憶の処理時間が長いため、渡した`async_mode`フィールドは無効になります。この場合、デフォルトで「非同期モード」が使用されます。`get/status`インターフェースを通じてファイル記憶の処理進捗を確認できます。
:::

ユーザーがドキュメントまたは画像をアップロードすると、MemOS はテキスト、視覚情報、およびその他の関連する詳細を抽出し、ユーザー記憶として処理します。

:::note
**マルチモーダルメッセージとツール記憶**

ドキュメントや画像コンテンツの処理に加えて、MemOS はツール呼び出し情報の処理にも対応しています。メッセージ内にツール呼び出し情報を追加すると、システムはそれをツール記憶として処理し、ツール情報（Tool Schema）と軌跡記憶（Tool Trajectory Memory）を含みます。詳細は[ツール呼び出し](/memos_cloud/features/advanced/tool_calling)をご覧ください。
:::

### メッセージを追加

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "text",
                  "text": "私はMemOSを研究しています。"
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                  }
                }
            ]
        },
        {"role": "assistant", "content": "承知しました。ご説明しましょうか？"}
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

### 記憶を検索

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "この画像を要約してください",
  "user_id": "memos_user_123",
  "conversation_id": "1214"
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

# 出力部分を置き換え
print("結果：")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 出力結果
```python
{
  "code": 0,
  "data": {
    "memory_detail_list": [
      {
        "id": "a5136287-de10-4df2-afc5-e412cdb8b649",
        "memory_key": "MemOSの研究",
        "memory_value": "ユーザーはMemOSを研究しており、関連する画像を1枚共有しました。時刻は2025年12月18日午前7:07（UTC）です。",
        "memory_type": "WorkingMemory",
        "create_time": 1766041646311,
        "conversation_id": "1211",
        "status": "activated",
        "confidence": 0.99,
        "tags": [
          "研究",
          "MemOS",
          "画像共有"
        ],
        "update_time": 1766041689234,
        "relativity": 0.5170716
      },
      {
        "id": "4a1d42f4-c9fa-41bf-805d-2ea985bba984",
        "memory_key": "MemOS機能概要",
        "memory_value": "MemOSはインテリジェント記憶システムであり、パスの追加によって情報を保存し、クエリ機能によって情報を検索できます。システムはPDFやDOCなど複数のドキュメント形式をサポートし、AIを活用してインテリジェントな応答と処理を行います。",
        "memory_type": "WorkingMemory",
        "create_time": 1766041689091,
        "conversation_id": "1211",
        "status": "activated",
        "confidence": 0.99,
        "tags": [
          "MemOS",
          "インテリジェント記憶",
          "情報保存",
          "クエリ機能",
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

## 2. メディアタイプ

MemOS は現在、以下のメディアタイプをサポートしています：

1.  **画像** - JPG、PNG およびその他の一般的な画像形式
    
2.  **ドキュメント** - PDF、DOCX、DOC、TXT、JSON、MD、XML
    

## 3. ファイルアップロード制限

1.  メッセージ追加時、1回のリクエストでアップロードできるファイルは20個以下、単一ファイルのサイズは 100 MB 以下、500ページ以下です。注意：`add/message`インターフェースの入力上限は 20,000 Token です。
    
2.  ファイル数、単一ファイルサイズ、またはページ数が上記の制限を超える場合、このタスクは「処理失敗」と判定されます。制限要件に従って調整した後、再度リクエストを開始する必要があります。
    

## 4. 使用例

### 画像メッセージをアップロード

**画像URLを使用**

メッセージを追加する際、画像URLを直接アップロードできます。

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
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

**Base64 画像エンコードを使用してローカル画像をアップロード**

ローカル画像をアップロードする、または画像を直接埋め込むには、Base64 画像エンコードを使用できます。

```python
import os
import requests
import json
import base64

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# 画像ファイルのパス
image_path = "path/to/your/image.jpg"

# Base64 を使用して画像をエンコード
with open(image_path, "rb") as image_file:
    base64_image = base64.b64encode(image_file.read()).decode("utf-8")


data = {
    "user_id": "memos_user_123",
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

### ドキュメントメッセージをアップロード

**ドキュメントURLを使用**

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "file",
                  "file": {
                    "file_data": "https://cdn.memtensor.com.cn/file/MemOS 2.pdf"
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

**Base64 画像エンコードを使用してローカルドキュメントをアップロード**

```python
import os
import requests
import json
import base64

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# ドキュメントファイルのパス
document_path = "path/to/your/document.pdf"

# ファイルを Base64 文字列に変換する関数
def file_to_base64(file_path):
    with open(file_path, "rb") as file:
        return base64.b64encode(file.read()).decode('utf-8')

# Base64 を使用してドキュメントをエンコード
base64_document = file_to_base64(document_path)

data = {
    "user_id": "memos_user_123",
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

print("結果：")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 完全な例

以下は完全な例で、ユーザーとアシスタントが異なるメディアタイプを含む対話メッセージをどのように追加するかを示しています：

```python
import os
import json
import requests

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "私はMemOSを研究しています。"
                }  # テキストメッセージ
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
                }  # 画像をアップロード
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "file",
                    "file": {
                        "file_data": "https://cdn.memtensor.com.cn/file/MemOS 2.pdf"
                    }
                }  # ドキュメントをアップロード
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
