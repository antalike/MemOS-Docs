---
title: Использование MemOS для построения системы интеллектуального анализа романов
---

### 🆚 Почему выбрать MemOS? Сравнение традиционных методов и MemOS

Перед тем как начать кодирование, давайте посмотрим, какие проблемы решает MemOS:

![Cookbook-Chapter3-Chart](https://statics.memtensor.com.cn/memos/cookbook-chapter3-chart.png)

**Примеры сравнительного эффекта:**

**Пользователь спрашивает: "Как развивались отношения Сяо Фэна и Дуань Юя?"**

| Традиционный Метод                | MemOS Метод               |
| --------------------------- | ----------------------- |
| 🐌 Переискать Связанные Фрагменты В Тексте | ⚡ Прямой Поиск На Уровне Связей     |
| 😵 Возможны Пропуски Ключевых Событий         | 🎯 Полная Хронология Развития Связей |
| 📄 Ответ Только На Основе Часть Текста     | 🧠 Анализ На Основе Полного Образа Персонажа |

### 💡 Почему использовать встроенные компоненты MemOS?

Представьте, что вы хотите приготовить блюдо, вы можете выбрать:

- 🔧 **Сделать все приправы самостоятельно** - требует много времени и усилий, качество трудно гарантировать
- 🏪 **Использовать профессиональные бренды приправ** - экономит время и эффективно, качество стабильно

MemOS как профессиональный "бренд приправ", он уже подготовил для нас:

- 🤖 **Интеллектуальный клиент для диалога** - автоматически решает сетевые проблемы, поддерживает различные AI модели
- 🧠 **Служба векторизации** - специально оптимизированная способность понимания китайского текста
- ⚙️ **Управление конфигурацией** - простая и удобная настройка параметров

**Полученные знания:**
В этой главе вы научитесь, как, как профессиональный разработчик, приоритизировать использование зрелых библиотек компонентов, а не писать сложный низкоуровневый код с нуля.

---

### Введение в главу

Эта глава проведет вас через создание интеллектуальной системы анализа памяти на основе романа "Тяньлунь Ба Бу", реализуя полный процесс преобразования от исходного текста к структурированной памяти.

**Основная архитектура технологии:**

![Cookbook-Chapter3-Core](https://statics.memtensor.com.cn/memos/cookbook-chapter3-core.png)

**Конвейер обработки данных:**

1. **Предобработка текста** → Разделение на главы → **Структурированный ввод**
2. **Извлечение на основе AI** → Моделирование персонажей → **Генерация MemCube**
3. **Преобразование формата** → Построение графовой структуры → **База памяти MemOS**

**Идеология проектирования системы:**

- Эта глава предоставляет полное решение от неструктурированного текста до интеллектуальной системы памяти
- Каждый рецепт решает ключевые технические проблемы в конвейере данных
- Поддержка параллельной обработки и инкрементного обновления больших объемов текста
- Построение запрашиваемой и выводимой интеллектуальной сети памяти

---

### Конфигурация окружения

```python
import requests
import json
import os
import pickle
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
```

## Рецепт 3.0: Предобработка текста и конфигурация окружения API

### 🎯 Цель

Создание основы для структурированной обработки текста романа, включая разделение глав и подключение AI-сервисов.

### 📖 Алгоритм разделения глав

Использование регулярных выражений для распознавания заголовков глав, разделяя длинные романы на обрабатываемые фрагменты:

```python
def extract_all_chapters(text: str, output_dir: str = "chapters"):
    # Найти Все Позиции Заголовков "Глава X"
    pattern = r"(第[一二三四五六七八九十百千零〇两\d]+章)"
    matches = list(re.finditer(pattern, text))

    if not matches:
        raise ValueError("Не Найдено Ни Одного Заголовка Главы")

    os.makedirs(output_dir, exist_ok=True)

    for i in range(len(matches)):
        start_idx = matches[i].start()
        end_idx = matches[i+1].start() if i+1 < len(matches) else len(text)
        chapter_title = matches[i].group()
        chapter_number = i + 1  # Нумерация Натуральными Числами
  
        chapter_text = text[start_idx:end_idx].strip()
        filename = os.path.join(output_dir, f"chapter{chapter_number}.txt")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(chapter_text)
        print(f"✅ Сохранено: {filename}（{chapter_title}）")

# Чтение Целой Книги
with open("天龙八部.txt", "r", encoding="utf-8") as f:
    full_text = f.read()

# Извлечение И Сохранение Всех Глав
extract_all_chapters(full_text)
```

### 🔧 Конфигурация клиента API

Создание стабильного соединения с AI-сервисом, поддерживающего вызовы моделей для различных типов задач:

```python
# Конфигурация Функции Ремонт JSON
try:
    from json_repair import repair_json
    HAS_JSONREPAIR = True
    print("✓ Библиотека jsonrepair Загружена, Функция Ремонта JSON Включена")
except ImportError:
    HAS_JSONREPAIR = False
    print("⚠ Библиотека jsonrepair Не Установлена, Будет Использована Базовая Стратегия Ремонта")
    def repair_json(text):
        return text

class TaskType(Enum):
    EVENT_EXTRACTION = "event_extraction"

class MemOSLLMClient:
    """Клиент для диалога - Используйте MemOS, чтобы сделать вызовы AI простыми и надежными"""
  
    def __init__(self, api_key: str, api_base: str = "https://api.openai.com/v1", model: str = "gpt-4o"):
        # 🔧 Шаг Первый: Импортируйте Умные Компоненты MemOS
        from memos.llms.factory import LLMFactory
        from memos.configs.llm import LLMConfigFactory
  
        # 🎯 Шаг Второй: Скажите MemOS, какую AI Модель мы будем использовать
        llm_config_factory = LLMConfigFactory(
            backend="openai",  # Используйте OpenAI (также поддерживаются другие поставщики)
            config={
                "model_name_or_path": model,  # Выбранная вами AI модель
                "api_key": api_key,          # Ваш API ключ
                "api_base": api_base,        # Адрес API сервиса
                "temperature": 0.8,          # Уровень креативности
                "max_tokens": 8192,          # Максимальная длина ответа
                "top_p": 0.9,               # Контроль качества ответа
            }
        )
  
        # 🚀 Шаг Третий: Позвольте MemOS помочь нам создать клиент для диалога
        # MemOS автоматически обработает сложные проблемы, такие как повторные попытки сети и пул соединений
        self.llm = LLMFactory.from_config(llm_config_factory)
        print(f"✅ Клиент для диалога готов! Используемая модель: {model}")
  
    def call_api(self, messages: List[Dict], task_type: TaskType, timeout: int = 1800) -> Dict:
        """Методы общения с AI - Это так просто!"""
        try:
            response = self.llm.generate(messages)
            return {
                "status": "success",      # Успех!
                "content": response,      # Ответ ИИ
                "model_used": self.llm.config.model_name_or_path  # Какую модель использовали
            }
        except Exception as e:
            # 😅 Если произошла ошибка, MemOS сообщит нам, в чем конкретно проблема
            return {
                "status": "error", 
                "error": str(e),
                "model_used": self.llm.config.model_name_or_path
            }
```

### 🚀 Инициализация пакетной обработки

Создание механизма обхода глав для подготовки к последующей параллельной обработке:

```python
# 🎯 Настройте своего AI помощника (используйте MemOS, чтобы все упростить)
API_KEY = "YOUR_API_KEY"  # 🔑 Введите ваш OpenAI API ключ
API_BASE = "https://api.openai.com/v1"  # 🌐 Адрес API сервиса (обычно не нужно изменять)
MODEL_NAME = "gpt-4o"  # 🤖 Выберите понравившуюся модель AI

# 🚀 Создайте своего персонального AI помощника
api_client = MemOSLLMClient(
    api_key=API_KEY,
    api_base=API_BASE,
    model=MODEL_NAME
)
# Теперь у вас есть умный, стабильный и удобный AI помощник!

memcubes = {}  # Глобальная память о персонажах
alias_to_name = {}  # Отображение псевдонимов на стандартные имена
chapter_folder = "chapters"

# Обработка по порядку глав
chapter_files = sorted(
    [os.path.join(chapter_folder, f) for f in os.listdir(chapter_folder) 
     if f.startswith("chapter") and f.endswith(".txt")],
    key=lambda x: int(re.search(r'chapter(\d+)', x).group(1))
)

for chapter_file in chapter_files:
    chapter_id = chapter_file.replace(".txt", "")
    print(f"\n📖 Обрабатывается: {chapter_id}")
  
    with open(chapter_file, "r", encoding="utf-8") as f:
        content = f.read()
    # Логика последующей обработки...
```

---

## Рецепт 3.1: Автоматическое распознавание персонажей и унификация псевдонимов на основе AI

### 🎯 Цель

Использование AI для автоматического распознавания персонажей в романе, создание сопоставления псевдонимов, и инициализация контейнеров памяти персонажей.

### 🧠 Интеллектуальное распознавание персонажей

Достижение точного извлечения персонажей и объединения псевдонимов с помощью тщательно разработанных подсказок:

```python
@staticmethod
def extract_character_names_prompt(paragraph: str, alias_to_name: dict = None):
    system_msg = (
        "Вы эксперт по распознаванию персонажей в романах, пожалуйста, извлеките всех явно упомянутых персонажей из следующего фрагмента романа.\n"
        "Для каждого персонажа укажите стандартное имя этого персонажа (например, "乔峰") и все обращения, псевдонимы, заменители, которые появляются в этом фрагменте (например, "丐帮帮主", "乔帮主", "那大汉").\n\n"
        "Пожалуйста, верните JSON в следующем формате: \n"
        "[\n"
        "  {\n"
        "    \"name\": \"乔峰\",\n"
        "    \"aliases\": [\"丐帮帮主\", \"乔帮主\", \"那大汉\"]\n"
        "  }\n"
        "]\n\n"
        "⚠️ Внимание: \n"
        "1. Включайте только персонажей, не включая места или организации.\n"
        "2. Разные обращения одного и того же персонажа должны быть объединены в одну запись.\n"
        "3. Все поля должны использовать стандартный формат JSON. Не включайте символы markdown или комментарии.\n"
        "4. Если невозможно определить, является ли данное обращение новым персонажем, можно временно оставить его как отдельный элемент."
    )

    if alias_to_name:
        system_msg += "\n\nВот известные псевдонимы и соответствующие стандартные имена персонажей, пожалуйста, постарайтесь отнести новые распознанные обращения к уже существующим персонажам: \n"
        alias_map_str = json.dumps(alias_to_name, ensure_ascii=False, indent=2)
        system_msg += alias_map_str

    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": f"Фрагмент романа следующий: \n{paragraph}"}
    ]
```

### 💾 Инициализация MemCube и управление псевдонимами

Создание структурированных контейнеров памяти для каждого распознанного персонажа:

```python
def init_memcube(character_name: str, chunk_id: str):
    """Инициализация памяти персонажа MemCube - включает все основные поля"""
    return {
        "name": character_name,
        "first_appearance": chunk_id,
        "aliases": [character_name],
        "events": [],
        "utterances": [],
        "speech_style": "",
        "personality_traits": [],
        "emotion_state": "",
        "relations": []
    }

# Выполнение распознавания персонажей и инициализация
name_prompt = Prompt.extract_character_names_prompt(content, alias_to_name)
name_result = api_client.call_api(name_prompt, TaskType.EVENT_EXTRACTION, timeout=1800)

try:
    extracted = json.loads(name_result.get("content", "").strip("```json").strip("```").strip())
except:
    extracted = []

# Обновление базы данных персонажей и отображение псевдонимов
for item in extracted:
    std_name = item["name"]
    aliases = item.get("aliases", [])
  
    # Инициализация или обновление MemCube
    if std_name not in memcubes:
        print(f"🆕 Новый Персонаж Распознавания：{std_name}")
        memcubes[std_name] = init_memcube(std_name, chapter_id)
        memcubes[std_name]["aliases"] = []

    # Объединить Список Псевдонимов
    all_aliases = list(set(memcubes[std_name].get("aliases", []) + aliases))
    memcubes[std_name]["aliases"] = all_aliases

    # Построить Глобальную Карта Псевдонимов
    for alias in [std_name] + aliases:
        alias_to_name[alias] = std_name
```

---

## Рецепт 3.2: Извлечение структурированного содержания памяти

### 🎯 Цель

Использование AI для извлечения структурированной информации о персонажах из текста романа, включая события, цитаты, характер, эмоции и сеть отношений.

### 🎭 Подсказка для многомерного извлечения информации

Проектирование точных шаблонов подсказок, чтобы гарантировать, что AI возвращает стандартизированные данные в формате JSON:

```python
@staticmethod
def update_character_prompt(character_name: str, unfinished_events: list, paragraph: str):
    return [
        {
            "role": "system",
            "content": (
                "Вы являетесь экспертом по моделированию персонажей романов и будете анализировать незавершенные события определенного персонажа и последние фрагменты романа.\n"
                "Ваша задача — обновить следующие поля：\n"
                "- events：Список Событий（обновить статус, добавить новые события, включая подполе event_id、action、motivation、impact、involved_entities、time、location、event、if_completed）\n"
                "- Каждое событие должно содержать уникальный \"event_id\", например \"event_001\", \"event_002\" и т.д.\n"
                "- utterances：Сказанные Слова（включая время или номер события）\n"
                "- speech_style：Стиль Речи（например, Классический, Прямой, Ироничный и т.д.）\n"
                "- personality_traits：Черты Личности（например, Спокойный, Импульсивный）\n"
                "- emotion_state：Текущее Эмоциональное Состояние\n"
                "- relations：Список Отношений с Другими\n\n"
                "Пожалуйста, обратите особое внимание на следующие требования：\n"
                "1. Пожалуйста, внимательно оцените, завершены ли существующие незавершенные события в новом фрагменте.\n"
                "2. Если у какого-либо события есть завершение или результат, обязательно отметьте его поле `if_completed` как true.\n"
                "3. Если в фрагменте романа появляются новые события, связанные с этим персонажем, пожалуйста, добавьте новую запись о событии.\n"
                "В конечном итоге, пожалуйста, выведите следующую структуру JSON: \n"
                "{\n"
                "  \"events\": [...],\n"
                "  \"utterances\": [...],\n"
                "  \"speech_style\": \"...\",\n"
                "  \"personality_traits\": [...],\n"
                "  \"emotion_state\": \"...\",\n"
                "  \"relations\": [...]\n"
                "}\n\n"
                "⚠️ Пожалуйста, обратите внимание: \n"
                "1. Все имена полей должны быть заключены в двойные кавычки (стандартный формат JSON).\n"
                "2. Не добавляйте символы комментариев, дополнительные пояснения или символы markdown.\n"
                "3. Возвращайте только полный объект JSON, не массив и не другой формат.\n"
                "4. Если нет содержимого для заполнения, используйте пустой массив [] или пустую строку \"\".\n"
            )
        },
        {
            "role": "user",
            "content": (
                f"Имя персонажа: {character_name}\n"
                f"Текущие незавершенные события следующие (JSON):\n{json.dumps(unfinished_events, ensure_ascii=False, indent=2)}\n\n"
                f"Фрагмент романа следующий: \n{paragraph}\n\n"
                "Пожалуйста, верните обновленную информацию о персонаже в указанном формате."
            )
        }
    ]
```

### 🔄 Алгоритм интеллектуального объединения данных

Реализация отслеживания состояния событий и механизма инкрементного обновления:

```python
def get_unfinished_events(memcube: dict):
    """Получить список незавершенных событий - для контекстной непрерывности"""
    return [event for event in memcube.get("events", []) if not event.get("if_completed", False)]

def merge_events(old_events: list, new_events: list):
    """Интеллектуальное объединение событий - обработка обновлений состояния и новых событий"""
    event_dict = {e["event_id"]: e for e in old_events}

    for new_event in new_events:
        eid = new_event["event_id"]
        if eid in event_dict:
            # Стратегия объединения: новые поля имеют приоритет, сохраняем историческую информацию
            merged = event_dict[eid].copy()
            for key, value in new_event.items():
                if value not in [None, "", []]:
                    merged[key] = value
            event_dict[eid] = merged
        else:
            event_dict[eid] = new_event  # Новое событие добавляется напрямую

    return list(event_dict.values())

def merge_unique_list(old: list, new: list):
    """Список Удаления Дубликатов - Сохранение Исходного Порядка"""
    combined = old + new
    seen = set()
    result = []
    for item in combined:
        if isinstance(item, dict):
            key = json.dumps(item, sort_keys=True, ensure_ascii=False)
        else:
            key = str(item)
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result
```

### ⚡ Двигатель параллельной обработки

Использование пула потоков для эффективного пакетного обновления персонажей:

```python
# Параллельное Обновление Всех Статусов Персонажей
with ThreadPoolExecutor(max_workers=8) as executor:
    futures = {
        executor.submit(update_memcube_for_character, name, memcube, content, chapter_id): name
        for name, memcube in memcubes.items()
    }

    for future in as_completed(futures):
        name = futures[future]
        try:
            name, updated, error = future.result()
            if error or not updated:
                print(f"⚠️ Обновление Неудачно: {name} в {chapter_id} -> {error}")
                continue

            # Умное Объединение Результатов Обновления
            memcube = memcubes[name]
            memcube["events"] = merge_events(memcube["events"], updated.get("events", []))
            memcube["utterances"].extend(updated.get("utterances", []))
            if updated.get("speech_style"):
                memcube["speech_style"] = updated["speech_style"]
            memcube["personality_traits"] = merge_unique_list(
                memcube["personality_traits"], updated.get("personality_traits", [])
            )
            if updated.get("emotion_state"):
                memcube["emotion_state"] = updated["emotion_state"]
            memcube["relations"].extend(updated.get("relations", []))

        except Exception as e:
            print(f"⚠️ Исключение Параллельного Выполнения: {name} -> {e}")
```

---

## Рецепт 3.3: Интеллектуальная система вывода на основе памяти

### 🎯 Цель

Реализация продвинутых функций, таких как вывод сюжета, оценка разумности и анализ эмоций на основе построенного MemCube.

### 🔮 Двигатель вывода сюжета

Использование полной информации о памяти персонажей для прогнозирования развития истории:

```python
@staticmethod
def speculate_event_outcome(character_name: str, memcube: dict, user_input: str):
    """На Основе Памяти Персонажей - Генерация Наративов В Стиле Романа"""
    return [
        {
            "role": "system",
            "content": (
                "Вы Эксперт По Генерации Сценариев Романов.\n"
                "Вы Получите Полную JSON Информацию О Всех Персонажах (Включая Цепочки Событий, Характер, Эмоции, Отношения И Т.Д.) И Гипотетический Сюжет, Предложенный Пользователем.\n"
                "Ваша Задача - На Основе Фона Персонажей, Невыполненных Событий, Сетей Отношений, Характера И Мотивации, Обоснованно Предсказать Возможное Развитие Сюжета.\n"
                "Пожалуйста, Сгенерируйте Полный Наратив В Стиле Романа (Не Список, Не JSON), Описывающий Как Развивается История.\n"
                "Обратите Внимание, Что Языковой Стиль Должен Соответствовать Исходному Роману (Например, Классический Ушу Стиль)."
            )
        },
        {
            "role": "user",
            "content": (
                f"Имя Персонажа: {character_name}\n\n"
                f"Информация О Персонаже Ниже (Формат JSON):\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"Гипотетический Сюжет Пользователя Ниже: \n{user_input}\n\n"
                "Пожалуйста, На Основе Вышеуказанной Информации Предскажите Развитие Сюжета, Верните Наратив В Романном Стиле, Не Включая Никакого Объяснительного Языка Или JSON."
            )
        }
    ]

@staticmethod
def evaluate_plot_reasonableness(character_name: str, memcube: dict, user_input: str):
    """Анализ Обоснованности Сюжета - На Основе Логического Оценивания Персонажей"""
    return [
        {
            "role": "system",
            "content": (
                "Вы являетесь экспертом по анализу обоснованности поведения персонажей романа.\n"
                "Вы получите полную информацию о всех персонажах в формате JSON (включая цепочки событий, характер, эмоции, отношения и т.д.) и гипотетический сюжет, предложенный пользователем.\n"
                "Ваша задача: \n"
                "1. Оценить, соответствует ли данный сюжет логике поведения данного персонажа, его характеристикам, эмоциональному состоянию и текущему контексту.\n"
                "2. Если не соответствует, укажите конкретные несоответствия и объясните причины.\n"
                "3. Если соответствует, объясните его обоснованность и кратко опишите, как этот сюжет логично разворачивается.\n\n"
                "Формат ответа: \n"
                "- Оценка обоснованности: Обоснованно / Необоснованно / Условно обоснованно\n"
                "- Объяснение анализа: Подробное объяснение, соответствует ли это мотивации персонажа, отношениям и контексту\n"
                "- Рекомендации: При необходимости предложите изменения или более обоснованные альтернативные выражения\n\n"
                "Пожалуйста, отвечайте кратко на китайском языке, не генерируйте текст романа или структуру JSON."
            )
        },
        {
            "role": "user",
            "content": (
                f"Имя Персонажа: {character_name}\n\n"
                f"Полная информация о всех персонажах представлена ниже (формат JSON):\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"Гипотетический сюжет, предложенный пользователем, выглядит следующим образом: \n{user_input}\n\n"
                "Пожалуйста, оцените, соответствует ли этот сюжет текущему состоянию и логике данного персонажа, и объясните причины."
            )
        }
    ]
```

### 🎭 Многомерная аналитическая структура

Предоставление профессиональных аналитических инструментов, таких как отслеживание эмоций, прогресс конфликтов, оценка позиций и т.д.:

```python
@staticmethod
def emotion_trajectory_prompt(character_name: str, memcube: dict, user_input: str):
    """Анализ Эмоциональной Траектории - Прогноз Изменения Эмоций Персонажа"""
    return [
        {
            "role": "system",
            "content": (
                "Ты - эксперт по анализу эмоциональной траектории персонажей.\n"
                "Ты получишь полную информацию о персонаже (включая события, характер, эмоции, отношения и т.д.) и предполагаемый пользователем сюжет.\n"
                "Пожалуйста, оцени, произойдут ли изменения в эмоциях персонажа в данном сюжете.\n\n"
                "Ваша задача: \n"
                "1. Определи, содержит ли предполагаемый сюжет изменения эмоций.\n"
                "2. Если да, укажи тип эмоции и объясни, как это изменение было вызвано.\n"
                "3. Если нет, объясни, почему эмоции остаются стабильными.\n\n"
                "Формат ответа: \n"
                "- Изменение эмоций: есть / нет\n"
                "- Текущие эмоции: xxx\n"
                "- Причина изменения: xxx\n"
                "Пожалуйста, отвечай кратко на китайском языке."
            )
        },
        {
            "role": "user",
            "content": (
                f"Имя Персонажа: {character_name}\n\n"
                f"Полная информация о персонаже следующая (JSON):\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"Предполагаемый пользователем сюжет следующий: \n{user_input}"
            )
        }
    ]

@staticmethod
def conflict_progression_prompt(character_name: str, memcube: dict, user_input: str):
    """Анализ Эволюции Конфликта - Отслеживание Развития Противоречий Между Персонажами"""
    return [
        {
            "role": "system",
            "content": (
                "Ты - эксперт по анализу эволюции противоречий между персонажами.\n"
                "Вы получите полную информацию о персонаже (в формате JSON) и предложенный пользователем сюжет.\n"
                "Пожалуйста, определите, включает ли этот сюжет развитие конфликта с другими.\n\n"
                "Ваша задача: \n"
                "1. Определите, включает ли предложенный сюжет существующие или потенциальные объекты конфликта.\n"
                "2. Если да, пожалуйста, определите, изменились ли эти отношения (например, обострились, смягчились или разрешились).\n"
                "3. Кратко опишите причины изменения конфликта.\n\n"
                "Формат ответа: \n"
                "- Противник: xxx\n"
                "- Текущая стадия: xxx (например: потенциальный → обострение → смягчение → разрешение)\n"
                "- Причина изменения: xxx\n"
                "Пожалуйста, отвечай кратко на китайском языке."
            )
        },
        {
            "role": "user",
            "content": (
                f"Имя Персонажа: {character_name}\n\n"
                f"Полная информация о персонаже следующая (JSON):\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"Предполагаемый пользователем сюжет следующий: \n{user_input}"
            )
        }
    ]
```

### 💡 Примеры Практического Применения

```python
# Загрузка уже построенной базы данных персонажей
with open("memcubes1.json", "r", encoding="utf-8") as f:
    memcubes = json.load(f)

character_name = "段誉"
user_input = "Что произойдет, если段誉 не появится на турнире в剑湖宫?"

# Выполнение сюжетной симуляции
prompt = Prompt.speculate_event_outcome(character_name, memcubes[character_name], user_input)
response = api_client.call_api(prompt, TaskType.EVENT_EXTRACTION)
print(response.get("content", "❌ Нет ответа"))
```

---

## Рецепт 3.4: Оптимизация Конфигурации Модели Embedding

### 🔄 Переключение Модели Embedding для Поиска Текстов на Китайском Языке

**Объяснение Причин Переключения:**

Исходный код использует модель nomic-embed для векторизации текста, но эта модель в основном оптимизирована для английского текста и имеет следующие проблемы при обработке китайских романов:

1. **Ограниченные возможности понимания китайской семантики**: модель nomic-embed-text в основном обучена на английском корпусе, что делает её слабой в понимании семантики китайского языка и захвате текстовых отношений
2. **Недостаточная точность поиска**: при поиске персонажей, событий и отношений в китайских романах, таких как «Тяньлунь Бадэ», вычисление семантической схожести недостаточно точно
3. **Отсутствие культурного контекста**: не может хорошо понимать специфические контексты, такие как боевые искусства, история и культура в китайских литературных произведениях

**Рекомендуемая Замена:**

Согласно [Mem0 официальной документации](https://docs.mem0.ai/components/embedders/models/openai) и [оценке моделей встраивания на китайском языке](https://github.com/wangyuxinwhy/uniem), рекомендуется следующая конфигурация:

#### Вариант 1: OpenAI Embedding (Рекомендуется)

```python
config = {
    "embedder": {
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-large",  # Поддерживает несколько языков, отличный результат на китайском
            "embedding_dims": 3072,
            "api_key": "YOUR_OPENAI_API_KEY"
        }
    }
}
```

**Преимущества:**

- Поддержка двуязычного поиска, выдающиеся результаты в задачах поиска текстов на китайском языке
- Более высокая размерность векторов (3072), более богатое семантическое представление
- Хорошие результаты в оценке MTEB-zh

#### Вариант 2: Модель M3E (Открытая Альтернатива)

```python
config = {
    "embedder": {
        "provider": "huggingface",  
        "config": {
            "model": "moka-ai/m3e-base",  # Открытая модель, оптимизированная для китайского языка
            "embedding_dims": 768
        }
    }
}
```

**Преимущества:**

- Специально обучена для китайского языка, превосходит OpenAI ada-002 в задачах классификации и поиска текстов на китайском языке
- Поддержка гетерогенного поиска текстов, подходит для поиска отношений между персонажами и событий
- Полностью открытый исходный код, без затрат на вызовы API

#### Вариант 3: Локальное Развертывание

```python
config = {
    "embedder": {
        "provider": "ollama",
        "config": {
            "model": "moka-ai/m3e-base",
            "ollama_base_url": "http://localhost:11434"
        }
    }
}
```

**Данные Сравнения Производительности:**

Согласно [MTEB-zh评测](https://github.com/wangyuxinwhy/uniem) результатам:

| Модель                          | Точность Классификации Китайского Текста | Китайский Поиск ndcg@10 | Преимущество       |
| ----------------------------- | ------------------ | ---------------- | ---------- |
| nomic-embed                   | Не Тестировалось             | Не Тестировалось           | Оптимизация Для Английского   |
| OpenAI text-embedding-3-large | 0.6231             | 0.7786+          | Поддержка Многоязычности |
| M3E-base                      | 0.6157             | 0.8004           | Специализация На Китайском   |

---

## Рецепт 3.5: Преобразователь Структуры Memory Графа

### 🎯 Цель

Преобразовать данные MemCube в формат узлов Memory, совместимый с MemOS, для построения запрашиваемой базы знаний.

### 🏗️ Генерация Узлов Memory

Преобразовать события и отношения персонажей в стандартизированные объекты Memory:

```python
def create_memory_node(content: str, entities: list, key: str, memory_type: str = "fact") -> dict:
    """Создание Стандартизированного Узла Памяти"""
    node_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
  
    # Симуляция встраивания (в реальном применении следует использовать настоящие сервисы встраивания)
    embedding = [0.1] * 768  # Пример Размерности
  
    return {
        "id": node_id,
        "memory": content,
        "metadata": {
            "user_id": "",
            "session_id": "",
            "status": "activated",
            "type": "fact",
            "confidence": 0.99,
            "entities": entities,
            "tags": ["событие"] if "событие" in key else ["отношение"],
            "updated_at": now,
            "memory_type": memory_type,
            "key": key,
            "sources": [],
            "embedding": embedding,
            "created_at": now,
            "usage": [],
            "background": ""
        }
    }
```

### 🔄 Пакетная Обработка Преобразования

Реализовать эффективный конвейер преобразования от MemCube к Memory:

```python
INPUT_FILE = "memcube_all.json"
OUTPUT_FILE = "memory_graph.json"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    memcube_data = json.load(f)

nodes = []
edges = []

for character, data in memcube_data.items():
    previous_event_id = None

    # === Преобразование Последовательности Событий ===
    for event in data.get("events", []):
        memory_text = f"{character} в {event.get('time')} в {event.get('location')}，потому что {event.get('motivation')}，выполнил {event.get('action')}，результат: {event.get('impact')}。"
        entities = [character] + event.get("involved_entities", [])
        node = create_memory_node(
            content=memory_text,
            entities=entities,
            key=f"Событие {character}: {event.get('action')}"
        )
        nodes.append(node)

        # Установление Хронологической Связи Событий
        if previous_event_id:
            edges.append({
                "source": previous_event_id,
                "target": node["id"],
                "type": "FOLLOWS"
            })
        previous_event_id = node["id"]

    # === Агрегация Сетей Отношений ===
    relations_texts = []
    seen = set()
    for relation in data.get("relations", []):
        name = relation.get("name") or relation.get("人物") or relation.get("character")
        relation_text = relation.get("relation") or relation.get("relationship") or relation.get("отношение")
        if not name or not relation_text:
            continue
        dedup_key = (str(name), str(relation_text))
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        relations_texts.append(f"С{name} является {relation_text}")

    if relations_texts:
        memory_text = f"{character}" + "，".join(relations_texts) + "。"
        entities = [character] 
        node = create_memory_node(
            content=memory_text,
            entities=entities,
            key=f"Сводка отношений {character}",
        )
        nodes.append(node)

# Сохранить результаты преобразования
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump({
        "nodes": nodes,
        "edges": edges
    }, f, ensure_ascii=False, indent=2)

print(f"✅ Преобразование завершено, всего сгенерировано {len(nodes)} узлов памяти, {len(edges)} ребер")
print(f"📁 Выходной файл: {OUTPUT_FILE}")
```

---

## Рецепт 3.5: Интеграция MemOS и Проверка Запросов

### 🎯 Цель

Интегрировать преобразованные данные Memory в систему MemOS для реализации семантического интеллектуального поиска.

### 🔗 Коннектор MemOS

Установить стабильное соединение с сервисом MemOS:

```python
import memos
from memos.configs.embedder import EmbedderConfigFactory
from memos.configs.memory import TreeTextMemoryConfig
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.embedders.factory import EmbedderFactory
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory
from memos.configs.mem_os import MOSConfig

# Загрузить MemOS конфигурацию
config = TreeTextMemoryConfig.from_json_file("/root/Test/memos_config.json")
tree_memory = TreeTextMemory(config)

# Загрузить данные памяти
tree_memory.load("/root/Test")

# Выполнить семантический поиск
results = tree_memory.search("段誉初遇神仙姐姐", top_k=5)

for result in results:
    relativity = result.metadata.relativity if hasattr(result.metadata, 'relativity') else 0.0
    print(f"Степень сходства: {relativity:.3f}")
    print(f"Содержимое: {result.memory}")
    print("---")
```

### 🔍 Проверка Интеллектуального Поиска

Проверить производительность системы через многомерные запросы:

```python
# Тестирование запросов нескольких типов
test_queries = [
    "段誉初遇神仙姐姐",
    "乔峰的身世之谜",
    "Приключения Сюй Чжу"
    "Вражда Динь Чуньцю и У Яцзы"
]

for query in test_queries:
    print(f"\n🔍 Запрос: {query}")
    results = tree_memory.search(query, top_k=3)
  
    for i, result in enumerate(results, 1):
        relativity = result.metadata.relativity if hasattr(result.metadata, 'relativity') else 0.0
        print(f"  {i}.  Степень Соответствия: {relativity:.3f}")
        print(f"     Содержимое: {result.memory[:100]}...")
```

---

## 🎯 Креативные Расширения на Основе MemOS

Поздравляем! Вы уже освоили основные технологии MemOS. Теперь давайте посмотрим, какие захватывающие приложения можно создать:

### 🕰️ Идея 1: Интеллектуальная Система Хронологии Мира

Создание динамической хронологии мира боевых искусств на основе MemOS, позволяя ИИ понимать причинно-следственные связи событий:

```python
# Пример: Умное Управление Временной Линией
timeline_memory = {
    "1094 год": {
        "события": ["Разгадка Тайны Происхождения Сяо Фэна", "Битва в Юй Сянь Чжуан"],
        "последствия": ["Сотрясение Рынка", "Раскол Братства"],
        "затронутые_персонажи": ["Сяо Фэн", "А Чжу", "Дуан Чжэнчунь"]
    },
    "1095 год": {
        "события": ["Истина Инцидента у Врат Ганмэнь", "Смерть А Чжу"],
        "последствия": ["Изменение Духовного Состояния Сяо Фэна", "Напряженные Отношения между Сун и Ляо"]
    }
}

# ИИ может ответить: Что произойдет, если Сяо Фэн не пойдет к Вратам Ганмэнь?
```

### 🧠 Идея 2: Динамический Фон Рабочей Памяти

Использование функции рабочей памяти MemCube для обновления фона мира в реальном времени по мере развития сюжета:

```python
# Пример: Управление Динамическим Состоянием Мира
from memos.memories.textual.base import TextualMemoryItem

# Создание Элемента Памяти Мирового Состояния
world_state_memories = [
    TextualMemoryItem(
        memory="Степень политической напряженности между Сун и Ляо достигла 0.8, частые пограничные конфликты",
        metadata={"type": "world_state", "category": "politics"}
    ),
    TextualMemoryItem(
        memory="Текущие легендарные боевые искусства в мире: Цзюянь Шэньгун, Ицзин Цзин",
        metadata={"type": "world_state", "category": "martial_arts"}
    ),
    TextualMemoryItem(
        memory="Шаолинь и Удань сохраняют нейтралитет, внутри Братства Бедняков происходят расколы",
        metadata={"type": "world_state", "category": "sect_relations"}
    )
]

# Использование Управления Памятью Текста MemCube для Мирового Состояния
mem_cube.text_mem.replace_working_memory(world_state_memories)

# Автоматическое обновление рабочей памяти, когда Сяо Фэн принимает важные решения
current_working_memory = mem_cube.text_mem.get_working_memory()
```

### 🎮 Идея 3: Интерактивная Текстовая Игра на Основе MemOS

**Конечная Идея**: Создание поистине интеллектуальной одиночной текстовой приключенческой игры на основе MemOS + MemCube + GPT-4o!

```python
# Пример Основной Архитектуры Игры
class WuxiaTextGame:
    def __init__(self, mos_config):
        from memos.mem_os.main import MOS
        
        self.world_memory = MOS(mos_config)  # Система Памяти Мира
        self.character_cubes = {}            # MemCube для каждого NPC
        self.timeline_memories = []          # Список Воспоминаний Временной Линии
        
        # Создание Основного Пользователя Игры
        self.world_memory.create_user("game_master")
      
    def start_adventure(self, player_choice):
        """
        Выбор Игрока: 
        - Персонаж: Сяо Фэн/Дуань Юй/Сюй Чжу/Созданный Персонаж
        - Временной Пункт: Детство/Юность/Средний Возраст
        - Место: Центральная Равнина/Дали/Ляо
        """
        return f"Добро пожаловать в {player_choice.location}..."
  
    def process_action(self, player_input):
        """
        Обработка естественного языка игрока:
        "Я хочу пойти в Шаолинь учиться боевым искусствам"
        "Я хочу стать братом с Сяо Фэнем"
        "Я хочу остановить резню у Яньмэньгуань"
        """
                # 1. Понять намерения игрока (используя функции LLM MemOS)
        intent_analysis = self.world_memory.chat(
            query=f"Анализировать намерения игрока: {player_input}",
            user_id="game_master"
        )
        
        # 2. Извлечь соответствующую память
        context = self.world_memory.search(
            query=player_input, 
            user_id="game_master"
        )
      
                # 3. Рассчитать последствия действий (на основе извлеченного контекста)
        consequences = self.predict_consequences(player_input, context)
        
        # 4. Обновить состояние мира (добавить новую память)
        self.update_world_state(player_input, consequences)
        
        # 5. Сгенерировать развитие сюжета
        return self.generate_story(player_input, context, consequences)
    
    def predict_consequences(self, player_input, context):
        """Предсказать последствия действий игрока"""
        query = f"На основе следующего контекста: {context}, предсказать возможные последствия действия игрока '{player_input}'"
        result = self.world_memory.chat(
            query=query,
            user_id="game_master"
        )
        return result
    
    def update_world_state(self, player_input, consequences):
        """Обновить состояние мира в памяти MemOS"""
        memory_content = f"Действие игрока: {player_input}, Последствия: {consequences}"
        self.world_memory.add(
            memory_content=memory_content,
            user_id="game_master"
        )
    
    def generate_story(self, player_input, context, consequences):
        """Генерация Развития Истории"""
        query = f"На основе фона {context} и последствий {consequences}, сгенерировать интересное развитие истории для действия игрока '{player_input}'"
                 return self.world_memory.chat(
             query=query,
             user_id="game_master"
         )

# Полный Пример Использования
def create_wuxia_game():
    """Создание Полного Примера Ролевой Игры В Стиле Уся"""
    from memos.configs.mem_os import MOSConfig
    
    # Создание Конфигурации MemOS
    mos_config = MOSConfig(
        user_id="game_system",
        chat_model={
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o",
                "api_key": "YOUR_API_KEY",
                "api_base": "https://api.openai.com/v1"
            }
        },
        mem_reader={
            "backend": "simple_struct",
            "config": {
                "llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-4o",
                        "api_key": "YOUR_API_KEY",
                        "api_base": "https://api.openai.com/v1"
                    }
                }
            }
        },
        enable_textual_memory=True
    )
    
    # Создание Экземпляра Игры
    game = WuxiaTextGame(mos_config)
    
    # Пример Диалога
    response = game.process_action("Я хочу найти Сяо Фэна в гостинице Лояна")
    print(response)
    
    return game
```

**Примеры Игрового Процесса:**

```
Игрок: Я юный новичок, хочу навестить Сяо Фэна
ИИ:  В то время Сяо Фэн расследовал тайну своего происхождения в районе Лояна, и вы случайно встретили его в гостинице...
      Сяо Фэн, увидев вас молодым, спросил: "Младший брат, почему ты еще бродишь на улице так поздно?"

Игрок: Я сказал ему, что хочу изучить боевые искусства и прошу его взять меня в ученики
ИИ:  Сяо Фэн громко засмеялся: "Моя собственная судьба - это сплошная загадка, как я могу быть учителем?
      Но раз уж мы встретились, это судьба, я могу научить тебя несколько приемов для самозащиты..."
      [Ваш Уровень Боевых Искусств +1, Отношение Со Сяо Фэном +5]

Игрок: Я хочу рассказать Сяо Фэну правду о его происхождении
ИИ: Это опасный выбор! Раннее раскрытие происхождения может изменить весь ход истории...
Вы уверены, что хотите это сделать? Это откроет совершенно новую сюжетную ветвь.
```

### 🌟 Ваше Воображение — Это Граница!

На основе MemOS вы можете создать:

- 📚 **Интеллектуальный Генератор Романов** - ИИ автоматически создает на основе ваших установок
- 🎭 **Виртуальные Персонажи Компаньоны** - Ведите реальные диалоги с Сяо Фэнем, Дуань Юем
- 🎨 **Интерактивное Создание Сюжета** - Динамически генерируемый мир истории
- 🎯 **Образовательная Игровая Платформа** - Учитесь истории и литературе в игре
- 🔮 **Прогностическое Развлечение** - ИИ предсказывает, как ваши выборы повлияют на сюжет

**Ключевое Внимание:** MemOS дает ИИ настоящую "память", позволяя:

- 🧠 Запоминать все исторические события и отношения между персонажами
- 🔄 Динамически обновлять состояние мира в зависимости от действий игрока
- 🎯 Генерировать логически последовательное развитие сюжета
- 🌟 Создавать бесконечные возможности для ветвления истории

---

## 🎮 Испытайте Прямо Сейчас: Демонстрация Интерактивной Текстовой Игры

Хотите лично испытать текстовую игру, созданную на основе MemOS? Мы предоставили полный демонстрационный проект, показывающий, как применить технологии, представленные в этой главе, к реальному интерактивному текстовому генератору.

### 📦 Особенности Демонстрации

- **🎯 На Основе "Тяньлунь Ба Бу"**: Используйте тот же контент романа, обработанный в этой главе, в качестве базы знаний
- **🔍 Умное Определение Намерений**: Автоматически определяет тип операции, которую хочет выполнить пользователь
- **💬 Разнообразные Режимы Взаимодействия**: Поддержка продолжения истории, анализа персонажей, гипотетических сюжетов, диалогов персонажей и т.д.
- **🧠 Управление MemOS**: Демонстрация реального поиска MemCube и генерации контекста

### 🚀 Попробуйте Прямо Сейчас

**👉 [MemCube Interactive Text Game Demo - Hugging Face](https://huggingface.co/datasets/MemCube/interactive-text-game-demo)**

Этот демонстрационный проект включает в себя:
- ✅ **Полный Исходный Код**: Демонстрация реального использования различных компонентов MemOS
- ✅ **Руководство по Запуску**: Пошаговое руководство по развертыванию и запуску
- ✅ **Техническое Описание**: Подробное объяснение принципов реализации и проектирования
- ✅ **Настраиваемый**: Можно заменить на ваш собственный текстовый контент

Работая с этим демо, вы глубже поймете, как технологии MemOS, представленные в этой главе, работают в реальных приложениях!

**Теперь освободите свою креативность и создайте свой умный мир с MemOS!** 🚀
