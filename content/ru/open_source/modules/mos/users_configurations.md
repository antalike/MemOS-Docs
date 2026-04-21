---
title: MemOS Настройка Руководство
 desc: Этот документ полностью описывает все поля конфигурации и методы инициализации различных компонентов в системе MemOS.
 ---

1. [Обзор Конфигурации](#configuration-overview)
2. [Конфигурация MOS](#mos-configuration)
3. [Конфигурация LLM](#llm-configuration)
4. [Конфигурация MemReader](#memreader-configuration)
5. [Конфигурация MemCube](#memcube-configuration)
6. [Конфигурация Памяти](#memory-configuration)
7. [Конфигурация Встраивателя](#embedder-configuration)
8. [Конфигурация Векторной Базы Данных](#vector-database-configuration)
9. [Конфигурация Графовой Базы Данных](#graph-database-configuration)
10. [Конфигурация Планировщика](#scheduler-configuration)
11. [Методы Инициализации](#initialization-methods)
12. [Примеры Конфигурации](#configuration-examples)

## Обзор Конфигурации

MemOS использует иерархическую систему конфигурации с различными фабричными моделями для бэкенда. Каждый компонент имеет:
- Основной класс конфигурации
- Класс конфигурации, специфичный для бэкенда
- Фабричный класс для создания соответствующей конфигурации на основе бэкенда

## Конфигурация MOS

Основная конфигурация MOS для координации всех компонентов

### Поля MOSConfig

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `user_id` | str | "root" | Идентификатор пользователя MOS, этот идентификатор пользователя будет использоваться как значение по умолчанию |
| `session_id` | str | Автоматически Сгенерированный UUID | Идентификатор Сессии MOS |
| `chat_model` | LLMConfigFactory | Обязательный | Чат для Конфигурации LLM |
| `mem_reader` | MemReaderConfigFactory | Обязательный | Конфигурация MemReader |
| `mem_scheduler` | SchedulerFactory | Необязательный | Конфигурация Планировщика |
| `max_turns_window` | int | 15 | Максимальное Количество Сохраненных Диалогов |
| `top_k` | int | 5 | Максимальная Память для Поиска по Каждому Запросу |
| `enable_textual_memory` | bool | True | Включить Текстовую Память |
| `enable_activation_memory` | bool | False | Включить Память Активации |
| `enable_parametric_memory` | bool | False | Включить Параметрическую Память |
| `enable_mem_scheduler` | bool | False | Включить Память Планировщика |


### Пример Конфигурации MOS

```json
{
  "user_id": "root",
  "chat_model": {
    "backend": "huggingface",
    "config": {
      "model_name_or_path": "Qwen/Qwen3-1.7B",
      "temperature": 0.1,
      "remove_think_prefix": true,
      "max_tokens": 4096
    }
  },
  "mem_reader": {
    "backend": "simple_struct",
    "config": {
      "llm": {
        "backend": "ollama",
        "config": {
          "model_name_or_path": "qwen3:0.6b",
          "temperature": 0.8,
          "max_tokens": 1024,
          "top_p": 0.9,
          "top_k": 50
        }
      },
      "embedder": {
        "backend": "ollama",
        "config": {
          "model_name_or_path": "nomic-embed-text:latest"
        }
      },
    "chunker": {
      "backend": "sentence",
      "config": {
        "tokenizer_or_token_counter": "gpt2",
        "chunk_size": 512,
        "chunk_overlap": 128,
        "min_sentences_per_chunk": 1
      }
    }
    }
  },
  "max_turns_window": 20,
  "top_k": 5,
  "enable_textual_memory": true,
  "enable_activation_memory": false,
  "enable_parametric_memory": false
}
```

## Конфигурация LLM

Конфигурация для различных бэкендов LLM

### Основные Поля LLM

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `model_name_or_path` | str | Обязательный | Название или Путь Модели |
| `temperature` | float | 0.8 | Температура Выборки |
| `max_tokens` | int | 1024 | Максимальное Количество Генерируемых Токенов |
| `top_p` | float | 0.9 | Параметр Top-p Выборки |
| `top_k` | int | 50 | Параметр Top-k Выборки |
| `remove_think_prefix` | bool | False | Удалить тег think из вывода |

### Поля, Специфичные для Бэкенда

#### OpenAI LLM
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `api_key` | str | Обязательное | OpenAI API key |
| `api_base` | str | "https://api.openai.com/v1" | OpenAI API base URL |

#### Ollama LLM
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `api_base` | str | "http://localhost:11434" | Ollama API base URL |

#### HuggingFace LLM
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `do_sample` | bool | False | Использовать выборку VS жадное кодирование |
| `add_generation_prompt` | bool | True | Применить шаблон генерации |

### Пример Конфигурации LLM

```json
// OpenAI
{
  "backend": "openai",
  "config": {
    "model_name_or_path": "gpt-4o",
    "temperature": 0.8,
    "max_tokens": 1024,
    "top_p": 0.9,
    "top_k": 50,
    "api_key": "sk-...",
    "api_base": "https://api.openai.com/v1"
  }
}

// Ollama
{
  "backend": "ollama",
  "config": {
    "model_name_or_path": "qwen3:0.6b",
    "temperature": 0.8,
    "max_tokens": 1024,
    "top_p": 0.9,
    "top_k": 50,
    "api_base": "http://localhost:11434"
  }
}

// HuggingFace
{
  "backend": "huggingface",
  "config": {
    "model_name_or_path": "Qwen/Qwen3-1.7B",
    "temperature": 0.1,
    "remove_think_prefix": true,
    "max_tokens": 4096,
    "do_sample": false,
    "add_generation_prompt": true
  }
}
```

## MemReader Конфигурация

Конфигурация компонента чтения памяти

### Основные Поля MemReader

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `created_at` | datetime | Автоматически сгенерировано | Время создания метки |
| `llm` | LLMConfigFactory | Обязательное | Конфигурация LLM |
| `embedder` | EmbedderConfigFactory | Обязательное | Конфигурация встраивателя |
| `chunker` | chunkerConfigFactory | Обязательное | Конфигурация блока |

### Типы Бэкенда

- `simple_struct`: Структурированный читатель памяти

### Пример Конфигурации MemReader

```json
{
  "backend": "simple_struct",
  "config": {
    "llm": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.0,
        "remove_think_prefix": true,
        "max_tokens": 8192
      }
    },
    "embedder": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "nomic-embed-text:latest"
      }
    },
    "chunker": {
      "backend": "sentence",
      "config": {
        "tokenizer_or_token_counter": "gpt2",
        "chunk_size": 512,
        "chunk_overlap": 128,
        "min_sentences_per_chunk": 1
      }
    }
  }
}
```

## Конфигурация MemCube

Конфигурация компонента памяти куба

### GeneralMemCubeConfig Поля

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `user_id` | str | "default_user" | ID пользователя MemCube |
| `cube_id` | str | Автоматически сгенерированный UUID | ID куба MemCube |
| `text_mem` | MemoryConfigFactory | Обязательное | Конфигурация памяти в открытом виде |
| `act_mem` | MemoryConfigFactory | Обязательное | Конфигурация активной памяти |
| `para_mem` | MemoryConfigFactory | Обязательное | Конфигурация параметрической памяти |

### Разрешенные Бэкенды

- **Явная Память**: `naive_text`, `general_text`, `tree_text`, `uninitialized`
- **Активная Память**: `kv_cache`, `uninitialized`
- **Параметрическая Память**: `lora`, `uninitialized`

### Пример Конфигурации MemCube

```json
{
  "user_id": "root",
  "cube_id": "root/mem_cube_kv_cache",
  "text_mem": {},
  "act_mem": {
    "backend": "kv_cache",
    "config": {
      "memory_filename": "activation_memory.pickle",
      "extractor_llm": {
        "backend": "huggingface",
        "config": {
          "model_name_or_path": "Qwen/Qwen3-1.7B",
          "temperature": 0.8,
          "max_tokens": 1024,
          "top_p": 0.9,
          "top_k": 50,
          "add_generation_prompt": true,
          "remove_think_prefix": false
        }
      }
    }
  },
  "para_mem": {
    "backend": "lora",
    "config": {
      "memory_filename": "parametric_memory.adapter",
      "extractor_llm": {
        "backend": "huggingface",
        "config": {
          "model_name_or_path": "Qwen/Qwen3-1.7B",
          "temperature": 0.8,
          "max_tokens": 1024,
          "top_p": 0.9,
          "top_k": 50,
          "add_generation_prompt": true,
          "remove_think_prefix": false
        }
      }
    }
  }
}
```

## Конфигурация Памяти

Конфигурация различных типов систем памяти

### Основные Поля Памяти

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `cube_id` | str | None | Уникальный MemCube идентификатор, по умолчанию может быть cube_name или path|

### Конфигурация Открытой Памяти

#### Основная Открытая Память
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `memory_filename` | str | "textual_memory.json" | Имя файла для хранения памяти |

#### Чистая Открытая Память (только текст)
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | Обязательно | LLM для извлечения памяти |

#### Универсальная Открытая Память (с векторным индексом)
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | Обязательно | LLM для извлечения памяти |
| `vector_db` | VectorDBConfigFactory | Обязательно | Конфигурация векторной базы данных |
| `embedder` | EmbedderConfigFactory | Обязательное | Конфигурация встраивателя |

#### Деревовидная Открытая Память
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | Обязательно | LLM для извлечения памяти |
| `dispatcher_llm` | LLMConfigFactory | Обязательно | LLM для распределения памяти |
| `embedder` | EmbedderConfigFactory | Обязательное | Конфигурация встраивателя |
| `graph_db` | GraphDBConfigFactory | Обязательно | Конфигурация графовой базы данных |

### Конфигурация Активной Памяти

#### Основная Активная Память
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `memory_filename` | str | "activation_memory.pickle" | Имя файла для хранения памяти |

#### Память KV Cache
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | Обязательно | LLM для извлечения памяти (должен быть huggingface) |

### Конфигурация Параметрической Памяти

#### Основная Параметрическая Память
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `memory_filename` | str | "parametric_memory.adapter" | Имя файла для хранения памяти |

#### LoRA Память
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | Обязательно | LLM для извлечения памяти (должен быть huggingface) |

### Пример Конфигурации Памяти

```json
// Деревовидная Явная Память
{
  "backend": "tree_text",
  "config": {
    "memory_filename": "tree_memory.json",
    "extractor_llm": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.0,
        "remove_think_prefix": true,
        "max_tokens": 8192
      }
    },
    "dispatcher_llm": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.0,
        "remove_think_prefix": true,
        "max_tokens": 8192
      }
    },
    "embedder": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "nomic-embed-text:latest"
      }
    },
    "graph_db": {
      "backend": "neo4j",
      "config": {
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "12345678",
        "db_name": "user08alice",
        "auto_create": true,
        "embedding_dimension": 768
      }
    }
  }
}
```

## Конфигурация Встраивателя

Конфигурация модели встраивания

### Основные Поля Встраивателя

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `model_name_or_path` | str | Обязательный | Название или Путь Модели |
| `embedding_dims` | int | None | Количество размерностей встраивания |

### Поля, Специфичные для Бэкенда

#### Встраиватель Ollama
| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `api_base` | str | "http://localhost:11434" | Ollama API base URL |

#### Sentence Transformer Встраиватель
Нет других полей, кроме основных конфигураций.

### Пример Конфигурации Встраивателя

```json
// Ollama Встраиватель
{
  "backend": "ollama",
  "config": {
    "model_name_or_path": "nomic-embed-text:latest",
    "api_base": "http://localhost:11434"
  }
}

// Sentence Transformer Встраиватель
{
  "backend": "sentence_transformer",
  "config": {
    "model_name_or_path": "all-MiniLM-L6-v2",
    "embedding_dims": 384
  }
}
```

## Конфигурация Векторной Базы Данных

Конфигурация векторной базы данных

### Основные Поля Векторной Базы Данных

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `collection_name` | str | Обязательное | Название коллекции |
| `vector_dimension` | int | None | Размерность вектора |
| `distance_metric` | str | None | Метрика расстояния (косинусное, евклидово, скалярное произведение) |

### Поля Векторной Базы Данных Qdrant

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `host` | str | None | Хост Qdrant |
| `port` | int | None | Порт Qdrant |
| `path` | str | None | Локальный путь Qdrant |

### Пример Конфигурации Векторной Базы Данных

```json
{
  "backend": "qdrant",
  "config": {
    "collection_name": "memories",
    "vector_dimension": 768,
    "distance_metric": "cosine",
    "path": "/path/to/qdrant"
  }
}
```

## Конфигурация Графовой Базы Данных

Конфигурация графовой базы данных

### Основные Поля Графовой Базы Данных

| Поле | Тип | Значение по умолчанию | Описание |
|-------|------|---------|-------------|
| `uri` | str | Обязательное | URI базы данных |
| `user` | str | Обязательное | Имя пользователя базы данных |
| `password` | str | Обязательное | Пароль базы данных |

### Neo4j Графовая База Данных Поля

| Поле | Тип | Значение по умолчанию | Описание |
|-------|------|---------|-------------|
| `db_name` | str | Обязательное | Название целевой базы данных |
| `auto_create` | bool | False | Создать базу данных, если она не существует |
| `embedding_dimension` | int | 768 | Размерность векторного встраивания |

### Пример Конфигурации Графовой Базы Данных

```json
{
  "backend": "neo4j",
  "config": {
    "uri": "bolt://localhost:7687",
    "user": "neo4j",
    "password": "12345678",
    "db_name": "user08alice",
    "auto_create": true,
    "embedding_dimension": 768
  }
}
```

## Конфигурация Планировщика

Конфигурация системы планирования памяти для управления извлечением и активацией памяти

### Основные Поля Планировщика

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `top_k` | int | 10 | Количество кандидатов для рассмотрения в начальном поиске |
| `top_n` | int | 5 | Количество окончательных результатов, возвращаемых после обработки |
| `enable_parallel_dispatch` | bool | True | Использовать ли пул потоков для включения параллельной обработки сообщений |
| `thread_pool_max_workers` | int | 5 | Максимальное количество потоков в пуле потоков (1-20) |
| `consume_interval_seconds` | int | 3 | Интервал потребления сообщений из очереди (в секундах) (0-60) |

### Общие Поля Планировщика

| Поле | Тип | Значение По Умолчанию | Описание |
|-------|------|---------|-------------|
| `act_mem_update_interval` | int | 300 | Интервал обновления активной памяти (в секундах) |
| `context_window_size` | int | 5 | Размер контекстного окна для истории диалога |
| `activation_mem_size` | int | 5 | Размер активной памяти |
| `act_mem_dump_path` | str | 自动生成 | Путь к файлу для хранения активной памяти |

### Типы Бэкенда

- `general_scheduler`: Расширенный планировщик с управлением активацией памяти

### Пример Конфигурации Планировщика

```json
{
  "backend": "general_scheduler",
  "config": {
    "top_k": 10,
    "top_n": 5,
    "act_mem_update_interval": 300,
    "context_window_size": 5,
    "activation_mem_size": 1000,
    "thread_pool_max_workers": 10,
    "consume_interval_seconds": 3,
    "enable_parallel_dispatch": true
  }
}
```

## Метод Инициализации

### Из JSON Файла

```python
from memos.configs.mem_os import MOSConfig

# Загрузка конфигурации из файла JSON
mos_config = MOSConfig.from_json_file("path/to/config.json")
```

### Из Словаря

```python
from memos.configs.mem_os import MOSConfig

# Создание конфигурации из словаря
config_dict = {
    "user_id": "root",
    "chat_model": {
        "backend": "huggingface",
        "config": {
            "model_name_or_path": "Qwen/Qwen3-1.7B",
            "temperature": 0.1
        }
    }
    # ... other fields
}

mos_config = MOSConfig(**config_dict)
```

### Использование Фабричного Шаблона

```python
from memos.configs.llm import LLMConfigFactory

# Создание конфигурации LLM с использованием фабричного метода
llm_config = LLMConfigFactory(
    backend="huggingface",
    config={
        "model_name_or_path": "Qwen/Qwen3-1.7B",
        "temperature": 0.1
    }
)
```

## Примеры Конфигурации

### Создание Полного MOS

```python
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS

# Загрузка конфигурации
mos_config = MOSConfig.from_json_file("examples/data/config/simple_memos_config.json")

# Инициализация MOS
mos = MOS(mos_config)

# Создание Пользователя И Регистрация Куба
user_id = "user_123"
mos.create_user(user_id=user_id)
mos.register_mem_cube("path/to/mem_cube", user_id=user_id)

# Использование MOS
response = mos.chat("Hello, how are you?", user_id=user_id)
```

### Деревовидная Конфигурация Памяти

```python
from memos.configs.memory import MemoryConfigFactory

# Создание Деревовидной Конфигурации Памяти
tree_memory_config = MemoryConfigFactory(
    backend="tree_text",
    config={
        "memory_filename": "tree_memory.json",
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b",
                "temperature": 0.0,
                "max_tokens": 8192
            }
        },
        "dispatcher_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b",
                "temperature": 0.0,
                "max_tokens": 8192
            }
        },
        "embedder": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "nomic-embed-text:latest"
            }
        },
        "graph_db": {
            "backend": "neo4j",
            "config": {
                "uri": "bolt://localhost:7687",
                "user": "neo4j",
                "password": "password",
                "db_name": "memories",
                "auto_create": True,
                "embedding_dimension": 768
            }
        }
    }
)
```

### Конфигурация Много Бэкендового LLM

```python
from memos.configs.llm import LLMConfigFactory

# Конфигурация OpenAI
openai_config = LLMConfigFactory(
    backend="openai",
    config={
        "model_name_or_path": "gpt-4o",
        "temperature": 0.8,
        "max_tokens": 1024,
        "api_key": "sk-...",
        "api_base": "https://api.openai.com/v1"
    }
)

# Конфигурация Ollama
ollama_config = LLMConfigFactory(
    backend="ollama",
    config={
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.8,
        "max_tokens": 1024,
        "api_base": "http://localhost:11434"
    }
)

# Конфигурация HuggingFace
hf_config = LLMConfigFactory(
    backend="huggingface",
    config={
        "model_name_or_path": "Qwen/Qwen3-1.7B",
        "temperature": 0.1,
        "remove_think_prefix": True,
        "max_tokens": 4096,
        "do_sample": False,
        "add_generation_prompt": True
    }
)
```

Эта всеобъемлющая система конфигурации позволяет гибкую и масштабируемую настройку MemOS с различными бэкендами и компонентами
