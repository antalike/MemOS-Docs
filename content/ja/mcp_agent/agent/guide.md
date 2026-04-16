---
title: 利用ガイド
desc: 公開済みのプラグインツールはMemOSクラウドサービスAPIに直接アクセスし、Agentに長期記憶機能をすばやく追加して、対話をより心のこもった、より継続的なものにします。
---

## Cozeプラットフォームプラグインツール

### 1.プラグイン公開情報

MemOSクラウドサービスAPIプラグインはすでにCozeストアで公開されています！直接[ツールリンクへ移動](https://www.coze.cn/store/plugin/7569918012912893995?from=store_search_suggestion)してプラグインを追加し、ゼロコード統合を実現できます。

### 2. プラグイン説明

#### プラグイン機能

*   `search_memory`：このツールはユーザーの記憶データを照会するために使用され、入力に最も関連する断片を返すことができます。ユーザーとAIの対話中のリアルタイムメモリ検索をサポートし、メモリ全体でのグローバル検索も可能で、ユーザープロファイルの作成やパーソナライズ推薦のサポートに使用できます。照会時には会話ID、ユーザーID、照会テキストなどのパラメータを提供する必要があり、返す記憶項目数も設定できます。

*   `add_memory`：このツールは1件または複数件のメッセージを一括でMemOS記憶保存データベースにインポートでき、将来の対話での検索を容易にし、それによってチャット履歴管理、ユーザー行動追跡、およびパーソナライズされたインタラクションをサポートします。使用時には会話ID、メッセージ内容、送信者ロール、会話時間、およびユーザーIDなどの情報を指定する必要があります。 

#### インターフェース説明

*   search_memoryインターフェース

| パラメータ名 | パラメータ型 | 説明 | 必須か |
| --- | --- | --- | --- |
| memory_limit_number | string | 返されるメモリ項目数を制限します。提供されていない場合、デフォルトは6です | 否 |
| memos_key | string | MemOSクラウドサービスの認可キー | 是 |
| memos_url | string | MemOSクラウドサービスのURLアドレス | 是 |
| query | string | ユーザー入力 | 是 |
| user_id | string | 照会されているメモリに関連付けられたユーザーの一意識別子 | 是 |

*   add_memoryインターフェース

| パラメータ名 | パラメータ型 | 説明 | 必須か |
| --- | --- | --- | --- |
| conversation_id | string | 会話の一意識別子 | 是 |
| memos_key | string | MemOSクラウドサービスの認可キー | 是 |
| memos_url | string | MemOSクラウドサービスのURLアドレス | 是 |
| messages | Array | メッセージオブジェクトの配列 | 是 |
| user_id | string | 照会されているメモリに関連付けられたユーザーの一意識別子 | 是 |

### 3. Agent 呼び出し例

#### Agent開発用ペルソナと返信ロジック例
```
あなたは質問応答ロボットであり、毎回利用者の記憶と関心内容を読み取り、非常に明確なロジックで返答することで、ユーザーの好感を得ます。

## ワークフロー内容
# 1. {search_memory}にアクセスしてデータ資料を検索
    ユーザーが話すたびに、まずMemOS記憶関係の検索機能--{search_memory}プラグインを呼び出し、入力情報：
        ユーザーの名前をuser_idとして記録し、初回アクセスの場合は、user_idをUUIDでランダム生成した16桁の文字列に設定します。
        ユーザーの発話内容をqueryとします
# 2. {search_memory}の出力内容を処理：
    data内容を取得し、その中にmemory_detail_listフィールドがある場合、memory_detail_listリストが空かどうかに関わらず、直接json形式のmemory_detail_listリストを出力します；返されたmessageがokでない場合は、"プラグイン検索失敗"と案内します。
# 3. 検索で得られたmemory_detail_listをもとにユーザーの質問に回答
    memory_detail_list内の各項目のmemory_valueフィールド値を抽出し、すべての文字列を"\n"で連結して、ユーザーの質問に回答するためのコンテキスト資料contextとします；大規模モデルはcontextが提供する情報に基づいてユーザーのqueryに回答できます；コンテキスト情報contextが空文字の場合、大規模モデルは直接ユーザーのqueryに回答すればよいです。
    続いて、大規模モデルが回答した内容をanswerに記録します。
# 4. {add_memory}にアクセスしてデータ資料を保存
    add_memory機能を呼び出してユーザーの質問と対応する回答を保存し、入力情報：
        chat_time: {current_time}を呼び出して現在時刻を取得し、タイムスタンプを"%I:%M %p on %d %B, %Y UTC"形式に整形します
        conversation_id: 現在の時点chat_timeを分単位まで正確に記録し、その時点文字列をconversation_idとします
        user_id: ユーザーの名前をuser_idとして記録します
        messages: ユーザー入力のqueryおよびそれが取得したすべての回答answerを、それぞれmessages内のroleのcontentとassistantのcontentとして記録し、chat_timeには先ほど取得したchat_time値を使用して、1件のmessagesに整形します：
        [
            {"role": "user", "content": query, "chat_time": chat_time},
            {"role": "assistant", "content": answer, "chat_time": chat_time}
        ]
    {add_memory}プラグインのフィードバックを取得し、data内のsuccessフィールドがTrueであれば成功です。*ユーザーに知らせる必要はありません*；返されたフィールドがTrueでない場合は、ユーザーにadd_memoryアクセス失敗を案内します。

## 要件
毎回 {search_memory}と{search_memory}にアクセスする際には、2つの固定パラメータを渡す必要があります：
memos_url = "https://memos.memtensor.cn/api/openmem/v1"
memos_key = "Token mpg-XXXXXXXXXXXXXXXXXXXXXXXXXXX"

あなたの役割は知恵と愛に満ちた記憶アシスタントで、名前は小智です。
各プラグインが順調に実行された場合、大規模モデルの回答内容でユーザーに成功を案内する必要はありません。
初回のユーザー対話時にのみUUIDで一度だけuser_idを生成し、そのuser_idは後続の作業で再利用します。
```

[Agentサンプルリンク](https://www.coze.cn/s/85NOIg062vQ)
![Agent ワークフロー](https://cdn.memtensor.com.cn/img/coze_workflow_compressed.png)
