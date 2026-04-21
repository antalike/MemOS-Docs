---
title: "TreeTextMemory: Деревовидная Память"
desc: >
    Давайте создадим вашу первую **графовую, деревовидную память** в MemOS!
    <br>
    **TreeTextMemory** поддерживает структурированное организацию, связывание и извлечение памяти, сохраняя при этом богатую контекстную информацию и хорошую интерпретируемость.
    <br>
    MemOS в настоящее время использует [Neo4j](/open_source/modules/memories/neo4j_graph_db) в качестве бэкенда и планирует поддерживать больше графовых баз данных в будущем.
---



## Содержание

- [Что Вы Узнаете](#что-вы-узнаете)
- [Основные Концепции и Рабочий Процесс](#основные-концепции-и-рабочий-процесс)
    - [Структура Памяти](#структура-памяти)
    - [Поля Метаданных](#поля-метаданных-treenodetextualmemorymetadata)
    - [Основной Рабочий Процесс](#основной-рабочий-процесс)
- [API Справка](#api-справка)
- [Практическое Задание: От 0 до 1](#практическое-задание-от-0-до-1)
    - [Создание Конфигурации TreeTextMemory](#создание-конфигурации-treetextmemory)
    - [Инициализация TreeTextMemory](#инициализация-treetextmemory)
    - [Извлечение Структурированной Памяти](#извлечение-структурированной-памяти)
    - [Поиск Памяти](#поиск-памяти)
    - [Извлечение Памяти из Интернета (по желанию)](#извлечение-памяти-из-интернета-по-желанию)
    - [Замена Рабочей Памяти](#замена-рабочей-памяти)
    - [Резервное Копирование и Восстановление](#резервное-копирование-и-восстановление)
    - [Полный Пример Кода](#полный-пример-кода)
- [Почему Выбирают TreeTextMemory](#почему-выбирают-treetextmemory)
- [Следующий Шаг](#следующий-шаг)

## Что Вы Узнаете

В конце этого руководства вы будете:
- Извлекать структурированную память из исходного текста или диалога
- Хранить их в графовой базе данных как **узлы**
- Связывать память в **иерархии** и семантические графы
- Использовать **векторное сходство + графовый обход** для поиска

## Основные Концепции и Рабочий Процесс

### Структура Памяти

Каждый узел в `TreeTextMemory` является `TextualMemoryItem`:
- `id`: Уникальный ID памяти (если опущен, будет сгенерирован автоматически)
- `memory`: Основной текст
- `metadata`: Включает информацию о структуре, встраивания, метки, сущности, источник и состояние

### Метаданные Поля (`TreeNodeTextualMemoryMetadata`)

| Поле            | Тип                                                   | Описание                             |
| --------------- |-------------------------------------------------------| ------------------------------------------ |
| `memory_type`   | `"WorkingMemory"`, `"LongTermMemory"`, `"UserMemory"` | Классификация Жизненного Цикла      |
| `status`        | `"activated"`, `"archived"`, `"deleted"`              | Статус Узла                         |
| `visibility`    | `"private"`, `"public"`, `"session"`                  | Область Доступа                     |
| `sources`       | `list[str]`                                           | Список Источников (например: файлы, URL) |
| `source`        | `"conversation"`, `"retrieved"`, `"web"`, `"file"`    | Тип Исходного Источника             |
| `confidence`    | `float (0-100)`                                       | Оценка Уверенности                   |
| `entities`      | `list[str]`                                           | Упомянутые Сущности или Концепции    |
| `tags`          | `list[str]`                                           | Тематические Теги                    |
| `embedding`     | `list[float]`                                         | Поиск По Сходству На Основе Векторных Встраиваний |
| `created_at`    | `str`                                                 | Временная Метка Создания (ISO 8601) |
| `updated_at`    | `str`                                                 | Временная Метка Последнего Обновления (ISO 8601) |
| `usage`         | `list[str]`                                           | История Использования                |
| `background`    | `str`                                                 | Дополнительный Контекст                        |


::note
**Лучшие Практики**<br>
  Используйте значимые метки и контекст — они помогают организовать ваш граф для многопроходного вывода.
::

### Основной Рабочий Процесс

Когда вы запускаете этот пример, ваш рабочий процесс будет:

1. **Извлечение:** Используйте LLM для извлечения структурированной памяти из исходного текста.


2. **Встраивание:** Генерируйте векторные встраивания для поиска сходства.


3. **Хранение и Связывание:** Добавьте связанные узлы в графовую базу данных (Neo4j).


4. **Поиск:** Запросите по векторному сходству, затем разверните результаты по количеству переходов в графе.


::note
**Подсказка**<br>Связи в графе помогают извлекать контекст, который может быть упущен при чистом векторном поиске!
::

## API Справка

### Инициализация

```python
TreeTextMemory(config: TreeTextMemoryConfig)
```

### Основные Методы

| Метод                      | Описание                                           |
| --------------------------- | ----------------------------------------------------- |
| `add(memories)`             | Добавить одну или несколько память (элементов или словарей)             |
| `replace_working_memory()`  | Заменить все узлы WorkingMemory                      |
| `get_working_memory()`      | Получить все узлы WorkingMemory                          |
| `search(query, top_k)`      | Использовать вектор + граф для поиска top-k памяти   |
| `get(memory_id)`            | Получить отдельную память по ID                             |
| `get_by_ids(ids)`           | Получить несколько памяти по IDs                        |
| `get_all()`                 | Экспортировать всю память в виде словаря            |
| `update(memory_id, new)`    | Обновить память по ID                                 |
| `delete(ids)`               | Удалить память по IDs                                |
| `delete_all()`              | Удалить всю память и отношения                 |
| `dump(dir)`                 | Сериализовать граф в JSON в каталоге              |
| `load(dir)`                 | Загрузить граф из сохраненного JSON файла                     |
| `drop(keep_last_n)`         | Резервное копирование графа и удаление базы данных, сохранить N резервных копий       |

### Хранение Файлов

Когда вызывается `dump(dir)`, MemOS экспортирует деревовидную память в формате JSON:

```
<dir>/<config.memory_filename>
```

Этот файл содержит структуру JSON с `nodes` и `edges`. Его можно повторно загрузить с помощью `load(dir)`.

---

## Практическое Задание: От 0 до 1

::steps{}

### Создание Конфигурации TreeTextMemory
Определите:
- Вашу модель встраивания (например, nomic-embed-text:latest),
- Ваш бэкенд графовой базы данных (Neo4j),
- Извлекатель памяти (на основе LLM) (по желанию).

```python
from memos.configs.memory import TreeTextMemoryConfig

config = TreeTextMemoryConfig.from_json_file("examples/data/config/tree_config.json")
```


### Инициализация TreeTextMemory

```python
from memos.memories.textual.tree import TreeTextMemory

tree_memory = TreeTextMemory(config)
```

### Извлечение Структурированной Памяти

Используйте извлекатель памяти для разбора диалогов, файлов или документов на несколько `TextualMemoryItem`.

#### ИспользованиеSimpleStructMemReader（базовый）

```python
from memos.mem_reader.simple_struct import SimpleStructMemReader

reader = SimpleStructMemReader.from_json_file("examples/data/config/simple_struct_reader_config.json")

scene_data = [[
    {"role": "user", "content": "Tell me about your childhood."},
    {"role": "assistant", "content": "I loved playing in the garden with my dog."}
]]

memories = reader.get_memory(scene_data, type="chat", info={"user_id": "1234"})
for m_list in memories:
    tree_memory.add(m_list)
```

#### ИспользованиеMultiModalStructMemReader（расширенный）

`MultiModalStructMemReader` поддерживает обработку мультимодального контента (текст, изображения, URL, файлы и т.д.), способный автоматически определять (умная маршрутизация) различные анализаторы:

```python
from memos.configs.mem_reader import MultiModalStructMemReaderConfig
from memos.mem_reader.multi_modal_struct import MultiModalStructMemReader

# Создание конфигурацииMultiModal Reader
multimodal_config = MultiModalStructMemReaderConfig(
    llm={
        "backend": "openai",
        "config": {
            "model_name_or_path": "gpt-4o-mini",
            "api_key": "your-api-key"
        }
    },
    embedder={
        "backend": "openai",
        "config": {
            "model_name_or_path": "text-embedding-3-small",
            "api_key": "your-api-key"
        }
    },
    chunker={
        "backend": "text_splitter",
        "config": {
            "chunk_size": 1000,
            "chunk_overlap": 200
        }
    },
    extractor_llm={
        "backend": "openai",
        "config": {
            "model_name_or_path": "gpt-4o-mini",
            "api_key": "your-api-key"
        }
    },
    # Необязательно: указать, какие домены напрямую возвращаютMarkdown
    direct_markdown_hostnames=["github.com", "docs.python.org"]
)

# ИнициализацияMultiModal Reader
multimodal_reader = MultiModalStructMemReader(multimodal_config)

# ========================================
# Пример 1: Обработка диалога с изображениями
# ========================================
scene_with_image = [[
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Это сад моего дома"},
            {"type": "image_url", "image_url": {"url": "https://example.com/garden.jpg"}}
        ]
    },
    {
        "role": "assistant",
        "content": "Ваш сад очень красивый！"
    }
]]

memories = multimodal_reader.get_memory(
    scene_with_image,
    type="chat",
    info={"user_id": "1234", "session_id": "session_001"}
)
for m_list in memories:
    tree_memory.add(m_list)
print(f"✓ Добавлено {len(memories)} многомодальных воспоминаний")

# ========================================
# Пример 2: Обработка URL веб-страницы
# ========================================
scene_with_url = [[
    {
        "role": "user",
        "content": "Пожалуйста, проанализируйте эту статью: https://example.com/article.html"
    },
    {
        "role": "assistant",
        "content": "Я помогу вам проанализировать эту статью"
    }
]]

url_memories = multimodal_reader.get_memory(
    scene_with_url,
    type="chat",
    info={"user_id": "1234", "session_id": "session_002"}
)
for m_list in url_memories:
    tree_memory.add(m_list)
print(f"✓ Извлечено и добавлено {len(url_memories)} воспоминаний из URL")

# ========================================
# Пример 3: Обработка локальных файлов
# ========================================
# Поддерживаемые Форматы Файлов: PDF, DOCX, TXT, Markdown, HTML и др.
file_paths = [
    "./documents/report.pdf",
    "./documents/notes.md",
    "./documents/data.txt"
]

file_memories = multimodal_reader.get_memory(
    file_paths,
    type="doc",
    info={"user_id": "1234", "session_id": "session_003"}
)
for m_list in file_memories:
    tree_memory.add(m_list)
print(f"✓ Из файла извлечено и добавлено {len(file_memories)} записей")

# ========================================
# Пример 4: Смешанный Режим (Текст + Изображения + URL)
# ========================================
mixed_scene = [[
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Это мой проектный документ:"},
            {"type": "text", "text": "https://github.com/user/project/README.md"},
            {"type": "image_url", "image_url": {"url": "https://example.com/diagram.png"}}
        ]
    }
]]

mixed_memories = multimodal_reader.get_memory(
    mixed_scene,
    type="chat",
    info={"user_id": "1234", "session_id": "session_004"}
)
for m_list in mixed_memories:
    tree_memory.add(m_list)
print(f"✓ Из смешанного содержимого извлечено и добавлено {len(mixed_memories)} записей")
```

::alert{type="info"}
**Преимущества MultiModal Reader**<br>
- **Умный Маршрутизатор**: Автоматически распознает тип контента (изображение/URL/файл) и выбирает подходящий парсер<br>
- **Поддержка Форматов**: Поддерживает множество форматов, включая PDF, DOCX, Markdown, HTML, изображения и т.д.<br>
- **Парсинг URL**: Автоматически извлекает содержимое веб-страниц (включая GitHub, документационные сайты и т.д.)<br>
- **Обработка Больших Файлов**: Автоматически разбивает на части очень большие файлы, чтобы избежать превышения лимита токенов<br>
- **Сохранение Контекста**: Использует скользящее окно для поддержания непрерывности контекста между частями
::

::note
**Подсказки по Конфигурации**<br>
- Используйте параметр `direct_markdown_hostnames`, чтобы указать, какие домены должны возвращать Markdown формат напрямую<br>
- Поддерживает два режима извлечения: `mode="fast"` и `mode="fine"`, режим fine извлекает более детально<br>
- Посмотреть полный пример: `/examples/mem_reader/multimodal_struct_reader.py`
::

### Поиск Памяти

Попробуйте векторный поиск + графический поиск:
```python
results = tree_memory.search("Talk about the garden", top_k=5)
for i, node in enumerate(results):
    print(f"{i}: {node.memory}")
```

### Извлечение Памяти из Интернета (по желанию)
Вы также можете в реальном времени получать содержимое веб-страниц из поисковых систем, таких как Google / Bing / Bocha (博查), и автоматически разбивать его на узлы памяти. MemOS предоставляет единый интерфейс.

Следующий пример демонстрирует, как извлечь веб-страницы, связанные с "Alibaba 2024 ESG report", и автоматически извлечь их в структурированную память.

```python

# Создание Embedder
embedder = EmbedderFactory.from_config(
    EmbedderConfigFactory.model_validate({
        "backend": "ollama",
        "config": {"model_name_or_path": "nomic-embed-text:latest"},
    })
)

# Настройка Ретривера (на примере BochaAI)
retriever_config = InternetRetrieverConfigFactory.model_validate({
    "backend": "bocha",
    "config": {
        "api_key": "sk-xxx",  # Замените на ваш BochaAI API Key
        "max_results": 5,
        "reader": {  # Конфигурация Reader с автоматическим разбиением
            "backend": "simple_struct",
            "config": ...,  # Ваша конфигурация mem-reader
        },
    }
})

# Инстанцирование Ретривера
retriever = InternetRetrieverFactory.from_config(retriever_config, embedder)

# Выполнение Веб-Поиска
results = retriever.retrieve_from_internet("Alibaba 2024 ESG report")

# Добавление в Граф Памяти
for m in results:
    tree_memory.add(m)

```
Вы также можете напрямую настроить поле internet_retriever в TreeTextMemoryConfig, например:


```json
{
  "internet_retriever": {
    "backend": "bocha",
    "config": {
      "api_key": "sk-xxx",
      "max_results": 5,
      "reader": {
        "backend": "simple_struct",
        "config": ...
      }
    }
  }
}
```

Таким образом, при вызове tree_memory.search(query) система автоматически вызовет интернет-извлечение (например, BochaAI / Google / Bing), а затем отсортирует результаты вместе с узлами локальной карты, без необходимости вручную вызывать retriever.retrieve_from_internet

### Замена Рабочей Памяти

Замените вашу текущую `WorkingMemory` новым узлом:
```python
tree_memory.replace_working_memory(
    [{
        "memory": "User is discussing gardening tips.",
        "metadata": {"memory_type": "WorkingMemory"}
    }]
)
```

### Резервное Копирование и Восстановление
Поддерживает постоянное хранилище для древовидной структуры и возможность перезагрузки в любое время:
```python
tree_memory.dump("tmp/tree_memories")
tree_memory.load("tmp/tree_memories")
```

::


### Полный Пример Кода

Этот пример объединяет все вышеперечисленные шаги и предоставляет полный процесс от начала до конца — просто скопируйте и запустите!

```python
from memos.configs.embedder import EmbedderConfigFactory
from memos.configs.memory import TreeTextMemoryConfig
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.embedders.factory import EmbedderFactory
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory

# Настройки Встраивания
embedder_config = EmbedderConfigFactory.model_validate({
    "backend": "ollama",
    "config": {"model_name_or_path": "nomic-embed-text:latest"}
})
embedder = EmbedderFactory.from_config(embedder_config)

# Создание TreeTextMemory
tree_config = TreeTextMemoryConfig.from_json_file("examples/data/config/tree_config.json")
my_tree_textual_memory = TreeTextMemory(tree_config)
my_tree_textual_memory.delete_all()

# Настройки Читателя
reader_config = SimpleStructMemReaderConfig.from_json_file(
    "examples/data/config/simple_struct_reader_config.json"
)
reader = SimpleStructMemReader(reader_config)

# Извлечение Из Диалога
scene_data = [[
    {
        "role": "user",
        "content": "Tell me about your childhood."
    },
    {
        "role": "assistant",
        "content": "I loved playing in the garden with my dog."
    },
]]
memory = reader.get_memory(scene_data, type="chat", info={"user_id": "1234", "session_id": "2222"})
for m_list in memory:
    my_tree_textual_memory.add(m_list)

# Поиск
results = my_tree_textual_memory.search(
    "Talk about the user's childhood story?",
    top_k=10
)
for i, r in enumerate(results):
    print(f"{i}'th result: {r.memory}")

# Добавление Из Документа [Опционально]
doc_paths = ["./text1.txt", "./text2.txt"]
doc_memory = reader.get_memory(
  doc_paths, "doc", info={
      "user_id": "your_user_id",
      "session_id": "your_session_id",
  }
)
for m_list in doc_memory:
    my_tree_textual_memory.add(m_list)

# Сброс И Удаление [Опционально]
my_tree_textual_memory.dump("tmp/my_tree_textual_memory")
my_tree_textual_memory.drop()
```

## Почему Выбирают TreeTextMemory

- **Структурная Иерархия:** Организуйте память как ментальную карту — узлы могут иметь родителей, детей и перекрестные ссылки.
- **Графовые Связи:** Превосходите чистую иерархию — создавайте многопроходные цепочки вывода.
- **Семантический Поиск + Графовое Расширение:** Объединяйте преимущества векторов и графиков.
- **Объяснимость:** Отслеживайте, как память соединяется, объединяется или эволюционирует со временем.

::note
**Попробуйте Это**<br>Добавьте узлы памяти из документов или веб-контента. Связывайте их вручную или автоматически объединяйте похожие узлы! 
::

## Следующий Шаг

- **Узнайте Больше [Neo4j](/open_source/modules/memories/neo4j_graph_db):** treeTextMemory поддерживается графовой базой данных. Узнайте, как Neo4j обрабатывает узлы, ребра и обходы, чтобы помочь вам спроектировать более эффективную иерархию памяти, многопроходные выводы и стратегии связи контекста.
- **Добавьте [Activation Memory](/open_source/modules/memories/kv_cache_memory):** Используйте KV-кэш во время выполнения для тестирования состояния сессии.
- **Изучите Графовые Выводы:** Создайте рабочие процессы для многопроходного извлечения и синтеза ответов.
- **Идите Дальше:** Проверьте [API Reference](/api-reference/search-memories) для продвинутых приложений или запустите больше примеров в `examples/`.

Теперь ваш агент может не только запоминать факты, но и запоминать связи между ними!
