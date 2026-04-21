---
title: ВызовИнструментаToolCall
desc: Добавление информации о вызове инструмента, объединение решений, результатов выполнения и их траектории использования в памяти MemOS.

::warning 
Внимание
<br>
<br>

**[Необходимо сначала передать память инструмента при добавлении сообщения (нажмите здесь, чтобы просмотреть подробную документацию API)](/api_docs/core/add_message)**
<br>

**[Только тогда можно будет искать память инструмента при поиске памяти (нажмите здесь, чтобы просмотреть подробную документацию API)](/api_docs/core/search_memory)**
<br>
<br>

**Данный документ сосредоточен на функциональном описании, подробные поля интерфейса и ограничения можно просмотреть по ссылке выше**

::

## 1. Когда Использовать

Когда вашему Agent необходимо получить внешнюю информацию через инструмент (function / tool) и вы хотите, чтобы «контекст и результаты вызова инструмента» могли быть поняты, связаны и сохранены в MemOS как доступная память, подходит использование этой структуры сообщения.

## 2. Принцип Работы

Step1: Добавление информации о вызове инструмента

`assistant` сообщение: `tool_calls` описывает поведение модели, решающей вызвать определенный инструмент и его параметры.

`tool` сообщение: содержит реальные результаты, возвращенные инструментом, и точно связывается с соответствующими `tool_calls` через `tool_call_id`.

<br>

Step2: MemOS обрабатывает связанную с инструментом память

*  **Информация об инструменте (Tool Schema)**: MemOS поддерживает структурированное управление и динамическое обновление информации об инструментах, унифицируя способы описания различных инструментов, позволяя модели эффективно осуществлять поиск, понимание и открытие инструментов без необходимости жесткого кодирования деталей инструментов в подсказках.

*  **Память Траектории (Tool Trajectory Memory)**: MemOS извлекает и сохраняет ключевые траектории в процессе использования инструмента, включая "в каком контексте был вызван какой инструмент, какие параметры использовались, какой результат был возвращен". Эти траектории могут быть извлечены и повторно использованы в последующих диалогах, помогая модели более стабильно воспроизводить модели использования инструмента, уменьшая повторные попытки и ошибки вызова.

## 3. Примеры Использования

Полный список информации о полях API, форматах и т.д. см. в [документации интерфейса Add Message](/api_docs/core/add_message), чтобы узнать, как добавить информацию о вызове инструмента.

### Добавление Информации о Вызове Инструмента

::note{icon="websymbol:chat"}
&nbsp;Сессия A: Пользователь спрашивает в диалоге 【Какова погода в Пекине】, помощник вызывает 【инструмент погоды】, инструмент погоды выдает результат 【Пекин, температура 7°C, облачно】.
::

```python
import os
import requests
import json

# Замените на ваш MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# Сообщения с tool_call
tool_schema = [{
    "name": "get_weather",
    "description": "Get current weather information for a given location",
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City name, e.g. Beijing"
            }
        },
        "required": [
            "location"
        ]
    }
}]

data = {
    "user_id": "memos_user_123",
    "conversation_id": "demo-conv-id",
    "messages": [
        {
            "role": "system",
            "content": f"""You are an assistant that can call tools.
When a user's request can be fulfilled by a tool, you MUST call the appropriate tool.
<tool_schema>
{json.dumps(tool_schema, indent=2, ensure_ascii=False)}
</tool_schema>
"""
        },
        {"role": "user", "content": "What's the weather like in Beijing right now?"},
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_123",
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "arguments": json.dumps({"location": "Beijing"}),
                    },
                }
            ],
        },
        {
            "role": "tool",
            "tool_call_id": "call_123",
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(
                        {"location": "Beijing", "temperature": "7°C", "condition": "Cloudy"}
                    ),
                }
            ],
        },
    ],
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Извлечение Памяти Инструмента

::note{icon="websymbol:chat"}
&nbsp;Сессия B: В новой сессии пользователь спрашивает 【Что надеть в Пекине】, MemOS может вспомнить связанную память о 【вызове инструмента погоды】, модель может использовать память инструмента в дальнейшем, повышая точность и эффективность использования инструмента.
::

```python
import os
import requests
import json

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"


data = {
    "user_id": "memos_user_123",
    "conversation_id": "0928",
    "query": "Что надеть в Пекине",
    "memory_limit_number": 10,
    "include_preference": True,
    "preference_limit_number": 10,
    "include_tool_memory":True,
    "tool_memory_limit_number":10,
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### Результаты Вывода

```python
"tool_memory_detail_list": [
   {
    "id": "7ec50fd8-19ec-42a2-a7c7-ce3cebdb70cf",
    "tool_type": "ToolSchemaMemory",
    "tool_value": {"name": "get_weather", "description": "Get current weather information for a given location", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "City name, e.g. Beijing"}}, "required": ["location"]}},
    "create_time": 1766494806624,
    "conversation_id": "demo-conv-id",
    "status": "activated",
    "update_time": 1766494806625,
    "relativity": 0.44700349055540967
  },
  {
    "id": "4b208707-991a-481c-9dd6-c7f0577ff371",
    "tool_type": "ToolTrajectoryMemory",
    "tool_value": "User asked about the current weather in Beijing -> Tool 'get_weather' was called with the parameter 'location' set to 'Beijing' -> The tool returned the weather information: temperature is 7°C and condition is Cloudy.",
    "tool_used_status": [
      {
        "used_tool": "get_weather",
        "error_type": "",
        "success_rate": 1.0,
        "tool_experience": "Инструмент 'get_weather' требует действительный параметр местоположения и предоставляет текущую информацию о погоде для этого местоположения." #新增：当前轨迹中该工具的经验。
      }
    ],
    "create_time": 1768390489180,
    "conversation_id": "demo-conv-id",
    "status": "activated",
    "update_time": 1768390489181,
    "relativity": 0.47883897395535013,
    "experience": "при выполнении задач по запросу погоды убедитесь, что вызываете инструмент 'get_weather' с правильным параметром местоположения." #新增：整个轨迹的程序性经验，作为指导任务完成的总体经验。
  }
]
```
