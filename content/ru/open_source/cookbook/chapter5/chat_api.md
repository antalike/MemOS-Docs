---
title: Единый Чат Интерфейс (Chat API) — Семантический Поиск, Вопросы и Ответы и Управление Памятью
desc: В этом разделе представлен единый чат интерфейс, который помогает разработчикам ИИ через один интерфейс выполнять семантический поиск, вопросы и ответы в диалоге и добавление памяти. Интерфейс следует простому процессу: сначала извлечение памяти, затем диалог с LLM, и наконец, запись текущего раунда диалога в память. Предоставлены примеры потокового и непотокового вызова, что упрощает быструю интеграцию и использование.
---

## Глава Пятая: Chat API

**🎯 Сценарий Проблемы: ** Вы разработчик AI приложений, но не хотите разрабатывать собственный процесс поиска памяти, вопросов и ответов, добавления памяти.

**🔧 Решение: ** Мы предоставили единый чат интерфейс, через который пользователи могут выполнять семантический поиск, вопросы и ответы в диалоге, добавление памяти, не вызывая несколько отдельных интерфейсов.

**🔧 Процесс Выполнения: ** Процесс выполнения следующий:
```markdown
A[Пользовательский Запрос] --> B[Поиск Памяти] --> C[LLM Чат] --> D[Добавить Память]
```

### Конкретные Шаги
#### Шаг 1: Запустите MemOS API Сервис
Сначала вам нужно настроить ваш Список Моделей Чата в .env
```dotenv
CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "xxx", "model_name_or_path": "qwen2.5-72b-instruct", "support_models": ["qwen2.5-72b-instruct"]}, {"backend": "deepseek", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "xxx", "model_name_or_path": "deepseek-r1", "support_models": ["deepseek-r1"]}]
```
```bash
uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8001 --workers 8
```

#### Шаг 2: Вызовите интерфейс chat api

**Непотоковый**
```bash
curl -X POST "http://0.0.0.0:8001/product/chat/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "memos_user_123",
    "readable_cube_ids": ["xxx"],
    "writable_cube_ids": ["xxx"],
    "query": "Я запланировал поездку в Гуанчжоу на летние каникулы, какие сетевые отели доступны для проживания?"
    "model_name_or_path": "deepseek-r1",
    "add_message_on_answer": true
  }'
```

**Потоковый**
```bash
curl -N -X POST "http://0.0.0.0:8001/product/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "memos_user_123",
    "readable_cube_ids": ["xxx"],
    "writable_cube_ids": ["xxx"],
    "query": "Я запланировал поездку в Гуанчжоу на летние каникулы, какие сетевые отели доступны для проживания?"
    "model_name_or_path": "deepseek-r1",
    "add_message_on_answer": true
  }'
```
