---
title: タスクスケジューリングト状態監視 (Scheduler Status)
desc: MemOS 非同期タスクのライフサイクルを監視し、タスク進捗、キュー滞留、システム負荷を含む包括的な観測能力を提供します。
---

**インターフェースパス**：
* **システムレベル概要**：`GET /product/scheduler/allstatus`
* **タスク進捗照会**：`GET /product/scheduler/status`
* **ユーザーキュー指標**：`GET /product/scheduler/task_queue_status`

**機能説明**：本モジュールのインターフェースは、開発者に非同期メモリ生成パスの可観測性を提供することを目的としています。これらのインターフェースを通じて、特定タスクの完了状態をリアルタイムで追跡し、Redis タスクキューの滞留状況を監視し、さらにスケジューリングシステム全体の稼働指標を取得できます。

## 1. コアメカニズム：MemScheduler スケジューリング体系

オープンソースアーキテクチャでは、**MemScheduler** がすべての高時間コストのバックグラウンドタスク（LLM メモリ抽出、ベクトルインデックス構築など）を処理します：

* **状態遷移**：タスクはライフサイクル内で `waiting` (待機中)、`in_progress` (実行中)、`completed` (完了済み) または `failed` (失敗) などの状態を経ます。
* **キュー監視**：システムは Redis Stream に基づいてタスク配信を実装します。`pending` (配信済み未確認) および `remaining` (キュー待機中) のタスク数を監視することで、システムの処理負荷を評価できます。
* **多次元観測**："単一タスク"、"単一ユーザーキュー"、および"全システム summary" の 3 つの次元から状態の可視化をサポートします。


## 2. インターフェース詳細

### 2.1 タスク進捗照会 (`/status`)
特定の非同期タスクの現在の実行段階を追跡するために使用されます。

| パラメータ名 | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| **`user_id`** | `str` | はい | 照会対象ユーザーの一意識別子。 |
| `task_id` | `str` | いいえ | 任意。指定された場合、その特定タスクの状態のみを照会します。 |

**返却状態説明**：
* `waiting`: タスクはすでにキューに入り、空き Worker による実行を待っています。
* `in_progress`: Worker が大規模モデルを呼び出してメモリを抽出するか、データベースに書き込んでいます。
* `completed`: メモリは正常に永続化され、ベクトルインデックス同期が完了しています。
* `failed`: タスク失敗。

### 2.2 ユーザーキュー指標 (`/task_queue_status`)
指定ユーザーの Redis 内でのタスク滞留状況を監視するために使用されます。

| パラメータ名 | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| **`user_id`** | `str` | はい | キュー状況を照会する必要があるユーザー ID。 |

**コア指標項目**：
* `pending_tasks_count`: Worker に配信済みだが、まだ確認（Ack）を受信していないタスク数。
* `remaining_tasks_count`: 現在もキュー内で割り当て待ちとなっているタスク総数。
* `stream_keys`: 一致した Redis Stream キー名のリスト。

### 2.3 システムレベル概要 (`/allstatus`)
スケジューラーのグローバルな稼働概要を取得し、通常は管理者バックエンド監視に使用されます。

* **コア返却情報**：
    * `scheduler_summary`: システム現在の負荷と健全性状況を含みます。
    * `all_tasks_summary`: 実行中およびキュー待機中のすべてのタスクの集計統計。

## 3. 動作原理 (SchedulerHandler)

状態照会リクエストを開始すると、**SchedulerHandler** は以下の操作を実行します：

1. **キャッシュ検索**：まず Redis 状態キャッシュから `task_id` に対応するリアルタイム進捗を検索します。
2. **キュー確認**：キュー指標を照会する場合、Handler は Redis 統計コマンド（`XLEN`, `XPENDING` など）を呼び出して Stream 状態を分析します。
3. **指標集約**：グローバル状態リクエストに対して、Handler はすべてのアクティブノードの指標を集約し、システムレベルの summary データを生成します。

## 4. クイックスタート例

SDK を使用してタスク状態を完了までポーリングします：

```python
from memos.api.client import MemOSClient
import time

client = MemOSClient(api_key="...", base_url="...")

# 1. システムレベル概要：MemOS システム全体の稼働健全性を確認
global_res = client.get_all_scheduler_status()
if global_res:
    print(f"システム稼働概要: {global_res.data['scheduler_summary']}")

# 2. キュー指標監視：特定ユーザーのタスク滞留状況を確認
queue_res = client.get_task_queue_status(user_id="dev_user_01")
if queue_res:
    print(f"未処理タスク数: {queue_res.data['remaining_tasks_count']}")
    print(f"配信済み未完了タスク数: {queue_res.data['pending_tasks_count']}")

# 3. タスク進捗追跡：特定タスクを終了までポーリング
task_id = "task_888999"
while True:
    res = client.get_task_status(user_id="dev_user_01", task_id=task_id)
    if res and res.code == 200:
        current_status = res.data[0]['status'] # data は状態リスト
        print(f"タスク {task_id} の現在状態: {current_status}")
        
        if current_status in ['completed', 'failed', 'cancelled']:
            break
    time.sleep(2)
```
