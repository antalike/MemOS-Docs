---
title: MemChat
desc: "MemChat является вашим "дипломатом памяти", который координирует ввод пользователя, извлечение памяти и генерацию LLM, создавая связный и обладающий долгосрочной памятью диалоговый опыт."

## 1. Введение

**MemChat** является центром управления диалогом MemOS.

Это не просто интерфейс чата, а мост между "мгновенным диалогом" и "долговременной памятью". В процессе общения с пользователем MemChat отвечает за实时ное извлечение соответствующей фоновой информации из MemCube (куб памяти), построение контекста и осаждение нового диалогового содержания в новую память. С его помощью ваш агент больше не будет "рыбой с памятью", а станет действительно понимающим прошлое и постоянно развивающимся интеллектуальным партнером.

---

## 2. Основные возможности

### Увеличенный Диалог Памятью (Memory-Augmented Chat)
Перед тем как ответить на вопросы пользователя, MemChat автоматически извлекает соответствующую Textual Memory (текстовую память) из MemCube и внедряет её в Prompt. Это позволяет агенту отвечать на вопросы на основе предыдущей истории взаимодействия или базы знаний, а не полагаться только на предобученные знания LLM.

### Автоматическое Осаждение Памяти (Auto-Memorization)
После диалога MemChat использует Extractor LLM для автоматического извлечения ценной информации (например, предпочтений пользователя, фактических знаний) из потока диалога и сохраняет её в MemCube. Пользователю не нужно вручную вмешиваться, весь процесс полностью автоматизирован.

### Управление Контекстом
Автоматическое управление историей диалога (`max_turns_window`). Когда диалог становится слишком длинным, он умно обрезает старый контекст, полагаясь на извлечённую долговременную память для поддержания связности диалога, эффективно решая проблему ограничения контекстного окна LLM.

### Гибкая Конфигурация
Поддержка конфигурационных переключателей для различных типов памяти (текстовая память, активированная память и т.д.), адаптируясь к различным сценариям применения.

---

## 3. Структура Кода

Основная логика находится в `memos/src/memos/mem_chat/`.

*   **`simple.py`**: **Стандартная Реализация (SimpleMemChat)**. Это готовая к использованию реализация REPL (Read-Eval-Print Loop), содержащая полную логику "извлечение -> генерация -> хранение".
*   **`base.py`**: **Определение Интерфейса (BaseMemChat)**. Определяет основные действия MemChat, такие как `run()` и атрибут `mem_cube`.
*   **`factory.py`**: **Фабричный Класс**. Отвечает за создание конкретного объекта MemChat на основе конфигурации (`MemChatConfig`).

---

## 4. Ключевые Интерфейсы

Основная точка взаимодействия — это класс `MemChat` (обычно создаётся `MemChatFactory`).

### 4.1 Инициализация
Сначала вам нужно создать объект конфигурации, а затем создать экземпляр с помощью фабричного метода. После создания необходимо смонтировать экземпляр `MemCube` на `mem_chat.mem_cube`.

### 4.2 `run()`
Запустите интерактивный цикл командного диалога. Подходит для разработки и отладки, он будет обрабатывать ввод пользователя, вызывать извлечение памяти, генерировать ответы и выводить их.

### 4.3 Атрибуты
*   **`mem_cube`**: Связанный объект куба памяти. MemChat использует его для чтения и записи памяти.
*   **`chat_llm`**: Экземпляр LLM, используемый для генерации ответов.

---

## 5. Рабочий Процесс

Один цикл диалога MemChat обычно включает следующие шаги:

1.  **Получение Ввода (Input)**: Получение текстового ввода от пользователя.
2.  **Извлечение Памяти (Recall)**: (если включена `enable_textual_memory`) использовать ввод пользователя в качестве запроса, извлекая Top-K соответствующих воспоминаний из `mem_cube.text_mem`.
3.  **Построение Подсказки (Prompt Construction)**: Объединение системной подсказки, извлечённой памяти и недавней истории диалога (History) в полную подсказку.
4.  **Генерация Ответа (Generation)**: Вызов `chat_llm` для генерации ответа.
5.  **Извлечение и Хранение Памяти (Memorization)**: (если включена `enable_textual_memory`) отправка текущего диалога (Пользователь + Ассистент) в извлекатель `mem_cube`, извлечение новой памяти и сохранение в базе данных.

---

## 6. Примеры Разработки

Ниже приведён полный пример кода, демонстрирующий, как настроить MemChat и смонтировать MemCube на основе Qdrant и OpenAI.

### 6.1 Реализация Кода

```python
import os
import sys

# Убедитесь, что модуль src может быть импортирован
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../src")))

from memos.configs.mem_chat import MemChatConfigFactory
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_chat.factory import MemChatFactory
from memos.mem_cube.general import GeneralMemCube

def get_mem_chat_config() -> MemChatConfigFactory:
    """Генерация конфигурации MemChat"""
    return MemChatConfigFactory.model_validate(
        {
            "backend": "simple",
            "config": {
                "user_id": "user_123",
                "chat_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": os.getenv("MOS_CHAT_MODEL", "gpt-4o"),
                        "temperature": 0.8,
                        "max_tokens": 1024,
                        "api_key": os.getenv("OPENAI_API_KEY"),
                        "api_base": os.getenv("OPENAI_API_BASE"),
                    },
                },
                "max_turns_window": 20,
                "top_k": 5,
                "enable_textual_memory": True, # Включить явную память
            },
        }
    )

def get_mem_cube_config() -> GeneralMemCubeConfig:
    """Генерация конфигурации MemCube"""
    return GeneralMemCubeConfig.model_validate(
        {
            "user_id": "user03alice",
            "cube_id": "user03alice/mem_cube_tree",
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "cube_id": "user03alice/mem_cube_general",
                    "extractor_llm": {
                        "backend": "openai",
                        "config": {
                            "model_name_or_path": os.getenv("MOS_CHAT_MODEL", "gpt-4o"),
                            "api_key": os.getenv("OPENAI_API_KEY"),
                            "api_base": os.getenv("OPENAI_API_BASE"),
                        },
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": "user03alice_mem_cube_general",
                            "vector_dimension": 1024,
                        },
                    },
                    "embedder": {
                        "backend": os.getenv("MOS_EMBEDDER_BACKEND", "universal_api"),
                        "config": {
                            "provider": "openai",
                            "api_key": os.getenv("MOS_EMBEDDER_API_KEY", "EMPTY"),
                            "model_name_or_path": os.getenv("MOS_EMBEDDER_MODEL", "bge-m3"),
                            "base_url": os.getenv("MOS_EMBEDDER_API_BASE"),
                        },
                    },
                },
            },
        }
    )

def main():
    print("Initializing MemChat...")
    mem_chat = MemChatFactory.from_config(get_mem_chat_config())

    print("Initializing MemCube...")
    mem_cube = GeneralMemCube(get_mem_cube_config())

    # Ключевой шаг: монтирование памяти куба
    mem_chat.mem_cube = mem_cube
    
    print("Starting Chat Session...")
    try:
        mem_chat.run()
    finally:
        print("Saving memory cube...")
        mem_chat.mem_cube.dump("new_cube_path")

if __name__ == "__main__":
    main()
```

---

## 7. Описание Конфигурации

При настройке `MemChatConfigFactory` следующие параметры имеют решающее значение:

*   **`user_id`**: Обязательный. Используется для идентификации текущего пользователя в разговоре, чтобы обеспечить изоляцию памяти.
*   **`chat_llm`**: Конфигурация модели разговора. Рекомендуется использовать более мощную модель (например, GPT-4o) для получения лучшего качества ответов и соблюдения инструкций.
*   **`enable_textual_memory`**: `True` / `False`. Включить ли текстовую память. Если включено, система будет выполнять поиск перед разговором и сохранять данные после разговора.
*   **`max_turns_window`**: Целое число. Количество раундов, сохраняемых в истории разговора. Исторические записи, превышающие этот лимит, будут обрезаны, полагаясь на долгосрочную память для дополнения контекста.
*   **`top_k`**: Целое число. Сколько наиболее релевантных фрагментов памяти извлекать из хранилища и внедрять в Prompt каждый раз.

