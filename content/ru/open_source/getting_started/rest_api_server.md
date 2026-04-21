---
title: REST API Сервис
desc: MemOS предоставляет REST API сервис, написанный с использованием FastAPI. Пользователи могут выполнять все операции через REST интерфейс.
---

![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)
<div style="text-align: center; margin-top: 10px">MemOS REST API Служба Поддержки API</div>  

### Функциональные Особенности

- Добавить Новую Память: создать новую память для указанного пользователя.
- Поиск Памяти: искать содержимое памяти для указанного пользователя.
- Получить Все Памяти Пользователя: получить все содержимое памяти для определенного пользователя.
- Обратная Связь по Памяти: предоставить обратную связь по содержимому памяти для указанного пользователя.
- Общение с MemOS: вести диалог с MemOS, возвращая SSE потоковый ответ.


## Локальный Запуск

### 1. Локальная Загрузка
```bash
# Скачайте Код В Локальную Папку 
git clone https://github.com/MemTensor/MemOS
```

### 2. Настройка Переменных Среды
```bash
# Перейдите В Директорию Папки
cd MemOS
```

#### Создайте файл `.env` в корневом каталоге и настройте ваши переменные среды.
##### Быстрая Конфигурация .env выглядит следующим образом, полная версия доступна по ссылке <a href="https://github.com/MemTensor/MemOS/blob/main/docker/.env.example">.env.example</a>.

```bash 

# Ключ API OpenAI (необходимо настроить)
OPENAI_API_KEY=sk-xxx
# Базовый URL API OpenAI 
OPENAI_API_BASE=http://xxx:3000/v1
# Имя Модели По Умолчанию
MOS_CHAT_MODEL=qwen3-max

# Модель Memory Reader LLM
MEMRADER_MODEL=qwen3-max
# Ключ API Memory Reader 
MEMRADER_API_KEY=sk-xxx
# Базовый URL API Memory Reader
MEMRADER_API_BASE=http://xxx:3000/v1

# Имя Модели Embedder
MOS_EMBEDDER_MODEL=text-embedding-v4
# Настройка embedding backend два варианта: ollama | universal_api
MOS_EMBEDDER_BACKEND=universal_api
# Базовый URL API Embedder 
MOS_EMBEDDER_API_BASE=http://xxx:8081/v1
# Ключ API Embedder
MOS_EMBEDDER_API_KEY=xxx
# Размерность Векторов Embedding
EMBEDDING_DIMENSION=1024
# Reranker Backend (http_bge | etc.)
MOS_RERANKER_BACKEND=cosine_local

# Neo4j Connection URI
# Допустимые значения: neo4j-community | neo4j | nebular | polardb
NEO4J_BACKEND=neo4j-community
# Обязательно, когда backend=neo4j*
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DB_NAME=neo4j
MOS_NEO4J_SHARED_DB=false

# Использовать ли планировщик Redis
DEFAULT_USE_REDIS_QUEUE=false

# Включить Chat API
ENABLE_CHAT_API=true
# Список моделей чата можно запросить через 百炼. Модели можно выбирать самостоятельно
CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://xxx/v1", "api_key": "sk-xxx", "model_name_or_path": "qwen3-max", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max"]}]
```

### 3. Настройка Конфигурации на Примере BaiLian

```bash
# Можно запросить через платформу 百炼
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api
# После успешного запроса получите API_KEY и BASE_URL, пример конфигурации ниже

# OpenAI API Ключ (используйте API_KEY от 百炼)
OPENAI_API_KEY=you_bailian_api_key
# Базовый URL API OpenAI 
OPENAI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
# Имя Модели По Умолчанию
MOS_CHAT_MODEL=qwen3-max

# Модель Memory Reader LLM
MEMRADER_MODEL=qwen3-max
# Memory Reader API Ключ (используйте API_KEY от 百炼)
MEMRADER_API_KEY=you_bailian_api_key
# Базовый URL API Memory Reader
MEMRADER_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# Название модели Embedder можно найти по следующей ссылке
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api/?type=model&url=2846066
MOS_EMBEDDER_MODEL=text-embedding-v4
# Настройка embedding backend два варианта: ollama | universal_api
MOS_EMBEDDER_BACKEND=universal_api
# Базовый URL API Embedder 
MOS_EMBEDDER_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
# Embedder API Ключ (используйте API_KEY от 百炼)
MOS_EMBEDDER_API_KEY=you_bailian_api_key
# Размерность Векторов Embedding
EMBEDDING_DIMENSION=1024
# Reranker Backend (http_bge | etc.)
MOS_RERANKER_BACKEND=cosine_local

# Neo4j Connection URI
# Допустимые значения: neo4j-community | neo4j | nebular | polardb
NEO4J_BACKEND=neo4j-community
# Обязательно, когда backend=neo4j*
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DB_NAME=neo4j
MOS_NEO4J_SHARED_DB=false

# Использовать ли планировщик Redis
DEFAULT_USE_REDIS_QUEUE=false

# Включить Chat API
ENABLE_CHAT_API=true

CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "you_bailian_api_key", "model_name_or_path": "qwen3-max-preview", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max-preview"]}]
```
![MemOS bailian](https://cdn.memtensor.com.cn/img/get_key_url_by_bailian_compressed.png)
<div style="text-align: center; margin-top: 10px">Пример запроса API_KEY и BASE_URL через 百炼</div>

Настройте версии зависимостей в docker/requirement.txt и т.д. (можно игнорировать). Полную версию можно найти по <a href="https://github.com/MemTensor/MemOS/blob/main/docker/requirements.txt">requirements.txt</a>.

### 4、Запуск Docker 
```bash
 # Если Docker не установлен, пожалуйста, установите соответствующую версию, адрес для загрузки ниже:
 https://www.docker.com/

# После установки можно запустить Docker через клиент или через командную строку
# Запуск Docker через командную строку
sudo systemctl start docker

# После установки проверьте состояние Docker
docker ps

# Просмотр образов Docker (необязательно)
docker images

```


### Способ 1: Запуск с Использованием Образа Зависимостей Docker (Рекомендуется)
::steps{level="4"}

```bash
# Войдите в каталог Docker
cd docker
```

#### Подтверждение Использования Образа
Включает быстрый режим и полный режим, можно различать использование облегченного пакета (различие arm и x86) и полного пакета (различие arm и x86)

```bash

● Упрощенный пакет: Упрощение зависимостей, таких как nvidia, которые имеют слишком большой объем, для достижения легкости образа, что делает локальное развертывание более легким и быстрым.
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base:v1.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

● Полный пакет: Все зависимости MemOS упакованы в образ, можно испытать полный функционал, можно напрямую построить и запустить через конфигурацию Dockerfile.
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base:v1.0.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base-arm:v1.0.0
```
#### Настройка Файла Dockerfile

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

#### Построить и Запустить Сервис :
```bash
# В каталоге Docker
docker compose up
```
![MemOS buildComposeupSuccess](https://cdn.memtensor.com.cn/img/memos_build_composeup_success_compressed.png)
<div style="text-align: center; margin-top: 10px">Пример изображения, порт по настройкам docker</div>  

#### Доступ к API через [http://localhost:8000/docs](http://localhost:8000/docs).

![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)


#### Тестовые Случаи (Добавить Память Пользователя -> Запросить Память Пользователя) Ссылка на Тестовые Случаи Docker Compose up

::



### Способ 2: Установить Клиент Docker Compose up
::steps{level="4"}
Docker Compose up для среды разработки уже предварительно настроен с qdrant, neo4j.
Для работы сервера требуется переменная среды `OPENAI_API_KEY`.


#### Перейдите в папку docker
```bash 
# Перейдите в папку Docker в текущем каталоге
cd docker
```

#### Установите соответствующие модули зависимостей
```bash

pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# Установка зависимостей с использованием источника Alibaba Cloud
pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# команда не найдена: pip  используйте pip3



```


#### Запустите контейнер с помощью Docker Compose Up в каталоге docker (убедитесь, что vpn подключен):

```bash

# Первый Запуск Требует Сборки
docker compose up --build
# Повторный Запуск Не Требует
docker compose up

```

#### Доступ к API через [http://localhost:8000/docs](http://localhost:8000/docs).

#### Пример Процесса

#####  (Запросить Память Пользователя (если нет, продолжайте дальше) -> Добавить Память Пользователя -> Запросить Память Пользователя)

##### Добавить Пользовательскую Память http://localhost:8000/product/add (POST)
```bash
# Параметры Запроса
{
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
  "async_mode": "async",
  "messages": [
    {
      "role": "user",
      "content": "Мне Нравятся Клубника"
    }
  ]
}
# Ответ
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

##### Запросить Пользовательскую Память http://localhost:8000/product/search (POST)
```bash
# Параметры Запроса
{
  "query": "Что Мне Нравится",
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
}
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
                  "memory": "[user观点]Пользователь Нравится Клубника。",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "Предпочтение Пользователя К Клубнике",
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
                      "background": "Пользователь Выразил Предпочтение К Клубнике, Показывая Их Склонности В Питании。",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user观点]Пользователь Нравится Клубника。"
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



# Ошибка Ответа, Причина Проверки
# src/memos/api/config.py
# Проверьте "neo4j_vec_db" и "EMBEDDING_DIMENSION", указанные в методе get_neo4j_community_config.
```


#### Изменения в коде сервера или библиотеке автоматически перезагрузят сервер.


::

### Способ 3: Установить Клиент с Использованием CLI Команды

::steps{level="4"}

#### Установить Зависимости

```bash
# pip install --upgrade pip && pip install --no-cache-dir -r ./docker/requirements.txt
# Установка зависимостей с использованием источника Alibaba Cloud
pip install --no-cache-dir -r ./docker/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/


```

#### Откройте терминал и выполните следующую команду для установки:

```bash

# В настоящее время может потребоваться ручная установка пакетов. Эти два пакета нужно найти.
# neo4j.5.26.4.tar   qdrant.v1.15.3.tar
docker load -i neo4j.5.26.4.tar
docker load -i qdrant.v1.15.3.tar
# Проверьте, установлены ли они успешно.
docker images
# Проверьте, запустились ли они.
docker ps -a

# Если при запуске возникает ошибка ModuleNotFoundError: No module named 'memos', это связано с проблемой соответствия пути, выполните.
export PYTHONPATH=/you-file-absolute-path/MemOS/src

# Корневая директория.
 uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1



```

#### Доступ к API

После завершения запуска, получите доступ к API по адресу [http://localhost:8000/docs](http://localhost:8000/docs).


::

### Способ 4: Не Использовать Docker
::steps{level="4"}
#### Ссылка на настройку переменных среды выше, уже настроен файл .env

#### Установите Poetry для управления зависимостями:

```bash
curl -sSL https://install.python-poetry.org | python3 - 
```

#### Настройка Переменных Среды Poetry:

```bash

# Чтобы начать использовать, вам нужно найти каталог bin Poetry в "PATH" (/Users/jinyunyuan/.local/bin) `переменная окружения.
# Современная система macOS по умолчанию использует оболочку zsh. Вы можете подтвердить это с помощью следующей команды.
1. Убедитесь, какую оболочку вы используете.

echo $SHELL
# Если выводится /bin/zsh или /usr/bin/env zsh, значит, вы используете zsh.
# (Если ваша версия системы старая, возможно, вы все еще используете bash, вывод будет /bin/bash)
2. Откройте соответствующий файл конфигурации оболочки.
# Если вы используете zsh (в большинстве случаев):
# Используйте редактор nano (рекомендуется для новичков).
nano ~/.zshrc

# Или Используйте Редактор Vim
# vim ~/.zshrc
# Если Вы Используете Bash:
nano ~/.bash_profile
# Или
nano ~/.bashrc

3. Добавьте Переменную Среды PATH

# В самом конце открытого файла, начните новую строку и вставьте команду, которую вам дала установка:
export PATH="/you-path/.local/bin:$PATH"

4. Сохраните и Выйдите из Редактора

# Если Вы Используете Nano:
# Нажмите Ctrl + O, чтобы записать (сохранить), нажмите Enter, чтобы подтвердить имя файла.
# Затем нажмите Ctrl + X, чтобы выйти из редактора.

# Если Вы Используете Vim:
# Нажмите i, чтобы войти в режим вставки, вставьте код, затем нажмите ESC, чтобы выйти из режима вставки.
# Введите :wq, затем нажмите Enter, чтобы сохранить и выйти.

5. Сделайте Конфигурацию Немедленно Действующей
# Только что измененный файл конфигурации не будет автоматически действовать в текущем открытом терминальном окне, вам нужно выполнить одну из следующих команд, чтобы перезагрузить его:

# Для Zsh:
source ~/.zshrc

# Для Bash:
source ~/.bash_profile

6. Проверьте, Успешна Ли Установка
# Теперь вы можете выполнить тестовую команду, указанную в подсказке, чтобы проверить, все ли готово:
poetry --version
# После успешного выполнения будет отображен номер версии Poetry (version 2.2.0)

```

#### Установите все зависимости проекта и инструменты разработки:

```bash
make install  
```

#### Сначала запустите neo4j и qdrant в docker

#### Запустите сервер FastAPI (в каталоге MomOS):

```bash
uvicorn memos.api.product_api:app --host 0.0.0.0 --port 8000 --reload
```

#### После запуска сервера вы можете протестировать API с помощью документации OpenAPI по адресу [http://localhost:8000/docs](http://localhost:8000/docs) или [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Тестовые Случаи (Регистрация Пользователя -> Добавить Память Пользователя -> Запросить Память Пользователя) Ссылка на Тестовые Случаи Docker Compose up

::


### Способ 5: Запуск через PyCharm

#### Запустите server_api
```bash
1. Перейдите в файл MemOS/docker/Dockerfile и измените конфигурацию запуска
# Start the docker
CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

2. Перейдите в каталог MemOS/src/memos/api и запустите server_api.py напрямую

```
