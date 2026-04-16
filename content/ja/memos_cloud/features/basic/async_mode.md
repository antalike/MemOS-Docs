---
title: 非同期モードAsyncMode
desc: メッセージ追加時に非同期モードを使用すると、インターフェースリクエストは即座に返され、実際の処理はMemOSのバックグラウンドでキューに入り完了します。
---
::warning
**[本記事は【記憶追加-addMessageインターフェース】内の非同期モードについて詳しく紹介するものです。こちらをクリックして詳細な API ドキュメントを直接確認できます](/api_docs/core/add_message)**
::

:::note
`async_mode`パラメータは現在デフォルトで`true`です。記憶追加操作はデフォルトで非同期処理され、バックグラウンド実行を待つためにキューに入り、処理完了を待ってからレスポンスを返すのではありません。
:::
## 1. 非同期モードを使用する

### 処理フロー

`async_mode`パラメータが`true`に設定されている場合、API は即座にレスポンスを返し、バックグラウンドで記憶処理をキューに入れます：

```json
{
  "code": 0,
  "data": {
    "success": true,
    "task_id": "c464e17e-f2ff-4e9a-a2c2-41cc55ab43b9",
    "status": "running"
  },
  "message": "ok"
}
```

非同期モードでは、記憶の書き込みは「粗加工」と「精加工」の2つの段階に分かれます。システムはまず今回のメッセージに対してミリ秒レベルの粗加工を行い、次の対話ターンですぐに高速検索できるようにします；
<br>
その後、バックグラウンドで秒レベル以上の精加工を継続して行い、記憶品質を向上させます。処理進捗は [get/status](/api_docs/message/get_status) インターフェースで確認できます：粗加工段階のタスク状態は「進行中」で、精加工完了後に状態は「完了」に更新されます。

```json
"memory_detail_list": [
  {
    "id": "c436a738-eec9-4010-b65d-dc9c135d3a37",
    "memory_key": "user: [09:44 AM on 10 December, 2025 UTC]: 私は夏休みに広州へ旅行する予定を立てていますが、宿泊にはどのチェーンホテルを選べますか",
    "memory_value": "user: [09:44 AM on 10 December, 2025 UTC]: 私は夏休みに広州へ旅行する予定を立てていますが、宿泊にはどのチェーンホテルを選べますか？\nassistant: [09:44 AM on 10 December, 2025 UTC]: 【7 Days、Ji Hotel、Hilton】などを検討できます\nuser: [09:44 AM on 10 December, 2025 UTC]: 7 Daysを選びます\nassistant: [09:44 AM on 10 December, 2025 UTC]: かしこまりました。他にご質問があればまたお聞きください。\n",
    "memory_type": "WorkingMemory",
    "create_time": 1765359875901,
    "update_time": 1765359875902,
    "conversation_id": "0610",
    "status": "activated",
    "confidence": 0.99,
    "relativity": 0.05407696,
    "tags": ["mode:fast"]
  }
]
```

[get/status](/api_docs/message/get_status)インターフェースを通じて、非同期タスクの状態を取得します：

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "task_id": "c464e17e-f2ff-4e9a-a2c2-41cc55ab43b9"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/get/status"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

### いつ非同期モードを使用するか

*   **インターフェース応答遅延を低減する**：ユーザーは待機する必要がなく、アプリ内で継続して記憶を使用できます；
    
*   **記憶を一括追加する**：大量のデータを同時に処理し、アプリのブロックを回避します；
    

*   **バックグラウンドタスク処理**：時間のかかる記憶処理操作をバックグラウンドに置き、システムの並行処理能力を向上させます。
    

:::note
注意<br>
メッセージにマルチモーダルコンテンツが含まれる場合、ファイル記憶の加工時間が長いため、渡した`async_mode`フィールドは無効になります。この場合、デフォルトで「非同期モード」が使用されます。`get/status`インターフェースを通じてファイル記憶の処理進捗を確認できます。
:::

## 2. 同期モードを使用する

### 処理フロー

`async_mode`パラメータが`false`に設定されている場合、API は記憶処理完了後に結果を返します：

```json
{
  "code": 0,
  "data": {
    "success": true,
    "task_id": "c464e17e-f2ff-4e9a-a2c2-41cc55ab43b9",
    "status": "completed"
  },
  "message": "ok"
}
```

このとき記憶を検索すると、完全に処理済みの記憶を検索できます：

```json
"memory_detail_list":[
  {
    "memory_key": "夏休みの広州旅行計画",
    "memory_value": "ユーザーは夏休み期間中に広州へ旅行する計画があり、宿泊オプションとして7 Daysチェーンホテルを選択しました。",
    "conversation_id": "0610",
    "tags": [
      "旅行",
      "広州",
      "宿泊",
      "ホテル"
    ]
  }
],
"preference_detail_list":[
  {
    "preference_type": "implicit_preference",
    "preference": "ユーザーはコストパフォーマンスの高いホテルを好む可能性があります。",
    "reasoning": "7 Daysホテルは通常、経済的で手頃な価格で知られており、ユーザーが7 Daysホテルを選んだことは、宿泊面でコストパフォーマンスの高い選択肢を好む傾向を示している可能性があります。ユーザーは予算制約や具体的なホテル嗜好について明確には言及していませんが、提示された選択肢の中から7 Daysを選んだことは、価格と実用性を重視していることを反映している可能性があります。",
    "conversation_id": "0610"
  }
]
```

### いつ同期モードを使用するか

*   **デバッグと開発段階**：記憶処理後の結果を直接確認でき、記憶検索のデバッグに便利です；
    
*   **即時クエリ**：API呼び出しの返却時に記憶がすでに作成または更新されたことを確認する必要がある場合。たとえば、パフォーマンステスト、機能検証など
    
*   **小規模操作**：データ量が少なく、遅延の影響が大きくない場合は、同期モードを使用できます。
    

### 重要な説明

*   非同期処理のデフォルト動作は現在 `async_mode=true` です。
    
*   同期モードが必要な場合は、メッセージ追加時に `async_mode=false` を設定してください。
