---
title: Linux API Версия
desc: MemCube является核心组件ом MemOS, он как "чип памяти" из Cyberpunk 2077, который позволяет агенту загружать различные "пакеты памяти" для получения различных знаний и способностей. В этой главе мы поможем вам освоить основные операции MemCube с помощью трех прогрессивных рецептов.<br/>Обратите внимание, что система MemOS делится на два уровня: уровень ОС и уровень Cube, здесь мы сначала представляем более базовый уровень Cube. Многие операции ниже, такие как добавление и поиск, также доступны на уровне ОС, различие в том, что ОС управляет несколькими Cube и может выполнять общие поиски и операции по нескольким Cube, в то время как Cube отвечает только за собственную запись и запросы.
---

### Рецепт 1.1: Установка и настройка вашей среды разработки MemOS (API Версия)

**🎯 Сценарий проблемы:** Вы разработчик AI приложений, хотите попробовать самый новый и популярный MemOS, но не знаете, как настроить среду MemOS.

**🔧 Решение:** С помощью этого рецепта вы научитесь, как с нуля создать полную среду MemOS.

#### Шаг 1: Проверьте системные требования

```bash
# Проверка версии Python (требуется 3.10+) 
python --version

# 💡 Если версия ниже 3.10, пожалуйста, обновите Python
```

#### Шаг 2: Установите MemOS

**Вариант A: Установка в производственной среде (рекомендуется)**

```bash
# 🎯 Быстрая установка, подходит для производственного использования
pip install MemoryOS chonkie qdrant_client markitdown
```

**Вариант B: Установка в среде разработки (подходит для участников)**

```bash
# 🎯 Клонирование исходного кода и установка среды разработки
git clone https://github.com/MemTensor/MemOS.git
cd MemOS

# 🎯 Установка с помощью make (автоматически обработает зависимости и виртуальную среду)
make install

# 🎯 Активировать виртуальную среду Poetry
poetry shell
# Или используйте: poetry run python your_script.py
```

#### Шаг 3: Настройка переменных окружения OpenAI API

Создайте файл `.env`:

```bash
# .env
# 🎯 Конфигурация OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1

# 🎯 Специфическая конфигурация MemOS
MOS_TEXT_MEM_TYPE=general_text
MOS_USER_ID=default_user
MOS_TOP_K=5
```

#### Шаг 4: Проверьте установку и полную среду

Создайте файл проверки `test_memos_setup_api_mode.py`:

```python
# test_memos_setup_api_mode.py
# 🎯 Скрипт проверки режима API - использование OpenAI API и MOS.simple()
import os
import sys
from dotenv import load_dotenv

def check_openai_environment():
    """🎯 Проверка конфигурации переменных окружения OpenAI"""
    print("🔍 Проверка конфигурации переменных окружения OpenAI...")
    
    # Загрузка файла .env
    load_dotenv()
    
    # Проверка конфигурации OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    
    print(f"📋 Статус переменных окружения OpenAI:")
    
    if openai_key:
        masked_key = openai_key[:8] + "..." + openai_key[-4:] if len(openai_key) > 12 else "***"
        print(f"  ✅ OPENAI_API_KEY: {masked_key}")
        print(f"  ✅ OPENAI_API_BASE: {openai_base}")
        return True
    else:
print(f"  ❌ OPENAI_API_KEY: не настроен")
        print(f"  ❌ OPENAI_API_BASE: {openai_base}")
        return False

def check_memos_installation():
"""🎯 Проверка состояния установки MemOS"""
print("\n🔍 Проверка состояния установки MemOS...")
    
    try:
        import memos
print(f"✅ Версия MemOS: {memos.__version__}")
        
# Тестирование импорта основных компонентов
        from memos.mem_cube.general import GeneralMemCube
        from memos.mem_os.main import MOS
        from memos.configs.mem_os import MOSConfig
        
print("✅ Импорт основных компонентов прошел успешно")
        return True
        
    except ImportError as e:
print(f"❌ Ошибка импорта: {e}")
        return False
    except Exception as e:
print(f"❌ Другие ошибки: {e}")
        return False

def test_api_functionality():
"""🎯 Тестирование функциональности режима API"""
print("\n🔍 Тестирование функциональности режима API...")
    
    try:
        from memos.mem_os.main import MOS
        
# Используйте метод MOS.simple() по умолчанию
print("🚀 Создание экземпляра MOS (используя MOS.simple())...")
        memory = MOS.simple()
        
print("✅ MOS.simple() успешно создано!")
print(f"  📊 用户ID: {memory.user_id}")
print(f"  📊 Идентификатор сессии: {memory.session_id}")
        
        # Тестирование Добавления Памяти
        print("\n🧠 Тестирование Добавления Памяти...")
        memory.add(memory_content="Это Тестовая Память В Режиме API")
        print("✅ Память Успешно Добавлена!")
        
        # Тестирование Чат-Функции
        print("\n💬 Тестирование Чат-Функции...")
        response = memory.chat("Что я только что добавил в память?")
        print(f"✅ Ответ Чата: {response}")
        
        # Тестирование Поисковой Функции
        print("\n🔍 Тестирование Поисковой Функции...")
        search_results = memory.search("Тестовая Память", top_k=3)
        if search_results and search_results.get("text_mem"):
            print(f"✅ Поиск Успешен, Найдено {len(search_results['text_mem'])} Результатов")
        else:
            print("⚠️ Поиск Не Вернул Результатов")
        
        print("✅ Тестирование Функции Режима API Успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Тестирование Функции Режима API Провалено: {e}")
print("💡 Подсказка: проверьте ключ API OpenAI и сетевое соединение.")
        return False

def main():
"""🎯 Основной процесс верификации режима API"""
print("🚀 Начало проверки среды API MemOS...\n")
    
# Шаг 1: Проверьте переменные окружения OpenAI
    env_ok = check_openai_environment()
    
# Шаг 2: Проверьте состояние установки
    install_ok = check_memos_installation()
    
# Шаг 3: Тестирование функции
    if env_ok and install_ok:
        func_ok = test_api_functionality()
    else:
        func_ok = False
        if not env_ok:
print("\n⚠️ 由于 конфигурация переменных окружения OpenAI неполная, пропускаем тестирование функций")
        elif not install_ok:
print("\n⚠️  Из-за неудачной установки MemOS пропускается функциональное тестирование")
    
# Резюме
    print("\n" + "="*50)
print("📊 Результаты проверки режима API:")
print(f"  OpenAI переменные окружения: {'✅ 通过' if env_ok else '❌ 失败'}")
print(f"  Установка MemOS: {'✅ Успешно' if install_ok else '❌ Не удалось'}")
print(f"  Функциональное тестирование: {'✅ Пройдено' if func_ok else '❌ Провалено'}")
    
    if env_ok and install_ok and func_ok:
print(f"\n🎉 Поздравляем! MemOS API模式环境配置完全成功！")
print(f"💡 Теперь вы можете начать использовать режим API MemOS.")
    elif install_ok and env_ok:
        print(f"\n⚠️ MemOS установлен, OpenAI настроен, но тестирование функций не удалось.")
        print(f"💡 Пожалуйста, проверьте, действителен ли ключ API OpenAI и нормально ли работает сетевое соединение.")
    elif install_ok:
        print("\n⚠️ MemOS установлен, но необходимо настроить переменные окружения OpenAI для нормальной работы.")
        print("💡 Пожалуйста, настройте OPENAI_API_KEY в файле .env.")
    else:
        print("\n❌ Проблемы с конфигурацией окружения, пожалуйста, проверьте вышеуказанную информацию об ошибках.")
    
    return bool(env_ok and install_ok and func_ok)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
```

Запустите проверку режима API:

```bash
python test_memos_setup_api_mode.py
```

#### Часто задаваемые вопросы и решения

**Q1: Что делать, если установка на macOS не удалась?**

```bash
# 🔧 macOS может потребовать дополнительной настройки
export SYSTEM_VERSION_COMPAT=1
pip install MemoryOS
```

**Q2: Как решить конфликты зависимостей?**

```bash
# 🔧 Используйте виртуальное окружение для изоляции
python -m venv memos_env
source memos_env/bin/activate  # Linux/macOS
# или memos_env\Scripts\activate  # Windows
pip install MemoryOS
```

### Рецепт 1.2: Построение простого MemCube из документа (API Версия)

**🎯 Сценарий проблемы:** У вас есть PDF-документ, содержащий корпоративную базу знаний, и вы хотите создать "чип памяти", который может отвечать на соответствующие вопросы.

**🔧 Решение:** С помощью этого рецепта вы научитесь, как использовать MemReader для преобразования документа в MemCube, который можно искать. MemReader является核心组件ом MemOS, который может интеллектуально анализировать документы и извлекать структурированную память.

#### Шаг 1: Подготовьте пример документа

Создайте пример документа знаний `company_handbook.txt`:

```text
# Руководство для сотрудников компании

## Рабочее Время
Стандартное рабочее время компании с понедельника по пятницу, с 9:00 до 18:00.
Гибкий график позволяет сотрудникам начинать работу с 8:00 до 10:00.

## Политика Отпуска
- Годовой отпуск: 15 дней оплачиваемого годового отпуска
- Больничный: 7 дней оплачиваемого больничного в год
- Личный Отпуск: 3 Дня Личного Отпуска В Год

## Льготы И Преимущества
Компания Предоставляет Полный Пакет Социальных Гарантий, Включая:
- Пенсионное Страхование
- Медицинское Страхование
- Страхование От Безработицы
- Страхование От Производственных Несчастий
- Страхование По Беременности
- Жилищный Сбережительный Фонд

Дополнительные Преимущества Включают Годовой Медицинский Осмотр, Командные Мероприятия И Обучающие Дотации.

## Офисное Оборудование
Каждый Сотрудник Получит:
- Один Ноутбук
- Один Монитор
- Эргономичное Кресло
- Офисный Стол

## Контактная Информация
HR Отдел: hr@company.com
IT Поддержка: it@company.com
Финансовый Отдел: finance@company.com
```

#### Шаг 2: Используйте MemReader для создания MemCube

```python
# create_memcube_with_memreader_api.py
# 🎯 Полный Процесс Создания MemCube С Использованием MemReader (Версия API)
import os
import uuid
from dotenv import load_dotenv
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_reader import MemReaderConfigFactory
from memos.mem_reader.factory import MemReaderFactory

def create_memcube_with_memreader():
    """
    🎯 Полный Процесс Создания MemCube С Использованием MemReader (Версия API)
    """
    
    print("🔧 Создание Конфигурации MemCube...")
    
    # Загрузка Переменных Среды
    load_dotenv()
    
    # Получение Конфигурации OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    
    if not openai_key:
        raise ValueError("❌ OPENAI_API_KEY Не Настроен. Пожалуйста, Настройте Ключ API OpenAI В Файле .env.")
    
    print("✅ Обнаружен Режим API OpenAI")
    
    # Получение Конфигурации MemOS
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # Конфигурация Режима OpenAI
    cube_config = {
        "user_id": user_id,
        "cube_id": f"{user_id}_company_handbook_cube",
        "text_mem": {
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-4o-mini",
                        "temperature": 0.8,
                        "max_tokens": 8192,
                        "top_p": 0.9,
                        "top_k": 50,
                        "api_key": openai_key,
                        "api_base": openai_base
                    }
                },
                "embedder": {
                    "backend": "universal_api",
                    "config": {
                        "provider": "openai",
                        "api_key": openai_key,
                        "model_name_or_path": "text-embedding-ada-002",
                        "base_url": openai_base
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_company_handbook",
                        "vector_dimension": 1536,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        "act_mem": {"backend": "uninitialized"},
        "para_mem": {"backend": "uninitialized"}
    }
    
    # Создание Экземпляра MemCube
    config_obj = GeneralMemCubeConfig.model_validate(cube_config)
    mem_cube = GeneralMemCube(config_obj)
    
    print("✅ MemCube создан успешно!")
    print(f"  📊 Пользовательский ID: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 Текстовый память бэкенд: {mem_cube.config.text_mem.backend}")
    print(f"  🔍 Модель встраивания: text-embedding-ada-002 (OpenAI)")
    print(f"  🎯 Конфигурационный режим: OPENAI API")
    
    return mem_cube

def create_memreader_config():
    """
    🎯 Создание конфигурации MemReader
    """
    
    # Загрузка Переменных Среды
    load_dotenv()
    
    # Получение Конфигурации OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    
    # Конфигурация MemReader
    mem_reader_config = MemReaderConfigFactory(
        backend="simple_struct",
        config={
            "llm": {
                "backend": "openai",
                "config": {
                    "model_name_or_path": "gpt-4o-mini",
                    "temperature": 0.8,
                    "max_tokens": 8192,
                    "top_p": 0.9,
                    "top_k": 50,
                    "api_key": openai_key,
                    "api_base": openai_base
                }
            },
            "embedder": {
                "backend": "universal_api",
                "config": {
                    "provider": "openai",
                    "api_key": openai_key,
                    "model_name_or_path": "text-embedding-ada-002",
                    "base_url": openai_base
                }
            },
            "chunker": {
                "backend": "sentence",
                "config": {
                    "chunk_size": 64,
                    "chunk_overlap": 20,
                    "min_sentences_per_chunk": 1
                }
            },
            "remove_prompt_example": False
        }
    )
    
    return mem_reader_config

def load_document_to_memcube(mem_cube, doc_path):
    """
    🎯 Использование MemReader для загрузки документов в MemCube
    """
    
    print(f"\n📖 Использование MemReader для чтения документа: {doc_path}")
    
    # Создание MemReader
    mem_reader_config = create_memreader_config()
    mem_reader = MemReaderFactory.from_config(mem_reader_config)
    
    # Подготовка данных документа
    print("📄 Подготовка данных документа...")
    documents = [doc_path]  # MemReader ожидает список путей к документам
    
    # Использование MemReader для обработки документов
    print("🧠 Использование MemReader для извлечения памяти...")
    memories = mem_reader.get_memory(
        documents,
        type="doc",
        info={
            "user_id": mem_cube.config.user_id, 
            "session_id": str(uuid.uuid4())
        }
    )
    
    print(f"📚 MemReader сгенерировал {len(memories)} фрагментов памяти")
    
    # Добавить память в MemCube
    print("💾 Добавление памяти в MemCube...")
    for mem in memories:
        mem_cube.text_mem.add(mem)
    
    print(f"✅ Успешно добавлено {len(memories)} фрагментов памяти в MemCube")
    
    # Вывод основных данных
    print("\n📊 Основная информация о MemCube:")
    print(f"  📁 Источник документа: {doc_path}")
    print(f"  📝 Количество фрагментов памяти: {len(memories)}")
    print(f"  🏷️ Тип документа: company_handbook")
    print(f"  💾 Векторная база данных: Qdrant (режим памяти, освобождение памяти приводит к удалению)")
    print(f"  🔍 Модель встраивания: text-embedding-ada-002 (OpenAI)")
    print(f"  🎯 Конфигурационный режим: OPENAI API")
    print(f"  🧠 Извлекатель памяти: MemReader (simple_struct)")
    
    return mem_cube

if __name__ == "__main__":
    print("🚀 Начинаем использовать MemReader для создания документа MemCube (API версия)...")
    
    # Создать MemCube
    mem_cube = create_memcube_with_memreader()
    
    # Загрузить документ
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
    
    print("\n🎉 MemCube создан успешно!") 
```

#### Запустите пример

```bash
# Шаг 2: Создание MemCube
python create_memcube_with_memreader_api.py
```

#### Шаг 3: Проверьте функции поиска и диалога

> В текущей версии MemOS, при отключенном Scheduler, запуск chat может вызвать некоторые проблемы, необходимо вручную закомментировать один фрагмент кода, следуя приведенным ниже шагам, чтобы все последующие примеры кода работали нормально. В следующих версиях мы исправим эту проблему.
> ctrl+левый клик на функции chat() ниже, затем нажмите super.chat() для перехода в core.py, или в каталоге установки среды найдите lib/python3.12/site-packages/memos/mem_os/core.py и выполните поиск по def chat, чтобы найти соответствующую функцию
> Закомментируйте блок кода выше return в конце функции:

```
# submit message to scheduler
# for accessible_mem_cube in accessible_cubes:
#     mem_cube_id = accessible_mem_cube.cube_id
#     mem_cube = self.mem_cubes[mem_cube_id]
#     if self.enable_mem_scheduler and self.mem_scheduler is not None:
#         message_item = ScheduleMessageItem(
#             user_id=target_user_id,
#             mem_cube_id=mem_cube_id,
#             mem_cube=mem_cube,
#             label=ANSWER_LABEL,
#             content=response,
#             timestamp=datetime.now(),
#         )
#         self.mem_scheduler.submit_messages(messages=[message_item])
```


```python
# test_memcube_search_and_chat_api.py
# 🎯 Тестирование функций поиска и диалога MemCube (API-версия)
import os
from dotenv import load_dotenv
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS

def create_mos_config():
    """
🎯 Создание конфигурации MOS (версия API)
    """
    load_dotenv()
    
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    
    if not openai_key:
        raise ValueError("❌ OPENAI_API_KEY Не Настроен. Пожалуйста, Настройте Ключ API OpenAI В Файле .env.")
    
    # Конфигурация Режима OpenAI
    return MOSConfig(
        user_id=user_id,
        chat_model={
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-3.5-turbo",
                "api_key": openai_key,
                "api_base": openai_base,
                "temperature": 0.1,
                "max_tokens": 1024,
            }
        },
        mem_reader={
            "backend": "simple_struct",
            "config": {
                "llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-3.5-turbo",
                        "api_key": openai_key,
                        "api_base": openai_base,
                    }
                },
                "embedder": {
                    "backend": "universal_api",
                    "config": {
                        "provider": "openai",
                        "api_key": openai_key,
                        "model_name_or_path": "text-embedding-ada-002",
                        "base_url": openai_base,
                    }
                },
                "chunker": {
                    "backend": "sentence",
                    "config": {
                        "tokenizer_or_token_counter": "gpt2",
                        "chunk_size": 512,
                        "chunk_overlap": 128,
                        "min_sentences_per_chunk": 1,
                    }
                }
            }
        },
        enable_textual_memory=True,
        top_k=top_k
    )

def test_memcube_search_and_chat():
    """
🎯 Тестирование функций поиска и диалога MemCube (версия API)
    """
    
print("🚀 Начинаем тестирование функций поиска и диалога MemCube (API версия)...")
    
# Импортируйте функции шага 2
    from create_memcube_with_memreader_api import create_memcube_with_memreader, load_document_to_memcube
    
# Создание MemCube и загрузка документов
print("\n1️⃣ Создание MemCube и загрузка документов...")
    mem_cube = create_memcube_with_memreader()
    # Загрузить документ
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
    
# Создание конфигурации MOS
print("\n2️⃣ Создание конфигурации MOS...")
    mos_config = create_mos_config()
    
# Создание экземпляра MOS и регистрация MemCube
print("3️⃣ Создание экземпляра MOS и регистрация MemCube...")
    mos = MOS(mos_config)
    mos.register_mem_cube(mem_cube, mem_cube_id="handbook")
    
print("✅ Создание экземпляра MOS прошло успешно!")
print(f"  📊 用户ID: {mos.user_id}")
print(f"  📊 Идентификатор сессии: {mos.session_id}")
    print(f"  📊 Зарегистрированные MemCube: {list(mos.mem_cubes.keys())}")
    print(f"  🎯 Конфигурационный режим: OPENAI API")
    print(f"  🤖 Модель Чата: gpt-3.5-turbo (OpenAI)")
    print(f"  🔍 Модель встраивания: text-embedding-ada-002 (OpenAI)")
    
    # Тестирование Функции Поиска
    print("\n🔍 Тестирование Функции Поиска...")
    test_queries = [
        "Какое рабочее время компании?",
        "Сколько дней ежегодного отпуска?",
        "Какие льготы и компенсации?",
        "Как связаться с HR-отделом?"
    ]
    
    for query in test_queries:
        print(f"\n❓ Запрос: {query}")
        
        # Использование MOS для Поиска
        search_results = mos.search(query, top_k=2)
        
        if search_results and search_results.get("text_mem"):
            print(f"📋 Найдено {len(search_results['text_mem'])} связанных результатов:")
            for cube_result in search_results['text_mem']:
                cube_id = cube_result['cube_id']
                memories = cube_result['memories']
                print(f"  📦 MemCube: {cube_id}")
                for i, memory in enumerate(memories[:2], 1):  # Показывать только первые 2 результата
                    print(f"    {i}. {memory.memory[:100]}...")
        else:
            print("😓 Не найдено связанных результатов")
    
    # Тестирование Функции Диалога
    print("\n💬 Тестирование Функции Диалога...")
    chat_questions = [
        "Каково расписание работы компании?"
        "Какие льготы могут получать сотрудники?"
        "Как связаться с IT-поддержкой?"
    ]
    
    for question in chat_questions:
        print(f"\n👤 Вопрос: {question}")
        
        try:
            response = mos.chat(question)
            print(f"🤖 Ответ: {response}")
        except Exception as e:
            print(f"❌ Ошибка диалога: {e}")
    
    print("\n🎉 Тест завершен!")
    return mos

if __name__ == "__main__":
    test_memcube_search_and_chat() 
```

#### Запустите пример

```bash
# Шаг 3: Тестирование поиска и диалога
python test_memcube_search_and_chat_api.py
```

### Рецепт 1.3: Основные операции MemCube: создание, добавление памяти, сохранение, чтение, запрос, удаление (API Версия)

**🎯 Сценарий проблемы:** Вы уже создали несколько MemCube: корпоративные правила, кадровые вопросы, корпоративная база знаний..., вам нужно научиться эффективно управлять полным жизненным циклом: создание, добавление памяти, сохранение на диск, загрузка с диска, запрос в памяти (базовый запрос и продвинутый запрос метаданных), а также очистка ненужных MemCube (удаление из памяти и удаление файлов).

**🔧 Решение:** Освойте управление полным жизненным циклом MemCube, включая интеллектуальную настройку, базовые запросы, продвинутые операции с метаданными и детализированное управление памятью и файлами.

#### Шаг 1: Управление полным жизненным циклом MemCube

```python
 # memcube_lifecycle_api.py
# 🎯 MemCube Управление Жизненным Циклом: Создание, Увеличение Памяти, Сохранение, Чтение, Запрос, Удаление (API версия)
import os
import shutil
import time
from pathlib import Path
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig

class MemCubeManager:
    """
    🎯 Менеджер Жизненного Цикла MemCube (API версия)
    """
  
    def __init__(self, storage_root="./memcube_storage"):
        self.storage_root = Path(storage_root)
        self.storage_root.mkdir(exist_ok=True)
        self.loaded_cubes = {}  # Кэш MemCube в памяти
    
    def create_empty_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 Создать пустой MemCube (без примеров данных)
        """
        
        # Загрузить переменные окружения
        load_dotenv()
        
        # Получить конфигурацию OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        
        if not openai_key:
            raise ValueError("❌ OPENAI_API_KEY не настроен. Пожалуйста, настройте ключ API OpenAI в файле .env.")
        
        # Получить Конфигурацию MemOS
        user_id = os.getenv("MOS_USER_ID", "demo_user")
        
        # Конфигурация Режима OpenAI
        cube_config = {
            "user_id": user_id,
            "cube_id": cube_id,
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "extractor_llm": {
                        "backend": "openai",
                        "config": {
                            "model_name_or_path": "gpt-4o-mini",
                            "temperature": 0.8,
                            "max_tokens": 8192,
                            "top_p": 0.9,
                            "top_k": 50,
                            "api_key": openai_key,
                            "api_base": openai_base
                        }
                    },
                    "embedder": {
                        "backend": "universal_api",
                        "config": {
                            "provider": "openai",
                            "api_key": openai_key,
                            "model_name_or_path": "text-embedding-ada-002",
                            "base_url": openai_base
                        }
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": f"collection_{cube_id}_{int(time.time())}",
                            "vector_dimension": 1536,
                            "distance_metric": "cosine"
                        }
                    }
                }
            },
            "act_mem": {"backend": "uninitialized"},
            "para_mem": {"backend": "uninitialized"}
        }
        
        config_obj = GeneralMemCubeConfig.model_validate(cube_config)
        mem_cube = GeneralMemCube(config_obj)
        
        print(f"✅ Создать Пустой MemCube: {cube_id}")
        return mem_cube
  
    def save_memcube(self, mem_cube: GeneralMemCube, cube_id: str) -> str:
        """
        🎯 Сохранить MemCube На Диск
        """
    
        save_path = self.storage_root / cube_id
    
        print(f"💾 Сохранить MemCube В: {save_path}")
    
        try:
            # ⚠️ Если Директория Существует, Сначала Очистить
            if save_path.exists():
                shutil.rmtree(save_path)
        
            # Сохранить MemCube
            mem_cube.dump(str(save_path))
        
            print(f"✅ MemCube '{cube_id}' Успешно Сохранен")
            return str(save_path)
        
        except Exception as e:
            print(f"❌ Ошибка Сохранения: {e}")
            raise
  
    def load_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 Загрузить MemCube С Диска
        """
    
        load_path = self.storage_root / cube_id
    
        if not load_path.exists():
            raise FileNotFoundError(f"MemCube '{cube_id}' Не Существует В {load_path}")
    
        print(f"📂 Загрузить MemCube С Диска: {load_path}")
    
        try:
            # Загрузить MemCube Из Директории
            mem_cube = GeneralMemCube.init_from_dir(str(load_path))
        
            # Кэшировать В Памяти
            self.loaded_cubes[cube_id] = mem_cube
        
            print(f"✅ MemCube '{cube_id}' Успешно Загружен")
            return mem_cube
        
        except Exception as e:
            print(f"❌ Ошибка загрузки: {e}")
            raise
  
    def list_saved_memcubes(self) -> list:
        """
        🎯 Перечислить все сохраненные MemCube
        """
    
        saved_cubes = []
    
        for item in self.storage_root.iterdir():
            if item.is_dir():
                # Проверить, является ли это действительным каталогом MemCube
                readme_path = item / "README.md"
                if readme_path.exists():
                    saved_cubes.append({
                        "cube_id": item.name,
                        "path": str(item),
                        "size": self._get_dir_size(item)
                    })
    
        return saved_cubes
    
    def unload_memcube(self, cube_id: str) -> bool:
        """
        🎯 Удалить MemCube из памяти (не удаляя файл)
        """
        
        if cube_id in self.loaded_cubes:
            del self.loaded_cubes[cube_id]
            print(f"♻️ MemCube '{cube_id}' был удален из памяти")
            return True
        else:
            print(f"⚠️ MemCube '{cube_id}' не в памяти")
            return False
    
    def delete_memcube(self, cube_id: str) -> bool:
        """
        🎯 Удалить локальные файлы MemCube
        """
        
        delete_path = self.storage_root / cube_id
        
        if not delete_path.exists():
            print(f"⚠️ MemCube '{cube_id}' не существует в {delete_path}")
            return False
        
        print(f"🗑️ Удаление файла MemCube: {delete_path}")
        
        try:
            # Удалить каталог
            shutil.rmtree(delete_path)
            
            # Удалить из кэша памяти (если все еще в памяти)
            if cube_id in self.loaded_cubes:
                del self.loaded_cubes[cube_id]
            
            print(f"✅ Файл MemCube '{cube_id}' успешно удален")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка удаления: {e}")
            return False
  
    def _get_dir_size(self, path: Path) -> str:
        """Вычислить размер каталога"""
        total_size = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
        return f"{total_size / 1024:.1f} KB"

def add_memories_to_cube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Добавить память к MemCube
    """
    
    print(f"🧠 Добавление памяти к {cube_name}...")
    
    # Добавить несколько примеров памяти (с богатыми метаданными)
    memories = [
        {"memory": f"Ажэнь влюбилась в Ацян", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"Ажэнь ростом 1 метр 5 сантиметров", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}},
        {"memory": f"Ажэнь - ассасин", "metadata": {"type": "fact", "source": "web", "confidence": 0.7}},
        {"memory": f"Ацян - программист", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"Ацян любит писать код", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}}
    ]
    
    mem_cube.text_mem.add(memories)
    
    print(f"✅ Успешно добавлено {len(memories)} записей памяти в {cube_name}")
    
    # Показать текущее количество памяти
    all_memories = mem_cube.text_mem.get_all()
    print(f"📊 Текущее общее количество памяти в {cube_name}: {len(all_memories)}")

def basic_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Базовый запрос MemCube
    """
  
    print(f"🔍 Базовый запрос к {cube_name}:")
  
    # Получить все записи памяти
    all_memories = mem_cube.text_mem.get_all()
    print(f"  📊 Общее количество памяти: {len(all_memories)}")
  
    # Поиск конкретного содержимого
    search_results = mem_cube.text_mem.search("爱情", top_k=1)
    print(f"  🎯 Результаты поиска '爱情': {len(search_results)}条")
  
    for i, result in enumerate(search_results, 1):
        print(f"    {i}. {result.memory}")

def advanced_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Расширенный Запрос MemCube (Операции с Метаданными)
    """
  
    print(f"🔬 Расширенный Запрос {cube_name}:")
  
    # Получить все записи памяти
    all_memories = mem_cube.text_mem.get_all()
    
    # 1. Показать Полную Структуру TextualMemoryItem
    print("  📋 Полная Структура Первой Памяти:")
    first_memory = all_memories[0]
    print(f"    {first_memory}")
    print(f"    ID: {first_memory.id}")
    print(f"    Содержимое: {first_memory.memory}")
    print(f"    Метаданные: {first_memory.metadata}")
    print(f"    Тип: {first_memory.metadata.type}")
    print(f"    Источник: {first_memory.metadata.source}")
    print(f"    Уверенность: {first_memory.metadata.confidence}")
    print()
    
    # 2. Фильтрация Метаданных
    print("  🔍 Фильтрация Метаданных:")
    
    # Фильтрация Памяти с Высокой Уверенностью
    high_confidence = [m for m in all_memories if m.metadata.confidence and m.metadata.confidence >= 0.9]
    print(f"    Память с Высокой Уверенностью (>=0.9): {len(high_confidence)}条")
    for i, memory in enumerate(high_confidence, 1):
        print(f"      {i}. {memory.memory} (Достоверность: {memory.metadata.confidence})")
    
    # Фильтрация памяти из определенных источников
    conversation_memories = [m for m in all_memories if m.metadata.source == "conversation"]
    print(f"    Память из диалога: {len(conversation_memories)} записей")
    for i, memory in enumerate(conversation_memories, 1):
        print(f"      {i}. {memory.memory} (Источник: {memory.metadata.source})")
    
    # Фильтрация памяти из файловых источников
    file_memories = [m for m in all_memories if m.metadata.source == "file"]
    print(f"    Память из файлов: {len(file_memories)} записей")
    for i, memory in enumerate(file_memories, 1):
        print(f"      {i}. {memory.memory} (Источник: {memory.metadata.source})")
    
    # 3. Комбинированная фильтрация
    print("  🔍 Комбинированная фильтрация:")
    high_conf_file = [m for m in all_memories 
                     if m.metadata.source == "file" and m.metadata.confidence and m.metadata.confidence >= 0.8]
    print(f"    Память из файлов с высокой достоверностью: {len(high_conf_file)} записей")
    for i, memory in enumerate(high_conf_file, 1):
        print(f"      {i}. {memory.memory} (Источник: {memory.metadata.source}, Достоверность: {memory.metadata.confidence})")
    
    # 4. Статистическая информация
    print("  📊 Статистическая информация:")
    sources = {}
    confidences = []
    
    for memory in all_memories:
        # Статистика источников
        source = memory.metadata.source
        sources[source] = sources.get(source, 0) + 1
        
        # Сбор достоверности
        if memory.metadata.confidence:
            confidences.append(memory.metadata.confidence)
    
    print(f"    Распределение источников: {sources}")
    if confidences:
        avg_confidence = sum(confidences) / len(confidences)
        print(f"    Средняя Уверенность: {avg_confidence:.2f}")

# 🎯 Демонстрация Полного Управления Жизненным Циклом
def demonstrate_lifecycle():
    """
    Демонстрация MemCube Полного Жизненного Цикла (API-версия)
    """
  
    manager = MemCubeManager()
  
    print("🚀 Начало Демонстрации Жизненного Цикла MemCube (API-версия)...\n")
  
    # Шаг 1: Создание MemCube
    print("1️⃣ Создание MemCube")
    cube1 = manager.create_empty_memcube("demo_cube_1")
  
    # Шаг 2: Добавление Памяти
    print("\n2️⃣ Добавление Памяти")
    add_memories_to_cube(cube1, "demo_cube_1")
  
    # Шаг 3: Сохранение на Диск
    print("\n3️⃣ Сохранение MemCube на Диск")
    manager.save_memcube(cube1, "demo_cube_1")
  
    # Шаг 4: Перечисление Сохраненных MemCube
    print("\n4️⃣ Перечисление Сохраненных MemCube")
    saved_cubes = manager.list_saved_memcubes()
    for cube_info in saved_cubes:
        print(f"  📦 {cube_info['cube_id']} - {cube_info['size']}")
  
    # Шаг 5: Чтение с Диска
    print("\n5️⃣ Чтение MemCube с Диска")
    del cube1  # 💡 Удаление Ссылки в Памяти
  
    reloaded_cube = manager.load_memcube("demo_cube_1")
  
    # Шаг 6: Базовый Запрос
    print("\n6️⃣ Базовый Запрос")
    basic_query_memcube(reloaded_cube, "перезагруженный_demo_cube_1")
    
    # Шаг 7: Продвинутый Запрос (Операции с Метаданными)
    print("\n7️⃣ Продвинутый Запрос (Операции с Метаданными)")
    advanced_query_memcube(reloaded_cube, "перезагруженный_demo_cube_1")
  
    # Шаг 8: Удаление MemCube из Памяти
    print("\n8️⃣ Удаление MemCube из Памяти")
    manager.unload_memcube("demo_cube_1")
    
    # Шаг 9: Удаление Локальных Файлов
    print("\n9️⃣ Удаление Локальных Файлов")
    manager.delete_memcube("demo_cube_1")

if __name__ == "__main__":
    """
    🎯 Главная Функция - Запуск Демонстрации Жизненного Цикла MemCube (Версия API)
    """
    try:
        demonstrate_lifecycle()
        print("\n🎉 Демонстрация Жизненного Цикла MemCube Завершена!")
    except Exception as e:
        print(f"\n❌ Произошла Ошибка Во Время Демонстрации: {e}")
        import traceback
        traceback.print_exc()
```

#### Запустите пример

```bash
# Запуск Демонстрации Жизненного Цикла MemCube
python memcube_lifecycle_api.py
```

#### Часто задаваемые вопросы и лучшие практики

**🔧 Лучшие практики:**

1. **Управление Памятью**

   ```python
   # ✅ Хорошая Практика: Ограничить Количество Одновременно Загружаемых MemCube
   memory_manager = MemCubeMemoryManager()
   memory_manager.max_active_cubes = 3
   
   # ❌ Избегайте: Безлимитной Загрузки MemCube
   # Это Может Привести К Переполнению Памяти
   ```

2. **Стратегия Персистентности**

   ```python
   # ✅ Регулярно Сохраняйте Важные Данные
   if important_changes:
       cube_manager.save_memcube(mem_cube, "important_data")
   
   # ✅ Используйте Версионированное Именование
   timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
   cube_manager.save_memcube(mem_cube, f"data_backup_{timestamp}")
   ```

3. **Оптимизация Запросов**

   ```python
   # ✅ Разумно Установите top_k
   results = mem_cube.text_mem.search(query, top_k=5)  # Обычно 5-10 Достаточно
   
   # ✅ Используйте Метаданные Для Фильтрации И Сужения Поискового Диапазона
   filtered_memories = advanced_ops.filter_by_metadata({"category": "important"})
   ```

**🐛 Часто задаваемые вопросы:**

**Q1: Не удалось сохранить MemCube?**

```python
# 🔧 Убедитесь, Что Достаточно Места На Диске И Права На Запись
import shutil
free_space = shutil.disk_usage(".").free / (1024**3)
print(f"Доступное Пространство: {free_space:.1f} GB")
```

**Q2: Результаты запроса неточные?**

```python
# 🔧 Проверьте, Правильно Ли Настроена Модель Встраивания
print(f"Модель Встраивания: {mem_cube.text_mem.config.embedder}")

# 🔧 Попробуйте Разные Поисковые Запросы
synonyms = ["重要", "ключевой", "основной", "главный"]
for synonym in synonyms:
    results = mem_cube.text_mem.search(synonym)
```

**Q3: Использование памяти слишком высоко?**

```python
# 🔧 Мониторинг И Оптимизация Использования Памяти
memory_manager.memory_health_check()
memory_manager.unload_cube("unused_cube_id")
gc.collect()
```
