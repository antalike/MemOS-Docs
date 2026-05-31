---
title: "Руководство по Установке"
desc: "Полное руководство по установке MemOS."
---


::card-group

  :::card
  ---
  icon: ri:database-2-line
  title: Установка Через Docker
  to: /cn/open_source/getting_started/installation#УстановкаЧерезDocker
  ---
  Подходит для быстрой развертки: одно нажатие для запуска сервиса и зависимых компонентов.
  :::

  :::card
  ---
  icon: ri:play-line
  title: Установка Из Исходного Кода
  to: /cn/open_source/getting_started/installation#УстановкаИзИсходногоКода
  ---
  Подходит для вторичной разработки и вклада: редактируемая установка, возможность тестирования, локальная отладка.
  :::

  :::card
  ---
  icon: ri:tree-line
  title: Установка Через pip
  to: /cn/open_source/getting_started/installation#УстановкаЧерезpip
  ---
  Самый простой способ установки: быстрое начало работы с MemOS.
  :::


::



## Установка через Docker
```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
```

#### Создание файла конфигурации .env
::note
**Пожалуйста, обратите внимание**<br>
Конфигурация файла .env должна находиться в корневом каталоге проекта MemOS
::

::steps{level="4"}

#### 1. Создать .env
```bash
cd MemOS
touch .env
```

#### 2. Содержимое .env

.env быстрая конфигурация выглядит следующим образом
```bash 

# Ключ API OpenAI (необходимо настроить)
OPENAI_API_KEY=sk-xxx
# Базовый URL API OpenAI 
OPENAI_API_BASE=http://xxx:3000/v1
# Имя модели по умолчанию
MOS_CHAT_MODEL=qwen3-max

# Модель Memory Reader LLM
MEMRADER_MODEL=qwen3-max
# Ключ API Memory Reader 
MEMRADER_API_KEY=sk-xxx
# Базовый URL API Memory Reader
MEMRADER_API_BASE=http://xxx:3000/v1

# Имя модели Embedder
MOS_EMBEDDER_MODEL=text-embedding-v4
# Конфигурация Embedding Backend Два Выбора ollama | universal_api
MOS_EMBEDDER_BACKEND=universal_api
# Embedder API Базовый URL 
MOS_EMBEDDER_API_BASE=http://xxx:8081/v1
# Embedder API Ключ
MOS_EMBEDDER_API_KEY=xxx
# Размерность Векторов Embedding
EMBEDDING_DIMENSION=1024
# Reranker Backend (http_bge | и т.д.)
MOS_RERANKER_BACKEND=cosine_local

# Neo4j Подключение URI
# Допустимые Значения: neo4j-community | neo4j | nebular | polardb
NEO4J_BACKEND=neo4j-community
# Обязательно, Когда backend=neo4j*
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DB_NAME=neo4j
MOS_NEO4J_SHARED_DB=false

# Использовать Ли Redis Диспетчер
DEFAULT_USE_REDIS_QUEUE=false

# Включить Чат API
ENABLE_CHAT_API=true
# Список Моделей Чата Можно Запросить Через 百炼. Модели Можно Выбрать
CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://xxx/v1", "api_key": "sk-xxx", "model_name_or_path": "qwen3-max", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max"]}]
```
#### Пример конфигурации .env на основе BaiLian
```bash
# Можно Запросить Через Платформу 百炼
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api
# После Успешной Заявки Получите API_KEY и BASE_URL, Пример Конфигурации Ниже

# OpenAI API Ключ (Используйте API_KEY 百炼)
OPENAI_API_KEY=you_bailian_api_key
# Базовый URL API OpenAI 
OPENAI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
# Имя модели по умолчанию
MOS_CHAT_MODEL=qwen3-max

# Модель Memory Reader LLM
MEMRADER_MODEL=qwen3-max
# Memory Reader API Ключ (Используйте API_KEY 百炼)
MEMRADER_API_KEY=you_bailian_api_key
# Базовый URL API Memory Reader
MEMRADER_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# Название модели Embedder можно найти по следующей ссылке
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api/?type=model&url=2846066
MOS_EMBEDDER_MODEL=text-embedding-v4
# Конфигурация Embedding Backend Два Выбора ollama | universal_api
MOS_EMBEDDER_BACKEND=universal_api
# Embedder API Базовый URL 
MOS_EMBEDDER_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
# API-ключ Embedder (используйте API_KEY от 百炼)
MOS_EMBEDDER_API_KEY=you_bailian_api_key
# Размерность Векторов Embedding
EMBEDDING_DIMENSION=1024
# Reranker Backend (http_bge | и т.д.)
MOS_RERANKER_BACKEND=cosine_local

# Neo4j Подключение URI
# Допустимые Значения: neo4j-community | neo4j | nebular | polardb
NEO4J_BACKEND=neo4j-community
# Обязательно, Когда backend=neo4j*
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DB_NAME=neo4j
MOS_NEO4J_SHARED_DB=false

# Использовать Ли Redis Диспетчер
DEFAULT_USE_REDIS_QUEUE=false

# Включить Чат API
ENABLE_CHAT_API=true

CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "you_bailian_api_key", "model_name_or_path": "qwen3-max-preview", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max-preview"]}]
```
![MemOS bailian](https://cdn.memtensor.com.cn/img/get_key_url_by_bailian_compressed.png)
<div style="text-align: center; margin-top: 10px">Пример запроса API_KEY и BASE_URL от 百炼</div>

::


#### Конфигурация файла Dockerfile
::note
**Пожалуйста, обратите внимание**<br>
Файл Dockerfile находится в каталоге docker
::

```bash
# Перейдите в каталог docker
cd docker
```
Содержит быстрый режим и полный режим, можно различать использование облегченного пакета (различие arm и x86) и полного пакета (различие arm и x86)

```bash

● Упрощенный пакет: упрощает зависимости, такие как nvidia, которые имеют слишком большой объем, для достижения легковесности образа, что делает локальное развертывание более легким и быстрым.
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base:v1.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

● Полный пакет: включает все зависимости MemOS в образ, чтобы вы могли испытать полный функционал, можно напрямую построить и запустить, настроив Dockerfile.
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base:v1.0.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base-arm:v1.0.0
```

```bash
# Текущий пример использует упрощенный пакет url
FROM registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

WORKDIR /app

ENV HF_ENDPOINT=https://hf-mirror.com

ENV PYTHONPATH=/app/src

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

```

#### Запуск клиента docker
```bash
 # Если docker не установлен, пожалуйста, установите соответствующую версию, ссылка для загрузки ниже:
 https://www.docker.com/

 # После установки вы можете запустить docker через клиент или через командную строку
 # Запустите docker через командную строку
 sudo systemctl start docker

# После установки проверьте состояние docker
docker ps

# Просмотрите образы docker (необязательно)
docker images

```

#### Построение и запуск сервиса :
::note
**Пожалуйста, обратите внимание**<br>
Команда сборки также находится в каталоге docker
::
```bash
# В каталоге docker
docker compose up
```
![MemOS buildComposeupSuccess](https://cdn.memtensor.com.cn/img/memos_build_composeup_success_compressed.png)
<div style="text-align: center; margin-top: 10px">Пример изображения, порт согласно пользовательской конфигурации docker</div>  

#### Доступ к API через [http://localhost:8000/docs](http://localhost:8000/docs).

![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)

#### ADD Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{

    "messages": [{
    "role": "user",
    "content": "Мне нравится есть клубнику"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"]
}'

# Ответ
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

#### Search Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "Что мне нравится есть",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
# Ответ
{
    "code": 200,
    "message": "Search completed successfully",
    "data": {
        "text_mem": [
          {
            "cube_id": "7231eda8-6c57-4f6e-97ce-98b699eebb98",
            "memories": [
              {
                  "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                  "memory": "[user观点]Пользователь любит клубнику.",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "Предпочтение пользователя к клубнике",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "предпочтение",
                          "клубника"
                      ],
                      "visibility": null,
                      "updated_at": "2025-09-18T08:23:44.625479000+00:00",
                      "memory_type": "UserMemory",
                      "sources": [],
                      "embedding": [],
                      "created_at": "2025-09-18T08:23:44.625511000+00:00",
                      "usage": [
                          "{
                            "time": "2025-09-18T08:24:17.759748", 
                            "info": {
                              "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                              "session_id": "root_session"
                            }
                          }"
                      ],
                      "background": "Пользователь выразил предпочтение к клубнике, что показывает их склонность в диетических предпочтениях.",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user观点]Пользователь любит клубнику."
                  },
                  "ref_id": "[2f40be8f]"
              },
              ...
            }
          }
        ],
        "act_mem": [],
        "para_mem": []
    }
}
```


## Установка из исходного кода
```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
```

#### Создание файла конфигурации .env
Серверный API MemOS зависит от переменных окружения для запуска, поэтому необходимо создать файл .env в каталоге запуска.
1. Создайте .env
```bash
cd MemOS
touch .env
```

2. Содержимое .env, быстрая конфигурация см. в разделе установки docker [конфигурация env](/open_source/getting_started/installation#2.-.env-内容)
Подробная конфигурация .env см. в [конфигурации env](/open_source/getting_started/rest_api_server/#本地运行)

::note
**Пожалуйста, обратите внимание**<br>
Конфигурация файла .env должна находиться в корневом каталоге проекта MemOS
::


#### Установка зависимостей
```bash
# Выполнить команду установки
pip install -e .
pip install --no-cache-dir -r ./docker/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
# Настроить PYTHONPATH в абсолютном каталоге текущего проекта src
export PYTHONPATH=/******/MemOS/src
```

#### Установка графовой базы данных
Основой памяти Memos является хранение через графовую базу данных, в открытом проекте рекомендуется использовать Neo4j для запуска вашего первого проекта. Сообщество также поддерживает версии Neo4j Enterprise/Community и PolarDB.

::note
**Самый быстрый выбор для разработчиков ПК: Neo4j Desktop**<br>Если вы планируете использовать Neo4j в качестве графовой памяти, Neo4j Desktop может быть самым удобным способом установки.<br>
Кроме того, вам нужно установить в файле .env **NEO4J_BACKEND=neo4j**
::


#### Запустить MemOS Server.
```bash
# В корневом каталоге проекта
uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1
```

#### ADD Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{

    "messages": [{
    "role": "user",
    "content": "Мне нравится есть клубнику"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"]
}'

# Ответ
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

#### Search Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "Что мне нравится есть",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
# Ответ
{
    "code": 200,
    "message": "Search completed successfully",
    "data": {
        "text_mem": [
          {
            "cube_id": "7231eda8-6c57-4f6e-97ce-98b699eebb98",
            "memories": [
              {
                  "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                  "memory": "[user观点]Пользователь любит клубнику.",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "Предпочтение пользователя к клубнике",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "предпочтение",
                          "клубника"
                      ],
                      "visibility": null,
                      "updated_at": "2025-09-18T08:23:44.625479000+00:00",
                      "memory_type": "UserMemory",
                      "sources": [],
                      "embedding": [],
                      "created_at": "2025-09-18T08:23:44.625511000+00:00",
                      "usage": [
                          "{
                            "time": "2025-09-18T08:24:17.759748", 
                            "info": {
                              "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea", 
                              "session_id": "root_session"
                            }
                          }"
                      ],
                      "background": "Пользователь выразил предпочтение к клубнике, что показывает их склонность в диетических предпочтениях.",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user观点]Пользователь любит клубнику."
                  },
                  "ref_id": "[2f40be8f]"
              },
              ...
            }
          }
        ],
        "act_mem": [],
        "para_mem": []
    }
}
```


## Установка через pip
Самый простой способ установить MemOS — использовать pip.

::steps{level="4"}

#### Создание и активация окружения Conda (рекомендуется)

Чтобы избежать конфликтов зависимостей, настоятельно рекомендуется использовать отдельное окружение Conda.

```bash
conda create -n memos python=3.11
conda activate memos
```

#### Установка MemOS из PyPI
Установка MemOS и всех его дополнительных компонентов:

```bash
pip install -U "MemoryOS[all]"
```

#### Установка графовой базы данных
Основой памяти Memos является хранение через графовую базу данных, в открытом проекте рекомендуется использовать Neo4j для запуска вашего первого проекта. Сообщество также поддерживает версии Neo4j Enterprise/Community и PolarDB.

::note
**Самый быстрый выбор для разработчиков ПК: Neo4j Desktop**<br>Если вы планируете использовать Neo4j в качестве графовой памяти, Neo4j Desktop может быть самым удобным способом установки.
::


#### Создание файла конфигурации .env
Серверный API MemOS зависит от переменных окружения для запуска, поэтому необходимо создать файл .env в каталоге запуска.
1. Создайте .env
```bash
touch .env
```

2. Пример содержимого .env
Подробная конфигурация .env см. в [конфигурации env](/open_source/getting_started/rest_api_server)

Для получения подробной информации о настройке среды разработки, руководствах по рабочим процессам и лучших практиках вклада, пожалуйста, обратитесь к нашему [руководству по вкладу](/open_source/contribution/overview).

#### Запустить MemOS Server
MemOS не будет автоматически загружать файл .env, пожалуйста, используйте способ python-dotenv для запуска.
```bash
python -m dotenv run -- \
  uvicorn memos.api.server_api:app \
  --host 0.0.0.0 \
  --port 8000
```
После успешного запуска вы увидите аналогичный вывод:
```text
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

#### Начните свои операции памяти
Добавление памяти (способы вызова совпадают с развертыванием из исходного кода, на этот раз мы попробуем **синхронный** способ добавления памяти):
```text
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{
    "messages": [{
    "role": "user",
    "content": "Мне нравится есть клубнику"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "async_mode": "sync",
    "mode": "fine"
}'
```

::note
**Ожидаемый вывод**<br>
```json
{
  "code": 200,
  "message": "Memory added successfully",
  "data": [
    {
      "memory": "Пользователь любит есть клубнику.",
      "memory_id": "d01a354e-e5f6-4e2a-bd89-c57ae",
      "memory_type": "UserMemory",
      "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
    }
  ]
}
```
::

Извлечение памяти (способы вызова совпадают с развертыванием из исходного кода):
```text
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "Что мне нравится есть",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
```

::note
**Ожидаемый вывод**<br>
```json
{
  "code": 200,
  "message": "Search completed successfully",
  "data": {
    "text_mem": [
      {
        "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
        "memories": [
          {
            "id": "f18cbe36-4cd9-456f-9b9f-6be89c35b2bf",
            "memory": "Пользователь любит есть клубнику.",
            "metadata": {
              "user_id": "8736b16e-1d20-4163-980b-a5dc",
              "session_id": "default_session",
              "status": "activated",
              "type": "fact",
              "key": "Предпочтение Клубники",
              "confidence": 0.99,
              "source": null,
              "tags": ["Предпочтение Напитков", "Клубника"],
              "visibility": null,
              "updated_at": "2025-12-26T20:35:08.178564000+00:00",
              "info": null,
              "covered_history": null,
              "memory_type": "WorkingMemory",
              "sources": [],
              "embedding": [],
              "created_at": "2025-12-26T20:35:08.177484000+00:00",
              "usage": [],
              "background": "Пользователь выразил положительное мнение, что указывает на то, что они любят этот фрукт и, возможно, склонны включать клубнику в свои пищевые предпочтения.",
              "file_ids": [],
              "relativity": 0.0,
              "ref_id": "[f18cbe36]"
            },
            "ref_id": "[f18cbe36]"
          }
        ]
      }
    ],
    "act_mem": [],
    "para_mem": [],
    "pref_mem": [
      {
        "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
        "memories": []
      }
    ],
    "pref_note": "",
    "tool_mem": [
      {
        "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
        "memories": []
      }
    ],
    "pref_string": ""
  }
}
```
::

::

::note
**Скачать пример кода**<br>Поздравляем вас 🎉 с успешной установкой MemOS через pip и прохождением минимального тестового случая! Вы также можете скачать пример кода на основе следующих команд, чтобы понять, как вызываются каждый внутренний модуль memos:
```bash
memos download_examples
```
::


