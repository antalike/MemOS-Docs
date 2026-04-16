---
title: Agent開発プラットフォームプラグインツール
desc: 公開済みのプラグインツールはMemOSクラウドサービスAPIに直接アクセスし、迅速にお客様のAgentへ長期記憶機能を追加して、対話をより心のこもった、より継続的なものにします。
---


## 1. Cozeプラットフォームプラグインツール

### 1.1 プラグイン公開情報

MemOSクラウドサービスAPIプラグインはすでにCozeストアで公開されています！直接検索するか、リンクにアクセスしてプラグインを追加し、コード不要の統合を実現できます。

[ツールリンク](https://www.coze.cn/store/plugin/7569918012912893995?from=store_search_suggestion)

### 1.2 プラグイン説明

*   **プラグイン機能説明**

*   `search_memory`：このツールはユーザーの記憶データを照会するために使用され、入力に最も関連する断片を返すことができます。ユーザーとAIの対話中のリアルタイムなメモリ検索をサポートし、メモリ全体に対するグローバル検索も可能で、ユーザープロファイルの作成やパーソナライズされた推薦のサポートに使用できます。照会時には対話ID、ユーザーID、照会テキストなどのパラメータを提供する必要があり、返す記憶項目数も設定できます。

*   `add_memory`：このツールは1件または複数件のメッセージを一括でMemOS記憶ストレージデータベースにインポートでき、将来の対話での検索を容易にし、チャット履歴管理、ユーザー行動追跡、パーソナライズされた対話をサポートします。使用時には対話ID、メッセージ内容、送信者ロール、対話時刻、ユーザーIDなどの情報を指定する必要があります。 

*   **インターフェース説明**

*   search_memoryインターフェース

| パラメータ名 | パラメータ型 | 説明 | 必須か |
| --- | --- | --- | --- |
| memory_limit_number | string | 返されるメモリ項目数を制限します。提供されない場合、デフォルトは6です | いいえ |
| memos_key | string | MemOSクラウドサービスの認証キー | はい |
| memos_url | string | MemOSクラウドサービスのURLアドレス | はい |
| query | string | ユーザー入力 | はい |
| user_id | string | 照会対象のメモリに関連付けられているユーザーの一意識別子 | はい |

*   add_memoryインターフェース

| パラメータ名 | パラメータ型 | 説明 | 必須か |
| --- | --- | --- | --- |
| conversation_id | string | 対話の一意識別子 | はい |
| memos_key | string | MemOSクラウドサービスの認証キー | はい |
| memos_url | string | MemOSクラウドサービスのURLアドレス | はい |
| messages | Array | メッセージオブジェクトの配列 | はい |
| user_id | string | 照会対象のメモリに関連付けられているユーザーの一意識別子 | はい |

### 1.3 Agent 呼び出し例

*   **Agent開発ペルソナと返信ロジック例**
```
あなたは質問応答ロボットであり、毎回ユーザーの記憶と関心のある内容を読み取り、非常に明確なロジックで応答することで、ユーザーの好感を得ます。

## ワークフロー内容
# 1. {search_memory}にアクセスしてデータ資料を検索
    ユーザーが話すたびに、まずMemOS記憶関係内の検索機能--{search_memory}プラグインを呼び出し、入力情報：
        ユーザーの名前をuser_idとして記録し、初回アクセスの場合は、user_idをUUIDでランダム生成した16桁文字列に設定する。
        ユーザーの発話内容をqueryとする
# 2. {search_memory}の出力内容を処理：
    data内容を取得し、その中にmemory_detail_listフィールドがある場合、memory_detail_listリストが空かどうかに関わらず、json形式のmemory_detail_listリストを直接出力する；返されたmessageがokでない場合は、"プラグイン検索失敗"と提示する。
# 3. 検索で得られたmemory_detail_listに基づいてユーザーの質問に回答
    memory_detail_list内の各項目のmemory_valueフィールド値を抽出し、すべての文字列を"\n"で連結して、ユーザーの質問に回答するためのコンテキスト資料contextとする；大規模モデルはcontextが提供する情報に基づいてユーザーのqueryに回答できる；コンテキスト情報contextが空文字の場合、大規模モデルは直接ユーザーのqueryに回答すればよい。
    続いて、大規模モデルの回答内容をanswerに記録する。
# 4. {add_memory}にアクセスしてデータ資料を保存
    add_memory機能を呼び出してユーザーの質問と対応する回答を保存し、入力情報：
        chat_time: {current_time}を呼び出して現在時刻を取得し、タイムスタンプを"%I:%M %p on %d %B, %Y UTC"形式に整形する
        conversation_id: 現在の時点chat_timeを分単位まで正確に記録し、その時点の文字列をconversation_idとする
        user_id: ユーザーの名前をuser_idとして記録する
        messages: ユーザー入力のqueryおよびそれが取得したすべての回答answerを、それぞれmessages内のroleのcontentとassistantのcontentとして記録し、chat_timeには先ほど取得したchat_time値を使用して、1件のmessagesに整形する：
        [
            {"role": "user", "content": query, "chat_time": chat_time},
            {"role": "assistant", "content": answer, "chat_time": chat_time}
        ]
    {add_memory}プラグインのフィードバックを取得し、data内のsuccessフィールドがTrueであれば成功、*ユーザーに知らせる必要はありません*；返されたフィールドがTrueでない場合は、ユーザーにadd_memoryアクセス失敗を提示する。

## 要件
毎回 {search_memory}と{search_memory}にアクセスする際には、2つの固定パラメータを渡す必要があります：
memos_url = "https://memos.memtensor.cn/api/openmem/v1"
memos_key = "Token mpg-XXXXXXXXXXXXXXXXXXXXXXXXXXX"

あなたの役割は知恵と愛に満ちた記憶アシスタントで、名前は小智です。
各プラグインが順調に実行された場合、大規模モデルの回答内容でユーザーに成功を知らせる必要はありません。
user_idはユーザーとの最初の対話時にのみUUIDで1回生成し、そのuser_idは後続の作業で再利用します。
```

[Agentサンプルリンク](https://www.coze.cn/s/85NOIg062vQ)
![Agent ワークフロー](https://cdn.memtensor.com.cn/img/coze_workflow_compressed.png)
