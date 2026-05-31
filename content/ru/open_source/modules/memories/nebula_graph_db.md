---
title: Основанный На NebulaGraph Явный Мемориальный Бэкенд
desc: "Этот модуль предоставляет возможности хранения и запроса мемориальной графовой базы данных на основе NebulaGraph для систем усиления памяти (таких как RAG, когнитивные агенты или персональные помощники). Унаследованный от `BaseGraphDB`, поддерживает многопользовательскую изоляцию, структурированный поиск, внешние векторные индексы и другие возможности, подходит для построения и вывода больших графов."
---

## Почему Выбирают NebulaGraph?

* Подходит для масштабируемого распределенного развертывания
* Поддерживает гибкое определение меток и атрибутов для вершин и рёбер
* Поддерживает векторные индексы (начиная с Nebula 5)


## Рекомендуемая Конфигурация Шаблона

Подходит для производственных сценариев, совместим с логической изоляцией многопользовательской среды:

```json
"graph_db": {
  "backend": "nebular",
  "config": {
    "uri": ["localhost:9669"],
    "user": "root",
    "password": "your_password",
    "space": "database_name",
    "user_name": "user_name",
    "use_multi_db": false,
    "auto_create": true,
    "embedding_dimension": 1024
  }
}
```

* `space`: Название графового пространства Nebula, эквивалентно базе данных
* `user_name`: Для логической изоляции многопользователей (автоматически внедряет условия фильтрации)
* `embedding_dimension`: Настройте в соответствии с вашей моделью встраивания (например, text-embedding-3-large равен 3072)
* `auto_create`: Автоматически создавать графовое пространство и схему (рекомендуется для тестовой среды)


## Модель Использования Многопользовательской Среды

Бэкенд NebulaGraph поддерживает две архитектуры многопользовательской среды:

### Много пользователей в одной базе данных (Shared DB + `user_name`)

Подходит для нескольких пользователей/агентов, использующих одно графовое пространство, каждый пользователь использует логическую изоляцию:

```python
GraphDBConfigFactory(
  backend="nebular",
  config={
    "space": "shared_graph",
    "user_name": "alice",
    "use_multi_db": False,
    ...
  },
)
```

### Много Баз Данных (Multi DB, по одному пространству на пользователя)

Подходит для сценариев с более сильной изоляцией ресурсов, каждый пользователь занимает одно графовое пространство (space):

```python
GraphDBConfigFactory(
  backend="nebular",
  config={
    "space": "user_alice_graph",
    "use_multi_db": True,
    "auto_create": True,
    ...
  },
)
```

## Пример Быстрого Использования

```python
import os
import json
from memos.graph_dbs.factory import GraphStoreFactory
from memos.configs.graph_db import GraphDBConfigFactory

config = GraphDBConfigFactory(
        backend="nebular",
        config={
            "uri": json.loads(os.getenv("NEBULAR_HOSTS", "localhost")),
            "user": os.getenv("NEBULAR_USER", "root"),
            "password": os.getenv("NEBULAR_PASSWORD", "xxxxxx"),
            "space": os.getenv("space"),
            "use_multi_db": True,
            "auto_create": True,
            "embedding_dimension": os.getenv("embedding_dimension", 1024),
        },
    )

graph = GraphStoreFactory.from_config(config)

topic = TextualMemoryItem(
        memory="This research addresses long-term multi-UAV navigation for energy-efficient communication coverage.",
        metadata=TreeNodeTextualMemoryMetadata(
            memory_type="LongTermMemory",
            key="Multi-UAV Long-Term Coverage",
            hierarchy_level="topic",
            type="fact",
            memory_time="2024-01-01",
            source="file",
            sources=["paper://multi-uav-coverage/intro"],
            status="activated",
            confidence=95.0,
            tags=["UAV", "coverage", "multi-agent"],
            entities=["UAV", "coverage", "navigation"],
            visibility="public",
            updated_at=datetime.now().isoformat(),
            embedding=embed_memory_item(
                "This research addresses long-term "
                "multi-UAV navigation for "
                "energy-efficient communication "
                "coverage."
            ),
        ),
    )

graph.add_node(
    id=topic.id, memory=topic.memory, metadata=topic.metadata.model_dump(exclude_none=True)
)
```
