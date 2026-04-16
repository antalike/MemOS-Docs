---
title: クラウドプラグイン vs ローカルプラグイン
desc: 2つのプラグインはいずれも OpenClaw に永続メモリ機能を提供できますが、対象となるシナリオは大きく異なります。この記事では、両者の中核的な違いを素早く理解し、自分に最も適した方案を見つける手助けをします。
---

## プラグイン概要

### クラウドプラグイン

メモリを **MemOS Cloud** にホストし、API Key を1つ設定するだけで使用でき、複数の Agent によるデバイス間でのメモリ共有をサポートし、ベンチマークテストにより約 **72% の Token 消費削減** が可能で、迅速に使い始めたい場合やチーム協業のシナリオに適しています。

### ローカルプラグイン

メモリを**ローカルマシン（SQLite）**に完全保存し、クラウド依存ゼロで、ハイブリッド検索（FTS5 + ベクトル）、Task の自動要約と Skill の自己進化をサポートし、さらにローカル Memory Viewer 管理画面（7つの管理ページ）を備えています。プライバシー、安全性、またはローカル実行により高い要件を持つ開発者に適しています。

---

## 中核的な違い

| 比較観点 | ☁️&nbsp;MemOS&nbsp;クラウドプラグイン | 🖥️&nbsp;MemOS&nbsp;ローカルプラグイン |
| --- | --- | --- |
| 💾&nbsp;**データ保存とプライバシー** | **クラウド保存**：メモリデータは MemOS クラウドに保存され、デバイス間・マルチインスタンスでの共有に便利です。プライバシーとセキュリティはクラウドサービス提供者に依存します。 | **ローカル保存**：すべてのデータ（SQLite + ベクトル）はユーザーのローカルに保存され、完全オフライン実行をサポートし、データを 100% 自主的に制御でき、最高レベルのプライバシーとセキュリティ要件を満たします。 |
| 🔑&nbsp;**API&nbsp;Key** | MemOS Cloud API Key（MemOS により提供） | Embedding モデル API Key（自分で用意、ローカルモデルを設定して Key なしにすることも可能） |
| 🔍&nbsp;**検索能力** | クラウドのセマンティックベクトル検索 + グラフ検索 | FTS5 全文 + ベクトル混合リコール（RRF + MMR + 時間減衰） |
| 🧠&nbsp;**メモリ進化** | クラウドサービスにより自動で完了：書き込まれたメモリに対して構造化処理、冗長性除去、自然言語誤り訂正を行います | 断片的な会話を自動で構造化されたタスクに要約し、タスク完了後にスキル評価をトリガーし、再利用可能な Skill を自動生成またはアップグレードします |
| 👥&nbsp;**多&nbsp;Agent** | ✅ サポート（`multiAgentMode`、データ分離） | ✅ サポート（メモリ分離 + 共有メモリ + Skill 共有） |
| 💡&nbsp;**追加機能** | • Token コストを 72% 削減<br>• すべての会話を自動記録<br>• ユーザー設定を専用分類<br>• 低遅延、高並行の本番環境をサポート | • 全量メモリの可視化（Web 管理パネル、7ページ）<br>• ネイティブメモリのワンクリックインポート<br>• 階層型モデル設定（異なるタスクに異なるモデルを割り当て） |
| 🛠️&nbsp;**デプロイと設定** | **非常に簡単**：3ステップで完了（プラグインのインストール、API Key の取得、環境変数の設定）、主にクラウドサービスに依存します。 | **中程度**：ローカルのビルド環境を準備し、Embedding、Summarizer など複数のモデルを自分で設定する必要があります（ローカルまたはクラウドモデルをサポート）。柔軟性は高いですが、初期設定はやや複雑です。 |

---

## インストール早見

### クラウドプラグイン（3ステップで完了）

1. **プラグインをインストール**
    ```bash
    openclaw plugins install @memtensor/memos-cloud-openclaw-plugin@latest
    ```

2. **API Key を取得して設定**

    API Key を取得：[MemOS Cloud Dashboard](https://memos-dashboard.openmem.net/cn/apikeys/)

    ```bash
    mkdir -p ~/.openclaw && echo "MEMOS_API_KEY=mpg-..." > ~/.openclaw/.env
    ```

3. **gateway を再起動**

    ```bash
    openclaw gateway restart
    ```

**プラグインを手動更新**：
```bash
openclaw plugins update @memtensor/memos-cloud-openclaw-plugin@latest
openclaw gateway restart
```

> 詳細情報は [Openclaw クラウドプラグインドキュメント](/cn/openclaw/guide#快速开始) を参照してください

### ローカルプラグイン（先にビルド環境の準備が必要）
```bash
# macOS
xcode-select --install
# Linux
sudo apt install build-essential python3

# プラグインをインストール
curl -fsSL https://cdn.memtensor.com.cn/memos-local-openclaw/install.sh | bash
```

> ビルド完了後、openclaw gateway および memos-local-openclaw-plugin プラグインが自動的に起動します。続いて http://127.0.0.1:18799 を開くだけで Memory Viewer にアクセスし、異なるモデルを設定できます。
>
> 完全な設定（Embedding、Summarizer、Skill Evolution 階層型モデル）については [OpenClaw ローカルプラグインドキュメント](/cn/openclaw/local_plugin#快速开始) を参照してください
