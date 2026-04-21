---
title: MemOS Пример
desc: "Поздравляем! Вы уже освоили быстрый старт и построили свою первую рабочую память! Теперь пришло время объединить различные типы памяти и функции, чтобы увидеть, какие возможности может реализовать MemOS. Используйте эти отобранные примеры, чтобы вдохновить своих собственных агентов, чат-ботов или системы знаний."
---

::card-group

  :::card
  ---
  icon: ri:play-line
  title: Самый Простой Pipeline 
  to: /cn/open_source/getting_started/examples#示例-1СамыйПростойPipeline
  ---
  Минимальный рабочий Pipeline  — добавление и поиск открытой памяти.
  :::

  :::card
  ---
  icon: ri:tree-line
  title: Добавление и извлечение из нескольких источников информации
  to: /cn/open_source/getting_started/examples#示例-2多信息源记忆的添加与检索
  ---
  Добавление текстовых, изображений, файлов и вызовов инструментов из нескольких источников в память и возможность их извлечения.
  :::

  :::card
  ---
  icon: ri:apps-line
  title: Добавление И Извлечение Нескольких Cube
  to: /cn/open_source/getting_started/examples#示例-3ДобавлениеИИзвлечениеНесколькихCube
  ---
  Добавление различных воспоминаний в разные Cube и одновременное их извлечение.
  :::

  :::card
  ---
  icon: ri:database-2-line
  title: Только KVCacheMemory
  to: /cn/open_source/getting_started/examples#示例-4Только-KVCacheMemory
  ---
  Использование краткосрочного KV cache для ускорения сессий и быстрого внедрения контекста.
  :::

  :::card
  ---
  icon: ri:calendar-check-line
  title: Планирование Памяти
  to: /cn/open_source/getting_started/examples#示例-5ПланированиеНесколькихПамятей
  ---
  Запуск динамических вызовов памяти для многопользовательских и многосессионных агентов.
  :::

::

## Пример 1: Минимальный Pipeline

### Когда использовать:
- Вы хотите минимальный рабочий пример.
- Вам нужно просто сохранить простую открытую память в базе данных и иметь возможность ее извлекать.

### Ключевые моменты:
- Поддержка базового добавления и поиска личной пользовательской памяти.

### Полный пример кода
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

## Пример 2: Добавление и извлечение памяти из нескольких источников

### Когда использовать:

- Вам нужно добавить файлы, изображения или историю вызовов инструментов в память, помимо простого текстового диалога.
- При этом вы хотите извлекать память из этих многопоточных источников.

### Ключевые моменты:

- Добавление памяти из различных источников информации.
- Необходимы загружаемые файлы и URL изображений.
- Добавленная информация должна строго соответствовать формату OpenAI Messages.
- Схема инструмента в системном запросе должна быть обернута в <tool_schema> </tool_schema>.

### Полный пример кода
Добавление текста + файлов в память.
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
Добавление сообщений из нескольких смешанных источников в память.
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

## Пример 3: Добавление и извлечение из нескольких Cube

### Когда использовать:

- Добавление памяти в разные изолированные пространства Cube.
- Вы хотите одновременно извлекать память из разных пространств Cube.

### Ключевые моменты:

- Ввод списка readable_cube_ids, содержащего несколько идентификаторов cube, при извлечении.

### Полный пример кода
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

## 示例 4：Только KVCacheMemory

### Когда использовать:

- Вы хотите краткосрочную рабочую память для ускорения многократных диалогов.
- Подходит для ускорения сессий чат-ботов или повторного использования подсказок.
- Лучше всего подходит для кэширования скрытых состояний / пар KV.

### Ключевые моменты:

- Использование KVCacheMemory без явной открытой памяти.
- Демонстрация извлечения → добавления → объединения → получения → удаления.
- Показано, как экспортировать/загружать KV cache.

### Полный пример кода


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


# Создание Конфигурации Для KVCacheMemory (HuggingFace Backend)
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

# Инстанцирование KVCacheMemory
kv_mem = MemoryFactory.from_config(config)

# Извлечение Одного KVCacheItem (DynamicCache)
prompt = [
    {"role": "user", "content": "What is MemOS?"},
    {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
]
print("===== Extract KVCacheItem =====")
cache_item = kv_mem.extract(prompt)
print(json.dumps(serialize_item(cache_item), indent=2, default=str))

# Добавление Кэша В Память
kv_mem.add([cache_item])
print("All caches:")
print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))

# Получение По ID
retrieved = kv_mem.get(cache_item.id)
print("Retrieved:")
print(json.dumps(serialize_item(retrieved), indent=2, default=str))

# Объединение Кэша
item2 = kv_mem.extract([{"role": "user", "content": "Tell me a joke."}])
kv_mem.add([item2])
merged = kv_mem.get_cache([cache_item.id, item2.id])
print("Merged cache:")
print(json.dumps(serialize_item(merged), indent=2, default=str))

# Удалить Один Из Них
kv_mem.delete([cache_item.id])
print("After delete:")
print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))

# Экспорт И Загрузка Кэша
kv_mem.dump("tmp/kv_mem")
print("Dumped to tmp/kv_mem")
kv_mem.delete_all()
kv_mem.load("tmp/kv_mem")
print("Loaded caches:")
print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))
```

## Пример 5: Планирование памяти

### Когда использовать:

- Вы хотите настроить логику планирования памяти или расширить фоновые задачи для постоянного управления и оптимизации памяти с помощью асинхронных триггеров.
- Подходит для SaaS агентов или задач LLM с многократными диалогами.
- Демонстрация настройки и запуска задач управления памятью MemScheduler.

### Ключевые моменты:

- Регистрация пользовательских обратных вызовов через `mem_scheduler.register_handlers`.
- Использование `add_handler` и `chat_stream_playground` для взаимодействия.
- Показано, как получить и использовать экземпляр MemScheduler, инициализированный из переменных окружения.

### Полный пример кода

```python
import asyncio
import json
import os
import sys
import time

from pathlib import Path


# Установить Путь Перед Импортом В Зависимостях
FILE_PATH = Path(__file__).absolute()
BASE_DIR = FILE_PATH.parent.parent.parent
sys.path.insert(0, str(BASE_DIR))  # Включить Выполнение Из Любой Рабочей Директории

# Установить Переменные Среды Перед Импортом server_router, Чтобы Убедиться, Что Компоненты Правильно Инициализированы
os.environ["ENABLE_CHAT_API"] = "true"

from memos.api.product_models import APIADDRequest, ChatPlaygroundRequest  # noqa: E402

# Импортировать Из server_router Для Инициализации
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
        # Вопрос 1 (Питомец) - Имя
        {"role": "user", "content": "What's my dog's name again?"},
        {"role": "assistant", "content": "Your dog is named Max."},
        # Вопрос 2 (Питомец) - Порода
        {"role": "user", "content": "Can you remind me what breed Max is?"},
        {"role": "assistant", "content": "Max is a golden retriever."},
        # Вопрос 3 (Питомец) - Лакомства
        {"role": "user", "content": "What treats does Max like?"},
        {"role": "assistant", "content": "He loves peanut butter biscuits."},
        # Вопрос 4 (Адрес)
        {"role": "user", "content": "Where did I say I live?"},
        {"role": "assistant", "content": "You live near Central Park in New York."},
        # Вопрос 5 (Аллергия)
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


# Определить Пользовательскую Функцию Обработки Запросов
def custom_query_handler(messages: list[ScheduleMessageItem]):
    for msg in messages:
        # Печать Введенного Пользователем Содержимого
        print(f"\n[scheduler] User input query: {msg.content}")
        # Вручную Сформировать Новое Сообщение С Меткой MEM_UPDATE Для Запуска Обновления Памяти
        new_msg = msg.model_copy(update={"label": MEM_UPDATE_TASK_LABEL})
        # Отправить Сообщение На Обработку Диспетчеру
        mem_scheduler.submit_messages([new_msg])


# Определение Пользовательской Функции Обработки Обновления Памяти
def custom_mem_update_handler(messages: list[ScheduleMessageItem]):
    global working_memories
    search_args = {}
    top_k = 2
    for msg in messages:
        # Поиск связанных с текущим содержимым воспоминаний в текстовой памяти (возвращает top_k=2)
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

    # Инициализация с использованием компонента server_router
    # Конфигурация загрузки через переменные окружения в init_server()

    user_id = "user_1"
    mem_cube_id = "mem_cube_5"

    print(f"Adding conversations for user {user_id}...")

    # Добавление памяти с помощью add_handler
    add_req = APIADDRequest(
        user_id=user_id,
        writable_cube_ids=[mem_cube_id],
        messages=conversations,
        async_mode="sync",  # Использование синхронного режима в этом примере для немедленного добавления
    )
    add_handler.handle_add_memories(add_req)

    for item in questions:
        print("===== Chat Start =====")
        query = item["question"]
        print(f"Query:\n {query}\n")

        # Использование chat_handler для общения
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
            QUERY_TASK_LABEL: custom_query_handler,  # Задача запроса
            MEM_UPDATE_TASK_LABEL: custom_mem_update_handler,  # Задача обновления памяти
        }
    )

    asyncio.run(run_with_scheduler())

    time.sleep(20)
    mem_scheduler.stop()
```

::note
**Обратите внимание**<br>
Используйте dump() и load() для постоянного хранения вашего куба памяти.

Обязательно убедитесь, что размерность вашей векторной базы данных соответствует вашему эмбеддеру.

Если вы используете функции открытой памяти на основе графов, вам необходимо установить Neo4j Desktop.
::

## Следующий шаг

Вы только начали! Теперь вы можете попробовать:

- Выбрать пример, соответствующий вашему сценарию использования.
- Комбинировать модули для создания более умных и долговечных агентов!

Нужна дополнительная помощь?
Посмотрите документацию API или внесите свой собственный пример!

