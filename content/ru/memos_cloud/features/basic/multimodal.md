---
title: Мультимодальные Сообщения
desc: При добавлении сообщения интегрируйте изображения и документы в взаимодействие с MemOS.
---
::warning
**[Данная статья является развернутым описанием того, как добавлять мультимодальные данные в интерфейсе 【Добавить Память-addMessage】, вы можете нажать здесь, чтобы напрямую просмотреть подробную документацию API](/api_docs/core/add_message)**
::

MemOS поддерживает не только текст, но и мультимодальные данные, включая документы и изображения. Пользователи могут бесшовно интегрировать текст, документы и изображения в взаимодействие с MemOS, позволяя системе извлекать соответствующую информацию из различных типов медиа, обогащать содержание памяти и улучшать возможности системы памяти.

## 1. Как Добавить Мультимодальное Сообщение

:::note 
Внимание<br>
Когда сообщение содержит мультимодальное содержимое, поле `async_mode`, переданное вами, становится недействительным из-за длительного времени обработки файловой памяти, в этом случае по умолчанию используется "асинхронный режим". Вы можете проверить прогресс обработки файловой памяти через интерфейс `get/status`.
:::

Когда пользователь загружает документы или изображения, MemOS извлекает текст, визуальную информацию и другие соответствующие детали и обрабатывает их в память пользователя.

:::note
**Мультимодальные Сообщения и Инструментальная Память**

Кроме обработки содержимого документов и изображений, MemOS также поддерживает обработку информации о вызовах инструментов. Когда вы добавляете информацию о вызовах инструментов в сообщение, система обрабатывает ее как инструментальную память, включая информацию об инструменте (Tool Schema) и память о траектории инструмента (Tool Trajectory Memory). Подробности см. в [Вызов Инструментов](/memos_cloud/features/advanced/tool_calling).
:::

### Добавить Сообщение

```python
import os
import requests
import json

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "text",
                  "text": "Я изучаю MemOS."
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                  }
                }
            ]
        },
        {"role": "assistant", "content": "Хорошо, нужно ли мне ответить на ваш вопрос?"}
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Извлечь Память

```python
import os
import requests
import json

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "Помогите мне подвести итоги этой картинки",
  "user_id": "memos_user_123",
  "conversation_id": "1214"
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

# Замените часть печати
print("Результат：")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Выходные Результаты
```python
{
  "code": 0,
  "data": {
    "memory_detail_list": [
      {
        "id": "a5136287-de10-4df2-afc5-e412cdb8b649",
        "memory_key": "Изучение MemOS",
        "memory_value": "Пользователь изучает MemOS и делится связанной картинкой, время - 18 декабря 2025 года, 7:07 (UTC).\n","
        "memory_type": "WorkingMemory",
        "create_time": 1766041646311,
        "conversation_id": "1211",
        "status": "activated",
        "confidence": 0.99,
        "tags": [
          "Изучение",
          "MemOS",
          "Поделиться картинкой"
        ],
        "update_time": 1766041689234,
        "relativity": 0.5170716
      },
      {
        "id": "4a1d42f4-c9fa-41bf-805d-2ea985bba984",
        "memory_key": "Обзор функций MemOS",
        "memory_value": "MemOS - это интеллектуальная система памяти, которая может хранить информацию, добавляя пути, и извлекать информацию с помощью функции запроса. Система поддерживает различные форматы документов, такие как PDF и DOC, и использует ИИ для интеллектуального ответа и обработки.\n","
        "memory_type": "WorkingMemory",
        "create_time": 1766041689091,
        "conversation_id": "1211",
        "status": "activated",
        "confidence": 0.99,
        "tags": [
          "MemOS",
          "Интеллектуальная память",
          "Хранение информации",
          "Функция запроса",
          "image",
          "visual"
        ],
        "update_time": 1766041689234,
        "relativity": 0.38406307
      }
    ],
    "preference_detail_list": [],
    "tool_memory_detail_list": [],
    "preference_note": ""
  },
  "message": "ok"
}
```

## 2. Типы Медиа

MemOS в настоящее время поддерживает следующие типы медиа:

1.  **Изображения** - JPG, PNG и другие распространенные форматы изображений
    
2.  **Документы** - PDF, DOCX, DOC, TXT, JSON, MD, XML
    

## 3. Ограничения на Загрузку Файлов

1.  При добавлении сообщения количество файлов, загружаемых за один запрос, не должно превышать 20, размер одного файла не должен превышать 100 МБ и 500 страниц. Обратите внимание: входной лимит для интерфейса `add/message` составляет 20,000 токенов.
    
2.  Если количество файлов, размер одного файла или количество страниц превышает указанные ограничения, данная задача будет считаться "неудачной". Вам необходимо скорректировать запрос в соответствии с ограничениями и повторно его отправить.
    

## 4. Примеры Использования

### Загрузить Сообщение С Изображением

**Использовать URL Изображения**

При добавлении сообщения вы можете напрямую загрузить URL изображения.

```python
import os
import requests
import json

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "image_url",
                  "image_url": {
                    "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                  }
                }
            ]
        }
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

**Использовать Кодирование Изображения Base64 Для Загрузки Локального Изображения**

Для загрузки локального изображения или его прямого встраивания можно использовать кодирование изображения Base64.

```python
import os
import requests
import json
import base64

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# Путь к файлу изображения
image_path = "path/to/your/image.jpg"

# Кодирование изображения с помощью Base64
with open(image_path, "rb") as image_file:
    base64_image = base64.b64encode(image_file.read()).decode("utf-8")


data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                }
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Загрузить Сообщение С Документом

**Использовать URL Документа**

```python
import os
import requests
import json

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                  "type": "file",
                  "file": {
                    "file_data": "https://cdn.memtensor.com.cn/file/MemOS 2.pdf"
                  }
                }
            ]
        }
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

**Использовать Кодирование Изображения Base64 Для Загрузки Локального Документа**

```python
import os
import requests
import json
import base64

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# Путь к файлу документа
document_path = "path/to/your/document.pdf"

# Функция для преобразования файла в строку Base64
def file_to_base64(file_path):
    with open(file_path, "rb") as file:
        return base64.b64encode(file.read()).decode('utf-8')

# Кодирование документа с помощью Base64
base64_document = file_to_base64(document_path)

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user", 
            "content": [
                {
                    "type": "file",
                    "file": {"file_data": base64_document}
                }
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print("Результат：")
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Полный Пример

Вот полный пример, демонстрирующий, как добавить сообщение диалога пользователя с помощником, включающее различные типы медиа:

```python
import os
import json
import requests

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "1211",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Я изучаю MemOS."
                }  # Текстовое сообщение
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://cdn.memtensor.com.cn/img/1758706201390_iluj1c_compressed.png"
                    }
                }  # Загрузка изображения
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "file",
                    "file": {
                        "file_data": "https://cdn.memtensor.com.cn/file/MemOS 2.pdf"
                    }
                }  # Загрузка документа
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))
print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```
