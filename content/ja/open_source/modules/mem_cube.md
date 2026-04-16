---
title: MemCube
desc: "MemCube はあなたの「記憶収納ボックス」であり、3種類の記憶を統一管理します：明文記憶、活性化記憶、パラメータ化記憶。簡潔なインターフェースを提供し、複数の記憶モジュールの読み込み、保存、操作を容易にし、開発者が記憶強化アプリケーションを簡単に構築、保存、共有できるようにします。"
---
## What Is MemCube?

**MemCube** は、3つの主要な種類の記憶を含むコンテナです：

- **明文記憶** (例：`GeneralTextMemory`、`TreeTextMemory`): 非構造化または構造化テキスト知識の保存と検索に使用されます。
- **活性化記憶** (例：`KVCacheMemory`): キー・バリューキャッシュを保存し、LLM 推論とコンテキスト再利用を高速化するために使用されます。
- **パラメータ化記憶** (例：`LoRAMemory`): モデル適応パラメータ（LoRA 重みなど）を保存するために使用されます。

各記憶は独立して設定でき、アプリケーション要件に応じて柔軟に組み合わせることができます。

## Structure

MemCube は設定によって定義されます（`GeneralMemCubeConfig` を参照）。この設定は各記憶タイプのバックエンドと設定を指定します。典型的な構造は次のとおりです：

```
MemCube
 ├── user_id
 ├── cube_id
 ├── text_mem: TextualMemory
 ├── act_mem: ActivationMemory
 └── para_mem: ParametricMemory
```

すべての記憶モジュールは MemCube インターフェースを通じてアクセスできます：

- `mem_cube.text_mem`
- `mem_cube.act_mem`
- `mem_cube.para_mem`

## View Architecture

MemOS 2.0 以降、ランタイム操作（add/search）は **View Architecture** を通じて行う必要があります：

### SingleCubeView

単一の MemCube を管理するために使用されます。システムが1つの記憶空間だけを必要とする場合に使用します。

```python
from memos.multi_mem_cube.single_cube import SingleCubeView

view = SingleCubeView(
    cube_id="my_cube",
    naive_mem_cube=naive_mem_cube,
    mem_reader=mem_reader,
    mem_scheduler=mem_scheduler,
    logger=logger,
    searcher=searcher,
    feedback_server=feedback_server,  # オプション
)

# 記憶を追加
view.add_memories(add_request)

# 記憶を検索
view.search_memories(search_request)
```

### CompositeCubeView

複数の MemCube を管理するために使用されます。複数の記憶空間にまたがる統一操作が必要な場合に使用します。

```python
from memos.multi_mem_cube.composite_cube import CompositeCubeView

# 複数の SingleCubeView を作成
view1 = SingleCubeView(cube_id="cube_1", ...)
view2 = SingleCubeView(cube_id="cube_2", ...)

# 複数 cube 操作用の複合ビュー
composite = CompositeCubeView(cube_views=[view1, view2], logger=logger)

# すべての cube をまたいで検索
results = composite.search_memories(search_request)
# 結果には出所を識別するための cube_id フィールドが含まれます
```

### API Request Fields

#### Add Memory (add モード)

| フィールド                  | 説明                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `writable_cube_ids` | add 操作の対象 cube                                              |
| `async_mode`        | `"async"`（scheduler バックグラウンド処理を有効化）または `"sync"`（scheduler を無効化して同期処理） |

#### Search Memory (search モード)

| フィールド                  | 説明                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `readable_cube_ids` | search 操作の対象 cube                                           |
| `async_mode`        | `"async"`（scheduler バックグラウンド処理を有効化）または `"sync"`（scheduler を無効化して同期処理） |

## Core Methods (GeneralMemCube)

GeneralMemCube は MemCube の標準実装であり、統一インターフェースを通じてシステムのすべての記憶を管理します。GeneralMemCube は、記憶データのライフサイクルを管理するための以下のコアメソッドを提供します。

### Initialization

```python
from memos.mem_cube.general import GeneralMemCube
mem_cube = GeneralMemCube(config)
```

### Static Data Operations

| メソッド                                      | 説明                                      |
| ----------------------------------------- | ----------------------------------------- |
| `init_from_dir(dir)`                    | ローカルディレクトリから MemCube を読み込む                    |
| `init_from_remote_repo(repo, base_url)` | リモートリポジトリから MemCube を読み込む（Hugging Face など） |
| `load(dir)`                             | ディレクトリからすべての記憶を既存インスタンスに読み込む              |
| `dump(dir)`                             | 永続化のためにすべての記憶をディレクトリに保存する              |

## File Storage

MemCube を保存した後のディレクトリには以下のファイルが含まれ、各ファイルは1種類の記憶タイプに対応します：

- `config.json` (MemCube 設定)
- `textual_memory.json` (明文記憶)
- `activation_memory.pickle` (活性化記憶)
- `parametric_memory.adapter` (パラメータ化記憶)

## Usage Examples

### Export Example (dump_cube.py)

```python
import json
import os
import shutil

from memos.api.handlers import init_server
from memos.api.product_models import APIADDRequest
from memos.log import get_logger
from memos.multi_mem_cube.single_cube import SingleCubeView

logger = get_logger(__name__)
EXAMPLE_CUBE_ID = "example_dump_cube"
EXAMPLE_USER_ID = "example_user"

# 1. サービスを初期化
components = init_server()
naive = components["naive_mem_cube"]

# 2. SingleCubeView を作成
view = SingleCubeView(
    cube_id=EXAMPLE_CUBE_ID,
    naive_mem_cube=naive,
    mem_reader=components["mem_reader"],
    mem_scheduler=components["mem_scheduler"],
    logger=logger,
    searcher=components["searcher"],
    feedback_server=components["feedback_server"],
)

# 3. View を通じて記憶を追加
result = view.add_memories(APIADDRequest(
    user_id=EXAMPLE_USER_ID,
    writable_cube_ids=[EXAMPLE_CUBE_ID],
    messages=[
        {"role": "user", "content": "This is a test memory"},
        {"role": "user", "content": "Another memory to persist"},
    ],
    async_mode="sync",  # 即時完了を保証するため同期モードを使用
))
print(f"✓ Added {len(result)} memories")

# 4. 特定の cube_id のデータをエクスポート
output_dir = "tmp/mem_cube_dump"
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir, exist_ok=True)

# グラフデータをエクスポート（現在の cube_id のデータのみをエクスポート）
json_data = naive.text_mem.graph_store.export_graph(
    include_embedding=True,  # セマンティック検索をサポートするため embedding を含める
    user_name=EXAMPLE_CUBE_ID,  # cube_id でフィルタ
)

# embedding 形式を修正：インポート互換性のため文字列をリストとして解析
import contextlib
for node in json_data.get("nodes", []):
    metadata = node.get("metadata", {})
    if "embedding" in metadata and isinstance(metadata["embedding"], str):
        with contextlib.suppress(json.JSONDecodeError):
            metadata["embedding"] = json.loads(metadata["embedding"])

print(f"✓ Exported {len(json_data.get('nodes', []))} nodes")

# ファイルに保存
memory_file = os.path.join(output_dir, "textual_memory.json")
with open(memory_file, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"✓ Saved to: {memory_file}")
```

### Import And Search Example (load_cube.py)

> **Embedding Compatibility Note**：サンプルデータは **bge-m3** モデルを使用しており、次元は **1024** です。お使いの環境で異なる embedding モデルまたは次元を使用している場合、インポート後のセマンティック検索は不正確になるか失敗する可能性があります。`.env` の設定がエクスポート時の embedding 設定と一致していることを確認してください。

```python
import json
import os

from memos.api.handlers import init_server
from memos.api.product_models import APISearchRequest
from memos.log import get_logger
from memos.multi_mem_cube.single_cube import SingleCubeView

logger = get_logger(__name__)
EXAMPLE_CUBE_ID = "example_dump_cube"
EXAMPLE_USER_ID = "example_user"

# 1. サービスを初期化
components = init_server()
naive = components["naive_mem_cube"]

# 2. SingleCubeView を作成
view = SingleCubeView(
    cube_id=EXAMPLE_CUBE_ID,
    naive_mem_cube=naive,
    mem_reader=components["mem_reader"],
    mem_scheduler=components["mem_scheduler"],
    logger=logger,
    searcher=components["searcher"],
    feedback_server=components["feedback_server"],
)

# 3. ファイルから graph_store にデータを読み込む
load_dir = "examples/data/mem_cube_tree"
memory_file = os.path.join(load_dir, "textual_memory.json")

with open(memory_file, encoding="utf-8") as f:
    json_data = json.load(f)

naive.text_mem.graph_store.import_graph(json_data, user_name=EXAMPLE_CUBE_ID)

nodes = json_data.get("nodes", [])
print(f"✓ Imported {len(nodes)} nodes")

# 4. 読み込まれたデータを表示
print(f"\nLoaded {len(nodes)} memories:")
for i, node in enumerate(nodes[:3], 1):  # 最初の3件を表示
    metadata = node.get("metadata", {})
    memory_text = node.get("memory", "N/A")
    mem_type = metadata.get("memory_type", "unknown")
    print(f"  [{i}] Type: {mem_type}")
    print(f"      Content: {memory_text[:60]}...")

# 5. セマンティック検索の検証
query = "test memory dump persistence demonstration"
print(f'\nSearching: "{query}"')

search_result = view.search_memories(
    APISearchRequest(
        user_id=EXAMPLE_USER_ID,
        readable_cube_ids=[EXAMPLE_CUBE_ID],
        query=query,
    )
)

text_mem_results = search_result.get("text_mem", [])
memories = []
for group in text_mem_results:
    memories.extend(group.get("memories", []))

print(f"✓ Found {len(memories)} relevant memories")
for i, mem in enumerate(memories[:2], 1):  # 最初の2件を表示
    print(f"  [{i}] {mem.get('memory', 'N/A')[:60]}...")
```

### Complete Example

コードリポジトリ内のサンプルを参照してください：

- `MemOS/examples/mem_cube/dump_cube.py` - MemCube データをエクスポート（add + export）
- `MemOS/examples/mem_cube/load_cube.py` - MemCube データをインポートしてセマンティック検索を実行（import + search）

### Legacy API Note

初期バージョンで `mem_cube.text_mem.get_all()` を直接呼び出す方式はすでに廃止されています。View Architecture を使用してください。旧サンプルは `MemOS/examples/mem_cube/_deprecated/` に移動されました。

## Developer Notes

* MemCube は安全な読み込み/ダンプを保証するため、モード整合性を強制します
* 各記憶タイプはプラガブルであり、独立したテストをサポートします
* 統合テストと使用パターンについては `/tests/mem_cube/` を参照してください
