---
title: Linux Ollama 版
---

## シナリオ設計

**🎯 問題シナリオ：** あなたはAIアプリケーション開発者で、すでにMemOSの基本操作を習得しており、今度はより構造化された記憶システムを作成したいと考えています。基本の`TextualMemoryMetadata`機能には限界があり、複雑なシナリオのニーズを満たせないことに気づきました。たとえば、作業記憶と長期記憶を区別する必要がある、記憶のソースを追跡する必要がある、記憶にタグやエンティティ情報を追加する必要がある、などです。

**🔧 解決策：** この章を通じて、`TreeNodeTextualMemoryMetadata`を使用して構造化記憶を作成する方法を学びます。これには、記憶ライフサイクル管理、マルチソース追跡、エンティティタグなどの機能が含まれ、あなたのAIアプリケーションによりスマートな記憶システムを持たせることができます。

## レシピ 2.1：TreeNodeTextualMemoryMetadata の中核概念を理解する

**🎯 問題シナリオ：** `TreeNodeTextualMemoryMetadata`と基本メタデータの違い、およびその中核機能を理解したいと考えています。

**🔧 解決策：** このレシピを通じて、`TreeNodeTextualMemoryMetadata`の中核概念と基本構造を習得します。

### 基本インポート

```python
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata
```

### 中核概念

#### 1. 記憶タイプ (memory_type)

- `WorkingMemory`: 作業記憶、一時保存
- `LongTermMemory`: 長期記憶、永続保存  
- `UserMemory`: ユーザー記憶、パーソナライズ保存

#### 2. 記憶状態 (status)

- `activated`: アクティブ状態
- `archived`: アーカイブ状態
- `deleted`: 削除状態

#### 3. 記憶タイプ (type)

- `fact`: 事実
- `event`: イベント
- `opinion`: 意見
- `topic`: トピック
- `reasoning`: 推論
- `procedure`: 手順

## レシピ 2.2：基本的な構造化記憶を作成する

**🎯 問題シナリオ：** 人物情報、プロジェクト情報、作業タスクなど、異なるタイプのメモリを作成したいと考えており、それぞれの記憶に適切なメタデータを設定する必要があります。

**🔧 解決策：** このレシピを通じて、さまざまなタイプの構造化記憶を作成する方法を学びます。

### 例1：シンプルな人物記憶を作成する

ファイル `create_person_memory_ollama.py` を作成します：

```python
# create_person_memory_ollama.py
# 🎯 人物記憶を作成する例 (Ollama版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_person_memory_ollama():
    """
    🎯 人物記憶を作成する例 (Ollama版)
    """
    
    print("🚀 人物記憶の作成を開始します (Ollama版)...")
    
    # 環境変数を読み込む
    load_dotenv()
    
    # Ollama設定を確認
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Ollama環境変数が設定されていません。.envファイルでOLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODELを設定してください。")
    
    print("✅ Ollamaローカルモデルモードを検出しました")
    
    # ユーザーIDを取得
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # 人物記憶のメタデータを作成
    metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="fact",
        source="conversation",
        confidence=90.0,
        memory_type="LongTermMemory",
        key="張三_情報",
        entities=["張三", "エンジニア"],
        tags=["人物", "技術"]
    )

    # 記憶項目を作成
    memory_item = TextualMemoryItem(
        memory="張三は私たちの会社のシニアエンジニアで、Pythonと機械学習を得意としています",
        metadata=metadata
    )

    print(f"記憶内容: {memory_item.memory}")
    print(f"記憶キー: {memory_item.metadata.key}")
    print(f"記憶タイプ: {memory_item.metadata.memory_type}")
    print(f"タグ: {memory_item.metadata.tags}")
    print(f"🎯 設定モード: OLLAMA")
    print(f"🤖 チャットモデル: {ollama_chat_model}")
    print(f"🔍 埋め込みモデル: {ollama_embed_model}")
    
    return memory_item

if __name__ == "__main__":
    create_person_memory_ollama() 
```

実行コマンド：

```bash
cd test_cookbook/chapter2/Ollama/2
python create_person_memory_ollama.py
```

### 例2：プロジェクト記憶を作成する

ファイル `create_project_memory_ollama.py` を作成します：

```python
# create_project_memory_ollama.py
# 🎯 プロジェクト記憶を作成する例 (Ollama版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_project_memory_ollama():
    """
    🎯 プロジェクト記憶を作成する例 (Ollama版)
    """
    
    print("🚀 プロジェクト記憶の作成を開始します (Ollama版)...")
    
    # 環境変数を読み込む
    load_dotenv()
    
    # Ollama設定を確認
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Ollama環境変数が設定されていません。.envファイルでOLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODELを設定してください。")
    
    print("✅ Ollamaローカルモデルモードを検出しました")
    
    # ユーザーIDを取得
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # プロジェクト記憶のメタデータを作成
    project_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="fact",
        source="file",
        confidence=95.0,
        memory_type="LongTermMemory",
        key="AIプロジェクト_詳細",
        entities=["AIプロジェクト", "機械学習"],
        tags=["プロジェクト", "AI", "重要"],
        sources=["プロジェクト文書", "会議記録"]
    )

    # 記憶項目を作成
    project_memory = TextualMemoryItem(
        memory="AIプロジェクトはインテリジェントカスタマーサービスシステムで、最新のNLP技術を使用し、6か月で完了予定です",
        metadata=project_metadata
    )

    print(f"プロジェクト記憶: {project_memory.memory}")
    print(f"ソース: {project_memory.metadata.sources}")
    print(f"🎯 設定モード: OLLAMA")
    print(f"🤖 チャットモデル: {ollama_chat_model}")
    print(f"🔍 埋め込みモデル: {ollama_embed_model}")
    
    return project_memory

if __name__ == "__main__":
    create_project_memory_ollama() 
```

実行コマンド：

```bash
python create_project_memory_ollama.py
```

### 例3：作業記憶を作成する

ファイル `create_work_memory_ollama.py` を作成します：

```python
# create_work_memory_ollama.py
# 🎯 作業記憶を作成する例 (Ollama版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_work_memory_ollama():
    """
    🎯 作業記憶を作成する例 (Ollama版)
    """
    
    print("🚀 作業記憶の作成を開始します (Ollama版)...")
    
    # 環境変数を読み込む
    load_dotenv()
    
    # Ollama設定を確認
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Ollama環境変数が設定されていません。.envファイルでOLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODELを設定してください。")
    
    print("✅ Ollamaローカルモデルモードを検出しました")
    
    # ユーザーIDを取得
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # 作業記憶のメタデータを作成
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="procedure",
        source="conversation",
        confidence=80.0,
        memory_type="WorkingMemory",  # 作業記憶
        key="今日のタスク",
        tags=["タスク", "今日"]
    )

    # 記憶項目を作成
    work_memory = TextualMemoryItem(
        memory="今日はコードレビュー、チーム会議、そして明日のデモの準備を完了する必要があります",
        metadata=work_metadata
    )

    print(f"作業記憶: {work_memory.memory}")
    print(f"記憶タイプ: {work_memory.metadata.memory_type}")
    print(f"🎯 設定モード: OLLAMA")
    print(f"🤖 チャットモデル: {ollama_chat_model}")
    print(f"🔍 埋め込みモデル: {ollama_embed_model}")
    
    return work_memory

if __name__ == "__main__":
    create_work_memory_ollama() 
```

実行コマンド：

```bash
python create_work_memory_ollama.py
```

## レシピ 2.3：よく使うフィールドの説明と設定

**🎯 問題シナリオ：** `TreeNodeTextualMemoryMetadata`で利用可能なすべてのフィールドと、それらを正しく設定する方法を理解する必要があります。

**🔧 解決策：** このレシピを通じて、すべてのフィールドの意味と設定方法を習得します。

### よく使うフィールドの説明

| フィールド    | 型    | 説明             | 例                     |
| ------------- | ----- | ---------------- | ---------------------- |
| `user_id`     | str   | ユーザーID       | "user123"              |
| `type`        | str   | 記憶タイプ       | "fact", "event"        |
| `source`      | str   | ソース           | "conversation", "file" |
| `confidence`  | float | 信頼度(0-100)    | 90.0                   |
| `memory_type` | str   | 記憶ライフサイクルタイプ | "LongTermMemory"       |
| `key`         | str   | 記憶キー/タイトル | "重要情報"             |
| `entities`    | list  | エンティティ一覧 | ["張三", "プロジェクト"] |
| `tags`        | list  | タグ一覧         | ["重要", "技術"]       |
| `sources`     | list  | マルチソース一覧 | ["文書", "会議"]       |

## レシピ 2.4：実際の応用 - 記憶を作成してMemCubeに追加する

**🎯 問題シナリオ：** すでに構造化記憶の作成方法を習得し、今度はこれらの記憶をMemCubeに追加して、検索と管理を行いたいと考えています。

**🔧 解決策：** このレシピを通じて、構造化記憶をMemCubeに統合し、完全な記憶管理フローを実現する方法を学びます。

ファイル `memcube_with_structured_memories_ollama.py` を作成します：

```python
# memcube_with_structured_memories_ollama.py
# 🎯 構造化記憶をMemCubeに追加する完全な例 (Ollama版)
import os
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_memcube_config_ollama():
    """
    🎯 MemCube設定を作成する (Ollama版)
    """
    
    print("🔧 MemCube設定を作成します (Ollama版)...")
    
    # 環境変数を読み込む
    load_dotenv()
    
    # Ollama設定を確認
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Ollama環境変数が設定されていません。.envファイルでOLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODELを設定してください。")
    
    print("✅ Ollamaローカルモデルモードを検出しました")
    
    # 設定を取得
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # Ollamaモード設定
    cube_config = {
        "user_id": user_id,
        "cube_id": f"{user_id}_structured_memories_cube",
        "text_mem": {
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_chat_model,
                        "api_base": ollama_base_url
                    }
                },
                "embedder": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_embed_model,
                        "api_base": ollama_base_url
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_structured_memories",
                        "vector_dimension": 768,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        "act_mem": {"backend": "uninitialized"},
        "para_mem": {"backend": "uninitialized"}
    }
    
    # MemCubeインスタンスを作成
    config_obj = GeneralMemCubeConfig.model_validate(cube_config)
    
    return config_obj

def create_structured_memories_ollama():
    """
    🎯 構造化記憶をMemCubeに追加する完全な例 (Ollama版)
    """
    
    print("🚀 構造化記憶MemCubeの作成を開始します (Ollama版)...")
    
    # MemCube設定を作成
    config = create_memcube_config_ollama()
    
    # MemCubeを作成
    mem_cube = GeneralMemCube(config)
    
    print("✅ MemCubeの作成に成功しました！")
    print(f"  📊 ユーザーID: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 テキスト記憶バックエンド: {mem_cube.config.text_mem.backend}")
    
    # 表示用にOllama設定を取得
    load_dotenv()
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    print(f"  🔍 埋め込みモデル: {ollama_embed_model} (Ollama)")
    print(f"  🤖 チャットモデル: {ollama_chat_model} (Ollama)")
    print(f"  🎯 設定モード: OLLAMA")
    
    # 複数の記憶項目を作成
    memories = []

    # 記憶1：人物情報
    person_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="fact",
        source="conversation",
        confidence=90.0,
        memory_type="LongTermMemory",
        key="李四_情報",
        entities=["李四", "デザイナー"],
        tags=["人物", "デザイン"]
    )

    memories.append({
        "memory": "李四は私たちのUIデザイナーで、5年の経験があり、ユーザーインターフェース設計を得意としています",
        "metadata": person_metadata
    })

    # 記憶2：プロジェクト情報
    project_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="fact",
        source="file",
        confidence=95.0,
        memory_type="LongTermMemory",
        key="モバイルアプリプロジェクト",
        entities=["モバイルアプリ", "開発"],
        tags=["プロジェクト", "モバイル", "重要"]
    )

    memories.append({
        "memory": "モバイルアプリプロジェクトは進行中で、3か月で完了予定、チームは8人です",
        "metadata": project_metadata
    })

    # 記憶3：作業記憶
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="procedure",
        source="conversation",
        confidence=85.0,
        memory_type="WorkingMemory",
        key="今週のタスク",
        tags=["タスク", "今週"]
    )

    memories.append({
        "memory": "今週は要件分析、プロトタイプ設計、そして技術選定を完了する必要があります",
        "metadata": work_metadata
    })

    # MemCubeに追加
    mem_cube.text_mem.add(memories)

    print("✅ 3つの記憶項目をMemCubeに正常に追加しました")

    # 記憶を照会
    print("\n🔍 すべての記憶を照会:")
    all_memories = mem_cube.text_mem.get_all()
    for i, memory in enumerate(all_memories, 1):
        print(f"{i}. {memory.memory}")
        print(f"   キー: {memory.metadata.key}")
        print(f"   タイプ: {memory.metadata.memory_type}")
        print(f"   タグ: {memory.metadata.tags}")
        print()

    # 特定の記憶を検索
    print("🔍 '李四' を含む記憶を検索:")
    search_results = mem_cube.text_mem.search("李四", top_k=2)
    for result in search_results:
        print(f"- {result.memory}")
    
    return mem_cube

if __name__ == "__main__":
    create_structured_memories_ollama() 
```

実行コマンド：

```bash
cd test_cookbook/chapter2/Ollama/4
python memcube_with_structured_memories_ollama.py
```

## よくある質問と解決策

**Q1: 適切なmemory_typeはどのように選べばよいですか？**

```python
# 🔧 記憶の重要性に応じて選択
if is_important:
    memory_type = "LongTermMemory"  # 長期保存
elif is_temporary:
    memory_type = "WorkingMemory"   # 一時保存
else:
    memory_type = "UserMemory"      # パーソナライズ保存
```

**Q2: 適切なconfidence値はどのように設定しますか？**

```python
# 🔧 情報ソースの信頼性に応じて設定
if source == "verified_document":
    confidence = 95.0
elif source == "conversation":
    confidence = 80.0
elif source == "web_search":
    confidence = 70.0
```

**Q3: tagsとentitiesを効果的に使うにはどうすればよいですか？**

```python
# 🔧 意味のあるタグとエンティティを使用
tags = ["プロジェクト", "技術", "重要"]  # 分類と検索に便利
entities = ["張三", "AIプロジェクト"]    # エンティティ認識と関連付けに便利
```
