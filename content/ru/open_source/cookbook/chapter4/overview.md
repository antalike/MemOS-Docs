---
title: Использование MemOS для построения производственной системы вопросов и ответов на основе знаний
---
## **Введение**

При построении системы вопросов и ответов (QA) в определенной области отрасль сталкивается с общей проблемой: хотя большие языковые модели (LLM) обладают обширными знаниями, их точность и надежность в специализированных областях все еще недостаточны; традиционные методы генерации с улучшением поиска (RAG), хотя и могут вводить внешние знания, ограничены дискретностью документов и отсутствием глубокой логической связи, что затрудняет решение сложных вопросов и ответов.

Цель этой главы — показать, как решить эту проблему на основе MemOS и предложить и реализовать полный демонстрационный проект по улучшению знаний для производства. Наша основная цель — доказать и реализовать ключевое утверждение: с помощью структурированной системы знаний маленькая модель, тщательно улучшенная, может превзойти неулучшенную большую модель в своей профессиональной способности.

Для достижения этой цели мы разработали и построили динамическую систему знаний под названием MemCube. Процесс его создания следует строгой инженерной методологии:

**Извлечение и структурирование скрытых знаний**: Сначала мы систематически извлекаем скрытые знания о конкретной области из больших языковых моделей (LLM) и с помощью метода "итеративного расширения концептуальной карты" преобразуем их в масштабную, высокопокрывающую явную карту концептуальных отношений.

**Генерация структурированных пар знаний**: Затем мы используем эту концептуальную карту в качестве руководства и снова применяем LLM для генерации большого количества высококачественных пар вопросов и ответов (QA) с сложной клинической логикой, которые станут основным содержанием базы знаний.

**Создание и развертывание базы знаний**: В конечном итоге мы организуем эти пары QA и загружаем их в графовую базу данных (Neo4j), создавая динамическую базу знаний (MemCube), которая может эффективно извлекаться системой MemOS для улучшения возможностей маленькой модели в данной области.

Эта глава полностью продемонстрирует процесс создания MemCube с нуля на примере области кардиологии и с помощью количественной оценки подтвердит значительный эффект этой системы в повышении профессиональных способностей модели в вопросах и ответах, предоставляя повторяемый стандартный процесс для реализации недорогих, высокоточных и объяснимых AI-сервисов знаний в реальном бизнесе.

---

## **Введение в главу: План построения динамической системы знаний**

Основная исследовательская цель этой главы — подтвердить, что путем систематического построения базы знаний MemOS (то есть MemCube) модель с относительно небольшим количеством параметров (например, уровня 7B) может достичь или даже превзойти уровень производительности больших моделей (например, уровня 32B+).

Эта глава проведет вас через полный практический процесс знаний. Наша конечная цель — создать интеллектуальную систему вопросов и ответов, специально предназначенную для области кардиологии. Для достижения этой цели мы будем следовать четкому, поэтапному пути, где каждый шаг будет основываться на результатах предыдущего.

Общая структура этой главы выглядит следующим образом:

### **Первый этап: Построение базовой структуры знаний в области — Расширение концептуальной карты**

Это основа всей работы. Высококачественная база знаний начинается с всеобъемлющей и структурированной сети концепций в области, которая является явным выражением скрытых знаний этой области.

**Цель**: Создать масштабную карту, которая будет широко охватывать основные концепции кардиологии и их взаимосвязи.

**Получение начальных концепций**: Мы отбираем материалы из специализированных медицинских наборов данных в области кардиологии и с помощью LLM предварительно извлекаем набор высококачественных "начальных концепций", которые станут отправной точкой для карты.

**Итеративное расширение**: На основе начальных концепций мы с помощью многократных автоматизированных процессов позволяем LLM ассоциировать новые связанные концепции на основе уже существующих в карте и устанавливать связи.

**Схлопывание и оценка**: Мы вводим строгие механизмы контроля схлопывания (например, объединение схожих узлов, мониторинг темпов роста новых концепций), чтобы гарантировать, что карта прекращает расти, когда достигает достаточного уровня охвата знаний. В конечном итоге мы количественно оцениваем целостность нашей карты, сравнивая ее с ключевыми словами из внешних источников знаний.

### **Второй этап: Генерация применимого содержимого знаний — Генерация пар QA на основе карты**

С концептуальной картой как базовой структурой, нам необходимо заполнить ее конкретными знаниями, которые могут быть непосредственно поняты и использованы ИИ, а именно вопросами и ответами.

**Цель**: Преобразовать абстрактные концепции и отношения в графе в большое количество конкретных QA пар, содержащих клиническую логику.

**Генерация знаний по отдельным концепциям**: Обойти каждый узел ключевой концепции в графе и использовать LLM для генерации независимых, глубоких клинических вопросов и ответов для каждой концепции.

**Генерация связанных знаний**: Для "пар концепций", которые связаны в графе, мы позволяем LLM генерировать более сложные вопросы о взаимосвязи, которые отражают внутреннюю логику обеих.

### **Третий Этап: Сборка и Развертывание Базы Знаний — Построение и Монтирование MemCube**

Дискретные данные QA необходимо организовать в эффективную систему.

**Цель**: Структурировать все сгенерированные данные QA и загрузить их в графовую базу данных, чтобы сформировать базу знаний, которая может быть вызвана MemOS в любое время.

**Процесс**:

**Форматирование данных**: Мы унифицируем все QA пары в стандартный формат JSON и генерируем векторные встраивания (Embedding) для текстов вопросов, используемых для поиска.

**Импорт в графовую базу данных**: Написать скрипт для пакетного и эффективного импорта отформатированных узлов (концепции, QA) и ребер (отношения) в базу данных Neo4j.

**Монтаж MemOS**: Наконец, с помощью простой конфигурации мы укажем систему MemOS на эту базу данных Neo4j, официально активируя наш кардиологический MemCube.

### **Четвертый Этап: Проверка Итоговых Результатов — Оценка Системы**

После завершения сборки нам необходимо использовать объективные данные, чтобы доказать ее ценность.

**Цель**: Качественно оценить меньшую модель, оснащенную MemCube, по сравнению с неусиленной моделью, чтобы определить, достигла ли она превосходства в профессиональных вопросах и ответах.

**Процесс**: Мы создадим независимый набор для оценки, с помощью автоматизированных скриптов проведем "соревнование по одинаковым вопросам" между моделями с различными конфигурациями, а более мощная модель будет выступать в роли судьи для оценки, в конечном итоге используя процент побед и баллы для демонстрации фактической эффективности нашей системы.

С помощью вышеуказанных четырех этапов вы четко увидите, как абстрактная бизнес-задача шаг за шагом с помощью строгих инженерных методов в конечном итоге превращается в мощную, оценимую AI систему знаний.
------------------------------------------------------------------------------------------------------------------------------

## **Построение и Расширение Концептуальной Карты Области**

### **Цель**

Преобразовать неструктурированные знания в определенной области в высококачественный, структурированный набор начальных концепций, что является основой для построения интеллектуального MemCube.

### **Основная Идея**

В профессиональных сценариях вопросов и ответов данные для обучения крупных языковых моделей (LLM) уже содержат огромное количество знаний в области. Проблема заключается в том, как систематически "извлечь" и "организовать" эти знания, чтобы специализированный, малый MemCube в данной области обладал знаниями, сопоставимыми с большими моделями.

Прямо спрашивать LLM "Пожалуйста, предоставьте все знания в области кардиологии" неэффективно и непрактично. Поэтому мы должны установить ряд точных **"концептуальных якорей"**, на основе которых систематически очертить карту знаний LLM о данной области. Хотя охват знаний в области трудно количественно оценить, мы можем косвенно измерить его полноту через ключевые концепции и ключевые слова в области. Конечная цель этого этапа — максимально полно захватить концепции области, чтобы предоставить структурированную поддержку для последующего извлечения знаний.

---

### **Шаг 1: Получение Начальных Концепций**

Построение графа начинается с получения группы высококачественных "начальных концепций". Эти начальные концепции являются отправной точкой для итеративного расширения графа, и их качество напрямую влияет на скорость и эффективность построения модели знаний в области.

Чтобы обеспечить профессионализм и охват начальных концепций, в этом эксперименте используется открытый набор данных тестовых вопросов медицинских экспертов `medxpert` в качестве начального источника данных. Этот набор данных содержит четкие классификации в области медицины, что позволяет нам точно отбирать соответствующие знания в области кардиологии.

Искренне благодарим: MedXpert открытый Benchmark

Ссылка для загрузки данных: https://raw.githubusercontent.com/TsinghuaC3I/MedXpertQA/refs/heads/main/eval/data/medxpertqa/input/medxpertqa_text_input.jsonl

Следующий код демонстрирует процесс загрузки и фильтрации данных.

```python
import os
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
os.environ['HUGGINGFACE_HUB_URL'] = 'https://hf-mirror.com'
os.environ['HF_HUB_BASE_URL'] = 'https://hf-mirror.com'

import glob
import pickle
import requests
import json
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import torch
import uuid
import sys
import ijson
from decimal import Decimal
from neo4j import GraphDatabase
from collections import defaultdict
import numpy as np
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import re
from collections import Counter
import random
from sentence_transformers import SentenceTransformer
from json_repair import repair_json
```

Мы согласуем следующие переменные окружения:

```python
# api url; api key является вашим личным настроением
# Для конкретного используемого llm модели:
# 1. На этапе обобщения seed concepts мы используем мощную модель MEDXPERT_THINKER=o3 для расширения более чем 100 вопросов в области сердечно-сосудистой медицины, извлекая процесс анализа вопросов. Наша цель не в том, чтобы o3 правильно отвечал на каждый вопрос, а в том, чтобы после анализа каждого сердечно-сосудистого вопроса, его процесс мышления обобщал seed концепции в области сердечно-сосудистой медицины.
# 2. После извлечения мыслительного процесса o3 мы используем MEDXPERT_THINK_EXTRACTOR=gpt-4o для извлечения названий сердечно-сосудистых концепций в качестве seed концепций
# Для вышеуказанных двух этапов наша цель состоит в создании библиотеки seed концепций; если у вас есть ваша собственная библиотека документов в вашей области, вы можете пропустить этот этап и напрямую извлечь интересующие вас seed концепции из ваших документов.
# 3. После завершения создания библиотеки seed концепций мы проведем расширение концептуальной карты области. На этом этапе мы рекомендуем выбирать вашу модель в зависимости от наших экспериментальных результатов и вашего бюджета. На этапе наших испытаний мы использовали CONCEPT_GRAPH_EXTENDER=gpt-4omini в качестве ориентира.
# 4. После завершения построения концептуальной карты области мы проведем (a) индивидуальную генерацию qa для каждого концепта (b) генерацию qa для каждой значимой пары концептов. Поскольку генерация qa зависит от возможностей модели, мы рекомендуем использовать мощную модель. На этапе наших экспериментов мы использовали QA_SYNTHESIZER=gpt-4o в качестве ориентира.
# Мы применяем английскую embedding модель EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5 ко всем используемым embedding моделям
api_url="your api url"
api_key="your api key"

# Различные возможные модели:
MEDXPERT_THINKER = 'o3'
MEDXPERT_THINK_EXTRACTOR = 'gpt-4o'
CONCEPT_GRAPH_EXTENDER = 'gpt-4o-mini'
QA_SYNTHESIZER = 'gpt-4o'
EMBEDDING_MODEL = 'nomic-ai/nomic-embed-text-v1.5'
```

```python
# Извлечение seed концепций из последнего набора данных medxpert, его преимущество заключается в наличии соответствующего разделения по областям
import json
from collections import Counter

data = []
with open("medxpertqa_text_input.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        data.append(json.loads(line.strip()))

# Извлечение вопросов в области сердечно-сосудистой медицины
body_system_counts = Counter(entry["body_system"] for entry in data)
heart_data = []
for i in range(len(data)):
    if data[i]['body_system']=='Cardiovascular':
        heart_data.append(data[i])  
```

Чтобы обеспечить стабильное и эффективное взаимодействие с API крупных языковых моделей, мы разработали модульный клиент API. Этот клиент интегрирует пул соединений, механизм автоматической повторной попытки на основе экспоненциальной задержки и контроль времени ожидания запросов, что обеспечивает надежность при высоком уровне параллельных вызовов. В то же время мы определили стандартизированную структуру данных (`AnalysisResult`), чтобы унифицировать хранение результатов запросов, что упрощает последующую обработку.

```python

@dataclass
class AnalysisResult:
    """Анализ результатов данных"""
    status: str  # success, api_error
    question_id: str
    input_data: Dict
    response: Optional[str] = None
    error_details: Optional[str] = None
    processing_time: Optional[float] = None

class APIClient:
    """Клиент API вызова"""

    def __init__(self, api_url: str, api_key: str, model_name: str):
        self.api_url = api_url
        self.api_key = api_key
        self.model_name = model_name

        # Создание сессии и настройка пула соединений и стратегии повторных попыток
        self.session = requests.Session()

        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[500, 502, 503, 504],
        )

        adapter = HTTPAdapter(pool_connections=10, pool_maxsize=20, max_retries=retry_strategy)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

        self.session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        })

    def call_api(self, messages: List[Dict], timeout: int = 120) -> Dict:
        """Вызов API"""
        data = {
            "model": self.model_name,
            "messages": messages,
            "stream": False
        }

        try:
            response = self.session.post(url=self.api_url, json=data, timeout=timeout)
            response.raise_for_status()
            result = response.json()
            return {
                "status": "success",
                "content": result['choices'][0]['message']['content']
            }
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "error": str(e)
            }
  
```

Мы используем тщательно разработанный класс `PromptTemplate` для упаковки и генерации инструкций для взаимодействия с LLM. Этот шаблон задает роль LLM как опытного профессора клинической медицины и требует от него структурированного, систематического разбора и анализа медицинских вопросов. Такой структурированный вывод является ключом к последующему точному извлечению информации.

```python

class PromptTemplate:
    """Класс шаблона подсказок"""

    @staticmethod
    def get_system_prompt() -> str:
        return """You are a world-renowned clinical professor at a top teaching hospital with over 20 years of experience. Your thinking is grounded in evidence-based medicine, characterized by rigorous logic and clear reasoning.

Your core mission extends beyond solving clinical problems—you must **teach young doctors and medical students your decision-making process**. Therefore, when analyzing any case, you must:

1. **Systematic Deconstruction**: Begin by breaking down the problem from a macro perspective, identifying core clinical contradictions and key information.
2. **Comprehensive Evaluation**: Provide independent and thorough analysis of all possibilities (including every option), without skipping any.
3. **Clear Reasoning**: Explicitly articulate the "because-therefore" logic behind each judgment, clearly stating which specific clinical indicators, guideline consensus, or pathophysiological principles your decisions are based on.
4. **Principle Extraction**: After analysis, skillfully distill complex individual case decision processes into reusable, instructive core principles.

Your language should combine authority with clarity, enabling listeners to fully replicate your thought process."""

    @staticmethod
    def get_analysis_prompt(question_data: Dict) -> str:
        question = question_data['question']
        options = question_data['options']
  
        options_text = ""
        for opt in options:
            options_text += f"({opt['letter']}) {opt['content']}\n"
        return f"""Analyze this cardiovascular medicine multiple-choice question systematically and select the SINGLE CORRECT ANSWER. Provide a comprehensive analysis that demonstrates expert clinical reasoning. 

    **[Clinical Problem]**
    ---
    {question}

    Answer Choices:
    {options_text}
    ---


    **[Analysis Structure]**

    **Part 1: Clinical Context Analysis**

    Begin by establishing the clinical foundation for this question:

    * **Clinical Scenario Identification**: What is the primary clinical situation being presented? (e.g., diagnostic workup, treatment decision, risk stratification, pathophysiology question, etc.)

    * **Key Clinical Elements**: What are the most important clinical details, patient characteristics, findings, or parameters mentioned in the question stem? Why are these details clinically significant?

    * **Question Focus**: What specific aspect of clinical medicine is this question testing? What clinical knowledge or decision-making skill is being assessed?

    * **Relevant Clinical Framework**: What established clinical guidelines, diagnostic criteria, or treatment algorithms are relevant to answering this question?

    **Part 2: Systematic Option Analysis**

    Now analyze each answer choice methodically:

    **Option (A): **
    * **Clinical Evaluation**: How does this option relate to the clinical scenario? What would be the clinical implications if this were the correct choice?
    * **Evidence-Based Assessment**: Based on current guidelines, evidence, and pathophysiology, is this option clinically appropriate? Why or why not?

    **Option (B): **
    * **Clinical Evaluation**: [Same analysis format]
    * **Evidence-Based Assessment**: [Same analysis format]

    [Continue this systematic analysis for each option through the last one]

    **Part 3: Final Answer and Clinical Synthesis**

    * **Clinical Summary**: Briefly synthesize the key clinical scenario from the question stem and the critical findings from my analysis of each option.

    * **Selected Answer**: Based on my systematic analysis, the correct answer is: **(Letter) [Brief restatement of the correct option]**

    * **Answer Justification**: Concisely explain why this is the best answer, focusing on the most compelling clinical evidence and reasoning.

    * **Option Comparison Summary**: Provide a brief comparative overview of why the chosen option is superior to the other alternatives, highlighting the key clinical distinctions.

    * **Clinical Teaching Point**: Detailedly summarize the essential clinical medicine principle demonstrated by this question as a practical clinical pearl.

    **CRITICAL REQUIREMENT**: End with a clear statement: "**FINAL ANSWER: (a [single] Letter, DO NOT GIVE DETAILED CONTENT IN OPTION)**"

    Begin your analysis now."""
```

Чтобы связать вышеупомянутые компоненты, мы разработали два процессора. `CardioAnalysisProcessor` отвечает за обработку одного вопроса, он комбинирует Prompt, вызывает API и возвращает структурированные результаты. В то время как `BatchProcessor` использует пул потоков (`ThreadPoolExecutor`) для реализации высокопараллельной обработки, позволяя передавать все отобранные вопросы партиями и параллельно обрабатывать их с помощью `CardioAnalysisProcessor`, автоматически сохраняя результаты каждой партии. Этот дизайн является необходимой гарантией достижения производственной эффективности обработки данных.

```python
# Извлечение процесса мышления llm для подготовки семенных концепций
class CardioAnalysisProcessor:
    """Анализатор и обработчик сердечно-сосудистых проблем"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client
        self.template = PromptTemplate()

    def process_single_question(self, question_data: Dict, question_id: str) -> AnalysisResult:
        """Обработка одной сердечно-сосудистой проблемы"""
        start_time = time.time()
  
        # Формирование сообщения
        system_prompt = self.template.get_system_prompt()
        user_prompt = self.template.get_analysis_prompt(question_data)
  
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Вызов API
        api_result = self.api_client.call_api(messages, timeout=120)
        processing_time = time.time() - start_time

        if api_result["status"] != "success":
            return AnalysisResult(
                status="api_error",
                question_id=question_id,
                input_data=question_data,
                error_details=api_result["error"],
                processing_time=processing_time
            )

        return AnalysisResult(
            status="success",
            question_id=question_id,
            input_data=question_data,
            response=api_result["content"],
            processing_time=processing_time
        )

class BatchProcessor:
    """Пакетный обработчик"""

    def __init__(self, processor: CardioAnalysisProcessor, output_dir: str = "cardio_analysis"):
        self.processor = processor
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def process_questions_list(self, heart_data: List[Dict], max_workers: int = 10, 
                              batch_size: int = 50, batch_delay: int = 1) -> Dict:
        """Пакетная обработка сердечно-сосудистых проблем"""
        total_questions = len(heart_data)
        print(f"Начало пакетной обработки {total_questions} сердечно-сосудистых клинических проблем")
        print(f"Размер партии: {batch_size}, Максимальное количество параллельных задач: {max_workers}")

        all_results = {}
        batch_num = 1

        # Обработка по пакетам
        for i in range(0, total_questions, batch_size):
            batch_data = heart_data[i:i + batch_size]
            print(f"\nОбработка партии {batch_num}: Проблема {i+1}-{min(i+batch_size, total_questions)} ({len(batch_data)} штук)")

            batch_start_time = time.time()
            batch_results = self._process_batch(batch_data, max_workers, i)
            batch_end_time = time.time()

            # Сохранение результатов партии
            self._save_batch_results(batch_results, batch_num, batch_start_time)

            all_results.update(batch_results)

            print(f"Пакет {batch_num} завершен, время затрачено: {batch_end_time - batch_start_time:.2f} секунд")

            batch_num += 1

            # Перерыв между пакетами
            if i + batch_size < total_questions:
                print(f"Перерыв между пакетами {batch_delay} секунд...")
                time.sleep(batch_delay)

        print(f"\nВсе пакеты обработаны! Всего обработано {total_questions} вопросов")
        return all_results

    def _process_batch(self, batch_data: List[Dict], max_workers: int, start_index: int) -> Dict:
        """Обработка одного пакета"""
        batch_results = {}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Отправка задания
            future_to_question = {}
            for idx, question_data in enumerate(batch_data):
                # Использовать оригинальный ID или сгенерировать новый ID
                question_id = question_data.get('id', f"cardio_{start_index + idx:06d}")
                future = executor.submit(self.processor.process_single_question, question_data, question_id)
                future_to_question[future] = (question_id, question_data)

            # Сбор результатов
            completed = 0
            for future in as_completed(future_to_question):
                question_id, question_data = future_to_question[future]
                #try:
                result = future.result()
                batch_results[question_id] = result

                # Простое отображение статуса
                status_symbol = "✓" if result.status == "success" else "✗"
                completed += 1
        
                if completed % 5 == 0 or completed == len(batch_data):
                    success_count = sum(1 for r in batch_results.values() if r.status == "success")
                    print(f"  Завершено: {completed}/{len(batch_data)} (Успешно: {success_count}) {status_symbol}")

        return batch_results

    def _save_batch_results(self, batch_results: Dict, batch_num: int, start_time: float):
        """Сохранение результатов пакета"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"cardio_analysis_batch_{batch_num:03d}_{timestamp}.pkl"
        filepath = os.path.join(self.output_dir, filename)

        # Статистическая информация
        total_count = len(batch_results)
        success_count = sum(1 for r in batch_results.values() if r.status == "success")
        error_count = total_count - success_count

        # Построение данных для сохранения
        save_data = {
            "metadata": {
                "batch_num": batch_num,
                "timestamp": timestamp,
                "start_time": start_time,
                "total_questions": total_count,
                "successful_analyses": success_count,
                "failed_analyses": error_count,
                "success_rate": success_count / total_count if total_count > 0 else 0
            },
            "results": batch_results
        }

        # Сохранение в файл
        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)

        print(f"  Результаты пакета сохранены: {filename}")
        print(f"  Успех: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")

        return filepath
```

Запустив вышеупомянутый процесс пакетной обработки, мы отправили все вопросы в области кардиологии LLM для глубокого анализа и собрали возвращенные подробные тексты анализа (включая анализ клинической ситуации, различение вариантов, резюме основных принципов и т.д.), чтобы подготовить данные для следующего этапа извлечения концепций.

**Примечание**: Пожалуйста, заполните свои собственные `api_url`, `api_key` и `model_name` в функции `process_heart_data`.

```python
def process_heart_data(heart_data: List[Dict], api_url: str, api_key: str, model_name: str, max_workers: int = 10, 
                      batch_size: int = 50, output_dir: str = "cardio_analysis"):
    """Удобная функция для обработки heart_data"""
    print(f"Готовлюсь обработать {len(heart_data)} сердечно-сосудистых клинических вопросов")

    # Инициализация API клиента
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )

    # Инициализация обработчика
    processor = CardioAnalysisProcessor(api_client)
    batch_processor = BatchProcessor(processor, output_dir=output_dir)

    # Пакетная обработка
    results = batch_processor.process_questions_list(
        heart_data=heart_data,
        max_workers=max_workers,
        batch_size=batch_size,
        batch_delay=1
    )

    return results
```

```python
# Пакетное извлечение мыслительного процесса каждого qa
# max_workers: количество параллельных запросов к API
# batch_size: сколько раз нужно выполнить запрос к API перед сохранением результатов

results = process_heart_data(heart_data, max_workers=100, batch_size=400, output_dir="cookbooktest", 
                             api_url = api_url,
                             api_key = api_key,
                             model_name = MEDXPERT_THINKER)
textlist = [results[i].response for i in results.keys()]
```

Теперь у нас есть большое количество текстов глубокого анализа, сгенерированных LLM, по вопросам кардиологии. Следующая задача заключается в том, чтобы извлечь все ключевые медицинские концепции из этих неструктурированных текстов. Мы снова используем LLM для выполнения этой задачи, и ключ к успеху по-прежнему заключается в хорошо спроектированном Prompt. `PromptTemplate` был переработан, чтобы направить LLM на роль кардиологического эксперта, следуя ряду строгих принципов извлечения (таких как извлечение ключевых терминов, избегание описательных комбинаций, вывод в стандартном формате JSON и т.д.), чтобы гарантировать, что конечный список концепций будет чистым и стандартизированным.

```python
class PromptTemplate:

    @staticmethod
    def get_system_prompt() -> str:

        return """You are an experienced cardiovascular specialist, skilled in identifying and extracting medical concept terms from clinical texts.

Your task is to extract all relevant concept terms from cardiovascular clinical texts.

Extraction principles:
- Only extract cardiovascular-related medical concepts, terms, and nouns
- Only concept terms, not complete definitions or explanations
- Prefer single core terms (e.g., "myocardial infarction", "hypertension", "echocardiography")
- Use phrases only when they represent standard medical terminology that cannot be meaningfully separated (e.g., "atrial fibrillation", "coronary artery disease")
- Avoid descriptive combinations (e.g., "severe hypertension" → "hypertension")
- Avoid overly vague terms (e.g., "heart problem")
- Include but not limited to disease names, examination methods, drug treatments, anatomical structures, physiological indicators, clinical manifestations, assessment tools, and all other related concepts
- Remove duplicate concepts
- Sort by importance

Please ensure the output format strictly follows JSON format requirements."""

    @staticmethod
    def get_extraction_prompt(text_content: str) -> str:

        return f"""**Task: Extract concept terms from cardiovascular clinical text**

**Please extract all relevant cardiovascular concept terms from the following text:**

---
{text_content}
---

**Output format (strictly follow JSON format):**
```json
{{
"concepts": [
    "concept1",
    "concept2",
    "concept3",
    "..."
]
}}"""
```

После выполнения вышеуказанных шагов мы успешно извлекли предварительный список семенных концепций в области кардиологии из огромного количества текстов анализа. Этот список закладывает прочную основу для последующего итеративного расширения концептуальной карты.

**Пример результата:**

```python
seed_concepts = [
    'blood pressure', 'step-up', 'glucagon', 'therapeutic anticoagulation'...
]
```

### **Метод Итеративного Расширения Концептуальной Карты**

#### **Основная Цель**

Достичь полного охвата целевой области с помощью итеративного расширения концептуальной карты. Мы используем стратегию поэтапного расширения на основе LLM, начиная с набора семенных концепций и постепенно расширяя его, в конечном итоге создавая полную концептуальную карту области.

#### **Итеративный Процесс**

Основной процесс итерации выглядит следующим образом:

- **Вход**: Концептуальная карта, созданная на предыдущем этапе итерации.
- **Обработка**: Для каждого узла концепции в карте предоставляются его собственные и известные соседние концепции в качестве контекстной информации для LLM, и запрашивается у LLM генерация дополнительных концепций, непосредственно связанных с этой центральной концепцией.
- **Выход**: Новые концепции, возвращенные LLM, проходят постобработку (например, удаление дубликатов) и добавляются в концептуальную карту в качестве входных данных для следующего этапа итерации.

#### **Механизм Сходимости и Контрольные Параметры**

С течением итераций новые сгенерированные концепции все больше перекрываются с уже существующими концепциями в карте, что приводит к естественной сходимости процесса итерации. Мы разработали три ключевых параметра для точного контроля этого процесса:

1. **Порог Слияния Похожих Узлов (`similarity_threshold`)**

   * **Механизм**: Использует модель встраивания для вычисления векторного представления концепций, определяя семантическое сходство двух концепций с помощью косинусного сходства.
   * **Действие**: Когда сходство двух концепций превышает установленный порог, они будут объединены в один узел в графе.
   * **Влияние**: Этот параметр напрямую контролирует "гранулярность" концептуальной карты и скорость расширения, что является ключом к балансировке целостности графа и вычислительных затрат.
2. **Темп Растущих Новых Концепций (`new_concept_rate_threshold`)**

   * **Механизм**: Вычисляет долю новых концепций, созданных в текущем раунде, которые отсутствуют в существующей карте (т.е. "совершенно новые").
   * **Действие**: Когда эта доля ниже установленного порога, можно считать, что карта достигает насыщенности по охвату концепций, и итерации могут быть остановлены.
3. **Темп Растущих Новых Ребер (`new_edge_rate_threshold`)**

   * **Механизм**: Вычисляет темп роста количества новых соединений (ребер), созданных в текущем раунде между уже существующими старыми концепциями в графе.
   * **Действие**: Когда сеть отношений между концепциями становится более совершенной, и рост новых соединений значительно замедляется, итерации могут быть остановлены.
   * **Значение**: Этот показатель в основном отражает целостность внутренней структуры концептуальной карты.

#### **Стратегия Выбора Параметров и Анализ Сходимости**

В условиях отсутствия внешних оценочных наборов данных, выбор гиперпараметров и оценка сходимости являются ключевыми вопросами на практике.

1. **Порог Слияния Похожих Узлов (`similarity_threshold`)**: **Ключевой Показатель, Контролирующий Скорость Итерации.**
   Теоретически, можно не проводить слияние похожих узлов, чтобы построить наиболее полную концептуальную карту, но это приведет к огромным вычислительным затратам. Поэтому установка разумного порога имеет решающее значение. Каждый основной узел, который в конечном итоге оказывается в графе, можно понимать как **представительную концепцию** в семантическом пространстве, определенном этим порогом. Этот параметр является основным регулятором для балансировки целостности графа и вычислительной эффективности. Для академических исследований, требующих максимального охвата, можно установить высокий порог (например, 0.95); для практических приложений, ориентированных на соотношение затрат и выгод, можно установить более низкий порог (например, 0.80).
2. **Темп Растущих Новых Концепций**: **Первый Показатель, Сходящийся, Но Могущий Остановиться.**
   По мере итерации темп роста новых концепций будет первым показывать тенденцию к сходимости. Однако на практике было обнаружено, что после достижения определенного уровня этот показатель может остановиться на низком уровне, не приближаясь полностью к нулю. Основная причина этого заключается в том, что LLM, проводя ассоциации концепций, может постепенно "сдвигаться" за строгие границы области. Поэтому нельзя полагаться только на этот показатель для определения завершенности итерации.
3. **Темп Растущих Новых Ребер**: **Итоговый Показатель Стабильной Сходимости.**
   Когда большинство основных концепций целевой области (например, области сердечно-сосудистых заболеваний) уже захвачены, и основные отношения между ними установлены, последующие новые узлы в основном будут находиться на "краю" области. Эти крайние узлы трудно установить новые, значимые связи с старыми узлами в основной зоне графа. Это приводит к стабильному снижению темпа роста новых ребер между старыми концепциями и в конечном итоге к сходимости. В отличие от темпа роста новых концепций, этот показатель меньше подвержен влиянию характеристики "сверхобласти" LLM и является надежным показателем **целостности структуры** концептуальной карты.

**Рекомендации по Практической Стратегии**: При ограниченных затратах использовать сбалансированный `similarity_threshold` (например, 0.80) и наблюдать за кривой сходимости с помощью метода локтя (Elbow Method). Когда темп роста новых концепций и темп роста новых ребер в течение 1-2 раундов не показывают значительных изменений и достигают плато, итерацию можно остановить.

---

### **Основная Реализация Кода**

Мы преобразуем вышеизложенную теорию в систему концептуальной карты, способную к саморазвитию.

#### **1. Основная Структура Данных: Класс `ConceptGraph`**

Основой системы является класс `ConceptGraph`, который представляет собой "умную карту", интегрирующую семантическое понимание и динамические возможности обновления.

* **Инициализация (`__init__`)**: Начинается с группы предварительно обработанных семенных концепций, вычисляются их векторные вложения (embedding), строится начальное состояние графа.
* **Умное удаление дубликатов (`_is_similar_to_existing`)**: Это ключ к контролю качества и масштаба графа. Он использует косинусное сходство семантических векторов, чтобы определить, является ли новая концепция семантически "близкой" к уже существующим концепциям в графе. Концепция будет объединена только в том случае, если сходство превышает установленный `similarity_threshold`.
* **Динамическое обновление (`update_graph`)**: Это основной движущий механизм "роста" графа. Этот метод принимает новые концепции, расширенные LLM, и через механизм умного удаления дубликатов добавляет действительно "новые" концепции в качестве новых узлов в граф, устанавливая связи с исходными концепциями.
* **Мониторинг состояния (`calculate_metrics`, `get_graph_stats`)**: Эти методы отвечают за вычисление определенных нами показателей сходимости (таких как темп роста новых концепций, темп роста новых рёбер) и статистики графа (количество узлов, количество рёбер), что позволяет количественно контролировать эффективность каждой итерации.

```python
class ConceptGraph:
  
    @classmethod
    def from_graph_dict(cls, graph_dict: Dict[str, List[str]], concept_mapping, model, similarity_threshold):
        """
        Восстановление ConceptGraph из сохраненного графа слов
        Args:
            graph_dict: сохраненный словарь смежности
            model: экземпляр модели SentenceTransformer
            similarity_threshold: порог для определения схожих концепций
            concept_mapping: сохраненное отображение всех известных схожих концепций, например, {'hearts':'heart'}
        Returns:
            Экземпляр ConceptGraph
        """
        if model is None:
            raise ValueError("Параметры модели не могут быть None, пожалуйста, сначала используйте load_embedding_model() для загрузки модели")
  
        # Создать экземпляр, но не инициализировать
        instance = cls.__new__(cls)
        instance.model = model
        instance.graph = graph_dict.copy()
        instance.concept_embeddings = {}
        instance.concept_mapping = concept_mapping  
        instance.similarity_threshold = similarity_threshold
  
        # Пересчитать embedding для всех концепций и создать самосопоставление
        all_concepts = list(graph_dict.keys())
        if all_concepts:
            print(f"Пересчитываем embedding для {len(all_concepts)} концепций...")
            all_embeddings = model.encode(all_concepts)
    
            for concept, embedding in zip(all_concepts, all_embeddings):
                instance.concept_embeddings[concept] = embedding
                #instance.concept_mapping[concept] = concept  # Создать самосопоставление
    
            print("ConceptGraph перестроен")
  
        return instance
  
    def __init__(self, seed_concepts: List[str], model, similarity_threshold):
        """
        Инициализировать граф из семенных концепций и создать библиотеку embedding
        Args:
            seed_concepts: Список семенных концепций, уже прошедших внешнее удаление дубликатов
            model: Экземпляр модели SentenceTransformer (обязательно)
            similarity_threshold: порог для определения схожих концепций
        """
        if model is None:
            raise ValueError("Параметры модели не могут быть None, пожалуйста, сначала используйте load_embedding_model() для загрузки модели")
    
        self.model = model
        self.graph = {}
        self.concept_embeddings = {}  # Поддерживать отображение concept -> embedding
        self.concept_mapping = {}     # Добавить таблицу сопоставления концепций
        self.similarity_threshold = similarity_threshold  # Порог сходства embedding
  
        # Очистить семенные концепции
        cleaned_seeds = [concept.strip() for concept in seed_concepts if concept.strip()]
  
        print(f"Вычисляем embedding для {len(cleaned_seeds)} семенных концепций...")
  
        # Пакетное вычисление embedding
        if cleaned_seeds:
            seed_embeddings = self.model.encode(cleaned_seeds)
    
            # Создание Начальной Графа, Библиотеки Встраиваний и Таблицы Соответствий
            for concept, embedding in zip(cleaned_seeds, seed_embeddings):
                self.graph[concept] = []
                self.concept_embeddings[concept] = embedding
                self.concept_mapping[concept] = concept  # Создание Самосоответствия
  
        print(f"Инициализация Концептуальной Карты Завершена, Количество Семенных Концепций: {len(cleaned_seeds)}")
  
    def _get_target_concept(self, concept: str) -> Optional[str]:
        """Единый Поиск Концептуального Соответствия"""
        return self.concept_mapping.get(concept)
  
    def _is_similar_to_existing(self, new_concept: str, new_embedding: np.ndarray) -> Optional[str]:
        """
        Проверка, Похожи Ли Новые Концепции На Существующие
        Returns:
            Если Похожи, Вернуть Похожие Существующие Концепции; Иначе Вернуть None
        """
        if not self.concept_embeddings:
            return None
    
        # Вычисление Сходства Со Всеми Существующими Концепциями
        existing_concepts = list(self.concept_embeddings.keys())
        existing_embeddings = np.array([self.concept_embeddings[concept] for concept in existing_concepts])
  
        # Вычисление Косинусного Сходства
        similarities = self.model.similarity([new_embedding], existing_embeddings)[0]
  
        # Нахождение Самой Похожей Концепции
        max_similarity_idx = np.argmax(similarities)
        max_similarity = similarities[max_similarity_idx]
  
        if max_similarity >= self.similarity_threshold:
            return existing_concepts[max_similarity_idx]
  
        return None
  
    def get_current_adjacency(self) -> Dict[str, List[str]]:
        """Получение Текущего Словаря Смежности"""
        return self.graph.copy()
  
    def calculate_metrics(self, expansion_results: Dict) -> Dict[str, float]:
        """Вычисление Показателя Увеличения"""
        # Сбор Всех Новых Концепций
        all_new_concepts = []
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                all_new_concepts.extend(result.new_concepts)
  
        if not all_new_concepts:
            return {"connectivity_rate": 0.0}
  
        existing_concepts = set(self.graph.keys())
  
        # Связность: Новосозданные Ребра (Оба Являются Существующими Узлами) / Общее Количество Ребер На Предыдущем Этапе
        old_total_edges = sum(len(neighbors) for neighbors in self.graph.values()) // 2
  
        # Подсчет Новосозданных Ребер (Оба Являются Существующими Узлами)
        new_edges_between_old_nodes = 0
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                center_concept = result.center_concept
                for new_concept in result.new_concepts:
                    if (new_concept in existing_concepts and 
                        center_concept != new_concept and
                        new_concept not in self.graph.get(center_concept, [])):
                        new_edges_between_old_nodes += 1
  
        connectivity_rate = new_edges_between_old_nodes / old_total_edges if old_total_edges > 0 else float('inf') 
  
        return {
            "connectivity_rate": connectivity_rate
        }
  
  
    def update_graph(self, expansion_results: Dict):
        """
        Обновление Структуры Графа - Использование Механизма Соответствия Для Удаления Дубликатов
        """
        nodes_added = 0
        edges_added = 0
        embedding_duplicates = 0
  
        # Сбор Всех Новых Концепций
        all_new_concepts = []
        concept_to_centers = {}  # Записывает соответствие каждого нового концепта с центральным концептом
  
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                center_concept = result.center_concept
                for new_concept in result.new_concepts:
                    if new_concept.strip():
                        cleaned_concept = new_concept.strip()
                        all_new_concepts.append(cleaned_concept)
                        if cleaned_concept not in concept_to_centers:
                            concept_to_centers[cleaned_concept] = []
                        concept_to_centers[cleaned_concept].append(center_concept)
  
        if not all_new_concepts:
            return nodes_added, edges_added, embedding_duplicates
  
        num_all_new_concepts = len(all_new_concepts)
        print(f"Получено {num_all_new_concepts} новых концептов (без удаления дубликатов)")
  
        # Используйте отображение для быстрого фильтрации известных концептов
        concepts_need_embedding = []
        concept_targets = {}  # концепт -> целевой_концепт отображение
  
        for concept in all_new_concepts:
            target = self._get_target_concept(concept)
            if target is not None:
                # Известные концепты, используйте отображение напрямую
                concept_targets[concept] = target
                if target != concept:
                    embedding_duplicates += 1
            else:
                # Новые концепты, для которых необходимо вычислить встраивание
                concepts_need_embedding.append(concept)
  
        # Вычисляйте встраивание только для неизвестных концептов
        if concepts_need_embedding:
            unique_concepts = list(set(concepts_need_embedding))
            print(f"В настоящее время выполняется встраивание и удаление дубликатов для {len(unique_concepts)} новых концептов...")
            new_embeddings = self.model.encode(unique_concepts)
    
            # Обрабатывайте концепты, для которых необходимо встраивание, по одному
            total_concepts = len(unique_concepts)
            for idx, (new_concept, new_embedding) in enumerate(zip(unique_concepts, new_embeddings), 1):
                # Выводите прогресс каждые 500
                if idx % 500 == 0 or idx == total_concepts:
                    print(f"  Прогресс обработки: {idx}/{total_concepts} ({idx/total_concepts*100:.1f}%)")
                # Проверьте, похожи ли они на существующие концепты
                similar_concept = self._is_similar_to_existing(new_concept, new_embedding)
        
                if similar_concept:
                    # Обнаружены похожие концепты, создайте отображение
                    self.concept_mapping[new_concept] = similar_concept
                    concept_targets[new_concept] = similar_concept
                    embedding_duplicates += 1
                else:
                    # Совершенно новый концепт, добавьте в граф и создайте самоотображение
                    self.graph[new_concept] = []
                    self.concept_embeddings[new_concept] = new_embedding
                    self.concept_mapping[new_concept] = new_concept
                    concept_targets[new_concept] = new_concept
                    nodes_added += 1
  
        # Добавьте ребра (соедините со всеми связанными центральными концептами)
        for concept in all_new_concepts:
            target_concept = concept_targets[concept]
    
            for center_concept in concept_to_centers[concept]:
                # Убедитесь, что центральная концепция присутствует в графе
                if center_concept in self.graph:
                    # Двунаправленное соединение
                    if target_concept not in self.graph[center_concept]:
                        self.graph[center_concept].append(target_concept)
                        edges_added += 1
            
                    if center_concept not in self.graph[target_concept]:
                        self.graph[target_concept].append(center_concept)
                        edges_added += 1
  
        print(f"Дедупликация завершена: добавленные узлы {nodes_added}, добавленные ребра {edges_added//2}, дедуплицированные концепции {embedding_duplicates}")
  
        return nodes_added, edges_added // 2, embedding_duplicates, nodes_added / num_all_new_concepts  # Ненаправленный граф, количество ребер делится на 2
  
    def get_graph_stats(self) -> Dict[str, int]:
        """Получить статистическую информацию о графе"""
        node_count = len(self.graph)
        edge_count = sum(len(neighbors) for neighbors in self.graph.values()) // 2
        return {"nodes": node_count, "edges": edge_count}
```

#### **2. Полный код процесса расширения**

Полный итерационный процесс состоит из исполняемого "одиночного цикла концептуального расширения", который объединяет несколько компонентов:

* **Утилиты (`ResponseValidator`, `load_embedding_model`)**: Используются для решения распространенных проблем в инженерной практике, таких как исправление некорректного JSON, возвращаемого LLM, загрузка и управление моделями глубокого обучения.
* **Модуль взаимодействия с LLM (`APIClient`, `PromptTemplate`)**: Специально разработанный `PromptTemplate` используется для направления LLM на "ассоциации" и "расширения" на основе существующих концепций в графе.
* **Параллельный процессор (`ConceptExpander`, `BatchConceptExpander`)**: Отвечает за то, чтобы каждый узел концепции в графе рассматривался как отдельная задача, параллельно запрашивая расширение у LLM для обеспечения эффективности обработки.
* **Общий контроль итераций (`run_concept_expansion_iteration`)**: Это верхний уровень функции, отвечающей за координацию всех вышеупомянутых компонентов, полностью выполняя цикл "получить текущий граф -\> параллельное расширение -\> обновить граф -\> вычислить показатели".

```python

# Импорт библиотеки JSON Repair
try:
    from json_repair import repair_json
    HAS_JSONREPAIR = True
    print("✓ Библиотека jsonrepair загружена, функция восстановления JSON включена")
except ImportError:
    HAS_JSONREPAIR = False
    print("⚠ Библиотека jsonrepair не установлена, будет использована базовая стратегия восстановления. Запустите 'pip install jsonrepair' для включения расширенного восстановления JSON")
    def repair_json(text):
        return text

class ResponseValidator:
    """Валидатор ответа"""
  
    @staticmethod
    def validate_json_response(response_text: str, expected_keys: List[str]) -> Dict:
        """
        Проверяет, является ли содержимое ответа API действительным JSON, включая предварительную обработку для устойчивости к ошибкам
  
        Returns:
            dict: {
                "is_valid_json": bool,
                "parsed_json": dict or None,
                "error_type": str,
                "raw_response": str
            }
        """
        if not response_text or not response_text.strip():
            return {
                "is_valid_json": False,
                "parsed_json": None,
                "error_type": "empty_response",
                "raw_response": response_text
            }
  
        repair_attempts = []
  
        try:
            # Предварительная обработка очистки
            text = response_text.strip()
    
            # 1. Обработка блоков кода markdown ```json...``` или ```...```
            code_block_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
            if code_block_match:
                text = code_block_match.group(1).strip()
    
            # 2. Обработка обертки кавычками '...' или "..."
            if (text.startswith("'") and text.endswith("'")) or (text.startswith('"') and text.endswith('"')):
                text = text[1:-1]
    
            # 3. Удаление начальных и конечных обратных кавычек
            text = text.strip('`').strip()
    
            # 4. Поиск части JSON - от первого { до последнего }
            json_match = re.search(r'(\{.*\})', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
    
            # Первая Попытка: Прямой Парсинг
            try:
                parsed = json.loads(text)
                repair_attempts.append("direct_parse_success")
            except json.JSONDecodeError as e:
                repair_attempts.append(f"direct_parse_failed: {str(e)}")
        
                # Вторая Попытка: Парсинг После Исправления С Помощью jsonrepair
                if HAS_JSONREPAIR:
                    try:
                        repaired_text = repair_json(text)
                        parsed = json.loads(repaired_text)
                        repair_attempts.append("jsonrepair_success")
                    except Exception as e:
                        repair_attempts.append(f"jsonrepair_failed: {str(e)}")
                        raise
                else:
                    repair_attempts.append("jsonrepair_not_available")
                    raise
    
            # Проверка Соответствия Ожидаемой Структуре
            if isinstance(parsed, dict) and all(key in parsed for key in expected_keys):
                return {
                    "is_valid_json": True,
                    "parsed_json": parsed,
                    "error_type": None,
                    "raw_response": response_text,
                    "repair_attempts": repair_attempts
                }
            else:
                missing_keys = [key for key in expected_keys if key not in parsed] if isinstance(parsed, dict) else expected_keys
                return {
                    "is_valid_json": False,
                    "parsed_json": parsed,
                    "error_type": f"missing_keys: expected {expected_keys}, missing {missing_keys}",
                    "raw_response": response_text,
                    "repair_attempts": repair_attempts
                }
        
        except json.JSONDecodeError as e:
            return {
                "is_valid_json": False,
                "parsed_json": None,
                "error_type": f"json_decode_error: {str(e)}",
                "raw_response": response_text,
                "repair_attempts": repair_attempts
            }
        except Exception as e:
            return {
                "is_valid_json": False,
                "parsed_json": None,
                "error_type": f"unexpected_error: {str(e)}",
                "raw_response": response_text,
                "repair_attempts": repair_attempts
            }

# Код Итерации Расширения Графа На Основе Концепции Семени

@dataclass
class ConceptExpansionResult:
    """Класс Данных Результатов Расширения Концепции"""
    status: str  # success, api_error, json_error
    concept_id: str
    center_concept: str
    neighbors: List[str]
    response: Optional[str] = None
    error_details: Optional[str] = None
    processing_time: Optional[float] = None
    json_validation: Optional[Dict] = None
    new_concepts: Optional[List[str]] = None
    returned_center: Optional[str] = None  # LLM Возвращенный center_concept

class PromptTemplate:
    """Класс шаблона подсказок"""

    @staticmethod
    def get_system_prompt() -> str:
        """Получить Системные Подсказки"""
        return """You are an experienced cardiovascular specialist, skilled in building comprehensive concept graphs for the cardiovascular domain.

Your task is to expand a cardiovascular concept graph by generating new related concepts based on a given center concept and its existing connections."""

    @staticmethod
    def get_expansion_prompt(center_concept: str, neighbors: List[str]) -> str:
        """Сгенерировать Подсказки Для Расширения Концепции"""
        neighbors_text = ", ".join(neighbors) if neighbors else "None"
  
        return f"""**Task: Generate new cardiovascular concepts related to the center concept**

**Domain**: Cardiovascular medicine
**Relationship requirement**: New concepts should be directly related to the center concept through strong clinical medical associations

**Center concept**: {center_concept}
**Existing neighbor concepts of the center concept**: {neighbors_text}

**Output format (strictly follow JSON format):**

{{
  "center_concept": "{center_concept}",
  "new_concepts": [
    "concept1",
    "concept2",
    "concept3",
    "..."
  ]
}}


If no new concepts can be generated:

{{
  "center_concept": "{center_concept}",
  "new_concepts": ["NO NEW CONCEPTS"]
}}

**Instructions**:

1. Instead of generate general medical concept, focus on generating new cardiovascular-domain concepts that are directly relevant in clinical scenarios to "{center_concept}" with strong clinical medical relation
2. Do not repeat any existing connected concepts listed above
3. Prefer single core terms (e.g., "myocardial infarction", "hypertension", "echocardiography")
4. Use phrases only when they represent standard medical terminology that cannot be meaningfully separated (e.g., "atrial fibrillation", "coronary artery disease")
5. Avoid descriptive combinations (e.g., "severe hypertension" → "hypertension")
6. Avoid overly vague terms (e.g., "heart problem")
7. Generate concepts that are directly related to the center concept
8. Do not repeat any existing connected concepts listed above; Avoid duplicate concepts"""

class ConceptExpander:
    """Обработчик Расширения Концепции"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client
        self.template = PromptTemplate()

    def expand_single_concept(self, center_concept: str, neighbors: List[str], concept_id: str) -> ConceptExpansionResult:
        """Расширить Одну Концепцию"""
        start_time = time.time()
  
        # Формирование сообщения
        system_prompt = self.template.get_system_prompt()
        user_prompt = self.template.get_expansion_prompt(center_concept, neighbors)
  
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Вызов API
        api_result = self.api_client.call_api(messages, timeout=120)
        processing_time = time.time() - start_time

        if api_result["status"] != "success":
            return ConceptExpansionResult(
                status="api_error",
                concept_id=concept_id,
                center_concept=center_concept,
                neighbors=neighbors,
                error_details=api_result["error"],
                processing_time=processing_time
            )

        # Проверка JSON Ответа
        expected_keys = ["center_concept", "new_concepts"]
        json_validation = ResponseValidator.validate_json_response(
            api_result["content"], expected_keys
        )
  
        if json_validation["is_valid_json"]:
            returned_center = json_validation["parsed_json"]["center_concept"]
            new_concepts = json_validation["parsed_json"]["new_concepts"]
    
            # Проверка На Случай "Нет Новых Концепций"
            if len(new_concepts) == 1 and new_concepts[0].strip() == "NO NEW CONCEPTS":
                return ConceptExpansionResult(
                    status="success",
                    concept_id=concept_id,
                    center_concept=center_concept,
                    neighbors=neighbors,
                    response=api_result["content"],
                    processing_time=processing_time,
                    json_validation=json_validation,
                    new_concepts=[],  # Пустой Список, Указывающий На Отсутствие Новых Концепций
                    returned_center=returned_center
                )
    
            # Обычная Обработка Новых Концепций - Удаление Предыдущей Логики Фильтрации, Передача На Embedding Для Удаления Дубликатов
            new_concepts = [concept.strip() for concept in new_concepts if concept.strip()]
    
            return ConceptExpansionResult(
                status="success",
                concept_id=concept_id,
                center_concept=center_concept,
                neighbors=neighbors,
                response=api_result["content"],
                processing_time=processing_time,
                json_validation=json_validation,
                new_concepts=new_concepts,
                returned_center=returned_center
            )
        else:
            return ConceptExpansionResult(
                status="json_error",
                concept_id=concept_id,
                center_concept=center_concept,
                neighbors=neighbors,
                response=api_result["content"],
                error_details=f"JSON validation failed: {json_validation['error_type']}",
                processing_time=processing_time,
                json_validation=json_validation
            )

class BatchConceptExpander:
    """Обработчик Массового Расширения Концепций"""
    def __init__(self, expander: ConceptExpander, output_dir: str = "concept_expansion"):
        self.expander = expander
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def expand_concepts_batch(self, adjacency_dict: Dict[str, List[str]], max_workers: int = 10) -> Dict:
        """Концепция Масштабного Увеличения"""
        concepts_to_expand = list(adjacency_dict.keys())
        total_concepts = len(concepts_to_expand)
        print(f"Начало Масштабного Увеличения Концепций {total_concepts} Концепций")
        print(f"Максимальная Параллельность: {max_workers}")

        batch_start_time = time.time()
        batch_results = self._process_batch(concepts_to_expand, adjacency_dict, max_workers)
        batch_end_time = time.time()

        print(f"Обработка Завершена, Время: {batch_end_time - batch_start_time:.2f} Секунд")
        return batch_results

    def _process_batch(self, batch_concepts: List[str], adjacency_dict: Dict[str, List[str]], 
                      max_workers: int) -> Dict:
        """Обработка Партии"""
        batch_results = {}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Отправка задания
            future_to_concept = {}
            for idx, concept in enumerate(batch_concepts):
                concept_id = f"concept_{idx:06d}"
                neighbors = adjacency_dict.get(concept, [])
                future = executor.submit(self.expander.expand_single_concept, concept, neighbors, concept_id)
                future_to_concept[future] = (concept_id, concept)

            # Сбор результатов
            completed = 0
            for future in as_completed(future_to_concept):
                concept_id, concept = future_to_concept[future]
                try:
                    result = future.result()
                    batch_results[concept_id] = result

                    # Простое Отображение Состояния
                    status_symbol = "✓" if result.status == "success" else "✗"
                    completed += 1
            
                    if completed % 1000 == 0 or completed == len(batch_concepts):
                        success_count = sum(1 for r in batch_results.values() if r.status == "success")
                        print(f"  Завершено: {completed}/{len(batch_concepts)} (Успешно: {success_count}) {status_symbol}")

                except Exception as e:
                    batch_results[concept_id] = ConceptExpansionResult(
                        status="exception",
                        concept_id=concept_id,
                        center_concept=concept,
                        neighbors=adjacency_dict.get(concept, []),
                        error_details=str(e)
                    )
                    print(f"  Исключение: {concept_id} - {str(e)}")

        return batch_results

    def _save_results(self, batch_results: Dict, start_time: float):
        """Сохранение Результатов"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"concept_expansion_results_{timestamp}.pkl"
        filepath = os.path.join(self.output_dir, filename)

        # Статистическая информация
        total_count = len(batch_results)
        success_count = sum(1 for r in batch_results.values() if r.status == "success")
        error_count = total_count - success_count

        # Подсчет Сгенерированных Концепций
        total_new_concepts = sum(len(r.new_concepts) for r in batch_results.values() 
                               if r.status == "success" and r.new_concepts)
  
        # Подсчет Пропущенных Концепций (без Новых Концепций)
        skipped_concepts = sum(1 for r in batch_results.values() 
                              if r.status == "success" and r.new_concepts is not None and len(r.new_concepts) == 0)

        # Построение данных для сохранения
        save_data = {
            "metadata": {
                "timestamp": timestamp,
                "start_time": start_time,
                "total_concepts": total_count,
                "successful_expansions": success_count,
                "failed_expansions": error_count,
                "success_rate": success_count / total_count if total_count > 0 else 0,
                "total_new_concepts": total_new_concepts,
                "skipped_concepts": skipped_concepts
            },
            "results": batch_results
        }

        # Сохранение в файл
        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)

        print(f"  Результаты Сохранены: {filename}")
        print(f"  Успех: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
        print(f"  Общее Количество Новых Концепций: {total_new_concepts}")
        print(f"  Пропущенные Концепции: {skipped_concepts}")

        return filepath

class ConceptGraph:
  
    @classmethod
    def from_graph_dict(cls, graph_dict: Dict[str, List[str]], concept_mapping, model, similarity_threshold):
        """
        Восстановление ConceptGraph из сохраненного графа слов
        Args:
            graph_dict: сохраненный словарь смежности
            model: экземпляр модели SentenceTransformer
            similarity_threshold: порог для определения схожих концепций
            concept_mapping: сохраненное отображение всех известных схожих концепций, например, {'hearts':'heart'}
        Returns:
            Экземпляр ConceptGraph
        """
        if model is None:
            raise ValueError("Параметры модели не могут быть None, пожалуйста, сначала используйте load_embedding_model() для загрузки модели")
  
        # Создать экземпляр, но не инициализировать
        instance = cls.__new__(cls)
        instance.model = model
        instance.graph = graph_dict.copy()
        instance.concept_embeddings = {}
        instance.concept_mapping = concept_mapping  
        instance.similarity_threshold = similarity_threshold
  
        # Пересчитать embedding для всех концепций и создать самосопоставление
        all_concepts = list(graph_dict.keys())
        if all_concepts:
            print(f"Пересчитываем embedding для {len(all_concepts)} концепций...")
            all_embeddings = model.encode(all_concepts)
    
            for concept, embedding in zip(all_concepts, all_embeddings):
                instance.concept_embeddings[concept] = embedding
                #instance.concept_mapping[concept] = concept  # Создать самосопоставление
    
            print("ConceptGraph перестроен")
  
        return instance
  
    def __init__(self, seed_concepts: List[str], model, similarity_threshold):
        """
        Инициализировать граф из семенных концепций и создать библиотеку embedding
        Args:
            seed_concepts: Список семенных концепций, уже прошедших внешнее удаление дубликатов
            model: Экземпляр модели SentenceTransformer (обязательно)
            similarity_threshold: порог для определения схожих концепций
        """
        if model is None:
            raise ValueError("Параметры модели не могут быть None, пожалуйста, сначала используйте load_embedding_model() для загрузки модели")
    
        self.model = model
        self.graph = {}
        self.concept_embeddings = {}  # Поддерживать отображение concept -> embedding
        self.concept_mapping = {}     # Добавить таблицу сопоставления концепций
        self.similarity_threshold = similarity_threshold  # Порог сходства embedding
  
        # Очистить семенные концепции
        cleaned_seeds = [concept.strip() for concept in seed_concepts if concept.strip()]
  
        print(f"Вычисляем embedding для {len(cleaned_seeds)} семенных концепций...")
  
        # Пакетное вычисление embedding
        if cleaned_seeds:
            seed_embeddings = self.model.encode(cleaned_seeds)
    
            # Создание Начальной Графа, Библиотеки Встраиваний и Таблицы Соответствий
            for concept, embedding in zip(cleaned_seeds, seed_embeddings):
                self.graph[concept] = []
                self.concept_embeddings[concept] = embedding
                self.concept_mapping[concept] = concept  # Создание Самосоответствия
  
        print(f"Инициализация Концептуальной Карты Завершена, Количество Семенных Концепций: {len(cleaned_seeds)}")
  
    def _get_target_concept(self, concept: str) -> Optional[str]:
        """Единый Поиск Концептуального Соответствия"""
        return self.concept_mapping.get(concept)
  
    def _is_similar_to_existing(self, new_concept: str, new_embedding: np.ndarray) -> Optional[str]:
        """
        Проверка, Похожи Ли Новые Концепции На Существующие
        Returns:
            Если Похожи, Вернуть Похожие Существующие Концепции; Иначе Вернуть None
        """
        if not self.concept_embeddings:
            return None
    
        # Вычисление Сходства Со Всеми Существующими Концепциями
        existing_concepts = list(self.concept_embeddings.keys())
        existing_embeddings = np.array([self.concept_embeddings[concept] for concept in existing_concepts])
  
        # Вычисление Косинусного Сходства
        similarities = self.model.similarity([new_embedding], existing_embeddings)[0]
  
        # Нахождение Самой Похожей Концепции
        max_similarity_idx = np.argmax(similarities)
        max_similarity = similarities[max_similarity_idx]
  
        if max_similarity >= self.similarity_threshold:
            return existing_concepts[max_similarity_idx]
  
        return None
  
    def get_current_adjacency(self) -> Dict[str, List[str]]:
        """Получение Текущего Словаря Смежности"""
        return self.graph.copy()
  
    def calculate_metrics(self, expansion_results: Dict) -> Dict[str, float]:
        """Вычисление Показателя Увеличения"""
        # Сбор Всех Новых Концепций
        all_new_concepts = []
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                all_new_concepts.extend(result.new_concepts)
  
        if not all_new_concepts:
            return {"connectivity_rate": 0.0}
  
        existing_concepts = set(self.graph.keys())
  
        # Связность: Новосозданные Ребра (Оба Являются Существующими Узлами) / Общее Количество Ребер На Предыдущем Этапе
        old_total_edges = sum(len(neighbors) for neighbors in self.graph.values()) // 2
  
        # Подсчет Новосозданных Ребер (Оба Являются Существующими Узлами)
        new_edges_between_old_nodes = 0
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                center_concept = result.center_concept
                for new_concept in result.new_concepts:
                    if (new_concept in existing_concepts and 
                        center_concept != new_concept and
                        new_concept not in self.graph.get(center_concept, [])):
                        new_edges_between_old_nodes += 1
  
        connectivity_rate = new_edges_between_old_nodes / old_total_edges if old_total_edges > 0 else float('inf') 
  
        return {
            "connectivity_rate": connectivity_rate
        }
  
  
    def update_graph(self, expansion_results: Dict):
        """
        Обновление Структуры Графа - Использование Механизма Соответствия Для Удаления Дубликатов
        """
        nodes_added = 0
        edges_added = 0
        embedding_duplicates = 0
  
        # Сбор Всех Новых Концепций
        all_new_concepts = []
        concept_to_centers = {}  # Записывает соответствие каждого нового концепта с центральным концептом
  
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                center_concept = result.center_concept
                for new_concept in result.new_concepts:
                    if new_concept.strip():
                        cleaned_concept = new_concept.strip()
                        all_new_concepts.append(cleaned_concept)
                        if cleaned_concept not in concept_to_centers:
                            concept_to_centers[cleaned_concept] = []
                        concept_to_centers[cleaned_concept].append(center_concept)
  
        if not all_new_concepts:
            return nodes_added, edges_added, embedding_duplicates
  
        num_all_new_concepts = len(all_new_concepts)
        print(f"Получено {num_all_new_concepts} новых концептов (без удаления дубликатов)")
  
        # Используйте отображение для быстрого фильтрации известных концептов
        concepts_need_embedding = []
        concept_targets = {}  # концепт -> целевой_концепт отображение
  
        for concept in all_new_concepts:
            target = self._get_target_concept(concept)
            if target is not None:
                # Известные концепты, используйте отображение напрямую
                concept_targets[concept] = target
                if target != concept:
                    embedding_duplicates += 1
            else:
                # Новые концепты, для которых необходимо вычислить встраивание
                concepts_need_embedding.append(concept)
  
        # Вычисляйте встраивание только для неизвестных концептов
        if concepts_need_embedding:
            unique_concepts = list(set(concepts_need_embedding))
            print(f"В настоящее время выполняется встраивание и удаление дубликатов для {len(unique_concepts)} новых концептов...")
            new_embeddings = self.model.encode(unique_concepts)
    
            # Обрабатывайте концепты, для которых необходимо встраивание, по одному
            total_concepts = len(unique_concepts)
            for idx, (new_concept, new_embedding) in enumerate(zip(unique_concepts, new_embeddings), 1):
                # Выводите прогресс каждые 500
                if idx % 500 == 0 or idx == total_concepts:
                    print(f"  Прогресс обработки: {idx}/{total_concepts} ({idx/total_concepts*100:.1f}%)")
                # Проверьте, похожи ли они на существующие концепты
                similar_concept = self._is_similar_to_existing(new_concept, new_embedding)
        
                if similar_concept:
                    # Обнаружены похожие концепты, создайте отображение
                    self.concept_mapping[new_concept] = similar_concept
                    concept_targets[new_concept] = similar_concept
                    embedding_duplicates += 1
                else:
                    # Совершенно новый концепт, добавьте в граф и создайте самоотображение
                    self.graph[new_concept] = []
                    self.concept_embeddings[new_concept] = new_embedding
                    self.concept_mapping[new_concept] = new_concept
                    concept_targets[new_concept] = new_concept
                    nodes_added += 1
  
        # Добавьте ребра (соедините со всеми связанными центральными концептами)
        for concept in all_new_concepts:
            target_concept = concept_targets[concept]
    
            for center_concept in concept_to_centers[concept]:
                # Убедитесь, что центральная концепция присутствует в графе
                if center_concept in self.graph:
                    # Двунаправленное соединение
                    if target_concept not in self.graph[center_concept]:
                        self.graph[center_concept].append(target_concept)
                        edges_added += 1
            
                    if center_concept not in self.graph[target_concept]:
                        self.graph[target_concept].append(center_concept)
                        edges_added += 1
  
        print(f"Дедупликация завершена: добавленные узлы {nodes_added}, добавленные ребра {edges_added//2}, дедуплицированные концепции {embedding_duplicates}")
  
        return nodes_added, edges_added // 2, embedding_duplicates, nodes_added / num_all_new_concepts  # Ненаправленный граф, количество ребер делится на 2
  
    def get_graph_stats(self) -> Dict[str, int]:
        """Получить статистическую информацию о графе"""
        node_count = len(self.graph)
        edge_count = sum(len(neighbors) for neighbors in self.graph.values()) // 2
        return {"nodes": node_count, "edges": edge_count}

def load_embedding_model(model_name: str = "nomic-ai/nomic-embed-text-v1.5"):
    """
    Загрузка Модели Встраивания
    Args:
        model_name: Название Модели
    Returns:
        Экземпляр Модели SentenceTransformer
    """
    print(f"Загрузка embedding модели: {model_name}")
    model = SentenceTransformer(model_name, trust_remote_code=True)
    print("Модель загружена")
    return model

def extract_seed_concepts(results):
    """Извлечение начальных концепций из результатов пакетной обработки"""
    all_concepts = []
  
    for result in results.values():
        if result.status == "success" and result.extracted_concepts:
            all_concepts.extend(result.extracted_concepts)
  
    # Удаление пробелов и дубликатов
    seed_concepts = list(set(concept.strip() for concept in all_concepts if concept.strip()))
  
    return seed_concepts

def run_concept_expansion_iteration(api_url: str, api_key: str, model_name: str, concept_graph: ConceptGraph, max_workers: int = 10):
    """Запуск итерации расширения концепций один раз"""
    # Инициализация API клиента и обработчика
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )
  
    expander = ConceptExpander(api_client)
    batch_expander = BatchConceptExpander(expander)
  
    # Получение текущего словаря смежности
    current_adjacency = concept_graph.get_current_adjacency()
  
    # Пакетное расширение концепций
    expansion_results = batch_expander.expand_concepts_batch(
        adjacency_dict=current_adjacency,
        max_workers=max_workers
    )
  
    # Расчет метрик
    metrics = concept_graph.calculate_metrics(expansion_results)
  
    # Обновление графа - удаление дубликатов с использованием embedding
    nodes_added, edges_added, embedding_duplicates, concept_add_rate = concept_graph.update_graph(expansion_results)

    # Получение статистики обновленного графа
    graph_stats = concept_graph.get_graph_stats()
  
    # Подсчет количества пропущенных концепций
    skipped_count = sum(1 for r in expansion_results.values() 
                       if r.status == "success" and r.new_concepts is not None and len(r.new_concepts) == 0)
  
    # Печать результатов
    print(f"\n=== Итерация Завершена ===")
    print(f"Обновление Концепции: {concept_add_rate:.3f}")
    print(f"Связность Концепции: {metrics['connectivity_rate']:.3f}")
    print(f"Количество Узлов В Конце Итерации: {graph_stats['nodes']}")
    print(f"Количество Ребер В Конце Итерации: {graph_stats['edges']}")
    print(f"Добавленные Узлы В Этот Раунд: {nodes_added}")
    print(f"Количество Добавленных Ребер В Этот Раунд: {edges_added}")
    print(f"Пропущенные Концепции: {skipped_count}")
  
    return {
        "concept_add_rate": concept_add_rate,
        "connectivity_rate": metrics['connectivity_rate'],
        "graph_stats": graph_stats,
        "nodes_added": nodes_added,
        "edges_added": edges_added,
        "embedding_duplicates": embedding_duplicates,
        "skipped_count": skipped_count,
        "expansion_results": expansion_results
    }
```

### **Запуск расширения: Подготовка и выполнение**

Перед запуском масштабной итерации мы проводим внутреннее семантическое удаление дубликатов для начального списка `seed_concepts`. Функция `deduplicate_seed_concepts` сравнивает семантическое сходство всех семенных концепций попарно и отбрасывает дублирующие концепции с слишком высоким сходством, чтобы обеспечить чистоту начального графа.

После очистки мы используем этот качественный набор семян для официального создания экземпляра `ConceptGraph`, готовясь к первому раунду расширения.

Загрузка embedding model для фильтрации схожих семенных концепций:

```python
import json
import pickle
import time
import torch
import numpy as np
from sentence_transformers import SentenceTransformer
from datetime import datetime

device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Инициализация Модели, Используя Устройство: {device}")
model = SentenceTransformer(EMBEDDING_MODEL, trust_remote_code=True, device=device)
print("Инициализация Модели Завершена")
```

Инициализация concept_graph на основе семенных концепций:

```python

import random
import numpy as np

def deduplicate_seed_concepts(seed_concepts, model, similarity_threshold=0.95):
    """Удаление Дубликатов Из Начальных Концепций, Сходство > Пороговое Значение, Случайно Сохраняем Одну"""
  
    embeddings = model.encode(seed_concepts)
    similarities = model.similarity(embeddings, embeddings)
    similarities = similarities.cpu().numpy()
  
    to_remove = set()
    n = len(seed_concepts)
  
    for i in range(n):
        for j in range(i+1, n):
            if similarities[i][j] > similarity_threshold:
                # Сходство Превышает Порог, Случайно Выбираем Одну Для Удаления
                remove_idx = random.choice([i, j])
                to_remove.add(remove_idx)
                print(f"Сходные Концепции: '{seed_concepts[i]}' vs '{seed_concepts[j]}' (Сходство: {similarities[i][j]:.4f})")
                print(f"  -> Удалить: '{seed_concepts[remove_idx]}'")
  
    filtered_concepts = [concept for i, concept in enumerate(seed_concepts) if i not in to_remove]
  
    print(f"\nРезультаты Удаления Дубликатов: {len(seed_concepts)} -> {len(filtered_concepts)} Концепций")
    print(f"Удалено {len(to_remove)} схожих концепций")
  
    return filtered_concepts

# Пример Использования
filtered_seed_concepts = deduplicate_seed_concepts(seed_concepts, model, similarity_threshold=0.8)
concept_graph = ConceptGraph(filtered_seed_concepts, model, similarity_threshold=0.8)
```

Повторно выполняя функцию `run_concept_expansion_iteration`, мы можем завершить несколько раундов расширения. После завершения каждого раунда расширения мы рекомендуем сохранять обновленную структуру графа (`graph_dict`) и таблицу сопоставления концепций (`concept_mapping`) в постоянное хранилище в виде файлов `.pkl`, чтобы предотвратить потерю результатов длительной работы из-за неожиданных прерываний. Этот процесс будет продолжаться до тех пор, пока предустановленные показатели сходимости не достигнут порогового значения.

## Конкретный процесс одиночного расширения графа

```python
# Пример Кода Для Одной Итерации

domain = 'Cardio'

# Убедитесь, что каталог для сохранения существует
save_dir = f'cookbooktest/{domain}'
os.makedirs(save_dir, exist_ok=True)

iter_n = 1

results = run_concept_expansion_iteration(model_name=CONCEPT_GRAPH_EXTENDER, concept_graph=concept_graph, max_workers = 100,
                                          api_url=api_url,
                                          api_key=api_key)



# Получите смежный список графа
graph_dict = concept_graph.graph

# Сохранить в формате pickle
with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter.pkl', 'wb') as f:
    pickle.dump(graph_dict, f)

# Получите смежный список графа
concept_mapping = concept_graph.concept_mapping
# Сохранить в формате pickle
with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter_concept_mapping.pkl', 'wb') as f:
    pickle.dump(concept_mapping, f)


# Повторите для большего количества итераций··· Практический опыт показывает, что до 10 раз граф уже должен быть достаточно большим, чтобы сойтись.
# Цикл кода, только для справки
# Поскольку стоимость расширения графа увеличивается с увеличением числа итераций, мы настоятельно рекомендуем вам вручную выполнять итерации по кругам и после каждой итерации проверять покрытие текущего графа концепций на основе вашей собственной библиотеки концепций для валидации, чтобы определить количество итераций для завершения
# В отсутствие библиотеки концепций для валидации вы можете обратиться к (a) покрытие новых концепций = количество новых узлов в этом раунде / количество новых концепций, полученных в этом раунде (b) связность концепций как индикатор завершения сходимости
'''
MAX_ITER = 10             # Максимальное количество итераций
CONCEPT_ADD_THRESHOLD = 0.05   # Нижний предел добавления концепций
CONNECTIVITY_THRESHOLD = 0.2  # Нижний предел связности

domain = 'Cardio'
save_dir = f'cookbooktest/{domain}'

for iter_n in range(1, MAX_ITER + 1):
    print(f"\n===== Iteration {iter_n} =====")
  
    # Выполните одну итерацию расширения концепций
    results = run_concept_expansion_iteration(
        model_name=CONCEPT_GRAPH_EXTENDER,
        concept_graph=concept_graph,
        max_workers=100,
        api_url=api_url,
        api_key=api_key
    )

    # Извлечение метрик
    concept_add_rate = results["concept_add_rate"]
    connectivity_rate = results["connectivity_rate"]

    # Сохранить граф смежности
    graph_dict = concept_graph.graph
    with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter.pkl', 'wb') as f:
        pickle.dump(graph_dict, f)

    # Сохранить концептуальную карту
    concept_mapping = concept_graph.concept_mapping
    with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter_concept_mapping.pkl', 'wb') as f:
        pickle.dump(concept_mapping, f)

    # Условие OR для досрочного завершения
    if (concept_add_rate < CONCEPT_ADD_THRESHOLD) or (connectivity_rate < CONNECTIVITY_THRESHOLD):
        print(f"Остановить итерацию: удовлетворяет условию остановки (concept_add_rate<{CONCEPT_ADD_THRESHOLD} или connectivity_rate<{CONNECTIVITY_THRESHOLD}）")
        break
'''
```

### **Экспериментальные данные и оценка**

Мы провели всестороннюю экспериментальную проверку в двух медицинских областях: кардиологии (cardio) и респираторной системе (respiratory), используя модели GPT-4o-mini и GPT-4o, проводя многократные итерации расширения при различных порогах сходства (0.8, 0.85, 0.9). Метод проверки заключался в извлечении ключевых слов из медицинских статей соответствующей области на Википедии и вычислении охвата концептуальной графики.

#### **Настройки эксперимента**

- **Набор данных**: Область кардиологии (cardio), область респираторной системы (respiratory)
- **Модели**: GPT-4o-mini, GPT-4o
- **Порог сходства**: 0.8, 0.85, 0.9
- **Показатели оценки**: Охват ключевых слов Википедии (при порогах 0.8, 0.85, 0.9)
- **Базовая стоимость**: Завершение 8 раундов итераций моделью GPT-4o-mini обошлось примерно в $20

#### **Описание показателей**

- **Количество Узлов**: Общее количество концепций, которые были рассмотрены (включая концепции, признанные схожими + концепции, оставленные в графе)
- **Количество Ребер**: Общее количество ребер в концептуальной карте
- **Коэффициент Новых Концепций**: Количество новых узлов в концептуальной карте / Общее количество концепций, созданных в текущем раунде
- **Коэффициент Новых Ребер**: Количество новых ребер между старыми узлами / Количество ребер между старыми узлами до появления новых ребер
- **Оценка Стоимости**: Расчет общего количества концепций, созданных в текущем и предыдущих раундах, с использованием тарифов gpt-4o-mini за 8 раундов итерации

#### **Результаты Экспериментов в Области Сердечно-Сосудистых Заболеваний**

| Модель      | Порог | Эпохи | Количество Узлов | Количество Ребер | Покрытие@0.8 | Покрытие@0.85 | Покрытие@0.9 | Уровень Новых Концепций | Уровень Новых Ребер | Оценка Стоимости |
| ----------- | ---- | ---- | ------ | ------- | ---------- | ----------- | ---------- | -------- | ------ | -------- |
| GPT-4o-mini | 0.8  | 1    | 7,797  | 23,284  | 89.67%     | 79.73%      | 66.12%     | 10.05%   | 0.00%  | $0.83    |
| GPT-4o-mini | 0.8  | 2    | 16,066 | 63,712  | 93.79%     | 86.13%      | 76.00%     | 7.20%    | 49.50% | $2.37    |
| GPT-4o-mini | 0.8  | 3    | 28,737 | 132,451 | 95.49%     | 89.67%      | 80.58%     | 5.50%    | 33.40% | $5.06    |
| GPT-4o-mini | 0.8  | 4    | 47,255 | 239,751 | 96.21%     | 92.09%      | 83.52%     | 4.56%    | 25.60% | $9.32    |
| GPT-4o-mini | 0.8  | 5    | 73,359 | 397,872 | 96.73%     | 93.79%      | 86.46%     | 3.79%    | 21.10% | $15.68   |
| GPT-4o      | 0.8  | 1    | 7,232  | 20,577  | 90.91%     | 80.97%      | 68.61%     | 9.68%    | 0.00%  | $7.34    |
| GPT-4o      | 0.8  | 2    | 14,574 | 55,559  | 94.57%     | 88.82%      | 78.68%     | 7.51%    | 46.20% | $20.41   |
| GPT-4o      | 0.8  | 3    | 23,488 | 102,429 | 95.95%     | 91.50%      | 82.01%     | 6.15%    | 23.80% | $37.94   |
| GPT-4o      | 0.8  | 4    | 40,030 | 188,292 | 97.32%     | 94.31%      | 86.20%     | 5.30%    | 23.50% | $70.82   |
| GPT-4o      | 0.8  | 5    | 64,807 | 317,772 | 97.97%     | 95.36%      | 88.82%     | 4.45%    | 18.80% | $120.80  |
| GPT-4o      | 0.85 | 1    | 8,750  | 29,200  | 92.22%     | 84.43%      | 72.73%     | 9.96%    | 0.00%  | $10.34   |
| GPT-4o      | 0.85 | 2    | 17,570 | 79,784  | 95.88%     | 90.97%      | 81.56%     | 9.11%    | 70.90% | $28.58   |
| GPT-4o      | 0.85 | 3    | 32,217 | 172,894 | 96.99%     | 93.66%      | 86.46%     | 7.36%    | 49.40% | $62.47   |
| GPT-4o      | 0.85 | 4    | 55,586 | 328,126 | 97.78%     | 95.29%      | 89.60%     | 6.31%    | 37.90% | $119.19  |

#### **Результаты Экспериментов в Области Дыхательной Системы**

| Модель      | Порог | Эпохи | Количество Узлов | Количество Ребер | Покрытие@0.8 | Покрытие@0.85 | Покрытие@0.9 | Уровень Новых Концепций | Уровень Новых Ребер | Оценка Стоимости |
| ----------- | ---- | ---- | ------- | ------- | ---------- | ----------- | ---------- | -------- | ------- | -------- |
| GPT-4o-mini | 0.8  | 1    | 4,683   | 13,569  | 84.07%     | 74.32%      | 61.11%     | 11.27%   | 0.00%   | $0.49    |
| GPT-4o-mini | 0.8  | 2    | 9,736   | 38,374  | 89.20%     | 82.08%      | 69.71%     | 7.92%    | 56.00%  | $1.42    |
| GPT-4o-mini | 0.8  | 3    | 17,893  | 81,567  | 92.56%     | 87.21%      | 76.10%     | 6.10%    | 36.70%  | $3.11    |
| GPT-4o-mini | 0.8  | 4    | 30,231  | 150,979 | 94.55%     | 89.62%      | 79.98%     | 4.96%    | 28.30%  | $2.76    |
| GPT-4o-mini | 0.8  | 5    | 48,032  | 255,740 | 96.23%     | 91.40%      | 82.08%     | 4.08%    | 23.20%  | $6.96    |
| GPT-4o-mini | 0.8  | 6    | 73,308  | 405,320 | 96.96%     | 92.87%      | 84.38%     | 3.69%    | 19.20%  | $13.02   |
| GPT-4o-mini | 0.8  | 7    | 108,026 | 613,808 | 97.27%     | 93.92%      | 87.42%     | 3.23%    | 16.60%  | $8.49    |
| GPT-4o-mini | 0.8  | 8    | 153,963 | 894,902 | 97.80%     | 94.76%      | 89.10%     | 2.88%    | 14.50%  | $20.00   |
| GPT-4o-mini | 0.85 | 1    | 5,334   | 17,158  | 86.79%     | 77.36%      | 64.47%     | 12.35%   | 0.00%   | $0.61    |
| GPT-4o-mini | 0.85 | 2    | 11,312  | 50,003  | 90.99%     | 84.07%      | 72.54%     | 9.56%    | 71.00%  | $1.75    |
| GPT-4o-mini | 0.85 | 3    | 20,800  | 105,945 | 94.76%     | 88.78%      | 78.41%     | 8.14%    | 44.40%  | $3.69    |
| GPT-4o-mini | 0.85 | 4    | 36,552  | 213,214 | 96.65%     | 92.24%      | 83.23%     | 6.24%    | 41.60%  | $3.99    |
| GPT-4o-mini | 0.85 | 5    | 61,575  | 388,639 | 97.59%     | 94.03%      | 85.32%     | 5.56%    | 34.00%  | $10.08   |
| GPT-4o-mini | 0.9  | 1    | 5,646   | 19,742  | 86.06%     | 75.89%      | 65.30%     | 13.36%   | 0.00%   | $0.70    |
| GPT-4o-mini | 0.9  | 2    | 12,437  | 60,868  | 91.30%     | 84.38%      | 73.79%     | 12.05%   | 124.10% | $2.15    |
| GPT-4o-mini | 0.9  | 3    | 25,008  | 150,025 | 94.23%     | 89.83%      | 81.13%     | 9.63%    | 91.30%  | $5.31    |

#### **Ключевые Находки и Анализ**

##### **1. Проверка Сходимости: Все Настройки Стремятся к Сходимости**

Все экспериментальные настройки продемонстрировали четкую тенденцию к сходимости:

- **Коэффициент Растущих Новых Концепций**: С начальных 10-13% стабильно снижается до 3-5%, что подтверждает насыщение графа в покрытии концепций
- **Коэффициент Растущих Новых Ребер**: С пика второго раунда (46-71%) постепенно сходит к 15-20%, что подтверждает совершенствование сети отношений между концепциями
- **Плато Покрытия**: После 4-5 раундов рост покрытия значительно замедляется, переходя в состояние сходимости

##### **2. Анализ Различий Моделей: Баланс Качества и Стоимости**

**Преимущества GPT-4o**:

- **Более Высокое Покрытие**: На тех же раундах GPT-4o обычно на 2-4 процентных пункта выше, чем GPT-4o-mini
- **Быстрая Сходимость**: Для достижения того же уровня покрытия требуется меньше раундов
- **Лучшее Качество Концепций**: Проявляется в более высоком уровне соответствия ключевым словам Википедии

**Анализ Стоимости**:

- **Стоимость GPT-4o**: Абсолютная стоимость составляет примерно 8-15 раз больше, чем у GPT-4o-mini
- **Увеличение Производительности**: Повышение покрытия обычно составляет **2-4%**
- **Соотношение Стоимости и Эффективности**: GPT-4o-mini предлагает лучшее соотношение стоимости и эффективности в большинстве практических сценариев

##### **3. Влияние Порога Сходства: Баланс Точности и Эффективности**

- **Порог 0.8**: Быстрое расширение, но может включать больше схожих концепций
- **Порог 0.85**: Сбалансированный выбор, подходящий для большинства приложений
- **Порог 0.9**: Высокая точность, но медленная скорость расширения, подходит для сценариев с очень высокими требованиями к чистоте концепций

##### **4. Кросс-Дисциплинарная Согласованность: Универсальность Метода**

Результаты экспериментов в области сердечно-сосудистых и дыхательных систем высоко согласованы, что подтверждает надежность метода:

- Схемы сходимости схожи
- Тенденции покрытия一致
- Соотношение стоимости и эффективности аналогично

#### **Практические Рекомендации**

**Сценарии с Приоритетом Стоимости (Рекомендуется)**:

- Используйте GPT-4o-mini + порог 0.8
- Проведите 4-5 раундов итерации для достижения покрытия более 95%
- Контроль затрат в диапазоне $3-10

**Сценарии с Приоритетом Качества**:

- Используйте GPT-4o + порог 0.85
- Можно достичь покрытия более 97%
- Необходимо принять значительное увеличение затрат

**Сбалансированные Сценарии**:

- Используйте GPT-4o-mini + порог 0.85
- Достигните покрытия 94-97%
- Умеренные затраты, приемлемое качество

## **Генерация Памяти QA на Основе Концептуальной Карты и Дистилляция Знаний**

После нескольких раундов итерации мы построили обширную и структурированную сеть концептуальных отношений. Однако эта сеть в настоящее время является лишь "скелетом". Чтобы превратить ее в базу знаний, которую AI может использовать напрямую, нам нужно заполнить ее конкретным содержанием — то есть высококачественными вопросами и ответами (QA). Этот процесс мы называем \*\*"Дистилляция Знаний"\*\*.

Наша стратегия делится на два этапа:

1. Генерация независимых пар вопросов и ответов для каждого **отдельного узла концепции** в графе, чтобы создать базовые знания.
2. Генерация связанных пар вопросов и ответов для каждой **связанной пары концепций с клиническим значением** (ребер) в графе, чтобы построить глубокие знания.

Для достижения этой цели мы разработали `ConceptDistiller` (дистиллятор концепций) и соответствующий ему Prompt. Этот Prompt предназначен для того, чтобы направить мощную модель "учителя" (например, GPT-4o) в преобразовании изолированной медицинской концепции в учебный вопрос и ответ, насыщенный клиническим контекстом и проверяющий способности к комплексному рассуждению. Эти пары QA станут содержанием памяти "ученической" модели (малой модели, которую мы в конечном итоге хотим улучшить).

```python

@dataclass
class ConceptDistillationResult:
    """Класс данных для результатов генерации концептуального QA"""
    status: str  # success, api_error, json_error
    concept_id: str
    concept_name: str
    response: Optional[str] = None
    error_details: Optional[str] = None
    processing_time: Optional[float] = None
    json_validation: Optional[Dict] = None
    generated_questions: Optional[List[Dict]] = None

class ConceptDistiller:
    """Генератор концептуального QA - генерирует пары вопросов и ответов для каждого концепта"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client

    def distill_concept(self, concept: str, concept_id: str) -> ConceptDistillationResult:
        """Генерировать пары вопросов и ответов для одного концепта"""
        start_time = time.time()
      
        # Построить подсказку
        system_prompt = self.get_distillation_system_prompt()
        user_prompt = self.get_distillation_prompt(concept)
      
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Вызов API
        api_result = self.api_client.call_api(messages, timeout=300)
        processing_time = time.time() - start_time

        if api_result["status"] != "success":
            return ConceptDistillationResult(
                status="api_error",
                concept_id=concept_id,
                concept_name=concept,
                error_details=api_result["error"],
                processing_time=processing_time
            )

        # Проверка JSON Ответа
        expected_keys = ["concept", "questions"]
        json_validation = ResponseValidator.validate_json_response(
            api_result["content"], expected_keys
        )
      
        if json_validation["is_valid_json"]:
            questions = json_validation["parsed_json"]["questions"]
            return ConceptDistillationResult(
                status="success",
                concept_id=concept_id,
                concept_name=concept,
                response=api_result["content"],
                processing_time=processing_time,
                json_validation=json_validation,
                generated_questions=questions
            )
        else:
            return ConceptDistillationResult(
                status="json_error",
                concept_id=concept_id,
                concept_name=concept,
                response=api_result["content"],
                error_details=f"JSON validation failed: {json_validation['error_type']}",
                processing_time=processing_time,
                json_validation=json_validation
            )

    @staticmethod
    def get_distillation_system_prompt() -> str:
        """Получить Системные Подсказки"""
        return """You are a world-renowned cardiovascular specialist with 20+ years of clinical experience. Your task is to create high-quality educational content for training junior cardiovascular doctors based on the given cardiovascular concept.

Your generated questions must require clinical reasoning and integration - avoid simple memorization questions."""

    @staticmethod
    def get_distillation_prompt(concept: str) -> str:
        """Генерировать подсказку для концептуального QA"""
        return f"""**TARGET CONCEPT: {concept}**

Generate exactly 3 diverse cardiovascular clinical questions about this concept, each with complete learning materials. Follow these requirements:

**QUESTION DESIGN PRINCIPLES:**
1. Realistic cardiovascular clinical scenarios requiring clinical reasoning
2. Every condition mentioned must be CRITICAL to the clinical decision - avoid redundant details
3. Use general descriptors (elderly patient, young adult) rather than specific ages
4. Focus on decision-making situations where this concept is central
5. **AVOID simple factual questions** - require clinical integration and reasoning

**KNOWLEDGE FACTS REQUIREMENTS:**
- Each fact must start with the concept name as the subject
- Focus on core medical properties, mechanisms, clinical significance

**OUTPUT FORMAT (strict JSON):**
{{
  "concept": "{concept}",
  "questions": [
    {{
      "question_id": 1,
      "question": "Clinical scenario question 1...",
      "reasoning_guidance": "Step-by-step clinical thinking process 1...",
      "knowledge_facts": [
        "{concept} fact 1...",
        "{concept} fact 2...",  
        "{concept} fact 3..."
      ],
      "final_answer": "Comprehensive clinical answer..."
    }},
    {{
      "question_id": 2,
      "question": "Clinical scenario question 2...",
      "reasoning_guidance": "Step-by-step clinical thinking process 2...",
      "knowledge_facts": [
        "{concept} fact 1...",
        "{concept} fact 2..."
      ],
      "final_answer": "Comprehensive clinical answer..."
    }},
    {{
      "question_id": 3,
      "question": "Clinical scenario question 3...",
      "reasoning_guidance": "Step-by-step clinical thinking process 3...",
      "knowledge_facts": [
        "{concept} fact 1...",
        "{concept} fact 2..."
      ],
      "final_answer": "Comprehensive clinical answer..."
    }}
  ]
}}

Generate the educational content now."""

class BatchConceptDistiller:
    """Обработчик пакетной генерации концептуального QA"""

    def __init__(self, distiller: ConceptDistiller, output_dir: str = "concept_distillation"):
        self.distiller = distiller
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def distill_concept_graph(self, concept_graph_dict: Dict, max_workers: int = 10, 
                            batch_size: int = 20, batch_delay: int = 0) -> Dict:
        """Пакетная генерация"""
        concept_list = list(concept_graph_dict.keys())  # Предполагается, что ключи dict - это названия концептов
        total_concepts = len(concept_list)
        print(f"Начать пакетную обработку: генерация QA для {total_concepts} концептов")
        print(f"Размер партии: {batch_size}, Максимальное количество параллельных задач: {max_workers}")

        all_results = {}
        batch_num = 1

        # Обработка по пакетам
        for i in range(0, total_concepts, batch_size):
            batch_concepts = concept_list[i:i + batch_size]
            print(f"\nОбработка партии {batch_num}: Концепция {i+1}-{min(i+batch_size, total_concepts)} ({len(batch_concepts)} штук)")

            batch_start_time = time.time()
            batch_results = self._process_batch(batch_concepts, max_workers, i)
            batch_end_time = time.time()

            # Сохранение результатов партии
            self._save_batch_results(batch_results, batch_num, batch_start_time)

            all_results.update(batch_results)

            print(f"Пакет {batch_num} завершен, время затрачено: {batch_end_time - batch_start_time:.2f} секунд")

            batch_num += 1

            # Перерыв между пакетами
            if i + batch_size < total_concepts:
                #print(f"Перерыв между партиями {batch_delay} секунд...")
                time.sleep(batch_delay)

        print(f"\nВсе партии обработаны! Всего обработано {total_concepts} концепций")
        return all_results

    def _process_batch(self, batch_concepts: List[str], max_workers: int, start_index: int) -> Dict:
        """Обработка одного пакета"""
        batch_results = {}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Отправка задания
            future_to_concept = {}
            for idx, concept in enumerate(batch_concepts):
                concept_id = f"concept_{start_index + idx:06d}"
                future = executor.submit(self.distiller.distill_concept, concept, concept_id)
                future_to_concept[future] = (concept_id, concept)

            # Сбор результатов
            completed = 0
            for future in as_completed(future_to_concept):
                concept_id, concept = future_to_concept[future]
                try:
                    result = future.result()
                    batch_results[concept_id] = result

                    # Простое Отображение Состояния
                    status_symbol = "✓" if result.status == "success" else "✗"
                    completed += 1
                  
                    if completed % 1000 == 0 or completed == len(batch_concepts):
                        success_count = sum(1 for r in batch_results.values() if r.status == "success")
                        print(f"  Завершено: {completed}/{len(batch_concepts)} (Успешно: {success_count}) {status_symbol}")

                except Exception as e:
                    batch_results[concept_id] = ConceptDistillationResult(
                        status="exception",
                        concept_id=concept_id,
                        concept_name=concept,
                        error_details=str(e)
                    )
                    print(f"  Исключение: {concept_id} - {str(e)}")

        return batch_results

    def _save_batch_results(self, batch_results: Dict, batch_num: int, start_time: float):
        """Сохранение результатов пакета"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"concept_distillation_batch_{batch_num:03d}_{timestamp}.pkl"
        filepath = os.path.join(self.output_dir, filename)

        # Статистическая информация
        total_count = len(batch_results)
        success_count = sum(1 for r in batch_results.values() if r.status == "success")
        total_questions = sum(len(r.generated_questions) for r in batch_results.values() 
                            if r.status == "success" and r.generated_questions)

        save_data = {
            "metadata": {
                "batch_num": batch_num,
                "timestamp": timestamp,
                "start_time": start_time,
                "total_concepts": total_count,
                "successful_distillations": success_count,
                "total_questions_generated": total_questions
            },
            "results": batch_results
        }

        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)

        print(f"  Результаты пакета сохранены: {filename}")
        print(f"  Успех: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
        print(f"  Общее количество сгенерированных вопросов: {total_questions}")

        return filepath

# ==================== Удобные функции ====================

def distill_concept_graph(concept_graph_dict: Dict, api_url: str, api_key: str, model_name: str, max_workers: int = 10, 
                        batch_size: int = 20, output_dir: str = "concept_distillation"):
    """Удобная функция для дистилляции концептуальной карты"""
    print(f"Подготовка дистилляции концептуальной карты: {len(concept_graph_dict)} концепций")

    # Инициализация API клиента
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )

    # Инициализация дистиллятора
    distiller = ConceptDistiller(api_client)
    batch_distiller = BatchConceptDistiller(distiller, output_dir=output_dir)

    # Пакетная дистилляция
    results = batch_distiller.distill_concept_graph(
        concept_graph_dict=concept_graph_dict,
        max_workers=max_workers,
        batch_size=batch_size,
        batch_delay=1
    )

    return results

def test_single_concept_distillation(concept: str, api_url: str, api_key: str, model_name: str, verbose: bool = True):
    """Тестирование дистилляции одной концепции"""
    print("=" * 80)
    print("Тест дистилляции одной концепции")
    print("=" * 80)

    # Инициализация API клиента
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )

    distiller = ConceptDistiller(api_client)

    print(f"Концепция: {concept}")
    print()

    # Обработка концепции
    result = distiller.distill_concept(concept, "test_concept")

    print(f"Статус обработки: {result.status}")
    print(f"Время обработки: {result.processing_time:.2f} секунд")

    if result.status == "success":
        print(f"Количество сгенерированных вопросов: {len(result.generated_questions)}")
        print("=" * 80)
        print("Сгенерированные данные:")
        print("=" * 80)
        for i, question in enumerate(result.generated_questions, 1):
            print(f"\nВопрос {i}:")
            print(f"Сцена: {question['question']}")
            print(f"Вывод: {question['reasoning_guidance'][:100]}...")
            print(f"Факты знаний: {len(question['knowledge_facts'])} штук")
            print(f"Ответ: {question['final_answer'][:100]}...")
        print("=" * 80)
        if verbose:
            print("Исходный ответ LLM:")
            print("=" * 80)
            print(result.response)
        print("=" * 80)
        return {"success": True, "result": result}
    else:
        print(f"Ошибка обработки: {result.error_details}")
        return {"success": False, "result": result}

def load_and_analyze_distillation_results(results_dir: str = "concept_distillation"):
    """Загрузка и анализ результатов"""
    result_files = [f for f in os.listdir(results_dir) 
                   if f.startswith('concept_distillation_batch_') and f.endswith('.pkl')]
    result_files.sort()

    if not result_files:
        print("Файл с результатами не найден")
        return {}

    all_training_data = []
    total_concepts = 0
    total_successful = 0
    total_questions = 0

    print("Анализ результатов:")
    print("=" * 80)

    for file in result_files:
        filepath = os.path.join(results_dir, file)
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
      
        metadata = data['metadata']
        results = data['results']

        total_concepts += metadata['total_concepts']
        total_successful += metadata['successful_distillations']
        total_questions += metadata['total_questions_generated']

        print(f"Пакет {metadata['batch_num']:3d}: "
              f"Всего концепций {metadata['total_concepts']:3d}, "
              f"Успешно {metadata['successful_distillations']:3d} "
              f"({metadata['successful_distillations']/metadata['total_concepts']*100:.1f}%), "
              f"Количество вопросов {metadata['total_questions_generated']:4d}")

        # Сбор данных
        for concept_id, result in results.items():
            if result.status == "success" and result.generated_questions:
                for question in result.generated_questions:
                    training_sample = {
                        "concept": result.concept_name,
                        "concept_id": concept_id,
                        "question_id": question["question_id"],
                        "question": question["question"],
                        "reasoning_guidance": question["reasoning_guidance"],
                        "knowledge_facts": question["knowledge_facts"],
                        "final_answer": question["final_answer"]
                    }
                    all_training_data.append(training_sample)

    print("=" * 80)
    print(f"Всего: {total_concepts} концептов, Успешно: {total_successful} ({total_successful/total_concepts*100:.1f}%)")
    print(f"Сгенерировано QA: {len(all_training_data)} (в среднем по {len(all_training_data)/total_successful:.1f} на концепт)")

    return {
        "training_data": all_training_data,
        "statistics": {
            "total_concepts": total_concepts,
            "successful_distillations": total_successful,
            "total_questions": total_questions,
            "training_samples": len(all_training_data)
        }
    }

if __name__ == "__main__":
    print("=" * 80)
    print("Система генерации концепт QA")
    print("=" * 80)
  
    # Пример использования
    print("Метод использования:")
    print("1. test_single_concept_distillation('atrial_fibrillation') - Тестирование одного концепта")
    print("2. distill_concept_graph(concept_graph_dict) - Пакетная генерация концепт QA")
    print("3. load_and_analyze_distillation_results() - Анализ результатов")
    print("\nПример:")
    print("# Пакетное выполнение")
    print("# distillation_results = distill_concept_graph(your_concept_graph_dict, max_workers=10, batch_size=20)")
```

Перед запуском крупномасштабной пакетной обработки хорошей практикой является проверка того, работает ли Prompt и логика кода так, как ожидается. Ниже приведен код, который представляет собой такой модульный тест, который на примере "мерцательной аритмии (atrial_fibrillation)" вызывает функцию `test_single_concept_distillation` для тестирования эффекта генерации QA для одного концепта.

```python
# Тестирование увеличения одного концепта
test_single_concept_distillation('atrial_fibrillation')
```

На практике нам может не понадобиться генерировать QA для всех концептов в графе. В зависимости от целей проекта мы можем выбрать подходящий подмножество. Как упоминалось в начале этого раздела, наша стратегия заключается в том, чтобы выбрать подграф среднего размера (узлы после 3 итераций), но с более зрелыми связями (ребра после 5 итераций) в качестве области для знания дистилляции.

Ниже приведен код, который предназначен для достижения этой цели. Он сначала загружает два различных файла графа на разных этапах итерации, а затем с помощью функций `extract_subgraph` и `extract_unique_edges` точно строит целевой граф `filtered_graph`, который мы используем для генерации QA.

```python
# Фильтрация для получения текущей целевой концепт-графа

import pickle
with open('cookbooktest/Cardio/concept_graph_4omini_5_iter.pkl', 'rb') as f:
    concept_dict = pickle.load(f)

import pickle
with open('cookbooktest/Cardio/concept_graph_4omini_3_iter.pkl', 'rb') as f:
    sub_concept_dict = pickle.load(f)

def extract_subgraph(full_graph_dict, sub_concept_set):
    """Извлечение подграфа, оставляя только указанные концепты и их связи"""
  
    # Если sub_concept_set является dict, возьмите его keys; если это list/set, используйте напрямую
    if isinstance(sub_concept_set, dict):
        valid_concepts = set(sub_concept_set.keys())
    else:
        valid_concepts = set(sub_concept_set)
  
    subgraph = {}
  
    for concept, neighbors in full_graph_dict.items():
        # Обрабатывайте только концепции в подмножестве
        if concept in valid_concepts:
            # Сохраняйте только концепции среди соседей, которые также находятся в подмножестве
            filtered_neighbors = [n for n in neighbors if n in valid_concepts]
            if filtered_neighbors:  # Сохраняйте только узлы с соседями
                subgraph[concept] = filtered_neighbors
  
    print(f"Исходный граф: {len(full_graph_dict)} узлов")
    print(f"Подграф: {len(subgraph)} узлов")
  
    # Подсчет количества ребер
    total_edges = sum(len(neighbors) for neighbors in subgraph.values())
    print(f"Количество ребер подграфа: {total_edges}")
  
    return subgraph

filtered_graph = extract_subgraph(concept_dict, sub_concept_dict)

# Удаление дублирующихся ребер
def extract_unique_edges(graph_dict):
    """Извлечение уникальных пар ребер из графа, двусторонние ребра сохраняются только одно"""
  
    processed_pairs = set()
    unique_edges = []
  
    for concept_a, neighbors in graph_dict.items():
        for concept_b in neighbors:
            # Сортировка для обеспечения того, чтобы (A,B) и (B,A) рассматривались как одна и та же пара
            edge = tuple(sorted([concept_a, concept_b]))
    
            if edge not in processed_pairs:
                processed_pairs.add(edge)
                unique_edges.append(edge)
  
    print(f"Общее количество ребер: {sum(len(neighbors) for neighbors in graph_dict.values())}")
    print(f"Количество ребер после удаления дубликатов: {len(unique_edges)}")
  
    return unique_edges

# Использование
unique_edges = extract_unique_edges(filtered_graph)

# Просмотр первых нескольких ребер
print("Передние 5 ребер:")
for i, (a, b) in enumerate(unique_edges[:5]):
    print(f"{i+1}. {a} <-> {b}")
```

```python
# Пакетное извлечение qa для одного концепта
results = distill_concept_graph(
    concept_graph_dict=example_concept_dict,
    max_workers=100,        # Число параллельных потоков
    batch_size=1000,        # Размер пакета
    output_dir="cookbooktest/Cardio",  # Место сохранения
    api_url=api_url, 
    api_key=api_key, 
    model_name=QA_SYNTHESIZER
)
```

На практике мы выбрали подграф среднего размера (узлы после 3 итераций), но с более зрелыми связями (ребра после 5 итераций) в качестве области для знания дистилляции, чтобы сбалансировать широту и глубину знаний. Для дистилляции знаний пар концептов мы разработали более сложный "оценка-генерация" двухступенчатый Prompt. LLM сначала играет роль "фильтра", строго оценивая клиническую связь и образовательную ценность пар концептов, только "золотые комбинации", прошедшие оценку, перейдут на второй этап, чтобы сгенерировать QA-пару, которая одновременно охватывает два концепта и имеет более сложную логику.

```python
# Для генерации извлечений вопросов концептной пары, не будем углубляться, мы предоставим подсказку в качестве вдохновения:
    @staticmethod
    def get_pair_system_prompt() -> str:
        """Получить подсказки для оценки концептной пары"""
        return """You are a world-renowned cardiovascular specialist with 20+ years of clinical experience. Your task is to rigorously evaluate concept pairs and generate high-quality educational content. You must act as a **strict filter**, approving only pairs with a **direct, critical, and undeniable link** in clinical practice and training."""

    @staticmethod
    def get_pair_prompt(concept_pairs: List[tuple]) -> str:
        """Сгенерировать подсказки для оценки концептной пары"""
        pairs_text = ""
        for i, (concept_a, concept_b) in enumerate(concept_pairs, 1):
            pairs_text += f"{i}. {concept_a} <-> {concept_b}\n"
  
        return f"""**CONCEPT PAIRS TO EVALUATE:**
{pairs_text}

For each pair, you must strictly evaluate the following two criteria. **BOTH must be strongly true** to proceed.

1.  **Direct Clinical Relevance**: Is there a **direct causal, pathophysiological, diagnostic, or therapeutic link** between the two concepts? The connection should not just a weak, coincidental, or indirect association. One concept must frequently and directly influence the consideration of the other in **critical clinical decision-making**.

2.  **Essential Educational Value**: Does understanding this specific link teach a **crucial, non-obvious clinical reasoning skill**? The relationship should highlight a common point of confusion to be clarified, a key differential diagnosis, or a pivotal management decision. It must be more than a simple factual association.

**EXAMPLE OF A PAIR TO REJECT:**
- `"Hypertension" <-> "Stethoscope"`: While a stethoscope is used in the diagnosis of hypertension, this is a basic procedural fact.

For each pair that meet the stringent criteria:
1. Generate 1 clinical question covering BOTH concepts.
2. Every condition mentioned must be CRITICAL to the clinical decision - avoid redundant details
3. Use general descriptors (elderly patient, young adult) rather than specific ages
4. Focus on decision-making situations where simultaneously considering the concept pairs is central
5. **AVOID simple factual questions** - require clinical integration and reasoning

**OUTPUT FORMAT (strict JSON):**
{{
  "evaluated_pairs": [
    {{
      "concept_pair": ["concept_a", "concept_b"],
      "is_clinically_relevant": true,
      "is_instructionally_meaningful": true,
      "question": {{
        "question": "Clinical scenario covering both concepts...",
        "reasoning_guidance": "Step-by-step clinical thinking...",
        "knowledge_facts": [
          "Concept_a fact 1...",
          "Concept_b fact 1...",
          "Concept_a fact 2..."
        ],
        "final_answer": "Comprehensive answer..."
      }}
    }},
    {{
      "concept_pair": ["concept_x", "concept_y"],
      "is_clinically_relevant": false,
      "is_instructionally_meaningful": false,
      "question": null
    }}
  ]
}}

Generate the evaluation and content now."""
```

---

## **Пример структуры данных QA**

Все QA-данные, сгенерированные в процессе дистилляции знаний, будут организованы в единый, стандартный формат JSON-объекта для удобства последующего чтения и обработки программами. Эта структура содержит следующие ключевые поля:

- `concept`: источник знаний, может быть одним концептом (строка) или парой концептов (список).
- `question`: основной клинический вопрос.
- `reasoning_guidance`: клинический путь мышления для решения этого вопроса.
- `knowledge_facts`: ключевые знания, необходимые для ответа на этот вопрос.
- `final_answer`: комплексный, авторитетный ответ на вопрос.

Мы назвали все отформатированные QA-данные `qa_collection`.

1. **Пример QA для одного концепта**

```python
{'concept': 'ankylosing spondylitis',
 'question': 'A young adult patient with a 5-year history of ankylosing spondylitis presents with unexplained fatigue and palpitations. Laboratory tests reveal anemia and elevated acute phase reactants. In the context of ankylosing spondylitis, what cardiovascular complication should be explored, and what is the likely mechanism of the heart condition related to this systemic inflammatory disease?',
 'reasoning_guidance': 'Identify the common systemic manifestations of ankylosing spondylitis including inflammation and anemia. Consider the cardiovascular implications of chronic inflammation and anemia on cardiac function. Explore the mechanism by which systemic diseases like ankylosing spondylitis can result in heart conditions such as myocardial fibrosis or dysfunction.',
 'knowledge_facts': ['ankylosing spondylitis can cause systemic inflammation, contributing to cardiovascular complications like myocardial fibrosis.',
  'ankylosing spondylitis-associated inflammation can lead to chronic anemia, affecting cardiovascular health.',
  'ankylosing spondylitis may lead to cardiac conduction system involvement, resulting in palpitations.'],
 'final_answer': "Given the patient's symptoms and laboratory findings, myocardial fibrosis due to systemic inflammation related to ankylosing spondylitis should be explored. The fatigue and palpitations may be due, in part, to anemia exacerbating cardiac stress, and inflammation leading to fibrosis, altering cardiac conduction and function."}

```

2. **Пример QA для пары концептов**

```python
{'concept': ['apical hypertrophy of the lv', 'myocardial ischaemia'],
 'question': 'A middle-aged adult with a history of hypertension presents with exertional chest pain. Echocardiography reveals apical hypertrophy of the left ventricle. How would you differentiate between hypertrophic cardiomyopathy and myocardial ischaemia as the cause of the symptoms?',
 'reasoning_guidance': 'Consider the role of diagnostic imaging and stress testing in distinguishing between structural heart changes and ischemic heart conditions. Evaluate the characteristic findings of apical hypertrophy and myocardial ischemia.',
 'knowledge_facts': ['Apical hypertrophy can mimic signs of myocardial ischaemia.',
  'Myocardial ischaemia is often indicated by ST-segment changes during stress.',
  'Hypertrophic cardiomyopathy may present with specific echocardiographic patterns of ventricular thickening.'],
 'final_answer': 'To differentiate hypertrophic cardiomyopathy from myocardial ischaemia, perform a stress test to assess for changes indicative of ischemia and use advanced imaging modalities like cardiac MRI, which can provide detailed myocardial characterization.'}

```

---

## **Последний шаг: построение и экспорт MemCube**

На этом все подготовительные работы завершены. Теперь мы собираемся собрать эти независимые "единицы знаний" (`qa_collection`) в мощную, взаимосвязанную сеть знаний — **MemCube**.

Процесс построения следующий:

1. **Концепты как скелет**: каждый "концепт" в графе концептов станет независимым **узлом** в MemCube.
2. **QA как плоть**: каждая "QA-пара" также станет независимым **узлом** и будет связана с одним или двумя узлами концептов, откуда она произошла.
3. **Вопрос как индекс**: мы векторизуем **текст вопроса (question)** в каждом узле QA, чтобы использовать его в качестве семантического "адреса" в сети памяти для быстрого поиска.

Ниже приведен Python-скрипт, который в одном шаге завершает этот процесс преобразования. Он загружает `qa_collection`, извлекает и создает все узлы концептов и узлы QA, а затем устанавливает связи между узлами на основе заданной логики, в конечном итоге собирая все узлы и ребра в полный JSON-объект, соответствующий формату MemOS, и экспортируя его в файл.

```python
import os
from sentence_transformers import SentenceTransformer
import torch
model = SentenceTransformer(
    EMBEDDING_MODEL,
    trust_remote_code=True
)
# =============================================================================
# Ячейка 1: Импорт библиотек и вспомогательных функций
# =============================================================================
import pickle
import uuid
import json
from datetime import datetime
from collections import defaultdict
import numpy as np

# Загрузка данных
with open("cookbooktest/Cardio/qa_collection.pkl", 'rb') as f:
    qa_collection = pickle.load(f)

print(f"✅ Загружено {len(qa_collection)} QA данных")

def generate_real_embedding_batch(texts, batch_size=50):
    """Пакетная генерация векторов embedding"""
    if isinstance(texts, str):
        # Один текст, обрабатываем напрямую
        embedding = model.encode(texts, convert_to_tensor=False)
        return embedding.tolist()
  
    # Пакетная обработка
    all_embeddings = []
    total = len(texts)
  
    for i in range(0, total, batch_size):
        batch_end = min(i + batch_size, total)
        batch_texts = texts[i:batch_end]
  
        print(f"  Пакет embedding {i//batch_size + 1}/{(total-1)//batch_size + 1} ({len(batch_texts)} текстов)")
  
        # Пакетное кодирование
        batch_embeddings = model.encode(batch_texts, convert_to_tensor=False, show_progress_bar=False)
  
        # Преобразовать в список и добавить в результат
        for emb in batch_embeddings:
            all_embeddings.append(emb.tolist())
  
    return all_embeddings

# =============================================================================
# Ячейка 2: Проверка данных и извлечение концепций
# =============================================================================
def extract_unique_concepts(qa_collection):
    """Извлечь все уникальные концепции из данных QA и проверить формат данных"""
    unique_concepts = set()
    invalid_data = []
    valid_concept_qa = 0
    valid_relation_qa = 0
  
    for i, qa_data in enumerate(qa_collection):
        if isinstance(qa_data['concept'], str):
            # Concept QA - Одна концепция
            unique_concepts.add(qa_data['concept'])
            valid_concept_qa += 1
        elif isinstance(qa_data['concept'], list):
            # Relation QA - Должно быть парой из 2 концепций
            if len(qa_data['concept']) == 2:
                unique_concepts.update(qa_data['concept'])
                valid_relation_qa += 1
            else:
                # Аномалия данных: не 2 концепции
                invalid_data.append({
                    'index': i,
                    'concept': qa_data['concept'],
                    'length': len(qa_data['concept']),
                    'question': qa_data['question'][:100] + "..."
                })
        else:
            # Аномалия данных: концепция не является ни str, ни list
            invalid_data.append({
                'index': i,
                'concept': qa_data['concept'],
                'type': type(qa_data['concept']),
                'question': qa_data['question'][:100] + "..."
            })
  
    # Сообщить результаты проверки данных
    print(f"📊 Результаты проверки данных:")
    print(f"   - Действительные Concept QA: {valid_concept_qa}")
    print(f"   - Действительные Relation QA: {valid_relation_qa}")
    print(f"   - Аномальные данные: {len(invalid_data)}")
    print(f"   - Извлеченные уникальные концепции: {len(unique_concepts)}")
  
    if invalid_data:
        print(f"\n⚠️ Подробности аномальных данных:")
        for item in invalid_data[:3]:  # Показать только первые 3
            print(f"   索引{item['index']}: concept={item['concept']}")
            print(f"     Вопрос: {item['question']}")
        if len(invalid_data) > 3:
            print(f"   ...  Осталось {len(invalid_data) - 3} исключительных данных")
  
    return list(unique_concepts), invalid_data, valid_concept_qa, valid_relation_qa

# Выполнение проверки данных
print("🔍 Начало проверки данных...")
unique_concepts, invalid_data, valid_concept_qa, valid_relation_qa = extract_unique_concepts(qa_collection)

print(f"\n✅ Пример списка концепций: {list(unique_concepts)[:5]}...")

# =============================================================================
# Ячейка 3: Создание узлов концепций
# =============================================================================
def create_concept_nodes(unique_concepts):
    """Создание всех узлов концепций - использование названия концепции в качестве memory и embedding"""
    concept_nodes = {}
  
    print(f"Начинаем генерировать embedding для {len(unique_concepts)} концепций...")
  
    # Пакетная генерация embedding концепций
    concept_embeddings = generate_real_embedding_batch(unique_concepts, batch_size=100)
  
    for i, (concept, embedding) in enumerate(zip(unique_concepts, concept_embeddings)):
        concept_id = str(uuid.uuid4())
  
        node = {
            "id": concept_id,
            "memory": concept,  # Название концепции в качестве memory
            "metadata": {
                "type": "fact",
                "memory_type": "UserMemory",
                "status": "activated",
                "entities": [concept],
                "tags": [concept],
                "embedding": embedding,  # embedding названия концепции
                "created_at": datetime.now().isoformat(),
                "usage": [],
                "background": ""
            }
        }
  
        concept_nodes[concept] = {
            "id": concept_id,
            "node": node
        }
  
        if (i + 1) % 20 == 0:
            print(f"  Завершено {i + 1}/{len(unique_concepts)} концепций")
  
    print(f"✅ Создано {len(concept_nodes)} узлов концепций")
    return concept_nodes

# Выполнение создания узлов концепций
print("🏗️ Создание концептуального узла...")
concept_nodes = create_concept_nodes(unique_concepts)
print("Идентификатор примера концептуального узла:", list(concept_nodes.keys())[0], "->", concept_nodes[list(concept_nodes.keys())[0]]["id"])

# =============================================================================
# Ячейка 4: Создание QA узлов
# =============================================================================
def create_qa_nodes(qa_collection, concept_nodes):
    """Создание всех QA узлов - Оптимизация эмбеддингов批量"""
  
    # 1. Сначала соберите все текстовые вопросы и метаданные
    all_questions = []
    all_metadata = []
    skipped_count = 0
  
    for qa_data in qa_collection:
        question = qa_data['question']
  
        # Построение полного содержимого памяти
        memory_content = f"""Question: {qa_data['question']}

Reasoning Guidance: {qa_data['reasoning_guidance']}

Knowledge Facts: {'; '.join(qa_data['knowledge_facts'])}

Answer: {qa_data['final_answer']}"""
  
        # Определение типа QA и подготовка метаданных
        if isinstance(qa_data['concept'], str):
            # Concept QA
            concept_name = qa_data['concept']
            if concept_name not in concept_nodes:
                print(f"  Предупреждение: Концепция '{concept_name}' не существует, пропускаем этот QA")
                skipped_count += 1
                continue
        
            qa_type = "concept_qa"
            entities = [concept_name]
            tags = [concept_name]
            related_concept_ids = [concept_nodes[concept_name]["id"]]
    
        elif isinstance(qa_data['concept'], list) and len(qa_data['concept']) == 2:
            # Relation QA
            concept_names = qa_data['concept']
    
            # Проверка существования всех концепций
            missing_concepts = [name for name in concept_names if name not in concept_nodes]
            if missing_concepts:
                print(f"  Предупреждение: Концепции {missing_concepts} не существуют, пропускаем этот QA")
                skipped_count += 1
                continue
        
            qa_type = "relation_qa"
            entities = concept_names
            tags = concept_names
            related_concept_ids = [concept_nodes[name]["id"] for name in concept_names]
    
        else:
            # Пропуск аномальных данных
            skipped_count += 1
            continue
  
        all_questions.append(question)
        all_metadata.append({
            'memory_content': memory_content,
            'qa_type': qa_type,
            'entities': entities,
            'tags': tags,
            'related_concept_ids': related_concept_ids
        })
  
    print(f"Собрано {len(all_questions)} действительных вопросов (пропущено {skipped_count}), начинаем массовую генерацию эмбеддингов...")
  
    # 2. Массовая генерация эмбеддингов для всех вопросов
    all_embeddings = generate_real_embedding_batch(all_questions, batch_size=100)
  
    # 3. Создание QA узлов
    qa_nodes = []
    concept_qa_count = 0
    relation_qa_count = 0
  
    for i, (question, metadata, embedding) in enumerate(zip(all_questions, all_metadata, all_embeddings)):
        qa_id = str(uuid.uuid4())
  
        node = {
            "id": qa_id,
            "memory": metadata['memory_content'],
            "metadata": {
                "type": "fact",
                "memory_type": "UserMemory",
                "status": "activated",
                "entities": metadata['entities'],
                "tags": metadata['tags'],
                "embedding": embedding,  # Эмбеддинг вопроса
                "created_at": datetime.now().isoformat(),
                "usage": [],
                "background": "",
                # Временное Поле, Используемое Для Создания Ребер Связи
                "qa_type": metadata['qa_type'],
                "related_concept_ids": metadata['related_concept_ids']
            }
        }
  
        qa_nodes.append(node)
  
        if metadata['qa_type'] == "concept_qa":
            concept_qa_count += 1
        else:
            relation_qa_count += 1
  
        if (i + 1) % 50 == 0:
            print(f"  Создано {i + 1}/{len(all_questions)} Узлов QA")
  
    print(f"✅ Создано {len(qa_nodes)} Узлов QA")
    print(f"   - Concept QA: {concept_qa_count}")
    print(f"   - Relation QA: {relation_qa_count}")
  
    return qa_nodes

# Выполнение Создания Узлов QA
print("🏗️ Создание Узлов QA...")
qa_nodes = create_qa_nodes(qa_collection, concept_nodes)
if qa_nodes:
    print(f"Пример Узла QA: {qa_nodes[0]['metadata']['qa_type']}")
```

```python

# =============================================================================
# Ячейка 5: Создание Ребер Связи
# =============================================================================
def create_edges(concept_nodes, qa_nodes, qa_collection):
    """Создание Ребер Связи Между Узлами"""
    edges = []
    edge_set = set()  # Используется Для Удаления Дубликатов Ребер
  
    # 1. Концепция↔Концепция RELATE_TO Связь (Выводится Из Relation QA)
    concept_relations = set()
    for qa_data in qa_collection:
        if isinstance(qa_data['concept'], list) and len(qa_data['concept']) == 2:
            # Relation QA Указывает На Наличие Клинической Связи Между Двумя Концепциями
            concept_A, concept_B = qa_data['concept']
            if concept_A in concept_nodes and concept_B in concept_nodes:
                relation_key = tuple(sorted([concept_A, concept_B]))
                concept_relations.add(relation_key)
  
    relate_count = 0
    for concept_A, concept_B in concept_relations:
        concept_A_id = concept_nodes[concept_A]["id"]
        concept_B_id = concept_nodes[concept_B]["id"]
  
        edge_key = tuple(sorted([concept_A_id, concept_B_id]))
        if edge_key not in edge_set:
            edges.append({
                "source": concept_A_id,
                "target": concept_B_id,
                "type": "RELATE_TO"
            })
            edge_set.add(edge_key)
            relate_count += 1
  
    print(f"✅ Создано {relate_count} Связей RELATE_TO Между Концепциями")
  
    # 2. Концепция PARENT QA Связь (Concept QA)
    parent_count = 0
    for qa_node in qa_nodes:
        if qa_node['metadata']['qa_type'] == "concept_qa":
            concept_id = qa_node['metadata']['related_concept_ids'][0]
    
            edges.append({
                "source": concept_id,
                "target": qa_node['id'],
                "type": "PARENT"
            })
            parent_count += 1
  
    print(f"✅ Создано {parent_count} Связей Концепция→QA PARENT")
  
    # 3. Концепция PARENT QA Связь (Relation QA - Мостовые Вопросы)
    relation_parent_count = 0
    for qa_node in qa_nodes:
        if qa_node['metadata']['qa_type'] == "relation_qa":
            qa_id = qa_node['id']
    
            # Убедитесь, что related_concept_ids действительны
            if 'related_concept_ids' in qa_node['metadata']:
                for concept_id in qa_node['metadata']['related_concept_ids']:
                    edges.append({
                        "source": concept_id,   # Концепция как родительский узел
                        "target": qa_id,        # Вопрос-бридж как дочерний узел
                        "type": "PARENT"
                    })
                    relation_parent_count += 1
  
    print(f"✅ Создано {relation_parent_count} отношений концепция→бридж QA PARENT")
    print(f"📊 Общее количество отношений: {len(edges)}")
  
    return edges

# Выполнение создания отношений рёбер
print("🔗 Создание рёбер отношений...")
edges = create_edges(concept_nodes, qa_nodes, qa_collection)

# =============================================================================
# Ячейка 6: Сборка и сохранение окончательного JSON
# =============================================================================
def assemble_final_json(concept_nodes, qa_nodes, edges):
    """Сборка окончательного формата JSON TextualMemoryItem"""
  
    # Объединение всех узлов
    all_nodes = []
  
    # Добавление узлов концепции
    for concept_data in concept_nodes.values():
        all_nodes.append(concept_data["node"])
  
    # Добавление узлов QA, очистка временных полей
    for qa_node in qa_nodes:
        # Глубокое копирование узлов, чтобы избежать изменения оригинальных данных
        clean_node = {
            "id": qa_node["id"],
            "memory": qa_node["memory"],
            "metadata": qa_node["metadata"].copy()
        }
  
        # Удаление временных полей
        if "qa_type" in clean_node["metadata"]:
            del clean_node["metadata"]["qa_type"]
        if "related_concept_ids" in clean_node["metadata"]:
            del clean_node["metadata"]["related_concept_ids"]
  
        all_nodes.append(clean_node)
  
    # Построение окончательной структуры
    result = {
        "nodes": all_nodes,
        "edges": edges
    }
  
    print(f"✅ Итоговый JSON содержит:")
    print(f"   - Количество узлов: {len(all_nodes)}")
    print(f"   - Количество рёбер: {len(edges)}")
    print(f"   - Узлы концепции: {len(concept_nodes)}")
    print(f"   - Узлы QA: {len(qa_nodes)}")
    print(f"✅ Временные поля очищены")
  
    return result

# Выполнение окончательной сборки
print("📦 Сборка итогового JSON...")
final_json = assemble_final_json(concept_nodes, qa_nodes, edges)
```

```python
def save_final_json(result, filename="cardio_textual_memory_graph.json"):
    """Сохранить итоговый JSON в файл"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
  
    print(f"✅ Сохранено в файл: {filename}")
    return filename


# Сохранение результата
filename = save_final_json(final_json, "cookbooktest/Cardio/cardio_textual_memory_graph.json")

print("\n🎉 Конвертация завершена!")
print(f"📄 Выходной файл: {filename}")
print(f"📋 Итоговая статистика:")
print(f"   - Всего узлов: {len(final_json['nodes'])}")
print(f"   - Общее количество рёбер: {len(final_json['edges'])}")

# Показать некоторые примеры данных для проверки
if final_json['nodes']:
    sample_node = final_json['nodes'][0]
    print(f"\n📝 Пример узлов:")
    print(f"   ID: {sample_node['id']}")
    print(f"   Memory: {sample_node['memory'][:50]}...")
    print(f"   Type: {sample_node['metadata']['type']}")
    print(f"   Entities: {sample_node['metadata']['entities']}")

if final_json['edges']:
    sample_edge = final_json['edges'][0]
    print(f"\n🔗 Пример рёбер:")
    print(f"   {sample_edge['source']} --{sample_edge['type']}--> {sample_edge['target']}")
```

### **Загрузка MemCube**

Теперь пришло время внедрить этот "цифровой чертеж" в высокопроизводительное постоянное хранилище, чтобы он стал MemCube, доступным для MemOS в реальном времени.

Мы предоставили скрипт для пакетного импорта, оптимизированного для производительности, который может обойти узкие места по добавлению по одному, эффективно загружая весь MemCube, при этом гарантируя, что его структура данных полностью совместима с MemOS. Основные задачи этого скрипта включают: создание ограничений базы данных, пакетный импорт узлов и ребер, создание векторного индекса (что является ключом к реализации семантического поиска на уровне миллисекунд) и проверка совместимости.

```python
# Загрузка memcube в neo4j

#!/usr/bin/env python3
import sys
import os
import ijson
import json
import time
from datetime import datetime
from decimal import Decimal
from neo4j import GraphDatabase

# ===================== Информация о конфигурации - Пожалуйста, измените следующую информацию =====================
NEO4J_URI = 'bolt://localhost:7687'
NEO4J_USERNAME = 'your neo4j username'
NEO4J_PASSWORD = 'your neo4j password'
NEO4J_DATABASE = 'neo4j'
JSON_FILE_PATH = 'cookbooktest/Cardio/cardio_textual_memory_graph.json'
# ===================================================================

# Глобальный экземпляр драйвера
driver = None

def get_driver():
    """Получить экземпляр драйвера Neo4j"""
    global driver
    if not driver:
        try:
            driver = GraphDatabase.driver(
                NEO4J_URI, 
                auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
            )
        except Exception as e:
            print(f"❌ Ошибка создания драйвера: {e}")
            sys.exit(1)
    return driver

def close_driver():
    """Закрыть соединение драйвера"""
    global driver
    if driver:
        driver.close()
        driver = None

def test_neo4j_connection():
    """Проверка соединения с Neo4j"""
    try:
        driver = get_driver()
        with driver.session() as session:
            result = session.run("RETURN 'Connection OK' AS message")
            print(f"✅ Соединение с Neo4j успешно: {result.single()['message']}")
        return True
    except Exception as e:
        print(f"❌ Ошибка соединения с Neo4j: {e}")
        return False

def create_memos_compatible_schema():
    """Создать схему и индексы, совместимые с MemOS"""
    print("Создание структуры данных, совместимой с MemOS...")
  
    try:
        driver = get_driver()
        with driver.session() as session:
            # Создание ограничений, совместимых с MemOS
            session.run("""
                CREATE CONSTRAINT memory_id_unique IF NOT EXISTS
                FOR (n:Memory) REQUIRE n.id IS UNIQUE
            """)
            print("✅ Создание уникального ограничения ID узла Memory")
        return True
  
    except Exception as e:
        print(f"❌ Ошибка создания схемы: {e}")
        return False

def bulk_import_nodes():
    """Пакетный импорт узлов - Нативный способ Neo4j"""
    print("\n" + "=" * 50)
    print("Начало пакетного импорта узлов в Neo4j")
    print("=" * 50)
  
    driver = config.get_driver()
    start_time = time.time()
    success_count = 0
    batch_size = 5000  # Большие партии для достижения наилучшей производительности
    batch = []
  
    try:
        with open(config.json_file_path, 'rb') as f:
            nodes = ijson.items(f, 'nodes.item')
    
            for node in nodes:
                # Подготовка данных узлов, совместимых с MemOS
                node_data = prepare_memos_node(node)
                batch.append(node_data)
        
                # Выполнение пакетного импорта
                if len(batch) >= batch_size:
                    batch_success = execute_node_batch(driver, batch)
                    success_count += batch_success
                    batch = []
            
                    # Отображение прогресса
                    elapsed = time.time() - start_time
                    rate = success_count / elapsed
                    eta_minutes = (200000 - success_count) / rate / 60
            
                    print(f"  Импортировано: {success_count:,}/200,000 ({success_count/200000*100:.1f}%) | "
                          f"Скорость: {rate:.1f} узлов/сек | "
                          f"Ожидаемое время: {eta_minutes:.1f} минут")
    
            # Обработка оставшихся партий
            if batch:
                batch_success = execute_node_batch(driver, batch)
                success_count += batch_success
  
        total_time = time.time() - start_time
        print(f"\n✅ Пакетный импорт узлов завершен:")
        print(f"  Импортируемое количество: {success_count:,}")
        print(f"  Общее время: {total_time/60:.1f} минут")
        print(f"  Средняя скорость: {success_count/total_time:.1f} узлов/сек")
        return success_count
  
    except Exception as e:
        print(f"❌ Ошибка массового импорта: {e}")
        return success_count


def clean_data_types(obj):
    """Очистка типов данных, чтобы обеспечить совместимость с Neo4j"""
    if isinstance(obj, dict):
        return {k: clean_data_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_data_types(item) for item in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    elif obj is None:
        return None
    else:
        return obj

def prepare_memos_node(node):
    """Подготовка данных узлов, совместимых с MemOS"""
    # Сначала очистим типы данных
    node = clean_data_types(node)
    metadata = node.get('metadata', {}).copy()
  
    # Убедимся в наличии необходимых полей
    if 'created_at' not in metadata:
        metadata['created_at'] = datetime.now().isoformat()
    if 'updated_at' not in metadata:
        metadata['updated_at'] = datetime.now().isoformat()
  
    return {
        'id': node.get('id'),
        'memory': node.get('memory', ''),
        'metadata': clean_data_types(metadata)
    }

def execute_node_batch(driver, batch):
    """Выполнение массового импорта узлов"""
    cypher_query = """
    UNWIND $batch AS nodeData
    MERGE (n:Memory {id: nodeData.id})
    SET n.memory = nodeData.memory,
        n.created_at = datetime(nodeData.metadata.created_at),
        n.updated_at = datetime(nodeData.metadata.updated_at),
        n += nodeData.metadata
    RETURN count(n) as imported
    """
  
    try:
        with driver.session() as session:
            result = session.run(cypher_query, batch=batch)
            return result.single()['imported']
    except Exception as e:
        print(f"  Ошибка импорта пакета: {e}")
        return 0

def bulk_import_edges():
    """Массовый импорт рёбер"""
    print("\n" + "=" * 50)
    print("Начало массового импорта рёбер в Neo4j")
    print("=" * 50)
  
    driver = config.get_driver()
    start_time = time.time()
    success_count = 0
    batch_size = 10000  # Рёбра могут использовать большие пакеты
    batch = []
  
    try:
        with open(config.json_file_path, 'rb') as f:
            edges = ijson.items(f, 'edges.item')
    
            for edge in edges:
                # Очистка типов данных рёбер
                edge_clean = clean_data_types(edge)
                batch.append({
                    'source': edge_clean.get('source'),
                    'target': edge_clean.get('target'),
                    'type': edge_clean.get('type')
                })
        
                if len(batch) >= batch_size:
                    batch_success = execute_edge_batch(driver, batch)
                    success_count += batch_success
                    batch = []
            
                    elapsed = time.time() - start_time
                    rate = success_count / elapsed
                    eta_minutes = (500000 - success_count) / rate / 60
            
                    if success_count % 50000 == 0:  # Показать каждые 50000 записей
                        print(f"  Импортировано: {success_count:,}/500,000 ({success_count/500000*100:.1f}%) | "
                              f"Скорость: {rate:.1f} ребер/сек | "
                              f"Ожидаемое время: {eta_minutes:.1f} минут")
    
            # Обработка оставшихся партий
            if batch:
                batch_success = execute_edge_batch(driver, batch)
                success_count += batch_success
  
        total_time = time.time() - start_time
        print(f"\n✅ Импорт ребер завершен:")
        print(f"  Импортируемое количество: {success_count:,}")
        print(f"  Общее время: {total_time/60:.1f} минут")
        print(f"  Средняя скорость: {success_count/total_time:.1f} ребер/сек")
        return success_count
  
    except Exception as e:
        print(f"❌ Ошибка импорта ребер: {e}")
        return success_count

def execute_edge_batch(driver, batch):
    """Выполнение импорта партии ребер"""
    cypher_query = """
    UNWIND $batch AS edgeData
    MATCH (source:Memory {id: edgeData.source})
    MATCH (target:Memory {id: edgeData.target})
    MERGE (source)-[r:PARENT]->(target)
    RETURN count(r) as imported
    """
  
    try:
        with driver.session() as session:
            result = session.run(cypher_query, batch=batch)
            return result.single()['imported']
    except Exception as e:
        print(f"  Ошибка импорта партии ребер: {e}")
        return 0

def create_memos_indexes():
    """Создание индекса, необходимого для MemOS"""
    print("\n" + "=" * 50)
    print("Создание индекса, совместимого с MemOS")
    print("=" * 50)
  
    try:
        driver = config.get_driver()
        with driver.session() as session:
            # Общие индексы MemOS
            indexes = [
                "CREATE INDEX memory_type_idx IF NOT EXISTS FOR (n:Memory) ON (n.memory_type)",
                "CREATE INDEX memory_status_idx IF NOT EXISTS FOR (n:Memory) ON (n.status)",
                "CREATE INDEX memory_created_at_idx IF NOT EXISTS FOR (n:Memory) ON (n.created_at)",
                "CREATE INDEX memory_updated_at_idx IF NOT EXISTS FOR (n:Memory) ON (n.updated_at)",
                "CREATE INDEX memory_user_name_index IF NOT EXISTS FOR (n:Memory) ON (n.user_name)"
            ]
    
            for index_query in indexes:
                session.run(index_query)
                print(f"✅ Индекс создан: {index_query.split()[-7]}")  # Извлечение имени индекса
    
            # Создание векторного индекса - необходимо для векторного поиска MemOS
            try:
                session.run("""
                    CREATE VECTOR INDEX memory_vector_index IF NOT EXISTS
                    FOR (n:Memory) ON (n.embedding)
                    OPTIONS {indexConfig: {
                        `vector.dimensions`: 768,
                        `vector.similarity_function`: 'cosine'
                    }}
                """)
                print("✅ Векторный индекс создан: memory_vector_index (768 измерений)")
            except Exception as ve:
                print(f"⚠️  Ошибка создания векторного индекса: {ve}")
                print("   Функция векторного поиска будет недоступна")
        print("✅ Все индексы, совместимые с MemOS, созданы")
  
    except Exception as e:
        print(f"❌ Ошибка создания индекса: {e}")

def verify_memos_compatibility():
    """Проверка совместимости MemOS"""
    print("\n" + "=" * 50)
    print("Проверка совместимости MemOS")
    print("=" * 50)
  
    try:
        # Добавить путь MemOS
        sys.path.append('./MemOS/src')
        from memos.configs.graph_db import GraphDBConfigFactory
        from memos.graph_dbs.factory import GraphStoreFactory
  
        # Создать конфигурацию MemOS
        graph_config = GraphDBConfigFactory(
            backend="neo4j",
            config={
                "uri": config.uri,
                "user": config.username,
                "password": config.password,
                "db_name": config.database,
                "auto_create": False,
                "embedding_dimension": 768,
            }
        )
  
        graph_store = GraphStoreFactory.from_config(graph_config)
  
        # Тестирование основных функций
        try:
            node_count = graph_store.count_nodes("UserMemory")
            print(f"✅ Статистика узлов MemOS: {node_count:,} узлов UserMemory")
        except:
            print("⚠️  Функция статистики узлов требует доработки")
  
        # Тестирование функции экспорта
        try:
            exported = graph_store.export_graph()
            print(f"✅ Экспорт графа MemOS: {len(exported.get('nodes', []))} узлов, {len(exported.get('edges', []))} ребер")
        except Exception as e:
            print(f"⚠️  Функция экспорта графа: {e}")
  
        print("✅ Проверка совместимости MemOS завершена")
        return True
  
    except Exception as e:
        print(f"❌ Проверка совместимости MemOS не удалась: {e}")
        return False

def main():
    """Главная Функция"""
    print("🚀 Neo4j Инструмент Пакетного Импорта")
    print("=" * 50)
  
    try:
        # 1. Получить Конфигурацию Пользователя - Ввод Все Информации Один Раз
        config.get_user_input()
      
        # 2. Протестировать Соединение
        if not test_neo4j_connection():
            return
  
        # 3. Создать Совместимую Схему
        if not create_memos_compatible_schema():
            return
  
        # 4. Показать Оценку
        print(f"\nПрямой Neo4j Пакетный Импорт Оценка:")
        print(f"  Количество Узлов: 200,000")
        print(f"  Количество Ребер: 500,000")
        print(f"  Размер Пакета: 5,000 Узлов/Пакет, 10,000 Ребер/Пакет")
        print(f"  Ожидаемая Скорость: 1000+ Узлов/Секунда, 5000+ Ребер/Секунда")
        print(f"  Ожидаемое Время: 15-25 Минут")
  
        confirm = input("\nНачать Прямой Пакетный Импорт? (y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ Пользователь Отменил Импорт")
            return
  
        # 5. Выполнить Импорт
        total_start = time.time()
  
        # Импорт Узлов
        node_count = bulk_import_nodes()
  
        # Импорт Ребер
        edge_count = bulk_import_edges()
  
        # Создание Индекса
        create_memos_indexes()
  
        # Проверка Совместимости
        compatible = verify_memos_compatibility()
  
        # Резюме
        total_time = time.time() - total_start
        print("\n" + "=" * 50)
        print("Прямой Пакетный Импорт Завершен")
        print("=" * 50)
        print(f"✅ Общее Время: {total_time/60:.1f} Минут")
        print(f"📊 Статистика Импорта:")
        print(f"  Узлов: {node_count:,}")
        print(f"  Ребер: {edge_count:,}")
        print(f"  Совместимость MemOS: {'✅ Полная Совместимость' if compatible else '⚠️ Требуется Настройка'}")
  
        if node_count > 0:
            print("\n💡 Теперь Доступны Все Функции MemOS:")
            print("  - Семантический Поиск")
            print("  - Графовый Запрос")
            print("  - Память Вывод")
            print("  - Визуализация")
          
    except KeyboardInterrupt:
        print("\n❌ Пользователь прервал операцию")
    except Exception as e:
        print(f"\n❌ Ошибка выполнения программы: {e}")
    finally:
        # Убедитесь, что соединение с базой данных закрыто
        config.close_driver()
        print("🔒 Соединение с базой данных закрыто")

if __name__ == "__main__":
    main()
```

#### **Монтирование MemCube в MemOS**

Когда данные успешно импортированы, наша кардиологическая MemCube официально "запущена". В приложении достаточно инициализировать `TreeTextMemory` MemOS с помощью конфигурационного файла, указывающего на базу данных. После этого мы можем взаимодействовать с огромной базой знаний через этот объект `tree_memory`, наделяя ИИ профессиональной памятью в области.

```python
# Монтирование MemCube
from memos.configs.memory import TreeTextMemoryConfig
from memos.memories.textual.tree import TreeTextMemory

# 1. Пример конфигурационного файла, необходимого для монтирования MemCube
config_data = {
    "extractor_llm": {
        "backend": "huggingface",
        "config": {
            "model_name_or_path": "/mnt/public/model/huggingface/Qwen2.5-14B",
            "temperature": 0.1,
            "remove_think_prefix": True,
            "max_tokens": 8192
        }
    },
    "dispatcher_llm": {
        "backend": "huggingface",
        "config": {
            "model_name_or_path": "/mnt/public/model/huggingface/Qwen3-0.6B",
            "temperature": 0.1,
            "remove_think_prefix": True,
            "max_tokens": 8192
        }
    },
    "embedder": {
        "backend": "sentence_transformer",
        "config": {
            "model_name_or_path": "your embedding model path"
        }
    },
    "graph_db": {
        "backend": "neo4j",
        "config": {
            "uri": "bolt://localhost:7687",
            "user": "neo4j",
            "password": "yourpassword",
            "db_name": "neo4j",
            "auto_create": False,
            "embedding_dimension": 768
        }
    }
}

# 2. Запись в JSON файл
json_path = "cookbooktest/tree_config.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(config_data, f, indent=2, ensure_ascii=False)

print(f"Конфигурационный файл сгенерирован: {json_path}")

# 3. Чтение конфигурации и инициализация TreeTextMemory
config = TreeTextMemoryConfig.from_json_file(json_path)
tree_memory = TreeTextMemory(config)

```

---

## **Отчет По Оценке Эффективности: Проверка Производительности Рамки Укрепления Памяти MemCube**

### **Методы Оценки**

Чтобы количественно оценить повышение производительности, обеспечиваемое кардиологической MemCube, мы разработали автоматизированный процесс оценки. В его основе лежит использование мощной сторонней модели (например, Gemini-2.5-Pro) в качестве нейтрального "экзаменатора", чтобы проверить, как модели, оснащенные MemCube, улучшают свои способности к решению профессиональных задач.

#### Примеры Оценочных Заданий

```python
# questions (partial in 200 questions)
 'A 65-year-old male patient presents to the emergency department with severe lower abdominal pain, inability to urinate, and is complaining of lightheadedness and palpitations. His past medical history includes hypertension controlled with lisinopril, benign prostatic hyperplasia for which he has been taking tamsulosin, and moderate alcohol use. On examination, his heart rate is elevated at 105 beats per minute, blood pressure is 140/90 mmHg, and he appears uncomfortable. Palpation reveals a distended bladder. An ECG shows sinus tachycardia without ischemic changes. You suspect bladder distension might be causing autonomic reflex changes affecting cardiac function. Considering this scenario, explain the physiological mechanism by which bladder distension might result in cardiac symptoms, and outline your approach to managing this patient to resolve both the urinary and cardiovascular concerns.',
 'In an elderly patient with poorly controlled diabetes, how do advanced glycation end products (AGEs) contribute to the pathophysiology of endothelial injury, and what implications does this have for the management of cardiovascular risks?',
 'A middle-aged patient with venous insufficiency is monitored using transcutaneous oxygen measurements to assess tissue perfusion. How does venous insufficiency affect transcutaneous oxygen levels, and how should these results influence treatment decisions for skin ulcers?',
 'A young adult with confirmed tubular acidosis is presenting with significant metabolic acidosis. How would sodium bicarbonate therapy be utilized in this case, and what are the considerations for its dosages and effects?'
```

```python
 
#### Реализация Основного Процесса Поиска
# Скрипт ниже демонстрирует шаги поиска на основе MemCube: с помощью метода `tree_memory.search()`. Точно находите наиболее схожие фрагменты знаний из нашего обширного MemCube, соответствующие семантике текущего вопроса. Вы также можете настроить модель chat для реализации функции диалога напрямую.
# question_list: Список схожих вопросов, предоставленных пользователем для поиска. Например: ['Каковы признаки инфаркта миокарда?', 'Каковы потенциальные опасности высокого кровяного давления?']
question_list = ['What are the signs of a myocardial infarction?', 'What are the potential dangers of high blood pressure?']
search_results_dict = {}

for i, question in enumerate(question_list):
    print(i)
    results = tree_memory.search(question, top_k=15)
    # Исключить короткие чисто концептуальные узлы
    filtered_results = [node.memory for node in results if len(node.memory) > 100]
    search_results_dict[i] = {
        'question': question,
        'results': filtered_results
    }
```

---

# 🧠 Отчет По Оценке Эффективности Медицинского ИИ MemCube

## 📋 Исполнительное Резюме

На основе объективной оценки 200 медицинских случаев, данный отчет всесторонне оценивает эффективность MemCube в медицинских приложениях ИИ. MemCube, построенный на базе знаний через MemOS, значительно улучшил способности медицинского рассуждения модели ИИ.

### **Ключевые Результаты Сравнения И Анализ**

#### **Статистика Прямых Побед И Поражений**

| Сравнение Конфигураций                     | MemCube Улучшенная Версия Побеждает | Baseline Базовая Версия Побеждает | Ничья |
| ------------------------------------ | :-------------: | :--------------: | :--: |
| **Сравнение Внутри Модели 7B**             |  **47**  |   **3**   | 150 |
| **Сравнение Внутри Модели 32B**            |  **92**  |   **0**   | 108 |
| **7B+MemCube vs 32B Baseline** |  **57**  |   **3**   | 140 |

#### **Ключевой Анализ Инсайтов**

1. **Для больших моделей точные знания в области по-прежнему имеют решающее значение**: Результаты показывают, что модель с 32B параметрами, оснащенная MemCube, демонстрирует подавляющее преимущество (92 победы и 0 поражений). Это подтверждает, что даже для моделей с уже сильными базовыми способностями структурированная внешняя база знаний может обеспечить решающий скачок в производительности, особенно в профессиональных областях, где требуется точность знаний.
2. **Система памяти реализует "малое против большого"**: В сравнении между 7B моделью и 32B базовой моделью, 7B модель с MemCube достигла значительного преимущества с 57 победами и 3 поражениями. Это ясно демонстрирует, что хорошо спроектированная система памяти может эффективно компенсировать недостаток знаний у малой модели, позволяя ей превосходить универсальные модели, которые в несколько раз больше.
3. **Система памяти имеет универсальную эффективность**: Независимо от того, 7B или 32B модель, после оснащения MemCube их профессионализм и точность ответов значительно возросли. Это указывает на то, что предложенная в этой главе структура "концептуальная карта - дистилляция знаний - усиление памяти" является универсальным и эффективным решением для повышения возможностей ИИ.

### **Глубокий Анализ Представительных Случаев**

Чтобы более наглядно понять механизм действия MemCube, мы провели глубокий анализ некоторых оценочных случаев.

#### **Анализ Случая 1 (Модель 7B, ID: 9): Ретинопатия Недоношенных (ROP) Случай**

**Клиническая Проблема**: Вопрос касается 6-летнего ребенка с ретинопатией недоношенных (ROP), который был направлен в кардиологическое отделение для системной оценки из-за изменений в микроциркуляции сетчатки. Вопрос требует оценки, какие кардиологические исследования следует провести, и как находки в глазном дне могут повлиять на стратегию кардиологической оценки.

**Клиническая Проблема:**

```
A 6-year-old child is referred to your cardiovascular clinic for evaluation after being diagnosed with retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and has expressed concerns regarding the child's cardiovascular health given the potential systemic implications of microvascular changes observed in ROP. As you assess the child, you consider possible cardiovascular complications that may arise. What cardiovascular assessments would be pertinent in this case, and how might the existing retinal findings influence your cardiovascular evaluation strategy, particularly concerning microvascular health and its potential systemic effects?
```

**Улучшенный Ответ MemCube**:

```
{'model': 'qwen2.5-7b-instruct', 'version': 'v2', 'question_id': 9, 'prompt': "As an experienced medical expert, provide comprehensive analysis using evidence-based medicine principles.\n\n**CLINICAL CASE:**\nA 6-year-old child is referred to your cardiovascular clinic for evaluation after being diagnosed with retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and has expressed concerns regarding the child's cardiovascular health given the potential systemic implications of microvascular changes observed in ROP. As you assess the child, you consider possible cardiovascular complications that may arise. What cardiovascular assessments would be pertinent in this case, and how might the existing retinal findings influence your cardiovascular evaluation strategy, particularly concerning microvascular health and its potential systemic effects?\n\n**KEY EVIDENCE:**\n• Question: A young child presents with suspected retinopathy of prematurity, potentially linked to a congenital heart defect that has led to inconsistent oxygen delivery. As a cardiovascular specialist, how would you approach the management of this child's systemic condition to optimize retinal health?\n\nReasoning Guidance: Evaluate the impact of the congenital heart defect on systemic oxygenation. Consider the role of oxygen supplementation and monitoring. Integrate cardiovascular management strategies with ophthalmologic treatment to optimize retinal health.\n\nKnowledge Facts: Pediatric retinal disorders often involve insufficient retinal vascular development.; Pediatric retinal disorders can be exacerbated by systemic oxygen imbalances, common in congenital heart defects.; Effective management of pediatric retinal disorder requires collaboration with ophthalmology and cardiology.\n\nAnswer: The management involves stabilizing systemic oxygen levels through correction of the heart defect, if feasible, and careful use of supplemental oxygen. Coordination with an ophthalmologist to monitor retinal changes and implement laser therapy or surgical interventions may be required.\n• Question: During a cardiovascular examination, a pediatric patient with coexisting retinal and cardiovascular disorders seems to have poor growth despite appropriate medical interventions. What could be the systemic implications of these concurrent conditions, and how should clinical decision-making address these concerns?\n\nReasoning Guidance: Integrate understanding of pediatric retinal disorder with the potential cardiovascular inefficiencies causing poor systemic circulation and growth delays. Consider multidisciplinary approaches for these intertwined issues, promoting comprehensive care strategies.\n\nKnowledge Facts: Pediatric retinal disorders and cardiac anomalies can have overlapping pathogenic mechanisms affecting systemic development.; A comprehensive clinical approach involves assessing the interplay between circulatory efficiency and ocular vascular health.; Addressing underlying cardiovascular inefficiencies may relieve secondary complications impacting systemic development.\n\nAnswer: The clinical approach should prioritize optimization of cardiovascular function to improve circulation efficiencies, potentially benefiting retinal health and promoting growth. Collaboration across specialties, including cardiology, ophthalmology, and pediatrics, is crucial for comprehensive systemic management.\n• Question: A young adult with a history of pediatric retinal disorder secondary to Kawasaki disease is undergoing cardiovascular follow-up for potential coronary artery complications. How can ongoing retinal issues influence cardiovascular management?\n\nReasoning Guidance: Assess how retinal issues, such as impaired visual acuity or peripheral vision loss, might affect compliance or understanding of cardiovascular treatment plans. Consider unique strategies in communication or monitoring to enhance treatment adherence.\n\nKnowledge Facts: Pediatric retinal disorders can result from inflammatory conditions like Kawasaki disease impacting vasculature.; In patients with persistent retinal disorder consequences, visual limitations could obstruct understanding of complex medical instructions.; Cardiovascular management must adapt to individual patient's sensory and learning capabilities, ensuring thorough education about treatment and prevention strategies.\n\nAnswer: Management may require tailored communication strategies, ensuring the patient fully understands and is capable of following the prescribed cardiovascular treatment. Regular check-ups should integrate assessments of retinal status to anticipate any complications affecting routine cardiovascular care.\n• Question: A premature infant is undergoing ophthalmic screening for retinopathy of prematurity (ROP). What complications, if untreated, might arise related to the retina?\n\nReasoning Guidance: Understand how untreated ROP can lead to tractional retinal detachment in premature infants.\n\nKnowledge Facts: Retinopathy of prematurity involves abnormal retinal vessel development.; Advanced ROP can result in retinal traction and detachment.; Screening and early treatment are critical in preventing detachment.\n\nAnswer: Regular screening and timely intervention, such as laser photocoagulation, are essential to prevent retinal detachment.\n\nPlease provide evidence-based medical analysis and management recommendations.", 'response': "### Comprehensive Analysis and Management Recommendations for a Child with Retinopathy of Prematurity (ROP) and Potential Cardiovascular Complications\n\n#### Clinical Case Overview\nA 6-year-old child has been referred to a cardiovascular clinic for evaluation due to a diagnosis of retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and expressed concerns about potential systemic implications, particularly regarding microvascular health and its potential systemic effects.\n\n#### Key Evidence and Reasoning\n\n1. **Impact of Congenital Heart Defect on Systemic Oxygenation:**\n   - **Congenital Heart Defects and ROP:** Congenital heart defects can lead to inconsistent oxygen delivery, which can affect retinal vascular development. The retina is highly sensitive to oxygen levels, and inadequate oxygenation can result in ROP.\n   - **Management Strategy:**\n     - **Correcting the Heart Defect:** If the congenital heart defect is correctable, surgical intervention should be considered to improve systemic oxygenation.\n     - **Supplemental Oxygen:** In the interim, supplemental oxygen can be used to optimize oxygen levels, but it should be carefully monitored to avoid hyperoxia, which can also be detrimental.\n     - **Collaboration with Ophthalmology:** Regular ophthalmologic follow-up is essential to monitor retinal changes and intervene with laser therapy or surgical interventions if necessary.\n\n2. **Systemic Implications of Concurrent Conditions:**\n   - **Poor Growth and Circulatory Efficiency:** Poor growth in a child with both retinal and cardiovascular disorders may be due to systemic circulatory inefficiencies. This can be exacerbated by underlying cardiovascular anomalies.\n   - **Multidisciplinary Approach:**\n     - **Cardiovascular Optimization:** Focus on optimizing cardiovascular function to improve circulation efficiency. This may include pharmacological interventions, lifestyle modifications, and, if necessary, surgical interventions.\n     - **Comprehensive Care:** Collaboration between cardiology, ophthalmology, and pediatrics is essential to address the interplay between circulatory efficiency and ocular vascular health.\n\n3. **Ongoing Retinal Issues and Cardiovascular Management:**\n   - **Visual Limitations and Treatment Adherence:** Retinal issues, such as impaired visual acuity or peripheral vision loss, can affect a patient's ability to understand and adhere to complex medical instructions.\n   - **Tailored Communication Strategies:**\n     - **Simplified Instructions:** Use clear and simple language to ensure the patient or caregiver fully understands the treatment plan.\n     - **Visual Aids and Educational Materials:** Provide visual aids and educational materials to enhance understanding and compliance.\n     - **Regular Follow-ups:** Schedule regular check-ups to monitor both cardiovascular and retinal health, ensuring timely intervention if any complications arise.\n\n4. **Complications of Untreated ROP:**\n   - **Tractional Retinal Detachment:** Advanced ROP can lead to retinal traction and detachment, which can result in severe visual impairment or blindness.\n   - **Screening and Early Intervention:**\n     - **Regular Ophthalmic Screening:** Implement regular ophthalmic screening for premature infants to detect ROP early.\n     - **Timely Intervention:** Promptly intervene with laser photocoagulation or other treatments to prevent retinal detachment.\n\n### Evidence-Based Medical Analysis and Management Recommendations\n\n1. **Initial Assessment:**\n   - **Cardiovascular Examination:** Perform a thorough cardiovascular examination, including echocardiography, to assess the presence and severity of any congenital heart defects.\n   - **Ophthalmologic Evaluation:** Conduct a comprehensive ophthalmologic examination to assess the extent of retinal changes and determine the stage of ROP.\n\n2. **Management Plan:**\n   - **Correct Congenital Heart Defects:** If the heart defect is correctable, arrange for surgical intervention to improve systemic oxygenation.\n   - **Supplemental Oxygen Therapy:** Use supplemental oxygen cautiously to optimize oxygen levels, but monitor for hyperoxia.\n   - **Collaborative Care:** Establish a multidisciplinary care team including cardiology, ophthalmology, and pediatrics to coordinate treatment and monitoring.\n   - **Growth Monitoring:** Regularly monitor the child's growth and development to address any systemic circulatory inefficiencies.\n   - **Communication Strategies:** Use simplified instructions and visual aids to enhance treatment adherence, especially if the child has visual limitations.\n   - **Ophthalmic Screening:** Implement regular ophthalmic screening for premature infants to detect ROP early and intervene promptly.\n\n3. **Monitoring and Follow-ups:**\n   - **Regular Follow-ups:** Schedule regular follow-ups with both the cardiologist and ophthalmologist to monitor the child's cardiovascular and retinal health.\n   - **Adjustments to Treatment:** Be prepared to adjust the treatment plan based on the child's response to interventions and any new findings.\n\nBy following these evidence-based recommendations, the healthcare team can optimize the child's cardiovascular and retinal health, ensuring the best possible outcomes for the patient.", 'length': 5313, 'api_time': 89.44595098495483, 'timestamp': 1753351860.232497, 'error': False}
```

**Ответ Baseline**:

```
{'model': 'qwen2.5-7b-instruct', 'version': 'baseline', 'question_id': 9, 'prompt': "Analyze this clinical case as a senior medical expert:\n\nA 6-year-old child is referred to your cardiovascular clinic for evaluation after being diagnosed with retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and has expressed concerns regarding the child's cardiovascular health given the potential systemic implications of microvascular changes observed in ROP. As you assess the child, you consider possible cardiovascular complications that may arise. What cardiovascular assessments would be pertinent in this case, and how might the existing retinal findings influence your cardiovascular evaluation strategy, particularly concerning microvascular health and its potential systemic effects?\n\nPlease provide detailed medical analysis and recommendations.", 'response': "In this clinical case, a 6-year-old child with retinopathy of prematurity (ROP) presents with significant retinal vessel changes, raising concerns about potential systemic implications. As a senior medical expert, I would recommend a comprehensive cardiovascular evaluation to assess for any underlying cardiovascular complications that may be related to the microvascular changes observed in the retina. Here is a detailed analysis and a recommended evaluation strategy:\n\n### 1. **Medical History and Physical Examination**\n- **Medical History:**\n  - **Perinatal History:** Obtain detailed information about the child's birth, including gestational age, birth weight, and any complications during delivery.\n  - **Family History:** Inquire about any cardiovascular or ocular diseases in the family.\n  - **Past Medical History:** Review any previous medical conditions, surgeries, or treatments.\n  - **Current Medications:** Document any medications the child is currently taking.\n- **Physical Examination:**\n  - **General Appearance:** Assess for signs of prematurity or other systemic conditions.\n  - **Cardiovascular Examination:**\n    - **Heart Sounds:** Auscultate for any murmurs, gallops, or rubs.\n    - **Peripheral Vascular Signs:** Check for signs of hypertension, such as brachial artery blood pressure differences, or signs of coarctation of the aorta.\n    - **Capillary Refill Time:** Evaluate for any signs of poor perfusion.\n\n### 2. **Cardiovascular Assessments**\nGiven the potential systemic implications of microvascular changes observed in ROP, the following cardiovascular assessments are pertinent:\n\n#### **A. Blood Pressure Measurement**\n- **Non-Invasive Measurement:** Measure blood pressure in both arms to detect any differences that might suggest coarctation of the aorta.\n- **Ambulatory Blood Pressure Monitoring (ABPM):** Consider this if there are any signs of hypertension or if the child is symptomatic.\n\n#### **B. Echocardiography**\n- **Echocardiogram:** This is the gold standard for evaluating cardiac structure and function. It can help identify any congenital heart defects, valvular abnormalities, or other structural heart issues that might be related to the microvascular changes.\n- **Fetal Echocardiography:** If the child was born prematurely, a fetal echocardiogram might have been performed, which could provide additional information.\n\n#### **C. Cardiac MRI or CT**\n- **Imaging Studies:** If there are specific concerns about complex cardiac anatomy or if echocardiography is inconclusive, cardiac MRI or CT can provide detailed images of the heart and great vessels.\n\n#### **D. Cardiovascular Risk Factors**\n- **Fasting Lipid Profile:** Assess for dyslipidemia, which can be a risk factor for cardiovascular disease.\n- **Fasting Blood Glucose:** Evaluate for diabetes or impaired glucose tolerance, which can also contribute to cardiovascular risk.\n- **Anthropometric Measurements:** Measure height, weight, and body mass index (BMI) to assess for obesity, which is a significant risk factor for cardiovascular disease.\n\n### 3. **Ophthalmologic and Microvascular Health Considerations**\n- **Retinal Changes:** The significant retinal vessel changes in ROP suggest microvascular abnormalities. These changes are often associated with systemic conditions such as hypertension, diabetes, and other vascular disorders.\n- **Systemic Evaluation:** Given the systemic implications, a thorough evaluation for other microvascular diseases should be considered, including:\n  - **Fundoscopy:** Regular follow-up fundoscopy to monitor for progression of ROP.\n  - **Retinal Vessel Fluorescein Angiography:** To assess the integrity of the retinal vasculature and identify any areas of leakage or ischemia.\n  - **Systemic Blood Pressure Monitoring:** Regular monitoring of blood pressure to detect any hypertension.\n  - **Glucose Tolerance Testing:** To screen for diabetes or impaired glucose tolerance.\n\n### 4. **Recommendations**\n- **Referral to a Pediatric Cardiologist:** Given the potential systemic implications, it is crucial to refer the child to a pediatric cardiologist for a comprehensive cardiovascular evaluation.\n- **Regular Follow-Up:** Schedule regular follow-up visits to monitor the child's cardiovascular health and retinal status.\n- **Lifestyle Modifications:** If any risk factors are identified, implement lifestyle modifications such as a healthy diet, regular exercise, and weight management.\n- **Genetic Counseling:** Consider genetic counseling if there is a family history of cardiovascular or ocular diseases.\n\n### Conclusion\nThe microvascular changes observed in ROP suggest a potential systemic vascular disease. A comprehensive cardiovascular evaluation, including echocardiography, blood pressure monitoring, and other relevant tests, is essential to identify any underlying cardiovascular complications. Regular follow-up and monitoring are crucial to ensure early detection and management of any potential issues.", 'length': 4977, 'api_time': 92.66847014427185, 'timestamp': 1753351863.4531698, 'error': False}
```

**Анализ Случая**:
В этом случае базовая модель (Ответ B) предоставила стандартный клинический процесс оценки, охватывающий сбор анамнеза, физикальное обследование и различные кардиологические исследования. Однако ее ответ не углубился в исследование внутренней патофизиологической связи между ROP и сердечно-сосудистой системой.

В отличие от этого, модель, усиленная MemCube (Ответ A), продемонстрировала более высокий уровень клинического рассуждения. Она смогла вызвать и интегрировать несколько связанных фрагментов знаний (эти знания были дистиллированы из нашей QA-памяти для концепций "ROP", "врожденные пороки сердца", "системная оксигенация"), например:

* Четко указала, что "врожденные пороки сердца могут привести к нестабильной доставке кислорода, что, в свою очередь, влияет на развитие сосудов сетчатки".
* Подчеркнула потенциальные преимущества оптимизации "эффективности системного кровообращения" для улучшения здоровья сосудов глаз и общего развития.

Это иллюстрирует ключевое преимущество MemCube: он не просто осуществляет простую выборку информации, а эффективно связывает разрозненные точки знаний во время рассуждения, формируя многоаспектную и более глубокую аналитическую структуру. Это позволяет усиленной модели действовать как опытный эксперт, исследуя проблему с точки зрения причин и предлагая междисциплинарные стратегии комплексного управления, а не просто перечисляя пункты обследования.

---

### Оценка Эффективности MemCube Для Модели 32B

#### Пример 1: Сравнение Вопросов и Ответов в Медицине (ID: 146)

**Клинический Вопрос**: Для взрослого пациента, у которого диагностирована идиопатическая дилатационная кардиомиопатия (DCM) и наблюдаются симптомы сердцебиения и головокружения, спрашивается, как наличие аритмии влияет на его диагностику и стратегию лечения.
**Клинический Вопрос**:

```
An adult patient with known idiopathic dilated cardiomyopathy presents with palpitations and dizziness. How does the presence of arrhythmias influence your diagnostic and therapeutic approach, especially in the context of managing dilated cardiomyopathy?
```

**Улучшенный Ответ MemCube**:

```
{'model': 'qwen2.5-32b-instruct', 'version': 'v2', 'question_id': 146, 'prompt': 'As an experienced medical expert, provide comprehensive analysis using evidence-based medicine principles.\n\n**CLINICAL CASE:**\nAn adult patient with known idiopathic dilated cardiomyopathy presents with palpitations and dizziness. How does the presence of arrhythmias influence your diagnostic and therapeutic approach, especially in the context of managing dilated cardiomyopathy?\n\n**KEY EVIDENCE:**\n• Question: A middle-aged patient diagnosed with idiopathic dilated cardiomyopathy presents with palpitations and dizziness. Considering the risk of proarrhythmia, what diagnostic strategies and management plans should be considered?\n\nReasoning Guidance: Evaluate the role of idiopathic dilated cardiomyopathy in altering cardiac electrophysiology, leading to arrhythmic complications. Discuss the impact of heart failure medications on arrhythmia risk and selection of antiarrhythmic drugs fostering minimal proarrhythmic potential.\n\nKnowledge Facts: Idiopathic dilated cardiomyopathy can lead to heart chamber enlargement affecting electrical conduction.; Proarrhythmia refers to the increased risk of arrhythmias caused by medications or cardiac conditions.; Monitoring with ECG and considering beta-blocker or anticoagulant therapy are key in management.\n\nAnswer: Given the history of idiopathic dilated cardiomyopathy, the patient should be monitored closely with ECG for arrhythmic patterns. Opt for rhythm-stabilizing medications like beta-blockers while avoiding drugs with high proarrhythmic potential.\n• Question: An adult presents with palpitations and a recent diagnosis of idiopathic dilated cardiomyopathy. How should the presence of frequent atrial premature beats influence the clinical management of this patient?\n\nReasoning Guidance: Evaluate how atrial arrhythmias can exacerbate heart failure symptoms and potential management strategies to mitigate this risk.\n\nKnowledge Facts: Idiopathic dilated cardiomyopathy can lead to heart failure symptoms.; Frequent atrial premature beats can worsen cardiac function.; Managing arrhythmias may improve heart failure control.\n\nAnswer: Focus on optimizing heart failure management and consider treatment options for arrhythmias, such as beta-blockers or antiarrhythmic drugs.\n• Question: A young adult has been diagnosed with idiopathic dilated cardiomyopathy and is experiencing palpitations. Analyze how idiopathic dilated cardiomyopathy can cause palpitations and determine an appropriate treatment strategy.\n\nReasoning Guidance: Palpitations in dilated cardiomyopathy could indicate arrhythmias. Evaluate cardiac function and rhythm, using diagnostics to determine arrhythmia presence and guide treatment such as antiarrhythmics or device therapy.\n\nKnowledge Facts: Idiopathic dilated cardiomyopathy can lead to arrhythmias causing palpitations.; Palpitations may reflect arrhythmic risks in cardiomyopathy due to ventricular dysfunction.; Evaluating arrhythmia type and severity is essential in managing palpitations and potential heart failure exacerbations.\n\nAnswer: Investigate arrhythmia presence using ECG, consider beta-blockers or anti-arrhythmic medication, and evaluate need for device therapy like ICD.\n• Question: A young adult with idiopathic dilated cardiomyopathy presents with arrhythmias. How might disruptions in cardiac action potentials contribute to this presentation, and what treatment options should be considered?\n\nReasoning Guidance: Understand the mechanics of cardiac action potentials and how disruptions can lead to arrhythmias in dilated cardiomyopathy. Analyze therapeutic strategies targeting electrophysiological abnormalities.\n\nKnowledge Facts: Action potentials are crucial for coordinated cardiac contraction.; Idiopathic dilated cardiomyopathy can alter cardiac electrical activity.; Arrhythmias in cardiomyopathy may result from ion channel dysfunction or structural changes.\n\nAnswer: Altered cardiac action potentials due to cardiomyopathy can cause electrical instability, resulting in arrhythmias. Management includes antiarrhythmic drugs, device therapy, and addressing underlying structural heart issues.\n\nPlease provide evidence-based medical analysis and management recommendations.', 'response': '### Clinical Case Analysis: Idiopathic Dilated Cardiomyopathy with Palpitations and Dizziness\n\n#### Background\nIdiopathic dilated cardiomyopathy (IDC) is characterized by ventricular dilation and impaired systolic function, often leading to heart failure. The presence of arrhythmias in IDC is common and can exacerbate symptoms such as palpitations and dizziness, potentially leading to more severe complications like syncope or sudden cardiac death.\n\n#### Diagnostic Approach\n1. **Electrocardiogram (ECG) Monitoring:**\n   - **Initial ECG:** To identify any immediate arrhythmias, such as atrial fibrillation, ventricular tachycardia, or frequent premature beats.\n   - **Holter Monitoring:** For 24-48 hours to capture intermittent arrhythmias.\n   - **Event Monitor:** For patients with infrequent symptoms, to record arrhythmias as they occur.\n   - **Implantable Loop Recorder:** For patients with recurrent symptoms and negative initial monitoring.\n\n2. **Echocardiography:**\n   - To assess ventricular function, chamber dimensions, and wall motion abnormalities.\n   - To evaluate for any thrombus formation, which could be a source of embolic events.\n\n3. **Blood Tests:**\n   - Cardiac biomarkers (e.g., BNP, NT-proBNP) to assess heart failure severity.\n   - Thyroid function tests, as hyperthyroidism can cause palpitations.\n   - Electrolyte levels, particularly potassium and magnesium, which can affect cardiac rhythm.\n\n#### Therapeutic Approach\n1. **Optimization of Heart Failure Therapy:**\n   - **Beta-Blockers:** Proven to reduce mortality and hospitalization in IDC. They also stabilize the heart rhythm, reducing the risk of arrhythmias.\n   - **ACE Inhibitors/ARBs:** To reduce afterload and improve ventricular function.\n   - **Diuretics:** To manage fluid overload and alleviate symptoms of heart failure.\n   - **SGLT2 Inhibitors:** Emerging evidence supports their use in reducing cardiovascular events in heart failure patients.\n\n2. **Antiarrhythmic Therapy:**\n   - **Class I Antiarrhythmics (e.g., flecainide, propafenone):** Used cautiously due to potential proarrhythmic effects.\n   - **Class III Antiarrhythmics (e.g., amiodarone, sotalol):** Amiodarone is effective but has significant side effects; sotalol is a beta-blocker with antiarrhythmic properties.\n   - **Calcium Channel Blockers (e.g., verapamil, diltiazem):** Useful for certain arrhythmias like atrial fibrillation, but use with caution due to negative inotropic effects.\n\n3. **Device Therapy:**\n   - **Implantable Cardioverter Defibrillator (ICD):** Indicated in patients with IDC and reduced ejection fraction (EF <35%) to prevent sudden cardiac death.\n   - **Pacemakers:** Considered in patients with bradyarrhythmias or those requiring resynchronization therapy (CRT).\n\n4. **Lifestyle Modifications:**\n   - Smoking cessation, alcohol moderation, and a low-sodium diet.\n   - Regular, moderate-intensity exercise as tolerated.\n   - Stress management techniques to reduce arrhythmia triggers.\n\n#### Proarrhythmic Risk and Management\n- **Proarrhythmic Potential:** Antiarrhythmic drugs can paradoxically increase the risk of arrhythmias, particularly in patients with structural heart disease. Careful selection and monitoring are essential.\n- **Risk Stratification:** Use risk stratification tools like the CHA2DS2-VASc score for thromboembolic risk and the European Society of Cardiology guidelines for ICD implantation.\n\n#### Conclusion\nIn managing a patient with IDC and arrhythmias, a comprehensive approach is necessary, combining optimal heart failure therapy with targeted antiarrhythmic treatment and device therapy as indicated. Close monitoring and patient education are crucial to prevent complications and improve quality of life.', 'length': 3725, 'api_time': 18.48910903930664, 'timestamp': 1753352210.820965, 'error': False}
```

**Ответ Baseline**:

```
{'model': 'qwen2.5-32b-instruct', 'version': 'baseline', 'question_id': 146, 'prompt': 'Analyze this clinical case as a senior medical expert:\n\nAn adult patient with known idiopathic dilated cardiomyopathy presents with palpitations and dizziness. How does the presence of arrhythmias influence your diagnostic and therapeutic approach, especially in the context of managing dilated cardiomyopathy?\n\nPlease provide detailed medical analysis and recommendations.', 'response': "In the context of an adult patient with known idiopathic dilated cardiomyopathy (DCM) presenting with palpitations and dizziness, the presence of arrhythmias significantly influences the diagnostic and therapeutic approach. Here is a detailed analysis and recommendations based on current medical practices:\n\n### Clinical Context and Initial Assessment\n- **Idiopathic Dilated Cardiomyopathy**: DCM is characterized by ventricular dilation and impaired systolic function, often leading to heart failure and arrhythmias.\n- **Symptoms**: Palpitations and dizziness are common symptoms that can be indicative of arrhythmias, which are frequent complications in DCM.\n- **Risk Factors**: The patient's history of DCM places them at higher risk for arrhythmias, particularly atrial fibrillation (AF), ventricular tachycardia (VT), and bradyarrhythmias.\n\n### Diagnostic Approach\n1. **History and Physical Examination**: Detailed history to understand the onset, duration, and triggers of palpitations and dizziness. Physical examination should focus on signs of heart failure, such as jugular venous distension, rales, and peripheral edema.\n2. **Electrocardiogram (ECG)**: Essential for detecting arrhythmias. Can identify AF, VT, or other conduction abnormalities.\n3. **Holter Monitoring**: Useful for patients with intermittent symptoms to capture arrhythmias that may not be evident on a standard ECG.\n4. **Echocardiography**: To assess ventricular function, size, and potential thrombus formation, especially if AF is suspected.\n5. **Cardiac MRI**: Provides detailed images of the heart structure and function, which can be crucial in assessing the extent of DCM and ruling out other causes of cardiomyopathy.\n6. **Blood Tests**: Including electrolytes, thyroid function tests, and markers of heart failure (BNP/NT-proBNP).\n\n### Therapeutic Approach\n1. **Management of Arrhythmias**:\n   - **Atrial Fibrillation**: If diagnosed, rate control or rhythm control strategies should be considered. Rate control can be achieved with beta-blockers or non-dihydropyridine calcium channel blockers. Rhythm control might involve antiarrhythmic drugs or catheter ablation.\n   - **Ventricular Tachycardia**: If VT is suspected or confirmed, antiarrhythmic drugs (e.g., amiodarone) or implantable cardioverter-defibrillator (ICD) may be necessary. Catheter ablation can also be considered.\n   - **Bradyarrhythmias**: If bradyarrhythmias are present, a pacemaker may be indicated.\n\n2. **Management of Dilated Cardiomyopathy**:\n   - **Heart Failure Medications**: Continue or initiate medications such as ACE inhibitors/ARBs, beta-blockers, aldosterone antagonists, and diuretics as needed.\n   - **Lifestyle Modifications**: Encourage a heart-healthy diet, regular physical activity, and smoking cessation.\n   - **Monitoring**: Regular follow-up with echocardiography and clinical assessment to monitor disease progression and response to therapy.\n\n3. **Anticoagulation**:\n   - If AF is present, anticoagulation therapy is necessary to prevent thromboembolic events. The choice of anticoagulant (e.g., warfarin, direct oral anticoagulants) should be based on the patient's risk factors and comorbidities.\n\n### Prognosis and Long-Term Management\n- **Prognosis**: The presence of arrhythmias in DCM can worsen prognosis. Regular monitoring and timely intervention are crucial.\n- **Long-Term Management**: Focus on preventing arrhythmias and heart failure exacerbations. Consider multidisciplinary care involving cardiologists, electrophysiologists, and heart failure specialists.\n\n### Conclusion\nThe presence of arrhythmias in a patient with idiopathic dilated cardiomyopathy requires a comprehensive approach, including thorough diagnostic evaluation and tailored therapeutic interventions. The goal is to manage both the underlying cardiomyopathy and the arrhythmias to improve the patient's quality of life and prognosis.", 'length': 3902, 'api_time': 13.865102052688599, 'timestamp': 1753352205.427208, 'error': False}
```

**Анализ Случая**:
Базовая модель 32B уже может дать довольно полные и точные ответы, охватывающие процесс диагностики, схемы лечения и управление прогнозом.

Тем не менее, модель, улучшенная MemCube, превосходит в **структурности, логичности и глубине деталей**. Путем поиска и интеграции QA-памяти MemCube по концепциям "DCM", "аритмия", "риск аритмии" и т.д., Ответ A демонстрирует следующие характеристики:

* **Более Четкая Логическая Структура**: Ответ A классифицирует методы диагностики и лечения, например, объясняет антиаритмические препараты по категориям (Class I, Class III и т.д.) и четко указывает на меры предосторожности при их использовании в контексте DCM (например, риск аритмии).
* **Выделение Ключевых Знаний**: Ответ A явно указывает на "оптимизацию лечения сердечной недостаточности" как основу для управления аритмией и перечисляет двойное действие таких препаратов, как β-блокаторы, в стабилизации сердечного ритма. Все это основано на QA-памяти MemCube, подчеркивающей ключевые моменты клинической практики.
* **Увеличенная Осведомленность о Рисках**: Ответ A специально включает раздел "Риск и Управление Аритмией", что показывает, что модель не просто излагает знания, но и имитирует мышление эксперта по оценке рисков.

Этот случай показывает, что даже для мощной модели 32B, MemCube все еще может выполнять роль "коуча знаний", помогая модели организовывать и выражать обширные внутренние знания более структурированным и соответствующим клинической логике образом, предоставляя более ценные профессиональные рекомендации.

---

## 🚀 Практический Опыт: Демонстрация MemCube в Кардиологии

Система вопросов и ответов по кардиологическим знаниям, представленная в этой главе, уже построена и предлагает полную демонстрационную версию MemCube, содержащую **211,315 записей памяти** и **522,368 семантических связей**.

### 📦 Характеристики Демонстрационной Системы

- **🫀 Профессиональная Область**: Система знаний по кардиологии
- **📊 Масштаб Данных**: 211,315 высококачественных записей памяти
- **🔗 Сеть Связей**: 522,368 семантических соединений между концепциями  
- **💾 Размер Данных**: около 5.0GB структурированных медицинских знаний
- **🤖 Поддержка ИИ**: поддержка различных моделей LLM (GPT-4o, Claude, локальные модели и т.д.)
- **🌐 Готовность к Развертыванию**: производственная архитектура на основе Neo4j + MemOS

### 🔍 Испытайте Прямо Сейчас

Хотите самостоятельно испытать полный процесс построения и конечный результат, описанные в этой главе? Вы можете посетить наш демонстрационный проект:

**👉 [Cardio MemCube Demo - Hugging Face](https://huggingface.co/datasets/MemCube/cardio-memcube-demo)**

Этот демонстрационный проект предлагает:
- ✅ **Полное Руководство по Установке**: однонажатийное развертывание системы MemCube в кардиологии
- ✅ **Работающие Примеры Кода**: непосредственное испытание функций вопросов и ответов
- ✅ **Подробная Техническая Документация**: понимание методологии построения и лучших практик
- ✅ **Поддержка Многоязычных Моделей**: гибкая настройка различных бэкендов AI моделей

### ⚠️ Важное Примечание

- **🏥 Медицинский Отказ от Ответственности**: эта демонстрация предназначена только для технической демонстрации и образовательных целей и не должна использоваться в качестве основы для медицинской диагностики или лечения
- **🌐 Поддержка Языков**: текущая версия использует оптимизированную для английского языка модель встраивания, запросы на китайском языке требуют перевода или замены на многоязычную модель встраивания
- **🔧 Техническая Архитектура**: это техническая реализация, применимая к любой профессиональной области

Путем практического опыта с этой демонстрационной системой вы лучше поймете, как преобразовать теоретические методы из этой главы в реальные производственные приложения и накопите ценный опыт для построения вашей собственной системы MemCube в вашей области.
