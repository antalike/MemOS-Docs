---
title: Управление Пользователями
desc: "**MOS** предоставляет полные функции управления пользователями для поддержки многопользовательских и многосессионных операций памяти. Этот документ подробно описывает методы управления пользователями в **MOS**."

## Роли Пользователей

**MOS** поддерживает 4 различных уровня прав доступа для ролей пользователей:

| Роль | Описание | Права |
|------|-------------|-------------|
| `ROOT` | Системный Администратор | Доступ ко всем кубам и пользователям, не может быть удален |
| `ADMIN` | Администратор Пользователь | Может управлять пользователями и кубами, доступ ко всем кубам |
| `USER` | Обычный Пользователь | Может создавать и управлять своими кубами, доступ к общим кубам |
| `GUEST` | Ограниченный Пользователь | Может только получать доступ к общим кубам, не может создавать кубы |

## Методы Управления Пользователями

### 1. `create_user`

Создание нового пользователя в системе **MOS**

**Параметры:**
- `user_id` (str): Уникальный идентификатор пользователя
- `role` (UserRole, optional): Роль пользователя. По умолчанию `UserRole.USER`
- `user_name` (str, optional): Имя пользователя для отображения. Если не указано, используется `user_id`

**Возвращаемое значение:**
- `str`: Созданный ID пользователя

**Пример:**
```python
import uuid
from memos.mem_user.user_manager import UserRole

# Создать Стандартного Пользователя
user_id = str(uuid.uuid4())
memory.create_user(user_id=user_id, role=UserRole.USER, user_name="John Doe")

# Создать Администратора Пользователя
admin_id = str(uuid.uuid4())
memory.create_user(user_id=admin_id, role=UserRole.ADMIN, user_name="Admin User")

# Создать Пользователя Гостя
guest_id = str(uuid.uuid4())
memory.create_user(user_id=guest_id, role=UserRole.GUEST, user_name="Guest User")
```

**Примечание:**
- Если пользователь с тем же `user_name` уже существует, метод возвращает ID существующего пользователя
- В процессе инициализации система автоматически создаст пользователя root
- ID пользователя должен быть уникальным в системе

### 2. `list_users`

Получение информации о всех активных пользователях в системе

**Параметры:**
- Нет

**Возвращаемое значение:**
- `list`: Список словарей с информацией о пользователях:
  - `user_id` (str): Уникальный идентификатор пользователя
  - `user_name` (str): Имя пользователя для отображения
  - `role` (str): Роль пользователя (root, администратор, обычный пользователь, гость)
  - `created_at` (str): Временная метка ISO создания пользователя
  - `is_active` (bool): Активен ли аккаунт пользователя

**Пример:**
```python
# Список Всех Пользователей
users = memory.list_users()
for user in users:
    print(f"User: {user['user_name']} (ID: {user['user_id']})")
    print(f"Role: {user['role']}")
    print(f"Active: {user['is_active']}")
    print(f"Created: {user['created_at']}")
    print("---")
```

**Пример вывода:**
```
User: root (ID: root)
Role: root
Active: True
Created: 2024-01-15T10:30:00
---
User: John Doe (ID: 550e8400-e29b-41d4-a716-446655440000)
Role: user
Active: True
Created: 2024-01-15T11:00:00
---
```

### 3. `create_cube_for_user`

Создание нового куба памяти и назначение указанного пользователя его владельцем

**Параметры:**
- `cube_name` (str): Название куба
- `owner_id` (str): ID пользователя-владельца куба
- `cube_path` (str, optional): Локальный путь к файлу куба или URL удаленного репозитория
- `cube_id` (str, optional): Индикатор пользовательского куба, если не предоставлен, используется сгенерированный UUID

**Возвращаемое значение:**
- `str`: Созданный ID куба

**Пример:**
```python
import uuid

# Первый Раз Создать Пользователя
user_id = str(uuid.uuid4())
memory.create_user(user_id=user_id, user_name="Alice")

# Создать Куб Для Пользователя
cube_id = memory.create_cube_for_user(
    cube_name="Alice's Personal Memory",
    owner_id=user_id,
    cube_path="/path/to/alice/memory",
    cube_id="alice_personal_cube"
)

print(f"Created cube: {cube_id}")
```

**Примечание:**
- Владельцы автоматически получают доступ ко всем созданным кубам
- Владельцы кубов могут делиться ими с другими пользователями
- Если указан `cube_path`, он может быть локальным путем к директории или URL удаленного репозитория
- Пользовательский `cube_id` должен быть уникальным в системе

### 4. `get_user_info`

Получение подробной информации о текущем пользователе и доступных ему кубах

**Параметры:**
- Нет

**Возвращаемое значение:**
- `dict`: Словарь с информацией о пользователе и доступных кубах:
  - `user_id` (str): ID текущего пользователя
  - `user_name` (str): Имя текущего пользователя
  - `role` (str): Роль текущего пользователя
  - `created_at` (str): Временная метка ISO создания пользователя
  - `accessible_cubes` (list): Список словарей для каждого доступного куба:
    - `cube_id` (str): Индикатор куба
    - `cube_name` (str): Название куба
    - `cube_path` (str): Путь к файлу куба или URL репозитория
    - `owner_id` (str): ID владельца куба
    - `is_loaded` (bool): Загружен ли куб в память в данный момент

**Пример:**
```python
# Получить Информацию О Текущем Пользователе
user_info = memory.get_user_info()

print(f"Current User: {user_info['user_name']} ({user_info['user_id']})")
print(f"Role: {user_info['role']}")
print(f"Created: {user_info['created_at']}")
print("\nAccessible Cubes:")
for cube in user_info['accessible_cubes']:
    print(f"- {cube['cube_name']} (ID: {cube['cube_id']})")
    print(f"  Owner: {cube['owner_id']}")
    print(f"  Loaded: {cube['is_loaded']}")
    print(f"  Path: {cube['cube_path']}")
```

**Пример вывода:**
```
Current User: Alice (550e8400-e29b-41d4-a716-446655440000)
Role: user
Created: 2024-01-15T11:00:00

Accessible Cubes:
- Alice's Personal Memory (ID: alice_personal_cube)
  Owner: 550e8400-e29b-41d4-a716-446655440000
  Loaded: True
  Path: /path/to/alice/memory
- Shared Project Memory (ID: project_cube)
  Owner: bob_user_id
  Loaded: False
  Path: /path/to/project/memory
```

### 5. `share_cube_with_user`

Поделиться кубом памяти с другими пользователями, предоставив им доступ к содержимому куба

**Параметры:**
- `cube_id` (str): ID куба для совместного использования
- `target_user_id` (str): ID пользователя, с которым делится куб

**Возвращаемое значение:**
- `bool`: Если успешно поделено, возвращает `True`, иначе возвращает `False`

**Пример:**
```python
# Поделиться Кубом С Другими Пользователями
success = memory.share_cube_with_user(
    cube_id="alice_personal_cube",
    target_user_id="bob_user_id"
)

if success:
    print("Cube shared successfully")
else:
    print("Failed to share cube")
```

**Примечание:**
- Текущий пользователь должен иметь право доступа к кубу, который делится
- Целевой пользователь должен существовать и быть активным
- Совместное использование куба предоставляет целевому пользователю права на чтение и запись для этого куба
- Владельцы кубов всегда могут делиться своими кубами
- Пользователи, имеющие доступ к кубу, могут делиться кубом с другими пользователями (если у них есть соответствующие права)

## Полный Рабочий Процесс Управления Пользователями

Ниже приведен полный пример демонстрации операций управления пользователями:

```python
import uuid
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS
from memos.mem_user.user_manager import UserRole

# Инициализация MOS
mos_config = MOSConfig.from_json_file("examples/data/config/simple_memos_config.json")
memory = MOS(mos_config)

# 1. Создать Пользователя
alice_id = str(uuid.uuid4())
bob_id = str(uuid.uuid4())

memory.create_user(user_id=alice_id, user_name="Alice", role=UserRole.USER)
memory.create_user(user_id=bob_id, user_name="Bob", role=UserRole.USER)

# 2. Все Пользователи
print("All users:")
users = memory.list_users()
for user in users:
    print(f"- {user['user_name']} ({user['role']})")

# 3. Создать Куб Для Пользователя
alice_cube_id = memory.create_cube_for_user(
    cube_name="Alice's Personal Memory",
    owner_id=alice_id,
    cube_path="/path/to/alice/memory"
)

bob_cube_id = memory.create_cube_for_user(
    cube_name="Bob's Work Memory",
    owner_id=bob_id,
    cube_path="/path/to/bob/work"
)

# 4. Поделиться Кубом С Другими Пользователями
memory.share_cube_with_user(alice_cube_id, bob_id)
memory.share_cube_with_user(bob_cube_id, alice_id)

# 5. Получить Информацию О Пользователе
alice_info = memory.get_user_info()
print(f"\nAlice's accessible cubes: {len(alice_info['accessible_cubes'])}")

# 6. Добавить Память В Куб
memory.add(
    messages=[
        {"role": "user", "content": "I like playing football."},
        {"role": "assistant", "content": "That's great! Football is a wonderful sport."}
    ],
    user_id=alice_id,
    mem_cube_id=alice_cube_id
)

# 7. Искать Память
retrieved = memory.search(
    query="What does Alice like?",
    user_id=alice_id
)
print(f"Retrieved memories: {retrieved['text_mem']}")
```

## Обработка Ошибок

Методы управления пользователями включают полную обработку ошибок:

- **Проверка Пользователя**: Метод проверяет, существует ли пользователь и активен ли он перед выполнением операции
- **Проверка Доступа к Кубу**: Убедитесь, что у пользователя есть соответствующие права доступа к кубу перед выполнением операции
- **Предотвращение Дубликатов**: Элегантная обработка дублирующихся имен пользователей и ID кубов
- **Проверка Прав**: Проверка ролей и прав пользователей для чувствительных операций

## Устойчивость Базы Данных

Управление данными пользователей сохраняется в базе данных SQLite:
- **Местоположение**: По умолчанию `~/.memos/memos_users.db`
- **Таблицы**: `users`, `cubes`, `user_cube_association`
- **Связи**: Между пользователями и кубами существует отношение многие ко многим
- **Мягкое Удаление**: Пользователи и кубы мягко удаляются (отмечаются как неактивные), а не удаляются навсегда

## Вопросы Безопасности

- **Контроль Доступа на Основе Ролей**: Разные роли пользователей имеют разные права
- **Право Собственности на Куб**: Владельцы кубов могут полностью контролировать свои кубы
- **Проверка Доступа**: Все операции должны проверять права доступа пользователя перед выполнением
- **Защита Корневого Пользователя**: Корневой пользователь не может быть удален и имеет полный доступ к системе
