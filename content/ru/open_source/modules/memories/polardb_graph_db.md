---
title: "PolarDB Графовая База Данных"
desc: "MemOS поддерживает использование **PolarDB** (основанной на расширении Apache AGE) в качестве графовой базы данных для хранения и извлечения данных о памяти в виде графов знаний. PolarDB сочетает в себе мощные возможности PostgreSQL и гибкость графовых баз данных, что делает его особенно подходящим для сценариев, требующих одновременного выполнения запросов к реляционным и графовым данным."
---

## Функциональные Особенности

::list{icon="ph:check-circle-duotone"}
- Полные операции графовой базы данных: добавление, удаление, изменение и поиск узлов, управление ребрами
- Поиск векторных вложений: поддержка семантического поиска с индексом IVFFlat
- Управление пулом соединений: автоматическое управление соединениями с базой данных, поддержка высокой нагрузки
- Изоляция многопользовательского режима: поддержка физических и логических режимов изоляции
- Хранение атрибутов JSONB: гибкое хранение метаданных
- Пакетные операции: поддержка пакетной вставки узлов и ребер
- Автоматическая метка времени: автоматическое поддержание `created_at` и `updated_at`
- Защита от SQL-инъекций: встроенные параметризованные запросы и экранирование строк
::

## Структура Каталога

```
MemOS/
└── src/
    └── memos/
        ├── configs/
        │   └── graph_db.py              # PolarDBGraphDBConfig Конфигурационный Класс
        └── graph_dbs/
            ├── base.py                  # BaseGraphDB Абстрактный Базовый Класс
            ├── factory.py               # GraphDBFactory Фабричный Класс
            └── polardb.py               # PolarDBGraphDB Реализация
```

## Быстрый Старт

### 1. Установка Зависимостей

```bash
# Установка psycopg2 Драйвера (выберите один из двух)
pip install psycopg2-binary  # Рекомендуется: Предварительно Скомпилированная Версия
# Или
pip install psycopg2          # Требуется Библиотека Разработки PostgreSQL

# Установка MemOS
pip install MemoryOS -U
```

### 2. Конфигурация PolarDB

#### Способ 1: Использование Конфигурационного Файла (Рекомендуется)

```json
{
  "graph_db_store": {
    "backend": "polardb",
    "config": {
      "host": "localhost",
      "port": 5432,
      "user": "postgres",
      "password": "your_password",
      "db_name": "memos_db",
      "user_name": "alice",
      "use_multi_db": true,
      "auto_create": false,
      "embedding_dimension": 1024,
      "maxconn": 100
    }
  }
}
```

#### Способ 2: Инициализация Кода

```python
from memos.configs.graph_db import PolarDBGraphDBConfig
from memos.graph_dbs.polardb import PolarDBGraphDB

# Создание Конфигурации
config = PolarDBGraphDBConfig(
    host="localhost",
    port=5432,
    user="postgres",
    password="your_password",
    db_name="memos_db",
    user_name="alice",
    use_multi_db=True,
    embedding_dimension=1024,
    maxconn=100
)

# Инициализация Базы Данных
graph_db = PolarDBGraphDB(config)
```

### 3. Примеры Основных Операций

```python
# ========================================
# Шаг 1: Добавление Узла
# ========================================
node_id = graph_db.add_node(
    label="Memory",
    properties={
        "content": "Python является высокоуровневым языком программирования",
        "memory_type": "Knowledge",
        "tags": ["programming", "python"]
    },
    embedding=[0.1, 0.2, 0.3, ...],  # 1024-мерный Вектор
    user_name="alice"
)
print(f"✓ Узел создан: {node_id}")

# ========================================
# Шаг 2: Обновление узла
# ========================================
graph_db.update_node(
    id=node_id,
    fields={
        "content": "Python является интерпретируемым, объектно-ориентированным языком высокого уровня",
        "updated": True
    },
    user_name="alice"
)
print("✓ Узел обновлен")

# ========================================
# Шаг 3: Создание отношений
# ========================================
# Сначала создайте второй узел
node_id_2 = graph_db.add_node(
    label="Memory",
    properties={
        "content": "Django является веб-фреймворком для Python",
        "memory_type": "Knowledge"
    },
    embedding=[0.15, 0.25, 0.35, ...],
    user_name="alice"
)

# Создание ребра
edge_id = graph_db.add_edge(
    source_id=node_id,
    target_id=node_id_2,
    edge_type="RELATED_TO",
    properties={
        "relationship": "Фреймворк и язык",
        "confidence": 0.95
    },
    user_name="alice"
)
print(f"✓ Отношение создано: {edge_id}")

# ========================================
# Шаг 4: Поиск векторов
# ========================================
query_embedding = [0.12, 0.22, 0.32, ...]  # Вектор запроса

results = graph_db.search_by_embedding(
    embedding=query_embedding,
    top_k=5,
    memory_type="Knowledge",
    user_name="alice"
)

print(f"\n🔍 Найдено {len(results)} похожих узлов:")
for node in results:
    print(f"  - {node.get('content')} (Сходство: {node.get('score', 'N/A')})")

# ========================================
# Шаг 5: Удаление узла
# ========================================
graph_db.delete_node(id=node_id, user_name="alice")
print(f"✓ Узел {node_id} Удален")
```

## Подробности Конфигурации

### PolarDBGraphDBConfig Параметры Описание

| Параметр | Тип | Значение По Умолчанию | Обязательный | Описание |
|------|------|--------|------|------|
| `host` | str | - | ✓ | Адрес хоста базы данных |
| `port` | int | 5432 | ✗ | Порт базы данных |
| `user` | str | - | ✓ | Имя пользователя базы данных |
| `password` | str | - | ✓ | Пароль базы данных |
| `db_name` | str | - | ✓ | Название целевой базы данных |
| `user_name` | str | None | ✗ | Идентификатор арендатора (для логической изоляции) |
| `use_multi_db` | bool | True | ✗ | Использовать ли физическую изоляцию нескольких баз данных |
| `auto_create` | bool | False | ✗ | Автоматически создавать базу данных |
| `embedding_dimension` | int | 1024 | ✗ | Размерность векторного встраивания |
| `maxconn` | int | 100 | ✗ | Максимальное количество соединений в пуле соединений |

### Сравнение Режимов Многопользовательского Использования

| Особенности | Физическая Изоляция<br/>(`use_multi_db=True`) | Логическая Изоляция<br/>(`use_multi_db=False`) |
|------|-----------------------------------|-------------------------------------|
| **Уровень Изоляции** | Уровень Базы Данных | Фильтрация По Меткам Уровня Приложения |
| **Требования К Конфигурации** | `db_name` Обычно Равно `user_name` | Необходимо Указать `user_name` |
| **Производительность** | Лучше (Независимые Ресурсы) | Удовлетворительно (Общие Ресурсы) |
| **Стоимость** | Высокая (Отдельная БД Для Каждого Арендатора) | Низкая (Общая База Данных) |
| **Сценарии Использования** | Корпоративные Клиенты, Высокие Требования К Безопасности | SaaS Мультиаренда, Разработка И Тестирование |
| **Миграция Данных** | Удобно (Экспорт Весь БД) | Необходимо Фильтровать По Меткам |

### Примеры Конфигурации

#### Пример 1: Физическая Изоляция (Рекомендуется для Корпоративной Версии)

```json
{
  "graph_db_store": {
    "backend": "polardb",
    "config": {
      "host": "prod-polardb.example.com",
      "port": 5432,
      "user": "admin",
      "password": "secure_password",
      "db_name": "customer_001",
      "user_name": null,
      "use_multi_db": true,
      "auto_create": false,
      "embedding_dimension": 1536,
      "maxconn": 200
    }
  }
}
```

#### Пример 2: Логическая Изоляция (Рекомендуется для SaaS)

```json
{
  "graph_db_store": {
    "backend": "polardb",
    "config": {
      "host": "shared-polardb.example.com",
      "port": 5432,
      "user": "app_user",
      "password": "app_password",
      "db_name": "shared_memos",
      "user_name": "tenant_alice",
      "use_multi_db": false,
      "auto_create": false,
      "embedding_dimension": 768,
      "maxconn": 50
    }
  }
}
```

## Расширенные Особенности

### 1. Пакетная Вставка Узлов

```python
# Пакетное Добавление Узлов (Высокая Производительность)
nodes_data = [
    {
        "label": "Memory",
        "properties": {"content": f"Узел {i}", "memory_type": "Test"},
        "embedding": [0.1 * i] * 1024,
    }
    for i in range(100)
]

node_ids = graph_db.add_nodes_batch(
    nodes=nodes_data,
    user_name="alice"
)
print(f"✓ Пакетно Создано {len(node_ids)} Узлов")
```

### 2. Примеры Сложных Запросов

```python
# Поиск Определенного Типа Памяти И Сортировка По Времени
def get_recent_memories(graph_db, memory_type, limit=10):
    """Получить Недавние Узлы Памяти"""
    query = f"""
        SELECT * FROM "{graph_db.db_name}_graph"."Memory"
        WHERE properties->>'memory_type' = %s
          AND properties->>'user_name' = %s
        ORDER BY updated_at DESC
        LIMIT %s
    """
    
    conn = graph_db._get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, [memory_type, "alice", limit])
            results = cursor.fetchall()
            return results
    finally:
        graph_db._return_connection(conn)

# Пример Использования
recent = get_recent_memories(graph_db, "WorkingMemory", limit=5)
print(f"Недавние 5 Рабочих Узлов Памяти: {len(recent)} Узлов")
```

### 3. Оптимизация Векторных Индексов

```python
# Создание Или Обновление Векторного Индекса
graph_db.create_index(
    label="Memory",
    vector_property="embedding",
    dimensions=1024,
    index_name="memory_vector_index"
)
print("✓ Векторный Индекс Оптимизирован")
```

### 4. Мониторинг Пула Соединений

```python
# Просмотр Состояния Пула Соединений (Только Для Отладки)
import logging
logging.basicConfig(level=logging.DEBUG)

# Получение соединения будет выводить подробные логи
conn = graph_db._get_connection()
# [DEBUG] [_get_connection] Successfully acquired connection from pool
graph_db._return_connection(conn)
# [DEBUG] [_return_connection] Successfully returned connection to pool
```

## Интерфейс BaseGraphDB

PolarDB реализует все методы абстрактного класса `BaseGraphDB`, обеспечивая совместимость с другими графовыми базами данных.

### Основные Методы

| Метод | Описание | Параметры |
|------|------|------|
| `add_node()` | Добавить один узел | label, properties, embedding, user_name |
| `add_nodes_batch()` | Пакетное добавление узлов | nodes, user_name |
| `update_node()` | Обновить свойства узла | id, fields, user_name |
| `delete_node()` | Удалить узел | id, user_name |
| `delete_node_by_params()` | Удалить узел по условиям | params, user_name |
| `add_edge()` | Создать связь | source_id, target_id, edge_type, properties, user_name |
| `update_edge()` | Обновить свойства связи | edge_id, properties, user_name |
| `delete_edge()` | Удалить связь | edge_id, user_name |
| `search_by_embedding()` | Поиск по векторному сходству | embedding, top_k, memory_type, user_name |
| `get_node()` | Получить один узел | id, user_name |
| `get_memory_count()` | Подсчет количества узлов | memory_type, user_name |
| `remove_oldest_memory()` | Очистить старую память | memory_type, keep_latest, user_name |

### Примеры Полных Подписей Методов

```python
from typing import Any

# Добавить Узел
def add_node(
    self,
    label: str = "Memory",
    properties: dict[str, Any] | None = None,
    embedding: list[float] | None = None,
    user_name: str | None = None
) -> str:
    """Добавить новый узел в графовую базу данных"""
    pass

# Векторный Поиск
def search_by_embedding(
    self,
    embedding: list[float],
    top_k: int = 10,
    memory_type: str | None = None,
    user_name: str | None = None,
    filters: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    """Поиск по сходству на основе векторных вложений"""
    pass

# Пакетные Операции
def add_nodes_batch(
    self,
    nodes: list[dict[str, Any]],
    user_name: str | None = None
) -> list[str]:
    """Пакетное добавление нескольких узлов"""
    pass
```

## Руководство по Расширенной Разработке

Если необходимо реализовать пользовательские функции на основе PolarDB, можно унаследовать класс `PolarDBGraphDB`:

```python
from memos.graph_dbs.polardb import PolarDBGraphDB
from memos.configs.graph_db import PolarDBGraphDBConfig

class CustomPolarDBGraphDB(PolarDBGraphDB):
    """Пользовательская реализация PolarDB графовой базы данных"""
    
    def __init__(self, config: PolarDBGraphDBConfig):
        super().__init__(config)
        # Пользовательская Логика Инициализации
        self.custom_index_created = False
    
    def create_custom_index(self):
        """Создать пользовательский индекс"""
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_custom_field
                    ON "{self.db_name}_graph"."Memory" 
                    ((properties->>'custom_field'));
                """)
                conn.commit()
                self.custom_index_created = True
                print("✓ Пользовательский индекс создан")
        except Exception as e:
            print(f"❌ Ошибка создания индекса: {e}")
            conn.rollback()
        finally:
            self._return_connection(conn)
    
    def search_by_custom_field(self, field_value: str):
        """Поиск по пользовательским полям"""
        query = f"""
            SELECT * FROM "{self.db_name}_graph"."Memory"
            WHERE properties->>'custom_field' = %s
        """
        
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, [field_value])
                results = cursor.fetchall()
                return results
        finally:
            self._return_connection(conn)

# Использовать Пользовательскую Реализацию
config = PolarDBGraphDBConfig(
    host="localhost",
    port=5432,
    user="postgres",
    password="password",
    db_name="custom_db"
)

custom_db = CustomPolarDBGraphDB(config)
custom_db.create_custom_index()
results = custom_db.search_by_custom_field("special_value")
```

## Ресурсы для Справки

- [Документация Apache AGE](https://age.apache.org/)
- [Документация по пулу соединений PostgreSQL](https://www.psycopg.org/docs/pool.html)
- [Документация PolarDB](https://www.alibabacloud.com/product/polardb)
- [Репозиторий MemOS на GitHub](https://github.com/MemOS-AI/MemOS)

## Следующий Шаг

- Узнать о использовании [Neo4j Графовой Базы Данных](./neo4j_graph_db.md)
- Посмотреть конфигурацию [Общей Текстовой Памяти](./general_textual_memory.md)
- Изучить расширенные особенности [Деревовидной Текстовой Памяти](./tree_textual_memory.md)
