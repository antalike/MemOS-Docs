---
title: MemOS サンプル
desc: "おめでとうございます——あなたはすでにクイックスタートを習得し、最初の実用的なメモリを構築しました！今こそ、異なるメモリタイプと機能を組み合わせることで、MemOS がどれほど大きな可能性を実現できるかを見てみる時です。これらの厳選されたサンプルを使って、あなた自身のエージェント、チャットボット、または知識システムの着想を得てください。"
---

::card-group

  :::card
  ---
  icon: ri:play-line
  title: 最小 Pipeline 
  to: /cn/open_source/getting_started/examples#示例-1最简pipeline
  ---
  最小の実用的な Pipeline  — 平文メモリを追加、検索します。
  :::

  :::card
  ---
  icon: ri:tree-line
  title: 複数情報ソースの追加と検索
  to: /cn/open_source/getting_started/examples#示例-2多信息源记忆的添加与检索
  ---
  テキスト、画像、ファイル、ツール呼び出しの複数情報ソースの messages をメモリに追加し、それらを検索できます。
  :::

  :::card
  ---
  icon: ri:apps-line
  title: 複数 Cube の追加と検索
  to: /cn/open_source/getting_started/examples#示例-3多cube添加和检索
  ---
  異なるメモリを異なる Cube に追加し、検索時にそれらを同時に呼び出します。
  :::

  :::card
  ---
  icon: ri:database-2-line
  title: KVCacheMemory のみ
  to: /cn/open_source/getting_started/examples#示例-4仅-kvcachememory
  ---
  短期の KV Cache を使用して会話を高速化し、迅速なコンテキスト注入を実現します。
  :::

  :::card
  ---
  icon: ri:calendar-check-line
  title: メモリスケジューリング
  to: /cn/open_source/getting_started/examples#示例-5多忆调度
  ---
  マルチユーザー、マルチセッションのエージェント向けに動的メモリ呼び出しを実行します。
  :::

::

## サンプル 1：最小 Pipeline

### いつ使うか：
- 最小の入門用実用サンプルが欲しい場合。
- シンプルな平文メモリをデータベースに保存し、それらを検索できればよい場合。

### 重要ポイント：
- 基本的な個人ユーザーメモリの追加と検索をサポートします。

### 完全なサンプルコード
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_1"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_1"],
    messages = [
      {"role": "user", "content": "I’ve planned to travel to Guangzhou during the summer vacation. What chain hotels are available for accommodation?"},
      {"role": "assistant", "content": "You can consider [7 Days Inn, Ji Hotel, Hilton], etc."},
      {"role": "user", "content": "I’ll choose 7 Days Inn."},
      {"role": "assistant", "content": "Okay, feel free to ask me if you have any other questions."}
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_1"],
    query="Please recommend a hotel that I haven’t stayed at before.",
    include_preference=True,
)

search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
````

## サンプル 2：複数情報ソースメモリの追加と検索

### いつ使うか：

- 単純なテキスト対話に加えて、ファイル、画像内容、またはツール呼び出し履歴情報をメモリに追加する必要がある場合
- 同時に、これらの複数ソース情報のメモリを検索したい場合

### 重要ポイント：

- 複数種類の情報ソースからのメモリ追加
- ダウンロード可能なファイル、画像 url が必要
- 追加する情報は OpenAI Messages 形式に厳密に従う必要があります
- system prompt 内のツール Schema は <tool_chema> </tool_schema> でラップする必要があります

### 完全なサンプルコード
テキスト + ファイルをメモリに追加
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_2"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_2"],
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Please read this file, summarize the key points, and provide a final conclusion."
                },
                {
                    "type": "file",
                    "file": {
                    "file_id": "file_123",
                    "filename": "report.md",
                    "file_data": "@http://139.196.232.20:9090/graph-test/algorithm/2025_11_13/1763043889_1763043782_PM1%E8%BD%A6%E9%97%B4PMT%E9%9D%B4%E5%8E%8B%E8%BE%B9%E5%8E%8B%E5%8E%8B%E5%8A%9B%E6%97%A0%E6%B3%95%E5%BB%BA%E7%AB%8B%E6%95%85%E9%9A%9C%E6%8A%A5%E5%91%8A20240720.md"
                    }
                },
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Final Summary: During the PMT boot-pressure startup test of the PM1 workshop on July 20, 2024, the drive could not run because the edge pressures on both sides failed to reach the 2.5-bar interlock requirement. After troubleshooting, the PLC output signals, hydraulic pipelines, and valves were all found to be normal. The root cause was ultimately identified as poor contact at the negative terminal of the proportional valve’s DC 24V power supply inside the PLC cabinet, caused by a short-jumpered terminal block. After re-connecting the negative incoming lines in parallel, the equipment returned to normal operation. It is recommended to replace terminal blocks in batches, inspect instruments with uncertain service life, and optimize the troubleshooting process by tracing common-mode issues from shared buses and power supply sources."
                }
            ]
        }
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_2"],
    query="Workshop PMT boot pressure startup test",
    include_preference=False,
)
search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
```
複数種類の混合情報ソースの messages をメモリに追加
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_2"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_2"],
    messages = [
  {
    "role": "system",
    "content": [
      {
        "type": "text",
        "text": "You are a professional industrial fault analysis assistant. Please read the PDF, images, and instructions provided by the user and provide a professional technical summary.\n\n<tool_schema>\n[\n  {\n    \"name\": \"file_reader\",\n    \"description\": \"Used to read the content of files uploaded by the user and return the text data (in JSON string format).\",\n    \"parameters\": [\n      {\"name\": \"file_id\", \"type\": \"string\", \"required\": true, \"description\": \"The file ID to be read\"}\n    ],\n    \"returns\": {\"type\": \"text\", \"description\": \"Returns the extracted text content of the file\"}\n  }\n]\n</tool_schema>"
      }
    ]
  },
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Please read this file and image, summarize the key points, and provide a final conclusion."
      },
      {
        "type": "file",
        "file": {
          "file_id": "file_123",
          "filename": "report.pdf",
          "file_data": "@http://139.196.232.20:9090/graph-test/algorithm/2025_11_13/1763043889_1763043782_PM1%E8%BD%A6%E9%97%B4PMT%E9%9D%B4%E5%8E%8B%E8%BE%B9%E5%8E%8B%E5%8E%8B%E5%8A%9B%E6%97%A0%E6%B3%95%E5%BB%BA%E7%AB%8B%E6%95%85%E9%9A%9C%E6%8A%A5%E5%91%8A20240720.md"
        }
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "https://play-groud-test-1.oss-cn-shanghai.aliyuncs.com/%E5%9B%BE%E7%89%871.jpeg"
        }
      }
    ]
  },
  {
    "role": "assistant",
    "tool_calls": [
      {
        "id": "call_file_reader_001",
        "type": "function",
        "function": {
          "name": "file_reader",
          "arguments": "{\"file_id\": \"file_123\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "tool_call_id": "call_file_reader_001",
    "content": [
      {
        "type": "text",
        "text": "{\"file_id\":\"file_123\",\"extracted_text\":\"PM1 workshop PMT boot pressure startup test record… Final fault cause: poor contact at the negative terminal of the DC 24V power supply circuit due to a short-jumped terminal block.\"}"
      }
    ]
  },
  {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Final Summary: During the PMT boot-pressure startup test of the PM1 workshop on July 20, 2024, the drive could not run because the edge pressures on both sides failed to reach the 2.5-bar interlock requirement. After troubleshooting, the PLC output signals, hydraulic pipelines, and valves were all found to be normal. The root cause was ultimately identified as poor contact at the negative terminal of the proportional valve’s DC 24V power supply inside the PLC cabinet, caused by a short-jumpered terminal block. After re-connecting the negative incoming lines in parallel, the equipment returned to normal operation. It is recommended to replace terminal blocks in batches, inspect instruments with uncertain service life, and optimize the troubleshooting process by tracing common-mode issues from shared buses and power supply sources."
      }
    ]
  }
],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)

print("add_memories rsp: \n\n", add_rsp)



search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_2"],
    query="Workshop PMT boot pressure startup test",
    include_preference=False,
)

search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
```

## サンプル 3：複数 Cube の追加と検索

### いつ使うか：

- 互いに分離された異なる Cube 空間にメモリを追加する
- 異なる Cube 空間のメモリを同時に検索したい

### 重要ポイント：

- 検索時に複数の cube id を含む readable_cube_ids リストを入力します

### 完全なサンプルコード
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_3"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_3_1"] ,
    messages = [
      {"role": "user", "content": "I’ve planned to travel to Guangzhou during the summer vacation. What chain hotels are available for accommodation?"},
      {"role": "assistant", "content": "You can consider [7 Days Inn, Ji Hotel, Hilton], etc."},
      {"role": "user", "content": "I’ll choose 7 Days Inn."},
      {"role": "assistant", "content": "Okay, feel free to ask me if you have any other questions."}
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_3_2"] ,
    messages = [
      {"role": "user", "content": "I love you, I need you."},
      {"role": "assistant", "content": "Wow, I love you too"},
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_3_1", "cube_test_user_3_2"],
    query="Please recommend a hotel, Love u u",
    include_preference=True,
)

search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
```

## サンプル 4：KVCacheMemory のみ

### いつ使うか：

- マルチターン対話の速度を上げるための短期ワーキングメモリが欲しい場合。
- チャットボットの会話高速化やプロンプト再利用に適しています。
- 隠れ状態 / KV ペアのキャッシュに最適です。

### 重要ポイント：

- KVCacheMemory を使用し、明示的な平文メモリは含みません。
- 抽出 → 追加 → マージ → 取得 → 削除を実演します。
- KV Cache のエクスポート / ロード方法を示します。

### 完全なサンプルコード


```python
import json
from transformers import DynamicCache

from memos.memories.activation.item import KVCacheItem
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

def get_cache_info(cache):
    if not cache:
        return None

    num_layers = 0
    total_size_bytes = 0

    if hasattr(cache, "layers"):
        num_layers = len(cache.layers)
        for layer in cache.layers:
            if hasattr(layer, "key_cache") and layer.key_cache is not None:
                total_size_bytes += layer.key_cache.nelement() * layer.key_cache.element_size()
            if hasattr(layer, "value_cache") and layer.value_cache is not None:
                total_size_bytes += layer.value_cache.nelement() * layer.value_cache.element_size()

            if hasattr(layer, "keys") and layer.keys is not None:
                total_size_bytes += layer.keys.nelement() * layer.keys.element_size()
            if hasattr(layer, "values") and layer.values is not None:
                total_size_bytes += layer.values.nelement() * layer.values.element_size()

    elif hasattr(cache, "key_cache") and hasattr(cache, "value_cache"):
        num_layers = len(cache.key_cache)
        for k, v in zip(cache.key_cache, cache.value_cache, strict=False):
            if k is not None:
                total_size_bytes += k.nelement() * k.element_size()
            if v is not None:
                total_size_bytes += v.nelement() * v.element_size()

    return {
        "num_layers": num_layers,
        "size_bytes": total_size_bytes,
        "size_mb": f"{total_size_bytes / (1024 * 1024):.2f} MB",
    }


def serialize_item(obj):
    if isinstance(obj, list):
        return [serialize_item(x) for x in obj]

    if isinstance(obj, KVCacheItem):
        return {
            "id": obj.id,
            "metadata": obj.metadata,
            "records": obj.records.model_dump()
            if hasattr(obj.records, "model_dump")
            else obj.records,
            "memory": get_cache_info(obj.memory),
        }

    if isinstance(obj, DynamicCache):
        return get_cache_info(obj)

    return str(obj)


# KVCacheMemory (HuggingFace バックエンド) の設定を作成
config = MemoryConfigFactory(
    backend="kv_cache",
    config={
        "extractor_llm": {
            "backend": "huggingface",
            "config": {
                "model_name_or_path": "Qwen/Qwen3-0.6B",
                "max_tokens": 32,
                "add_generation_prompt": True,
                "remove_think_prefix": True,
            },
        },
    },
)

# KVCacheMemory をインスタンス化
kv_mem = MemoryFactory.from_config(config)

# 1 つの KVCacheItem(DynamicCache) を抽出
prompt = [
    {"role": "user", "content": "What is MemOS?"},
    {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
]
print("===== Extract KVCacheItem =====")
cache_item = kv_mem.extract(prompt)
print(json.dumps(serialize_item(cache_item), indent=2, default=str))

# キャッシュをメモリに追加
kv_mem.add([cache_item])
print("All caches:")
print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))

# ID で取得
retrieved = kv_mem.get(cache_item.id)
print("Retrieved:")
print(json.dumps(serialize_item(retrieved), indent=2, default=str))

# キャッシュをマージ
item2 = kv_mem.extract([{"role": "user", "content": "Tell me a joke."}])
kv_mem.add([item2])
merged = kv_mem.get_cache([cache_item.id, item2.id])
print("Merged cache:")
print(json.dumps(serialize_item(merged), indent=2, default=str))

# そのうち 1 つを削除
kv_mem.delete([cache_item.id])
print("After delete:")
print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))

# キャッシュをエクスポートおよびロード
kv_mem.dump("tmp/kv_mem")
print("Dumped to tmp/kv_mem")
kv_mem.delete_all()
kv_mem.load("tmp/kv_mem")
print("Loaded caches:")
print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))
```

## サンプル 5：メモリスケジューリング

### いつ使うか：

- 非同期トリガー方式で継続的にメモリを管理・最適化するために、カスタムのメモリスケジューリングロジックを定義したり、バックグラウンドタスクを拡張したい場合。
- SaaS エージェントまたはマルチターン対話の LLM アプリケーションタスクに適しています。
- MemScheduler のメモリ管理タスクの設定方法と実行方法を示します。

### 重要ポイント：

- `mem_scheduler.register_handlers` を通じてカスタムコールバックを登録します。
- `add_handler` と `chat_stream_playground` を使用して対話します。
- 環境変数から初期化済みの MemScheduler インスタンスを取得して使用する方法を実演します。

### 完全なサンプルコード

```python
import asyncio
import json
import os
import sys
import time

from pathlib import Path


# 依存パスの import 前にパスを設定
FILE_PATH = Path(__file__).absolute()
BASE_DIR = FILE_PATH.parent.parent.parent
sys.path.insert(0, str(BASE_DIR))  # 任意の作業ディレクトリからの実行を有効化

# server_router を import する前に環境変数を設定し、コンポーネントが正しく初期化されるようにする
os.environ["ENABLE_CHAT_API"] = "true"

from memos.api.product_models import APIADDRequest, ChatPlaygroundRequest  # noqa: E402

# 初期化のために server_router から import
from memos.api.routers.server_router import (  # noqa: E402
    add_handler,
    chat_stream_playground,
    mem_scheduler,
)
from memos.log import get_logger  # noqa: E402
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem  # noqa: E402
from memos.mem_scheduler.schemas.task_schemas import (  # noqa: E402
    MEM_UPDATE_TASK_LABEL,
    QUERY_TASK_LABEL,
)


logger = get_logger(__name__)


def init_task():
    conversations = [
        {"role": "user", "content": "I just adopted a golden retriever puppy yesterday."},
        {"role": "assistant", "content": "Congratulations! What did you name your new puppy?"},
        {
            "role": "user",
            "content": "His name is Max. I live near Central Park in New York where we'll walk daily.",
        },
        {"role": "assistant", "content": "Max will love those walks! Any favorite treats for him?"},
        {
            "role": "user",
            "content": "He loves peanut butter biscuits. Personally, I'm allergic to nuts though.",
        },
        {"role": "assistant", "content": "Good to know about your allergy. I'll note that."},
        # 質問 1 (ペット) - 名前
        {"role": "user", "content": "What's my dog's name again?"},
        {"role": "assistant", "content": "Your dog is named Max."},
        # 質問 2 (ペット) - 品種
        {"role": "user", "content": "Can you remind me what breed Max is?"},
        {"role": "assistant", "content": "Max is a golden retriever."},
        # 質問 3 (ペット) - おやつ
        {"role": "user", "content": "What treats does Max like?"},
        {"role": "assistant", "content": "He loves peanut butter biscuits."},
        # 質問 4 (住所)
        {"role": "user", "content": "Where did I say I live?"},
        {"role": "assistant", "content": "You live near Central Park in New York."},
        # 質問 5 (アレルギー)
        {"role": "user", "content": "What food should I avoid due to allergy?"},
        {"role": "assistant", "content": "You're allergic to nuts."},
        {"role": "user", "content": "Perfect, just wanted to check what you remembered."},
        {"role": "assistant", "content": "Happy to help! Let me know if you need anything else."},
    ]

    questions = [
        {"question": "What's my dog's name again?", "category": "Pet"},
        {"question": "Can you remind me what breed Max is?", "category": "Pet"},
        {"question": "What treats does Max like?", "category": "Pet"},
        {"question": "Where did I say I live?", "category": "Address"},
        {"question": "What food should I avoid due to allergy?", "category": "Allergy"},
    ]
    return conversations, questions


working_memories = []


# カスタムクエリ処理関数を定義
def custom_query_handler(messages: list[ScheduleMessageItem]):
    for msg in messages:
        # ユーザー入力内容を出力
        print(f"\n[scheduler] User input query: {msg.content}")
        # メモリ更新をトリガーするため、MEM_UPDATE ラベル付きの新しいメッセージを手動で構築
        new_msg = msg.model_copy(update={"label": MEM_UPDATE_TASK_LABEL})
        # メッセージをスケジューラに送信して処理
        mem_scheduler.submit_messages([new_msg])


# カスタムメモリ更新処理関数を定義
def custom_mem_update_handler(messages: list[ScheduleMessageItem]):
    global working_memories
    search_args = {}
    top_k = 2
    for msg in messages:
        # テキストメモリ内で現在の内容に関連するメモリを検索（top_k=2 を返す）
        results = mem_scheduler.retriever.search(
            query=msg.content,
            user_id=msg.user_id,
            mem_cube_id=msg.mem_cube_id,
            mem_cube=mem_scheduler.current_mem_cube,
            top_k=top_k,
            method=mem_scheduler.search_method,
            search_args=search_args,
        )
        working_memories.extend(results)
        working_memories = working_memories[-5:]
        for mem in results:
            print(f"\n[scheduler] Retrieved memory: {mem.memory}")


async def run_with_scheduler():
    print("==== run_with_automatic_scheduler_init ====")
    conversations, questions = init_task()

    # server_router コンポーネントを使用して初期化
    # 設定は init_server() 内の環境変数を通じてロードされます

    user_id = "user_1"
    mem_cube_id = "mem_cube_5"

    print(f"Adding conversations for user {user_id}...")

    # add_handler を使用してメモリを追加
    add_req = APIADDRequest(
        user_id=user_id,
        writable_cube_ids=[mem_cube_id],
        messages=conversations,
        async_mode="sync",  # このサンプルでは即時追加のため同期モードを使用
    )
    add_handler.handle_add_memories(add_req)

    for item in questions:
        print("===== Chat Start =====")
        query = item["question"]
        print(f"Query:\n {query}\n")

        # chat_handler を使用してチャット
        chat_req = ChatPlaygroundRequest(
            user_id=user_id,
            query=query,
            readable_cube_ids=[mem_cube_id],
            writable_cube_ids=[mem_cube_id],
        )
        response = chat_stream_playground(chat_req)

        answer = ""
        buffer = ""
        async for chunk in response.body_iterator:
            if isinstance(chunk, bytes):
                chunk = chunk.decode("utf-8")
            buffer += chunk
            while "\n\n" in buffer:
                msg, buffer = buffer.split("\n\n", 1)
                for line in msg.split("\n"):
                    if line.startswith("data: "):
                        json_str = line[6:]
                        try:
                            data = json.loads(json_str)
                            if data.get("type") == "text":
                                answer += data["data"]
                        except json.JSONDecodeError:
                            pass
        print(f"\nAnswer: {answer}")


if __name__ == "__main__":
    mem_scheduler.register_handlers(
        {
            QUERY_TASK_LABEL: custom_query_handler,  # クエリタスク
            MEM_UPDATE_TASK_LABEL: custom_mem_update_handler,  # メモリ更新タスク
        }
    )

    asyncio.run(run_with_scheduler())

    time.sleep(20)
    mem_scheduler.stop()
```

::note
**ご注意ください**<br>
dump() と load() を使用して、あなたのメモリキューブを永続化してください。

ベクトルデータベースの次元が埋め込み器と一致していることを必ず確認してください。

グラフベースの平文メモリ機能を使用する場合は、Neo4j Desktop をインストールする必要があります。
::

## 次のステップ

まだ始まったばかりです！次に以下を試してみてください：

- あなたの使用シナリオに合致するサンプルを選択してください。
- モジュールを組み合わせて、よりスマートで、より永続的なエージェントを構築しましょう！

さらにサポートが必要ですか？
API ドキュメントを確認するか、あなた自身のサンプルを提供しましょう！

