---
title: 高度なタスク同期 (Advanced Task Synchronization)
desc: ブロッキング待機とストリーミング進捗観測機能を提供し、後続操作を実行する前に、指定ユーザーの非同期タスクがすべて処理完了していることを保証します。
---


**インターフェースパス**：
* **同期ブロッキング待機**：`POST /product/scheduler/wait`
* **リアルタイム進捗ストリーム (SSE)**：`GET /product/scheduler/wait/stream`

**機能説明**：自動化スクリプト、データ移行、または統合テストのシナリオでは、通常、すべての非同期メモリ抽出タスク（LLM 事実抽出、ベクトル保存など）が完全に終了していることを保証する必要があります。本モジュールのインターフェースでは、スケジューラが対象ユーザーのタスクキューが空になったことを検出するまで、クライアントがリクエストを「一時停止」できます。

## 1. コアメカニズム：スケジューラアイドル検出

システムは **SchedulerHandler** を通じて、基盤となる **MemScheduler** の実行状態をリアルタイムで監視します：

* **キューチェック**：システムは Redis Stream 内でそのユーザーに属する処理待ちタスク（Pending）およびキュー待機タスク（Remaining）を確認します。
* **アイドル判定**：キュー数が 0 であり、かつ現在そのユーザーのタスクを実行中の Worker が存在しない場合にのみ、「アイドル (Idle)」と判定されます。
* **タイムアウト保護**：無期限のブロッキングを防ぐため、インターフェースでは `timeout_seconds` の設定をサポートしています。上限に達してもタスクが未完了の場合、インターフェースは現在の状態を返して待機を停止します。



## 2. 主要インターフェースパラメータ

これら2つのインターフェースは、以下のクエリパラメータ（Query Parameters）を共有します：

| パラメータ名 | 型 | 必須 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| **`user_name`** | `str` | はい | - | 対象ユーザーの名前または ID。 |
| `timeout_seconds`| `num` | いいえ | - | 最大待機時間（秒）。この時間を超えると自動的に返されます。 |
| `poll_interval` | `num` | いいえ | - | 内部でキュー状態を確認する頻度（秒）。 |

## 3. レスポンスモードの選択

### 3.1 同期ブロッキングモード (`/wait`)
* **特徴**：標準の HTTP レスポンスです。接続は、タスクが空になるかタイムアウトするまで開いたまま維持されます。
* **シナリオ**：自動化テストスクリプトを作成する場合や、`search` を実行する前にデータが保存済みであることを保証する場合。

### 3.2 リアルタイムストリーミングモード (`/wait/stream`)
* **特徴**：**Server-Sent Events (SSE)** 技術に基づいています。
* **シナリオ**：管理画面で動的な進捗バーを表示し、タスクキューの縮小過程をリアルタイムに表示します。

## 4. クイックスタート例

オープンソース版 SDK を使用してブロッキング待機を行います：

```python
from memos.api.client import MemOSClient

client = MemOSClient(api_key="...", base_url="...")
user_name = "dev_user_01"

# --- シナリオ A：同期ブロッキング待機 (通常は Python 自動化スクリプトで使用) ---
print(f"ユーザー {user_name} のタスクキューが空になるのを待機しています...")
res = client.wait_until_idle(
    user_name=user_name, 
    timeout_seconds=300, 
    poll_interval=2
)
if res and res.code == 200:
    print("✅ すべてのタスクが完了しました。")

# --- シナリオ B：ストリーミング進捗観測 (通常はフロントエンドの進捗バー描画で使用) ---
print("タスクのリアルタイム進捗ストリームの監視を開始します...")
# 注意：SSE インターフェースは SDK では通常ジェネレーター (Generator) を返します
progress_stream = client.stream_scheduler_progress(
    user_name=user_name,
    timeout_seconds=300
)

for event in progress_stream:
    # 残りタスク数をリアルタイムで出力
    print(f"現在のキュー待機タスク数: {event['remaining_tasks_count']}")
    if event['status'] == 'idle':
        print("🎉 スケジューラはすでにアイドルです")
        break
```
