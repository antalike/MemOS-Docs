---
title: MemCube 存在性ノ確認 (Check Cube Existence)
desc: 指定された MemCube ID がすでにシステム内で初期化され、利用可能であるかを検証します。
---

**インターフェースパス**：`POST /product/exist_mem_cube_id`
**機能説明**：このインターフェースは、指定された `mem_cube_id` がすでにシステム内に存在しているかを検証するために使用されます。これはデータ整合性を確保するための「ゲートキーパー」インターフェースであり、重複初期化や無効な操作を避けるため、動的にナレッジベースを作成する前、または新規ユーザーにスペースを割り当てる前に呼び出すことを推奨します。

## 1. Core Mechanism: Cube インデックス検証

MemOS アーキテクチャでは、MemCube の存在性が後続のすべての記憶操作の正当性を決定します：

* **ロジック検証**：システムは **MemoryHandler** を通じて基盤ストレージインデックスを検索し、その ID が登録済みかどうかを確認します。
* **コールドスタート保証**：オンデマンドで Cube を作成するシナリオでは、このインターフェースを使用して、記憶空間を有効化するために初回の `add` 操作を実行する必要があるかどうかを判断できます。



## 2. Key Interface Parameters
リクエストボディの定義は以下のとおりです：

| パラメータ名 | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| **`mem_cube_id`** | `str` | はい | 検証対象の MemCube 一意識別子。 |

## 3. Working Principle (MemoryHandler)

1. **ダイレクトインデックス**：**MemoryHandler** はリクエストを受信後、基盤の **naive_mem_cube** のメタデータ照会インターフェースを直接呼び出します。
2. **状態検索**：システムは永続化層で、その ID に対応する設定ファイルまたはデータベースレコードを検索します。
3. **ブールフィードバック**：返却結果には記憶内容は含まれず、`code` または `data` の形式でその Cube が有効化されているかどうかのみを通知します。

## 4. Quick Start Example

SDK を使用して対象 Cube の状態を検証します：

```python
from memos.api.client import MemOSClient

client = MemOSClient(api_key="...", base_url="...")

# シナリオ：ドキュメントをインポートする前に、対象ナレッジベースが作成済みであることを確認
kb_id = "kb_finance_2026"
res = client.exist_mem_cube_id(mem_cube_id=kb_id)

if res and res.code == 200:
    # data フィールドがブール値または存在性オブジェクトを返すと仮定
    if res.data.get('exists'):
        print(f"✅ MemCube '{kb_id}' は準備完了です。")
    else:
        print(f"❌ MemCube '{kb_id}' はまだ初期化されていません。")
```
