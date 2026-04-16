---
title: OpenClaw クラウドプラグイン
desc: OpenClaw の記憶能力を強化し、Token 消費を 72% 削減：MemOS OpenClaw プラグインが公開されました！
---

OpenClaw は最近大きな注目を集めていますが、実際の利用では、ユーザーは一般的に避けられない 2 つの問題に直面します：

1. **Token 消費が速すぎる**：OpenClaw は多くのロングテールタスクを処理できますが、実行のたびに大量の Token を消費します。画面の監視、定時タスクの実行、または複雑なワークフローの処理をさせると、Token 消費はさらに驚くほど増加します。

    > <b>("Token がつまりお金だって知ってるよね🫠")</b>

2. **記憶機能が弱い**：多くの人が OpenClaw の記憶能力は ChatGPT を超えていると主張していますが、実際には、いくつかの情報を覚えていても、それがあなたに必要な重要情報であるとは限りません。重要な好みは忘れられる一方で、どうでもいい雑談ははっきり覚えていることがよくあります。

    > <b>("私にとって本当に重要なことを少しは覚えてくれませんか？？？")</b>

::tip
**これは OpenClaw のせいではなく、すべての AI Agent がこれらの課題に直面しています。**
::

このチュートリアルでは、MemOS OpenClaw プラグインを通じて、この 3 つのコアな課題を解決する方法を案内します：
- **Token 消費を大幅に削減** — すべての履歴を無差別に読み込むのではなく、関連する記憶をインテリジェントに検索
- **記憶を本当に役立つものにする** — プロフェッショナル級の記憶分類と管理で、覚えるべきものを覚え、忘れるべきものを忘れる
- **OpenClaw のコアな強みを保持** — デバイス横断の制御、能動的なインタラクション、人間らしい体験はそのまま

---

## なぜ OpenClaw は「Token キラー」🥷 になったのか？

### OpenClaw の問題

```plaintext
1 回目の対話: 500 tokens
2 回目の対話: 500 + 800 = 1,300 tokens
3 回目の対話: 1,300 + 600 = 1,900 tokens
10 回目の対話: 10,000+ tokens
```

OpenClaw に画面監視、定時タスクの実行、計画どおりの運用をさせると、この数字はさらに速く増加します。

### OpenClaw ネイティブ記憶管理の 3 つの主要な欠陥

OpenClaw の記憶はローカルの `.md` ファイルに保存され、グローバル記憶と日次記憶に分かれています。聞こえは良いですが、実際の利用では避けられない 3 つの問題があります：

#### 1. グローバル記憶の膨張が制御不能
グローバル記憶が蓄積し続けるにつれて、コンテキスト過負荷が起こります。さらに悪いことに、これらの記憶は現在の対話に継続的に干渉します――あなたはただ簡単な質問をしたいだけなのに、3 か月前の一言一句まで引っ張り出してくるかもしれません。

#### 2. 日次記憶の検索が困難
日次記憶が蓄積し続けることで、検索が煩雑になります。昨日の活動を思い出すには、追加の検索プロセスを経なければなりません。セッションをまたぐ記憶の維持は、ほとんど不可能になります。

#### 3. 記憶がモデルの能動的な記録に依存
OpenClaw の記憶システムは、自動記録ではなく、モデル自身による情報記録に依存しています。これは、細部をしばしば見落とすことを意味します――何かに言及しても、すぐに忘れてしまいます。

> 私自身も何度か経験しました：あるプロジェクト設定を明確に強調したのに、翌日対話を再開すると、完全に覚えておらず、もう一度説明し直す必要がありました。

---

## OpenClaw vs OpenClaw + MemOS：記憶ソリューション比較

### OpenClaw ネイティブ記憶ソリューション

#### 記憶保存ソリューション

**コア哲学：ファイルこそ真実** — 不透明なベクトルデータベースを捨て、Markdown ファイルを記憶のコアな媒体として選択します。

![OpenClaw記憶ソリューション](https://cdn.memtensor.com.cn/img/1772698365666_utw5a2_compressed.png)

#### 記憶検索ソリューション：デュアルエンジン駆動

| エンジン | 技術 | 特徴 |
|-----|------|------|
| **ベクトル検索** (Vector Search) | コサイン類似度 | セマンティックな関連を捉え、「概念マッチング」の処理に長けており、たとえば「ログインフロー」を「認証」に関連付けます |
| **BM25 検索** (Lexical Matching) | FTS5 ベースの語彙マッチング | エラーコード、関数名、特定の ID などの「正確な Token」を処理します |

**検索トリガー方式**：Prompt によってトリガーされ、モデルが自動で判断

**重み付きスコア融合**：`Score = (0.7 * VectorScore) + (0.3 * BM25Score)`

#### 現行ソリューションの課題

- **検索アルゴリズムが簡素**：リコールが不安定で、関連性が弱く、Agent が何度も試行錯誤し、Token が急速に蓄積
- **コンテキスト注入が過剰**：today + yesterday + 長期記憶を固定で読み込み、無効なコンテキストの割合が高い
- **記憶に構造と冗長性除去が欠如**：ツール呼び出しの長い出力がそのまま書き込まれ、繰り返し再送され、コストが雪だるま式に増加

### OpenClaw + MemOS の記憶ソリューション

![MemOS-OpenClaw](https://cdn.memtensor.com.cn/img/1772627912577_gvwyaz_compressed.png)

#### 3 つのコア効果

**効果一：Token コストを制御可能に 💰**
> 「全量コンテキスト注入」から「タスクごとの正確なリコール」へ

OpenClaw は毎回 today+yesterday+長期記憶を固定で詰め込むのではなく、MemOS が現在のタスクに応じて最も関連性の高い少量の記憶を検索します（リコール予算/件数を設定可能）。これにより、無効なコンテキストの割合を大幅に下げ、Token の雪だるま式増加を防ぎます。

**効果二：検索がより安定し、より正確に 🎯**
> 繰り返しの試行錯誤や再質問を減らし、一発で当たる率を向上

MemOS はより強力な記憶の組織化と検索能力（構造化、階層化/多粒度、セマンティック検索 + ルールフィルタリングなど）を提供し、OpenClaw がリコールする内容の関連性を高め、安定性も向上させます。これにより、「リコールの不安定さ」によって Agent が繰り返し推論したり何度も確認したりすることを減らします。

**効果三：記憶がよりクリーンで使いやすい ✨**
> 構造化 + 冗長性除去 + 高圧縮で、「長い出力による汚染」を回避

ツール呼び出しの長い出力（走査結果、config/schema など）は、そのままの形でコンテキストに繰り返し書き込まれません。MemOS は要約/圧縮、重複排除、アーカイブを行えるため、長期運用するほどより「すっきり」し、記憶の品質は時間とともに劣化するのではなく向上します。

---

## MemOS OpenClaw プラグイン統合後の効果👇🏻

- ✅ 毎回 3-5 件の関連記憶のみを検索
- ✅ 2,000-3,000 tokens 内でコンテキストの安定性を維持
- ✅ 対話がどれほど長くても、コストは常に制御可能なまま

### MemOS プラグインが OpenClaw にもたらす強化

| 機能 | 説明 |
|-----|------|
| **すべての対話を自動記憶** | モデルの能動的な記録に依存せず、重要情報の取りこぼしを防止 |
| **正確なリコール** | 現在のタスク意図に基づいて関連記憶を検索し、無関係な履歴データを回避 |
| **ユーザーの好みを記憶** | 好み情報を専用に分類・保存し、セッションをまたいで有効性を維持 |

MemOS OpenClaw は Token 消費モデルを再構築し、コストを「履歴長関数」から「タスク関連性関数」へと変えました。あなたのローカル OpenClaw のコストは制御可能になり、システムの運用はより安定します。

---

## クイックスタート

わずか 3 ステップで、あなたの Agent に基本的な記憶能力を持たせることができます。

### 1. OpenClaw をインストール

システムに OpenClaw 環境がすでにインストールされていることを確認してください：

```bash
# 最新版をインストール
npm install -g openclaw@latest

# 初期化して起動を設定
openclaw onboard
```

### 2. API Key を取得して設定

#### 2.1 Key を取得

MemOS Cloud にログイン/登録してあなたの API Key を取得 🔗 [MemOS Cloud](https://memos-dashboard.openmem.net/cn/apikeys/)

![image.png](https://cdn.memtensor.com.cn/img/1772443326905_kkxve6_compressed.webp)

#### 2.2 環境変数を設定

プラグインは順番に env ファイルの読み取りを試行します（**openclaw → moltbot → clawdbot**）。各キーについて、その値を含む最初のファイルを優先して使用します。
これらのファイルがすべて存在しない場合（または対応するキーが不足している場合）、プロセス環境変数にフォールバックします。

**設定場所**
- ファイル（優先順位順）：
  - `~/.openclaw/.env`
  - `~/.moltbot/.env`
  - `~/.clawdbot/.env`
- 各行の形式は `KEY=value`

**クイック設定（Shell）**
```bash
echo 'export MEMOS_API_KEY="mpg-..."' >> ~/.zshrc
source ~/.zshrc

# or

echo 'export MEMOS_API_KEY="mpg-..."' >> ~/.bashrc
source ~/.bashrc
```

**クイック設定（Windows PowerShell）**
```powershell
[System.Environment]::SetEnvironmentVariable("MEMOS_API_KEY", "mpg-...", "User")
```

`MEMOS_API_KEY` が不足している場合、プラグインは設定手順と API Key 取得リンクを表示します。

**最小構成**
```env
MEMOS_API_KEY=YOUR_TOKEN
```

### 3. プラグインをインストール

#### 方法 A — NPM（推奨）

```bash
openclaw plugins install @memtensor/memos-cloud-openclaw-plugin@latest
openclaw gateway restart
```

> Windows ユーザーへの注意：`Error: spawn EINVAL` が発生した場合、これは Windows 上の OpenClaw プラグインインストーラーの既知の問題です。以下の方法 B（手動インストール）を使用してください。

`~/.openclaw/openclaw.json` で有効化されていることを確認してください：

```json
{
  "plugins": {
    "entries": {
      "memos-cloud-openclaw-plugin": { "enabled": true }
    }
  }
}
```

#### 方法 B — 手動インストール（Windows 互換方式）

1. [NPM](https://www.npmjs.com/package/@memtensor/memos-cloud-openclaw-plugin) から最新の `.tgz` パッケージをダウンロードします。
2. ローカルディレクトリに展開します（例：`C:\Users\YourName\.openclaw\extensions\memos-cloud-openclaw-plugin`）。
3. `~/.openclaw/openclaw.json`（または `%USERPROFILE%\.openclaw\openclaw.json`）を設定します：

```json
{
  "plugins": {
    "entries": {
      "memos-cloud-openclaw-plugin": { "enabled": true }
    },
    "load": {
      "paths": [
        "C:\\Users\\YourName\\.openclaw\\extensions\\memos-cloud-openclaw-plugin"
      ]
    }
  }
}
```

::info
注意：展開後のディレクトリには通常 `package` サブディレクトリが含まれます。パスは `package.json` を含むフォルダを指すようにしてください。
::

設定を変更した後、gateway を再起動してください。

### 4. プラグインを更新

以下のコマンドでクラウドサービスプラグインを最新バージョンへ手動更新できます：

```bash
openclaw plugins update @memtensor/memos-cloud-openclaw-plugin@latest
openclaw gateway restart
```

## オープンソースプロジェクトの高度な設定

さらに多くの可能性を解放したい場合は、MemOS Github プロジェクトを通じてさらに探索および設定することもできます！

### 可視化設定インターフェース (Config UI)

`v0.1.12` バージョン以降、クラウドプラグインにはローカルの可視化設定サービスが内蔵されており、より直感的にプラグイン設定を管理および変更できます。

**アクセス方法：**
1. OpenClaw ノードまたはホスト gateway を起動します。
2. プラグインが正常にロードされ、gateway の準備完了を検出すると、バックグラウンドで Config UI サービスが自動的に起動します。
3. ターミナルコンソールのログにアクセスリンクが出力されます（デフォルトのアドレスは通常 `http://127.0.0.1:38463` です）。
4. ブラウザでそのリンクを開くと、プラグインの可視化管理バックエンドに入れます。

**機能の特徴：**
- **直感的な編集**：フォーム形式で、すべてのコア設定（ナレッジベース ID、大規模モデル検索パラメータ、複数 Agent のオーバーライドルールなど）を編集できます。
- **リアルタイム同期**：インターフェース上で保存した設定変更は、サービスの再起動なしで直ちにプラグイン実行時に反映されます。
- **状態監視**：インターフェースはホスト gateway とのハートビート検出を提供し、設定同期リンクの健全性を確保します。

### 複数Agent対応と分離（Multi-Agent）

プラグインには複数 Agent モードへの強力なサポートが内蔵されています（`agent_id` パラメータによって実現）。複雑なワークフローやチーム代理シナリオでの使用に非常に適しています。

**1. 有効化とデータ分離**
- **有効化方法**：設定で `"multiAgentMode": true` を設定するか、環境変数 `MEMOS_MULTI_AGENT_MODE=true` を設定します。
- **自動分離**：有効化後、プラグインはコンテキスト内の `ctx.agentId` を自動的に読み取ります。記憶の検索と書き込みを行う際、この Agent 識別子が自動的に付加され、同一ユーザー配下の異なる Agent 間で記憶データが完全に分離されることを保証します（注：デフォルトの `"main"` Agent は旧データとの互換性を保証するため無視されます）。

**2. Agent ごとに記憶を切り替える（ホワイトリスト制御）**
複数 Agent モードでは、すべての Agent に記憶消費を発生させたくない場合、`allowedAgents` を使用してホワイトリストを正確に制御できます：
```json
{
  "plugins": {
    "entries": {
      "memos-cloud-openclaw-plugin": {
        "enabled": true,
        "config": {
          "multiAgentMode": true,
          "allowedAgents": ["research-agent", "coding-agent"]
        }
      }
    }
  }
}
```
*（ヒント：1. `allowedAgents` が未設定または空配列 `[]` の場合、**すべての Agent** が記憶検索と書き込みの使用を許可されることを意味します。2. 設定した場合、設定に含まれない Agent は完全にスキップされ、設定に含まれる Agent のみが記憶検索と書き込みに有効となり、Token の浪費を回避します）。*

**3. Agent ごとに独立してパラメータを設定（agentOverrides）**
単純なオン/オフに加えて、`agentOverrides` を通じて**各 Agent ごとに個別に記憶パラメータを上書き**できます。たとえば、研究アシスタントにはより緩い検索しきい値を持たせ、コードアシスタントには特定のコードベース知識のみを読み取らせることができます：

```json
{
  "plugins": {
    "entries": {
      "memos-cloud-openclaw-plugin": {
        "enabled": true,
        "config": {
          "multiAgentMode": true,
          "allowedAgents": ["research-agent", "coding-agent"],
          "memoryLimitNumber": 6,
          "relativity": 0.45,

          "agentOverrides": {
            "research-agent": {
              "knowledgebaseIds": ["kb-research-papers"],
              "memoryLimitNumber": 12,
              "relativity": 0.3,
              "queryPrefix": "research context: "
            },
            "coding-agent": {
              "knowledgebaseIds": ["kb-codebase"],
              "memoryLimitNumber": 9,
              "addEnabled": false
            }
          }
        }
      }
    }
  }
}
```
*（上記の例では、`coding-agent` は記憶への書き込みを禁止されており、`kb-codebase` ナレッジベース内の関連性が高い上位 9 件の記憶のみを検索できます）。*

### 環境変数の高度なカスタマイズ

必須の API Key に加えて、環境変数によってプラグインの動作を調整できます。

より詳細な設定項目については、[MemTensor GitHub 公式プラグインリポジトリ](https://github.com/MemTensor/MemOS/tree/main/apps/MemOS-Cloud-OpenClaw-Plugin) を参照してください

## 記憶機能をテスト

これで、あなたの Agent と複数ターンの会話ができます。たとえば:

**最初のセッション:**
- "私が最も好きなプログラミング言語は Python です"
- "私は EC プロジェクトを開発しています"

**2 回目のセッション(新規起動):**
- "私がどのプログラミング言語を使うのが好きか、まだ覚えていますか?"
- "以前話したプロジェクトの進捗はどうですか?"

これで、あなたの OpenClaw は MemOS Cloud から記憶を検索して正確に回答してくれます～
