---
title: カスタムタグTags
desc: メッセージ追加時に、ビジネス要件に応じてタグを使用します。
---
::warning 
注意
<br>
<br>

**[addMessageの際に先にtag listを渡す必要があります（詳細な API ドキュメントはこちら）](/api_docs/core/add_message)**
<br>

**[そうすることでsearchMemoryの際にタグを使用してフィルタリングできます（詳細な API ドキュメントはこちら）](/api_docs/core/search_memory)**
<br>
<br>

**この記事は機能説明に焦点を当てています。詳細なインターフェースのフィールドおよび制限については、上のテキストリンクをクリックして確認してください**

::

MemOS は各メモリに対してタグを自動生成しますが、これらのタグはお客様の業務で使用しているタグと完全には一致しない可能性があります。メッセージ追加時にカスタムタグのリストを渡すことができ、MemOS はお客様が提供したタグの意味に基づいて、メモリ内容に関連するタグを自動的に適用します。

:::note
カスタムタグはいつ使用しますか？<br>

MemOS に、プロダクトチーム既存のタグ体系を使用してメモリ内容を注釈させたい場合です。

これらのタグを適用して、構造化コンテンツを生成する必要がある場合です。
:::

## 1. タグ動作メカニズム

*   **タグの自動生成**：MemOS はメモリ処理時にセマンティクスを分析し、関連タグを自動生成して、後続の検索やフィルタリングに使用します。
    
*   **カスタムタグ**：メッセージ追加時に、`tags`フィールドを通じて一組のカスタムタグを渡し、候補タグ集合として使用できます。
    
*   **セマンティクスに基づくマッチング**：MemOS はメモリ内容と開発者が提供したタグリストに対して意味類似度を判定し、その中から一致するタグを選択して、システムが自動生成したタグとともにメモリの`tags`フィールドに書き込みます。
    

## 2. 使用例

:::note 
ヒント<br>
*  タグ内容は簡潔に保ちつつ、異なるカテゴリの意味を明確に区別できるようにし、識別とマッチングを容易にしてください。

*  同一プロジェクトの次元では統一されたリストを使用し、安易に置き換えないことで、検索とフィルタリングの一貫性を確保してください。
:::

## 3. メッセージを追加

```python
import os
import json
import requests

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1210",
    "messages": [
        {"role": "user","content": "今日の天気はどうですか？"},
        {"role": "assistant","content": "上海、12月10日、曇り、気温は8～12度です。"}
    ],
    "tags":["天気","曇り"],
    "async_mode":False
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

### メモリを検索

```python
import os
import json
import requests

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "query": "上海 天気"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

### 出力結果

```json
"memory_detail_list": [
  {
    "id": "9bc102cb-76d8-4a59-86d7-8fd1c4542407",
    "memory_key": "天気状況",
    "memory_value": "2025年12月10日、上海の天気は曇りで、気温は8度から12度の間です。",
    "memory_type": "WorkingMemory",
    "create_time": 1765376340736,
    "conversation_id": "1210",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "天気",
      "曇り",
      "気温"
    ],
    "update_time": 1765376340737,
    "relativity": 0.82587826
  }
]
```
