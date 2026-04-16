---
title: ツール呼び出しToolCall
desc: ツール呼び出し情報を追加し、ツール呼び出しの意思決定、実行結果およびその使用軌跡を統一的に MemOS の記憶に組み込みます。
---

::warning 
注意
<br>
<br>

**[まず addMessage の際にツール記憶を渡す必要があります（詳細な API ドキュメントはこちら）](/api_docs/core/add_message)**
<br>

**[そうすることで searchMemory の際にツール記憶を検索できます（詳細な API ドキュメントはこちら）](/api_docs/core/search_memory)**
<br>
<br>

**[本稿は機能説明に焦点を当てており、詳細なインターフェース項目および制限については上記のテキストリンクをクリックしてご確認ください]**

::

## 1. いつ使用するか

お使いの Agent が外部情報を取得するためにツール（function / tool）を使用する必要があり、これらの「ツール呼び出しのコンテキストと結果」を MemOS にまとめて理解・関連付け・蓄積させて検索可能な記憶にしたい場合、このメッセージ構造の使用が適しています。

## 2. 仕組み

Step1：ツール呼び出し情報を追加

`assistant` メッセージ： `tool_calls` は、モデルがあるツールを呼び出すと決定した動作とそのパラメータを記述します。

`tool` メッセージ：実際のツール返却結果を保持し、 `tool_call_id` を通じて対応する `tool_calls` と正確に関連付けます。

<br>

Step2：MemOS がツール関連記憶を処理

*  **ツール情報（Tool Schema）**：MemOS は、ツール情報の構造化管理と動的更新をサポートし、異なるツールの記述方法を統一することで、モデルがプロンプト内にツールの詳細をハードコードすることなく、効率的にツール検索・理解・発見を行えるようにします。

*  **軌跡記憶（Tool Trajectory Memory）**：MemOS は、ツール使用過程における重要な軌跡を抽出・保存します。これには「どのようなコンテキストでどのツールを呼び出したか、どのようなパラメータを使用したか、どのような結果が返ったか」が含まれます。これらの軌跡は後続の対話で検索・再利用でき、モデルがツール使用パターンをより安定して再現し、重複した試行や呼び出しエラーを減らすのに役立ちます。

## 3. 使用例

API フィールド、形式などの情報の完全な一覧については、[Add Message インターフェースドキュメント](/api_docs/core/add_message) を参照し、ツール呼び出し情報を追加する方法をご確認ください。

### ツール呼び出し情報を追加

::note{icon="websymbol:chat"}
&nbsp;会話 A：ユーザーが対話の中で【北京の天気はどうですか】と尋ね、アシスタントが【天気ツール】を呼び出し、天気ツールが【北京、気温7°C、曇り】という結果を得ます。
::

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# tool_call を含むメッセージシーケンス
tool_schema = [{
    "name": "get_weather",
    "description": "Get current weather information for a given location",
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City name, e.g. Beijing"
            }
        },
        "required": [
            "location"
        ]
    }
}]

data = {
    "user_id": "memos_user_123",
    "conversation_id": "demo-conv-id",
    "messages": [
        {
            "role": "system",
            "content": f"""You are an assistant that can call tools.
When a user's request can be fulfilled by a tool, you MUST call the appropriate tool.
<tool_schema>
{json.dumps(tool_schema, indent=2, ensure_ascii=False)}
</tool_schema>
"""
        },
        {"role": "user", "content": "What's the weather like in Beijing right now?"},
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_123",
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "arguments": json.dumps({"location": "Beijing"}),
                    },
                }
            ],
        },
        {
            "role": "tool",
            "tool_call_id": "call_123",
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(
                        {"location": "Beijing", "temperature": "7°C", "condition": "Cloudy"}
                    ),
                }
            ],
        },
    ],
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### ツール記憶を検索

::note{icon="websymbol:chat"}
&nbsp;会話 B：新しい会話の中で、ユーザーが【北京では何を着るのが適していますか】と尋ねると、MemOS は過去の【天気ツール呼び出し】に関する関連ツール記憶を呼び戻すことができ、モデルはその後ツール記憶を利用して、ツール使用の正確性と有効性を高めることができます。
::

```python
import os
import requests
import json

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"


data = {
    "user_id": "memos_user_123",
    "conversation_id": "0928",
    "query": "北京では何を着るのが適していますか",
    "memory_limit_number": 10,
    "include_preference": True,
    "preference_limit_number": 10,
    "include_tool_memory":True,
    "tool_memory_limit_number":10,
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 出力結果

```python
"tool_memory_detail_list": [
   {
    "id": "7ec50fd8-19ec-42a2-a7c7-ce3cebdb70cf",
    "tool_type": "ToolSchemaMemory",
    "tool_value": {"name": "get_weather", "description": "Get current weather information for a given location", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "City name, e.g. Beijing"}}, "required": ["location"]}},
    "create_time": 1766494806624,
    "conversation_id": "demo-conv-id",
    "status": "activated",
    "update_time": 1766494806625,
    "relativity": 0.44700349055540967
  },
  {
    "id": "4b208707-991a-481c-9dd6-c7f0577ff371",
    "tool_type": "ToolTrajectoryMemory",
    "tool_value": "User asked about the current weather in Beijing -> Tool 'get_weather' was called with the parameter 'location' set to 'Beijing' -> The tool returned the weather information: temperature is 7°C and condition is Cloudy.",
    "tool_used_status": [
      {
        "used_tool": "get_weather",
        "error_type": "",
        "success_rate": 1.0,
        "tool_experience": "The 'get_weather' tool requires a valid location parameter and provides current weather information for that location." #新規追加：現在の軌跡における当該ツールの経験。
      }
    ],
    "create_time": 1768390489180,
    "conversation_id": "demo-conv-id",
    "status": "activated",
    "update_time": 1768390489181,
    "relativity": 0.47883897395535013,
    "experience": "when encountering weather inquiry tasks, then ensure to call the 'get_weather' tool with the correct location parameter." #新規追加：タスク完了を導く全体的な経験としての、軌跡全体の手続き的経験。
  }
]
```
