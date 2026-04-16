---
title: 最初の記憶を作成する
desc: "実践してみましょう！**SimpleStructMemReader** を使用して対話から記憶を抽出し、**TreeTextMemory** に保存して管理と検索を行う方法をご案内します。"
---

## 学習目標

このチュートリアルでは、MemOS のコアワークフローを一通り案内し、以下の能力を習得します：

1.  **読む (Read)**：`SimpleStructMemReader` を使って雑多なチャット履歴を構造化された記憶に変換する方法。
2.  **保存 (Add)**：抽出した記憶を `TreeTextMemory`（グラフデータベース）に保存する方法。
3.  **検索 (Search)**：自然言語を使って保存した記憶を検索する方法。

---

## コアコンポーネント概要

実践を始める前に、これから使用する2つの重要なコンポーネントを理解しておきましょう：

### SimpleStructMemReader（構造化記憶抽出器）

これは LLM ベースのインテリジェントな情報抽出モジュールで、以下が可能です：
 - 対話、文書などの非構造化データを自動分析
 - ユーザーの好み、事実の記述、行動パターンなどの重要情報を識別
 - 標準化された構造化記憶ユニットを出力

### TreeTextMemory（ツリー状テキスト記憶庫）

これはグラフデータベースベースの記憶管理システムで、以下が可能です：
 - ツリー構造で記憶を整理し、階層関係をサポート
 - 記憶間の意味的関連を構築
 - 高効率な意味検索とグラフ走査をサポート
 - 基盤層で Neo4j などのグラフデータベースと互換

## 試してみましょう

具体的なケースを通して、「テニスの調子が良くない」ことに関するユーザーの対話から重要情報を抽出し、検索可能な記憶システムを構築する方法を示します。

### 1. モジュールをインポート

```python
from memos import log
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.configs.memory import TreeTextMemoryConfig
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory

logger = log.get_logger(__name__)
```

### 2. コアコンポーネントを初期化

```python

# 1. TreeTextMemory（記憶ストア）を初期化
tree_config = TreeTextMemoryConfig.from_json_file(
    "examples/data/config/tree_config_shared_database.json"
)
my_tree_textual_memory = TreeTextMemory(tree_config)

# ⚠️ 注意：ここではデモのために古いデータを消去しています。本番環境では絶対にやらないでください！
my_tree_textual_memory.delete_all()

# 2. SimpleStructMemReader（情報抽出器）を初期化
reader_config = SimpleStructMemReaderConfig.from_json_file(
    "examples/data/config/simple_struct_reader_config.json"
)
reader = SimpleStructMemReader(reader_config)
```

### 3. 対話を準備

以下はユーザーと AI の対話で、ユーザーはテニスをするときの状態の問題を表現しています：

```python
scene_data = [
    [
        {
            "role": "user",
            "chat_time": "3 May 2025",
            "content": "This week I’ve been feeling a bit off, especially when playing tennis. My body just doesn’t feel right.",
        },
        {
            "role": "assistant",
            "chat_time": "3 May 2025",
            "content": "It sounds like you've been having some physical discomfort lately...",
        },
        # ... (途中の数回の不満のやり取りは省略) ...
        {
            "role": "user",
            "chat_time": "3 May 2025",
            "content": "I think it might be due to stress and lack of sleep recently...",
        },
    ]
]
```

### 4. 抽出して保存

**SimpleStructMemReader** は対話を自動分析し、「ユーザーは最近ストレスが大きい」「睡眠不足」「テニスのパフォーマンス低下」などの重要な記憶ポイントを抽出して、データベースに保存します。

```python
# 1. 抽出 (Extract)
# Reader は LLM を呼び出して対話を分析し、記憶リストを返します
memory = reader.get_memory(
    scene_data, 
    type="chat", 
    info={"user_id": "1234", "session_id": "2222"}
)

# 2. 保存 (Add)
for m_list in memory:
    added_ids = my_tree_textual_memory.add(m_list)
    
    # 何が保存されたか見てみましょう
    for i, id in enumerate(added_ids):
        print(f"第 {i} 件目の記憶を保存: " + my_tree_textual_memory.get(id).memory)
    
    # バックグラウンドでの整理完了を待機（インデックス構築には少し時間がかかります）
    my_tree_textual_memory.memory_manager.wait_reorganizer()
```

### 5. 記憶を検索

**基本検索 (Search):**

検索エンジンを使うように、そのまま質問します。

```python
# インデックス構築を少し待つ
import time
time.sleep(2)

init_time = time.time()

# 「子供時代」に関することを検索してみる（以前の対話に関連内容が含まれていると仮定）
# または "Why is the user feeling bad?" で試してみてください
results = my_tree_textual_memory.search(
    "Talk about the user's childhood story?",
    top_k=10,
    info={
        "query": "Talk about the user's childhood story?",
        "user_id": "111",
        "session_id": "2234",
    },
)

for i, r in enumerate(results):
    print(f"検索で見つかった第 {i} 件目の結果: {r.memory}")

print(f"検索所要時間: {round(time.time() - init_time)}s")
```

**高度な検索 (Fine Mode):**

より賢い検索結果が欲しい場合（たとえば LLM に検索内容を要約してもらうなど）は、`mode="fine"` を有効にできます。

```python
# Fine モードを有効化
results_fine_search = my_tree_textual_memory.search(
    "Recent news in the first city you've mentioned.",
    top_k=10,
    mode="fine", # ここがポイント
    info={
        "query": "Recent news in NewYork",
        "user_id": "111",
        "session_id": "2234",
        "chat_history": [
            {"role": "user", "content": "I want to know three beautiful cities"},
            {"role": "assistant", "content": "New York, London, and Shanghai"},
        ],
    },
)

for i, r in enumerate(results_fine_search):
    print(f"Fine Search の結果: {r.memory}")
```

### 6. 応用：マルチモーダルとツール (Modality & Tools)

MemOS の機能はテキスト対話処理に限らず、マルチモーダル入力と高度な機能にも対応しています。

#### 1. 文書を読み取る (Documents)

ローカル文書を直接読み取って記憶に変換できます：

```python
# 文書データを構築
doc_data = [
    {
        "type": "file",
        "file": {
            "filename": "tennis_rule.txt",
            "path": "./tennis_rule.txt", # ファイルが存在することを確認してください
            # または content を直接提供: "file_data": "..."
        }
    }
]

# Reader にこれが "doc" タイプであることを伝える
doc_memories = reader.get_memory(
    doc_data, 
    type="doc", 
    info={"user_id": "1234", "session_id": "docs_import"}
)

# 記憶に保存
for m in doc_memories:
    my_tree_textual_memory.add(m)
```

#### 2. ツール呼び出し (Tools)

Agent がツール（検索、電卓など）を使用するとき、MemOS はツールの入出力を解析し、「ユーザーが天気を問い合わせた」「計算結果は50である」などの事実を記録できます。

```python
tool_scene = [
    [
        {"role": "user", "content": "What's the weather in Beijing?"},
        {
            "role": "assistant", 
            "content": "", 
            "tool_calls": [{"id": "call_1", "function": {"name": "get_weather", "arguments": "{'city': 'Beijing'}"}}]
        },
        {
            "role": "tool", 
            "tool_call_id": "call_1", 
            "content": "Sunny, 25°C"
        }
    ]
]

# Reader はこれがツールインタラクションであることを自動的に理解します
tool_memories = reader.get_memory(tool_scene, type="chat", info={"user_id": "1234"})
```

### 7. ユーザー設定 (Preferences)

事実記憶（TreeTextMemory）に加えて、MemOS にはユーザーの好み（たとえば「辛いものが好き」「雨が嫌い」）を管理する専用の **PreferenceTextMemory** もあります。これはベクトルデータベース（Milvus/Qdrant など）を使って保存し、ユーザーのパーソナライズ設定を高速に検索しやすくします。

```python
from memos.memories.textual.simple_preference import SimplePreferenceTextMemory
# 注意：初期化には VectorDB、Embedder などの設定が必要です。ここでは例示のみです
# pref_memory = SimplePreferenceTextMemory(...)

# 対話から好みを自動抽出
pref_memories = pref_memory.get_memory(chat_data, type="chat", info=...)

# 好みを保存
pref_memory.add(pref_memories)

# 好みを検索
prefs = pref_memory.search("What is the user's UI preference?", top_k=1)
print(prefs[0].memory) # 出力: "User prefers dark mode"
```

### 8. 記憶フィードバック (Feedback)

記憶は不変ではありません。ユーザーが AI を訂正することもあります：「私は赤が好きではありません。気が変わって、青が好きです」。このような「修正」を処理するためのモジュールが **MemFeedback** です。

以下のことができます：
1.  **修正**：誤った記憶を修正する。
2.  **削除**：古くなった記憶を削除する。
3.  **統合**：衝突する記憶を統合する。

```python
from memos.mem_feedback.simple_feedback import SimpleMemFeedback

# フィードバックモジュールを初期化
# feedback_module = SimpleMemFeedback(...)

# ユーザーフィードバックを処理
# ユーザーがこう言ったと仮定："Actually, I started playing tennis in 2020, not 2018."
feedback_module.process_feedback({
    "user_id": "1234",
    "feedback_content": "Actually, I started playing tennis in 2020, not 2018.",
    "chat_history": [...], # コンテキストを提供
    "feedback_time": "Now"
})

# フィードバックモジュールはバックグラウンドで Graph データベース内のノードと関係を自動更新します
```

### まとめ

このチュートリアルを通して、MemOS のコアワークフローをすでに習得しました：
1.  **情報抽出**: Reader を使ってさまざまなデータソースから構造化情報を抽出
2.  **記憶保存**: TreeTextMemory を使って事実記憶を管理し、PreferenceMemory でユーザーの好みを管理
3.  **インテリジェント検索**: 自然言語クエリを通じて関連する記憶を取得
4.  **継続的最適化**: フィードバック機構を通じて記憶の正確性と適時性を維持

次のステップとして、`examples/mem_os/simple_memos.py` を実行して、これらすべての機能を統合した完全な Agent を体験してみてください！

### 7. 仕上げ

テスト完了後、以下のクリーンアップ操作を行うことを推奨します：

```python
# バックグラウンドスレッドを終了
my_tree_textual_memory.memory_manager.close()

# 記憶をバックアップ
my_tree_textual_memory.dump("tmp/my_tree_textual_memory")

# データベースを削除して撤収（テスト環境のみ！）
my_tree_textual_memory.drop()
```

---

## Next Step?

- **独自の LLM バックエンドを試す：** OpenAI、HuggingFace または Ollama に切り替えます。
- **[TreeTextMemory](/open_source/modules/memories/tree_textual_memory) を探索する：** グラフベースの階層記憶を構築します。
- **[Activation Memory](/open_source/modules/memories/kv_cache_memory) を追加する：** キー・バリュー状態をキャッシュし、推論を高速化します。
- **さらに学ぶ：** [API Reference](/api-reference/search-memories) と [Examples](/open_source/getting_started/examples) を確認して高度なワークフローを理解します。


次に、より高度な使い方を見てみましょう：
- **[MemReader](/open_source/modules/mem_reader)**：実は画像や PDF も読み取れます。
- **[MemFeedback](/open_source/modules/mem_feedback)**：記憶に誤りがあった場合、どうやって AI に自動修正させるのでしょうか？
- **[MemCube](/open_source/modules/mem_cube)**：さまざまな記憶能力をどのようにまとめて、本当の万能な頭脳を作るのか。
