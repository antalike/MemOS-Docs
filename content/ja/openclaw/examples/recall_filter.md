---
title: 記憶リコールの二次フィルタリング
---
## Cloud Plugin

MemOS Openclaw Cloud Plugin は、指定した大規模言語モデルを使用して、リコールされた記憶に対して二次的な高精度フィルタリングを行うことをサポートします。フィルタリング後、現在のタスクと高度に関連する記憶のみがコンテキストに注入され、無関係な記憶の干渉を効果的に回避し、Token を節約します。

### How To Use

OpenAI 形式と互換性のあるモデルインターフェース（ローカルの Ollama やサードパーティの大規模言語モデル API など）を設定し、フィルタリングスイッチを有効にするだけで、記憶の二次フィルタリング機能を有効化できます。

#### 1. 記憶フィルタリング機能を有効化

大規模言語モデルによる記憶フィルタリングを設定する際は、**必ず** API Key と Base URL を設定する必要があります。

`openclaw.json` の設定に追加します：
```json
{
  "plugins": {
    "entries": {
      "memos-cloud-openclaw-plugin": {
        "config": {
          "recallFilterEnabled": true,
          "recallFilterBaseUrl": "http://127.0.0.1:11434/v1",
          "recallFilterApiKey": "sk-...",
          "recallFilterModel": "qwen2.5_7b"
        }
      }
    }
  }
}
```

または環境変数を設定します：
```bash
MEMOS_RECALL_FILTER_ENABLED=true
MEMOS_RECALL_FILTER_BASE_URL="http://127.0.0.1:11434/v1"
MEMOS_RECALL_FILTER_API_KEY="sk-..."
MEMOS_RECALL_FILTER_MODEL="qwen2.5_7b"
```

#### 2. 認証と高度なパラメータを設定（任意）

タイムアウト時間および失敗時の戦略を調整する必要がある場合は、設定で次を指定できます：
```json
{
  "config": {
    "recallFilterTimeoutMs": 6000,
    "recallFilterFailOpen": true
  }
}
```

### 原理紹介
- **リコール後のインターセプト**：各ラウンドの対話前にクラウドから記憶をリコールした後、プラグインは候補となる記憶エントリを、設定したフィルタリングモデルに送信して二次選別を行います。
- **高精度な保持**：フィルタリングモデルが判定した後、`keep` とマークされた関連エントリのみを保持し、最終的に Agent のコンテキストに注入します。
- **高可用性フォールバック**：デフォルトで失敗時許可（`recallFilterFailOpen: true`）が有効になっています。フィルタリングモデルへのリクエストがタイムアウトまたは失敗した場合、自動的に「フィルタリングなし」で全量注入にフォールバックし、現在の対話が中断されないことを保証します。

### 適用シナリオ
- **超長期記憶の簡素化**：長期対話で大量の記憶が蓄積された場合、現在の Prompt と無関係な内容を除去し、メインモデルのコンテキストにおける Token 消費を大幅に削減します。
- **推論精度の向上**：複雑なタスクの処理に集中する必要がある Agent のために、初期の無関係な記憶による干渉をフィルタリングし、コアタスクの推論精度を高めます。
- **ローカルモデル連携**：ローカルで実行する小型モデル（Ollama で実行する `qwen2.5_7b` など）を低コストの前段フィルタとして組み合わせ、メインモデルの API コストを増やすことなく記憶注入の品質を向上させます。

---

## Local Plugin

MemOS Openclaw Local Plugin は、大規模言語モデルによる記憶の二次フィルタリングをサポートしており、リコール後に無関係な内容を除外するために使用されます。

### 設定例

Memory Viewer でモデルを手動設定することも、`～/.openclaw/openclaw.json` でモデルを設定することもできます：

```json
{
  "agents": {
    "defaults": {
      "memorySearch": { "enabled": false }
    }
  },
  "plugins": {
    "entries": {
      "memos-local-openclaw-plugin": {
        "enabled": true,
        "config": {
          "summarizer": {
            "provider": "openai_compatible",
            "endpoint": "https://your-api-endpoint/v1",
            "apiKey": "${OPENAI_API_KEY}",
            "model": "gpt-4o-mini",
            "temperature": 0
          }
        }
      }
    }
  }
}
```

### 期待される結果

- 各ラウンドの auto-recall では、まず候補をリコールし、その後大規模言語モデルがフィルタリングを実行
- コンテキストに注入される記憶がより焦点化され、ノイズが少なくなる
- モデルが利用できない場合は自動的にフォールバックし、基本的なリコールには影響しない
