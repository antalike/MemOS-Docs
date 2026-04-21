---
title: Linux Ollama版
desc: MemCube является核心组件ом MemOS, он похож на "чип памяти" из Cyberpunk 2077, который позволяет агенту загружать различные "пакеты памяти" для получения различных знаний и возможностей. В этой главе мы с помощью трех прогрессивных рецептов поможем вам освоить основные операции MemCube.<br />Обратите внимание, что система MemOS делится на два уровня: уровень ОС и уровень Cube, здесь мы сначала представляем более базовый уровень Cube. Многие из следующих операций, такие как операции add и search, также присутствуют на уровне ОС, их отличие заключается в том, что ОС управляет несколькими Cube и может выполнять общие поисковые и операционные действия по нескольким Cube, в то время как Cube отвечает только за собственную запись и запрос.

## Первая Глава: Введение: Ваш Первый MemCube (Linux Ollama版)

MemCube является核心组件ом MemOS, он похож на "чип памяти" из Cyberpunk 2077, который позволяет агенту загружать различные "пакеты памяти" для получения различных знаний и возможностей. В этой главе мы с помощью трех прогрессивных рецептов поможем вам освоить основные операции MemCube.

Обратите внимание, что система MemOS делится на два уровня: уровень ОС и уровень Cube, здесь мы сначала представляем более базовый уровень Cube. Многие из следующих операций, такие как операции add и search, также присутствуют на уровне ОС, их отличие заключается в том, что ОС управляет несколькими Cube и может выполнять общие поисковые и операционные действия по нескольким Cube, в то время как Cube отвечает только за собственную запись и запрос.

### Рецепт 1.1: Установка и Настройка Вашей Разработческой Среды MemOS (Ollama版)

**🎯 Сценарий Проблемы:** Вы разработчик AI-приложений, хотите попробовать самый новый и популярный MemOS, но не знаете, как настроить среду MemOS.

**🔧 Решение:** С помощью этого рецепта вы научитесь, как с нуля создать полную среду MemOS.

#### Шаг 1: Проверьте Системные Требования

```bash
# Проверка Версии Python (Требуется 3.10+)
python --version

# 💡 Если Версия Ниже 3.10, Пожалуйста, Сначала Обновите Python
```

#### Шаг 2: Установите MemOS

**Вариант A: Установка в Производственной Среде (Рекомендуется)**

```bash
# 🎯 Быстрая Установка, Подходит Для Производственного Использования
pip install MemoryOS chonkie qdrant_client markitdown
```

**Вариант B: Установка в Разработческой Среде (Подходит для Участников)**

```bash
# 🎯 Клонирование Исходного Кода И Установка Развивающей Среды
git clone https://github.com/MemTensor/MemOS.git
cd MemOS

# 🎯 Используйте make Для Установки (Автоматически Обработает Зависимости И Виртуальную Среду)
make install

# 🎯 Активируйте Виртуальную Среду Poetry
poetry shell
# Или Используйте: poetry run python your_script.py
```

#### Шаг 3: Настройка Переменных Среды Модели Ollama

Если вы еще не установили Ollama, сначала установите его:

```bash
# 🎯 Установка Локального Модельного Сервиса Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Запуск Сервиса Ollama (Порт По Умолчанию)
ollama serve 
# Запуск Сервиса Ollama (Указанный Порт)
# OLLAMA_HOST="localhost:11434" ollama serve

# Загрузка Рекомендуемой Модели
ollama pull nomic-embed-text:latest  # Модель Встраивания
ollama pull qwen2.5:0.5b             # Модель Чата
```

Создайте файл `.env`:

```bash
# .env
# 🎯 Конфигурация Локальной Модели Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBED_MODEL=nomic-embed-text:latest

# 🎯 Специфическая Конфигурация MemOS
MOS_TEXT_MEM_TYPE=general_text
MOS_USER_ID=default_user
MOS_TOP_K=5
```

#### Шаг 4: Проверьте Установку и Полную Среду

Создайте файл проверки `test_memos_setup_ollama_mode.py`:

```python
# test_memos_setup_ollama_mode.py
# 🎯 Скрипт проверки режима Ollama - Используйте локальную модель Ollama и ручную настройку
import os
import sys
from dotenv import load_dotenv

def check_ollama_environment():
    """🎯 Проверка конфигурации переменных окружения Ollama"""
    print("🔍 Проверка конфигурации переменных окружения Ollama...")
    
    # Загрузите файл .env
    load_dotenv()
    
    # Проверьте конфигурацию Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    print(f"📋 Состояние переменных окружения Ollama:")
    
    if ollama_base_url:
        print(f"  ✅ OLLAMA_BASE_URL: {ollama_base_url}")
        print(f"  ✅ OLLAMA_CHAT_MODEL: {ollama_chat_model or '❌ Не настроено'}")
        print(f"  ✅ OLLAMA_EMBED_MODEL: {ollama_embed_model or '❌ Не настроено'}")
        ollama_configured = bool(ollama_base_url and ollama_chat_model and ollama_embed_model)
        
        if ollama_configured:
            print("✅ Конфигурация Ollama полная")
        else:
            print("❌ Конфигурация Ollama неполная")
        
        return ollama_configured
    else:
        print(f"  ❌ OLLAMA_BASE_URL: Не настроено")
        print(f"  ❌ OLLAMA_CHAT_MODEL: Не настроено")
        print(f"  ❌ OLLAMA_EMBED_MODEL: Не настроено")
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
        from memos.configs.mem_cube import GeneralMemCubeConfig
        
        print("✅ Импорт основных компонентов успешен")
        return True
        
    except ImportError as e:
        print(f"❌ Ошибка импорта: {e}")
        return False
    except Exception as e:
        print(f"❌ Другие ошибки: {e}")
        return False

def test_ollama_functionality():
    """🎯 Тестирование функциональности режима Ollama"""
    print("\n🔍 Тестирование функциональности режима Ollama...")
    
    try:
        from memos.mem_os.main import MOS
        from memos.configs.mem_os import MOSConfig
        from memos.configs.mem_cube import GeneralMemCubeConfig
        from memos.mem_cube.general import GeneralMemCube
        
        # Получение переменных окружения
        ollama_base_url = os.getenv("OLLAMA_BASE_URL")
        ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
        ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
        
        print("🚀 Создание конфигурации Ollama...")
        
        # Создание конфигурации MOS
        mos_config = MOSConfig(
            user_id=os.getenv("MOS_USER_ID", "default_user"),
            chat_model={
                "backend": "ollama",
                "config": {
                    "model_name_or_path": ollama_chat_model,
                    "api_base": ollama_base_url,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                }
            },
            mem_reader={
                "backend": "simple_struct",
                "config": {
                    "llm": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_chat_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "embedder": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_embed_model,
                            "api_base": ollama_base_url,
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
            top_k=int(os.getenv("MOS_TOP_K", "5"))
        )
        
        # Создание конфигурации MemCube
        cube_config = GeneralMemCubeConfig(
            user_id=os.getenv("MOS_USER_ID", "default_user"),
            cube_id=f"{os.getenv('MOS_USER_ID', 'default_user')}_cube",
            text_mem={
                "backend": "general_text",
                "config": {
                    "extractor_llm": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_chat_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "embedder": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_embed_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": f"{os.getenv('MOS_USER_ID', 'default_user')}_collection",
                            "vector_dimension": 768,  # размерность nomic-embed-text
                            "distance_metric": "cosine",
                        }
                    }
                }
            },
            act_mem={"backend": "uninitialized"},
            para_mem={"backend": "uninitialized"}
        )
        
        print("✅ Конфигурация успешно создана!")
        
        # Создание экземпляра MOS и MemCube
        print("🚀 Создание экземпляра MOS и MemCube...")
        memory = MOS(mos_config)
        mem_cube = GeneralMemCube(cube_config)
        memory.register_mem_cube(mem_cube)
        
        print("✅ Экземпляр MOS и MemCube успешно созданы!")
        print(f"  📊 Идентификатор пользователя: {memory.user_id}")
        print(f"  📊 Идентификатор сессии: {memory.session_id}")
        print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
        
        # Тестирование добавления памяти
        print("\n🧠 Тестирование добавления памяти...")
        memory.add(memory_content="Это тестовая память в режиме Ollama")
        print("✅ Память успешно добавлена!")
        
        # Тестирование функции чата
        print("\n💬 Тестирование функции чата...")
        response = memory.chat("Что я только что добавил в память?")
        print(f"✅ Ответ чата: {response}")
        
        # Тестирование функции поиска
        print("\n🔍 Тестирование функции поиска...")
        search_results = memory.search("Тестовая память", top_k=3)
        if search_results and search_results.get("text_mem"):
            print(f"✅ Поиск успешен, найдено {len(search_results['text_mem'])} результатов")
        else:
            print("⚠️ Поиск не вернул результатов")
        
        # Тестирование MemCube прямого управления
        print("\n🔧 Тестирование MemCube прямого управления...")
        mem_cube.text_mem.add([{
            "memory": "Это память, добавленная напрямую через MemCube",
            "metadata": {
                "source": "conversation",
                "type": "fact",
                "confidence": 0.9
            }
        }])
        print("✅ Прямое управление MemCube успешно!")
        
        print("✅ Тестирование функциональности режима Ollama успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Тестирование функциональности режима Ollama не удалось: {e}")
        print("💡 Подсказка: проверьте, работает ли служба Ollama, загружена ли модель.")
        return False

def main():
    """🎯 Основной процесс проверки режима Ollama"""
    print("🚀 Начало проверки окружения MemOS режима Ollama...\n")
    
    # Шаг 1: Проверка переменных окружения Ollama
    env_ok = check_ollama_environment()
    
    # Шаг 2: Проверка состояния установки
    install_ok = check_memos_installation()
    
    # Шаг 3: Тестирование функциональности
    if env_ok and install_ok:
        func_ok = test_ollama_functionality()
    else:
        func_ok = False
        if not env_ok:
            print("\n⚠️ Из-за неполной конфигурации переменных окружения Ollama, пропускаем тестирование функциональности")
        elif not install_ok:
            print("\n⚠️  Из-за ошибки установки MemOS, пропускаем функциональное тестирование")
    
    # Резюме
    print("\n" + "="*50)
    print("📊 Результаты проверки режима Ollama:")
    print(f"  Переменные окружения Ollama: {'✅ Пройдено' if env_ok else '❌ Провалено'}")
    print(f"  Установка MemOS: {'✅ Пройдено' if install_ok else '❌ Провалено'}")
    print(f"  Функциональное тестирование: {'✅ Пройдено' if func_ok else '❌ Провалено'}")
    
    if env_ok and install_ok and func_ok:
        print(f"\n🎉 Поздравляем! Конфигурация окружения MemOS Ollama полностью успешна!")
        print(f"💡 Теперь вы можете начать использовать режим MemOS Ollama.")
        print(f"💡 Способ использования: вручную настройте MOSConfig и GeneralMemCubeConfig")
    elif install_ok and env_ok:
        print(f"\n⚠️ MemOS установлен, Ollama настроен, но функциональное тестирование провалено.")
        print(f"💡 Пожалуйста, проверьте, работает ли служба Ollama, и загружена ли модель.")
    elif install_ok:
        print("\n⚠️ MemOS установлен, но необходимо настроить переменные окружения Ollama для нормального использования.")
        print("💡 Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    else:
        print("\n❌ Проблемы с конфигурацией окружения, пожалуйста, проверьте вышеуказанную информацию об ошибках.")
    
    return bool(env_ok and install_ok and func_ok)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
```

Запустите проверку режима Ollama:

```bash
python test_memos_setup_ollama_mode.py
```

#### Часто Задаваемые Вопросы и Решения

**Q1: Что делать, если установка на macOS не удалась?**

```bash
# 🔧 Возможно, macOS требует дополнительной настройки
export SYSTEM_VERSION_COMPAT=1
pip install MemoryOS
```

**Q2: Как решить конфликты зависимостей?**

```bash
# 🔧 Использование Виртуальной Среды Для Изоляции
python -m venv memos_env
source memos_env/bin/activate  # Linux/macOS
pip install MemoryOS
```

**Q3: Настройка GPU-ускорения? (в режиме Ollama)**

```bash
# 🔧 GPU Ускорение Необходимо Только При Использовании Локальной Модели Ollama
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Рецепт 1.2: Создание Простого MemCube из Документного Файла (Ollama版)

**🎯 Сценарий Проблемы:** У вас есть PDF-документ, содержащий корпоративную базу знаний, и вы хотите создать "чип памяти", который может отвечать на соответствующие вопросы.

**🔧 Решение:** С помощью этого рецепта вы научитесь, как использовать MemReader для преобразования документа в MemCube, который можно искать. MemReader является核心组件ом MemOS, который может интеллектуально анализировать документы и извлекать структурированную память.

#### Шаг 1: Подготовьте Пример Документа

Создайте пример документа знаний `company_handbook.txt`:

```text
# Справочник Сотрудника Компании

## Рабочее Время
Стандартное рабочее время компании с понедельника по пятницу, с 9:00 до 18:00.
Гибкий график позволяет сотрудникам начинать работу с 8:00 до 10:00.

## Политика Отпуска
- Годовой отпуск: 15 дней оплачиваемого годового отпуска
- Больничный: 7 дней оплачиваемого больничного в год
- Личный отпуск: 3 дня личного отпуска в год

## Социальные Льготы
Компания предоставляет полный пакет социальных льгот, включая:
- Пенсионное Страхование
- Медицинское Страхование
- Страхование от Безработицы
- Страхование от несчастных случаев на производстве
- Страхование по беременности и родам
- Жилищный накопительный фонд

Дополнительные льготы включают ежегодное медицинское обследование, командные мероприятия и обучение.

## Офисное Оборудование
Каждый сотрудник получит:
- Один ноутбук
- Один монитор
- Эргономичное кресло
- Офисный стол

## Контактная Информация
HR-отдел: hr@company.com
IT-поддержка: it@company.com
Финансовый отдел: finance@company.com
```

#### Шаг 2: Используйте MemReader для Создания MemCube

**💡 Режим Ollama:** Этот скрипт использует локальную модель Ollama для обработки документа и векторизации.

**🔧 Настройка Переменных Среды:** Перед запуском скрипта убедитесь, что вы настроили переменные среды Ollama в соответствии с рецептом 1.1.

Для использования других парсеров можно обратиться к документации: TODO


```python
# create_memcube_with_memreader_ollama.py
# 🎯 Полный Процесс Создания MemCube с Использованием MemReader (Версия Ollama)
import os
import uuid
from dotenv import load_dotenv
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_reader import MemReaderConfigFactory
from memos.mem_reader.factory import MemReaderFactory

def create_memcube_with_memreader():
    """
    🎯 Полный процесс создания MemCube с использованием MemReader (версия Ollama)
    """
    
    print("🔧 Создание конфигурации MemCube...")
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Получение конфигурации Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Переменные окружения Ollama не настроены. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    
    print("✅ Обнаружен локальный режим модели Ollama")
    
    # Получение конфигурации MemOS
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # Конфигурация режима Ollama
    cube_config = {
        "user_id": user_id,
        "cube_id": f"{user_id}_company_handbook_cube",
        "text_mem": {
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_chat_model,
                        "api_base": ollama_base_url
                    }
                },
                "embedder": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_embed_model,
                        "api_base": ollama_base_url
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_company_handbook",
                        "vector_dimension": 768,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        "act_mem": {"backend": "uninitialized"},
        "para_mem": {"backend": "uninitialized"}
    }
    
    # Создание экземпляра MemCube
    config_obj = GeneralMemCubeConfig.model_validate(cube_config)
    mem_cube = GeneralMemCube(config_obj)
    
    print("✅ MemCube успешно создан!")
    print(f"  📊 Идентификатор пользователя: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 Бэкенд текстовой памяти: {mem_cube.config.text_mem.backend}")
    print(f"  🔍 Модель встраивания: {ollama_embed_model} (Ollama)")
    print(f"  🎯 Режим конфигурации: OLLAMA")
    
    return mem_cube

def create_memreader_config():
    """
    🎯 Создание конфигурации MemReader (версия Ollama)
    """
    
    # Загрузка переменных окружения
    load_dotenv()
    
    # Получение конфигурации Ollama
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    # Настройка MemReader
    mem_reader_config = MemReaderConfigFactory(
        backend="simple_struct",
        config={
            "llm": {
                "backend": "ollama",
                "config": {
                    "model_name_or_path": ollama_chat_model,
                    "api_base": ollama_base_url
                }
            },
            "embedder": {
                "backend": "ollama",
                "config": {
                    "model_name_or_path": ollama_embed_model,
                    "api_base": ollama_base_url
                }
            },
            "chunker": {
                "backend": "sentence",
                "config": {
                    "chunk_size": 128,
                    "chunk_overlap": 32,
                    "min_sentences_per_chunk": 1
                }
            },
            "remove_prompt_example": False
        }
    )
    
    return mem_reader_config

def load_document_to_memcube(mem_cube, doc_path):
    """
    🎯 Используйте MemReader для загрузки документов в MemCube (версия Ollama)
    """
    
    print(f"\n📖 Используйте MemReader для чтения документа: {doc_path}")
    
    # Создание MemReader
    mem_reader_config = create_memreader_config()
    mem_reader = MemReaderFactory.from_config(mem_reader_config)
    
    # Подготовка данных документа
    print("📄 Подготовка данных документа...")
    documents = [doc_path]  # MemReader ожидает список путей к документам
    
    # Обработка документа с помощью MemReader
    print("🧠 Используйте MemReader для извлечения памяти...")
    memories = mem_reader.get_memory(
        documents,
        type="doc",
        info={
            "user_id": mem_cube.config.user_id, 
            "session_id": str(uuid.uuid4())
        }
    )
    
    print(f"📚 MemReader сгенерировал {len(memories)} фрагментов памяти")
    
    # Добавление памяти в MemCube
    print("💾 Добавление памяти в MemCube...")
    for mem in memories:
        mem_cube.text_mem.add(mem)
        print(mem)
    
    print(f"✅ Успешно добавлено {len(memories)} фрагментов памяти в MemCube")
    
    # Вывод основной информации
    print("\n📊 Основная информация о MemCube:")
    print(f"  📁 Источник документа: {doc_path}")
    print(f"  📝 Количество фрагментов памяти: {len(memories)}")
    print(f"  🏷️ Тип документа: company_handbook")
    print(f"  💾 Векторная база данных: Qdrant (режим памяти, освобождение памяти приводит к удалению)")
    print(f"  🔍 Модель встраивания: {os.getenv('OLLAMA_EMBED_MODEL')} (Ollama)")
    print(f"  🎯 Режим конфигурации: OLLAMA")
    print(f"  🧠 Извлекатель памяти: MemReader (simple_struct)")
    
    return mem_cube

if __name__ == "__main__":
    print("🚀 Начинаем использовать MemReader для создания документа MemCube (версия Ollama)...")
    
    # Создание MemCube
    mem_cube = create_memcube_with_memreader()
    
    # Загрузка документа
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
    
    print("\n🎉 MemCube создан успешно!") 
```

#### Пример Запуска

```bash
# Шаг 2: Создание MemCube
python create_memcube_with_memreader_ollama.py
```


#### Шаг 3: Проверьте Функции Поиска и Диалога

**💡 Режим Ollama:** Этот скрипт использует локальную модель Ollama для поиска и диалога.

> В текущей версии MemOS, при отключенном Scheduler, запуск chat может вызвать некоторые проблемы, необходимо вручную закомментировать один блок кода, следуя следующим шагам, вы сможете нормально запустить все последующие примеры кода. В следующих версиях мы исправим эту проблему.
> ctrl+левый клик на функции chat() ниже, затем нажмите super.chat() для перехода в core.py, или в каталоге установки среды найдите lib/python3.12/site-packages/memos/mem_os/core.py и выполните поиск по def chat для нахождения соответствующей функции.
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
# test_memcube_search_and_chat_ollama.py
# 🎯 Тестирование функций поиска и диалога MemCube (версия Ollama)
import os
from dotenv import load_dotenv
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS

def create_mos_config():
    """
    🎯 Создание конфигурации MOS (версия Ollama)
    """
    load_dotenv()
    
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ Переменные окружения Ollama не настроены. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
    
    # Конфигурация режима Ollama
    return MOSConfig(
        user_id=user_id,
        chat_model={
            "backend": "ollama",
            "config": {
                "model_name_or_path": ollama_chat_model,
                "api_base": ollama_base_url,
                "temperature": 0.1,
                "max_tokens": 1024,
            }
        },
        mem_reader={
            "backend": "simple_struct",
            "config": {
                "llm": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_chat_model,
                        "api_base": ollama_base_url,
                    }
                },
                "embedder": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_embed_model,
                        "api_base": ollama_base_url,
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
    🎯 Тестирование функций поиска и диалога MemCube (версия Ollama)
    """
    
    print("🚀 Начинаем тестирование функций поиска и диалога MemCube (версия Ollama)...")
    
    # Импортируйте функцию из шага 2
    from create_memcube_with_memreader_ollama import create_memcube_with_memreader, load_document_to_memcube
    
    # Создайте MemCube и загрузите документы
    print("\n1️⃣ Создайте MemCube и загрузите документы...")
    mem_cube = create_memcube_with_memreader()
    # Загрузка документа
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
    
    # Создайте конфигурацию MOS
    print("\n2️⃣ Создайте конфигурацию MOS...")
    mos_config = create_mos_config()
    
    # Создайте экземпляр MOS и зарегистрируйте MemCube
    print("3️⃣ Создайте экземпляр MOS и зарегистрируйте MemCube...")
    mos = MOS(mos_config)
    mos.register_mem_cube(mem_cube, mem_cube_id="handbook")
    
    print("✅ Экземпляр MOS успешно создан!")
    print(f"  📊 Идентификатор пользователя: {mos.user_id}")
    print(f"  📊 Идентификатор сессии: {mos.session_id}")
    print(f"  📊 Зарегистрированные MemCube: {list(mos.mem_cubes.keys())}")
    print(f"  🎯 Режим конфигурации: OLLAMA")
    print(f"  🤖 Модель чата: {os.getenv('OLLAMA_CHAT_MODEL')} (Ollama)")
    print(f"  🔍 Модель встраивания: {os.getenv('OLLAMA_EMBED_MODEL')} (Ollama)")
    
    # Тестирование функции поиска
    print("\n🔍 Тестирование функции поиска...")
    test_queries = [
        "Какое рабочее время компании?"
        "Сколько дней оплачиваемого отпуска?"
        "Какие есть льготы и преимущества?"
        "Как связаться с отделом HR?"
    ]
    
    for query in test_queries:
        print(f"\n❓ Запрос: {query}")
        
        # Использовать MOS для поиска
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
    
    # Тестирование функции диалога
    print("\n💬 Тестирование функции диалога...")
    chat_questions = [
        "Каково расписание рабочего времени компании?"
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

#### Пример Запуска

```bash
# Шаг 3: Тестирование поиска и диалога
python test_memcube_search_and_chat_ollama.py
```




### Рецепт 1.3: MemCube Базовые Операции: Создание, Добавление Памяти, Сохранение, Чтение, Запрос, Удаление (Версия Ollama)

**🎯 Сценарий Проблемы:** Вы уже создали несколько MemCube: корпоративные правила, кадровые данные компании, корпоративная база знаний..., необходимо научиться эффективно управлять их полным жизненным циклом: создание, добавление памяти, сохранение на диск, загрузка с диска, запрос в памяти (базовый запрос и продвинутый запрос метаданных), а также очистка ненужных MemCube (удаление из памяти и удаление файлов).

**🔧 Решение:** Овладение полным управлением жизненным циклом MemCube, включая проверку окружения, интеллектуальную настройку, базовые запросы, продвинутые операции с метаданными, а также детализированное управление памятью и файлами.

#### Шаг 1: Полное Управление Жизненным Циклом MemCube

```python
 # memcube_lifecycle_ollama.py
# 🎯 Управление жизненным циклом MemCube: создание, добавление памяти, сохранение, чтение, запрос, удаление (версия Ollama)
import os
import shutil
import time
from pathlib import Path
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig

class MemCubeManager:
    """
    🎯 Менеджер жизненного цикла MemCube (версия Ollama)
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
        
        # Получить конфигурацию Ollama
        ollama_base_url = os.getenv("OLLAMA_BASE_URL")
        ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
        ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
        
        if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
            raise ValueError("❌ Переменные окружения Ollama не настроены. Пожалуйста, настройте OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL в файле .env.")
        
        print("✅ Обнаружен локальный режим модели Ollama")
        
        # Получить конфигурацию MemOS
        user_id = os.getenv("MOS_USER_ID", "demo_user")
        
        # Конфигурация режима Ollama
        cube_config = {
            "user_id": user_id,
            "cube_id": cube_id,
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "extractor_llm": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_chat_model,
                            "api_base": ollama_base_url
                        }
                    },
                    "embedder": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_embed_model,
                            "api_base": ollama_base_url
                        }
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": f"collection_{cube_id}_{int(time.time())}",
                            "vector_dimension": 768,
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
        
        print(f"✅ Создан пустой MemCube: {cube_id}")
        return mem_cube
  
    def save_memcube(self, mem_cube: GeneralMemCube, cube_id: str) -> str:
        """
        🎯 Сохранить MemCube на диск
        """
    
        save_path = self.storage_root / cube_id
    
        print(f"💾 Сохранить MemCube в: {save_path}")
    
        try:
            # ⚠️ Если каталог существует, сначала очистите
            if save_path.exists():
                shutil.rmtree(save_path)
        
            # Сохранить MemCube
            mem_cube.dump(str(save_path))
        
            print(f"✅ MemCube '{cube_id}' успешно сохранен")
            return str(save_path)
        
        except Exception as e:
            print(f"❌ Ошибка сохранения: {e}")
            raise
  
    def load_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 Загрузить MemCube с диска
        """
    
        load_path = self.storage_root / cube_id
    
        if not load_path.exists():
            raise FileNotFoundError(f"MemCube '{cube_id}' не существует в {load_path}")
    
        print(f"📂 Загрузить MemCube с диска: {load_path}")
    
        try:
            # Загрузить MemCube из каталога
            mem_cube = GeneralMemCube.init_from_dir(str(load_path))
        
            # Кэшировать в памяти
            self.loaded_cubes[cube_id] = mem_cube
        
            print(f"✅ MemCube '{cube_id}' успешно загружен")
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
            print(f"⚠️ MemCube '{cube_id}' не находится в памяти")
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
            # Удалить директорию
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
        """Вычислить размер директории"""
        total_size = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
        return f"{total_size / 1024:.1f} KB"

def add_memories_to_cube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Добавить память в MemCube
    """
    
    print(f"🧠 Добавление памяти в {cube_name}...")
    
    # Добавить несколько примеров памяти (с богатыми метаданными)
    memories = [
        {"memory": f"Ажэнь влюбилась в Ацянь", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"Ажэнь ростом 1 метр 5 сантиметров", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}},
        {"memory": f"阿珍是一个刺客", "metadata": {"type": "fact", "source": "web", "confidence": 0.7}},
        {"memory": f"阿强是一个程序员", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"阿强喜欢写代码", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}}
    ]
    
    mem_cube.text_mem.add(memories)
    
    print(f"✅ Успешно добавлено {len(memories)} воспоминаний в {cube_name}")
    
    # Показать текущее количество воспоминаний
    all_memories = mem_cube.text_mem.get_all()
    print(f"📊 {cube_name} Текущее общее количество воспоминаний: {len(all_memories)}")

def basic_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Базовый запрос MemCube
    """
  
    print(f"🔍 Базовый запрос {cube_name}:")
  
    # Получить все воспоминания
    all_memories = mem_cube.text_mem.get_all()
    print(f"  📊 Общее количество воспоминаний: {len(all_memories)}")
  
    # Поиск конкретного содержания
    search_results = mem_cube.text_mem.search("爱情", top_k=1)
    print(f"  🎯 Результат поиска '爱情': {len(search_results)}条")
  
    for i, result in enumerate(search_results, 1):
        print(f"    {i}. {result.memory}")

def advanced_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Расширенный запрос MemCube (операции с метаданными)
    """
  
    print(f"🔬 Расширенный запрос {cube_name}:")
  
    # Получить все воспоминания
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
    print(f"    Уровень Достоверности: {first_memory.metadata.confidence}")
    print()
    
    # 2. Фильтрация Метаданных
    print("  🔍 Фильтрация Метаданных:")
    
    # Фильтрация Памяти с Высоким Уровнем Достоверности
    high_confidence = [m for m in all_memories if m.metadata.confidence and m.metadata.confidence >= 0.9]
    print(f"    Память с Высоким Уровнем Достоверности (>=0.9): {len(high_confidence)} записей")
    for i, memory in enumerate(high_confidence, 1):
        print(f"      {i}. {memory.memory} (Уровень Достоверности: {memory.metadata.confidence})")
    
    # Фильтрация Памяти по Конкретному Источнику
    conversation_memories = [m for m in all_memories if m.metadata.source == "conversation"]
    print(f"    Память из Диалога: {len(conversation_memories)} записей")
    for i, memory in enumerate(conversation_memories, 1):
        print(f"      {i}. {memory.memory} (Источник: {memory.metadata.source})")
    
    # Фильтрация Источников Файловой Памяти
    file_memories = [m for m in all_memories if m.metadata.source == "file"]
    print(f"    Источники Файловой Памяти: {len(file_memories)} записей")
    for i, memory in enumerate(file_memories, 1):
        print(f"      {i}. {memory.memory} (Источник: {memory.metadata.source})")
    
    # 3. Комбинированная Фильтрация
    print("  🔍 Комбинированная Фильтрация:")
    high_conf_file = [m for m in all_memories 
                     if m.metadata.source == "file" and m.metadata.confidence and m.metadata.confidence >= 0.8]
    print(f"    Файловая Память С Высокой Уверенностью: {len(high_conf_file)} записей")
    for i, memory in enumerate(high_conf_file, 1):
        print(f"      {i}. {memory.memory} (Источник: {memory.metadata.source}, Уверенность: {memory.metadata.confidence})")
    
    # 4. Статистическая Информация
    print("  📊 Статистическая Информация:")
    sources = {}
    confidences = []
    
    for memory in all_memories:
        # Статистика Источников
        source = memory.metadata.source
        sources[source] = sources.get(source, 0) + 1
        
        # Сбор Уверенности
        if memory.metadata.confidence:
            confidences.append(memory.metadata.confidence)
    
    print(f"    Распределение Источников: {sources}")
    if confidences:
        avg_confidence = sum(confidences) / len(confidences)
        print(f"    Средняя Уверенность: {avg_confidence:.2f}")

# 🎯 Демонстрация Полного Управления Жизненным Циклом
def demonstrate_lifecycle():
    """
    Демонстрация Полного Жизненного Цикла MemCube
    """
  
    manager = MemCubeManager()
  
    print("🚀 Начало Демонстрации Жизненного Цикла MemCube...\n")
  
    # Шаг 1: Создание MemCube
    print("1️⃣ Создание MemCube")
    cube1 = manager.create_empty_memcube("demo_cube_1")
  
    # Шаг 2: Добавление памяти
    print("\n2️⃣ Добавление памяти")
    add_memories_to_cube(cube1, "demo_cube_1")
  
    # Шаг 3: Сохранение на диск
    print("\n3️⃣ Сохранение MemCube на диск")
    manager.save_memcube(cube1, "demo_cube_1")
  
    # Шаг 4: Список сохраненных MemCube
    print("\n4️⃣ Список сохраненных MemCube")
    saved_cubes = manager.list_saved_memcubes()
    for cube_info in saved_cubes:
        print(f"  📦 {cube_info['cube_id']} - {cube_info['size']}")
  
    # Шаг 5: Чтение с диска
    print("\n5️⃣ Чтение MemCube с диска")
    del cube1  # 💡 Удаление ссылки в памяти
  
    reloaded_cube = manager.load_memcube("demo_cube_1")
  
    # Шаг 6: Базовый запрос
    print("\n6️⃣ Базовый запрос")
    basic_query_memcube(reloaded_cube, "перезагруженный_demo_cube_1")
    
    # Шаг 7: Расширенный запрос (операции с метаданными)
    print("\n7️⃣ Расширенный Запрос (Операции с Метаданными)")
    advanced_query_memcube(reloaded_cube, "перезагруженный_demo_cube_1")
  
    # Шаг 8: Удалить MemCube из памяти
    print("\n8️⃣ Удалить MemCube из памяти")
    manager.unload_memcube("demo_cube_1")
    
    # Шаг 9: Удалить локальные файлы
    print("\n9️⃣ Удалить локальные файлы")
    manager.delete_memcube("demo_cube_1")

if __name__ == "__main__":
    """
    🎯 Главная Функция - Запуск Демонстрации Жизненного Цикла MemCube
    """
    try:
        demonstrate_lifecycle()
        print("\n🎉 Демонстрация Жизненного Цикла MemCube Завершена!")
    except Exception as e:
        print(f"\n❌ Произошла Ошибка Во Время Демонстрации: {e}")
        import traceback
        traceback.print_exc()
```


#### Пример Запуска

```bash
# Запуск Демонстрации Жизненного Цикла MemCube
python memcube_lifecycle_ollama.py
```

#### Часто Задаваемые Вопросы и Лучшие Практики

**🔧 Лучшие Практики:**

1. **Управление Памятью**

   ```python
   # ✅ Хорошая Практика: Ограничить Количество Одновременно Загружаемых MemCube
   memory_manager = MemCubeMemoryManager()
   memory_manager.max_active_cubes = 3
   
   # ❌ Избегать: Безлимитной Загрузки MemCube
   # Это Может Привести К Переполнению Памяти
   ```

2. **Стратегия Устойчивости**

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

**🐛 Часто Задаваемые Вопросы:**

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

# 🔧 Попробуйте Разные Поисковые Слова
synonyms = ["важный", "ключевой", "основной", "главный"]
for synonym in synonyms:
    results = mem_cube.text_mem.search(synonym)
```

**Q3: Использование памяти слишком высокое?**

```python
# 🔧 Мониторинг И Оптимизация Использования Памяти
memory_manager.memory_health_check()
memory_manager.unload_cube("unused_cube_id")
gc.collect()
```
