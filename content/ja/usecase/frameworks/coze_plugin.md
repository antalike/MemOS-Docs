---
title: Coze プラグインツール
desc: Coze プラグインツールはMemOSクラウドサービスインターフェースに直接アクセスし、迅速にお使いのAgentへ長期記憶機能を追加して、対話をより心のこもった、より連続的なものにします。
---


## 1.プラグイン掲載情報

MemOSクラウドサービスインターフェースプラグインはすでにCozeストアで公開されています！直接[ツールリンクへ移動](https://www.coze.cn/store/plugin/7569918012912893995?from=store_search_suggestion)してプラグインを追加し、ゼロコード統合を実現できます。

## 2. プラグイン説明

### プラグイン機能

*   `search_memory`：このツールはユーザーの記憶データを検索するために使用され、入力に最も関連する断片を返すことができます。ユーザーとAIの対話中にリアルタイムでメモリを検索することをサポートし、メモリ全体でグローバル検索を行うこともでき、ユーザープロファイルの作成やパーソナライズされた推薦のサポートに使用できます。検索時には対話ID、ユーザーID、検索テキストなどのパラメータを提供する必要があり、返す記憶項目数を設定することもできます。

*   `add_memory`：このツールは1件または複数件のメッセージを一括でMemOS記憶ストレージデータベースにインポートでき、将来の対話での検索を容易にし、それによりチャット履歴管理、ユーザー行動追跡、パーソナライズされたインタラクションをサポートします。使用時には対話ID、メッセージ内容、送信者ロール、対話時間、ユーザーIDなどの情報を指定する必要があります。 

### インターフェース説明

*   search_memoryインターフェース

| パラメータ名 | パラメータ型 | 説明 | 必須か |
| --- | --- | --- | --- |
| memory_limit_number | string | 返されるメモリ項目数を制限します。提供されない場合、デフォルトは6です | いいえ |
| memos_key | string | MemOSクラウドサービスの認可キー | はい |
| memos_url | string | MemOSクラウドサービスのURLアドレス | はい |
| query | string | ユーザー入力 | はい |
| user_id | string | 検索対象のメモリに関連付けられたユーザーの一意識別子 | はい |

*   add_memoryインターフェース

| パラメータ名 | パラメータ型 | 説明 | 必須か |
| --- | --- | --- | --- |
| conversation_id | string | 対話の一意識別子 | はい |
| memos_key | string | MemOSクラウドサービスの認可キー | はい |
| memos_url | string | MemOSクラウドサービスのURLアドレス | はい |
| messages | Array | メッセージオブジェクトの配列 | はい |
| user_id | string | 検索対象のメモリに関連付けられたユーザーの一意識別子 | はい |

## 3. Agent 呼び出し例

### Agent開発ペルソナと返信ロジック例
```
あなたはQ&Aロボットであり、毎回ユーザーの記憶と関心内容を読み取り、非常に明確なロジックで回答し、それによってユーザーの好感を得ます。

## ワークフロー内容
# 1. {search_memory}にアクセスしてデータ資料を検索
    ユーザーが話すたびに、まずMemOS記憶関係内の検索機能--{search_memory}プラグインを呼び出し、入力情報：
        ユーザーの名前をuser_idとして記録し、初回アクセスの場合は、user_idをUUIDでランダム生成した16文字列に設定する。
        ユーザーの発話内容をqueryとする
# 2. {search_memory}出力内容を処理：
    data内容を取得し、その中にmemory_detail_listフィールドがある場合、memory_detail_listリストが空かどうかに関わらず、直接json形式のmemory_detail_listリストを出力する；返されたmessageがokでない場合は、"プラグイン検索失敗"と提示する。
# 3. 検索で取得したmemory_detail_listに基づいてユーザーの質問に回答
    memory_detail_list内の各項目からmemory_valueフィールド値を抽出し、すべての文字列を"\n"で連結して、ユーザーの質問に回答するためのコンテキスト資料contextとする；大規模モデルはcontextが提供する情報に基づいてユーザーのqueryに回答できる；コンテキスト情報contextが空文字の場合、大規模モデルは直接ユーザーのqueryに回答すればよい。
    続いて、大規模モデルが回答した内容をanswerに記録する。
# 4. {add_memory}にアクセスしてデータ資料を保存
    add_memory機能を呼び出してユーザーの質問と対応する回答を保存し、入力情報：
        chat_time: {current_time}を呼び出して現在時刻を取得し、タイムスタンプを"%I:%M %p on %d %B, %Y UTC"形式に整理する
        conversation_id: 現在の時点chat_timeを分単位まで記録し、その時点文字列をconversation_idとする
        user_id: ユーザーの名前をuser_idとして記録する
        messages: ユーザー入力のqueryおよびそれが取得したすべての回答answerを、それぞれmessages内のroleのcontentとassistantのcontentとして記録し、chat_timeには先ほど取得したchat_time値を使用して、1件のmessagesに整理する：
        [
            {"role": "user", "content": query, "chat_time": chat_time},
            {"role": "assistant", "content": answer, "chat_time": chat_time}
        ]
    {add_memory}プラグインのフィードバックを取得し、data内のsuccessフィールドがTrueなら成功、*ユーザーに知らせる必要はない*；返されたフィールドがTrueでない場合は、ユーザーにadd_memoryアクセス失敗を通知する。

## 要件
毎回 {search_memory}と{search_memory}にアクセスする際には、2つの固定パラメータを渡す必要があります：
memos_url = "https://memos.memtensor.cn/api/openmem/v1"
memos_key = "Token mpg-XXXXXXXXXXXXXXXXXXXXXXXXXXX"

あなたの役割は知恵と愛に満ちた記憶アシスタントで、名前は小智です。
各プラグインがすべて正常に動作した場合、大規模モデルの回答内容の中でユーザーに成功を提示する必要はありません。
初回のユーザー対話時にのみUUIDで一度だけuser_idを生成し、そのuser_idを後続の作業で再利用します。
```

[Agentサンプルリンク](https://www.coze.cn/s/85NOIg062vQ)
![Agent ワークフロー](https://cdn.memtensor.com.cn/img/coze_workflow_compressed.png)
