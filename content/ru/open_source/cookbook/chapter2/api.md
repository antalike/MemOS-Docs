---
title: Linux API版
---

## Дизайн Сценария

**🎯 Сценарий Проблемы:** Вы разработчик AI-приложений, который уже освоил основные операции MemOS и теперь хочет создать более структурированную систему памяти. Вы обнаружили, что базовая функция `TextualMemoryMetadata` ограничена и не может удовлетворить потребности сложных сценариев, таких как необходимость различать рабочую память и долгосрочную память, необходимость отслеживать источник памяти, необходимость добавлять метки и информацию о сущностях к памяти.

**🔧 Решение:** В этой главе вы научитесь использовать `TreeNodeTextualMemoryMetadata` для создания структурированной памяти, включая управление жизненным циклом памяти, многопоточность, метки сущностей и другие функции, чтобы ваше AI-приложение имело более интеллектуальную систему памяти.

## Рецепт 2.1: Понимание Основных Концепций TreeNodeTextualMemoryMetadata

**🎯 Сценарий Проблемы:** Вы хотите понять различия между `TreeNodeTextualMemoryMetadata` и базовыми метаданными, а также его основные функции.

**🔧 Решение:** С помощью этого рецепта вы освоите основные концепции и базовую структуру `TreeNodeTextualMemoryMetadata`.

### Основной Импорт

```python
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata
```

### Основные Концепции

#### 1. Тип Памяти (memory_type)

- `WorkingMemory`: Рабочая Память, Временное Хранение
- `LongTermMemory`: Долгосрочная Память, Постоянное Хранение  
- `UserMemory`: Память Пользователя, Персонализированное Хранение

#### 2. Состояние Памяти (status)

- `activated`: Активированное Состояние
- `archived`: Архивированное Состояние
- `deleted`: Удаленное Состояние

#### 3. Тип Памяти (type)

- `fact`: Факт
- `event`: Событие
- `opinion`: Мнение
- `topic`: Тема
- `reasoning`: Рассуждение
- `procedure`: Процедура

## Рецепт 2.2: Создание Базовой Структурированной Памяти

**🎯 Сценарий Проблемы:** Вы хотите создать различные типы памяти, такие как информация о персонажах, информация о проектах, рабочие задачи и т.д., и необходимо установить соответствующие метаданные для каждого типа памяти.

**🔧 Решение:** С помощью этого рецепта вы научитесь создавать различные типы структурированной памяти.

### Пример 1: Создание Простой Памяти о Персонаже

Создание файла `create_person_memory_api.py`:

```python
# create_person_memory_api.py
# 🎯 Пример создания памяти персонажа (API版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_person_memory_api():
    """
    🎯 Пример создания памяти персонажа (API版)
    """
    
    print("🚀 Начинаем создание памяти персонажа (API版)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации API
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("❌ Не настроен OPENAI_API_KEY. Пожалуйста, настройте ключ API OpenAI в файле .env.")
    
    print("✅ Обнаружен режим API OpenAI")
    
    # Получить ID пользователя
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # Создать метаданные для памяти персонажа
    metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="fact",
        source="conversation",
        confidence=90.0,
        memory_type="LongTermMemory",
        key="张三_信息",
        entities=["张三", "工程师"],
        tags=["人员", "技术"]
    )

    # Создать элемент памяти
    memory_item = TextualMemoryItem(
        memory="张三是我们公司的资深工程师，擅长Python和机器学习",
        metadata=metadata
    )

    print(f"Содержимое памяти: {memory_item.memory}")
    print(f"Ключ памяти: {memory_item.metadata.key}")
    print(f"Тип памяти: {memory_item.metadata.memory_type}")
    print(f"Теги: {memory_item.metadata.tags}")
    print(f"🎯 Режим конфигурации: OPENAI API")
    
    return memory_item

if __name__ == "__main__":
    create_person_memory_api()
```

Выполните команду:

```bash
cd test_cookbook/chapter2/API/2
python create_person_memory_api.py
```

### Пример 2: Создание Памяти о Проекте

Создать файл `create_project_memory_api.py`：

```python
# create_project_memory_api.py
# 🎯 Пример создания памяти проекта (API-версия)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_project_memory_api():
    """
    🎯 Пример создания памяти проекта (API-версия)
    """
    
    print("🚀 Начинаем создание проектной памяти (API версия)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации API
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("❌ Не настроен OPENAI_API_KEY. Пожалуйста, настройте ключ API OpenAI в файле .env.")
    
    print("✅ Обнаружен режим API OpenAI")
    
    # Получить ID пользователя
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # Создание метаданных проектной памяти
    project_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="fact",
        source="file",
        confidence=95.0,
        memory_type="LongTermMemory",
        key="AI项目_详情",
        entities=["AI项目", "机器学习"],
        tags=["项目", "AI", "重要"],
        sources=["项目文档", "会议记录"]
    )

    # Создать элемент памяти
    project_memory = TextualMemoryItem(
        memory="AI项目 является интеллектуальной системой обслуживания клиентов, использующей новейшие технологии NLP, планируется завершение за 6 месяцев",
        metadata=project_metadata
    )

    print(f"Проектная память: {project_memory.memory}")
    print(f"Источник: {project_memory.metadata.sources}")
    print(f"🎯 Режим конфигурации: OPENAI API")
    
    return project_memory

if __name__ == "__main__":
    create_project_memory_api() 
```

Выполните команду:

```bash
python create_project_memory_api.py
```

### Пример 3: Создание Рабочей Памяти

Создание файла `create_work_memory_api.py`：

```python
# create_work_memory_api.py
# 🎯 Пример создания рабочей памяти (API версия)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_work_memory_api():
    """
    🎯 Пример создания рабочей памяти (API версия)
    """
    
    print("🚀 Начинаем создание рабочей памяти (API версия)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации API
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("❌ Не настроен OPENAI_API_KEY. Пожалуйста, настройте ключ API OpenAI в файле .env.")
    
    print("✅ Обнаружен режим API OpenAI")
    
    # Получить ID пользователя
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # Создание метаданных рабочей памяти
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="procedure",
        source="conversation",
        confidence=80.0,
        memory_type="WorkingMemory",  # Рабочая память
        key="Сегодняшние Задачи",
        tags=["Задача", "Сегодня"]
    )

    # Создать элемент памяти
    work_memory = TextualMemoryItem(
        memory="Сегодня необходимо завершить код-ревью, командное собрание и подготовить презентацию на завтра",
        metadata=work_metadata
    )

    print(f"Рабочая Память: {work_memory.memory}")
    print(f"Тип Памяти: {work_memory.metadata.memory_type}")
    print(f"🎯 Режим конфигурации: OPENAI API")
    
    return work_memory

if __name__ == "__main__":
    create_work_memory_api() 
```

Выполните команду:

```bash
python create_work_memory_api.py
```

## Рецепт 2.3: Описание и Конфигурация Часто Используемых Полей

**🎯 Сценарий Проблемы:** Вам нужно узнать о всех доступных полях `TreeNodeTextualMemoryMetadata` и о том, как правильно их настроить.

**🔧 Решение:** С помощью этого рецепта вы освоите значения и методы настройки всех полей.

### Описание Часто Используемых Полей

| Поле          | Тип   | Описание          | Пример                 |
| ------------- | ----- | ---------------- | ---------------------- |
| `user_id`     | str   | Идентификатор Пользователя | "user123"              |
| `type`        | str   | Тип Памяти       | "факт", "событие"     |
| `source`      | str   | Источник         | "разговор", "файл"    |
| `confidence`  | float | Уверенность (0-100) | 90.0                   |
| `memory_type` | str   | Тип Жизненного Цикла Памяти | "ДолгосрочнаяПамять"       |
| `key`         | str   | Ключ/Заголовок Памяти | "Важная Информация"     |
| `entities`    | list  | Список Сущностей | ["Чжан Сан", "Проект"] |
| `tags`        | list  | Список Меток     | ["Важный", "Технический"] |
| `sources`     | list  | Мульти-Источник   | ["Документ", "Собрание"] |

## Рецепт 2.4: Практическое Применение - Создание Памяти и Добавление в MemCube

**🎯 Сценарий Проблемы:** Вы уже научились создавать структурированную память и теперь хотите добавить эту память в MemCube и управлять ею.

**🔧 Решение:** С помощью этого рецепта вы научитесь интегрировать структурированную память в MemCube и реализовать полный процесс управления памятью.

Создайте файл `memcube_with_structured_memories_api.py`:

```python
# memcube_with_structured_memories_api.py
# 🎯 Полный пример добавления структурированной памяти в MemCube (API-версия)
import os
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_memcube_config_api():
    """
    🎯 Создайте конфигурацию MemCube (API-версия)
    """
    
    print("🔧 Создание конфигурации MemCube (API-версия)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации API
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    
    if not openai_key:
        raise ValueError("❌ Не настроен OPENAI_API_KEY. Пожалуйста, настройте ключ API OpenAI в файле .env.")
    
    print("✅ Обнаружен режим API OpenAI")
    
    # Получить конфигурацию
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # Конфигурация режима OpenAI
    config = GeneralMemCubeConfig(
        user_id=user_id,
        cube_id=f"{user_id}_structured_memories_cube",
        text_mem={
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-3.5-turbo",
                        "api_key": openai_key,
                        "api_base": openai_base,
                        "temperature": 0.1,
                        "max_tokens": 1024,
                    }
                },
                "embedder": {
                    "backend": "universal_api",
                    "config": {
                        "provider": "openai",
                        "api_key": openai_key,
                        "model_name_or_path": "text-embedding-ada-002",
                        "base_url": openai_base,
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_structured_memories",
                        "vector_dimension": 1536,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        act_mem={"backend": "uninitialized"},
        para_mem={"backend": "uninitialized"}
    )
    
    return config

def create_structured_memories_api():
    """
    🎯 Полный пример добавления структурированной памяти в MemCube (API-версия)
    """
    
    print("🚀 Начинаем создание структурированной памяти MemCube (API-версия)...")
    
    # Создание конфигурации MemCube
    config = create_memcube_config_api()
    
    # Создание MemCube
    mem_cube = GeneralMemCube(config)
    
    print("✅ MemCube успешно создан!")
    print(f"  📊 Идентификатор пользователя: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 Бэкенд текстовой памяти: {mem_cube.config.text_mem.backend}")
    print(f"  🔍 Модель встраивания: text-embedding-ada-002 (OpenAI)")
    print(f"  🎯 Режим конфигурации: OPENAI API")
    
    # Создание Нескольких Элементов Памяти
    memories = []

    # Память 1: Информация о Персоне
    person_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="fact",
        source="conversation",
        confidence=90.0,
        memory_type="LongTermMemory",
        key="李四_信息",
        entities=["李四", "设计师"],
        tags=["人员", "设计"]
    )

    memories.append({
        "memory": "李四是我们的UI设计师，有5年经验，擅长用户界面设计",
        "metadata": person_metadata
    })

    # Память 2: Информация о Проекте
    project_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="fact",
        source="file",
        confidence=95.0,
        memory_type="LongTermMemory",
        key="移动应用项目",
        entities=["移动应用", "开发"],
        tags=["项目", "移动端", "重要"]
    )

    memories.append({
        "memory": "移动应用项目正在进行中，预计3个月完成，团队有8个人",
        "metadata": project_metadata
    })

    # Память 3: Рабочая Память
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="procedure",
        source="conversation",
        confidence=85.0,
        memory_type="WorkingMemory",
        key="本周任务",
        tags=["任务", "本周"]
    )

    memories.append({
        "memory": "本周需要完成需求分析、原型设计、以及技术选型",
        "metadata": work_metadata
    })

    # Добавить в MemCube
    mem_cube.text_mem.add(memories)

    print("✅ Успешно добавлено 3 элемента памяти в MemCube")

    # Запрос памяти
    print("\n🔍 Запрос всех воспоминаний:")
    all_memories = mem_cube.text_mem.get_all()
    for i, memory in enumerate(all_memories, 1):
        print(f"{i}. {memory.memory}")
        print(f"   Ключ: {memory.metadata.key}")
        print(f"   Тип: {memory.metadata.memory_type}")
        print(f"   Метки: {memory.metadata.tags}")
        print()

    # Поиск конкретной памяти
    print("🔍 Поиск памяти, содержащей '李四':")
    search_results = mem_cube.text_mem.search("李四", top_k=2)
    for result in search_results:
        print(f"- {result.memory}")
    
    return mem_cube

if __name__ == "__main__":
    create_structured_memories_api() 
```

Выполните команду:

```bash
cd test_cookbook/chapter2/API/4
python memcube_with_structured_memories_api.py
```

## Часто Задаваемые Вопросы и Решения

**Q1: Как выбрать подходящий memory_type?**

```python
# 🔧 Выбор в зависимости от важности памяти
if is_important:
    memory_type = "LongTermMemory"  # Долгосрочное хранение
elif is_temporary:
    memory_type = "WorkingMemory"   # Временное хранение
else:
    memory_type = "UserMemory"      # Персонализированное хранение
```

**Q2: Как установить подходящее значение confidence?**

```python
# 🔧 Установка в зависимости от надежности источника информации
if source == "verified_document":
    confidence = 95.0
elif source == "conversation":
    confidence = 80.0
elif source == "web_search":
    confidence = 70.0
```

**Q3: Как эффективно использовать tags и entities?**

```python
# 🔧 Используйте Значимые Метки и Сущности
tags = ["Проект", "Технология", "Важно"]  # Удобно для Классификации и Поиска
entities = ["Чжан Сан", "AI项目"]    # Удобно для Распознавания и Связывания Сущностей
```
