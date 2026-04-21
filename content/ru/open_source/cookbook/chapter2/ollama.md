---
title: Linux Ollama版
---

## Дизайн Сценария

**🎯 Сценарий Проблемы:** Вы разработчик AI-приложений, который уже освоил основные операции MemOS и теперь хочет создать более структурированную систему памяти. Вы обнаружили, что базовая функция `TextualMemoryMetadata` ограничена и не может удовлетворить потребности сложных сценариев, таких как необходимость различать рабочую память и долгосрочную память, необходимость отслеживать источник памяти, необходимость добавлять теги и информацию об объектах к памяти.

**🔧 Решение:** В этой главе вы научитесь использовать `TreeNodeTextualMemoryMetadata` для создания структурированной памяти, включая управление жизненным циклом памяти, многопоточность, теги объектов и другие функции, чтобы ваше AI-приложение имело более интеллектуальную систему памяти.

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

#### 3. Тип (type)

- `fact`: Факт
- `event`: Событие
- `opinion`: Мнение
- `topic`: Тема
- `reasoning`: Рассуждение
- `procedure`: Процедура

## Рецепт 2.2: Создание Базовой Структурированной Памяти

**🎯 Сценарий Проблемы:** Вы хотите создать различные типы памяти, такие как информация о персонажах, информация о проектах, рабочие задачи и т.д., и вам нужно установить подходящие метаданные для каждого типа памяти.

**🔧 Решение:** С помощью этого рецепта вы научитесь создавать различные типы структурированной памяти.

### Пример 1: Создание Простой Памяти о Персонаже

Создание файла `create_person_memory_ollama.py`:

```python
# create_person_memory_ollama.py
# 🎯 Пример создания памяти персонажа (Ollama版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_person_memory_ollama():
    """
    🎯 Пример создания памяти персонажа (Ollama版)
    """
    
    print("🚀 Начинаем создание памяти персонажа (Ollama版)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Не настроены переменные окружения Ollama. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    
    print("✅ Обнаружен локальный режим модели Ollama")
    
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
    print(f"🎯 Режим конфигурации: OLLAMA")
    print(f"🤖 Модель чата: {ollama_chat_model}")
    print(f"🔍 Модель встраивания: {ollama_embed_model}")
    
    return memory_item

if __name__ == "__main__":
    create_person_memory_ollama() 
```

Выполните команду:

```bash
cd test_cookbook/chapter2/Ollama/2
python create_person_memory_ollama.py
```

### Пример 2: Создание Памяти о Проекте

Создать файл `create_project_memory_ollama.py`：

```python
# create_project_memory_ollama.py
# 🎯 Пример Создания Проектной Памяти (Версия Ollama)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_project_memory_ollama():
    """
    🎯 Пример Создания Проектной Памяти (Версия Ollama)
    """
    
    print("🚀 Начинаем Создание Проектной Памяти (Версия Ollama)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Не настроены переменные окружения Ollama. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    
    print("✅ Обнаружен локальный режим модели Ollama")
    
    # Получить ID пользователя
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # Метаданные Проектной Памяти
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
        memory="AI项目是一个智能客服系统，使用最新的NLP技术，预计6个月完成",
        metadata=project_metadata
    )

    print(f"Проектная Память: {project_memory.memory}")
    print(f"Источники: {project_memory.metadata.sources}")
    print(f"🎯 Режим конфигурации: OLLAMA")
    print(f"🤖 Модель чата: {ollama_chat_model}")
    print(f"🔍 Модель встраивания: {ollama_embed_model}")
    
    return project_memory

if __name__ == "__main__":
    create_project_memory_ollama() 
```

Выполните команду:

```bash
python create_project_memory_ollama.py
```

### Пример 3: Создание Рабочей Памяти

Создайте файл `create_work_memory_ollama.py`:

```python
# create_work_memory_ollama.py
# 🎯 Пример Создания Рабочей Памяти (Версия Ollama)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_work_memory_ollama():
    """
    🎯 Пример Создания Рабочей Памяти (Версия Ollama)
    """
    
    print("🚀 Начинаем Создание Рабочей Памяти (Версия Ollama)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Не настроены переменные окружения Ollama. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    
    print("✅ Обнаружен локальный режим модели Ollama")
    
    # Получить ID пользователя
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # Создание Метаданных Рабочей Памяти
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="procedure",
        source="conversation",
        confidence=80.0,
        memory_type="WorkingMemory",  # Рабочая Память
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
    print(f"🎯 Режим конфигурации: OLLAMA")
    print(f"🤖 Модель чата: {ollama_chat_model}")
    print(f"🔍 Модель встраивания: {ollama_embed_model}")
    
    return work_memory

if __name__ == "__main__":
    create_work_memory_ollama() 
```

Выполните команду:

```bash
python create_work_memory_ollama.py
```

## Рецепт 2.3: Описание и Конфигурация Часто Используемых Полей

**🎯 Сценарий Проблемы:** Вам нужно понять все доступные поля `TreeNodeTextualMemoryMetadata` и как правильно их настроить.

**🔧 Решение:** С помощью этого рецепта вы освоите значения и методы настройки всех полей.

### Описание Часто Используемых Полей

| Поле          | Тип   | Описание          | Пример                 |
| ------------- | ----- | ---------------- | ---------------------- |
| `user_id`     | str   | ID Пользователя   | "user123"            |
| `type`        | str   | Тип Памяти       | "факт", "событие"   |
| `source`      | str   | Источник          | "разговор", "файл"  |
| `confidence`  | float | Уверенность (0-100) | 90.0                 |
| `memory_type` | str   | Тип Жизненного Цикла Памяти | "ДолгосрочнаяПамять" |
| `key`         | str   | Ключ/Заголовок Памяти | "Важная Информация"  |
| `entities`    | list  | Список Сущностей  | ["Чжан Сан", "Проект"] |
| `tags`        | list  | Список тегов         | ["重要", "技术"]       |
| `sources`     | list  | Список источников         | ["文档", "会议"]       |

## Рецепт 2.4: Практическое Применение - Создание Памяти и Добавление в MemCube

**🎯 Сценарий Проблемы:** Вы уже научились создавать структурированную память и теперь хотите добавить эту память в MemCube и управлять ею.

**🔧 Решение:** С помощью этого рецепта вы научитесь интегрировать структурированную память в MemCube и реализовать полный процесс управления памятью.

Создание файла `memcube_with_structured_memories_ollama.py`:

```python
# memcube_with_structured_memories_ollama.py
# 🎯 Полный пример добавления структурированной памяти в MemCube (версия Ollama)
import os
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_memcube_config_ollama():
    """
    🎯 Создание конфигурации MemCube (версия Ollama)
    """
    
    print("🔧 Создание конфигурации MemCube (версия Ollama)...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Проверка конфигурации Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Не настроены переменные окружения Ollama. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    
    print("✅ Обнаружен локальный режим модели Ollama")
    
    # Получение конфигурации
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # Конфигурация режима Ollama
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
    
    # Создание экземпляра MemCube
    config_obj = GeneralMemCubeConfig.model_validate(cube_config)
    
    return config_obj

def create_structured_memories_ollama():
    """
    🎯 Полный пример добавления структурированной памяти в MemCube (версия Ollama)
    """
    
    print("🚀 Начало создания структурированной памяти MemCube (версия Ollama)...")
    
    # Создание конфигурации MemCube
    config = create_memcube_config_ollama()
    
    # Создание MemCube
    mem_cube = GeneralMemCube(config)
    
    print("✅ MemCube успешно создан!")
    print(f"  📊 Идентификатор пользователя: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 Текстовая Память Бэкенд: {mem_cube.config.text_mem.backend}")
    
    # Получить Конфигурацию Ollama Для Отображения
    load_dotenv()
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    print(f"  🔍 Встраиваемая Модель: {ollama_embed_model} (Ollama)")
    print(f"  🤖 Чат Модель: {ollama_chat_model} (Ollama)")
    print(f"  🎯 Конфигурационный Режим: OLLAMA")
    
    # Создать Несколько Элементов Памяти
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
        "memory": "Проект мобильного приложения в процессе, ожидается завершение через 3 месяца, команда состоит из 8 человек"
        "metadata": project_metadata
    })

    # Память 3: Рабочая Память
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="procedure",
        source="conversation",
        confidence=85.0,
        memory_type="WorkingMemory",
        key="Задачи На Эту Неделю"
        tags=["Задача", "На Эту Неделю"]
    )

    memories.append({
        "memory": "На этой неделе необходимо завершить анализ требований, проектирование прототипа и выбор технологий"
        "metadata": work_metadata
    })

    # Добавить в MemCube
    mem_cube.text_mem.add(memories)

    print("✅ Успешно добавлено 3 элемента памяти в MemCube")

    # Запрос памяти
    print("\n🔍 Запрос всех записей памяти:")
    all_memories = mem_cube.text_mem.get_all()
    for i, memory in enumerate(all_memories, 1):
        print(f"{i}. {memory.memory}")
        print(f"   Ключ: {memory.metadata.key}")
        print(f"   Тип: {memory.metadata.memory_type}")
        print(f"   Теги: {memory.metadata.tags}")
        print()

    # Поиск конкретной памяти
    print("🔍 Поиск памяти, содержащей 'Ли Сы':")
    search_results = mem_cube.text_mem.search("Ли Сы", top_k=2)
    for result in search_results:
        print(f"- {result.memory}")
    
    return mem_cube

if __name__ == "__main__":
    create_structured_memories_ollama() 
```

Выполните команду:

```bash
cd test_cookbook/chapter2/Ollama/4
python memcube_with_structured_memories_ollama.py
```

## Часто Задаваемые Вопросы и Решения

**Q1: Как выбрать подходящий memory_type?**

```python
# 🔧 Выбор В Соответствии С Важностью Памяти
if is_important:
    memory_type = "LongTermMemory"  # Долгосрочное Хранение
elif is_temporary:
    memory_type = "WorkingMemory"   # Временное Хранение
else:
    memory_type = "UserMemory"      # Персонализированное Хранение
```

**Q2: Как установить подходящее значение confidence?**

```python
# 🔧 Настройка В Соответствии С Надежностью Источника Информации
if source == "verified_document":
    confidence = 95.0
elif source == "conversation":
    confidence = 80.0
elif source == "web_search":
    confidence = 70.0
```

**Q3: Как эффективно использовать tags и entities?**

```python
# 🔧 Использование Значимых Меток И Сущностей
tags = ["项目", "技术", "重要"]  # Удобно Для Классификации И Поиска
entities = ["张三", "AI项目"]    # Удобно Для Распознавания И Связывания Сущностей
```
