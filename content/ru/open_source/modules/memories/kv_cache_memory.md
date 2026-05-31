---
title: "KVCacheMemory: Активная Память"
desc: "`KVCacheMemory` является специализированным модулем памяти в MemOS, предназначенным для хранения и управления KV cache, в основном используемым для ускорения вывода больших языковых моделей (LLMs) и поддержки эффективного повторного использования контекста. В качестве активной памяти он помогает улучшить производительность систем искусственного интеллекта для диалогов и генерации."

## Примеры Использования KV Cache Памяти

В MemOS KV Cache лучше всего подходит для хранения **семантически стабильной и часто повторно используемой фоновой информации**, например:
- Часто задаваемые вопросы (FAQs) или специализированные знания
- Предыдущая история диалогов

Эти стабильные **открытые элементы памяти** автоматически распознаются и управляются модулем `MemScheduler`. Как только они выбраны, они заранее преобразуются в представление в формате KV (`KVCacheItem`). Этот шаг предварительного вычисления хранит активное состояние памяти в формате, пригодном для повторного использования (тензор пар ключ-значение), что позволяет им быть внедренными в кэш внимания модели во время вывода.

Как только преобразование выполнено, эта KV память может **повторно использоваться между запросами**, без необходимости повторного кодирования оригинального содержимого. Это снижает вычислительные затраты на обработку и хранение большого объема текста, что делает его идеальным выбором для приложений, требующих **быстрого времени отклика** и **высокой пропускной способности**.

## Почему KV Cache Память
Интеграция `MemScheduler` с KV Cache памятью может привести к значительной оптимизации производительности, особенно на этапе **предварительного заполнения** вывода LLM.

### Без KV Cache Памяти

- Каждый новый запрос добавляется в полный шаблон подсказки, включая фоновое знание.
- Модель должна **пересчитывать встраивания токенов и внимание** на всей последовательности — даже для неизмененной памяти.

### С KV Cache Памятью

- Фоновое знание **кэшируется один раз** в виде тензора пар ключ-значение.
- Для каждого запроса кодируется только новый ввод пользователя (токен запроса).
- Ранее кэшированные KV напрямую внедряются в механизм внимания.

### Преимущества

Это разделение уменьшает избыточные вычисления на этапе предварительного заполнения, что приводит к:

- Пропуску повторного кодирования фонового знания
- Более быстрому вычислению внимания между токенами запроса и кэшированной памятью
- **Снижению времени до первого токена (Time To First Token, TTFT)** в процессе генерации

Эта оптимизация особенно ценна в следующих аспектах:

- Многораундные взаимодействия с чат-ботами
- Генерация с улучшением поиска или контекстная генерация (RAG, CAG)
- Ассистенты, работающие с фиксированными документами или памятью в стиле FAQ


### Оценка Ускорения KV Cache Памяти

Чтобы проверить влияние инъекции памяти на основе KV на производительность, мы провели серию контрольных экспериментов, имитирующих реальное повторное использование памяти в MemOS.

#### Установка Эксперимента

В типичном использовании модуль `MemScheduler` постоянно отслеживает модели взаимодействия и поднимает высокочастотную, стабильную открытую память до формата KV. Эта KV память загружается в кэш активов GPU и повторно используется в процессе вывода.

Оценка сравнивает две стратегии памяти:

1. **Инъекция на основе подсказки**: Фоновое знание добавляется в виде оригинального текста
2. **Инъекция KV Cache**: Память напрямую внедряется в кэш внимания модели

Мы протестировали эти стратегии:

- **Три длины текста**: Короткий текст, текст средней длины и длинный текст
- **Три типа запросов**: Короткие запросы, средние запросы и длинные запросы

Основным показателем является **время до первого токена (TTFT)**, что является ключевым показателем задержки для реактивной генерации.

#### Результаты Эксперимента

В таблице ниже представлены результаты для трех моделей (Qwen3-8B, Qwen3-32B, Qwen2.5-72B). TTFT при инъекции KV Cache всегда ниже, чем при инъекции на основе подсказки, в то время как выходные токены для обеих стратегий остаются согласованными.

::note{icon="ri:bnb-fill"}
`Build (s)` относится к одноразовым затратам на предварительную обработку памяти в формат KV, распределенным на несколько запросов.
::

| Model       | Ctx    | CtxTok | Qry    | QryTok | Build (s) | KV TTFT (s) | Dir TTFT (s) | Speedup (%) |
| ----------- | ------ | ------ | ------ | ------ | --------- | ----------- | ------------ | ----------- |
| Qwen3-8B    | long   | 6064   | long   | 952.7  | 0.92      | 0.50        | 2.37         | 79.1        |
|             |        |        | medium | 302.7  | 0.93      | 0.19        | 2.16         | 91.1        |
|             |        |        | short  | 167    | 0.93      | 0.12        | 2.04         | 94.2        |
|             | medium | 2773   | long   | 952.7  | 0.41      | 0.43        | 1.22         | 64.6        |
|             |        |        | medium | 302.7  | 0.41      | 0.16        | 1.08         | 85.1        |
|             |        |        | short  | 167    | 0.43      | 0.10        | 0.95         | 89.7        |
|             | short  | 583    | long   | 952.7  | 0.12      | 0.39        | 0.51         | 23.0        |
|             |        |        | medium | 302.7  | 0.12      | 0.14        | 0.32         | 55.6        |
|             |        |        | short  | 167    | 0.12      | 0.08        | 0.29         | 71.3        |
| Qwen3-32B   | long   | 6064   | long   | 952.7  | 0.71      | 0.31        | 1.09         | 71.4        |
|             |        |        | medium | 302.7  | 0.71      | 0.15        | 0.98         | 84.3        |
|             |        |        | short  | 167    | 0.71      | 0.11        | 0.96         | 88.8        |
|             | medium | 2773   | long   | 952.7  | 0.31      | 0.24        | 0.56         | 56.9        |
|             |        |        | medium | 302.7  | 0.31      | 0.12        | 0.47         | 75.1        |
|             |        |        | short  | 167    | 0.31      | 0.08        | 0.44         | 81.2        |
|             | short  | 583    | long   | 952.7  | 0.09      | 0.20        | 0.24         | 18.6        |
|             |        |        | medium | 302.7  | 0.09      | 0.09        | 0.15         | 39.6        |
|             |        |        | short  | 167    | 0.09      | 0.07        | 0.14         | 53.5        |
| Qwen2.5-72B | long   | 6064   | long   | 952.7  | 1.26      | 0.48        | 2.04         | 76.4        |
|             |        |        | medium | 302.7  | 1.26      | 0.23        | 1.82         | 87.2        |
|             |        |        | short  | 167    | 1.27      | 0.15        | 1.79         | 91.4        |
|             | medium | 2773   | long   | 952.7  | 0.58      | 0.39        | 1.05         | 62.7        |
|             |        |        | medium | 302.7  | 0.58      | 0.18        | 0.89         | 79.2        |
|             |        |        | short  | 167    | 0.71      | 0.23        | 0.82         | 71.6        |
|             | short  | 583    | long   | 952.7  | 0.16      | 0.33        | 0.43         | 23.8        |
|             |        |        | medium | 302.7  | 0.16      | 0.15        | 0.27         | 43.2        |
|             |        |        | short  | 167    | 0.16      | 0.10        | 0.25         | 60.5        |


#### Производительность на основе vLLM

MemOS теперь поддерживает управление активной памятью с помощью vLLM. Чтобы оценить влияние предзагрузки различных длин префиксного текста в KV Cache, мы провели тестирование производительности на системе с 8 `H800 80GB GPU (112 vCPU, 1920 GiB памяти)` и на системе с 8 `RTX4090-24G-PCIe (112 vCPU, 960 GiB памяти)`. Оценка охватывала две текущие основные модели: Qwen3-32B и Qwen2.5-72B.

Бенчмаркинг проводился в сочетаниях различных длин памяти и контекста, чтобы смоделировать различные сценарии активной памяти:
- **Длина текстовой памяти (токены)**: 500, 1000, 2000
- **Длина контекстного текста (токены)**: 500, 1000, 2000, 4000

В следующей таблице подведены итоги результатов бенчмаркинга.

**Qwen2.5-72B**
- On 4090（2 Nodes 16 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 1787.21                  | 851.47                | 52.358%          | 935.74      |
| 0.5k    | 1k         | 2506.26                  | 1290.68               | 48.502%          | 1215.58     |
| 0.5k    | 2k         | 3843.48                  | 2897.97               | 24.600%          | 945.51      |
| 0.5k    | 4k         | 6078.01                  | 5200.86               | 14.432%          | 877.15      |
| 1k      | 0.5k       | 2274.61                  | 920.16                | 59.546%          | 1354.45     |
| 1k      | 1k         | 2907.17                  | 1407.65               | 51.580%          | 1499.52     |
| 1k      | 2k         | 4278.53                  | 2916.47               | 31.835%          | 1362.06     |
| 1k      | 4k         | 6897.99                  | 5218.94               | 24.341%          | 1679.05     |
| 2k      | 0.5k       | 3460.12                  | 782.73                | 77.379%          | 2677.39     |
| 2k      | 1k         | 4443.34                  | 1491.24               | 66.439%          | 2952.10     |
| 2k      | 2k         | 5733.14                  | 2758.48               | 51.885%          | 2974.66     |
| 2k      | 4k         | 8152.76                  | 5627.41               | 30.975%          | 2525.35     |


- On H800（4 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 51.65                    | 52.17                 | -1.007%          | -0.52       |
| 0.5k    | 1k         | 55.70                    | 57.03                 | -2.388%          | -1.33       |
| 0.5k    | 2k         | 74.23                    | 78.56                 | -5.833%          | -4.33       |
| 0.5k    | 4k         | 77.56                    | 77.45                 | 0.142%           | 0.11        |
| 1k      | 0.5k       | 55.90                    | 55.73                 | 0.304%           | 0.17        |
| 1k      | 1k         | 55.35                    | 52.89                 | 4.444%           | 2.46        |
| 1k      | 2k         | 80.14                    | 73.82                 | 7.886%           | 6.32        |
| 1k      | 4k         | 82.83                    | 73.51                 | 11.252%          | 9.32        |
| 2k      | 0.5k       | 75.82                    | 71.31                 | 5.948%           | 4.51        |
| 2k      | 1k         | 80.60                    | 78.71                 | 2.345%           | 1.89        |
| 2k      | 2k         | 83.91                    | 78.60                 | 6.328%           | 5.31        |
| 2k      | 4k         | 99.15                    | 80.12                 | 19.193%          | 19.03       |

**Qwen3-32B**

- On 4090（1 Nodes 8 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 288.72                   | 139.29                | 51.756%          | 149.43      |
| 0.5k    | 1k         | 428.72                   | 245.85                | 42.655%          | 182.87      |
| 0.5k    | 2k         | 683.65                   | 538.59                | 21.218%          | 145.06      |
| 0.5k    | 4k         | 1170.48                  | 986.94                | 15.681%          | 183.54      |
| 1k      | 0.5k       | 409.83                   | 137.96                | 66.337%          | 271.87      |
| 1k      | 1k         | 507.95                   | 262.21                | 48.379%          | 245.74      |
| 1k      | 2k         | 743.48                   | 539.71                | 27.408%          | 203.77      |
| 1k      | 4k         | 1325.34                  | 1038.59               | 21.636%          | 286.75      |
| 2k      | 0.5k       | 686.01                   | 147.34                | 78.522%          | 538.67      |
| 2k      | 1k         | 762.96                   | 246.22                | 67.728%          | 516.74      |
| 2k      | 2k         | 1083.93                  | 498.05                | 54.051%          | 585.88      |
| 2k      | 4k         | 1435.39                  | 1053.31               | 26.619%          | 382.08      |


- On H800（2 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 161.18                   | 97.61                 | 39.440%          | 63.57       |
| 0.5k    | 1k         | 164.00                   | 121.39                | 25.982%          | 42.61       |
| 0.5k    | 2k         | 257.34                   | 215.20                | 16.375%          | 42.14       |
| 0.5k    | 4k         | 365.14                   | 317.95                | 12.924%          | 47.19       |
| 1k      | 0.5k       | 169.45                   | 100.52                | 40.679%          | 68.93       |
| 1k      | 1k         | 180.91                   | 128.25                | 29.108%          | 52.66       |
| 1k      | 2k         | 271.69                   | 210.00                | 22.706%          | 61.69       |
| 1k      | 4k         | 389.30                   | 314.64                | 19.178%          | 74.66       |
| 2k      | 0.5k       | 251.43                   | 130.92                | 47.930%          | 120.51      |
| 2k      | 1k         | 275.81                   | 159.60                | 42.134%          | 116.21      |
| 2k      | 2k         | 331.11                   | 218.17                | 34.110%          | 112.94      |
| 2k      | 4k         | 451.06                   | 334.80                | 25.775%          | 116.26      |


Результаты ясно показывают, что интеграция функции повторного использования KV Cache с vLLM принесла революционное улучшение производительности для MemOS.

## Структура памяти KV Cache

Реализовано повторное использование памяти на основе KV с помощью `KVCacheMemory`, что значительно уменьшает размер модели и задержку между типами запросов, сохраняя при этом одинаковый вывод. Перемещая повторно используемую память из открытых подсказок в заранее вычисленный KV Cache, MemOS устраняет избыточное кодирование контекста и обеспечивает более быстрое время отклика, особенно в реальных приложениях LLM с улучшенной памятью.

Каждый кэш хранится как `KVCacheItem`:

| Поле         | Тип           | Описание                                 |
| ------------- | -------------- | ------------------------------------------- |
| `kv_cache_id` | `str`          | Уникальный ID в кэше (UUID)              |
| `kv_cache`    | `DynamicCache` | Фактический KV Cache (transformers)   |
| `metadata`    | `dict`         | Метаданные (источник, время извлечения и т.д.)    |


## API Резюме (`KVCacheMemory`)

### Инициализация
```python
KVCacheMemory(config: KVCacheMemoryConfig)
```

### Основные методы
| Метод                   | Описание                                              |
| ------------------------ | -------------------------------------------------------- |
| `extract(text)`          | Извлечение KV Cache из входного текста с использованием LLM        |
| `add(memories)`          | Добавление одного или нескольких `KVCacheItem` в память                |
| `get(memory_id)`         | Получение одного кэша по ID                               |
| `get_by_ids(ids)`        | Получение нескольких кэшей по IDs                             |
| `get_all()`              | Возвращает все сохраненные кэши                                |
| `get_cache(cache_ids)`   | Объединение и возврат комбинированного кэша из нескольких IDs      |
| `delete(ids)`            | Удаление кэша по IDs                                     |
| `delete_all()`           | Удаление всех кэшей                                        |
| `dump(dir)`              | Сериализация всех кэшей в файлы pickle в директории       |
| `load(dir)`              | Загружает кэш из файла pickle в каталоге              |
| `from_textual_memory(mem)` | Преобразует `TextualMemoryItem` в `KVCacheItem`      |


При вызове `dump(dir)`, система записывает в:

```
<dir>/<config.memory_filename>
```

Этот файл содержит словарь pickle для всех KV Cache, который можно перезагрузить с помощью `load(dir)`.


## Как использовать

### HF KVCache Memory

```python
import json

from transformers import DynamicCache

from memos.configs.memory import MemoryConfigFactory
from memos.memories.activation.item import KVCacheItem
from memos.memories.factory import MemoryFactory


def get_cache_info(cache):
    if not cache:
        return None

    num_layers = 0
    total_size_bytes = 0

    if hasattr(cache, "layers"):
        num_layers = len(cache.layers)
        for layer in cache.layers:
            if hasattr(layer, "key_cache") and layer.key_cache is not None:
                total_size_bytes += layer.key_cache.nelement() * layer.key_cache.element_size()
            if hasattr(layer, "value_cache") and layer.value_cache is not None:
                total_size_bytes += layer.value_cache.nelement() * layer.value_cache.element_size()

            if hasattr(layer, "keys") and layer.keys is not None:
                total_size_bytes += layer.keys.nelement() * layer.keys.element_size()
            if hasattr(layer, "values") and layer.values is not None:
                total_size_bytes += layer.values.nelement() * layer.values.element_size()

    elif hasattr(cache, "key_cache") and hasattr(cache, "value_cache"):
        num_layers = len(cache.key_cache)
        for k, v in zip(cache.key_cache, cache.value_cache, strict=False):
            if k is not None:
                total_size_bytes += k.nelement() * k.element_size()
            if v is not None:
                total_size_bytes += v.nelement() * v.element_size()

    return {
        "num_layers": num_layers,
        "size_bytes": total_size_bytes,
        "size_mb": f"{total_size_bytes / (1024 * 1024):.2f} MB",
    }


def serialize_item(obj):
    if isinstance(obj, list):
        return [serialize_item(x) for x in obj]

    if isinstance(obj, KVCacheItem):
        return {
            "id": obj.id,
            "metadata": obj.metadata,
            "records": obj.records.model_dump()
            if hasattr(obj.records, "model_dump")
            else obj.records,
            "memory": get_cache_info(obj.memory),
        }

    if isinstance(obj, DynamicCache):
        return get_cache_info(obj)

    return str(obj)


if __name__ == "__main__":
    # ===== Пример: Использование фабрики и HFLLM для создания и управления KVCacheMemory =====

    # 1. Создание конфигурации KVCacheMemory (с использованием бэкенда HuggingFace)
    config = MemoryConfigFactory(
        backend="kv_cache",
        config={
            "extractor_llm": {
                "backend": "huggingface",
                "config": {
                    "model_name_or_path": "Qwen/Qwen3-0.6B",  # Используйте действительное имя модели HuggingFace
                    "max_tokens": 32,
                    "add_generation_prompt": True,
                    "remove_think_prefix": True,
                },
            },
        },
    )

    # 2. Использование фабрики для инстанцирования KVCacheMemory
    kv_mem = MemoryFactory.from_config(config)

    # 3. Извлечение KVCacheItem (DynamicCache) из подсказки (внутреннее использование HFLLM.build_kv_cache)
    prompt = [
        {"role": "user", "content": "What is MemOS?"},
        {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
    ]
    print("===== Extract KVCacheItem =====")
    cache_item = kv_mem.extract(prompt)
    print(json.dumps(serialize_item(cache_item), indent=2, default=str))
    print()

    # 4. Добавление извлеченного KVCacheItem
    print("===== Add KVCacheItem =====")
    kv_mem.add([cache_item])
    print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))
    print()

    # 5. Получение по ID
    print("===== Get KVCacheItem by id =====")
    retrieved = kv_mem.get(cache_item.id)
    print(json.dumps(serialize_item(retrieved), indent=2, default=str))
    print()

    # 6. Слияние кэшей (используя два элемента для имитации)
    print("===== Merge DynamicCache =====")
    item2 = kv_mem.extract([{"role": "user", "content": "Tell me a joke."}])
    kv_mem.add([item2])
    merged_cache = kv_mem.get_cache([cache_item.id, item2.id])
    print(json.dumps(serialize_item(merged_cache), indent=2, default=str))
    print()

    # 7. Удаление одного
    print("===== Delete one KVCacheItem =====")
    kv_mem.delete([cache_item.id])
    print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))
    print()

    # 8. Сброс и загрузка
    print("===== Dump and Load KVCacheMemory =====")
    kv_mem.dump("tmp/kv_mem")
    print("Memory dumped to 'tmp/kv_mem'.")
    kv_mem.delete_all()
    kv_mem.load("tmp/kv_mem")
    print(
        "Memory loaded from 'tmp/kv_mem':",
        json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str),
    )
```

### VLLM KVCache Memory

```python
#!/usr/bin/env python3
"""
Демонстрация примера использования VLLMKVCacheMemory с бэкендом vLLM.
Этот пример демонстрирует, как использовать новую совместимую с vLLM память кэша KV.
"""

from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory


def main():
    """Главная функция, демонстрирующая использование VLLMKVCacheMemory."""

    print("=== VLLM KV Cache Memory Example ===\n")

    # 1. Создание VLLMKVCacheMemory Конфигурации (Используя vLLM Бэкенд)
    config = MemoryConfigFactory(
        backend="vllm_kv_cache",  # Используя Новый vLLM KV Cache Бэкенд
        config={
            "extractor_llm": {
                "backend": "vllm",
                "config": {
                    "model_name_or_path": "Qwen/Qwen3-0.6B",
                    "api_base": "http://localhost:8088/v1",
                    "temperature": 0.7,
                    "max_tokens": 1024,
                    "model_schema": "memos.configs.llm.VLLMLLMConfig",
                },
            },
        },
    )

    # 2. Использование Фабрики Для Инстанцирования VLLMKVCacheMemory
    print("Initializing VLLM KV Cache Memory...")
    vllm_kv_mem = MemoryFactory.from_config(config)
    print("✓ VLLM KV Cache Memory initialized successfully.\n")

    # 3. Извлечение VLLMKVCacheItem Из Подсказки
    print("===== Extract VLLMKVCacheItem =====")
    system_prompt = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What is MemOS?"},
        {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
    ]

    try:
        cache_item = vllm_kv_mem.extract(system_prompt)
        print("✓ KV cache item extracted successfully")
        print(f"  ID: {cache_item.id}")
        print(f"  Memory (prompt): {cache_item.memory[:100]}...")
        print(f"  Metadata: {cache_item.metadata}")
        print()
    except Exception as e:
        print(f"✗ Failed to extract KV cache item: {e}")
        return

    # 4. Добавление Извлеченного VLLMKVCacheItem
    print("===== Add VLLMKVCacheItem =====")
    vllm_kv_mem.add([cache_item])
    all_items = vllm_kv_mem.get_all()
    print(f"✓ Added cache item. Total items: {len(all_items)}")
    print()

    # 5. Получение по ID
    print("===== Get VLLMKVCacheItem by id =====")
    retrieved = vllm_kv_mem.get(cache_item.id)
    if retrieved:
        print(f"✓ Retrieved cache item: {retrieved.id}")
        print(f"  Memory (prompt): {retrieved.memory[:100]}...")
    else:
        print("✗ Failed to retrieve cache item")
    print()

    # 6. Получение Кэша (Возвращает Подсказку Строку vLLM)
    print("===== Get Cache (Prompt String) =====")
    prompt_string = vllm_kv_mem.get_cache([cache_item.id])
    if prompt_string:
        print(f"✓ Retrieved prompt string: {prompt_string[:100]}...")
        print("  This prompt can be used for vLLM generation with preloaded KV cache")
    else:
        print("✗ Failed to retrieve prompt string")
    print()

    # 7. Извлечение Другого Кэш-Элемента Для Демонстрации
    print("===== Extract Another VLLMKVCacheItem =====")
    another_prompt = [
        {"role": "system", "content": "You are a coding assistant."},
        {"role": "user", "content": "Write a Python function to calculate fibonacci numbers."},
    ]

    try:
        cache_item2 = vllm_kv_mem.extract(another_prompt)
        vllm_kv_mem.add([cache_item2])
        print(f"✓ Added second cache item. Total items: {len(vllm_kv_mem.get_all())}")
        print()
    except Exception as e:
        print(f"✗ Failed to extract second KV cache item: {e}")
        print()

    # 8. Предварительная Загрузка KV Cache На Сервере vLLM
    print("===== Preload KV Cache on vLLM Server =====")
    try:
        vllm_kv_mem.preload_kv_cache([cache_item.id, cache_item2.id])
        print("✓ KV cache preloaded on vLLM server successfully")
        print("  The server now has the KV cache ready for fast generation")
    except Exception as e:
        print(f"✗ Failed to preload KV cache: {e}")
    print()

    # 9. Удаление Одного Элемента
    print("===== Delete One VLLMKVCacheItem =====")
    vllm_kv_mem.delete([cache_item.id])
    remaining_items = vllm_kv_mem.get_all()
    print(f"✓ Deleted cache item. Remaining items: {len(remaining_items)}")
    print()

    # 10. Дамп И Загрузка
    print("===== Dump and Load VLLMKVCacheMemory =====")
    try:
        vllm_kv_mem.dump("tmp/vllm_kv_mem")
        print("✓ Memory dumped to 'tmp/vllm_kv_mem'")

        # Очистка Памяти И Повторная Загрузка
        vllm_kv_mem.delete_all()
        vllm_kv_mem.load("tmp/vllm_kv_mem")
        reloaded_items = vllm_kv_mem.get_all()
        print(f"✓ Memory loaded from 'tmp/vllm_kv_mem': {len(reloaded_items)} items")
    except Exception as e:
        print(f"✗ Failed to dump/load memory: {e}")
    print()

    print("=== Example completed successfully ===")


if __name__ == "__main__":
    main()
```

## Важные замечания для разработчиков

* Используйте HuggingFace `DynamicCache` для эффективного хранения ключей и значений
* Сериализация на основе pickle для быстрой загрузки/сохранения
* Интеграционные тесты в `/tests` охватывают все методы.
