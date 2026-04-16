---
title: 記憶の削除
desc: MemOS から記憶を削除します。一括削除をサポートします。
---

::warning
**[APIドキュメントを直接見るにはここをクリック](/api_docs/core/delete_memory)**
<br>
<br>

**本文は機能説明に焦点を当てています。詳細なインターフェースのフィールドおよび制限については、上記のテキストリンクをクリックして確認してください**
::

## 1. 主要パラメータ

*   **記憶 ID リスト（memory\_ids[]）**：MemOS に保存された各記憶には一意の識別子が対応しており、リスト形式で渡すことをサポートし、指定した1件または複数件の記憶を正確に削除するために使用されます。

*   **ユーザー ID（user_id）**：特定ユーザーのすべての記憶を削除するために使用されます。このフィールドを渡すと、そのユーザーに関連付けられたすべての記憶（事実、嗜好、スキル、ツール記憶を含む）が削除されます。

:::note
**削除対象の記憶の記憶IDを取得する方法**
<br>
<br>
記憶の検索（`search/memory`）および記憶の取得（`get/memory`）時に、返却結果内の各記憶には一意の `id` フィールドが含まれており、その記憶の一意識別子として使用されます。  <br>
ある記憶が期限切れになった、または期待に合わないことが判明した場合、`id` を直接取得し、`memory_ids[]` パラメータとして `delete/memory` インターフェースに渡すことで、対応する記憶エントリを削除できます。
:::


## 2. クイックスタート

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "memory_ids":["4a50618f-797d-4c3b-b914-94d7d1246c8d"],  # 実際の記憶 ID に置き換えてください
    # "user_id": "12345" 特定ユーザーのすべての記憶を削除する必要がある場合は、実際のユーザー ID に置き換えてください
    ## 注意、user_id と memory_ids[] は2つの異なるフィルタ条件であり、同時に使用するとエラーになります。
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/delete/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

::note
&nbsp;削除に成功したか知りたいですか？
上記のコードをワンクリックでコピーして実行し、再度[記憶を検索](/memos_cloud/mem_operations/search_memory)して、記憶が正常に削除されたか確認してください。
::
