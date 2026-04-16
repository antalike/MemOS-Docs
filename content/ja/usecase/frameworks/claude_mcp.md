---
title: Claude MCP
---


## 1. MCP と MemOS クラウドサービスを設定する

クライアントで以下の設定を入力します：

```json
{
  "mcpServers": {
    "memos-api-mcp": {
      "timeout": 60,
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@memtensor/memos-api-mcp"
      ],
      "env": {
        "MEMOS_API_KEY": "mpg-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "MEMOS_USER_ID": "your-user-id",
        "MEMOS_CHANNEL": "MODELSCOPE"
      }
    }
  }
}
```

環境変数の取得方法：
- `MEMOS_API_KEY`: MemOS 公式サイトの[API コンソール](https://memos-dashboard.openmem.net/cn/apikeys/)でアカウントを登録し、その後インターフェースキーのページで api-key を新規作成して、ここにコピー＆ペーストしてください。

![MemOS API コンソールで api-key を新規作成する](https://cdn.memtensor.com.cn/img/1763452232848_t268eh_compressed.png)

- `MEMOS_USER_ID`: 決定的なユーザー定義の個人識別子。
  - 同一ユーザーについて、この環境変数は異なるデバイス/クライアント間で一貫している必要があります；
  - ランダム値、デバイスID、またはチャットセッションIDをユーザー識別子として使用しないでください；
  - 推奨される使用例：個人の email アドレス、氏名フルネーム、または従業員 ID をユーザー識別子として使用します。

- `MEMOS_CHANNEL`: "MODELSCOPE" と入力すればよいです。


## 2. Claude クライアントで使用する
Claude Desktop で MemOS を使用するには、左下のアバターをクリック -> "Settings" -> "Developer" -> "Edit Config" と進み、設定を Claude_desktop_config.json ファイルに貼り付け、最後にクライアントを再起動します。memos-api-mcp サービスが running 状態になっていることを確認できれば、チャットで使用できます。

![Claude で MemOS を使用する-検証](https://cdn.memtensor.com.cn/img/1763105334517_9ayhrp_compressed.png)

使用効果を高めるため、ユーザーが Claude Desktop で MemOS を使用する際には、すべての会話に適用されるユーザー設定を変更することを推奨します。具体的な方法は、左下のアバターをクリック -> "General" と進み、"What personal preferences should Claude consider in responses?" の下の入力欄に以下の内容を貼り付けます：

```
あなたは MemOS 記憶管理アシスタントであり、高効率な記憶管理サービスの提供に専念しています。ユーザーの過去の対話内容に基づいて記憶を抽出し、記憶検索を通じてユーザーと AI の対話の一貫性と個別化レベルを向上させます。ユーザーの質問に回答する前に、毎回 memos-api-mcp の search_memory サービスを呼び出し、適切な検索語を用いてユーザーの個人記憶ライブラリ内で現在の話題に関連する記憶を検索する必要があります。これらの記憶に基づいて回答を完了した後、さらに memos-api-mcp の add_message サービスを呼び出して、現在の対話内容の要約を記録してください。（注意：add_message を呼び出すこのステップは必須です。ユーザーが何を言ったか、または何を質問したかに関係なく、必ず記録しなければなりません。そうしないと、その後の対話で search_memory がより詳細なユーザー情報を取得できず、その結果、ユーザーの質問に正確に回答できなくなります。）
```

![Claude Desktop で MemOS を使用する-ユーザー設定を変更する](https://cdn.memtensor.com.cn/img/1763105396189_i1tupr_compressed.png)

以下は Claude Desktop で MemOS を使用する例です。ユーザーはこれによって、Claude Desktop で MemOS の設定が正常に完了したかどうかを判断できます。

![Claude Desktop で MemOS を使用する例](https://cdn.memtensor.com.cn/img/1763105412700_asgfq9_compressed.png)
