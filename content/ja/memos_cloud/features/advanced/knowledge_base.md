---
title: ナレッジベースKnowledgebase
desc: プロジェクトに関連付けられたナレッジベースを作成し、検索時に記憶とナレッジベースを組み合わせます。
---
::warning
**[この記事は【MemOSナレッジベース】機能の詳細な紹介です。こちらをクリックして詳細な API ドキュメントを直接確認できます](/api_docs/knowledge/create_kb)**
::

## 1. MemOS vs RAG

RAG（検索拡張生成）に基づくアプリケーションは、クエリと問題の意味的に類似した情報の検索に長けているため、数万文字の知識の中から、関連性が高く正確な内容を素早く検索できます。しかし、知識自体はステートレスであり、毎回のクエリは「一回限り」で、特定のユーザーやコンテキストへの理解が不足しています。

MemOS は「記憶+ナレッジベース」を利用して、現在の問題を過去の記憶と関連付け、「背景を持った」前提で知識を検索して使用できます。これにより、AI アプリケーションはより正確に資料を検索できるだけでなく、背景をより理解し、ユーザーをより深く理解でき、さらにインタラクションの過程で自動的に新しい記憶として蓄積され、継続的に知識体系を補完し改善します。


::note 
**「記憶+ナレッジベース」で、MemOS は何ができますか？** <br>
* **越境ECカスタマーサポート**——すべての顧客に専用メールで返信
* **プライベートドメイン販売者プッシュ**——過去の記憶を組み合わせて、高粘着顧客の心をつかむ
* **独立サイト AI 購買ガイド （Chatbot）**——Web サイト右下に接続し、能動的におすすめを開始
* **企業アシスタント**——企業知識を理解しつつ、あなたの個人業務にも参加
* **...**

👉 実際に試してみたい場合：[n8n + MemOS を使用して、SHEIN 向け販売Agentを構築する](https://mp.weixin.qq.com/s/qm4Av7KiLudaKfxNTC3Eng)。
::


以下は 2 つの実際のシナリオで、MemOS と RAG の 2 つのソリューションを比較します：


**ショッピングカスタマーサポートボット**

**背景**

```python
DAY 1 ユーザーの問い合わせ：うちには生後 3 か月のゴールデンレトリバーがいるのですが、どのドッグフードが良いですか？そういえば、鶏肉味は食べません。
DAY 1 ユーザーはアシスタントのおすすめのもとで A ラム肉子犬用ドッグフードを購入しました。
DAY 10 ユーザーの問い合わせ：このドッグフードを食べると犬が下痢をします。別のドッグフードに変えたいです。
```

**RAG 方式**

```python
# ユーザーの発話に基づいて「子犬用ドッグフードおすすめ」「下痢」に関連する断片を検索するが、「ユーザーの犬は鶏肉味を食べない」は想起できない。検索された知識：

1. ドッグフードで下痢する一般的な原因の説明：低アレルゲンドッグフードに変更できます。
2. 低アレルゲン子犬用ドッグフードのおすすめ：B（鶏肉）、C（サーモン）。

# 🤦 ショッピングアシスタント：今下痢が出ている場合は、B（鶏肉味）、C（サーモン）を試してみてください。
```

**MemOS 方式**

```python
# ユーザーの発話に基づいて関連記憶を検索し、ユーザーの家の犬が生後 3 か月のゴールデンレトリバーの子犬で、鶏肉が好きではなく、下痢しない子犬用ドッグフードをおすすめする必要があることを認識する。検索された記憶：

1. ユーザーの家には生後 3 か月のゴールデンレトリバーが 1 匹いて、体重は約 12 斤。
2. ユーザーの犬は鶏肉味のドッグフードを食べない。
3. ユーザーが以前購入したのはラム肉子犬用ドッグフード。
4. ドッグフードで下痢する一般的な原因の説明：低アレルゲンドッグフードに変更できます。
5. 低アレルゲン子犬用ドッグフードのおすすめ：B（鶏肉）、C（サーモン）。

# ✅ ショッピングアシスタント：以前、犬は生後 3 か月のゴールデンレトリバーで、しかも鶏肉味を食べられないとおっしゃっていましたので、鶏肉味の子犬用フードはすべて除外しました。以前購入されたラム肉 + サーモン子犬用フードがあり、今下痢が出ている場合は、より穏やかな C（サーモン子犬用低アレルゲン）を試してみてください。
```
<br>
<br>

**企業ナレッジベースアシスタント**

**背景**

```python
DAY 1 従業員の問い合わせ：私のパソコンは MacBook Pro 13インチ、Intel チップです。社内ネットワークプロキシはどうインストールしますか？
DAY 1 アシスタントは Intel バージョンのインストール手順を提供しました。
DAY 20 従業員の問い合わせ：社内ネットワークプロキシが開かなくなりました。どのバージョンを再インストールすればよいですか？
```

**RAG 方式**

```python
# ユーザーの発話に基づいて「社内ネットワークプロキシ」「開かない」に関連する内容を検索するが、「ユーザーのデバイスモデル」は想起できない。検索された知識：

1. 社内ネットワークプロキシの一般的な障害切り分け
2. M1/M2（ARM）バージョンの社内ネットワークプロキシインストール手順
3. Windows 社内ネットワークプロキシクライアントのインストール手順
4. ネットワーク接続と証明書の問題
5. 汎用 FAQ

# 🤦 ナレッジベースアシスタント：最新の Mac M1/M2（ARM）バージョンまたは Windows の社内ネットワークプロキシクライアントを再ダウンロードしてインストールしてみてください。以下はインストール手順です：...
```

**MemOS 方式**

```python
# 従業員の問題に基づいて「社内ネットワークプロキシ」「開かない」に関連する記憶を検索し、その従業員のデバイスモデルを自動識別する。検索された記憶：

1. ユーザーは 20 日前に会社の社内ネットワークプロキシをインストールしており、彼のデバイスは MacBook Pro 13（Intel）
2. 社内ネットワークプロキシの一般的な障害切り分け
3. Intel バージョンの社内ネットワークプロキシインストール手順

# ✅ ナレッジベースアシスタント：お使いの端末は Intel チップの MacBook Pro ですので、Intel バージョンの社内ネットワークプロキシクライアントを再インストールすることをおすすめします。以下は Intel 版のダウンロードリンクとインストール手順です：...
```


## 2. 動作原理
<img src="https://cdn.memtensor.com.cn/img/1769591271771_tg0p0l_compressed.png">

上図は、エンドユーザー、あなたが構築した AI Agent、そして MemOS の完全なインタラクションフローを示しています：

1. `create/knowledgebase`インターフェースを呼び出す / コンソールで「ナレッジベースを追加」をクリックして、MemOS ナレッジベースを作成します。
2. `add/knowledgebase-file`インターフェースを呼び出す / コンソールで「ドキュメントをアップロード」をクリックして、ナレッジベースドキュメントを対応する MemOS ナレッジベースにアップロードします。
3. MemOS はリクエストを受信すると、順に以下の処理を完了して、ナレッジベース記憶を生成します：
<br>    a. ドキュメント検証：認証を完了し、ドキュメントの形式、サイズなどのコンプライアンス検証を行います；
<br>    b. ドキュメント保存：ドキュメントのアップロード成功後、MemOS により保存され、処理キューに入ります；
<br>    c. ドキュメント解析：異なるファイルタイプに応じてドキュメント本文内容を解析します；
<br>    d. インテリジェント分割：タイトル、構造、意味に基づいてドキュメントをより細粒度の内容断片に分割します；
<br>    e. ナレッジベース記憶の生成：内容の詳細を失わないために、MemOS はインテリジェントに記憶を生成し、ドキュメント分割後の原文と処理済みの記憶を含みます。
<br>    f. 埋め込みとインデックス：上記すべての記憶内容をデータベースに書き込み、ミリ秒レベルの検索をサポートするための埋め込みインデックスを構築します。
4. `search/memory`インターフェースを呼び出して記憶を検索すると、MemOS はコンテキストに関連するユーザー事実、嗜好、ツール記憶、およびナレッジベース記憶を一括して返します。
5. 上記の記憶を完全な指示に連結し、あなた自身がデプロイした大規模モデルに渡して回答を取得し、ユーザーに返します。


::note
**なぜナレッジベース記憶には個別の検索インターフェースがないのですか？** <br>
これは MemOS が意図的に行っている設計です。MemOS は、開発者が 1 回の検索で同時に「ナレッジベース+ユーザー」記憶を取得でき、出所に注意したり区別したりする必要なく、回答の実用性とユーザー体感を大幅に向上させることを望んでいます。
::

## 3. ナレッジベース要件

### 容量制限

MemOS クラウドサービスは現在、すべての開発者に無料版からエンタープライズ版までの複数の価格プランを提供しており、異なるバージョンごとにナレッジベースの容量と数量制限が異なります。

::note
現在、すべてのバージョンが期間限定で無料です。[公式サイト-価格](https://memos.openmem.net/cn/pricing)へアクセスし、ニーズに合ったバージョンを申請してください。
::

| **バージョン**   | **ナレッジベース保存制限**                  |
| ---------- | ----------------------------------------- |
| **無料版** | ナレッジベース数：10 個；単一ナレッジベース保存容量：1G    |
| **入門版** | ナレッジベース数：30 個；単一ナレッジベース保存容量：10G   |
| **プロ版** | ナレッジベース数：100 個；単一ナレッジベース保存容量：100G |


::warning
&nbsp;注意<br>
サービスレベルがダウングレードされたとき、既存のナレッジベースが現在のバージョンの容量制限を超えている場合、MemOS は <strong>既存のナレッジベースデータを消去しません</strong> が、以下の操作を制限します：<br>

* 新しいナレッジベースを作成できない
* 新しいドキュメントを引き続きアップロードできない

使用量を現在のバージョンの容量範囲内に調整すると、関連機能は復旧します。
::

### ドキュメント制限

1.  アップロード可能なドキュメントタイプ：PDF、DOCX、DOC、TXT、JSON、MD、XML

2.  単一ファイルサイズ上限：100 MB、500 ページを超えない

3.  1 回のアップロードでのファイル数上限：20 個を超えない

::warning
&nbsp;注意<br>
1 回のアップロードでのファイル数、単一ファイルサイズ、またはページ数が上記制限を超えた場合、そのアップロードタスクは<strong>処理失敗</strong>と判定されます。<br>
制限要件に従ってファイルを調整した後、再度アップロードリクエストを開始してください。
::

## 4. 使用例

以下は完全なナレッジベース使用例であり、専用の「ナレッジベースアシスタント」を迅速に使い始めるのに役立ちます。

### ナレッジベースを作成：財務精算ナレッジベース

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "knowledgebase_name": "財務精算ナレッジベース",
    "knowledgebase_description": "当社のすべての財務精算関連知識のまとめ"
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/create/knowledgebase"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [出力]
"result": {
  "code": 0,
  "data": {
    "id": "idxxxxx"  # 上で作成したナレッジベースIDに置き換えてください
  },
  "message": "ok"
}
```
::

### ドキュメントをアップロード：ソフトウェア購買精算制度

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "knowledgebase_id": "idxxxxx",  # 上で作成したナレッジベースIDに置き換えてください
    "file": [
        {"content": "https://cdn.memtensor.com.cn/file/ソフトウェア購買精算制度.pdf"}
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
```python [出力]
"result": {
  "code": 0,
  "data": [
    {
      "id": "1f35642253606ed1e9dd8cd8113a8998",
      "name": "ソフトウェア購買精算制度.pdf",
      "sizeMB": 0.06331157684326172,
      "status": "PROCESSING"
    }
  ],
  "message": "ok"
}
```
::

### ユーザー会話を追加

::note{icon="websymbol:chat"}
&nbsp;セッション A：2025-06-10 に発生<br>
<div style="padding-left: 2em;">
デザイナーはチャットの中で、自分が【クリエイティブプラットフォーム部門のデザイナー】という職種であることを示しました。
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
    "conversation_id": "0610",
    "messages": [
    {
        "role": "user",
        "content": "私はクリエイティブプラットフォーム部門のデザイナーです。"
    },
    {
        "role": "assistant",
        "content": "はい、覚えておきました。"
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

### ナレッジベース記憶を検索

::note{icon="websymbol:chat"}
&nbsp;セッション A：2025-12-12 に発生<br>
<div style="padding-left: 2em;">
ユーザーは新しいセッションで【ソフトウェア経費精算制度】について質問し、MemOS は自動的に【知識ベース記憶：ソフトウェア経費精算制度の内容】【ユーザー記憶：クリエイティブプラットフォームデザイナー】を想起することで、より明確で「ユーザーを理解した」ソフトウェア経費精算内容を回答します。
</div>
::
  
::code-group

```python [Python (HTTP)]
import os
import requests
import json

# あなたの MemOS API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "query": "ソフトウェア購入の経費精算上限額を調べてください。",
    "knowledgebase_ids":["idxxxxx"]  # 上で作成した知識ベースIDに置き換えてください
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

```python [出力]
"memory_detail_list": [
  {
    "id": "2c760355-de4b-4a8f-b98d-b92851d23fa7",
    "memory_key": "ソフトウェア購入経費精算制度（試行版）",
    "memory_value": "この制度は、会社の各種ソフトウェアの購入および経費精算プロセスを標準化することを目的としており、すべてのソフトウェア購入が特定カテゴリごとの購入金額上限に従うことを求めています。デザイン系ソフトウェアの購入上限は1000元で、グラフィックデザイン、動画編集、プロトタイプ設計に適用され、例としてはPhotoshopやPremiereがあります。コード/開発系ソフトウェアの購入上限は1500元で、適用範囲にはIDEや開発フレームワークが含まれ、例としてPyCharmやVisual Studioがあります。オフィス系ソフトウェアの購入上限は800元で、文書編集や表計算処理に適用され、例としてはOfficeスイートやWPSがあります。データ分析系ソフトウェアの購入上限は1200元で、適用範囲はデータ統計と可視化であり、例としてはTableauやPower BIがあります。セキュリティおよび保護系ソフトウェアの購入上限は1000元で、ウイルス対策やファイアウォールに適用されます。コラボレーション/プロジェクト管理系ソフトウェアの購入上限は900元で、例としてはJiraやSlackがあります。特殊業界向けソフトウェアの購入上限は2000元で、特別承認が必要です。すべての購入は会社の予算および情報セキュリティ要件に適合しなければならず、上限を超えるソフトウェアについては業務説明を提供し、特別承認を申請する必要があります。",
    "memory_type": "WorkingMemory",
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
    "relativity": 0.89308184
  },
  {
    "id": "81fd1e79-65be-4d4e-81e0-8f76ba697c55",
    "memory_key": "職位情報",
    "memory_value": "ユーザーはクリエイティブプラットフォーム部門のデザイナーです。",
    "memory_type": "WorkingMemory",
    "create_time": 1765526247112,
    "conversation_id": "0610",
    "status": "activated",
    "confidence": 0.99,
    "tags": [
      "職位",
      "部門",
      "デザイン"
    ],
    "update_time": 1765526247113,
    "relativity": 1.6319022e-05
  }
]
```
::

### フィードバックによる知識ベース最適化

企業では、企業ポリシー/知識がすでに更新されている一方で、知識ベースの更新がタイムリーでないという問題がよく発生します。現在、MemOS は**自然言語対話**を通じた知識ベース記憶へのフィードバックをサポートしており、知識ベース記憶を迅速に更新するために使用でき、これにより正確性と即時性を向上させます。

最もシンプルなインタラクション方式を使って、知識ベースを常に最新の状態に保ってみましょう。

::note{icon="websymbol:chat"}
&nbsp;セッション A：2025-12-12 に発生<br>
<div style="padding-left: 2em;">
財務主管は別の新しいセッションで【オフィス系ソフトウェアの購入上限は800元ではなく600元】とフィードバックします。
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
    "feedback_content": "オフィス系ソフトウェアの購入上限は800元ではなく600元です。",
    "allow_knowledgebase_ids":["idxxxxx"]  # 上で作成した知識ベースIDに置き換えてください
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
&nbsp;セッション A：2025-12-12 に発生<br>
<div style="padding-left: 2em;">
任意の他のユーザーが【ソフトウェア経費精算制度】を検索すると、新たに追加された高ウェイト記憶【オフィス系ソフトウェアの購入上限は800元ではなく600元】を取得します。
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
    "query": "ソフトウェア購入の経費精算上限額を調べてください。",
    "knowledgebase_ids":["idxxxxx"]  # 上で作成した知識ベースIDに置き換えてください
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
    "memory_value": "この制度は、会社の各種ソフトウェアの購入および経費精算プロセスを標準化することを目的としており、すべてのソフトウェア購入が特定カテゴリごとの購入金額上限に従うことを求めています。デザイン系ソフトウェアの購入上限は1000元で、グラフィックデザイン、動画編集、プロトタイプ設計に適用され、例としてはPhotoshopやPremiereがあります。コード/開発系ソフトウェアの購入上限は1500元で、適用範囲にはIDEや開発フレームワークが含まれ、例としてPyCharmやVisual Studioがあります。オフィス系ソフトウェアの購入上限は800元で、文書編集や表計算処理に適用され、例としてはOfficeスイートやWPSがあります。データ分析系ソフトウェアの購入上限は1200元で、適用範囲はデータ統計と可視化であり、例としてはTableauやPower BIがあります。セキュリティおよび保護系ソフトウェアの購入上限は1000元で、ウイルス対策やファイアウォールに適用されます。コラボレーション/プロジェクト管理系ソフトウェアの購入上限は900元で、例としてはJiraやSlackがあります。特殊業界向けソフトウェアの購入上限は2000元で、特別承認が必要です。すべての購入は会社の予算および情報セキュリティ要件に適合しなければならず、上限を超えるソフトウェアについては業務説明を提供し、特別承認を申請する必要があります。",
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
    "memory_value": "ユーザーはオフィス系ソフトウェアの購入上限が800元ではなく600元であることを確認しました。",
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

[コンソール-知識ベース](https://memos-dashboard.openmem.net/knowledgeBase/)には、自然言語インタラクションを通じて知識ベース記憶を修正または補完したすべての詳細が表示されます。

![image.png](https://cdn.memtensor.com.cn/img/1765970178683_5tuxe4_compressed.png)

::note
フィードバック API のフィールド、形式などの情報の完全な一覧については、[Add Feedback インターフェースドキュメント](/api_docs/message/add_feedback)を参照してください。
::
