---
title: Создайте Вашу Первую Память
desc: "Практическое занятие! Мы покажем вам, как использовать **SimpleStructMemReader** для извлечения памяти из диалога и сохранения ее в **TreeTextMemory** для управления и поиска."
---

## Цели Обучения

Этот учебник проведет вас через основной рабочий процесс MemOS, освоив следующие навыки:

1.  **Чтение (Read)**: Как использовать `SimpleStructMemReader`, чтобы превратить беспорядочные записи чата в структурированную память.
2.  **Сохранение (Add)**: Как сохранить извлеченную память в `TreeTextMemory` (графовая база данных).
3.  **Поиск (Search)**: Как использовать естественный язык для поиска сохраненной памяти.

---

## Введение в Основные Компоненты

Перед тем как начать практическое занятие, давайте познакомимся с двумя ключевыми компонентами, которые мы будем использовать:

### SimpleStructMemReader (Извлекатель Структурированной Памяти)

Это интеллектуальный модуль извлечения информации на основе LLM, который может:
 - Автоматически анализировать диалоги, документы и другие неструктурированные данные
 - Выявлять предпочтения пользователей, фактические утверждения, модели поведения и другую ключевую информацию
 - Выводить стандартизированные структурированные единицы памяти

### TreeTextMemory (Деревовидная Текстовая База Памяти)

Это система управления памятью на основе графовой базы данных, которая может:
 - Организовывать память в древовидной структуре, поддерживая иерархические отношения
 - Устанавливать семантические связи между памятью
 - Поддерживать эффективный семантический поиск и обход графа
 - Совместима с графовыми базами данных, такими как Neo4j

## Попробуйте Сами

Мы продемонстрируем на конкретном примере: как извлечь ключевую информацию из диалога пользователя о "плохом состоянии в теннисе" и создать систему памяти, которую можно искать.

### 1. Импорт Модуля

```python
from memos import log
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.configs.memory import TreeTextMemoryConfig
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory

logger = log.get_logger(__name__)
```

### 2. Инициализация Основных Компонентов

```python

# 1. Инициализация TreeTextMemory (Склад Памяти)
tree_config = TreeTextMemoryConfig.from_json_file(
    "examples/data/config/tree_config_shared_database.json"
)
my_tree_textual_memory = TreeTextMemory(tree_config)

# ⚠️ Внимание: Здесь для удобства демонстрации очищены старые данные. В производственной среде ни в коем случае не делайте этого!
my_tree_textual_memory.delete_all()

# 2. Инициализация SimpleStructMemReader (Извлекатель Информации)
reader_config = SimpleStructMemReaderConfig.from_json_file(
    "examples/data/config/simple_struct_reader_config.json"
)
reader = SimpleStructMemReader(reader_config)
```

### 3. Подготовка Диалога

Вот диалог между пользователем и ИИ, в котором пользователь выражает проблему состояния во время игры в теннис:

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
        # ... (пропущено несколько раундов обсуждений) ...
        {
            "role": "user",
            "chat_time": "3 May 2025",
            "content": "I think it might be due to stress and lack of sleep recently...",
        },
    ]
]
```

### 4. Извлечение и Сохранение

**SimpleStructMemReader** автоматически проанализирует диалог, извлечет ключевые точки памяти, такие как "пользователь испытывает стресс", "недостаток сна", "падение результатов в теннисе", и затем сохранит их в базе данных.

```python
# 1. Извлечение (Extract)
# Reader будет вызывать LLM для анализа диалога и возвращать список памяти
memory = reader.get_memory(
    scene_data, 
    type="chat", 
    info={"user_id": "1234", "session_id": "2222"}
)

# 2. Хранение (Add)
for m_list in memory:
    added_ids = my_tree_textual_memory.add(m_list)
    
    # Посмотрим, что было сохранено
    for i, id in enumerate(added_ids):
        print(f"Сохранена {i}-я запись памяти: " + my_tree_textual_memory.get(id).memory)
    
    # Ждем завершения обработки на фоне (создание индекса требует немного времени)
    my_tree_textual_memory.memory_manager.wait_reorganizer()
```

### 5. Поиск Памяти

**Базовый Поиск (Search):**

Просто задайте вопрос, как в поисковой системе.

```python
# Немного подождите, пока строится индекс
import time
time.sleep(2)

init_time = time.time()

# Попробуйте поискать что-то о "детстве" (предполагая, что в предыдущем диалоге содержится соответствующий контент)
# Или попробуйте поискать "Why is the user feeling bad?"
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
    print(f"Найдено {i}-е совпадение: {r.memory}")

print(f"Время поиска: {round(time.time() - init_time)}s")
```

**Расширенный Поиск (Fine Mode):**

Если вы хотите более умные результаты поиска (например, чтобы LLM помог вам подвести итоги найденного), вы можете включить `mode="fine"`.

```python
# Включить Fine Режим
results_fine_search = my_tree_textual_memory.search(
    "Recent news in the first city you've mentioned.",
    top_k=10,
    mode="fine", # Ключевое здесь
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
    print(f"Результат Fine Поиска: {r.memory}")
```

### 6. Продвинутый: Мультимодальность и Инструменты (Modality & Tools)

Возможности MemOS не ограничиваются обработкой текстовых диалогов, она также поддерживает мультимодальный ввод и расширенные функции.

#### 1. Чтение Документов (Documents)

Можно напрямую читать локальные документы и преобразовывать их в память:

```python
# Построить Документные Данные
doc_data = [
    {
        "type": "file",
        "file": {
            "filename": "tennis_rule.txt",
            "path": "./tennis_rule.txt", # Убедитесь, что файл существует
            # Или предоставьте контент напрямую: "file_data": "..."
        }
    }
]

# Сообщить Reader, что это тип "doc"
doc_memories = reader.get_memory(
    doc_data, 
    type="doc", 
    info={"user_id": "1234", "session_id": "docs_import"}
)

# Сохранить В Памяти
for m in doc_memories:
    my_tree_textual_memory.add(m)
```

#### 2. Вызов Инструментов (Tools)

Когда Агент использует инструменты (например, поиск, калькулятор), MemOS может анализировать ввод и вывод инструментов, фиксируя факты, такие как "пользователь запросил погоду", "результат вычисления 50".

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

# Reader Автоматически Поймет, Что Это Взаимодействие С Инструментом
tool_memories = reader.get_memory(tool_scene, type="chat", info={"user_id": "1234"})
```

### 7. Предпочтения Пользователя (Preferences)

Помимо фактической памяти (TreeTextMemory), MemOS имеет специальную **PreferenceTextMemory** для управления предпочтениями пользователей (например, "нравится острое", "не нравится дождь"). Она использует векторные базы данных (например, Milvus/Qdrant) для хранения, что позволяет быстро находить персонализированные настройки пользователя.

```python
from memos.memories.textual.simple_preference import SimplePreferenceTextMemory
# Внимание: Инициализация Требует Настройки VectorDB, Embedder И Т.Д., Здесь Только Для Примера
# pref_memory = SimplePreferenceTextMemory(...)

# Автоматически Извлечь Предпочтения Из Диалога
pref_memories = pref_memory.get_memory(chat_data, type="chat", info=...)

# Сохранить Предпочтения
pref_memory.add(pref_memories)

# Поиск Предпочтений
prefs = pref_memory.search("What is the user's UI preference?", top_k=1)
print(prefs[0].memory) # Вывод: "Пользователь предпочитает темный режим"
```

### 8. Обратная Связь по Памяти (Feedback)

Память не является статичной. Пользователь может исправить ИИ: "Мне не нравится красный, я передумал, мне нравится синий". Модуль **MemFeedback** предназначен для обработки таких "коррекций".

Он может:
1.  **Изменять** ошибочную память.
2.  **Удалять** устаревшую память.
3.  **Объединять** конфликтующие воспоминания.

```python
from memos.mem_feedback.simple_feedback import SimpleMemFeedback

# Инициализировать Модуль Обратной Связи
# feedback_module = SimpleMemFeedback(...)

# Обработка Отзывов Пользователей
# Предположим, пользователь говорит: "Actually, I started playing tennis in 2020, not 2018."
feedback_module.process_feedback({
    "user_id": "1234",
    "feedback_content": "Actually, I started playing tennis in 2020, not 2018.",
    "chat_history": [...], # Предоставить Контекст
    "feedback_time": "Now"
})

# Модуль Отзывов будет автоматически обновлять узлы и отношения в базе данных Graph в фоновом режиме
```

### Резюме

С помощью этого учебника вы освоили основной рабочий процесс MemOS:
1.  **Извлечение Информации**: Используйте Reader для извлечения структурированной информации из различных источников данных
2.  **Хранение Памяти**: Используйте TreeTextMemory для управления фактической памятью, PreferenceMemory для управления предпочтениями пользователей
3.  **Умный Поиск**: Получайте соответствующую память через запросы на естественном языке
4.  **Постоянная Оптимизация**: Поддерживайте точность и актуальность памяти через механизмы обратной связи

На следующем этапе вы можете попробовать запустить `examples/mem_os/simple_memos.py`, чтобы испытать полноценного Агента, который объединяет все эти функции!

### 7. Завершение

После завершения тестирования рекомендуется выполнить следующие операции по очистке:

```python
# Остановить Фоновый Поток
my_tree_textual_memory.memory_manager.close()

# Сделать Резервную Копию Памяти
my_tree_textual_memory.dump("tmp/my_tree_textual_memory")

# Удалить Базу Данных и Убежать (только для тестовой среды!)
my_tree_textual_memory.drop()
```

---

## Что Дальше?

- **Попробуйте свой собственный LLM бэкенд:** Переключитесь на OpenAI, HuggingFace или Ollama.
- **Изучите [TreeTextMemory](/open_source/modules/memories/tree_textual_memory):** Построение иерархической памяти на основе графов.
- **Добавьте [Activation Memory](/open_source/modules/memories/kv_cache_memory):** Кэширование состояния ключей и значений для ускорения вывода.
- **Углубленное Обучение:** Ознакомьтесь с [API Reference](/api-reference/search-memories) и [Examples](/open_source/getting_started/examples) для понимания сложных рабочих процессов.


Далее вы можете ознакомиться с более продвинутыми функциями:
- **[MemReader](/open_source/modules/mem_reader)**: на самом деле он также может читать изображения и PDF.
- **[MemFeedback](/open_source/modules/mem_feedback)**: если память ошиблась, как заставить ИИ автоматически исправить это?
- **[MemCube](/open_source/modules/mem_cube)**: как объединить различные способности памяти, чтобы создать настоящий универсальный мозг.
