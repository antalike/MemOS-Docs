---
title: Hermes ローカルプラグイン
desc: Hermes Agent に完全ローカル化された永続メモリ、インテリジェントなタスク要約、スキル自動進化、およびマルチエージェント協調を提供します。
---

MemOS Hermes ローカルプラグインは **Hermes Agent** に完全ローカル化された永続メモリ機能を提供します。すべてのデータはローカルの SQLite（`~/.hermes/memos-state/`）に保存され、クラウド依存はゼロです。Viewer は 127.0.0.1 のみをリッスンし、パスワード保護されています。

## コア機能

| 機能 | 説明 |
|------|------|
| 💾 全量メモリ書き込み | 各対話を自動でキャプチャし、意味的にチャンク化した後に永続化します。 |
| ⚡ タスク要約とスキル進化 | 断片的な対話を構造化タスクとして要約し、さらに再利用可能なスキルへと抽出して継続的にアップグレードします。 |
| 🔍 ハイブリッド検索 | FTS5 + ベクトル、RRF、MMR、時間減衰。 |
| 🧠 全量可視化 | メモリ/タスク/スキル/分析/ログ/インポート/設定 の 7 つの管理ページ。 |
| 💰 階層化モデル | Embedding/要約/スキルはそれぞれ異なるモデルを個別に設定可能。 |
| 🤝 マルチエージェント協調 | メモリ分離 + パブリックメモリ + スキル共有、複数 Agent の協調進化。 |
| 🐍 Python ネイティブ統合 | MemoryProvider インターフェースを通じて Hermes Agent にネイティブ統合し、追加の設定ゲートウェイは不要。 |
| 👥 チーム共有センター | Hub-Client アーキテクチャにより、インスタンス間でメモリ/タスク/スキルを共有。承認フロー、ロール管理、リアルタイム通知。 |
| 🔗 LLM インテリジェントフォールバック | スキルモデル → 要約モデル → Hermes ネイティブモデルの 3 段階自動フォールバック、手動介入ゼロ。 |

---

## システムアーキテクチャ

Hermes Agent は Python MemoryProvider インターフェースを通じて MemOS ブリッジデーモンと通信します。4 つのパイプライン：メモリ書き込み → タスク要約とスキル進化（非同期）→ インテリジェント検索 → 協調共有。各 Agent は独立したメモリ空間を持ち、パブリックメモリとスキル共有を通じて協調進化を実現します。

```
パイプライン 1：書き込み
Hermes Agent → Bridge Daemon (TCP :18992) → Ingest (chunk→summary→embed→dedup) → SQLite+FTS5

パイプライン 2：タスク & スキル（非同期）
Task Processor (トピック検出 → 要約) → Skill Evolver (評価 → 生成/アップグレード)

パイプライン 3：自動リコール
prefetch (auto-recall) → Recall (FTS+Vector) → LLM filter → Inject context

パイプライン 4：オンデマンド検索
Agent (memory_search) → RRF→MMR→Decay → LLM filter → excerpts+chunkId/task_id
→ task_summary / skill_get / memory_timeline
```

### データフロー

#### 書き込み
1. `sync_turn` → Bridge Daemon → Chunk → LLM Summary → Embed → Dedup → Store
2. 非同期：タスク検出 → タスク要約 → スキル評価 → スキル生成/アップグレード

#### 検索
1. 各ラウンド自動：`prefetch` がユーザーメッセージで検索 → LLM が関連性をフィルタ → system コンテキストへ注入；結果がない場合は agent に query を自動生成して `memory_search` を呼び出すよう促します。
2. `memory_search` → FTS5+Vector → RRF → MMR → Decay → LLM filter → excerpts + chunkId/task_id
3. `task_summary` / `skill_get`(skillId|taskId) / `memory_timeline`(chunkId) / `skill_install`

---

## クイックスタート

### 前提条件

- **Node.js** ≥ 18
- **Python 3**
- **Hermes Agent** インストール済み（`~/.hermes/hermes-agent` またはローカルリポジトリ）
- Embedding / Summarizer API はオプション、未設定時は自動的にローカルモデルを使用

### Step 1：ワンクリックインストール（推奨）

1 つのコマンドですべてのインストールが完了し、手動操作は不要です：

```bash
curl -fsSL https://raw.githubusercontent.com/MemTensor/MemOS/openclaw-local-plugin-20260408/apps/memos-local-plugin/install.sh | bash
```

#### npm でインストール

```bash
mkdir -p ~/.hermes/memos-plugin && cd ~/.hermes/memos-plugin && npm pack @memtensor/memos-local-hermes-plugin && tar xzf *.tgz && mv package/* . && rm -rf package *.tgz && bash install.sh
```

::note
インストーラーは何を行いますか？ Node.js を自動検出してインストール（不足時）→ npm からプラグインパッケージをダウンロード → 依存関係をインストール → Hermes プラグインディレクトリに `memtensor` のシンボリックリンクを作成 → `~/.hermes/config.yaml` を更新 → プラグインのロードを検証 → Bridge デーモンと Memory Viewer を起動します。
::

::warning
インストール失敗？最も一般的な問題は `better-sqlite3` ネイティブモジュールのコンパイル失敗です。ビルドツールチェーン（`gcc`, `make`, `python3`）がインストールされていることを確認してください。Ubuntu/Debian では：`apt install build-essential`。
::

### Step 2：使い始める

```bash
hermes chat
```

インストールスクリプトは自動的に Memory Viewer を起動します。その後は毎回 `hermes chat` を実行すると、daemon が自動起動されます（まだ実行されていない場合）。hermes 終了後も daemon はバックグラウンドで実行され続けます。

::tip
インストール後、各対話は自動的にメモリに保存されます。`http://127.0.0.1:18901` にアクセスして Memory Viewer を確認してください。
::

### Step 3：設定

**2 つの方法**：`~/.hermes/config.yaml` を編集するか、Viewer の Web パネルからオンラインで変更します。階層化モデルをサポートします。

#### 基本設定 (config.yaml)

```yaml
# ~/.hermes/config.yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  provider: memtensor
```

#### モデル階層化設定（環境変数経由）

```bash
# Embedding — 軽量モデル
export MEMOS_EMBEDDING_PROVIDER="openai_compatible"
export MEMOS_EMBEDDING_API_KEY="sk-••••••"
export MEMOS_EMBEDDING_ENDPOINT="https://your-api-endpoint/v1"

# カスタムポート
export MEMOS_DAEMON_PORT=18992
export MEMOS_VIEWER_PORT=18901

# カスタムデータディレクトリ
export MEMOS_STATE_DIR="/custom/path/memos-state"
```

#### 高度な設定（Bridge 設定 JSON 経由）

```bash
export MEMOS_BRIDGE_CONFIG='{
  "stateDir": "~/.hermes/memos-state",
  "config": {
    "embedding": {
      "provider": "openai_compatible",
      "model": "bge-m3",
      "endpoint": "https://your-api-endpoint/v1",
      "apiKey": "sk-••••••"
    },
    "summarizer": {
      "provider": "openai_compatible",
      "model": "gpt-4o-mini",
      "endpoint": "https://your-api-endpoint/v1",
      "apiKey": "sk-••••••"
    },
    "skillEvolution": {
      "summarizer": {
        "provider": "openai_compatible",
        "model": "claude-4.6-opus",
        "endpoint": "https://your-api-endpoint/v1",
        "apiKey": "sk-••••••"
      }
    },
    "recall": {
      "vectorSearchMaxChunks": 0
    },
    "viewerPort": 18901
  }
}'
```

---

## モジュール

### Capture
`sync_turn` インターフェースを通じて各ラウンドの user/assistant メッセージをキャプチャし、`on_memory_write` を通じてユーザープロファイル更新をキャプチャします。Bridge デーモンを経由して Ingest パイプラインに渡されます。

### Ingest
非同期キュー：意味的チャンク化 → LLM 要約 → ベクトル化 → インテリジェント重複排除（Top-5 類似 + LLM による DUPLICATE/UPDATE/NEW 判定、UPDATE は要約をマージし内容を追記）→ 保存；進化ブロックは merge_history を記録します。

### タスク要約
非同期で各ラウンドのタスク境界を検出：ユーザーターンごとにグループ化 → 最初の 1 条は直接割り当て → 以後の各条は LLM がトピック切り替えの有無を判定（SAME を強く優先し、過剰分割を回避）→ 2h タイムアウトで強制分割 → 構造化要約（目標/手順/結果）。編集、削除、スキル生成の再試行をサポート。

### スキル進化
ルールフィルタ → LLM 評価（反復可能で価値のあるタスクのみスキルを生成）→ SKILL.md 生成（手順/警告/スクリプト）/ アップグレード → 品質スコアリング → インストール。LLM は 3 段階フォールバックチェーン（スキルモデル → 要約モデル → Hermes ネイティブモデル）を使用します。編集、削除、公開/非公開の設定をサポート。

### Recall
FTS5+Vector → RRF(k=60) → MMR(λ=0.7) → Decay(14d) → Normalize → Filter(≥0.45) → Top-K。Task/Skill を自動関連付けします。

### Viewer
7 ページ：メモリ CRUD/検索/進化識別、タスク（対話バブル）、スキル（バージョン/ダウンロード）、分析、ログ（ツール呼び出し入出力）、インポート、オンライン設定。パスワード保護。デフォルトポートは `18901`。

---

## 検索アルゴリズム

### RRF（逆数順位融合）

$$\text{RRF}(d) = \sum_i \frac{1}{k + \text{rank}_i(d) + 1}$$

### MMR（最大限界関連性）

$$\text{MMR}(d) = \lambda \cdot \text{rel}(d) - (1-\lambda) \cdot \max \text{sim}(d, d_s)$$

### 時間減衰

$$\text{final} = \text{score} \times \bigl(0.3 + 0.7 \times 0.5^{t/14}\bigr)$$

---

## LLM フォールバックチェーン

すべての LLM 呼び出し（要約、トピック検出、重複排除、スキル生成/アップグレード）は 3 段階自動フォールバック機構を使用します：

```
skillSummarizer（スキル専用モデル、オプション）→ summarizer（汎用要約モデル）→ Hermes Native（自動検出）
```

- 各段階の失敗後、自動的に次の段階を試行し、手動介入は不要
- `skillSummarizer` が未設定の場合は直接 `summarizer` にスキップ
- すべてのモデルが失敗した場合は、ルールベース手法（LLM なし）にフォールバックするか、そのステップをスキップ

---

## 環境変数

| 変数 | デフォルト | 説明 |
|------|------|------|
| `MEMOS_STATE_DIR` | `~/.hermes/memos-state` | メモリデータベースの場所 |
| `MEMOS_DAEMON_PORT` | `18992` | Bridge デーモンの TCP ポート |
| `MEMOS_VIEWER_PORT` | `18901` | Memory Viewer の HTTP ポート |
| `MEMOS_EMBEDDING_PROVIDER` | `local` | Embedding プロバイダー |
| `MEMOS_EMBEDDING_API_KEY` | — | Embedding API キー |
| `MEMOS_EMBEDDING_ENDPOINT` | — | カスタム Embedding エンドポイント |
| `MEMOS_BRIDGE_CONFIG` | — | 完全な Bridge 設定 JSON |
| `MEMOS_BRIDGE_SCRIPT` | — | Bridge スクリプトパスのオーバーライド |
| `HERMES_HOME` | `~/.hermes` | Hermes ホームディレクトリ |

---

## デフォルト値

| パラメータ | デフォルト | 説明 |
|------|------|------|
| maxResults | 6 (max 20) | デフォルトの返却数 |
| minScore (tool) | 0.45 | memory_search の最低スコア |
| minScore (viewer) | 0.64 | Viewer 検索のベクトルしきい値 |
| rrfK | 60 | RRF 融合定数 |
| mmrLambda | 0.7 | MMR 関連性 vs 多様性 |
| recencyHalfLife | 14d | 時間減衰の半減期 |
| vectorSearchMaxChunks | 0 (all) | 0=すべて検索；大規模データベースでは 200k-300k を設定可能 |
| dedup threshold | 0.75 | 意味的重複排除のコサイン類似度 |
| viewerPort | 18901 | Memory Viewer |
| daemonPort | 18992 | Bridge Daemon TCP |
| owner | hermes | メモリ所有識別子 |
| taskIdle | 2h | タスクアイドルタイムアウト |

---

## その他の資料

- [GitHub](https://github.com/MemTensor/MemOS/tree/main/apps/memos-local-plugin)
