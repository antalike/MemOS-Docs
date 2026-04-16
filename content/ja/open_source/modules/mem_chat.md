---
title: MemChat
desc: "MemChat はあなたの「記憶の外交官」であり、ユーザー入力、記憶検索、LLM 生成を調整して、一貫性があり長期記憶を備えた対話体験を構築します。"
---

## 1. 概要

**MemChat** は MemOS の対話制御センターです。

これは単なるチャットインターフェースではなく、「即時対話」と「長期記憶」をつなぐ橋でもあります。ユーザーとのやり取りの過程で、MemChat は MemCube（記憶キューブ）から関連する背景情報をリアルタイムで検索し、コンテキストを構築し、新しい対話内容を新たな記憶として蓄積します。これにより、あなたの Agent はもはや「金魚の記憶」ではなく、過去を真に理解し、継続的に成長できる知的なパートナーになります。

---

## 2. コア機能

### 記憶強化対話 (Memory-Augmented Chat)
ユーザーの質問に回答する前に、MemChat は MemCube から関連する Textual Memory（テキスト記憶）を自動的に検索し、それを Prompt に注入します。これにより、Agent は LLM の事前学習知識だけに依存するのではなく、過去のインタラクション履歴やナレッジベースに基づいて質問に回答できます。

### 自動記憶蓄積 (Auto-Memorization)
対話後、MemChat は Extractor LLM を使用して対話ストリームから価値のある情報（ユーザーの好み、事実知識など）を自動的に抽出し、MemCube に保存します。ユーザーによる手動介入は不要で、プロセス全体は完全に自動化されています。

### コンテキスト管理
対話履歴ウィンドウ (`max_turns_window`) を自動管理します。対話が長くなりすぎると、古いコンテキストをインテリジェントに切り詰める一方で、検索された長期記憶に依存して対話の一貫性を維持し、LLM Context Window の制限問題を効果的に解決します。

### 柔軟な設定
異なる種類の記憶（テキスト記憶、活性化記憶など）を設定スイッチで切り替えることをサポートし、さまざまなアプリケーションシナリオに適応します。

---

## 3. コード構造

コアロジックは `memos/src/memos/mem_chat/` 配下にあります。

*   **`simple.py`**: **デフォルト実装 (SimpleMemChat)**。これはすぐに使える REPL（Read-Eval-Print Loop）実装であり、完全な「検索 -> 生成 -> 保存」のクローズドループロジックを含みます。
*   **`base.py`**: **インターフェース定義 (BaseMemChat)**。`run()` や `mem_cube` プロパティなど、MemChat の基本動作を定義します。
*   **`factory.py`**: **ファクトリクラス**。設定 (`MemChatConfig`) に基づいて具体的な MemChat オブジェクトをインスタンス化する役割を担います。

---

## 4. 主要インターフェース

主なインタラクション入口は `MemChat` クラスです（通常は `MemChatFactory` によって作成されます）。

### 4.1 初期化
まず設定オブジェクトを作成し、その後ファクトリメソッドを通じてインスタンスを作成する必要があります。作成後、`MemCube` インスタンスを `mem_chat.mem_cube` にマウントする必要があります。

### 4.2 `run()`
対話型コマンドラインの対話ループを開始します。開発とデバッグに適しており、ユーザー入力の処理、記憶検索の呼び出し、返信の生成、出力を行います。

### 4.3 プロパティ
*   **`mem_cube`**: 関連付けられた記憶キューブオブジェクト。MemChat はこれを通じて記憶を読み書きします。
*   **`chat_llm`**: 返信生成に使用される LLM インスタンス。

---

## 5. ワークフロー

MemChat の1回の対話ループには通常、以下のステップが含まれます：

1.  **入力の受信 (Input)**: ユーザーのテキスト入力を取得します。
2.  **記憶検索 (Recall)**: (`enable_textual_memory` が有効な場合) ユーザー入力を Query として使用し、`mem_cube.text_mem` から Top-K 件の関連記憶を検索します。
3.  **プロンプト構築 (Prompt Construction)**: システムプロンプト、検索された記憶、最近の対話履歴 (History) を連結して完全な Prompt を構築します。
4.  **返信生成 (Generation)**: `chat_llm` を呼び出して返信を生成します。
5.  **記憶抽出と保存 (Memorization)**: (`enable_textual_memory` が有効な場合) このラウンドの対話 (User + Assistant) を `mem_cube` の抽出器に送信し、新しい記憶を抽出してデータベースに保存します。

---

## 6. 開発例

以下は完全なコード例で、MemChat をどのように設定し、Qdrant と OpenAI ベースの MemCube をマウントするかを示しています。

### 6.1 コード実装

```python
import os
import sys

# src モジュールをインポート可能にする
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../src")))

from memos.configs.mem_chat import MemChatConfigFactory
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_chat.factory import MemChatFactory
from memos.mem_cube.general import GeneralMemCube

def get_mem_chat_config() -> MemChatConfigFactory:
    """MemChat 設定を生成する"""
    return MemChatConfigFactory.model_validate(
        {
            "backend": "simple",
            "config": {
                "user_id": "user_123",
                "chat_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": os.getenv("MOS_CHAT_MODEL", "gpt-4o"),
                        "temperature": 0.8,
                        "max_tokens": 1024,
                        "api_key": os.getenv("OPENAI_API_KEY"),
                        "api_base": os.getenv("OPENAI_API_BASE"),
                    },
                },
                "max_turns_window": 20,
                "top_k": 5,
                "enable_textual_memory": True, # 明示的記憶を有効化
            },
        }
    )

def get_mem_cube_config() -> GeneralMemCubeConfig:
    """MemCube 設定を生成する"""
    return GeneralMemCubeConfig.model_validate(
        {
            "user_id": "user03alice",
            "cube_id": "user03alice/mem_cube_tree",
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "cube_id": "user03alice/mem_cube_general",
                    "extractor_llm": {
                        "backend": "openai",
                        "config": {
                            "model_name_or_path": os.getenv("MOS_CHAT_MODEL", "gpt-4o"),
                            "api_key": os.getenv("OPENAI_API_KEY"),
                            "api_base": os.getenv("OPENAI_API_BASE"),
                        },
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": "user03alice_mem_cube_general",
                            "vector_dimension": 1024,
                        },
                    },
                    "embedder": {
                        "backend": os.getenv("MOS_EMBEDDER_BACKEND", "universal_api"),
                        "config": {
                            "provider": "openai",
                            "api_key": os.getenv("MOS_EMBEDDER_API_KEY", "EMPTY"),
                            "model_name_or_path": os.getenv("MOS_EMBEDDER_MODEL", "bge-m3"),
                            "base_url": os.getenv("MOS_EMBEDDER_API_BASE"),
                        },
                    },
                },
            },
        }
    )

def main():
    print("Initializing MemChat...")
    mem_chat = MemChatFactory.from_config(get_mem_chat_config())

    print("Initializing MemCube...")
    mem_cube = GeneralMemCube(get_mem_cube_config())

    # 重要なステップ：記憶キューブをマウントする
    mem_chat.mem_cube = mem_cube
    
    print("Starting Chat Session...")
    try:
        mem_chat.run()
    finally:
        print("Saving memory cube...")
        mem_chat.mem_cube.dump("new_cube_path")

if __name__ == "__main__":
    main()
```

---

## 7. 設定説明

`MemChatConfigFactory` を設定する際、以下のパラメータが非常に重要です：

*   **`user_id`**: 必須。現在の対話のユーザーを識別し、記憶の分離性を確保するために使用されます。
*   **`chat_llm`**: 対話モデル設定。より高い返信品質と命令追従能力を得るために、能力の高いモデル（GPT-4o など）の使用を推奨します。
*   **`enable_textual_memory`**: `True` / `False`。テキスト記憶を有効にするかどうか。有効にすると、システムは対話前に検索を行い、対話後に保存を行います。
*   **`max_turns_window`**: 整数。保持する対話履歴のターン数。この制限を超えた履歴は切り捨てられ、その結果、長期記憶に依存してコンテキストを補完します。
*   **`top_k`**: 整数。毎回、記憶ライブラリから最も関連性の高い記憶断片を何件検索して Prompt に注入するか。

