---
title: Лучшие Практики Проектирования Структуры Памяти
---

## Выбор Типа Памяти

### Деревовидная Открытая Память

**Лучше всего подходит для**: Управление знаниями, Помощник по исследованиям, Иерархические данные  
```python
tree_config = {
    "backend": "tree_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b"
            }
        },
        "graph_db": {
            "backend": "neo4j",
            "config": {
                "host": "localhost",
                "port": 7687
            }
        }
    }
}
```

### Память Открытых Предпочтений

**Лучше всего подходит для**: Персонализированные диалоги, Умные рекомендации, Обслуживание клиентов

```python
preference_config = {
    "backend": "preference_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b",
            }
        },
        "vector_db": {
            "backend": "milvus",
            "config": {
                "collection_name": [
                    "explicit_preference",
                    "implicit_preference"
                ],
                "vector_dimension": 768,
                "distance_metric": "cosine",
                "uri": "./milvus_demo.db"
            }
        },
        "embedder": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "nomic-embed-text:latest"
            }
        },
        "reranker": {
            "backend": "cosine_local",
            "config": {
                "level_weights": {
                    "topic": 1.0,
                    "concept": 1.0,
                    "fact": 1.0
                },
                "level_field": "background"
            }
        }
    }
}
```

### Универсальная Открытая Память (с векторным индексом)

**Лучше всего подходит для**: Диалоговый ИИ, Личный помощник, Системы вопросов и ответов

```python
general_config = {
    "backend": "general_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b"
            }
        },
        "vector_db": {
            "backend": "qdrant",
            "config": {
                "collection_name": "general"
            }
        },
        "embedder": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "nomic-embed-text"
            }
        }
    }
}
```

### Чистая Открытая Память (только текст)

**Лучше всего подходит для**: Простые приложения, Прототипирование

```python
naive_config = {
    "backend": "naive_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b"
            }
        }
    }
}
```

## Планирование Вместимости

Если вы включили планировщик, вы можете установить емкость памяти для контроля использования ресурсов:

```python
scheduler_config = {
    "memory_capacities": {
        "working_memory_capacity": 20,        # Рабочая Память
        "user_memory_capacity": 500,          # Память Пользователя
        "long_term_memory_capacity": 2000     # Долговременная Память
    }
}
```
