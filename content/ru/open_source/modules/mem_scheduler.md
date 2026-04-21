---
title: "MemScheduler"
desc: "MemScheduler является вашим "организатором памяти", который асинхронно управляет потоками и обновлениями памяти в фоновом режиме, координируя взаимодействие между рабочей памятью, долгосрочной памятью и активной памятью, позволяя диалоговым системам динамически организовывать и использовать память."

## Основные Характеристики

- 🚀 **Параллельная Работа с MemOS Системой**: Запуск в независимом потоке/процессе, не блокируя основную бизнес-логику.
- 🧠 **Координация Множественной Памяти**: Умное управление потоками рабочей памяти, долгосрочной памяти и персонализированной памяти пользователя.
- ⚡ **Событийно-Ориентированное Планирование**: Асинхронный механизм распределения задач на основе очереди сообщений (Redis/Local).
- 🔍 **Эффективный Поиск**: Интеграция векторного поиска и графового поиска для быстрого нахождения соответствующей памяти.
- 📊 **Полный Мониторинг**: Реальный мониторинг использования памяти, состояния очереди задач и задержки планирования.
- 📝 **Подробная Запись Логов**: Полное отслеживание операций с памятью для удобства отладки и анализа системы.

##  MemScheduler Архитектура

`MemScheduler` использует модульную архитектуру, разделенную на три уровня:

### Уровень Планирования (Ядро)
1. **Планировщик (Маршрутизатор)**: Умный маршрутизатор сообщений, который распределяет задачи к соответствующим обработчикам в зависимости от типа сообщения (`QUERY`, `ANSWER`, `MEM_UPDATE` и т.д.).
2. **Обработка Сообщений**: Управляет бизнес-логикой через сообщения с определенными метками (Label), определяя формат сообщений и правила обработки.

### Уровень Исполнения (Гарантия)
3. **Очередь Задач**: Поддерживает два режима: Redis Stream (в производственной среде) и Local Queue (для разработки и тестирования), обеспечивая асинхронное буферизование задач и их сохранение.
4. **Управление Памятью**: Выполняет операции чтения и записи, сжатия, забвения и преобразования типов для трех уровней памяти (Рабочая/Долгосрочная/Пользовательская).
5. **Система Поиска**: Модуль смешанного поиска, который сочетает намерения пользователя, управление сценами и соответствие ключевым словам для быстрого нахождения соответствующей памяти.

### Уровень Поддержки (Помощь)
6. **Мониторинг**: Отслеживание накопления задач, времени обработки и состояния хранилища памяти.
7. **Запись Логов**: Поддержка логов операций с памятью по всему пути, что облегчает отладку и анализ.

## Инициализация MemScheduler

В архитектуре MemOS `MemScheduler` инициализируется как часть серверного компонента при запуске.

### Инициализация в Server Router

В `src/memos/api/routers/server_router.py` планировщик автоматически загружается через функцию `init_server()`:

```python
from memos.api import handlers
from memos.api.handlers.base_handler import HandlerDependencies
from memos.mem_scheduler.base_scheduler import BaseScheduler
from memos.mem_scheduler.utils.status_tracker import TaskStatusTracker

# ... Другие импорты ...

# 1. Инициализация всех серверных компонентов (включая DB, LLM, Memory, Scheduler)
# init_server() будет считывать переменные окружения и инициализировать глобальные одиночные компоненты
components = handlers.init_server()

# Create dependency container for handlers
dependencies = HandlerDependencies.from_init_server(components)

# Initialize handlers...
# search_handler = SearchHandler(dependencies)
# ...

# 2. Получение экземпляра планировщика из словаря компонентов
# Планировщик уже был инициализирован и запущен внутри init_server (если это было включено)
mem_scheduler: BaseScheduler = components["mem_scheduler"]

# 3. Пользователь также может получить другие компоненты, связанные с планированием, в components (необязательно, для настройки обработки задач)
# redis_client используется для прямого взаимодействия с Redis или мониторинга состояния задач
redis_client = components["redis_client"]
# ...
```


## Планирование Задач и Модель Данных

Планировщик распределяет и выполняет задачи на основе сообщений. В этом разделе описаны поддерживаемые типы задач, структура сообщений и журналы выполнения.

### Типы Сообщений и Обработчики

Планировщик распределяет и выполняет задачи, регистрируя определенные метки задач (Label) и обработчики (Handler). Ниже приведены задачи планирования, которые поддерживаются по умолчанию в текущей версии (на основе `GeneralScheduler` и `OptimizedScheduler`):

| Метка Сообщения (Label) | Соответствующая Константа | Метод Обработчика | Описание |
| :--- | :--- | :--- | :--- |
| `query` | `QUERY_TASK_LABEL` | `_query_message_consumer` | Обработка пользовательских запросов, инициирование распознавания намерений, извлечение памяти и преобразование в задачи обновления памяти. |
| `answer` | `ANSWER_TASK_LABEL` | `_answer_message_consumer` | Обработка ответов AI, запись журналов диалогов. |
| `mem_update` | `MEM_UPDATE_TASK_LABEL` | `_memory_update_consumer` | Основная задача. Выполнение процесса обновления долгосрочной памяти, включая извлечение Query Keyword, обновление Monitor, извлечение соответствующей памяти и замена рабочей памяти (Working Memory). |
| `add` | `ADD_TASK_LABEL` | `_add_message_consumer` | Обработка записи журналов добавления новой памяти (поддержка локальных и облачных журналов). |
| `mem_read` | `MEM_READ_TASK_LABEL` | `_mem_read_message_consumer` | Использование `MemReader` для глубокой обработки и импорта внешнего содержимого памяти. |
| `mem_organize` | `MEM_ORGANIZE_TASK_LABEL` | `_mem_reorganize_message_consumer` | Инициирование операций реорганизации и объединения (Merge) памяти. |
| `pref_add` | `PREF_ADD_TASK_LABEL` | `_pref_add_message_consumer` | Обработка извлечения и добавления пользовательских предпочтений (Preference Memory). |
| `mem_feedback` | `MEM_FEEDBACK_TASK_LABEL` | `_mem_feedback_message_consumer` | Обработка пользовательской обратной связи для исправления памяти или усиления предпочтений. |
| `api_mix_search` | `API_MIX_SEARCH_TASK_LABEL` | `_api_mix_search_message_consumer` | (Специфично для OptimizedScheduler) Выполнение асинхронной смешанной поисковой задачи, сочетая быстрый поиск и детализированный поиск. |

### Структура Сообщений (ScheduleMessageItem)

Планировщик использует единую структуру `ScheduleMessageItem` для передачи сообщений в очереди.

> **Примечание**: Объект `mem_cube` сам по себе не содержится в модели сообщений, а интерпретируется планировщиком во время выполнения через `mem_cube_id`.

| Поле | Тип | Описание | Значение по умолчанию/Примечания |
| :--- | :--- | :--- | :--- |
| `item_id` | `str` | Уникальный идентификатор сообщения (UUID) | Автоматически генерируется |
| `user_id` | `str` | Связанный идентификатор пользователя | (Обязательно) |
| `mem_cube_id` | `str` | Связанный идентификатор Memory Cube | (Обязательно) |
| `label` | `str` | Метка задачи (например, `query`, `mem_update`) | (Обязательно) |
| `content` | `str` | Нагрузка сообщения (обычно JSON-строка или текст) | (Обязательно) |
| `timestamp` | `datetime` | Время отправки сообщения | Автоматически генерируется (UTC сейчас) |
| `session_id` | `str` | Идентификатор сессии, используемый для изоляции контекста | `""` |
| `trace_id` | `str` | Идентификатор трассировки, используемый для связи логов по всей цепочке | Автоматически генерируется |
| `user_name` | `str` | Отображаемое имя пользователя | `""` |
| `task_id` | `str` | Идентификатор задачи на уровне бизнеса (для связи нескольких сообщений) | `None` |
| `info` | `dict` | Дополнительная пользовательская информация контекста | `None` |
| `stream_key` | `str` | (Для Внутреннего Использования) Ключ Redis Stream | `""` |

### Структура Журнала Выполнения (ScheduleLogForWebItem)

Планировщик генерирует структурированные журналы сообщений для отображения на фронтенде или для постоянного хранения.

| Поле | Тип | Описание | Примечание |
| :--- | :--- | :--- | :--- |
| `item_id` | `str` | Уникальный Идентификатор Записи Лога | Автоматически Генерируется |
| `task_id` | `str` | Связанный Идентификатор Родительской Задачи | Необязательно |
| `user_id` | `str` | Идентификатор Пользователя | (Обязательно) |
| `mem_cube_id` | `str` | Идентификатор Memory Cube | (Обязательно) |
| `label` | `str` | Категория Лога (например, `addMessage`, `addMemory`) | (Обязательно) |
| `log_content` | `str` | Краткое Описание Текста Лога | (Обязательно) |
| `from_memory_type` | `str` | Исходная Область Памяти | Например, `UserInput`, `LongTermMemory` |
| `to_memory_type` | `str` | Целевая Область Памяти | Например, `WorkingMemory` |
| `memcube_log_content` | `list[dict]` | Структурированное Подробное Содержимое | Содержит Конкретный Текст Памяти, Идентификаторы Ссылок и Т. Д. |
| `metadata` | `list[dict]` | Метаданные Элемента Памяти | Содержит Уровень Доверия, Статус, Метки и Т. Д. |
| `status` | `str` | Статус Задачи | Например, `completed`, `failed` |
| `timestamp` | `datetime` | Время Создания Лога | Автоматически Генерируется |
| `current_memory_sizes` | `MemorySizes` | Снимок Текущего Количества Памяти в Каждой Области | Используется для Отображения на Мониторинговой Панели |
| `memory_capacities` | `MemoryCapacities` | Ограничение памяти для каждого региона | Используется для отображения на панели мониторинга |

## Примеры Функций Планирования

### 1. Обработка Сообщений и Пользовательский Handler

Самая мощная функция планировщика — это поддержка регистрации пользовательских обработчиков сообщений (Handler). Вы можете определить определенные типы сообщений (например, `MY_CUSTOM_TASK`) и написать функции для их обработки.

```python
import uuid
from datetime import datetime

# 1. Импортируйте необходимые определения типов и экземпляр планировщика
# Примечание: mem_scheduler необходимо импортировать из server_router, так как это глобальный синглтон
from memos.api.routers.server_router import mem_scheduler
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem

# Определите пользовательский ярлык задачи
MY_TASK_LABEL = "MY_CUSTOM_TASK"


# Определите функцию обработчика
def my_task_handler(messages: list[ScheduleMessageItem]):
    """
    Функция для обработки пользовательских задач
    """
    for msg in messages:
        print(f"⚡️ [Handler] Получена задача: {msg.item_id}")
        print(f"📦 Содержимое: {msg.content}")
        # Здесь выполните вашу бизнес-логику, например: вызов LLM, запись в базу данных, запуск других задач и т.д.


# 2. Зарегистрируйте обработчик в планировщике
# Этот шаг подключает вашу пользовательскую логику к системе планирования
mem_scheduler.register_handlers({
    MY_TASK_LABEL: my_task_handler
})

# 3. Отправьте задачу
task = ScheduleMessageItem(
    item_id=str(uuid.uuid4()),
    user_id="user_123",
    mem_cube_id="cube_001",
    label=MY_TASK_LABEL,
    content="Это тестовое сообщение",
    timestamp=datetime.now()
)

# Если планировщик не запущен, здесь задача будет помещена в очередь ожидания (если это очередь Redis)
# Или в локальном режиме очереди может потребоваться сначала вызвать mem_scheduler.start()
mem_scheduler.submit_messages([task])

print(f"Task submitted: {task.item_id}")

# Предотвращение Досрочного Выхода Главного Процесса Планировщика
time.sleep(10)
```

### 2. Redis Очередь против Локальной Очереди

- **Локальная Очередь (Local Queue)**：
  - **Подходящие Сценарии**：Модульное Тестирование, Простые Скрипты На Одном Компьютере.
  - **Особенности**：Высокая Скорость, Но Данные Утрачаются После Перезапуска Процесса, Не Поддерживает Совместное Использование Многопроцессорных/Многоэкземплярных.
  - **Конфигурация**：`MOS_SCHEDULER_USE_REDIS_QUEUE=false`

- **Очередь Redis (Redis Stream)**：
  - **Подходящие Сценарии**：Производственная Среда, Распределенное Развертывание.
  - **Особенности**：Постоянное Хранение Данных, Поддержка Групп Потребителей (Consumer Group), Позволяет Нескольким Экземплярам Планировщика Совместно Обрабатывать Задачи (Балансировка Нагрузки).
  - **Конфигурация**：`MOS_SCHEDULER_USE_REDIS_QUEUE=true`
  - **Отладка**：Можно Использовать Скрипт `show_redis_status.py` Для Просмотра Состояния Очереди.

## Комплексные Сценарии Применения

### Сценарий 1: Основной Диалоговый Поток И Обновление Памяти

Ниже представлен полный пример, демонстрирующий, как инициализировать окружение, зарегистрировать пользовательскую логику, смоделировать диалоговый поток и инициировать обновление памяти.

```python
import asyncio
import json
import os
import sys
import time
from pathlib import Path

# --- Подготовка Окружения ---
# 1. Установите Корневую Директорию Проекта в sys.path, чтобы Убедиться, что Можно Импортировать MemOS Модуль
FILE_PATH = Path(__file__).absolute()
BASE_DIR = FILE_PATH.parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# 2. Установите Необходимые Переменные Окружения (Эмуляция .env Конфигурации)
os.environ["ENABLE_CHAT_API"] = "true"
os.environ["MOS_ENABLE_SCHEDULER"] = "true"
# Определите, Использовать ли Redis или Локальную Очередь
os.environ["MOS_SCHEDULER_USE_REDIS_QUEUE"] = "false" 

# --- Импорт Компонентов ---
# Внимание: Импорт server_router Запустит Инициализацию Компонентов, Убедитесь, что Переменные Окружения Установлены Перед Этим
from memos.api.product_models import APIADDRequest, ChatPlaygroundRequest
from memos.api.routers.server_router import (
    add_handler,
    chat_stream_playground,
    mem_scheduler,  # Здесь mem_scheduler Уже Является Инициализированным Синглтоном
)
from memos.log import get_logger
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem
from memos.mem_scheduler.schemas.task_schemas import (
    MEM_UPDATE_TASK_LABEL,
    QUERY_TASK_LABEL,
)

logger = get_logger(__name__)

# Глобальная Переменная Для Демонстрации Результатов Поиска Памяти
working_memories = []

# --- Пользовательские Обработчики ---

def custom_query_handler(messages: list[ScheduleMessageItem]):
    """
    Обработка Сообщений Запроса Пользователя:
    1. Печать Содержимого Запроса
    2. Преобразование Сообщения В Задачу MEM_UPDATE, Запуск Процесса Поиска/Обновления Памяти
    """
    for msg in messages:
        print(f"\n[Scheduler 🟢] Получен Запрос Пользователя: {msg.content}")
        
        # Копирование Сообщения и Изменение Метки На MEM_UPDATE, Это Распространенная Модель "Цепочки Задач"
        new_msg = msg.model_copy(update={"label": MEM_UPDATE_TASK_LABEL})
        
        # Отправить Новый Задачу Обработчику
        mem_scheduler.submit_messages([new_msg])


def custom_mem_update_handler(messages: list[ScheduleMessageItem]):
    """
    Обработка Задачи Обновления Памяти:
    1. Использовать Извлекатель (Retriever) Для Поиска Связанных Памятей
    2. Обновить Глобальный Список Рабочей Памяти
    """
    global working_memories
    search_args = {}
    top_k = 2
    
    for msg in messages:
        print(f"[Scheduler 🔵] Идет Поиск Памяти Для Запроса...")
        # Вызов Основной Функции Извлечения
        results = mem_scheduler.retriever.search(
            query=msg.content,
            user_id=msg.user_id,
            mem_cube_id=msg.mem_cube_id,
            mem_cube=mem_scheduler.current_mem_cube,
            top_k=top_k,
            method=mem_scheduler.search_method,
            search_args=search_args,
        )
        
        # Симуляция Обновления Рабочей Памяти
        working_memories.extend(results)
        working_memories = working_memories[-5:] # Сохранять Последние 5 Записей
        
        for mem in results:
            # Печать Извлеченных Фрагментов Памяти
            print(f"  ↳ [Memory Found]: {mem.memory[:50]}...")

# --- Симуляция Бизнес Данных ---

def get_mock_data():
    """Генерация Симулированных Данных Диалога"""
    conversations = [
        {"role": "user", "content": "I just adopted a golden retriever puppy named Max."},
        {"role": "assistant", "content": "That's exciting! Max is a great name."},
        {"role": "user", "content": "He loves peanut butter treats but I am allergic to nuts."},
        {"role": "assistant", "content": "Noted. Peanut butter for Max, no nuts for you."},
    ]
    
    questions = [
        {"question": "What is my dog's name?", "category": "Pet"},
        {"question": "What am I allergic to?", "category": "Allergy"},
    ]
    return conversations, questions

# --- Основной Процесс ---

async def run_demo():
    print("==== MemScheduler Demo Start ====")
    conversations, questions = get_mock_data()

    user_id = "demo_user_001"
    mem_cube_id = "cube_demo_001"

    print(f"1. Инициализация Базы Памяти Пользователя ({user_id})...")
    # Использовать API Handler Для Добавления Начальной Памяти (Синхронный Режим)
    add_req = APIADDRequest(
        user_id=user_id,
        writable_cube_ids=[mem_cube_id],
        messages=conversations,
        async_mode="sync", 
    )
    add_handler.handle_add_memories(add_req)
    print("   Память Добавлена Успешно.")

    print("\n2. Начать тестирование диалога (и запустить задачу планировщика в фоновом режиме)...")
    for item in questions:
        query = item["question"]
        print(f"\n>> User: {query}")

        # Инициировать запрос на чат
        chat_req = ChatPlaygroundRequest(
            user_id=user_id,
            query=query,
            readable_cube_ids=[mem_cube_id],
            writable_cube_ids=[mem_cube_id],
        )
        
        # Получить потоковый ответ
        response = chat_stream_playground(chat_req)
        
        # Обработать потоковый вывод (упрощенная версия)
        full_answer = ""
        buffer = ""
        async for chunk in response.body_iterator:
            if isinstance(chunk, bytes):
                chunk = chunk.decode("utf-8")
            buffer += chunk
            while "\n\n" in buffer:
                msg, buffer = buffer.split("\n\n", 1)
                for line in msg.split("\n"):
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "text":
                                full_answer += data["data"]
                        except: pass
                        
        print(f">> AI: {full_answer}")
        
        # Подождите немного, чтобы планировщик в фоновом режиме обработал задачу и напечатал журнал
        await asyncio.sleep(1)

if __name__ == "__main__":
    # 1. Зарегистрируйте наш пользовательский обработчик
    # Это заменит или добавит к логике планирования по умолчанию
    mem_scheduler.register_handlers(
        {
            QUERY_TASK_LABEL: custom_query_handler,
            MEM_UPDATE_TASK_LABEL: custom_mem_update_handler,
        }
    )
    
    # 2. Убедитесь, что планировщик запущен
    if not mem_scheduler._running:
        mem_scheduler.start()

    try:
        asyncio.run(run_demo())
    except KeyboardInterrupt:
        pass
    finally:
        # Предотвратить преждевременный выход основного процесса планировщика
        time.sleep(10)

        print("\n==== Остановить планировщик ====")
        mem_scheduler.stop()
```

### Сценарий 2: Асинхронные Задачи, Параллелизм И Перезапуск С Точки Остановки (Redis)

Этот пример демонстрирует, как использовать очередь Redis для реализации параллельной обработки асинхронных задач и функции перезапуска с точки остановки. Для запуска этого примера необходимо настроить окружение Redis.

```python
from pathlib import Path
from time import sleep

from memos.api.routers.server_router import mem_scheduler
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem


# Отладка: напечатать конфигурацию планировщика
print("=== Scheduler Configuration Debug ===")
print(f"Scheduler type: {type(mem_scheduler).__name__}")
print(f"Config: {mem_scheduler.config}")
print(f"use_redis_queue: {mem_scheduler.use_redis_queue}")
print(f"Queue type: {type(mem_scheduler.memos_message_queue).__name__}")
print(f"Queue maxsize: {getattr(mem_scheduler.memos_message_queue, 'maxsize', 'N/A')}")
print("=====================================\n")

queue = mem_scheduler.memos_message_queue


# Определить функцию обработки
def my_test_handler(messages: list[ScheduleMessageItem]):
    print(f"My test handler received {len(messages)} messages: {[one.item_id for one in messages]}")
    for msg in messages:
        # Создать файл по task_id (используя item_id в качестве числового ID 0..99)
        task_id = str(msg.item_id)
        file_path = tmp_dir / f"{task_id}.txt"
        try:
            sleep(5)
            file_path.write_text(f"Task {task_id} processed.\n")
            print(f"writing {file_path} done")
        except Exception as e:
            print(f"Failed to write {file_path}: {e}")


def submit_tasks():
    mem_scheduler.memos_message_queue.clear()

    # Создать 100 сообщений (task_id 0..99)
    users = ["user_A", "user_B"]
    messages_to_send = [
        ScheduleMessageItem(
            item_id=str(i),
            user_id=users[i % 2],
            mem_cube_id="test_mem_cube",
            label=TEST_HANDLER_LABEL,
            content=f"Create file for task {i}",
        )
        for i in range(100)
    ]
    # Пакетная отправка сообщений и печать информации о завершении
    print(f"Submitting {len(messages_to_send)} messages to the scheduler...")
    mem_scheduler.memos_message_queue.submit_messages(messages_to_send)
    print(f"Task submission done! tasks in queue: {mem_scheduler.get_tasks_status()}")


# Регистрация Обработчика Функций
TEST_HANDLER_LABEL = "test_handler"
mem_scheduler.register_handlers({TEST_HANDLER_LABEL: my_test_handler})

# Перезагрузка Через 5 Секунд
mem_scheduler.orchestrator.tasks_min_idle_ms[TEST_HANDLER_LABEL] = 5_000

tmp_dir = Path("./tmp")
tmp_dir.mkdir(exist_ok=True)

# Тест Остановки И Перезагрузки: Если В tmp Уже Есть >1 Файл, Пропустить Отправку И Напечатать Информацию
existing_count = len(list(Path("tmp").glob("*.txt"))) if Path("tmp").exists() else 0
if existing_count > 1:
    print(f"Skip submission: found {existing_count} files in tmp (>1), continue processing")
else:
    submit_tasks()

# 6. Ждать, Пока В tmp Будет 100 Файлов Или Время Иссякнет
poll_interval = 1
expected = 100
tmp_dir = Path("tmp")
tasks_status = mem_scheduler.get_tasks_status()
mem_scheduler.print_tasks_status(tasks_status=tasks_status)
while (
    mem_scheduler.get_tasks_status()["remaining"] != 0
    or mem_scheduler.get_tasks_status()["running"] != 0
):
    count = len(list(tmp_dir.glob("*.txt"))) if tmp_dir.exists() else 0
    tasks_status = mem_scheduler.get_tasks_status()
    mem_scheduler.print_tasks_status(tasks_status=tasks_status)
    print(f"[Monitor] Files in tmp: {count}/{expected}")
    sleep(poll_interval)
print(f"[Result] Final files in tmp: {len(list(tmp_dir.glob('*.txt')))})")

# 7. Остановить Планировщик
sleep(20)
print("Stopping the scheduler...")
mem_scheduler.stop()
```
