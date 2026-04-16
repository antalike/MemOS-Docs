---
title: Add Feedback
desc: ユーザーの自然言語フィードバックを追加すると、MemOS が自動的にメモリを更新します。
---

::warning
**[API ドキュメントを直接確認するにはここをクリックしてください](/api_docs/core/add_feedback)** 
<br>
<br>

**この記事は機能説明に焦点を当てています。詳細なインターフェース項目および制限については、上のテキストリンクをクリックして確認してください**
::

## 1. いつフィードバックを追加するか？

::note
MemOS のフィードバックメカニズム（Feedback）は、モデル回答に対するユーザーの自然言語フィードバックを受け取り、開発者が特定のメモリ項目を手動で特定することなく、メモリ内容の自動修正と更新を駆動するために使用されます。<br>
独立した addFeedback インターフェースを通じて、**手動保守コストの削減 + メモリ精度の向上 + 継続的な自己修正のサポート** という目標を達成します。
::

以下の表のとおり、特定のメモリを修正する方法とは異なり、自然言語フィードバックメカニズムは **実際の業務利用パス** と **非技術ユーザーの操作** により適しています。

| 比較観点       | 自然言語フィードバック           | 特定箇所のメモリ修正        |
| ---------- | ---------------- | ------------------ |
| 使用方法       | 自然言語で問題または修正情報を記述する   | 特定の memory を直接指定して編集する |
| ユーザーのハードル       | 低く、非技術ユーザーに適している        | 高く、通常は開発者または管理者が操作する    |
| システムの関与度      | システムが自動解析・特定・関連更新を行う   | 手動主導で更新する             |
| 更新範囲       | 複数の関連メモリに影響する可能性がある       | 通常は単一のメモリのみに影響する          |
| 適用シーン       | 対話の訂正、知識の陳腐化、業務ルールの変更 | 正確な改訂、構造化メンテナンス         |

## 2. 主要パラメータ

*   **フィードバック内容（feedback\_content）**：モデル回答に対するユーザーの自然言語フィードバック内容であり、メモリ更新の要件を理解するために使用されます。

*   **知識ベース範囲（allow_knowledgebase\_ids）**：ユーザーの自然言語フィードバック内容が指す知識ベースであり、変更可能な [知識ベースメモリ](/memos_cloud/features/advanced/knowledge_base) の範囲を限定するために使用されます。

*   **会話識別子（conversation\_id）**：ユーザーの自然言語フィードバック内容に関連付けられた一意の会話識別子であり、現在のフィードバック内容のコンテキスト情報を関連付けるために使用されます。

## 3. 動作原理

以下の図のとおり、Chabot シーンを例にすると、ユーザーはモデル回答内容の下にある「フィードバックで誤りや漏れを指摘」ボタンをクリックし、今回の回答に対するフィードバックを入力して送信します。
![image.png](https://cdn.memtensor.com.cn/img/1770716602140_1z3yi5_compressed.png)

フィードバック内容に基づき、バックエンドは MemOS `add/feedback` インターフェース呼び出しを 1 回完了し、メモリ更新をトリガーします。ユーザーのメモリを手動で操作する必要はありません。

- **有効性分析**：ユーザーがフィードバックを送信した後、MemOS は現在の会話コンテキストを組み合わせてフィードバック内容を解析し、それが有効な情報であるか、対話内容に関連しているかを判断し、それによってメモリ更新フローに入るかどうかを決定します。

- **更新タイプの識別**：MemOS は、フィードバックによって駆動されるメモリ更新リクエストを、キーワード置換とセマンティック更新の 2 種類に自動分類し、フィードバック内容とコンテキストの意味に基づいて判定を完了します。

- **メモリ更新**：分類結果に基づいてメモリ更新操作を実行し、新しいメモリを書き込み、衝突・古い・または修正された既存メモリを更新または上書きします。
  - **キーワード置換**：対象キーワードを含む関連メモリ項目を検索し、特定箇所を更新します；
  - **セマンティック更新**：ユーザーフィードバックに基づいて新しいセマンティックメモリを生成し、関連メモリ内容をリコールした後にマージまたは置換更新を行います。


## 4. 使用例

### 知識ベースメモリのセマンティック更新

企業では、企業ポリシー/知識が更新されたにもかかわらず、知識ベースの更新が適時に行われない問題がよく発生します。最もシンプルなインタラクション方式で、知識ベースを常に最新に保ってみましょう。

::note{icon="websymbol:chat"}
&nbsp;会話 A：2025-12-12 に発生<br>
<div style="padding-left: 2em;">
財務主管は会話の中で、【オフィス系ソフトウェアの購入上限は 600 元であり、800 元ではない】とフィードバックしました。
</div>
::

```python
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1212",
    "feedback_content": "オフィス系ソフトウェアの購入上限は600元であり、800元ではありません。",
    "allow_knowledgebase_ids":["idxxxxx"]  # 上で作成した知識ベース ID に置き換えてください
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
&nbsp;会話 A：2025-12-12 に発生<br>
<div style="padding-left: 2em;">
任意の他のユーザーが【ソフトウェア経費精算制度】を検索すると、新たに追加された高重みメモリ【オフィス系ソフトウェアの購入上限は600元であり、800元ではない】を 1 件取得します。
</div>
::

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
    "query": "ソフトウェア購入の経費精算上限を調べてください。",
    "knowledgebase_ids":["idxxxxx"]  # 上で作成した知識ベース ID に置き換えてください
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))


# JSON 出力を整形
json_res = res.json()
print(json.dumps(json_res, indent=2, ensure_ascii=False))
```

出力結果は以下のとおりです（簡略版）：

```python
"memory_detail_list": [
  {
    "id": "8a4f3d2e-c417-4e53-bc25-54451abd5ac8",
    "memory_key": "ソフトウェア購入経費精算制度（試行版）",
    "memory_value": "この制度は、会社の各種ソフトウェアの購入および経費精算プロセスを標準化することを目的とし、すべてのソフトウェア購入が特定カテゴリの購入金額上限に従うことを求めます。デザイン系ソフトウェアの購入上限は1000元で、グラフィックデザイン、動画編集、プロトタイプ設計に適用され、例としてPhotoshopとPremiereがあります。コード/開発系ソフトウェアの購入上限は1500元で、適用範囲にはIDEと開発フレームワークが含まれ、例としてPyCharmとVisual Studioがあります。オフィス系ソフトウェアの購入上限は800元で、文書編集と表計算処理に適用され、例としてOfficeスイートとWPSがあります。データ分析系ソフトウェアの購入上限は1200元で、適用範囲はデータ統計と可視化であり、例としてTableauとPower BIがあります。セキュリティおよび保護系ソフトウェアの購入上限は1000元で、ウイルス対策とファイアウォールに適用されます。コラボレーション/プロジェクト管理系ソフトウェアの購入上限は900元で、例としてJiraとSlackがあります。特殊業界ソフトウェアの購入上限は2000元で、個別承認が必要です。すべての購入は会社の予算および情報セキュリティ要件に適合しなければならず、上限を超えるソフトウェアは業務説明を提供し、個別承認を申請する必要があります。",
    "memory_type": "LongTermMemory",
    "create_time": 1765525947718,
    "conversation_id": "default_session",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "ソフトウェア購入",
      "経費精算制度",
      "承認フロー",
      "予算",
      "情報セキュリティ",
      "mode:fine",
      "multimodal:file"
    ],
    "update_time": 1765525947720,
    "relativity": 0.8931847
  },
  {
    "id": "a72a04d1-d7ba-4ebd-9410-0097bfa6c20d",
    "memory_key": "オフィスソフトウェア購入上限",
    "memory_value": "ユーザーは、オフィス系ソフトウェアの購入上限は600元であり、800元ではないことを確認しました。",
    "memory_type": "WorkingMemory",
    "create_time": 1765531700539,
    "conversation_id": "1212",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "購入",
      "オフィスソフトウェア",
      "予算"
    ],
    "update_time": 1765531700540,
    "relativity": 0.7196722
  }
]
```

[コンソール-知識ベース](https://memos-dashboard.openmem.net/knowledgeBase/) では、自然言語インタラクションを通じて知識ベースメモリを修正または補完したすべての詳細が知識ベース内に表示されます。

![image.png](https://cdn.memtensor.com.cn/img/1765970178683_5tuxe4_compressed.png)


### キーワード置換メモリ

以下に示すとおり、セマンティックメモリの更新に加えて、MemOS は記述によって特定の語彙を置換修正することもサポートしています。このシーンでは会話識別子（conversation_id）を入力する必要はありません。

```python
data = {
    "user_id": "memos_user_123",
    "feedback_content": "今後は私の名前が変わりました。ユーザー1号を一律でユーザー2号に置き換えてください",
    "allow_knowledgebase_ids": ["123", "456"]
  }
```

