---
title: マルチエージェントメモリ分離
---
## クラウドプラグイン

MemOS Openclaw クラウドプラグインは、複数の Agent 間でメモリとメッセージ履歴を完全に分離することをサポートします。各 Agent は自分自身のメモリのみを見ることができ、混線しません。

### 使用方法 

簡単な設定だけで、異なる Agent に独立したメモリ空間を持たせることができます。自動識別と静的指定の2つのモードをサポートします。

#### 1. マルチ Agent モードを有効化

`openclaw.json` 設定に追加します：

```json
{
  "plugins": {
    "entries": {
      "memos-cloud-openclaw-plugin": {
        "config": {
          "multiAgentMode": true
        }
      }
    }
  }
}
```

または環境変数を設定します：

```bash
MEMOS_MULTI_AGENT_MODE=true
```

#### 2. Agent を自動識別

有効化後、プラグインは自動的に `ctx.agentId` を読み取り、異なる Agent のメモリを自動的に分離します。追加設定は不要です。

#### 3. Agent を静的指定（任意）

特定の Agent ID を固定する必要がある場合は、設定で指定できます：

```json
{
  "config": {
    "agentId": "marketing_agent"
  }
}
```

### 仕組みの紹介

- **/search/memory**：メモリを検索——現在の Agent のメモリのみを返します
- **/add/message**：記録を追加——現在の Agent のデータとして自動的にマークします
- **下位互換**：デフォルト Agent `"main"` は無視され、既存ユーザーのシングル Agent データに影響しないことを保証します

### 適用シーン

- **マルチロール協調**：戦略/業務/マーケティング/技術 Agent が役割分担して協調
- **業務ライン独立**：異なる業務ラインの Agent が独立して動作し、互いに干渉しない
- **ペルソナ一貫性**：Agent の長期的なペルソナと行動スタイルの一貫性を維持

---

## ローカルプラグイン

MemOS Openclaw ローカルプラグインは、マルチ Agent シナリオにおいてデフォルトで3つの機能をサポートします：メモリ分離、公共メモリ、スキル共有。

### ルール

- プライベートメモリ：`owner = agent:{agentId}`、現在の Agent のみ検索可能
- 公共メモリ：`owner = public`、すべての Agent が検索可能
- プライベートスキル：`visibility = private`、スキル所有者のみが閲覧可能
- 公共スキル：`visibility = public`、他の Agent が検索してインストール可能

### 操作例

```text
Agent Alpha:
  memory_search("deploy config")
  → sees own + public memories only
  memory_write_public("shared deploy config")
  skill_publish("nginx-proxy") ✓ now public

Agent Beta:
  memory_search("alpha private deploy detail")
  → no alpha private memories
  memory_search("shared deploy config")
  → found public memory
  skill_search("nginx deployment")
  → Found: nginx-proxy (public)
  skill_install("nginx-proxy") ✓ installed
```

### 期待される結果

- Alpha と Beta のプライベートメモリは相互に見えない
- `memory_write_public` で書き込まれた内容は双方が検索可能
- Alpha が公共スキルを公開した後、Beta は検索してインストール可能
