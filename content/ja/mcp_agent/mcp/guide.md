---
title: MCP サービス設定
desc: MemOS は、MCP を通じてクラウドプラットフォームと対話する方法を提供しており、開発者は異なるクライアント（Claude、Cursor、Cline など）で MemOS クラウドプラットフォームのサービスを利用できます。
---

## 1. サービス概要

MemOS メモリ管理 MCP は強力なプラグインであり、ユーザーが MemOS メモリの追加、検索、削除、フィードバックなどの機能にアクセスでき、会話内容を保存・取得して、ユーザーに効率的なメモリ管理サービスを提供し、ユーザーと AI の対話における一貫性とパーソナライズの向上を支援します。

## 2. ツールリンク
* [npmパッケージ](https://www.npmjs.com/package/@memtensor/memos-api-mcp)
* [Github](https://github.com/MemTensor/memos-api-mcp)


## 3. MCP を通じて MemOS クラウドプラットフォームと対話する

クライアントで以下の設定を記入します：

```json
{
  "mcpServers": {
    "memos-api-mcp": {
      "timeout": 60,
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@memtensor/memos-api-mcp@latest"
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
- `MEMOS_API_KEY`: MemOS 公式サイトの[APIコンソール](https://memos-dashboard.openmem.net/cn/apikeys/)でアカウント登録を行い、その後インターフェースキーのページで api-key を新規作成し、ここにコピー＆ペーストします。

![MemOS APIコンソールで api-key を新規作成](https://cdn.memtensor.com.cn/img/1763452232848_t268eh_compressed.png)

- `MEMOS_USER_ID`: 決定的なユーザー定義の個人識別子です。
  - 同一ユーザーについては、この環境変数を異なるデバイス/クライアント間で一貫して保つ必要があります；
  - ランダム値、デバイス ID、またはチャットセッション ID をユーザー識別子として使用しないでください；
  - 推奨：個人の email アドレス、氏名のフルネーム、または社員 ID をユーザー識別子として使用します。

- `MEMOS_CHANNEL`: "MODELSCOPE" と記入すればよいです。

## 4. 異なるクライアントで MemOS MCP を使用する

### Claude Desktop で使用する

Claude Desktop で MemOS を使用するには、左下のアバターをクリック -> "Settings" -> "Developer" -> "Edit Config" と進み、設定を Claude_desktop_config.json ファイルに貼り付け、最後にクライアントを再起動し、memos-api-mcp サービスが running 状態であることを確認すれば、チャットで使用できます。

![Claude で MemOS を使用-検証](https://cdn.memtensor.com.cn/img/1763105334517_9ayhrp_compressed.png)

使用効果を高めるため、Claude Desktop で MemOS を使用する際には、すべての会話に適用されるユーザー設定を変更することを推奨します。具体的な方法は、左下のアバターをクリック -> "General" と進み、"What personal preferences should Claude consider in responses?" の下の入力ボックスに以下の内容を貼り付けます：

```
あなたは MemOS メモリ管理アシスタントであり、効率的なメモリ管理サービスの提供に尽力し、ユーザーの過去の会話内容に基づいてメモリを抽出し、メモリ検索を通じてユーザーと AI の対話における一貫性とパーソナライズの水準を高めます。ユーザーの質問に回答する前に、毎回 memos-api-mcp の search_memory サービスを呼び出し、適切な検索語を用いてユーザーの個人メモリライブラリ内から現在の話題に関連するメモリを検索する必要があります。これらのメモリに基づいて回答を完了した後、さらに memos-api-mcp の add_message サービスを呼び出し、現在の会話内容の要約を記録します。（ご注意ください。add_message を呼び出すこのステップは必ず実行する必要があります。ユーザーが何を言ったか、どのような質問をしたかに関わらず記録しなければなりません。そうしないと、その後の会話で search_memory がより詳細なユーザー情報を取得できず、その結果、ユーザーの質問に正確に回答できなくなります。）
```

![Claude Desktop で MemOS を使用-ユーザー設定を変更](https://cdn.memtensor.com.cn/img/1763105396189_i1tupr_compressed.png)

以下は Claude Desktop で MemOS を使用する例であり、ユーザーはこれにより Claude Desktop で MemOS の設定に成功したかどうかを判断できます。

![Claude Desktop で MemOS を使用する例](https://cdn.memtensor.com.cn/img/1763105412700_asgfq9_compressed.png)

### Cursor で使用する
Cursor で MemOS を使用するには、"Cursor Settings" -> "Tools & MCP" -> "Add Custom MCP"(または "New MCP Server") に進み、ポップアップ表示された mcp.json ファイルの編集ページに設定を貼り付け、memos-api-mcp が起動状態であり、かつツール詳細ページで "add_message""search_memory" などの複数のツールを確認できれば、Cursor のチャットパネルで使用できます。

![Cursor で MemOS を使用](https://cdn.memtensor.com.cn/img/1763105278297_n23ukk_compressed.png)

使用効果を高めるため、Cursor で MemOS を使用する際には User Rules を変更することを推奨します。具体的な方法は、"Cursor Settings" -> "Rules, Memories, Commands" -> "User Rules" -> "+ Add Rule" に進み、その後以下の内容をコピー＆ペーストして保存します：
```
あなたは MemOS メモリ管理アシスタントであり、効率的なメモリ管理サービスの提供に尽力し、ユーザーの過去の会話内容に基づいてメモリを抽出し、メモリ検索を通じてユーザーと AI の対話における一貫性とパーソナライズの水準を高めます。ユーザーの質問に回答する前に、毎回 memos-api-mcp の search_memory サービスを呼び出し、適切な検索語を用いてユーザーの個人メモリライブラリ内から現在の話題に関連するメモリを検索する必要があります。これらのメモリに基づいて回答を完了した後、さらに memos-api-mcp の add_message サービスを呼び出し、現在の会話内容の要約を記録します。（ご注意ください。add_message を呼び出すこのステップは必ず実行する必要があります。ユーザーが何を言ったか、どのような質問をしたかに関わらず記録しなければなりません。そうしないと、その後の会話で search_memory がより詳細なユーザー情報を取得できず、その結果、ユーザーの質問に正確に回答できなくなります。）
```

![Cursor で MemOS を使用-User rules を設定](https://cdn.memtensor.com.cn/img/1763105535408_2xtvd3_compressed.png)

以下は Cursor で MemOS を使用する例であり、ユーザーはこれにより Cursor で MemOS の設定に成功したかどうかを判断できます。

![Cursor で MemOS を使用-使用例](https://cdn.memtensor.com.cn/img/1763105558821_imga5z_compressed.png)

### Visual Studio Code または Trae で使用する
VS Code または Trae で MemOS を使用するには、Cline 拡張機能をインストールしてモデル設定を行った後、Cline パネル内右上の "MCP Servers" アイコンをクリック -> "Configure" -> "Configure MCP Servers" と進み、設定を cline_map_settings.json ファイルに貼り付け、memos-api-mcp が起動状態であることを確認すれば Cline エージェントで使用できます。同時に、各ツールの`Auto-approve`スイッチを有効にすることを推奨します。エージェントがツール呼び出し前に毎回確認するのを避けられ、よりスムーズに使用できます。

![Cline で MemOS を使用-設定手順](https://cdn.memtensor.com.cn/img/1763105573529_oo765m_compressed.png)

使用効果を高めるため、Cline で MemOS を使用する際には global rules を変更することを推奨します。具体的な方法は、Cline パネル左下の "Manage Cline Rules & Workflows" アイコンをクリック -> Global Rules の下の右側にある "＋" アイコンをクリック -> 入力ボックスに rules ファイル名（例："memos_rules.md"）を入力 -> 以下の内容をポップアップ表示されたエディタにコピー＆ペーストします：

```markdown
# 🧠 MemOS Automatic Memory System — Mandatory Usage

## ⚠️ Always-On (No User Opt-In Required)
This system must run **automatically for every turn**. Do **not** wait for the user to say “use memory”, “use MCP”, or “call a tool”. The **client/orchestrator is responsible** for auto-invoking the tools.

## 🎯 Mandatory 3-Step Workflow (Enforced by Client Each Turn)
\`\`\`
Every user message
  → 1) 🔍 search_memory (AUTO, before answering)
  → 2) 💬 Answer (use only relevant memories; ignore noise)
  → 3) 💾 add_message (AUTO, after answering)
\`\`\`

### 1) 🔍 Search Memory (Auto-invoked BEFORE answering)
- **Trigger**: Must be auto-called **before** generating any answer (including simple greetings).
- **Tool**: `search_memory`

**Relevance rule**: The model must judge relevance and **only use relevant** memories. If results are irrelevant or noisy, **ignore them** and proceed.

### 2) 💬 Answer
Use retrieved memories **only if relevant**. If none are relevant, answer normally.

### 3) 💾 Save Conversation (Auto-invoked AFTER answering)
- **Trigger**: Must be auto-called after producing the final answer on **every turn**.
- **Tool**: `add_message`

**Purpose**: Persist Q&A for future personalization and continuity — even if no memory was used this turn.

## ✅ Non-Negotiable Client Responsibilities
1. **Auto-invoke** `search_memory` before **every** answer and `add_message` after **every** answer.
2. **No user opt-in**: Do not wait for the user to mention memory/tools/MCP.
3. **Store both user and assistant** messages every turn.
4. **Sequence** must be strictly: Search → Answer → Save.
```

![VS Code または Trae で MemOS を使用-global rules を変更](https://cdn.memtensor.com.cn/img/1763105598614_p0drfo_compressed.png)

以下は Cline で MemOS を使用する例であり、ユーザーはこれにより Cline で MemOS の設定に成功したかどうかを判断できます。

![Cline で MemOS を使用する例](https://cdn.memtensor.com.cn/img/1763105618134_ggy3m0_compressed.png)

### [Chatbox](https://chatboxai.app/zh) で使用する
Chatbox で MemOS を使用するには、左下の "設定" -> "MCP" -> "カスタム MCP サーバー-サーバーを追加" -> "カスタムサーバーを追加" をクリックし、以下の設定に従って memos-api-mcp サービスを追加します。
```
名称：MemOS メモリ管理アシスタント
タイプ：ローカル(stdio)
コマンド：npx -y @memtensor/memos-api-mcp@latest
環境変数：
MEMOS_API_KEY=<YOUR-API-KEY>
MEMOS_USER_ID=<YOUR-USER-ID>
```
入力完了後に "テスト" をクリックし、ダイアログボックスの最下部で "add_message""search_memory" などの複数のツールが表示されれば、設定成功を示します。

![Chatbox で MemOS を使用-検証](https://cdn.memtensor.com.cn/img/1763105637530_f98hyr_compressed.png)

使用効果を高めるため、Chatbox で MemOS を使用する際には system_prompt を変更することを推奨します。具体的な方法は、左下の "設定" -> "会話設定" -> "新しい会話のデフォルト設定" と進み、prompt を以下のように変更します：

```
あなたは MemOS メモリ管理アシスタントであり、効率的なメモリ管理サービスの提供に尽力し、ユーザーの過去の会話内容に基づいてメモリを抽出し、メモリ検索を通じてユーザーと AI の対話における一貫性とパーソナライズの水準を高めます。ユーザーの質問に回答する前に、毎回 memos-api-mcp の search_memory サービスを呼び出し、適切な検索語を用いてユーザーの個人メモリライブラリ内から現在の話題に関連するメモリを検索する必要があります。これらのメモリに基づいて回答を完了した後、さらに memos-api-mcp の add_message サービスを呼び出し、現在の会話内容の要約を記録します。（ご注意ください。add_message を呼び出すこのステップは必ず実行する必要があります。ユーザーが何を言ったか、どのような質問をしたかに関わらず記録しなければなりません。そうしないと、その後の会話で search_memory がより詳細なユーザー情報を取得できず、その結果、ユーザーの質問に正確に回答できなくなります。）
```

![Chatbox で MemOS を使用する際に system_prompt を変更](https://cdn.memtensor.com.cn/img/1763105656492_ky1wbw_compressed.png)

以下は Chatbox で MemOS を使用する例であり、ユーザーはこれにより Chatbox で MemOS の設定に成功したかどうかを判断できます。

![Chatbox で MemOS を使用-効果例](https://cdn.memtensor.com.cn/img/1763105677226_cygzzf_compressed.png)


## 5. Q&A
Q：ツールを使用すべき場面で、エージェントが使用しない状況に遭遇することがありますか？

A：使用している基盤モデルが異なるため、異なるエージェントでのツール使用の習熟度にも差があります。エージェントがツールの使用を忘れる状況が発生した場合は、指示によってモデルに対応するツールを呼び出すよう誘導するか、別の基盤モデルの使用を試してください。

## 6. お問い合わせ

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
