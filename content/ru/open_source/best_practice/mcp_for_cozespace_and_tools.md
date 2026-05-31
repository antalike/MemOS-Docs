---
title: MemOS MCP Интеграционное Руководство
description: Настройка службы MCP MemOS на платформах, таких как Coze, для бесшовной интеграции агентов и системы памяти
---

Это руководство поможет вам настроить службу MCP MemOS на платформах, таких как Coze, для бесшовной интеграции агентов и системы памяти.

## Выбор Способа Развертывания MCP

MemOS предлагает два способа развертывания MCP, вы можете выбрать в зависимости от ваших потребностей:

### Использование Облачной Службы MemOS (Рекомендуется)

Если вы хотите быстро подключиться и не хотите развертывать сервер самостоятельно, рекомендуется использовать официальную облачную службу MemOS.

**Преимущества:**
- ✅ Готово к использованию, не требует развертывания
- ✅ Гарантия высокой доступности
- ✅ Автоматическое масштабирование и обслуживание
- ✅ Поддержка различных клиентов (Claude, Cursor, Cline и др.)

**Способ Настройки:**

Пожалуйста, посетите [Руководство по Настройке MCP Облачной Службы MemOS](https://memos-docs.openmem.net/cn/mcp_agent/mcp/guide) для получения подробных инструкций по настройке.

Основные Шаги:
1. Зарегистрируйте аккаунт на [MemOS API控制台](https://memos-dashboard.openmem.net/cn/apikeys/) и получите API Key
2. Настройте сервис `@memtensor/memos-api-mcp` в клиенте MCP
3. Установите переменные окружения (`MEMOS_API_KEY`, `MEMOS_USER_ID`, `MEMOS_CHANNEL`)

### Самостоятельное Развертывание Службы MCP

Если вам требуется приватное развертывание или индивидуальные настройки, вы можете развернуть службу MCP на своем сервере.

**Преимущества:**
- ✅ Полная приватизация данных
- ✅ Настраиваемая конфигурация
- ✅ Полный контроль над службой
- ✅ Подходит для внутреннего использования в компании

**Предварительные Требования:**
- Python 3.9+
- База данных Neo4j (или другая поддерживаемая графовая база данных)
- HTTPS домен (для платформ, таких как Coze)

Продолжайте читать ниже, чтобы узнать подробные шаги развертывания.

---

## Настройка Самостоятельно Развернутой Службы MCP

Следующее содержание предназначено для пользователей, которым необходимо самостоятельно развернуть службу MCP.

## Описание Архитектуры

Самостоятельно развернутая служба MCP использует следующую архитектуру:

```
Клиент (Coze/Claude и др.) 
    ↓ [HTTPS]
Сервер MCP (порт 8002)
    ↓ [HTTP调用]
Сервер API (порт 8001)
    ↓
Основной сервис MemOS
```

**Описание Компонентов:**
- **Server API**: Предоставляет REST API интерфейс (`/product/*`), обрабатывает операции добавления, удаления, изменения и поиска памяти
- **Сервер MCP**: Экспонирует протокол MCP через HTTP, вызывает Server API для выполнения операций
- **HTTPS Обратный Прокси**: Платформы, такие как Coze, требуют использования безопасного соединения HTTPS

::steps{level="3"}

### Шаг 1: Запуск Server API

Server API является бэкендом службы MCP, предоставляющим фактические функции управления памятью.

```bash
cd /path/to/MemOS
python src/memos/api/server_api.py --port 8001
```

Проверьте, работает ли Server API нормально:

```bash
curl http://localhost:8001/docs
```

Если возвращается страница документации API, значит, запуск успешен.

::note
**Конфигурационный Файл**<br>
Server API автоматически загрузит конфигурацию, убедитесь, что зависимости, такие как Neo4j, правильно настроены. Вы можете обратиться к `examples/data/config/tree_config_shared_database.json` для примера конфигурации.
::

### Шаг 2: Запуск MCP HTTP Службы

Запустите службу MCP в другом терминале:

```bash
cd /path/to/MemOS
python examples/mem_mcp/simple_fastmcp_serve.py --transport http --port 8002
```

После запуска службы MCP будет отображена информация, похожая на следующую:

```
╭──────────────────────────────────────────────────╮
│       MemOS MCP via Server API                   │
│       Transport:   HTTP                          │
│       Server URL:  http://localhost:8002/mcp     │
╰──────────────────────────────────────────────────╯
```

**Настройка Переменных Среды (по желанию):**

Вы можете настроить адрес Server API через файл `.env` или переменные среды:

```bash
export MEMOS_API_BASE_URL="http://localhost:8001/product"
```

::note
**Список Инструментов**<br>
Служба MCP предоставляет следующие инструменты:
- `add_memory`: Добавить память
- `search_memories`: Искать память
- `chat`: Общаться с системой памяти

Полный список инструментов см. в `examples/mem_mcp/simple_fastmcp_serve.py`
::

### Шаг 3: Настройка HTTPS Обратного Прокси

Платформы, такие как Coze, требуют использования HTTPS соединения. Вам необходимо настроить HTTPS обратный прокси (например, Nginx), чтобы перенаправить трафик на службу MCP.

**Пример Конфигурации Nginx:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /mcp {
        proxy_pass http://localhost:8002/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Поддержка SSE
        proxy_buffering off;
        proxy_cache off;
    }
}
```

::warning
**SSL Сертификат**<br>
Убедитесь, что вы используете действительный SSL сертификат, самоподписанные сертификаты могут не быть приняты платформами, такими как Coze. Вы можете получить сертификат бесплатно с помощью Let's Encrypt.
::

### Шаг 4: Тестирование Службы MCP

Используйте клиентский тестовый скрипт для проверки службы:

```bash
cd /path/to/MemOS
python examples/mem_mcp/simple_fastmcp_client.py
```

Успешный вывод примера:

```
Working FastMCP Client
========================================
Connected to MCP server

  1. Adding memory...
    Result: Memory added successfully
  
  2. Searching memories...
    Результат: [搜索结果]
  
  3. Chatting...
    Результат: [AI响应]

✓ All tests completed!
```

::

## Настройка MCP в Coze

После завершения развертывания службы настройте соединение MCP в пространстве Coze.

::steps{level="3"}

### Шаг 1: Откройте Пространство Coze и Перейдите на Страницу Настройки Инструментов

![Страница конфигурации Coze](https://statics.memtensor.com.cn/memos/coze_space_1.png)

### Шаг 2: Добавьте Пользовательский Инструмент MCP

На странице настройки инструментов добавьте пользовательский инструмент:

![Добавить пользовательский инструмент](https://statics.memtensor.com.cn/memos/coze_space_2.png)

### Шаг 3: Настройка URL Соединения MCP

Настройте URL соединения MCP, используя ваш настроенный HTTPS адрес:

```
https://your-domain.com/mcp
```
Доступные инструменты MCP:
- **add_memory**: Добавить новую память
- **search_memories**: Поиск существующей памяти  
- **chat**: Диалог на основе памяти

::note
**Тестирование соединения**<br>
После завершения настройки проверьте, работает ли соединение MCP в Coze. Убедитесь, что вы можете успешно вызывать различные инструменты.
::

::

---

## Прямое использование REST API (Расширенный)

Для сценариев, требующих более гибкой интеграции, вы можете напрямую использовать REST интерфейс Server API.

::steps{level="3"}

### Шаг 1: Запуск Server API

```bash
cd /path/to/MemOS
python src/memos/api/server_api.py --port 8001
```
**Описание порта**
- Server API по умолчанию работает на порту 8001
- Предоставляет REST API конечные точки `/product/*`

### Шаг 2: Настройка пользовательских инструментов в Coze IDE

1. В Coze выберите способ создания "IDE плагин"
2. Настройте запрос к вашему развернутому сервису Server API

![Конфигурация плагина Coze IDE](https://statics.memtensor.com.cn/memos/coze_tools_1.png)

### Шаг 3: Реализация инструмента add_memory

![Конфигурация add_memory операции](https://statics.memtensor.com.cn/memos/coze_tools_2.png)

**Пример кода:** Настройка операции `add_memory` в IDE и публикация:

![Конфигурация add_memory операции](https://statics.memtensor.com.cn/memos/coze_tools_2.png)
Подробный код ниже

```python 
import json
import requests
from runtime import Args
from typings.add_memory.add_memory import Input, Output

def handler(args: Args[Input])->Output:
    memory_content = args.input.memory_content
    user_id = args.input.user_id
    cube_id = args.input.cube_id
    
    # Вызов интерфейса add Server API
    url = "https://your-domain.com:8001/product/add"
    payload = json.dumps({
        "user_id": user_id,
        "messages": memory_content,  # Поддерживает строки или массивы сообщений
        "writable_cube_ids": [cube_id] if cube_id else None
    })
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, data=payload, timeout=30)
    response.raise_for_status()
    
    return response.json()
```

**Реализация других инструментов:**

Аналогично реализуйте инструменты search и chat:

```python
# Инструмент Search
def search_handler(args: Args[Input]) -> Output:
    url = "https://your-domain.com:8001/product/search"
    payload = json.dumps{
        "user_id": args.input.user_id,
        "query": args.input.query,
    })
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, data=payload, timeout=30)
    response.raise_for_status()
    
    return response.json()

# Инструмент Chat
def chat_handler(args: Args[Input]) -> Output:
    url = "https://your-domain.com:8001/product/chat/complete"
    payload = json.dumps({
        "user_id": args.input.user_id,
        "query": args.input.query
    })
    response = requests.post(url, json=payload, timeout=30)
    return response.json()
```

### Шаг 4: Публикация и тестирование инструментов

После завершения публикации вы можете просмотреть плагин в "Мои ресурсы": 

![Ресурсы плагина после публикации](https://statics.memtensor.com.cn/memos/coze_tools_3.png)

### Шаг 5: Интеграция в рабочий процесс агента

Добавьте плагин в рабочий процесс агента:

1. Создайте нового агента или отредактируйте существующего
2. В списке инструментов добавьте опубликованный плагин MemOS
3. Настройте рабочий процесс, вызовите инструменты памяти
4. Протестируйте функции хранения и извлечения памяти

::

---

## Часто задаваемые вопросы

### Q1: MCP служба не может подключиться к Server API

**Решение:**
- Проверьте, работает ли Server API: `curl http://localhost:8001/docs`
- Проверьте, правильно ли настроена переменная окружения `MEMOS_API_BASE_URL`
- Просмотрите журналы службы MCP, чтобы подтвердить адрес вызова

### Q2: Coze не может подключиться к MCP службе

**Решение:**
- Убедитесь, что используется HTTPS соединение
- Проверьте, действителен ли SSL сертификат
- Проверьте конфигурацию обратного прокси: `curl https://your-domain.com/mcp`
- Проверьте настройки брандмауэра и группы безопасности

### Q3: Ошибка подключения к Neo4j

**Решение:**
- Убедитесь, что служба Neo4j работает нормально
- Проверьте информацию о подключении в конфигурационном файле (uri, user, password)
- Смотрите пример конфигурации в `examples/data/config/tree_config_shared_database.json`

### Q4: Как посмотреть полный пример API?

**Справочный документ:**
- MCP сервер: `examples/mem_mcp/simple_fastmcp_serve.py`
- MCP клиент: `examples/mem_mcp/simple_fastmcp_client.py`
- Тест API: `examples/api/server_router_api.py`

---

## Резюме

С помощью этого руководства вы можете:
- ✅ Выбрать подходящий способ развертывания MCP (облачный сервис или собственное развертывание)
- ✅ Завершить полный процесс развертывания службы MCP
- ✅ Интегрировать функции памяти MemOS на платформах, таких как Coze
- ✅ Прямо интегрировать с помощью REST API

Независимо от выбранного способа, MemOS может предоставить вашему агенту мощное управление памятью.

::note
**Описание параметров API**
- Используйте стандартный формат параметров Server API
- `messages`: заменяет прежний `memory_content`, поддерживает строки или массивы сообщений
- `writable_cube_ids`: заменяет прежний `mem_cube_id`, поддерживает несколько кубов
- Server API работает на порту 8001, путь `/product/add`
- Убедитесь, что он соответствует интерфейсу MemOS Server API, можно обратиться к примеру в `examples/api/server_router_api.py`
**Настройка IDE**<br>В IDE вы можете настроить параметры инструмента, формат возвращаемых значений и т. д., чтобы убедиться, что они соответствуют интерфейсу MemOS API. Используйте этот метод для завершения написания интерфейса search и интерфейса регистрации пользователя, и нажмите на публикацию
::

### Публикация и использование плагина

После завершения публикации вы можете просмотреть плагин в "Мои ресурсы", чтобы интегрировать его в рабочий процесс агента:

![Ресурсы плагина после публикации](https://statics.memtensor.com.cn/memos/coze_tools_3.png)

### Создание агента и тестирование

После создания самого простого агента вы можете протестировать операции с памятью:

1. Создайте нового агента
2. Добавьте опубликованный плагин памяти
3. Настройте рабочий процесс
4. Протестируйте функции хранения и извлечения памяти

С помощью вышеуказанной настройки вы сможете успешно интегрировать функции памяти MemOS в пространство Coze, предоставив вашему агенту мощные возможности памяти.
