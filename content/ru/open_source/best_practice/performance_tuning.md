---
title: Оптимизация Производительности
---

Оптимизация производительности MemOS в основном сосредоточена на **Извлечении Памяти (Mem-Reader)**, **Векторном Встраивании (Embedding)** и **Ранжировании Поиска (Search Ranking)**. Большинство настроек можно выполнить, изменив YAML конфигурационный файл (например, `memos_config_w_scheduler.yaml`) или непосредственно отредактировав исходный код.

## 1. Оптимизация Извлечения Памяти (Mem-Reader Prompt)

slow_embedder = {
    "backend": "sentence_transformer",
    "config": {
        "model_name_or_path": "nomic-ai/nomic-embed-text-v1.5"
    }
}
```
`Mem-Reader` компонент отвечает за извлечение ключевой информации из диалога. В текущей реализации Prompt определен в шаблоне исходного кода.

### Изменение Шаблона Prompt

Чтобы настроить логику извлечения (например, игнорировать болтовню, сосредоточиться на конкретных фактах), вам нужно напрямую изменить файл исходного кода:

*   **Путь к файлу**: `src/memos/templates/mem_reader_prompts.py`
*   **Целевая переменная**: `SIMPLE_STRUCT_MEM_READER_PROMPT` (для английского) или `SIMPLE_STRUCT_MEM_READER_PROMPT_ZH` (для китайского)

**Пример изменения**:

В `src/memos/templates/mem_reader_prompts.py`:

```python
SIMPLE_STRUCT_MEM_READER_PROMPT = """
You are a preference extraction expert.
Your task is to extract ONLY user preferences and dislikes from the conversation.
Ignore all other information including plans and daily events.
...
"""
```

## 2. Оптимизация Моделей Векторного Встраивания (Embedding Models)

Выбор модели векторного встраивания определяет точность и скорость семантического поиска. Обычно это настраивается в YAML конфигурационном файле.

### Изменение Конфигурационного Файла

В вашем конфигурационном файле (например, `memos_config.yaml`), найдите раздел `embedder` под `mem_reader` или `text_mem`:

```yaml
mem_reader:
  backend: "simple_struct"
  config:
    # ... другие настройки
    embedder:
      # Вариант A: Использовать Ollama (быстро, подходит для локального использования)
      backend: "ollama"
      config:
        model_name_or_path: "nomic-embed-text:latest"
      
      # Вариант B: Использовать Sentence Transformer (высокая точность, большое использование видеопамяти)
      # backend: "sentence_transformer"
      # config:
      #   model_name_or_path: "BAAI/bge-m3"
```

*   **Рекомендуемые модели**:
    *   **Быстро/Локально**: `nomic-embed-text` (Ollama)
    *   **Высокая точность**: `BAAI/bge-m3` или `OpenAI` `text-embedding-3-small` (необходимо использовать `universal_api` backend)

## 3. Оптимизация Ранжирования Поиска (Search Ranking)

Производительность поиска в основном зависит от количества извлечений (`top_k`) и стратегии повторного ранжирования.

### Настройка Количества Извлечений (Top-K)

Настройте `top_k` в конфигурации `mem_scheduler`. Увеличение этого значения может повысить уровень извлечения, но увеличит время обработки.

```yaml
mem_scheduler:
  backend: "general_scheduler"
  config:
    # Начальное количество кандидатов для поиска
    top_k: 20 
    # ...
```

### Введение Reranker (Продвинутый)

MemOS поддерживает введение Reranker для точной сортировки после извлечения. Обычно это требует указания при инициализации компонента `Searcher`. Если вы интегрируете MemOS как разработчик, вы можете настроить это в коде:

```python
from memos.reranker.factory import RerankerFactory

# При инициализации Searcher
reranker = RerankerFactory.from_config({
    "backend": "sentence_transformer",
    "config": {
        "model_name_or_path": "BAAI/bge-reranker-base"
    }
})
```

## 4. Ограничения Системных Ресурсов и Вместимости

Разумное ограничение емкости различных типов памяти может предотвратить бесконечный рост памяти и поддерживать скорость поиска. Обычно это настраивается в конфигурации `mem_cube`.

### Настройка Емкости Памяти (Memory Size)

В YAML конфигурационном файле настройте словарь `memory_size`:

```yaml
mem_cube:
  backend: "general"
  config:
    text_mem:
      backend: "tree"
      config:
        # Ограничение количества записей различных типов памяти
        memory_size:
          WorkingMemory: 10         # Краткосрочная память последних нескольких раундов диалога
          LongTermMemory: 2000      # Предел долгосрочной памяти
          UserMemory: 500           # Предел профиля/предпочтений пользователя
```

### Пакетная Обработка и Параллелизм

В `mem_scheduler` можно настроить возможности параллельной обработки:

```yaml
mem_scheduler:
  config:
    thread_pool_max_workers: 10     # Количество потоков для параллельной обработки
    consume_interval_seconds: 0.01  # Интервал потребления в очереди сообщений
    enable_parallel_dispatch: true  # Включить параллельную рассылку
```
