---
title: MemCube
desc: "MemCube — это ваш "ящик для памяти", который управляет тремя типами памяти: открытой памятью, активной памятью и параметрической памятью. Он предоставляет простой интерфейс для загрузки, сохранения и работы с несколькими модулями памяти, позволяя разработчикам легко создавать, сохранять и делиться приложениями для улучшения памяти."
---
## Что такое MemCube?

**MemCube** — это контейнер, который включает три основных типа памяти:

- **Открытая память** (например, `GeneralTextMemory`, `TreeTextMemory`): используется для хранения и извлечения неструктурированных или структурированных текстовых знаний.
- **Активная память** (например, `KVCacheMemory`): используется для хранения кэшированных значений для ускорения вывода LLM и повторного использования контекста.
- **Параметрическая память** (например, `LoRAMemory`): используется для хранения параметров адаптации модели (например, весов LoRA).

Каждый тип памяти можно настраивать независимо и гибко комбинировать в зависимости от потребностей приложения.

## Структура

MemCube определяется конфигурацией (см. `GeneralMemCubeConfig`), которая указывает бэкенд и настройки для каждого типа памяти. Типичная структура выглядит так:

```
MemCube
 ├── user_id
 ├── cube_id
 ├── text_mem: TextualMemory
 ├── act_mem: ActivationMemory
 └── para_mem: ParametricMemory
```

Все модули памяти доступны через интерфейс MemCube:

- `mem_cube.text_mem`
- `mem_cube.act_mem`
- `mem_cube.para_mem`

## Архитектура View

Начиная с MemOS 2.0, операции во время выполнения (добавление/поиск) должны выполняться через **архитектуру View**:

### SingleCubeView

Используется для управления одним MemCube. Применяется, когда системе требуется только одно пространство памяти.

```python
from memos.multi_mem_cube.single_cube import SingleCubeView

view = SingleCubeView(
    cube_id="my_cube",
    naive_mem_cube=naive_mem_cube,
    mem_reader=mem_reader,
    mem_scheduler=mem_scheduler,
    logger=logger,
    searcher=searcher,
    feedback_server=feedback_server,  # Необязательно
)

# Добавить Память
view.add_memories(add_request)

# Поиск Памяти
view.search_memories(search_request)
```

### CompositeCubeView

Используется для управления несколькими MemCube. Применяется, когда необходимо выполнять единые операции через несколько пространств памяти.

```python
from memos.multi_mem_cube.composite_cube import CompositeCubeView

# Создать Несколько SingleCubeView
view1 = SingleCubeView(cube_id="cube_1", ...)
view2 = SingleCubeView(cube_id="cube_2", ...)

# Комбинированный Вид для Множественных Операций с Cube
composite = CompositeCubeView(cube_views=[view1, view2], logger=logger)

# Поиск по Всем Cube
results = composite.search_memories(search_request)
# Результаты Включают Поле cube_id для Идентификации Источника
```

### Поля запроса API

#### Добавление памяти (режим add)

| Поле                  | Описание                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `writable_cube_ids` | Целевой cube для операции add                                       |
| `async_mode`        | `"async"` (включает фоновую обработку scheduler) или `"sync"` (отключает синхронную обработку scheduler) |

#### Поиск памяти (режим search)

| Поле                  | Описание                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `readable_cube_ids` | Целевой cube для операции search                                     |
| `async_mode`        | `"async"` (включает фоновую обработку scheduler) или `"sync"` (отключает синхронную обработку scheduler) |

## Основные методы (GeneralMemCube)

GeneralMemCube — это стандартная реализация MemCube, которая управляет всеми памятью системы через единый интерфейс. GeneralMemCube предоставляет следующие основные методы для управления жизненным циклом данных памяти.

### Инициализация

```python
from memos.mem_cube.general import GeneralMemCube
mem_cube = GeneralMemCube(config)
```

### Операции со статическими данными

| Метод                                      | Описание                                      |
| ----------------------------------------- | ----------------------------------------- |
| `init_from_dir(dir)`                    | Загружает MemCube из локального каталога                    |
| `init_from_remote_repo(repo, base_url)` | Загружает MemCube из удаленного репозитория (например, Hugging Face) |
| `load(dir)`                             | Загружает все воспоминания в существующий экземпляр из каталога              |
| `dump(dir)`                             | Сохранить все воспоминания в директорию для постоянного хранения              |

## Хранение файлов

Каталог после сохранения MemCube содержит следующие файлы, каждый из которых соответствует одному типу памяти:

- `config.json` (Конфигурация MemCube)
- `textual_memory.json` (Открытая память)
- `activation_memory.pickle` (Активная память)
- `parametric_memory.adapter` (Параметрическая память)

## Примеры использования

### Пример экспорта (dump_cube.py)

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

# 1. Инициализация сервиса
components = init_server()
naive = components["naive_mem_cube"]

# 2. Создание SingleCubeView
view = SingleCubeView(
    cube_id=EXAMPLE_CUBE_ID,
    naive_mem_cube=naive,
    mem_reader=components["mem_reader"],
    mem_scheduler=components["mem_scheduler"],
    logger=logger,
    searcher=components["searcher"],
    feedback_server=components["feedback_server"],
)

# 3. Добавление воспоминаний через View
result = view.add_memories(APIADDRequest(
    user_id=EXAMPLE_USER_ID,
    writable_cube_ids=[EXAMPLE_CUBE_ID],
    messages=[
        {"role": "user", "content": "This is a test memory"},
        {"role": "user", "content": "Another memory to persist"},
    ],
    async_mode="sync",  # Использовать синхронный режим для немедленного завершения
))
print(f"✓ Added {len(result)} memories")

# 4. Экспорт данных для конкретного cube_id
output_dir = "tmp/mem_cube_dump"
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir, exist_ok=True)

# Экспорт графовых данных (экспортировать только данные текущего cube_id)
json_data = naive.text_mem.graph_store.export_graph(
    include_embedding=True,  # Включить embedding для поддержки семантического поиска
    user_name=EXAMPLE_CUBE_ID,  # Фильтрация по cube_id
)

# Исправление формата embedding: разобрать строку в список для совместимости с импортом
import contextlib
for node in json_data.get("nodes", []):
    metadata = node.get("metadata", {})
    if "embedding" in metadata and isinstance(metadata["embedding"], str):
        with contextlib.suppress(json.JSONDecodeError):
            metadata["embedding"] = json.loads(metadata["embedding"])

print(f"✓ Exported {len(json_data.get('nodes', []))} nodes")

# Сохранить в файл
memory_file = os.path.join(output_dir, "textual_memory.json")
with open(memory_file, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"✓ Saved to: {memory_file}")
```

### Пример импорта и поиска (load_cube.py)

> **Примечание о совместимости встраивания**: Примерные данные используют модель **bge-m3** с размерностью **1024**. Если ваша среда использует другую модель встраивания или размерность, семантический поиск после импорта может быть неточным или неудачным. Пожалуйста, убедитесь, что ваша конфигурация `.env` соответствует конфигурации встраивания во время экспорта.

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

# 1. Инициализация сервиса
components = init_server()
naive = components["naive_mem_cube"]

# 2. Создание SingleCubeView
view = SingleCubeView(
    cube_id=EXAMPLE_CUBE_ID,
    naive_mem_cube=naive,
    mem_reader=components["mem_reader"],
    mem_scheduler=components["mem_scheduler"],
    logger=logger,
    searcher=components["searcher"],
    feedback_server=components["feedback_server"],
)

# 3. Загрузка Данных Из Файла В graph_store
load_dir = "examples/data/mem_cube_tree"
memory_file = os.path.join(load_dir, "textual_memory.json")

with open(memory_file, encoding="utf-8") as f:
    json_data = json.load(f)

naive.text_mem.graph_store.import_graph(json_data, user_name=EXAMPLE_CUBE_ID)

nodes = json_data.get("nodes", [])
print(f"✓ Imported {len(nodes)} nodes")

# 4. Отображение Загруженных Данных
print(f"\nLoaded {len(nodes)} memories:")
for i, node in enumerate(nodes[:3], 1):  # Отображение Первых 3 Записей
    metadata = node.get("metadata", {})
    memory_text = node.get("memory", "N/A")
    mem_type = metadata.get("memory_type", "unknown")
    print(f"  [{i}] Type: {mem_type}")
    print(f"      Content: {memory_text[:60]}...")

# 5. Проверка Семантического Поиска
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
for i, mem in enumerate(memories[:2], 1):  # Отображение Первых 2 Записей
    print(f"  [{i}] {mem.get('memory', 'N/A')[:60]}...")
```

### Полный пример

Смотрите примеры в репозитории кода:

- `MemOS/examples/mem_cube/dump_cube.py` - Экспорт Данных MemCube (add + export)
- `MemOS/examples/mem_cube/load_cube.py` - Импорт Данных MemCube И Проведение Семантического Поиска (import + search)

### Примечание о старом API

Способ прямого вызова `mem_cube.text_mem.get_all()` в ранних версиях устарел, пожалуйста, используйте архитектуру View. Старые примеры перемещены в `MemOS/examples/mem_cube/_deprecated/`.

## Примечания для разработчиков

* MemCube обеспечивает согласованность режима, гарантируя безопасную загрузку/выгрузку
* Каждый тип памяти является заменяемым и поддерживает независимое тестирование
* См. `/tests/mem_cube/` для получения информации о интеграционном тестировании и режимах использования
