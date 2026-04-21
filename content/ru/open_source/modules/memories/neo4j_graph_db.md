---
title: Neo4j Графовая База Данных
desc: "Этот модуль предоставляет графовую структуру для хранения и запроса памяти для систем улучшения памяти (таких как RAG, когнитивные агенты или персональные помощники по памяти). <br/>Он определяет чистый абстрактный класс(`BaseGraphDB`) и использует **Neo4j** для реализации, которая может быть использована в производственной среде."
---

## Почему Память Нуждается в Графовом Хранилище?

В отличие от векторного хранилища, графовая база данных позволяет:

- Организовывать память в **цепочки, иерархии и причинно-следственные связи**
- Выполнять **многошаговое рассуждение** и **обход подграфов**
- Поддерживать **удаление дубликатов, обнаружение конфликтов и планирование** памяти
- Динамически развивать графовую память со временем

Это составляет основу для долгосрочного, объяснимого и составного рассуждения о памяти.

## Особенности

- Единый интерфейс для различных графовых баз данных
- Встроенная поддержка Neo4j
- Поддержка векторного улучшенного поиска(`search_by_embedding`)
- Модульный, заменяемый и тестируемый
- [v0.2.1 Новая Функция] Поддержка **многоарендной графовой архитектуры** (одна база данных для нескольких пользователей)
- [v0.2.1 Новая Функция] Совместимость с **Neo4j** Community Edition

## Структура Каталога

```

src/memos/graph_dbs/
├── base.py            # Абстрактный интерфейс BaseGraphDB
├── factory.py         # Фабрика инстанцирует GraphDB из конфигурации
├── neo4j.py           # Продуктовая реализация Neo4jGraphDB

````

## Как Использовать

```python
from memos.graph_dbs.factory import GraphStoreFactory
from memos.configs.graph_db import GraphDBConfigFactory

# Шаг 1: Построение конфигурации фабрики
config = GraphDBConfigFactory(
    backend="neo4j",
    config={
        "uri": "bolt://localhost:7687",
        "user": "your_neo4j_user_name",
        "password": "your_password",
        "db_name": "memory_user1",
        "auto_create": True,
        "embedding_dimension": 768
    }
)

# Шаг 2: Инстанцирование графового хранилища
graph = GraphStoreFactory.from_config(config)

# Шаг 3: Добавление памяти
graph.add_node(
    id="node-001",
    memory="Today I learned about retrieval-augmented generation.",
    metadata={"type": "WorkingMemory", "tags": ["RAG", "AI"], "timestamp": "2025-06-05", "sources": []}
)

````

## Заменяемый Дизайн

### Интерфейс: `BaseGraphDB`

````
Описание функций:
1. Операции с узлами:
Вставка: add_node（Добавить один узел）
     add_nodes_batch（Пакетное добавление узлов）
Запрос: get_node（Запрос одного узла）
     get_nodes（Запрос нескольких узлов）
     get_memory_count（Запрос количества узлов）
     node_not_exist（Существует ли узел）
     search_by_embedding(Поиск по вектору может добавлять условия фильтрации, для получения полного документации по методу см. функцию neo4j_example.example_complex_shared_db_search_filter)
Обновление: update_node(Обновление одного узла)
Удаление: delete_node(Удаление одного узла)
     clear (Удалить все связанные узлы по user_name)
     См. функцию neo4j_example.example_complex_shared_db_delete_memory для получения полного документации по методу

2. Операции с ребрами
Вставка: add_edge(Добавление тройки памяти)
Запрос: get_edges(Запрос нескольких отношений)
     edge_exists(Существует ли отношение)
     get_children_with_embeddings(Запрос списка узлов типа PARENT)
     get_subgraph(Запрос многошаговых узлов)
Удаление: delete_edge(Удаление отношения)

3. Операции импорта и экспорта: 
  import_graph(Импортировать весь граф из сериализованного словаря, параметры включают словарь всех узлов и ребер для загрузки: {'nodes':[],'edges':[]})
  export_graph(Экспортировать все узлы и ребра графа в структурированном виде, поддерживает постраничный вывод)

Смотрите src/memos/graph_dbs/base.py для получения полной документации по методам.
````
### Текущий Бэкенд:

| Бэкенд | Статус | Файл       |
| ------- | ------ | ---------- |
| Neo4j   | Stable | `neo4j.py` |

## Одна База Данных для Многоарендности (Shared DB, Multi-Tenant)

С помощью настройки поля `user_name`, MemOS поддерживает изоляцию графов памяти для нескольких пользователей в одной базе данных Neo4j, что подходит для совместных систем и сценариев с несколькими ролями:

```python
config = GraphDBConfigFactory(
    backend="neo4j",
    config={
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "your_password",
        "db_name": "shared-graph",
        "user_name": "alice",
        "use_multi_db": false,
        "embedding_dimension": 768,
    },
)
```

Данные каждого пользователя логически изолированы в чтении, записи, поиске и экспорте через поле `user_name`, система автоматически выполняет фильтрацию.

::note
**Пример Ссылки**<br>
Не будем много говорить, все в коде `examples/basic_modules
/neo4j_example.example_complex_shared_db(db_name="shared-traval-group-complex-new")`
::

## Поддержка Neo4j Community Edition

Новый идентификатор бэкенда: `neo4j-community`

Способ использования аналогичен стандартному Neo4j, но автоматически отключает функции для предприятий:

- ❌ Не поддерживает `auto_create` базу данных
- ❌ Не поддерживает нативные векторные индексы (необходимо использовать внешнюю векторную библиотеку, в настоящее время поддерживается только Qdrant)
- ✅ Принудительное включение логической изоляции `user_name` (Community Edition или `user_name` относится к одному бизнесу и не требует строгой изоляции)

Пример конфигурации:

```python
config = GraphDBConfigFactory(
    backend="neo4j-community",
    config={
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "12345678",
        "db_name": "paper",
        "user_name": "bob",
        "auto_create": False,
        "embedding_dimension": 768,
        "use_multi_db": False,
        "vec_config": {
            "backend": "qdrant",
            "config": {
                "host": "localhost",
                "port": 6333,
                "collection_name": "neo4j_vec_db",
                "vector_dimension": 768,
                "distance_metric": "cosine"
            },
        },
    },
)
```

::note
**Пример Ссылки**<br>`examples/basic_modules
/neo4j_example.example_complex_shared_db(db_name="paper", 
community=True)`
::

## Расширение

Вы можете добавить поддержку любых других графовых движков (например, **TigerGraph**, **DGraph**, **Weaviate hybrid**):

1. Подкласс `BaseGraphDB`
2. Создайте класс данных конфигурации (например, `DgraphConfig`)
3. Зарегистрируйте его в:

   * `GraphDBConfigFactory.backend_to_class`
   * `GraphStoreFactory.backend_to_class`

Смотрите `src/memos/graph_dbs/neo4j.py` в качестве справочной реализации.
