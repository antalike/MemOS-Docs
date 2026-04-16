---
title: Search Memory
desc: セマンティック検索とフィルタ機能により、MemOS は関連する記憶を呼び出します。
---

::warning
**[APIドキュメントを直接見る こちらをクリック](/api_docs/core/search_memory)**
<br>
<br>

**この記事は機能説明に焦点を当てており、詳細なインターフェースのフィールドおよび制限については、上部のテキストリンクをクリックして確認してください**
::

## 1. 検索記憶とは何ですか？

検索記憶とは、ユーザーが質問をした際に、MemOS が開発者によって事前定義されたフィルタ条件と組み合わせて、記憶ライブラリから最も関連性が高く、最も重要な記憶内容を呼び出すことを指します。モデルは回答を生成する際に、これらの呼び出された記憶を参照することで、より正確で、適切かつユーザーのコンテキストに合致した応答を返します。

::note
**&nbsp;なぜ検索記憶が必要なのですか？**
<div style="padding-left: 2em;">

*  最初からコンテキストを構築する必要がなく、正確で信頼できる記憶を直接取得できます；

*  フィルタ条件などの方法により、呼び出される記憶が常に現在の質問と高い関連性を持つことを保証します。
</div>
::


## 2. 主要パラメータ

*   **クエリ内容（query）**：ユーザーの質問内容であり、検索に使用される自然言語の質問または記述です。システムはセマンティックマッチングに基づいて関連記憶を検索します。

*   **記憶フィルタ（filter）**：JSON ベースの論理条件であり、agent、create_time、tags、info などのフィールドをフィルタして、記憶検索の範囲を絞り込みます；たとえば、「直近30日間の記憶」のみを検索します。

*   **関連性しきい値（relativity）**：関連性とは、呼び出された記憶とユーザーの質問内容とのセマンティックな一致度を指し、関連性が高いほど、その記憶は現在のユーザーの質問により関連しています。関連性しきい値は、呼び出される記憶の一致度を制約するために使用され、現在のシステムのデフォルト値は 0.45 であり、この値を下回る記憶はフィルタされます。


## 3. 動作原理

- **クエリ内容の書き換え**：MemOS は入力された自然言語クエリをクリーンアップし、セマンティック強化を行い、重要情報と検索意図を自動補完して、後続の検索精度を向上させます。

- **記憶の呼び出し**

  - **ハイブリッド検索とランキング**：システムは書き換え後のクエリに基づいて埋め込みベクトルを生成し、キーワード検索とベクトルセマンティック検索を組み合わせたハイブリッド戦略で候補記憶を呼び出し、候補記憶を統一的にランキングします。

  - **記憶のフィルタと選別**：論理条件と比較演算子に基づいて記憶を構造化フィルタし、記憶検索の範囲を絞り込みます；開発者が設定した関連性しきい値に従ってランキング後の記憶を選別し、呼び出し結果の品質を制御します。

  - **結果の重複排除**：呼び出された候補記憶に対して、ソース横断の重複排除とセマンティック集約処理を行います。

- **記憶の出力**：最終結果は設定された記憶件数上限に従って返され、600ms以内に応答および返却され、後続の推論と回答生成に使用されます。

上記のすべてのプロセスは、`search/memory`インターフェースを呼び出すだけでトリガーでき、ユーザーの記憶を手動で操作する必要はありません。


## 4. クイックスタート
::code-group
```python [Python (HTTP)]
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "国慶節に出かけたいので、行ったことのない都市と、泊まったことのないホテルブランドをおすすめしてください",
  "user_id": "memos_user_123",
  "conversation_id": "0928" # 現在の会話IDで、必須ではありません。入力すると、記憶を呼び出す際にその会話内の内容を優先的に考慮しますが、強制ヒットではなく、関連性の重みを高めるだけです。
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [出力]
# サンプル出力（理解しやすくするため、ここでは簡略化しています。参考用のみです）
{
  # 事実タイプの記憶
  memory_detail_list [
    {
      "memory_key": "夏休み広州旅行計画",
      "memory_value": "ユーザーは夏休み期間中に広州へ旅行する予定で、宿泊先として7 Days Inn を選択しました。",
      "conversation_id": "0610",
      "tags": [
        "旅行",
        "広州",
        "宿泊",
        "ホテル"
      ]
    }
  ],
  # 好みタイプの記憶
  preference_detail_list [
    {
      "preference_type": "implicit_preference",  #暗黙の好み
      "preference": "ユーザーはコストパフォーマンスの高いホテルを好む可能性があります。",
      "reasoning": "7 Days Inn は通常、手頃な価格で知られており、ユーザーが7 Days Inn を選択したことは、宿泊においてコストパフォーマンスの高い選択肢を好む傾向を示している可能性があります。ユーザーは予算制限や具体的なホテルの好みについて明示的には言及していませんが、提供された選択肢の中で7 Days Inn を選んだことは、価格と実用性を重視していることを反映している可能性があります。",
      "conversation_id": "0610"
    }
  ]
}
```
::

::note
&nbsp;ご注意ください。`user_id`は必須項目であり、現在は毎回の記憶検索で単一ユーザーを指定する必要があります。
::

## 5. Prompt への記憶組み立て例

::note
**記憶の組み立て**<br>

呼び出した記憶を使用するには一定のコツが必要です。以下は組み立て例です
::

```text
# Role
あなたは長期記憶能力を持つスマートアシスタントです (MemOS Assistant)。あなたの目標は、検索された記憶断片を組み合わせて、ユーザーに高度にパーソナライズされ、正確で、かつ論理的に厳密な回答を提供することです。

# System Context
- 現在時刻: 2026-01-06 15:05 (これを記憶の有効性を判断する基準としてください)

# Memory Data
以下は MemOS が検索した関連情報で、「事実」と「好み」に分かれています。
- **事実 (Facts)**：ユーザー属性、履歴会話記録、または第三者情報を含む可能性があります。
- **特に注意**：その中で '[assistant観点]'、'[モデル要約]' とマークされた内容は **AI の過去の推論** を表し、ユーザー本人の発言**ではありません**。
- **好み (Preferences)**：回答スタイル、形式、またはロジックに対するユーザーの明示的/暗黙的な要求です。

<memories>
  <facts>
    -[2025-12-26 21:45] ユーザーは夏休み期間中に広州へ旅行する予定で、宿泊先として7 Days Inn を選択しました。
    -[2025-12-26 14:26] ユーザーの名前はGraceです。
  </facts>

  <preferences>
    -[2026-01-04 20:41] [明示的な好み] ユーザーは南方への旅行が好きです
    -[2025-12-26 21:45] [暗黙の好み] ユーザーはコストパフォーマンスの高いホテルを好む可能性があります。
  </preferences>
</memories>

# Critical Protocol: Memory Safety (記憶安全プロトコル)
検索された記憶には、**AI 自身の推測**、**無関係なノイズ**、または**主体の誤り**が含まれている可能性があります。あなたは以下の**「4ステップ判定」**を厳格に実行しなければなりません。1ステップでも通過しなければ、その記憶を**破棄**してください：

1. **情報源真偽チェック (Source Verification)**：
   - **核心**：「ユーザー本人の発言」と「AI の推測」を区別すること。
   - 記憶に '[assistant観点]' などのラベルが付いている場合、それは AI の過去の**仮説**を表すにすぎず、ユーザーの絶対的な事実と見なしては**いけません**。
   - *反例*：記憶に '[assistant観点] ユーザーはマンゴーが大好き' と表示されている場合。ユーザーが言及していないなら、ユーザーがマンゴーを好きだと自発的に仮定しないでください。循環幻覚を防ぐためです。
   - **原則：AI の要約は参考用にすぎず、重みはユーザーの直接的な発言より大幅に低いです。**

2. **主語帰属チェック (Attribution Check)**：
   - 記憶中の行為主体は「ユーザー本人」ですか？
   - 記憶が**第三者**（たとえば「候補者」「面接者」「架空のキャラクター」「ケースデータ」）を記述している場合、その属性をユーザーに帰属させることを**厳禁**とします。

3. **強関連性チェック (Relevance Check)**：
   - 記憶は現在の 'Original Query' への回答に直接役立ちますか？
   - 記憶が単なるキーワード一致にすぎず（例：どちらも「コード」に言及している）、文脈が完全に異なる場合は、**必ず無視**してください。

4. **鮮度チェック (Freshness Check)**：
   - 記憶内容はユーザーの最新意図と矛盾していませんか？現在の 'Original Query' を最高の事実基準としてください。

# Instructions
1. **精査**：まず '<facts>' を読み、「4ステップ判定」を実行し、ノイズと信頼できない AI 観点を取り除いてください。
2. **実行**：
   - スクリーニングを通過した記憶のみを使用して背景を補完してください。
   - '<preferences>' のスタイル要件を厳格に守ってください。
3. **出力**：質問に直接答えてください。「記憶ライブラリ」「検索」または「AI 観点」などのシステム内部用語への言及は**厳禁**です。

# Original Query
国慶節に出かけたいので、行ったことのない都市と、泊まったことのないホテルブランドをおすすめしてください

```

## 6. その他の使用方法
### ユーザー全体プロファイルの取得

自分で開発したアプリケーションに対してユーザー分析を行う必要がある場合や、AI アプリケーション内でユーザーにリアルタイムで彼らの「個人の重要な印象」を表示したい場合は、MemOS を呼び出してユーザーの記憶をグローバル検索し、大規模モデルによるユーザーのパーソナライズされたプロファイル生成を支援できます。この場合、`conversation_id`を入力しなくても構いません～

以下の例のように、すでに[メッセージを追加](/memos_cloud/mem_operations/add_message)を試し、ユーザー`memos_user_123`の履歴会話メッセージを追加している場合、この例をワンクリックでコピーしてユーザー記憶を検索できます。

::code-group
```python [Python (HTTP)]
import os
import json
import requests

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# headers と base URL
headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ['MEMOS_BASE_URL']

# 人物プロファイルを直接質問し、query とする
query_text = "私の人物キーワードは何ですか？"

data = {
    "user_id": "memos_user_123",
    "query": query_text,
}

# /search/memory を呼び出して関連記憶を検索
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [出力]
# サンプル出力（理解しやすくするため、ここでは簡略化しています。参考用のみです）

{
  # 事実タイプの記憶
  memory_detail_list [
    {
      "memory_key": "AIに支援してほしい事項",
      "memory_value": "ユーザーはAIに日常の学習計画の立案、映画や書籍の推薦、および気分面での付き添いをしてほしいと望んでいます。",
      "conversation_id": "0610",
      "tags": [
        "支援",
        "学習計画",
        "推薦",
        "付き添い"
      ]
    },
    {
      "memory_key": "AIに提供してほしい支援タイプ",
      "memory_value": "ユーザーはAIにアドバイス、情報検索、およびインスピレーションの提供を望んでいます。",
      "conversation_id": "0610",
      "tags": [
        "AI",
        "支援",
        "タイプ"
      ]
    }
  ]
}
```
::


### 検索する記憶範囲の正確なフィルタ

MemOS は強力な記憶フィルタ機能を提供しており、開発者が検索する記憶に対して正確なフィルタを行えるようにします。この機能は、記憶の作成時間、タグ、メタ情報など、記憶の特定の特徴に基づいて検索する必要がある場合に特に有用です。

::note
以下は記憶フィルタを使用する例です。ユーザーが今年の「読書」に関するすべての「会話」を年末総括したいと仮定すると、すべてのタグに"読書"を含み、作成時間が2025年で、かつシーンが「会話」である記憶をフィルタすることで実現できます：
::

::code-group
```python [Python (HTTP)]
import os
import json
import requests

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# headers と base URL
headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ['MEMOS_BASE_URL']

query_text = "私の読書年末総括"

data = {
    "user_id": "memos_user_123",
    "query": query_text,
    "filter": {
        "and": [
            {"tags": {"contains": "読書"}}, # MemOS が抽出したタグ
            {"create_time": {"gte": "2025-01-01"}}, # MemOS が記憶を作成した時間
            {"create_time": {"gte": "2025-12-31"}}, # MemOS が記憶を作成した時間
            {"info":{"scene":"chat"}} #add message 時に開発者がカスタムで渡す
        ]
    } # filter フィールドを渡すことで、すべてのタグに"読書"を含み、作成時間が2025年で、かつシーンが「会話」である記憶をフィルタします。
}

# /search/memory を呼び出して関連記憶を検索
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
::

::note
フィルタ内のその他の選別オプションについては、[記憶フィルタ](/memos_cloud/features/basic/filters)を参照してください。
::

### Token が少ない記憶呼び出し戦略

モデルがより高品質で、より Token を節約できる記憶内容を取得し、それによってモデルに注入する Token 消費数を減らすのを支援するために、MemOS は開発者がカスタムの**関連性しきい値（relativity）**と**呼び出す記憶件数上限（memory_limit_numberなど）**を渡すことをサポートしています。

以下のように、開発者が`relativity = 0.8` `memory_limit_number = 9`を渡すと、最終的に9件未満で、かつ関連性がいずれも0.8を上回る記憶が返されます。

```python
data = {
    "user_id": "memos_user_123",
    "query": "5日間の成都旅行を計画してください。",
    "relativity": 0.8, # 関連性しきい値。渡さない場合はデフォルトで0となり、返される記憶の関連性を制限することを示します。
    "memory_limit_number" = 9 # 呼び出す記憶の上限件数。渡さない場合はデフォルトで9となり、デフォルトで最も関連性の高い記憶を9件呼び出すことを示します。
}
```
ご注意ください。現在、`relativity`は事実記憶と好み記憶に対してのみ有効です。

## 7. その他の機能

::note
&nbsp;API フィールド、形式などの情報の完全な一覧については、[Search Memoryインターフェースドキュメント](/api_docs/core/search_memory)を参照してください。
::

| **機能**       | **関連フィールド**                                            | **説明**                                                     |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| 好み記憶を呼び出す   | `include_preference`<br><span style="line-height:0.6;">&nbsp;</span><br>`preference_limit_number`   | 好み記憶は MemOS がユーザーの履歴メッセージ分析に基づいて生成したユーザー好み情報です。有効化すると、検索結果でユーザーの好み記憶を呼び出せます。 |
| ツール記憶を呼び出す   | `include_tool_memory`<br><span style="line-height:0.6;">&nbsp;</span><br>`tool_memory_limit_number` | ツール記憶は MemOS が追加済みのツール呼び出し情報を分析した後に生成する記憶です。有効化すると、検索結果でツール記憶を呼び出せます。詳細は[ツール呼び出し](/memos_cloud/features/advanced/tool_calling)を参照してください。 |
| スキルを呼び出す   | `include_skill`<br><span style="line-height:0.6;">&nbsp;</span><br>`skill_limit_number` | スキルは MemOS がユーザー記憶に基づいて生成する、Agent が再利用可能な実行能力です。有効化すると、検索結果でスキルを呼び出せます。詳細は[スキル](/memos_cloud/features/advanced/skill)を参照してください。 |
| 指定ナレッジベースを検索 | `knowledgebase_ids`                                 | 今回の検索でアクセス可能なプロジェクト関連ナレッジベース範囲を指定するために使用されます。開発者はこれにより、きめ細かな権限制御を実現し、異なるエンドユーザーがアクセス可能なナレッジベース集合を柔軟に定義できます。詳細は[ナレッジベース](/memos_cloud/features/advanced/knowledge_base)を参照してください。     |
