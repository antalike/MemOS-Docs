---
title: Using MemOS to Build a Production-Grade Knowledge Q&A System
---

## **Preamble**

When building domain-specific Knowledge Q&A (QA) systems, the industry faces a common challenge: although Large Language Models (LLMs) have broad knowledge, they still lack precision and reliability in specialized domains; while traditional Retrieval-Augmented Generation (RAG) methods, although capable of introducing external knowledge, are limited by the discrete nature of documents and a lack of deep logical connections, making it difficult to handle complex reasoning-based questions.

The purpose of this chapter is to provide a demonstration of how to solve this problem based on MemOS, and to propose and implement a complete, production-grade knowledge enhancement solution demo. Our core objective is to prove and realize a key assertion: through a structured knowledge system, a carefully enhanced small-sized model can surpass the professional capabilities of a large model without enhancement.

To achieve this goal, we have designed and built a dynamic knowledge system called MemCube. Its construction process follows a rigorous engineering methodology:

**Mining and Structuring Implicit Knowledge**: We first systematically mine the implicit knowledge about a specific domain within a Large Language Model (LLM), and transform it into a large-scale, high-coverage explicit concept relationship graph through the method of "iterative concept graph augmentation".

**Generating Structured Knowledge Pairs**: Subsequently, using this concept graph as a guide, we again leverage the LLM to generate a large number of high-quality, Question-Answering (QA) knowledge pairs containing complex clinical logic, serving as the core content of the knowledge base.

**Building and Deploying the Knowledge Base**: Finally, we organize and load these QA knowledge pairs into a graph database (Neo4j) to form a dynamic knowledge base (MemCube) that can be efficiently retrieved by the MemOS system, thereby enhancing the domain capabilities of the small model.

This chapter will use a case study in the field of cardiovascular medicine to fully demonstrate the entire process of building MemCube from scratch, and through quantitative evaluation, validate the system's significant effect in enhancing the model's professional Q&A capabilities, providing a reusable standard process for implementing low-cost, high-precision, and explainable AI knowledge services in practical business.

---

## **Chapter Introduction: A Blueprint for Building a Dynamic Knowledge System**

The core research objective of this chapter is to verify that by systematically building a MemOS knowledge base (i.e., MemCube), a model with a relatively small parameter scale (e.g., 7B level) can achieve or even surpass the performance level of a large model (e.g., 32B+ level) in domain-specific Q&A performance.

This chapter will guide you through a complete knowledge engineering practice. Our ultimate goal is to build an intelligent Q&A system dedicated to the field of cardiology. To achieve this, we will follow a clear, phased path, with each step building upon the output of the previous one.

The overall outline of this chapter is as follows:

### **Phase One: Building the Foundational Structure of Domain Knowledge—Concept Graph Augmentation**

This is the foundation of all work. A high-quality knowledge base begins with a comprehensive and structured domain concept network, which is an explicit representation of the domain's implicit knowledge.

**Objective**: To create a large-scale graph that broadly covers the core concepts and their interrelationships in the field of cardiology.

**Acquiring Seed Concepts**: We filter materials from the cardiovascular domain from a professional medical dataset and use an LLM to preliminarily extract a batch of high-quality "seed concepts" as the starting point for the graph.

**Iterative Augmentation**: Based on the seed concepts, we use a multi-round automated process to have the LLM associate based on existing concepts in the graph, continuously generating new related concepts and establishing connections.

**Convergence and Evaluation**: We will introduce strict convergence control mechanisms (such as merging similar nodes, monitoring the growth rate of new concepts) to ensure the graph stops growing after reaching sufficient knowledge coverage. Finally, we will quantitatively evaluate the completeness of our graph by comparing it with keywords from external knowledge sources.

### **Phase Two: Generating Applicable Knowledge Content—Generating QA Pairs Based on the Graph**

With the concept graph as the foundational structure, we next need to populate it with specific knowledge that can be directly understood and utilized by AI, namely, question-answer pairs.

**Objective**: To transform the abstract concepts and relationships in the graph into a large number of specific QA pairs containing clinical logic.

**Single-Concept Knowledge Generation**: Traverse each core concept node in the graph and use an LLM to generate independent, in-depth clinical questions and answers for each concept.

**Relational Knowledge Generation**: For "concept pairs" that are connected in the graph, we have the LLM generate more complex, relational questions that reflect the intrinsic logic between them.

### **Phase Three: Assembling and Deploying the Knowledge Base—Constructing and Mounting MemCube**

Discrete QA data needs to be organized into an efficient system.

**Objective**: To structure all generated QA data and load it into a graph database, forming a knowledge base that can be called by MemOS at any time.

**Process**:

**Data Formatting**: We will unify all QA pairs into a standard JSON format and generate vector embeddings for the question texts to be used for retrieval.

**Graph Database Import**: Write scripts to batch and efficiently import the formatted node (concept, QA) and edge (relationship) data into a Neo4j database.

**MemOS Mounting**: Finally, through simple configuration, we will point the MemOS system to this Neo4j database, officially activating our cardiovascular MemCube.

### **Phase Four: Validating the Final Outcome—System Evaluation**

After construction is complete, we need to prove its value with objective data.

**Objective**: To quantitatively evaluate whether a smaller large model equipped with MemCube has surpassed an un-enhanced large model in professional Q&A capabilities.

**Process**: We will build an independent evaluation set and, through automated scripts, conduct a "same-question competition" for models with different configurations. A more powerful model will act as a referee for scoring, and finally, we will use win rates and scores to demonstrate the actual effectiveness of our system.

Through the above four phases, you will clearly see how an abstract business requirement is progressively implemented into a powerful, evaluatable AI knowledge system through a rigorous engineering methodology.
------------------------------------------------------------------------------------------------------------------------------

## **Construction and Augmentation of the Domain Concept Graph**

### **Objective**

To transform unstructured knowledge from a specific domain into a high-quality, structured set of seed concepts, which is the cornerstone for building an intelligent MemCube.

### **Core Philosophy**

In professional Q&A scenarios, the training data of Large Language Models (LLMs) already contains a massive amount of implicit domain knowledge. The challenge lies in how to systematically "extract" and "organize" this knowledge, thereby enabling a domain-specific, small-scale MemCube to possess knowledge capabilities comparable to those of a large model.

Directly asking an LLM "Please provide all knowledge in the cardiovascular field" is inefficient and infeasible. Therefore, we must establish a series of precise **"concept anchors"** and, based on these, systematically outline the knowledge graph of the domain within the LLM. Although the coverage of domain knowledge is difficult to quantify directly, we can indirectly measure it by the completeness of core concepts and keywords within the domain. The ultimate goal of this step is to capture domain concepts as comprehensively as possible to provide structured support for subsequent knowledge extraction.

---

### **Step 1: Seed Concept Acquisition**

The construction of the graph begins with acquiring a batch of high-quality "seed concepts." These initial concepts are the starting point for the iterative augmentation of the graph, and their quality directly affects the speed and efficiency of the model in building the domain knowledge framework.

To ensure the professionalism and coverage of the seed concepts, this experiment uses the public medical expert question dataset `medxpert` as the initial data source. This dataset contains clear medical domain classifications, making it convenient for us to accurately filter knowledge related to the cardiovascular field.

Sincere thanks to: The MedXpert public benchmark

Data download address: https://raw.githubusercontent.com/TsinghuaC3I/MedXpertQA/refs/heads/main/eval/data/medxpertqa/input/medxpertqa_text_input.jsonl

The following code demonstrates the process of data loading and filtering.

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

We define the following environment variables:

```python
# api url; the api key is your specific setting
# For the specific LLM models used:
# 1. In the stage of summarizing and inducing seed concepts, we use a powerful model MEDXPERT_THINKER=o3 to augment the existing 100+ questions in the medxpert cardiovascular domain and extract its thought process for analyzing the problems. Our purpose is not to have o3 answer each question correctly, but rather, after it thinks through and analyzes each cardiovascular problem, to summarize cardiovascular seed concepts from its thought process.
# 2. After extracting o3's thought process, we use MEDXPERT_THINK_EXTRACTOR=gpt-4o to extract cardiovascular concept nouns from its thought process to serve as seed concepts.
# For the two steps above, our purpose is to build a seed concept library; if you have your own proprietary domain document library, you can feel free to skip this stage and directly extract the seed concepts you are interested in from your domain documents.
# 3. After the seed concept library is established, we will proceed with domain concept graph augmentation. For this step, we recommend that you choose your model based on our experimental results and your cost budget as appropriate. In our experimental phase, we use CONCEPT_GRAPH_EXTENDER=gpt-4omini as a reference.
# 4. After the domain concept graph is completely built, we will perform separate QA generation for (a) each concept and (b) each meaningful concept pair. Since QA generation depends on the model's capabilities, we recommend you use a powerful model. In our experimental phase, we use QA_SYNTHESIZER=gpt-4o as a reference.
# For all embedding models used, we apply the open-source English embedding model EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5
api_url="your api url"
api_key="your api key"

# all possibly used models:
MEDXPERT_THINKER = 'o3'
MEDXPERT_THINK_EXTRACTOR = 'gpt-4o'
CONCEPT_GRAPH_EXTENDER = 'gpt-4o-mini'
QA_SYNTHESIZER = 'gpt-4o'
EMBEDDING_MODEL = 'nomic-ai/nomic-embed-text-v1.5'
```

```python
# Extract seed concepts from the latest medxpert dataset, which has the advantage of having corresponding field divisions
import json
from collections import Counter

data = []
with open("medxpertqa_text_input.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        data.append(json.loads(line.strip()))

# Extract cardiovascular field test questions
body_system_counts = Counter(entry["body_system"] for entry in data)
heart_data = []
for i in range(len(data)):
    if data[i]['body_system']=='Cardiovascular':
        heart_data.append(data[i])  
```

To enable stable and efficient interaction with large-scale language model APIs, we built a modular API client. This client integrates a connection pool, an automatic retry mechanism based on exponential backoff, and request timeout control, ensuring robustness under high concurrency. We also defined a standardized data structure (`AnalysisResult`) to uniformly store request results for easy subsequent processing.

```python

@dataclass
class AnalysisResult:
    """class for analyzing the result"""
    status: str  # success, api_error
    question_id: str
    input_data: Dict
    response: Optional[str] = None
    error_details: Optional[str] = None
    processing_time: Optional[float] = None

class APIClient:
    """class for api calling"""

    def __init__(self, api_url: str, api_key: str, model_name: str):
        self.api_url = api_url
        self.api_key = api_key
        self.model_name = model_name

        # Create a session and configure the connection pool and retry strategy
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
        """call api"""
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

We encapsulate and generate instructions for interacting with the LLM through a carefully designed `PromptTemplate` class. This template sets the role of the LLM as a senior professor of clinical medicine and requires it to systematically deconstruct and analyze medical problems in a structured manner. Such structured output is the key to the precise extraction of information in subsequent steps.

```python

class PromptTemplate:

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

In order to chain the above components together, we designed two processors. `CardioAnalysisProcessor` is responsible for handling a single question: it combines the Prompt, calls the API, and returns a structured result. Meanwhile, `BatchProcessor` uses a thread pool (`ThreadPoolExecutor`) to achieve high-concurrency processing, allowing all filtered questions to be handed over to `CardioAnalysisProcessor` in batches and in parallel, while automatically saving the results of each batch. This design is a necessary guarantee for achieving production-level data processing efficiency.

```python
# Extract the LLM thought process, to prepare for subsequent seed concepts
class CardioAnalysisProcessor:

    def __init__(self, api_client: APIClient):
        self.api_client = api_client
        self.template = PromptTemplate()

    def process_single_question(self, question_data: Dict, question_id: str) -> AnalysisResult:

        start_time = time.time()
  
        system_prompt = self.template.get_system_prompt()
        user_prompt = self.template.get_analysis_prompt(question_data)
  
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

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

    def __init__(self, processor: CardioAnalysisProcessor, output_dir: str = "cardio_analysis"):
        self.processor = processor
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def process_questions_list(self, heart_data: List[Dict], max_workers: int = 10, 
                                batch_size: int = 50, batch_delay: int = 1) -> Dict:
        """Batch process cardiovascular questions"""
        total_questions = len(heart_data)
        print(f"Starting batch processing for {total_questions} cardiovascular clinical questions")
        print(f"Batch size: {batch_size}, Max workers: {max_workers}")

        all_results = {}
        batch_num = 1

        # Process in batches
        for i in range(0, total_questions, batch_size):
            batch_data = heart_data[i:i + batch_size]
            print(f"\nProcessing batch {batch_num}: Questions {i+1}-{min(i+batch_size, total_questions)} ({len(batch_data)} items)")

            batch_start_time = time.time()
            batch_results = self._process_batch(batch_data, max_workers, i)
            batch_end_time = time.time()

            # Save batch results
            self._save_batch_results(batch_results, batch_num, batch_start_time)

            all_results.update(batch_results)

            print(f"Batch {batch_num} finished, time taken: {batch_end_time - batch_start_time:.2f} seconds")

            batch_num += 1

            # Rest between batches
            if i + batch_size < total_questions:
                print(f"Resting for {batch_delay} seconds between batches...")
                time.sleep(batch_delay)

        print(f"\nAll batches processed! Total questions processed: {total_questions}")
        return all_results

    def _process_batch(self, batch_data: List[Dict], max_workers: int, start_index: int) -> Dict:
        """Process a single batch"""
        batch_results = {}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit tasks
            future_to_question = {}
            for idx, question_data in enumerate(batch_data):
                # Use original ID or generate a new one
                question_id = question_data.get('id', f"cardio_{start_index + idx:06d}")
                future = executor.submit(self.processor.process_single_question, question_data, question_id)
                future_to_question[future] = (question_id, question_data)

            # Collect results
            completed = 0
            for future in as_completed(future_to_question):
                question_id, question_data = future_to_question[future]
                #try:
                result = future.result()
                batch_results[question_id] = result

                # Simple status display
                status_symbol = "✓" if result.status == "success" else "✗"
                completed += 1
        
                if completed % 5 == 0 or completed == len(batch_data):
                    success_count = sum(1 for r in batch_results.values() if r.status == "success")
                    print(f"  Completed: {completed}/{len(batch_data)} (Success: {success_count}) {status_symbol}")

        return batch_results

    def _save_batch_results(self, batch_results: Dict, batch_num: int, start_time: float):
        """Save batch results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"cardio_analysis_batch_{batch_num:03d}_{timestamp}.pkl"
        filepath = os.path.join(self.output_dir, filename)

        # Statistics
        total_count = len(batch_results)
        success_count = sum(1 for r in batch_results.values() if r.status == "success")
        error_count = total_count - success_count

        # Construct data to save
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

        # Save to file
        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)

        print(f"  Batch results saved to: {filename}")
        print(f"  Success: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")

        return filepath
```

By running the above batch processing workflow, we send all cardiovascular-related test questions to the LLM for in-depth analysis, and collect the returned detailed analysis texts (including clinical scenario analysis, option discrimination, core principle summaries, etc.), preparing the data for the next step of concept extraction.

**Note**: Please fill in your own `api_url`, `api_key`, and `model_name` in the `process_heart_data` function.

```python
def process_heart_data(heart_data: List[Dict], api_url: str, api_key: str, model_name: str, max_workers: int = 10, 
                      batch_size: int = 50, output_dir: str = "cardio_analysis"):
    """A convenience function for processing heart_data"""
    print(f"Preparing to process {len(heart_data)} cardiovascular clinical questions")

    # Initialize the API client
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )

    # Initialize the processor
    processor = CardioAnalysisProcessor(api_client)
    batch_processor = BatchProcessor(processor, output_dir=output_dir)

    # Batch processing
    results = batch_processor.process_questions_list(
        heart_data=heart_data,
        max_workers=max_workers,
        batch_size=batch_size,
        batch_delay=1
    )

    return results

```python
# Batch extract each QA's thought process
# max_workers: Number of concurrent API accesses
# batch_size: Number of API accesses before saving the access results to a file

results = process_heart_data(heart_data, max_workers=100, batch_size=400, output_dir="cookbooktest", 
                             api_url = api_url,
                             api_key = api_key,
                             model_name = MEDXPERT_THINKER)
textlist = [results[i].response for i in results.keys()]
```

Now, we have a large collection of in-depth analytical texts about cardiovascular issues generated by LLMs. The next task is to extract all the core medical concepts from these unstructured texts. Once again, we rely on the LLM to accomplish this task, and the key to success still lies in a well-designed Prompt. The `PromptTemplate` has been redesigned to guide the LLM to play the role of a cardiovascular expert, following a series of strict extraction principles (such as extracting core terms, avoiding descriptive combinations, outputting in standard JSON format, etc.), ensuring that the final concept list is clean and standardized.

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

After the above steps, we successfully extracted a preliminary list of seed concepts in the cardiovascular field from the massive amount of analyzed text. This list laid a solid foundation for the subsequent iterative expansion of the concept map.

**Example Results:**

```python
seed_concepts = [
    'blood pressure', 'step-up', 'glucagon', 'therapeutic anticoagulation'...
]
```

### **Iterative Concept Graph Augmentation Method**

#### **Core Objective**

To achieve complete coverage of the target domain for the concept graph through iterative augmentation. We adopt a gradual expansion strategy based on LLM, starting from a seed concept set, expanding round by round, and ultimately constructing a comprehensive domain concept graph.

#### **Iterative Process**

The basic iterative process is as follows:

- **Input**: The concept graph generated in the previous iteration.

- **Processing**: For each concept node in the graph, provide itself and its known adjacent concepts as context information to the LLM, and request the LLM to generate more other concepts directly related to this central concept.
- **Output**: After post-processing (e.g., deduplication), the new concepts returned by the LLM are added to the concept graph, serving as the input for the next iteration.
#### **Convergence Mechanism and Control Parameters**

As the iteration progresses, newly generated concepts will increasingly overlap with existing concepts in the graph, causing the iterative process to converge naturally. We have designed three core parameters to precisely control this process:

1.  **Similar Node Merging Threshold (`similarity_threshold`)**

    * **Mechanism**: Use an embedding model to calculate the vector representation of concepts and judge the semantic similarity between two concepts using cosine similarity.
    * **Effect**: When the similarity between two concepts exceeds the set threshold, they will be merged into a single node in the graph.
    * **Impact**: This parameter directly controls the "granularity" and expansion speed of the concept graph and is key to balancing the completeness of the graph with computational cost.

2.  **New Concept Growth Rate (`new_concept_rate_threshold`)**

    * **Mechanism**: Calculate the proportion of new concepts generated in the current round that do not exist in the original graph (i.e., are "brand new").
    * **Effect**: When this proportion falls below the set threshold, it can be considered that the graph is approaching saturation in terms of conceptual breadth, and the iteration is stopped.
3.  **New Edge Growth Rate (`new_edge_rate_threshold`)**

    * **Mechanism**: Calculate the growth rate of the number of new connections (edges) established in the current round between existing old concepts in the graph.
    * **Effect**: When the relationship network between concepts becomes more complete and the growth of new connections slows down significantly, the iteration is stoppe
    * **Significance**: This metric primarily reflects the integrity of the internal structure of the concept graph.
#### **Parameter Selection Strategy and Convergence Analysis**

In the absence of an external evaluation dataset, how to select hyperparameters and determine convergence is a critical practical issue.

1.  **Similar Node Merging Threshold (`similarity_threshold`)**: **The core metric for controlling the iteration rate.**
    Theoretically, it is possible to build the most comprehensive concept graph without merging any similar nodes, but this would incur enormous computational costs. Therefore, setting a reasonable threshold is crucial. Each core node ultimately existing in the graph can be understood as a **representative concept** within the semantic space defined by this threshold. This parameter is the core regulator for balancing the completeness of the graph with computational efficiency. For academic research scenarios requiring extreme coverage, a higher threshold (e.g., 0.95) can be set; for practical applications focusing on cost-effectiveness, a lower threshold (e.g., 0.80) can be set.

2.  **New Concept Growth Rate**: **The metric that converges first but may stagnate.**
    As the iteration progresses, the new concept growth rate will be the first to show a convergence trend. However, in practice, it has been found that after converging to a certain extent, this metric may stagnate at a low level without approaching zero completely. The root cause is that the LLM may gradually "drift" outside the strict domain boundaries when performing conceptual association. Therefore, one cannot rely solely on this metric to determine if the iteration is complete.
3.  **New Edge Growth Rate**: **The metric that ultimately converges stably.**
    When most of the core concepts of the target domain (e.g., the cardiovascular field) have been captured and their main relationships established, most subsequently added nodes are located on the "periphery" of the domain. It is difficult for these peripheral nodes to establish new, meaningful connections with the old nodes in the core area of the graph. This leads to a stable decline and eventual convergence of the growth rate of new edges between old concepts. Compared to the new concept growth rate, this metric is less affected by the LLM's "cross-domain expansion" characteristic and is a reliable indicator for judging the **structural integrity** of the concept graph.
**Practical Strategy Recommendation**: Under limited costs, adopt a balanced `similarity_threshold` (e.g., 0.80) and observe the convergence curve in conjunction with the Elbow Method. When the new concept growth rate and the new edge growth rate show no significant change for 1-2 consecutive rounds and enter a plateau phase, the iteration can be stopped.
---

### **Core Code Implementation**

We transform the theory above into a self-growing concept graph system.

#### **1. Core Data Structure: The `ConceptGraph` Class**

The core of the system is the `ConceptGraph` class, which is an "intelligent graph" that integrates semantic understanding and dynamic update capabilities.

* **Initialization (`__init__`)**: Starts with a batch of pre-processed seed concepts, calculates their vector embeddings, and builds the initial state of the graph.

* **Intelligent Deduplication (`_is_similar_to_existing`)**: This is key to controlling the quality and scale of the graph. It utilizes the cosine similarity of semantic vectors to determine if a new concept is semantically "close" to an existing concept in the graph. Concepts are merged only when the similarity exceeds the set `similarity_threshold`.

* **Dynamic Update (`update_graph`)**: This is the core engine of the graph's "growth". This method receives new concepts augmented by the LLM, and through the intelligent deduplication mechanism, adds truly "brand new" concepts as new nodes to the graph and establishes connections with the source concept.
* **State Monitoring (`calculate_metrics`, `get_graph_stats`)**: These methods are responsible for calculating the convergence metrics we have defined (such as new concept growth rate, new edge growth rate) and the graph's statistics (number of nodes, number of edges), thereby enabling quantitative monitoring of the effect of each iteration.
```python
class ConceptGraph:
  
    @classmethod
    def from_graph_dict(cls, graph_dict: Dict[str, List[str]], concept_mapping, model, similarity_threshold):
        """
        Reconstructs a ConceptGraph from a saved graph dictionary
        Args:
            graph_dict: The saved adjacency dictionary
            model: An instance of the SentenceTransformer model
            similarity_threshold: The threshold for judging concepts as similar
            concept_mapping: The mapping of all previously seen similar concepts, e.g., {'hearts':'heart'}
        Returns:
            An instance of ConceptGraph
        """
        if model is None:
            raise ValueError("The model parameter cannot be None, please load the model using load_embedding_model() first")

        # Create an instance without initializing
        instance = cls.__new__(cls)
        instance.model = model
        instance.graph = graph_dict.copy()
        instance.concept_embeddings = {}
        instance.concept_mapping = concept_mapping  
        instance.similarity_threshold = similarity_threshold

        # Recalculate embeddings for all concepts and establish self-mapping
        all_concepts = list(graph_dict.keys())
        if all_concepts:
            print(f"Recalculating embeddings for {len(all_concepts)} concepts...")
            all_embeddings = model.encode(all_concepts)
    
            for concept, embedding in zip(all_concepts, all_embeddings):
                instance.concept_embeddings[concept] = embedding
                #instance.concept_mapping[concept] = concept  # Establish self-mapping
    
            print("ConceptGraph reconstruction complete")

        return instance

    def __init__(self, seed_concepts: List[str], model, similarity_threshold):
        """
        Initializes the graph from seed concepts and builds the embedding library
        Args:
            seed_concepts: A list of seed concepts that have been externally deduplicated
            model: An instance of the SentenceTransformer model (required)
            similarity_threshold: The threshold for judging concepts as similar
        """
        if model is None:
            raise ValueError("The model parameter cannot be None, please load the model using load_embedding_model() first")
    
        self.model = model
        self.graph = {}
        self.concept_embeddings = {}  # Maintains the mapping of concept -> embedding
        self.concept_mapping = {}     # Add a concept mapping table
        self.similarity_threshold = similarity_threshold  # embedding similarity threshold

        # Clean the seed concepts
        cleaned_seeds = [concept.strip() for concept in seed_concepts if concept.strip()]

        print(f"Calculating embeddings for {len(cleaned_seeds)} seed concepts...")

        # Batch calculate embeddings
        if cleaned_seeds:
            seed_embeddings = self.model.encode(cleaned_seeds)
    
            # Build the initial graph, embedding library, and mapping table
            for concept, embedding in zip(cleaned_seeds, seed_embeddings):
                self.graph[concept] = []
                self.concept_embeddings[concept] = embedding
                self.concept_mapping[concept] = concept  # Establish self-mapping

        print(f"Concept graph initialization complete, number of seed concepts: {len(cleaned_seeds)}")

    def _get_target_concept(self, concept: str) -> Optional[str]:
        """Unified concept mapping lookup"""
        return self.concept_mapping.get(concept)

    def _is_similar_to_existing(self, new_concept: str, new_embedding: np.ndarray) -> Optional[str]:
        """
        Checks if a new concept is similar to existing ones
        Returns:
            If similar, returns the similar existing concept; otherwise, returns None
        """
        if not self.concept_embeddings:
            return None
    
        # Calculate similarity with all existing concepts
        existing_concepts = list(self.concept_embeddings.keys())
        existing_embeddings = np.array([self.concept_embeddings[concept] for concept in existing_concepts])

        # Calculate cosine similarity
        similarities = self.model.similarity([new_embedding], existing_embeddings)[0]

        # Find the most similar concept
        max_similarity_idx = np.argmax(similarities)
        max_similarity = similarities[max_similarity_idx]

        if max_similarity >= self.similarity_threshold:
            return existing_concepts[max_similarity_idx]

        return None

    def get_current_adjacency(self) -> Dict[str, List[str]]:
        """Gets the current adjacency dictionary"""
        return self.graph.copy()

    def calculate_metrics(self, expansion_results: Dict) -> Dict[str, float]:
        """Calculates augmentation metrics"""
        # Collect all new concepts
        all_new_concepts = []
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                all_new_concepts.extend(result.new_concepts)

        if not all_new_concepts:
            return {"connectivity_rate": 0.0}

        existing_concepts = set(self.graph.keys())

        # Connectivity: newly generated edges (between two old nodes) / total existing edges from the previous round
        old_total_edges = sum(len(neighbors) for neighbors in self.graph.values()) // 2

        # Count newly generated edges (between two old nodes)
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
        Updates the graph structure, using a mapping mechanism for deduplication.
        """
        nodes_added = 0
        edges_added = 0
        embedding_duplicates = 0

        # Collect all new concepts
        all_new_concepts = []
        concept_to_centers = {}  # Record the corresponding center concept for each new concept

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
        print(f"Received {num_all_new_concepts} new concepts (not deduplicated)")

        # Use mapping to quickly filter known concepts
        concepts_need_embedding = []
        concept_targets = {}  # concept -> target_concept mapping

        for concept in all_new_concepts:
            target = self._get_target_concept(concept)
            if target is not None:
                # Known concept, use mapping directly
                concept_targets[concept] = target
                if target != concept:
                    embedding_duplicates += 1
            else:
                # New concept that needs an embedding calculation
                concepts_need_embedding.append(concept)

        # Only calculate embeddings for unknown concepts
        if concepts_need_embedding:
            unique_concepts = list(set(concepts_need_embedding))
            print(f"Performing embedding-based deduplication on {len(unique_concepts)} new concepts...")
            new_embeddings = self.model.encode(unique_concepts)
    
            # Process concepts that need embeddings one by one
            total_concepts = len(unique_concepts)
            for idx, (new_concept, new_embedding) in enumerate(zip(unique_concepts, new_embeddings), 1):
                # Print progress every 500 concepts
                if idx % 500 == 0 or idx == total_concepts:
                    print(f"  Processing progress: {idx}/{total_concepts} ({idx/total_concepts*100:.1f}%)")
                # Check if it is similar to existing concepts
                similar_concept = self._is_similar_to_existing(new_concept, new_embedding)
        
                if similar_concept:
                    # Found a similar concept, create a mapping
                    self.concept_mapping[new_concept] = similar_concept
                    concept_targets[new_concept] = similar_concept
                    embedding_duplicates += 1
                else:
                    # Brand new concept, add to the graph and create a self-mapping
                    self.graph[new_concept] = []
                    self.concept_embeddings[new_concept] = new_embedding
                    self.concept_mapping[new_concept] = new_concept
                    concept_targets[new_concept] = new_concept
                    nodes_added += 1

        # Add edges (connecting to all relevant center concepts)
        for concept in all_new_concepts:
            target_concept = concept_targets[concept]

            for center_concept in concept_to_centers[concept]:
                # Ensure the center concept exists in the graph
                if center_concept in self.graph:
                    # Bidirectional connection
                    if target_concept not in self.graph[center_concept]:
                        self.graph[center_concept].append(target_concept)
                        edges_added += 1
                
                    if center_concept not in self.graph[target_concept]:
                        self.graph[target_concept].append(center_concept)
                        edges_added += 1

        print(f"Deduplication complete: Nodes added {nodes_added}, Edges added {edges_added//2}, Deduplicated concepts {embedding_duplicates}")

        return nodes_added, edges_added // 2, embedding_duplicates, nodes_added / num_all_new_concepts  # Undirected graph, so divide edge count by 2

    def get_graph_stats(self) -> Dict[str, int]:
        """Gets graph statistics"""
        node_count = len(self.graph)
        edge_count = sum(len(neighbors) for neighbors in self.graph.values()) // 2
        return {"nodes": node_count, "edges": edge_count}
```
#### **2. Complete Augmentation Process Code**

The complete iterative process consists of an executable "single-round concept augmentation" pipeline, which integrates multiple components:

* **Utility Tools (`ResponseValidator`, `load_embedding_model`)**: Used to handle common problems in engineering practice, such as fixing malformed JSON returned by the LLM, and loading and managing deep learning models.

* **LLM Interaction Module (`APIClient`, `PromptTemplate`)**: A specially designed `PromptTemplate` is used to guide the LLM to perform "association" and "augmentation" based on existing concepts in the graph.

* **Concurrency Processor (`ConceptExpander`, `BatchConceptExpander`)**: Responsible for treating each concept node in the graph as an independent task, requesting augmentation from the LLM in parallel to ensure processing efficiency.
* **Iteration Master Control (`run_concept_expansion_iteration`)**: This is a top-level function responsible for orchestrating all the components above to completely execute one round of the "get current graph -> concurrent augmentation -> update graph -> calculate metrics" cycle.
```python

# Import JSON repair library
try:
    from json_repair import repair_json
    HAS_JSONREPAIR = True
    print("✓ jsonrepair library loaded, JSON repair feature enabled")
except ImportError:
    HAS_JSONREPAIR = False
    print("⚠ jsonrepair library not installed, will use basic repair strategy. Run 'pip install jsonrepair' to enable advanced JSON repair")
    def repair_json(text):
        return text

class ResponseValidator:
    """Response Validator"""
    
    @staticmethod
    def validate_json_response(response_text: str, expected_keys: List[str]) -> Dict:
        """
        Validates if the content returned by the API is valid JSON, including pre-processing for fault tolerance.
        
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
            # Pre-processing and cleaning
            text = response_text.strip()
    
            # 1. Handle markdown code blocks ```json...``` or ```...```
            code_block_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
            if code_block_match:
                text = code_block_match.group(1).strip()
    
            # 2. Handle quoted wrappers '...' or "..."
            if (text.startswith("'") and text.endswith("'")) or (text.startswith('"') and text.endswith('"')):
                text = text[1:-1]
    
            # 3. Remove leading/trailing backticks
            text = text.strip('`').strip()
    
            # 4. Find the JSON part - from the first { to the last }
            json_match = re.search(r'(\{.*\})', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
    
            # First attempt: direct parsing
            try:
                parsed = json.loads(text)
                repair_attempts.append("direct_parse_success")
            except json.JSONDecodeError as e:
                repair_attempts.append(f"direct_parse_failed: {str(e)}")
        
                # Second attempt: parse after repairing with jsonrepair
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
    
            # Check if it conforms to the expected structure
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

# Iteration code for graph augmentation based on seed concepts

@dataclass
class ConceptExpansionResult:

    status: str  # success, api_error, json_error
    concept_id: str
    center_concept: str
    neighbors: List[str]
    response: Optional[str] = None
    error_details: Optional[str] = None
    processing_time: Optional[float] = None
    json_validation: Optional[Dict] = None
    new_concepts: Optional[List[str]] = None
    returned_center: Optional[str] = None  # LLM返回的center_concept

class PromptTemplate:

    @staticmethod
    def get_system_prompt() -> str:

        return """You are an experienced cardiovascular specialist, skilled in building comprehensive concept graphs for the cardiovascular domain.

Your task is to expand a cardiovascular concept graph by generating new related concepts based on a given center concept and its existing connections."""

    @staticmethod
    def get_expansion_prompt(center_concept: str, neighbors: List[str]) -> str:
        """get prompt for concept expansion"""
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

    def __init__(self, api_client: APIClient):
        self.api_client = api_client
        self.template = PromptTemplate()

    def expand_single_concept(self, center_concept: str, neighbors: List[str], concept_id: str) -> ConceptExpansionResult:
        start_time = time.time()
  
        system_prompt = self.template.get_system_prompt()
        user_prompt = self.template.get_expansion_prompt(center_concept, neighbors)
  
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

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

        expected_keys = ["center_concept", "new_concepts"]
        json_validation = ResponseValidator.validate_json_response(
            api_result["content"], expected_keys
        )
  
        if json_validation["is_valid_json"]:
            returned_center = json_validation["parsed_json"]["center_concept"]
            new_concepts = json_validation["parsed_json"]["new_concepts"]
    
            # Check if it is "no new concept"
            if len(new_concepts) == 1 and new_concepts[0].strip() == "NO NEW CONCEPTS":
                return ConceptExpansionResult(
                    status="success",
                    concept_id=concept_id,
                    center_concept=center_concept,
                    neighbors=neighbors,
                    response=api_result["content"],
                    processing_time=processing_time,
                    json_validation=json_validation,
                    new_concepts=[],  # Empty list, indicating no new concepts
                    returned_center=returned_center
                )
    
            # Process new concepts normally - remove the previous filtering logic and let embedding remove duplicates
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

    def __init__(self, expander: ConceptExpander, output_dir: str = "concept_expansion"):
        self.expander = expander
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def expand_concepts_batch(self, adjacency_dict: Dict[str, List[str]], max_workers: int = 10) -> Dict:

        concepts_to_expand = list(adjacency_dict.keys())
        total_concepts = len(concepts_to_expand)
        print(f"Starting batch concept augmentation for {total_concepts} concepts")
        print(f"Max concurrency: {max_workers}")

        batch_start_time = time.time()
        batch_results = self._process_batch(concepts_to_expand, adjacency_dict, max_workers)
        batch_end_time = time.time()

        print(f"Processing complete, time taken: {batch_end_time - batch_start_time:.2f} seconds")
        return batch_results

    def _process_batch(self, batch_concepts: List[str], adjacency_dict: Dict[str, List[str]], 
                       max_workers: int) -> Dict:
        """Processes a batch"""
        batch_results = {}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit tasks
            future_to_concept = {}
            for idx, concept in enumerate(batch_concepts):
                concept_id = f"concept_{idx:06d}"
                neighbors = adjacency_dict.get(concept, [])
                future = executor.submit(self.expander.expand_single_concept, concept, neighbors, concept_id)
                future_to_concept[future] = (concept_id, concept)

            # Collect results
            completed = 0
            for future in as_completed(future_to_concept):
                concept_id, concept = future_to_concept[future]
                try:
                    result = future.result()
                    batch_results[concept_id] = result

                    # Simple status display
                    status_symbol = "✓" if result.status == "success" else "✗"
                    completed += 1
            
                    if completed % 1000 == 0 or completed == len(batch_concepts):
                        success_count = sum(1 for r in batch_results.values() if r.status == "success")
                        print(f"  Completed: {completed}/{len(batch_concepts)} (Success: {success_count}) {status_symbol}")

                except Exception as e:
                    batch_results[concept_id] = ConceptExpansionResult(
                        status="exception",
                        concept_id=concept_id,
                        center_concept=concept,
                        neighbors=adjacency_dict.get(concept, []),
                        error_details=str(e)
                    )
                    print(f"  Exception: {concept_id} - {str(e)}")

        return batch_results

    def _save_results(self, batch_results: Dict, start_time: float):
        """Saves the results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"concept_expansion_results_{timestamp}.pkl"
        filepath = os.path.join(self.output_dir, filename)

        # Statistics
        total_count = len(batch_results)
        success_count = sum(1 for r in batch_results.values() if r.status == "success")
        error_count = total_count - success_count

        # Count the number of generated concepts
        total_new_concepts = sum(len(r.new_concepts) for r in batch_results.values() 
                                 if r.status == "success" and r.new_concepts)
    
        # Count the number of skipped concepts (no new concepts added)
        skipped_concepts = sum(1 for r in batch_results.values() 
                               if r.status == "success" and r.new_concepts is not None and len(r.new_concepts) == 0)

        # Construct save data
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

        # Save to file
        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)

        print(f"  Results saved to: {filename}")
        print(f"  Success: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
        print(f"  Total new concepts: {total_new_concepts}")
        print(f"  Skipped concepts: {skipped_concepts}")

        return filepath

class ConceptGraph:
  
    @classmethod
    def from_graph_dict(cls, graph_dict: Dict[str, List[str]], concept_mapping, model, similarity_threshold):
        """
        Reconstructs a ConceptGraph from a saved graph dictionary
        Args:
            graph_dict: The saved adjacency dictionary
            model: An instance of the SentenceTransformer model
            similarity_threshold: The threshold for judging concepts as similar
            concept_mapping: The mapping of all previously seen similar concepts, e.g., {'hearts':'heart'}
        Returns:
            An instance of ConceptGraph
        """
        if model is None:
            raise ValueError("The model parameter cannot be None, please load the model using load_embedding_model() first")

        # Create an instance without initializing
        instance = cls.__new__(cls)
        instance.model = model
        instance.graph = graph_dict.copy()
        instance.concept_embeddings = {}
        instance.concept_mapping = concept_mapping  
        instance.similarity_threshold = similarity_threshold

        # Recalculate embeddings for all concepts and establish self-mapping
        all_concepts = list(graph_dict.keys())
        if all_concepts:
            print(f"Recalculating embeddings for {len(all_concepts)} concepts...")
            all_embeddings = model.encode(all_concepts)
    
            for concept, embedding in zip(all_concepts, all_embeddings):
                instance.concept_embeddings[concept] = embedding
                #instance.concept_mapping[concept] = concept  # Establish self-mapping
    
            print("ConceptGraph reconstruction complete")

        return instance

    def __init__(self, seed_concepts: List[str], model, similarity_threshold):
        """
        Initializes the graph from seed concepts and builds the embedding library
        Args:
            seed_concepts: A list of seed concepts that have been externally deduplicated
            model: An instance of the SentenceTransformer model (required)
            similarity_threshold: The threshold for judging concepts as similar
        """
        if model is None:
            raise ValueError("The model parameter cannot be None, please load the model using load_embedding_model() first")
    
        self.model = model
        self.graph = {}
        self.concept_embeddings = {}  # Maintains the mapping of concept -> embedding
        self.concept_mapping = {}     # Add a concept mapping table
        self.similarity_threshold = similarity_threshold  # embedding similarity threshold

        # Clean the seed concepts
        cleaned_seeds = [concept.strip() for concept in seed_concepts if concept.strip()]

        print(f"Calculating embeddings for {len(cleaned_seeds)} seed concepts...")

        # Batch calculate embeddings
        if cleaned_seeds:
            seed_embeddings = self.model.encode(cleaned_seeds)
    
            # Build the initial graph, embedding library, and mapping table
            for concept, embedding in zip(cleaned_seeds, seed_embeddings):
                self.graph[concept] = []
                self.concept_embeddings[concept] = embedding
                self.concept_mapping[concept] = concept  # Establish self-mapping

        print(f"Concept graph initialization complete, number of seed concepts: {len(cleaned_seeds)}")

    def _get_target_concept(self, concept: str) -> Optional[str]:
        """Unified concept mapping lookup"""
        return self.concept_mapping.get(concept)

    def _is_similar_to_existing(self, new_concept: str, new_embedding: np.ndarray) -> Optional[str]:
        """
        Checks if a new concept is similar to existing ones
        Returns:
            If similar, returns the similar existing concept; otherwise, returns None
        """
        if not self.concept_embeddings:
            return None
    
        # Calculate similarity with all existing concepts
        existing_concepts = list(self.concept_embeddings.keys())
        existing_embeddings = np.array([self.concept_embeddings[concept] for concept in existing_concepts])

        # Calculate cosine similarity
        similarities = self.model.similarity([new_embedding], existing_embeddings)[0]

        # Find the most similar concept
        max_similarity_idx = np.argmax(similarities)
        max_similarity = similarities[max_similarity_idx]

        if max_similarity >= self.similarity_threshold:
            return existing_concepts[max_similarity_idx]

        return None

    def get_current_adjacency(self) -> Dict[str, List[str]]:
        """Gets the current adjacency dictionary"""
        return self.graph.copy()

    def calculate_metrics(self, expansion_results: Dict) -> Dict[str, float]:
        """Calculates augmentation metrics"""
        # Collect all new concepts
        all_new_concepts = []
        for result in expansion_results.values():
            if result.status == "success" and result.new_concepts:
                all_new_concepts.extend(result.new_concepts)

        if not all_new_concepts:
            return {"connectivity_rate": 0.0}

        existing_concepts = set(self.graph.keys())

        # Connectivity: newly generated edges (between two old nodes) / total existing edges from the previous round
        old_total_edges = sum(len(neighbors) for neighbors in self.graph.values()) // 2

        # Count newly generated edges (between two old nodes)
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
        Updates the graph structure, using a mapping mechanism for deduplication.
        """
        nodes_added = 0
        edges_added = 0
        embedding_duplicates = 0

        # Collect all new concepts
        all_new_concepts = []
        concept_to_centers = {}  # Record the corresponding center concept for each new concept

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
        print(f"Received {num_all_new_concepts} new concepts (not deduplicated)")

        # Use mapping to quickly filter known concepts
        concepts_need_embedding = []
        concept_targets = {}  # concept -> target_concept mapping

        for concept in all_new_concepts:
            target = self._get_target_concept(concept)
            if target is not None:
                # Known concept, use mapping directly
                concept_targets[concept] = target
                if target != concept:
                    embedding_duplicates += 1
            else:
                # New concept that needs an embedding calculation
                concepts_need_embedding.append(concept)

        # Only calculate embeddings for unknown concepts
        if concepts_need_embedding:
            unique_concepts = list(set(concepts_need_embedding))
            print(f"Performing embedding-based deduplication on {len(unique_concepts)} new concepts...")
            new_embeddings = self.model.encode(unique_concepts)
    
            # Process concepts that need embeddings one by one
            total_concepts = len(unique_concepts)
            for idx, (new_concept, new_embedding) in enumerate(zip(unique_concepts, new_embeddings), 1):
                # Print progress every 500 concepts
                if idx % 500 == 0 or idx == total_concepts:
                    print(f"  Processing progress: {idx}/{total_concepts} ({idx/total_concepts*100:.1f}%)")
                # Check if it is similar to existing concepts
                similar_concept = self._is_similar_to_existing(new_concept, new_embedding)
        
                if similar_concept:
                    # Found a similar concept, create a mapping
                    self.concept_mapping[new_concept] = similar_concept
                    concept_targets[new_concept] = similar_concept
                    embedding_duplicates += 1
                else:
                    # Brand new concept, add to the graph and create a self-mapping
                    self.graph[new_concept] = []
                    self.concept_embeddings[new_concept] = new_embedding
                    self.concept_mapping[new_concept] = new_concept
                    concept_targets[new_concept] = new_concept
                    nodes_added += 1

        # Add edges (connecting to all relevant center concepts)
        for concept in all_new_concepts:
            target_concept = concept_targets[concept]

            for center_concept in concept_to_centers[concept]:
                # Ensure the center concept exists in the graph
                if center_concept in self.graph:
                    # Bidirectional connection
                    if target_concept not in self.graph[center_concept]:
                        self.graph[center_concept].append(target_concept)
                        edges_added += 1
                
                    if center_concept not in self.graph[target_concept]:
                        self.graph[target_concept].append(center_concept)
                        edges_added += 1

        print(f"Deduplication complete: Nodes added {nodes_added}, Edges added {edges_added//2}, Deduplicated concepts {embedding_duplicates}")

        return nodes_added, edges_added // 2, embedding_duplicates, nodes_added / num_all_new_concepts  # Undirected graph, so divide edge count by 2

    def get_graph_stats(self) -> Dict[str, int]:
        """Gets graph statistics"""
        node_count = len(self.graph)
        edge_count = sum(len(neighbors) for neighbors in self.graph.values()) // 2
        return {"nodes": node_count, "edges": edge_count}

def load_embedding_model(model_name: str = "nomic-ai/nomic-embed-text-v1.5"):
    """
    Loads the embedding model
    Args:
        model_name: Model name
    Returns:
        An instance of the SentenceTransformer model
    """
    print(f"Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name, trust_remote_code=True)
    print("Model loaded successfully")
    return model

def extract_seed_concepts(results):
    """Extracts seed concepts from batch processing results"""
    all_concepts = []
    
    for result in results.values():
        if result.status == "success" and result.extracted_concepts:
            all_concepts.extend(result.extracted_concepts)
    
    # Trim whitespace and deduplicate
    seed_concepts = list(set(concept.strip() for concept in all_concepts if concept.strip()))
    
    return seed_concepts

def run_concept_expansion_iteration(api_url: str, api_key: str, model_name: str, concept_graph: ConceptGraph, max_workers: int = 10):
    """Runs a single concept augmentation iteration"""
    # Initialize API client and processors
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )
    
    expander = ConceptExpander(api_client)
    batch_expander = BatchConceptExpander(expander)
    
    # Get the current adjacency dictionary
    current_adjacency = concept_graph.get_current_adjacency()
    
    # Batch augment concepts
    expansion_results = batch_expander.expand_concepts_batch(
        adjacency_dict=current_adjacency,
        max_workers=max_workers
    )
    
    # Calculate metrics
    metrics = concept_graph.calculate_metrics(expansion_results)
    
    # Update graph - using embedding-based deduplication
    nodes_added, edges_added, embedding_duplicates, concept_add_rate = concept_graph.update_graph(expansion_results)

    # Get updated graph statistics
    graph_stats = concept_graph.get_graph_stats()
    
    # Count the number of skipped concepts
    skipped_count = sum(1 for r in expansion_results.values() 
                        if r.status == "success" and r.new_concepts is not None and len(r.new_concepts) == 0)
    
    # Print results
    print(f"\n=== Iteration Complete ===")
    print(f"Concept Add Rate: {concept_add_rate:.3f}")
    print(f"Concept Connectivity Rate: {metrics['connectivity_rate']:.3f}")
    print(f"Nodes at end of iteration: {graph_stats['nodes']}")
    print(f"Edges at end of iteration: {graph_stats['edges']}")
    print(f"Nodes added this round: {nodes_added}")
    print(f"Edges added this round: {edges_added}")
    print(f"Skipped concepts: {skipped_count}")
    
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
### **Expansion Startup: Preparation and Execution**

Before initiating large-scale iterations, we perform an internal semantic deduplication on the initial `seed_concepts` list. The `deduplicate_seed_concepts` function compares the semantic similarity of each pair of seed concepts and discards highly similar duplicates to ensure the purity of the initial graph.

After cleaning, we use this high-quality seed set to officially create a `ConceptGraph` instance, preparing for the first round of expansion.

Load the embedding model to filter similar seed concepts:

---

```python
import json
import pickle
import time
import torch
import numpy as np
from sentence_transformers import SentenceTransformer
from datetime import datetime

device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Initialize model, use device: {device}")
model = SentenceTransformer(EMBEDDING_MODEL, trust_remote_code=True, device=device)
print("Model initialization completed")
```

Initialize concept_graph according to seed concepts:

```python

import random
import numpy as np

def deduplicate_seed_concepts(seed_concepts, model, similarity_threshold=0.95):
    """Deduplicates seed concepts. For pairs with similarity exceeding the threshold, one is randomly kept."""
    
    embeddings = model.encode(seed_concepts)
    similarities = model.similarity(embeddings, embeddings)
    similarities = similarities.cpu().numpy()
    
    to_remove = set()
    n = len(seed_concepts)
    
    for i in range(n):
        for j in range(i+1, n):
            if similarities[i][j] > similarity_threshold:
                # Similarity exceeds threshold, randomly choose one to remove
                remove_idx = random.choice([i, j])
                to_remove.add(remove_idx)
                print(f"Similar concept pair: '{seed_concepts[i]}' vs '{seed_concepts[j]}' (Similarity: {similarities[i][j]:.4f})")
                print(f"  -> Removing: '{seed_concepts[remove_idx]}'")
    
    filtered_concepts = [concept for i, concept in enumerate(seed_concepts) if i not in to_remove]
    
    print(f"\nDeduplication result: {len(seed_concepts)} -> {len(filtered_concepts)} concepts")
    print(f"Removed {len(to_remove)} similar concepts")
    
    return filtered_concepts

# Example usage
filtered_seed_concepts = deduplicate_seed_concepts(seed_concepts, model, similarity_threshold=0.8)
concept_graph = ConceptGraph(filtered_seed_concepts, model, similarity_threshold=0.8)
```

By repeatedly executing the `run_concept_expansion_iteration` function, we can complete multiple rounds of expansion. After each round of expansion, we recommend persisting the updated graph structure (`graph_dict`) and the concept mapping table (`concept_mapping`) as `.pkl` files, in order to prevent the results of long-running processes from being lost due to unexpected interruptions. This process will continue until the preset convergence metric reaches the threshold.

---

## Reference code for the specific single-round expansion process of the graph

```python
# Code example for running one iteration

domain = 'Cardio'

# Ensure the save directory exists
save_dir = f'cookbooktest/{domain}'
os.makedirs(save_dir, exist_ok=True)

iter_n = 1

results = run_concept_expansion_iteration(model_name=CONCEPT_GRAPH_EXTENDER, concept_graph=concept_graph, max_workers = 100,
                                          api_url=api_url,
                                          api_key=api_key)



# Get the graph's adjacency list
graph_dict = concept_graph.graph

# Save as pickle
with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter.pkl', 'wb') as f:
    pickle.dump(graph_dict, f)

# Get the graph's mapping table
concept_mapping = concept_graph.concept_mapping
# Save as pickle
with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter_concept_mapping.pkl', 'wb') as f:
    pickle.dump(concept_mapping, f)


# Repeat for more rounds... Based on practical experience, the graph should be very large and sufficient for convergence within 10 iterations.
# Loop code, for reference only
# Since the cost of graph augmentation tends to increase with the number of rounds, we strongly recommend that you perform the iterations manually, round by round, and after each iteration, check the coverage of the current concept graph against a validation concept library built based on your own business to determine the termination round.
# In the absence of a validation concept library, you can refer to (a) the new concept add rate = new nodes this round / total new concepts received this round and (b) the concept connectivity rate as reference metrics for convergence termination.
'''
MAX_ITER = 10             # Max iterations
CONCEPT_ADD_THRESHOLD = 0.05  # Lower bound for concept add rate
CONNECTIVITY_THRESHOLD = 0.2  # Lower bound for connectivity rate

domain = 'Cardio'
save_dir = f'cookbooktest/{domain}'

for iter_n in range(1, MAX_ITER + 1):
    print(f"\n===== Iteration {iter_n} =====")
    
    # Run one round of concept expansion
    results = run_concept_expansion_iteration(
        model_name=CONCEPT_GRAPH_EXTENDER,
        concept_graph=concept_graph,
        max_workers=100,
        api_url=api_url,
        api_key=api_key
    )

    # Extract metrics
    concept_add_rate = results["concept_add_rate"]
    connectivity_rate = results["connectivity_rate"]

    # Save graph adjacency list
    graph_dict = concept_graph.graph
    with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter.pkl', 'wb') as f:
        pickle.dump(graph_dict, f)

    # Save concept mapping
    concept_mapping = concept_graph.concept_mapping
    with open(f'{save_dir}/concept_graph_4omini_{iter_n}_iter_concept_mapping.pkl', 'wb') as f:
        pickle.dump(concept_mapping, f)

    # Early termination with OR condition
    if (concept_add_rate < CONCEPT_ADD_THRESHOLD) or (connectivity_rate < CONNECTIVITY_THRESHOLD):
        print(f"Stopping iteration: Stop condition met (concept_add_rate<{CONCEPT_ADD_THRESHOLD} or connectivity_rate<{CONNECTIVITY_THRESHOLD})")
        break
'''
```

### **Experimental Data and Evaluation**

We conducted comprehensive experimental validation in two medical domains, cardiovascular (cardio) and respiratory, using two models, GPT-4o-mini and GPT-4o, performing multi-round iterative augmentation under different similarity thresholds (0.8, 0.85, 0.9). The validation method involved extracting keywords from Wikipedia medical articles in the corresponding domains and calculating the coverage rate of the concept graph.

#### **Experimental Setup**

- **Datasets**: Cardiovascular domain (cardio), Respiratory system domain (respiratory)
- **Models**: GPT-4o-mini, GPT-4o
- **Similarity Thresholds**: 0.8, 0.85, 0.9
- **Evaluation Metric**: Wikipedia keyword coverage rate (at the three thresholds of 0.8, 0.85, 0.9)
- **Cost Benchmark**: Approximately $20 for GPT-4o-mini to complete 8 iterations

#### **Metric Descriptions**

- **Node Count**: Total number of all concepts seen (including concepts judged as similar + concepts retained in the graph)
- **Edge Count**: Total number of edges in the concept graph
- **New Concept Rate**: Number of new nodes added to the concept graph / Total number of concepts generated in the current round
- **New Edge Rate**: Number of new edges added between old nodes / Number of edges before adding new edges between old nodes
- **Cost Estimate**: Calculated based on the total number of concepts generated in the current and previous rounds, estimated according to the rate of gpt-4o-mini for 8 iterations

#### **Experimental Results for the Cardiovascular Domain**

| Model | Threshold | Rounds | Number of Nodes | Number of Edges | Coverage@0.8 | Coverage@0.85 | Coverage@0.9 | New Concept Rate | New Edge Rate | Cost Estimate |
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

#### **Experimental results in the respiratory system**

| Model | Threshold | Rounds | Number of Nodes | Number of Edges | Coverage@0.8 | Coverage@0.85 | Coverage@0.9 | New Concept Rate | New Edge Rate | Cost Estimate |
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

#### **Key Findings and Analysis**

##### **1. Convergence Validation: Convergence Tendency Observed Under All Settings**

All experimental setups demonstrated a clear convergence trend:

- **New Concept Growth Rate**: Steadily decreased from an initial 10-13% to 3-5%, validating the saturation of the graph in terms of concept coverage.
- **New Edge Growth Rate**: Gradually converged from a peak in the 2nd round (46-71%) to 15-20%, confirming the refinement of the relationship network between concepts.
- **Coverage Rate Plateau**: After 4-5 rounds, the growth in coverage rate slowed down significantly, entering a state of convergence.

##### **2. Model Difference Analysis: Quality vs. Cost Trade-off**

**GPT-4o Advantages**:

- **Higher Coverage Rate**: Under the same number of rounds, GPT-4o typically achieves a 2-4 percentage point higher coverage than GPT-4o-mini.
- **Faster Convergence**: Requires fewer rounds to reach the same coverage rate.
- **Better Concept Quality**: Reflected in a higher matching rate with Wikipedia keywords.

**Cost Analysis**:

- **GPT-4o Cost**: The absolute cost is approximately 8-15 times that of GPT-4o-mini.
- **Performance Improvement**: The increase in coverage rate is typically in the range of **2-4%**.
- **Cost-Effectiveness**: GPT-4o-mini offers a better cost-effectiveness ratio in most practical application scenarios.

##### **3. Impact of Similarity Threshold: Balancing Precision and Efficiency**

- **Threshold 0.8**: Rapid expansion, but may include more similar concepts.
- **Threshold 0.85**: A balanced choice, suitable for most application scenarios.
- **Threshold 0.9**: High precision but slower expansion speed, suitable for scenarios requiring extremely high concept purity.

##### **4. Cross-Domain Consistency: The Universality of the Method**

The experimental results in both the cardiovascular and respiratory domains were highly consistent, validating the robustness of the method:

- Similar convergence patterns
- Consistent coverage rate trends
- Similar cost-effectiveness ratios

#### **Practical Recommendations**

**Cost-Priority Scenarios (Recommended)**:

- Use GPT-4o-mini + Threshold 0.8
- Achieve 95%+ coverage within 4-5 rounds of iteration.
- Keep costs within the $3-10 range.

**Quality-Priority Scenarios**:

- Use GPT-4o + Threshold 0.85
- Can achieve a high coverage rate of 97%+
- Requires bearing a significant increase in cost.

**Balanced Scenarios**:

- Use GPT-4o-mini + Threshold 0.85
- Achieve a coverage rate of 94-97%
- Moderate cost, acceptable quality.

## **Knowledge Distillation and QA Memory Generation Based on the Concept Graph**

After multiple rounds of iteration, we have constructed a large and structurally rich concept relationship network. However, this network is currently just a "skeleton." To make it a knowledge base that can be directly utilized by AI, we need to fill it with specific content—namely, high-quality Question-Answering (QA) pairs. This process, we call **"Knowledge Distillation"**.

Our strategy is divided into two steps:

1. Generate independent QA pairs for each **single concept node** in the graph to establish foundational knowledge.
2. Generate relational QA pairs for each **connected concept pair** (edge) with clinical significance in the graph to build deep knowledge.

To achieve this goal, we built the `ConceptDistiller` and its accompanying prompt. This prompt is designed to guide a powerful "teacher" model (like GPT-4o) to transform an isolated medical concept into a teaching-grade question and answer, rich with clinical scenarios and testing comprehensive reasoning abilities. These QA pairs will become the memory content for the "student" model (the small model we ultimately aim to enhance).

```python

@dataclass
class ConceptDistillationResult:
    """class for concept QA generation"""
    status: str  # success, api_error, json_error
    concept_id: str
    concept_name: str
    response: Optional[str] = None
    error_details: Optional[str] = None
    processing_time: Optional[float] = None
    json_validation: Optional[Dict] = None
    generated_questions: Optional[List[Dict]] = None

class ConceptDistiller:
    """Concept QA Generator - Generates question-answer pairs for each concept"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client

    def distill_concept(self, concept: str, concept_id: str) -> ConceptDistillationResult:
        """Generate question-answer pairs for a single concept"""
        start_time = time.time()
      
        system_prompt = self.get_distillation_system_prompt()
        user_prompt = self.get_distillation_prompt(concept)
      
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

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

        return """You are a world-renowned cardiovascular specialist with 20+ years of clinical experience. Your task is to create high-quality educational content for training junior cardiovascular doctors based on the given cardiovascular concept.

Your generated questions must require clinical reasoning and integration - avoid simple memorization questions."""

    @staticmethod
    def get_distillation_prompt(concept: str) -> str:

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

    def __init__(self, distiller: ConceptDistiller, output_dir: str = "concept_distillation"):
        self.distiller = distiller
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def distill_concept_graph(self, concept_graph_dict: Dict, max_workers: int = 10, 
                              batch_size: int = 20, batch_delay: int = 0) -> Dict:
        """Batch generation"""
        concept_list = list(concept_graph_dict.keys())  # Assuming the keys of the dict are concept names
        total_concepts = len(concept_list)
        print(f"Starting batch processing: QA generation for {total_concepts} concepts")
        print(f"Batch size: {batch_size}, Max concurrency: {max_workers}")

        all_results = {}
        batch_num = 1

        # Process in batches
        for i in range(0, total_concepts, batch_size):
            batch_concepts = concept_list[i:i + batch_size]
            print(f"\nProcessing batch {batch_num}: Concepts {i+1}-{min(i+batch_size, total_concepts)} ({len(batch_concepts)} concepts)")

            batch_start_time = time.time()
            batch_results = self._process_batch(batch_concepts, max_workers, i)
            batch_end_time = time.time()

            # Save batch results
            self._save_batch_results(batch_results, batch_num, batch_start_time)

            all_results.update(batch_results)

            print(f"Batch {batch_num} complete, time taken: {batch_end_time - batch_start_time:.2f} seconds")

            batch_num += 1

            # Rest between batches
            if i + batch_size < total_concepts:
                #print(f"Resting between batches for {batch_delay} seconds...")
                time.sleep(batch_delay)

        print(f"\nAll batches processed! Total concepts processed: {total_concepts}")
        return all_results

    def _process_batch(self, batch_concepts: List[str], max_workers: int, start_index: int) -> Dict:
        """Processes a single batch"""
        batch_results = {}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit tasks
            future_to_concept = {}
            for idx, concept in enumerate(batch_concepts):
                concept_id = f"concept_{start_index + idx:06d}"
                future = executor.submit(self.distiller.distill_concept, concept, concept_id)
                future_to_concept[future] = (concept_id, concept)

            # Collect results
            completed = 0
            for future in as_completed(future_to_concept):
                concept_id, concept = future_to_concept[future]
                try:
                    result = future.result()
                    batch_results[concept_id] = result

                    # Simple status display
                    status_symbol = "✓" if result.status == "success" else "✗"
                    completed += 1
                   
                    if completed % 1000 == 0 or completed == len(batch_concepts):
                        success_count = sum(1 for r in batch_results.values() if r.status == "success")
                        print(f"  Completed: {completed}/{len(batch_concepts)} (Success: {success_count}) {status_symbol}")

                except Exception as e:
                    batch_results[concept_id] = ConceptDistillationResult(
                        status="exception",
                        concept_id=concept_id,
                        concept_name=concept,
                        error_details=str(e)
                    )
                    print(f"  Exception: {concept_id} - {str(e)}")

        return batch_results

    def _save_batch_results(self, batch_results: Dict, batch_num: int, start_time: float):
        """Saves batch results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"concept_distillation_batch_{batch_num:03d}_{timestamp}.pkl"
        filepath = os.path.join(self.output_dir, filename)

        # Statistics
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

        print(f"  Batch results saved to: {filename}")
        print(f"  Success: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
        print(f"  Total questions generated: {total_questions}")

        return filepath

# ==================== Convenience Functions ====================

def distill_concept_graph(concept_graph_dict: Dict, api_url: str, api_key: str, model_name: str, max_workers: int = 10, 
                          batch_size: int = 20, output_dir: str = "concept_distillation"):
    """Convenience function to distill a concept graph"""
    print(f"Preparing to distill concept graph: {len(concept_graph_dict)} concepts")

    # Initialize API client
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )

    # Initialize distiller
    distiller = ConceptDistiller(api_client)
    batch_distiller = BatchConceptDistiller(distiller, output_dir=output_dir)

    # Batch distill
    results = batch_distiller.distill_concept_graph(
        concept_graph_dict=concept_graph_dict,
        max_workers=max_workers,
        batch_size=batch_size,
        batch_delay=1
    )

    return results

def test_single_concept_distillation(concept: str, api_url: str, api_key: str, model_name: str, verbose: bool = True):
    """Tests distillation for a single concept"""
    print("=" * 80)
    print("Single Concept Distillation Test")
    print("=" * 80)

    # Initialize API client
    api_client = APIClient(
        api_url=api_url,
        api_key=api_key,
        model_name=model_name
    )

    distiller = ConceptDistiller(api_client)

    print(f"Concept: {concept}")
    print()

    # Process concept
    result = distiller.distill_concept(concept, "test_concept")

    print(f"Processing status: {result.status}")
    print(f"Processing time: {result.processing_time:.2f} seconds")

    if result.status == "success":
        print(f"Number of questions generated: {len(result.generated_questions)}")
        print("=" * 80)
        print("Generated Data:")
        print("=" * 80)
        for i, question in enumerate(result.generated_questions, 1):
            print(f"\nQuestion {i}:")
            print(f"Scenario: {question['question']}")
            print(f"Reasoning: {question['reasoning_guidance'][:100]}...")
            print(f"Knowledge points: {len(question['knowledge_facts'])} items")
            print(f"Answer: {question['final_answer'][:100]}...")
        print("=" * 80)
        if verbose:
            print("Original LLM Response:")
            print("=" * 80)
            print(result.response)
        print("=" * 80)
        return {"success": True, "result": result}
    else:
        print(f"Processing failed: {result.error_details}")
        return {"success": False, "result": result}

def load_and_analyze_distillation_results(results_dir: str = "concept_distillation"):
    """Loads and analyzes results"""
    result_files = [f for f in os.listdir(results_dir) 
                    if f.startswith('concept_distillation_batch_') and f.endswith('.pkl')]
    result_files.sort()

    if not result_files:
        print("Result files not found")
        return {}

    all_training_data = []
    total_concepts = 0
    total_successful = 0
    total_questions = 0

    print("Results Analysis:")
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

        print(f"Batch {metadata['batch_num']:3d}: "
              f"Total Concepts {metadata['total_concepts']:3d}, "
              f"Success {metadata['successful_distillations']:3d} "
              f"({metadata['successful_distillations']/metadata['total_concepts']*100:.1f}%), "
              f"Num Questions {metadata['total_questions_generated']:4d}")

        # Collect data
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
    print(f"Total: {total_concepts} concepts, Success: {total_successful} ({total_successful/total_concepts*100:.1f}%)")
    print(f"Generated QA: {len(all_training_data)} (Avg {len(all_training_data)/total_successful:.1f} per concept)")

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
    print("Concept QA Generation System")
    print("=" * 80)
    
    # Example Usage
    print("How to use:")
    print("1. test_single_concept_distillation('atrial_fibrillation') - Test a single concept")
    print("2. distill_concept_graph(concept_graph_dict) - Batch concept QA generation")
    print("3. load_and_analyze_distillation_results() - Analyze results")
    print("\nExample:")
    print("# Batch processing")
    print("# distillation_results = distill_concept_graph(your_concept_graph_dict, max_workers=10, batch_size=20)")
```

Before running large-scale batch processing, it is a good practice to verify whether the Prompt and code logic work as expected. The following code is exactly such a unit test: it uses “atrial fibrillation (atrial\_fibrillation)” as an example and calls the `test_single_concept_distillation` function to test the QA generation effect for a single concept.

```python
test_single_concept_distillation('atrial_fibrillation')
```

In actual practice, we may not need to generate QA for all concepts in the graph. Depending on the project goals, we can choose an appropriate subset. As mentioned at the beginning of this section, our strategy is to select a medium-scale subgraph (nodes after 3 iterations) but with more mature connections (edges after 5 iterations) as the scope for knowledge distillation.

The following code is precisely for achieving this goal. It first loads two graph files from different iteration stages, and then, through the `extract_subgraph` and `extract_unique_edges` functions, precisely constructs the target graph `filtered_graph` that we will use for QA generation.

```python
# Filter to get the current target concept graph

import pickle
with open('cookbooktest/Cardio/concept_graph_4omini_5_iter.pkl', 'rb') as f:
    concept_dict = pickle.load(f)

import pickle
with open('cookbooktest/Cardio/concept_graph_4omini_3_iter.pkl', 'rb') as f:
    sub_concept_dict = pickle.load(f)

def extract_subgraph(full_graph_dict, sub_concept_set):
    """Extracts a subgraph, keeping only specified concepts and the edges between them"""
    
    # If sub_concept_set is a dict, take its keys; if it's a list/set, use it directly
    if isinstance(sub_concept_set, dict):
        valid_concepts = set(sub_concept_set.keys())
    else:
        valid_concepts = set(sub_concept_set)
    
    subgraph = {}
    
    for concept, neighbors in full_graph_dict.items():
        # Only process concepts that are in the subset
        if concept in valid_concepts:
            # Only keep neighbors that are also in the subset
            filtered_neighbors = [n for n in neighbors if n in valid_concepts]
            if filtered_neighbors:  # Only keep nodes that have neighbors
                subgraph[concept] = filtered_neighbors
    
    print(f"Original graph: {len(full_graph_dict)} nodes")
    print(f"Subgraph: {len(subgraph)} nodes")
    
    # Count edges
    total_edges = sum(len(neighbors) for neighbors in subgraph.values())
    print(f"Subgraph edge count: {total_edges}")
    
    return subgraph

filtered_graph = extract_subgraph(concept_dict, sub_concept_dict)

# Remove duplicate edges
def extract_unique_edges(graph_dict):
    """Extracts unique edge pairs from the graph, keeping only one of each bidirectional edge"""
    
    processed_pairs = set()
    unique_edges = []
    
    for concept_a, neighbors in graph_dict.items():
        for concept_b in neighbors:
            # Sort to ensure (A,B) and (B,A) are treated as the same pair
            edge = tuple(sorted([concept_a, concept_b]))
    
            if edge not in processed_pairs:
                processed_pairs.add(edge)
                unique_edges.append(edge)
    
    print(f"Total edges: {sum(len(neighbors) for neighbors in graph_dict.values())}")
    print(f"Edges after deduplication: {len(unique_edges)}")
    
    return unique_edges

# Usage
unique_edges = extract_unique_edges(filtered_graph)

# View the first few edges
print("First 5 edges:")
for i, (a, b) in enumerate(unique_edges[:5]):
    print(f"{i+1}. {a} <-> {b}")
```

```python
# Batch QA extraction for single concepts
results = distill_concept_graph(
    concept_graph_dict=example_concept_dict,
    max_workers=100,      # Concurrency count
    batch_size=1000,      # Batch size
    output_dir="cookbooktest/Cardio",  # Save location
    api_url=api_url, 
    api_key=api_key, 
    model_name=QA_SYNTHESIZER
)
```

In practice, we selected a subgraph of medium scale (nodes after 3 iterations) but with more mature connections (edges after 5 iterations) as the scope for knowledge distillation, in order to balance the breadth and depth of knowledge. For concept-pair knowledge distillation, we designed a more complex two-stage “Evaluation–Generation” Prompt. The LLM first acts as a “filter,” strictly evaluating the clinical relevance and educational value of the concept pairs. Only the “golden combinations” that pass this evaluation proceed to the second stage, where a logically more complex QA pair is generated that simultaneously covers both concepts.

```python
# For the problem generation and extraction of concept pairs, we will not discuss them in detail. We provide prompt as inspiration:
    @staticmethod
    def get_pair_system_prompt() -> str:

        return """You are a world-renowned cardiovascular specialist with 20+ years of clinical experience. Your task is to rigorously evaluate concept pairs and generate high-quality educational content. You must act as a **strict filter**, approving only pairs with a **direct, critical, and undeniable link** in clinical practice and training."""

    @staticmethod
    def get_pair_prompt(concept_pairs: List[tuple]) -> str:

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

## **QA Data Structure Example**

All QA data generated through the knowledge distillation process will be organized into a unified, standardized JSON object format, to facilitate subsequent program reading and processing. This structure contains the following key fields:

* `concept`: Source of knowledge, which can be a single concept (string) or a concept pair (list).
* `question`: The core clinical question.
* `reasoning_guidance`: The clinical reasoning pathway for solving the problem.
* `knowledge_facts`: The core knowledge points required to answer the question.
* `final_answer`: A comprehensive and authoritative answer to the question.

We name the entire collection of formatted QA data as `qa_collection`.

1. **single concept QA example**

```python
{'concept': 'ankylosing spondylitis',
 'question': 'A young adult patient with a 5-year history of ankylosing spondylitis presents with unexplained fatigue and palpitations. Laboratory tests reveal anemia and elevated acute phase reactants. In the context of ankylosing spondylitis, what cardiovascular complication should be explored, and what is the likely mechanism of the heart condition related to this systemic inflammatory disease?',
 'reasoning_guidance': 'Identify the common systemic manifestations of ankylosing spondylitis including inflammation and anemia. Consider the cardiovascular implications of chronic inflammation and anemia on cardiac function. Explore the mechanism by which systemic diseases like ankylosing spondylitis can result in heart conditions such as myocardial fibrosis or dysfunction.',
 'knowledge_facts': ['ankylosing spondylitis can cause systemic inflammation, contributing to cardiovascular complications like myocardial fibrosis.',
  'ankylosing spondylitis-associated inflammation can lead to chronic anemia, affecting cardiovascular health.',
  'ankylosing spondylitis may lead to cardiac conduction system involvement, resulting in palpitations.'],
 'final_answer': "Given the patient's symptoms and laboratory findings, myocardial fibrosis due to systemic inflammation related to ankylosing spondylitis should be explored. The fatigue and palpitations may be due, in part, to anemia exacerbating cardiac stress, and inflammation leading to fibrosis, altering cardiac conduction and function."}

```

2. **Concept Pair QA Example**

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

## **Final Step: Build and Export MemCube**

At this point, all data preparation work has been completed. We now need to assemble these independent “knowledge units” (`qa_collection`) into a powerful, interconnected knowledge network—**MemCube**.

The construction process is as follows:

1. **Concepts as the skeleton**: Each “concept” in the concept graph becomes an independent **node** in MemCube.
2. **QAs as the flesh**: Each “QA pair” also becomes an independent **node**, connected to one or two concept nodes from which it originates.
3. **Questions as the index**: We **vectorize the question text** in each QA node, using it as the semantic “address” within the memory network for fast retrieval.

The following Python script accomplishes this transformation in one step. It loads `qa_collection`, extracts and creates all concept nodes and QA nodes, then establishes relational edges between nodes based on predefined logic. Finally, it assembles all nodes and edges into a complete JSON object conforming to the MemOS format, and exports it as a file.

```python
import os
from sentence_transformers import SentenceTransformer
import torch
model = SentenceTransformer(
    EMBEDDING_MODEL,
    trust_remote_code=True
)
# =============================================================================
# Cell 1: Import libraries and helper functions
# =============================================================================
import pickle
import uuid
import json
from datetime import datetime
from collections import defaultdict
import numpy as np

# Data loading
with open("cookbooktest/Cardio/qa_collection.pkl", 'rb') as f:
    qa_collection = pickle.load(f)

print(f"✅ Loaded {len(qa_collection)} QA data items")

def generate_real_embedding_batch(texts, batch_size=50):
    """Batch generate embedding vectors"""
    if isinstance(texts, str):
        # Single text, process directly
        embedding = model.encode(texts, convert_to_tensor=False)
        return embedding.tolist()
    
    # Batch processing
    all_embeddings = []
    total = len(texts)
    
    for i in range(0, total, batch_size):
        batch_end = min(i + batch_size, total)
        batch_texts = texts[i:batch_end]
    
        print(f"  Embedding batch {i//batch_size + 1}/{(total-1)//batch_size + 1} ({len(batch_texts)} texts)")
    
        # Batch encode
        batch_embeddings = model.encode(batch_texts, convert_to_tensor=False, show_progress_bar=False)
    
        # Convert to list and add to results
        for emb in batch_embeddings:
            all_embeddings.append(emb.tolist())
    
    return all_embeddings

# =============================================================================
# Cell 2: Data validation and concept extraction
# =============================================================================
def extract_unique_concepts(qa_collection):
    """Extract all unique concepts from QA data and validate the data format"""
    unique_concepts = set()
    invalid_data = []
    valid_concept_qa = 0
    valid_relation_qa = 0
    
    for i, qa_data in enumerate(qa_collection):
        if isinstance(qa_data['concept'], str):
            # Concept QA - single concept
            unique_concepts.add(qa_data['concept'])
            valid_concept_qa += 1
        elif isinstance(qa_data['concept'], list):
            # Relation QA - should be a pair of 2 concepts
            if len(qa_data['concept']) == 2:
                unique_concepts.update(qa_data['concept'])
                valid_relation_qa += 1
            else:
                # Data anomaly: not a pair of 2 concepts
                invalid_data.append({
                    'index': i,
                    'concept': qa_data['concept'],
                    'length': len(qa_data['concept']),
                    'question': qa_data['question'][:100] + "..."
                })
        else:
            # Data anomaly: concept is neither str nor list
            invalid_data.append({
                'index': i,
                'concept': qa_data['concept'],
                'type': type(qa_data['concept']),
                'question': qa_data['question'][:100] + "..."
            })
    
    # Report data validation results
    print(f"📊 Data Validation Results:")
    print(f"   - Valid Concept QA: {valid_concept_qa}")
    print(f"   - Valid Relation QA: {valid_relation_qa}")
    print(f"   - Anomalous Data: {len(invalid_data)}")
    print(f"   - Extracted unique concepts: {len(unique_concepts)}")
    
    if invalid_data:
        print(f"\n⚠️ Anomalous Data Details:")
        for item in invalid_data[:3]:  # Only show the first 3
            print(f"   Index {item['index']}: concept={item['concept']}")
            print(f"      Question: {item['question']}")
        if len(invalid_data) > 3:
            print(f"   ... and {len(invalid_data) - 3} more anomalous items")
    
    return list(unique_concepts), invalid_data, valid_concept_qa, valid_relation_qa

# Execute data validation
print("🔍 Starting data validation...")
unique_concepts, invalid_data, valid_concept_qa, valid_relation_qa = extract_unique_concepts(qa_collection)

print(f"\n✅ Concept list example: {list(unique_concepts)[:5]}...")

# =============================================================================
# Cell 3: Create concept nodes
# =============================================================================
def create_concept_nodes(unique_concepts):
    """Create all concept nodes - using the concept name as memory and for embedding"""
    concept_nodes = {}
    
    print(f"Starting to generate embeddings for {len(unique_concepts)} concepts...")
    
    # Batch generate concept embeddings
    concept_embeddings = generate_real_embedding_batch(unique_concepts, batch_size=100)
    
    for i, (concept, embedding) in enumerate(zip(unique_concepts, concept_embeddings)):
        concept_id = str(uuid.uuid4())
    
        node = {
            "id": concept_id,
            "memory": concept,  # Concept name as memory
            "metadata": {
                "type": "fact",
                "memory_type": "UserMemory",
                "status": "activated",
                "entities": [concept],
                "tags": [concept],
                "embedding": embedding,  # Embedding of the concept name
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
            print(f"  Completed {i + 1}/{len(unique_concepts)} concepts")
    
    print(f"✅ Created {len(concept_nodes)} concept nodes")
    return concept_nodes

# Execute concept node creation
print("🏗️ Creating concept nodes...")
concept_nodes = create_concept_nodes(unique_concepts)
print("Example concept node ID:", list(concept_nodes.keys())[0], "->", concept_nodes[list(concept_nodes.keys())[0]]["id"])

# =============================================================================
# Cell 4: Create QA nodes
# =============================================================================
def create_qa_nodes(qa_collection, concept_nodes):
    """Creates all QA nodes - optimized with batch embedding"""
    
    # 1. First, collect all question texts and metadata
    all_questions = []
    all_metadata = []
    skipped_count = 0
    
    for qa_data in qa_collection:
        question = qa_data['question']
    
        # Construct full memory content
        memory_content = f"""Question: {qa_data['question']}

Reasoning Guidance: {qa_data['reasoning_guidance']}

Knowledge Facts: {'; '.join(qa_data['knowledge_facts'])}

Answer: {qa_data['final_answer']}"""
    
        # Determine QA type and prepare metadata
        if isinstance(qa_data['concept'], str):
            # Concept QA
            concept_name = qa_data['concept']
            if concept_name not in concept_nodes:
                print(f"  Warning: Concept '{concept_name}' does not exist, skipping this QA")
                skipped_count += 1
                continue
        
            qa_type = "concept_qa"
            entities = [concept_name]
            tags = [concept_name]
            related_concept_ids = [concept_nodes[concept_name]["id"]]
    
        elif isinstance(qa_data['concept'], list) and len(qa_data['concept']) == 2:
            # Relation QA
            concept_names = qa_data['concept']
    
            # Check if all concepts exist
            missing_concepts = [name for name in concept_names if name not in concept_nodes]
            if missing_concepts:
                print(f"  Warning: Concepts {missing_concepts} do not exist, skipping this QA")
                skipped_count += 1
                continue
        
            qa_type = "relation_qa"
            entities = concept_names
            tags = concept_names
            related_concept_ids = [concept_nodes[name]["id"] for name in concept_names]
    
        else:
            # Skip anomalous data
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
    
    print(f"Collected {len(all_questions)} valid questions (skipped {skipped_count}), starting batch embedding generation...")
    
    # 2. Batch generate embeddings for all questions
    all_embeddings = generate_real_embedding_batch(all_questions, batch_size=100)
    
    # 3. Create QA nodes
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
                "embedding": embedding,  # Embedding of the question
                "created_at": datetime.now().isoformat(),
                "usage": [],
                "background": "",
                # Temporary fields for creating edge relationships
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
            print(f"  Created {i + 1}/{len(all_questions)} QA nodes")
    
    print(f"✅ Created {len(qa_nodes)} QA nodes")
    print(f"   - Concept QA: {concept_qa_count}")
    print(f"   - Relation QA: {relation_qa_count}")
    
    return qa_nodes

# Execute QA node creation
print("🏗️ Creating QA nodes...")
qa_nodes = create_qa_nodes(qa_collection, concept_nodes)
if qa_nodes:
    print(f"Example QA node: {qa_nodes[0]['metadata']['qa_type']}")
```

```python
# =============================================================================
# Cell 5: Create relationship edges
# =============================================================================
def create_edges(concept_nodes, qa_nodes, qa_collection):
    """Creates relationship edges between nodes"""
    edges = []
    edge_set = set()  # Used for deduplicating edges
    
    # 1. Concept↔Concept RELATE_TO relationships (derived from Relation QA)
    concept_relations = set()
    for qa_data in qa_collection:
        if isinstance(qa_data['concept'], list) and len(qa_data['concept']) == 2:
            # Relation QA indicates a clinically relevant relationship between two concepts
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
    
    print(f"✅ Created {relate_count} inter-concept RELATE_TO relationships")
    
    # 2. Concept PARENT QA relationships (Concept QA)
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
    
    print(f"✅ Created {parent_count} Concept→QA PARENT relationships")
    
    # 3. Concept PARENT QA relationships (Relation QA - bridging questions)
    relation_parent_count = 0
    for qa_node in qa_nodes:
        if qa_node['metadata']['qa_type'] == "relation_qa":
            qa_id = qa_node['id']
    
            # Ensure related_concept_ids is valid
            if 'related_concept_ids' in qa_node['metadata']:
                for concept_id in qa_node['metadata']['related_concept_ids']:
                    edges.append({
                        "source": concept_id,    # Concept as parent node
                        "target": qa_id,         # Bridging question as child node
                        "type": "PARENT"
                    })
                    relation_parent_count += 1
    
    print(f"✅ Created {relation_parent_count} Concept→Bridging QA PARENT relationships")
    print(f"📊 Total number of relationships: {len(edges)}")
    
    return edges

# Execute edge relationship creation
print("🔗 Creating relationship edges...")
edges = create_edges(concept_nodes, qa_nodes, qa_collection)
# =============================================================================
# Cell 6: Assemble and save the final JSON
# =============================================================================
def assemble_final_json(concept_nodes, qa_nodes, edges):
    """Assembles the final JSON in TextualMemoryItem format"""
    
    # Merge all nodes
    all_nodes = []
    
    # Add concept nodes
    for concept_data in concept_nodes.values():
        all_nodes.append(concept_data["node"])
    
    # Add QA nodes, cleaning up temporary fields
    for qa_node in qa_nodes:
        # Deep copy the node to avoid modifying the original data
        clean_node = {
            "id": qa_node["id"],
            "memory": qa_node["memory"],
            "metadata": qa_node["metadata"].copy()
        }
    
        # Remove temporary fields
        if "qa_type" in clean_node["metadata"]:
            del clean_node["metadata"]["qa_type"]
        if "related_concept_ids" in clean_node["metadata"]:
            del clean_node["metadata"]["related_concept_ids"]
    
        all_nodes.append(clean_node)
    
    # Build the final structure
    result = {
        "nodes": all_nodes,
        "edges": edges
    }
    
    print(f"✅ Final JSON contains:")
    print(f"   - Node count: {len(all_nodes)}")
    print(f"   - Edge count: {len(edges)}")
    print(f"   - Concept nodes: {len(concept_nodes)}")
    print(f"   - QA nodes: {len(qa_nodes)}")
    print(f"✅ Temporary fields cleaned up")
    
    return result

# Execute final assembly
print("📦 Assembling final JSON...")
final_json = assemble_final_json(concept_nodes, qa_nodes, edges)
```

```python
def save_final_json(result, filename="cardio_textual_memory_graph.json"):
    """Saves the final JSON to a file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Saved to file: {filename}")
    return filename


# Save the results
filename = save_final_json(final_json, "cookbooktest/Cardio/cardio_textual_memory_graph.json")

print("\n🎉 Conversion complete!")
print(f"📄 Output file: {filename}")
print(f"📋 Final Statistics:")
print(f"   - Total nodes: {len(final_json['nodes'])}")
print(f"   - Total edges: {len(final_json['edges'])}")

# Display some sample data for validation
if final_json['nodes']:
    sample_node = final_json['nodes'][0]
    print(f"\n📝 Example Node:")
    print(f"   ID: {sample_node['id']}")
    print(f"   Memory: {sample_node['memory'][:50]}...")
    print(f"   Type: {sample_node['metadata']['type']}")
    print(f"   Entities: {sample_node['metadata']['entities']}")

if final_json['edges']:
    sample_edge = final_json['edges'][0]
    print(f"\n🔗 Example Edge:")
    print(f"   {sample_edge['source']} --{sample_edge['type']}--> {sample_edge['target']}")
```

### **Loading MemCube**

Now, it’s time to inject this “digital blueprint” into a high-performance persistent storage, turning it into a MemCube that can be accessed in real time by MemOS.

We provide a performance-optimized bulk import tool script, which bypasses the bottleneck of adding items one by one and instead loads the entire MemCube directly and efficiently, while ensuring its data structure is fully compatible with MemOS. The core tasks of this script include: creating database constraints, bulk importing nodes and edges, creating vector indexes (the core for achieving millisecond-level semantic search), and compatibility validation.

```python
# Load memcube into neo4j

#!/usr/bin/env python3
import sys
import os
import ijson
import json
import time
from datetime import datetime
from decimal import Decimal
from neo4j import GraphDatabase

# ===================== Configuration Information - Please modify the following information =====================
NEO4J_URI = 'bolt://localhost:7687'
NEO4J_USERNAME = 'your neo4j username'
NEO4J_PASSWORD = 'your neo4j password'
NEO4J_DATABASE = 'neo4j'
JSON_FILE_PATH = 'cookbooktest/Cardio/cardio_textual_memory_graph.json'
# ===================================================================

# Global driver instance
driver = None

def get_driver():
    """Gets the Neo4j driver instance"""
    global driver
    if not driver:
        try:
            driver = GraphDatabase.driver(
                NEO4J_URI, 
                auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
            )
        except Exception as e:
            print(f"❌ Failed to create driver: {e}")
            sys.exit(1)
    return driver

def close_driver():
    """Closes the driver connection"""
    global driver
    if driver:
        driver.close()
        driver = None

def test_neo4j_connection():
    """Tests the Neo4j connection"""
    try:
        driver = get_driver()
        with driver.session() as session:
            result = session.run("RETURN 'Connection OK' AS message")
            print(f"✅ Neo4j connection successful: {result.single()['message']}")
        return True
    except Exception as e:
        print(f"❌ Neo4j connection failed: {e}")
        return False

def create_memos_compatible_schema():
    """Creates a MemOS-compatible schema and indexes"""
    print("Creating MemOS-compatible data structure...")
    
    try:
        driver = get_driver()
        with driver.session() as session:
            # Create MemOS-compatible constraints
            session.run("""
                CREATE CONSTRAINT memory_id_unique IF NOT EXISTS
                FOR (n:Memory) REQUIRE n.id IS UNIQUE
            """)
            print("✅ Created unique constraint on Memory node ID")
        return True
    
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        return False

def bulk_import_nodes():
    """Bulk import nodes - Native Neo4j method"""
    print("\n" + "=" * 50)
    print("Starting native Neo4j bulk import of nodes")
    print("=" * 50)
    
    driver = config.get_driver()
    start_time = time.time()
    success_count = 0
    batch_size = 5000  # Large batches for optimal performance
    batch = []
    
    try:
        with open(config.json_file_path, 'rb') as f:
            nodes = ijson.items(f, 'nodes.item')
    
            for node in nodes:
                # Prepare MemOS-compatible node data
                node_data = prepare_memos_node(node)
                batch.append(node_data)
        
                # Execute batch import
                if len(batch) >= batch_size:
                    batch_success = execute_node_batch(driver, batch)
                    success_count += batch_success
                    batch = []
                
                    # Display progress
                    elapsed = time.time() - start_time
                    rate = success_count / elapsed
                    eta_minutes = (200000 - success_count) / rate / 60
            
                    print(f"  Imported: {success_count:,}/200,000 ({success_count/200000*100:.1f}%) | "
                          f"Rate: {rate:.1f} nodes/sec | "
                          f"ETA: {eta_minutes:.1f} minutes")
    
            # Process the remaining batch
            if batch:
                batch_success = execute_node_batch(driver, batch)
                success_count += batch_success
    
        total_time = time.time() - start_time
        print(f"\n✅ Node bulk import complete:")
        print(f"  Number imported: {success_count:,}")
        print(f"  Total time: {total_time/60:.1f} minutes")
        print(f"  Average rate: {success_count/total_time:.1f} nodes/sec")
        return success_count
    
    except Exception as e:
        print(f"❌ Bulk import failed: {e}")
        return success_count

def clean_data_types(obj):
    """Cleans data types to ensure Neo4j compatibility"""
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
    """Prepares MemOS-compatible node data"""
    # First, clean the data types
    node = clean_data_types(node)
    metadata = node.get('metadata', {}).copy()
    
    # Ensure necessary fields
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
    """Executes node batch import"""
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
        print(f"  Batch import error: {e}")
        return 0

def bulk_import_edges():
    """Bulk import edges"""
    print("\n" + "=" * 50)
    print("Starting native Neo4j bulk import of edges")
    print("=" * 50)
    
    driver = config.get_driver()
    start_time = time.time()
    success_count = 0
    batch_size = 10000  # Edges can use larger batches
    batch = []
    
    try:
        with open(config.json_file_path, 'rb') as f:
            edges = ijson.items(f, 'edges.item')
    
            for edge in edges:
                # Clean edge data types
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
                
                    if success_count % 50000 == 0:  # Display every 50,000 records
                        print(f"  Imported: {success_count:,}/500,000 ({success_count/500000*100:.1f}%) | "
                              f"Rate: {rate:.1f} edges/sec | "
                              f"ETA: {eta_minutes:.1f} minutes")
    
            # Process the remaining batch
            if batch:
                batch_success = execute_edge_batch(driver, batch)
                success_count += batch_success
    
        total_time = time.time() - start_time
        print(f"\n✅ Edge bulk import complete:")
        print(f"  Number imported: {success_count:,}")
        print(f"  Total time: {total_time/60:.1f} minutes")
        print(f"  Average rate: {success_count/total_time:.1f} edges/sec")
        return success_count
    
    except Exception as e:
        print(f"❌ Edge import failed: {e}")
        return success_count

def execute_edge_batch(driver, batch):
    """Executes edge batch import"""
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
        print(f"  Edge batch import error: {e}")
        return 0
def create_memos_indexes():
    """Creates the indexes required by MemOS"""
    print("\n" + "=" * 50)
    print("Creating MemOS-compatible indexes")
    print("=" * 50)
    
    try:
        driver = config.get_driver()
        with driver.session() as session:
            # Commonly used MemOS indexes
            indexes = [
                "CREATE INDEX memory_type_idx IF NOT EXISTS FOR (n:Memory) ON (n.memory_type)",
                "CREATE INDEX memory_status_idx IF NOT EXISTS FOR (n:Memory) ON (n.status)",
                "CREATE INDEX memory_created_at_idx IF NOT EXISTS FOR (n:Memory) ON (n.created_at)",
                "CREATE INDEX memory_updated_at_idx IF NOT EXISTS FOR (n:Memory) ON (n.updated_at)",
                "CREATE INDEX memory_user_name_index IF NOT EXISTS FOR (n:Memory) ON (n.user_name)"
            ]
    
            for index_query in indexes:
                session.run(index_query)
                print(f"✅ Index created: {index_query.split()[-7]}")  # Extract index name
    
            # Create vector index - required for MemOS vector search
            try:
                session.run("""
                    CREATE VECTOR INDEX memory_vector_index IF NOT EXISTS
                    FOR (n:Memory) ON (n.embedding)
                    OPTIONS {indexConfig: {
                        `vector.dimensions`: 768,
                        `vector.similarity_function`: 'cosine'
                    }}
                """)
                print("✅ Vector index created: memory_vector_index (768 dimensions)")
            except Exception as ve:
                print(f"⚠️ Vector index creation failed: {ve}")
                print("   Vector search functionality will be unavailable")
        print("✅ All MemOS-compatible indexes created successfully")
    
    except Exception as e:
        print(f"❌ Index creation failed: {e}")

def verify_memos_compatibility():
    """Verifies MemOS compatibility"""
    print("\n" + "=" * 50)
    print("Verifying MemOS compatibility")
    print("=" * 50)
    
    try:
        # Add MemOS path
        sys.path.append('./MemOS/src')
        from memos.configs.graph_db import GraphDBConfigFactory
        from memos.graph_dbs.factory import GraphStoreFactory
    
        # Create MemOS configuration
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
    
        # Test basic functionality
        try:
            node_count = graph_store.count_nodes("UserMemory")
            print(f"✅ MemOS node count: {node_count:,} UserMemory nodes")
        except:
            print("⚠️ Node counting function needs fine-tuning")
    
        # Test export functionality
        try:
            exported = graph_store.export_graph()
            print(f"✅ MemOS graph export: {len(exported.get('nodes', []))} nodes, {len(exported.get('edges', []))} edges")
        except Exception as e:
            print(f"⚠️ Graph export function: {e}")
    
        print("✅ MemOS compatibility verification complete")
        return True
    
    except Exception as e:
        print(f"❌ MemOS compatibility verification failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Neo4j Bulk Import Tool")
    print("=" * 50)
    
    try:
        # 1. Get user configuration - input all information at once
        config.get_user_input()
        
        # 2. Test connection
        if not test_neo4j_connection():
            return
    
        # 3. Create compatible schema
        if not create_memos_compatible_schema():
            return
    
        # 4. Display estimates
        print(f"\nDirect Neo4j bulk import estimate:")
        print(f"  Node count: 200,000")
        print(f"  Edge count: 500,000")
        print(f"  Batch size: 5,000 nodes/batch, 10,000 edges/batch")
        print(f"  Expected speed: 1000+ nodes/sec, 5000+ edges/sec")
        print(f"  Estimated time: 15-25 minutes")
    
        confirm = input("\nStart direct bulk import? (y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ User cancelled import")
            return
    
        # 5. Execute import
        total_start = time.time()
    
        # Import nodes
        node_count = bulk_import_nodes()
    
        # Import edges
        edge_count = bulk_import_edges()
    
        # Create indexes
        create_memos_indexes()
    
        # Verify compatibility
        compatible = verify_memos_compatibility()
    
        # Summary
        total_time = time.time() - total_start
        print("\n" + "=" * 50)
        print("Direct bulk import completion summary")
        print("=" * 50)
        print(f"✅ Total time: {total_time/60:.1f} minutes")
        print(f"📊 Import statistics:")
        print(f"  Nodes: {node_count:,}")
        print(f"  Edges: {edge_count:,}")
        print(f"  MemOS compatibility: {'✅ Fully compatible' if compatible else '⚠️ Adjustment needed'}")
    
        if node_count > 0:
            print("\n💡 You can now use all MemOS features:")
            print("  - Semantic search")
            print("  - Graph query")
            print("  - Memory reasoning")
            print("  - Visualization")
            
    except KeyboardInterrupt:
        print("\n❌ User interrupted operation")
    except Exception as e:
        print(f"\n❌ Program execution error: {e}")
    finally:
        # Ensure database connection is closed
        config.close_driver()
        print("🔒 Database connection closed")

if __name__ == "__main__":
    main()
```

#### **Load MemCube in MemOS**

Once the data is successfully imported, our cardiovascular MemCube is officially “online.” In the application, we only need to initialize MemOS’s `TreeTextMemory` through a configuration file pointing to the database. After that, we can interact with the vast knowledge base via the `tree_memory` object, granting the AI specialized domain memory.

```python
from memos.configs.memory import TreeTextMemoryConfig
from memos.memories.textual.tree import TreeTextMemory

# 1. example of the config file to load memcube
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

# 2. Write a JSON file
json_path = "cookbooktest/tree_config.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(config_data, f, indent=2, ensure_ascii=False)

print(f"配置文件已生成: {json_path}")

# 3. Read configuration and initialize TreeTextMemory
config = TreeTextMemoryConfig.from_json_file(json_path)
tree_memory = TreeTextMemory(config)

```

---

## **Performance Evaluation Report: MemCube Memory Enhancement Framework Verification**

### **Evaluation Method**

To quantify the performance improvements brought by Cardiovascular MemCube, we built an automated evaluation pipeline. The core of this process is: using a powerful third-party model (such as Gemini-2.5-Pro) as a neutral “examiner” to verify the improvement in a MemCube-equipped model’s ability to solve professional problems.

#### Example Evaluation Questions

---

```python
# questions (partial in 200 questions)
 'A 65-year-old male patient presents to the emergency department with severe lower abdominal pain, inability to urinate, and is complaining of lightheadedness and palpitations. His past medical history includes hypertension controlled with lisinopril, benign prostatic hyperplasia for which he has been taking tamsulosin, and moderate alcohol use. On examination, his heart rate is elevated at 105 beats per minute, blood pressure is 140/90 mmHg, and he appears uncomfortable. Palpation reveals a distended bladder. An ECG shows sinus tachycardia without ischemic changes. You suspect bladder distension might be causing autonomic reflex changes affecting cardiac function. Considering this scenario, explain the physiological mechanism by which bladder distension might result in cardiac symptoms, and outline your approach to managing this patient to resolve both the urinary and cardiovascular concerns.',
 'In an elderly patient with poorly controlled diabetes, how do advanced glycation end products (AGEs) contribute to the pathophysiology of endothelial injury, and what implications does this have for the management of cardiovascular risks?',
 'A middle-aged patient with venous insufficiency is monitored using transcutaneous oxygen measurements to assess tissue perfusion. How does venous insufficiency affect transcutaneous oxygen levels, and how should these results influence treatment decisions for skin ulcers?',
 'A young adult with confirmed tubular acidosis is presenting with significant metabolic acidosis. How would sodium bicarbonate therapy be utilized in this case, and what are the considerations for its dosages and effects?'
```

```python
 
#### Core Retrieval Process Implementation

# The following script demonstrates the retrieval steps based on MemCube: using the `tree_memory.search()` method.

# It precisely identifies the knowledge fragments from our massive MemCube that are semantically most similar to the current exam question.

# You may also configure a chat model afterward, thereby directly enabling conversational functionality.

# question_list: A list of similar questions provided by the user for retrieval.

# For example: ['What are the signs of a myocardial infarction?', 'What are the potential dangers of high blood pressure?']

question_list = ['What are the signs of a myocardial infarction?', 'What are the potential dangers of high blood pressure?']
search_results_dict = {}

for i, question in enumerate(question_list):
    print(i)
    results = tree_memory.search(question, top_k=15)
    # Exclude short pure concept nodes
    filtered_results = [node.memory for node in results if len(node.memory) > 100]
    search_results_dict[i] = {
        'question': question,
        'results': filtered_results
    }
```

---

# 🧠 MemCube Memory Operating System Medical AI Performance Evaluation Report

## 📋 Executive Summary

Based on a comparative analysis of 200 medical cases evaluated by strong-model objective judgment, this report comprehensively assesses the effectiveness of MemCube in medical AI applications. Through the domain knowledge pipeline built by MemOS, MemCube significantly enhances the medical reasoning capabilities of AI models.

### **Core Comparative Results and Analysis**

#### **Direct Win-Loss Statistics**

| Comparison of Configurations | MemCube Enhanced Edition Wins | Baseline Basic Edition Wins | Draw |
| ------------------------------------ | :-------------: | :--------------: | :--: |
| **7B model internal comparison**             |  **47**  |   **3**   | 150 |
| **32B model internal comparison**            |  **92**  |   **0**   | 108 |
| **7B+MemCube vs 32B Baseline** |  **57**  |   **3**   | 140 |

Here’s the full English translation with all original symbols, code, and formatting preserved:
---
#### **Key Insights Analysis**

1. **For large models, precise domain knowledge remains crucial**: Results show that equipping the 32B-parameter model with MemCube gives it an overwhelming advantage (92 wins, 0 losses). This confirms that even for large models with strong baseline capabilities, a structured external domain knowledge base can still deliver a decisive performance boost, especially in professional fields where precision of knowledge is critical.

2. **Memory system enables “small to beat big”**: In the cross-level comparison between the 7B model and the 32B base model, the 7B model equipped with MemCube achieved a remarkable 57 wins and 3 losses. This clearly demonstrates that a well-designed memory system can effectively compensate for the knowledge limitations of smaller models, enabling them to outperform general-purpose models many times larger in specific domains.

3. **Memory system has universal effectiveness**: Whether it is the 7B or the 32B model, once equipped with MemCube, their professionalism and accuracy of responses improve significantly. This indicates that the “Concept Graph – Knowledge Distillation – Memory Augmentation” framework proposed in this chapter is a universally applicable and efficient approach to enhancing AI capabilities.

### **In-depth Analysis of Representative Cases**

To better understand the working mechanism of MemCube, we conducted an in-depth analysis of selected evaluation cases.

#### **Case Analysis 1 (7B Model, ID: 9): Retinopathy of Prematurity (ROP) Case**

**Clinical Question**: Involves a 6-year-old child with retinopathy of prematurity (ROP), who was referred to the cardiovascular department for systemic evaluation due to microvascular changes in the fundus. The question requires assessing which cardiovascular examinations should be conducted, and how the fundus findings affect the cardiovascular evaluation strategy.

**Clinical Question**:

```
A 6-year-old child is referred to your cardiovascular clinic for evaluation after being diagnosed with retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and has expressed concerns regarding the child's cardiovascular health given the potential systemic implications of microvascular changes observed in ROP. As you assess the child, you consider possible cardiovascular complications that may arise. What cardiovascular assessments would be pertinent in this case, and how might the existing retinal findings influence your cardiovascular evaluation strategy, particularly concerning microvascular health and its potential systemic effects?
```

**MemCube Enhanced**:

```
{'model': 'qwen2.5-7b-instruct', 'version': 'v2', 'question_id': 9, 'prompt': "As an experienced medical expert, provide comprehensive analysis using evidence-based medicine principles.\n\n**CLINICAL CASE:**\nA 6-year-old child is referred to your cardiovascular clinic for evaluation after being diagnosed with retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and has expressed concerns regarding the child's cardiovascular health given the potential systemic implications of microvascular changes observed in ROP. As you assess the child, you consider possible cardiovascular complications that may arise. What cardiovascular assessments would be pertinent in this case, and how might the existing retinal findings influence your cardiovascular evaluation strategy, particularly concerning microvascular health and its potential systemic effects?\n\n**KEY EVIDENCE:**\n• Question: A young child presents with suspected retinopathy of prematurity, potentially linked to a congenital heart defect that has led to inconsistent oxygen delivery. As a cardiovascular specialist, how would you approach the management of this child's systemic condition to optimize retinal health?\n\nReasoning Guidance: Evaluate the impact of the congenital heart defect on systemic oxygenation. Consider the role of oxygen supplementation and monitoring. Integrate cardiovascular management strategies with ophthalmologic treatment to optimize retinal health.\n\nKnowledge Facts: Pediatric retinal disorders often involve insufficient retinal vascular development.; Pediatric retinal disorders can be exacerbated by systemic oxygen imbalances, common in congenital heart defects.; Effective management of pediatric retinal disorder requires collaboration with ophthalmology and cardiology.\n\nAnswer: The management involves stabilizing systemic oxygen levels through correction of the heart defect, if feasible, and careful use of supplemental oxygen. Coordination with an ophthalmologist to monitor retinal changes and implement laser therapy or surgical interventions may be required.\n• Question: During a cardiovascular examination, a pediatric patient with coexisting retinal and cardiovascular disorders seems to have poor growth despite appropriate medical interventions. What could be the systemic implications of these concurrent conditions, and how should clinical decision-making address these concerns?\n\nReasoning Guidance: Integrate understanding of pediatric retinal disorder with the potential cardiovascular inefficiencies causing poor systemic circulation and growth delays. Consider multidisciplinary approaches for these intertwined issues, promoting comprehensive care strategies.\n\nKnowledge Facts: Pediatric retinal disorders and cardiac anomalies can have overlapping pathogenic mechanisms affecting systemic development.; A comprehensive clinical approach involves assessing the interplay between circulatory efficiency and ocular vascular health.; Addressing underlying cardiovascular inefficiencies may relieve secondary complications impacting systemic development.\n\nAnswer: The clinical approach should prioritize optimization of cardiovascular function to improve circulation efficiencies, potentially benefiting retinal health and promoting growth. Collaboration across specialties, including cardiology, ophthalmology, and pediatrics, is crucial for comprehensive systemic management.\n• Question: A young adult with a history of pediatric retinal disorder secondary to Kawasaki disease is undergoing cardiovascular follow-up for potential coronary artery complications. How can ongoing retinal issues influence cardiovascular management?\n\nReasoning Guidance: Assess how retinal issues, such as impaired visual acuity or peripheral vision loss, might affect compliance or understanding of cardiovascular treatment plans. Consider unique strategies in communication or monitoring to enhance treatment adherence.\n\nKnowledge Facts: Pediatric retinal disorders can result from inflammatory conditions like Kawasaki disease impacting vasculature.; In patients with persistent retinal disorder consequences, visual limitations could obstruct understanding of complex medical instructions.; Cardiovascular management must adapt to individual patient's sensory and learning capabilities, ensuring thorough education about treatment and prevention strategies.\n\nAnswer: Management may require tailored communication strategies, ensuring the patient fully understands and is capable of following the prescribed cardiovascular treatment. Regular check-ups should integrate assessments of retinal status to anticipate any complications affecting routine cardiovascular care.\n• Question: A premature infant is undergoing ophthalmic screening for retinopathy of prematurity (ROP). What complications, if untreated, might arise related to the retina?\n\nReasoning Guidance: Understand how untreated ROP can lead to tractional retinal detachment in premature infants.\n\nKnowledge Facts: Retinopathy of prematurity involves abnormal retinal vessel development.; Advanced ROP can result in retinal traction and detachment.; Screening and early treatment are critical in preventing detachment.\n\nAnswer: Regular screening and timely intervention, such as laser photocoagulation, are essential to prevent retinal detachment.\n\nPlease provide evidence-based medical analysis and management recommendations.", 'response': "### Comprehensive Analysis and Management Recommendations for a Child with Retinopathy of Prematurity (ROP) and Potential Cardiovascular Complications\n\n#### Clinical Case Overview\nA 6-year-old child has been referred to a cardiovascular clinic for evaluation due to a diagnosis of retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and expressed concerns about potential systemic implications, particularly regarding microvascular health and its potential systemic effects.\n\n#### Key Evidence and Reasoning\n\n1. **Impact of Congenital Heart Defect on Systemic Oxygenation:**\n   - **Congenital Heart Defects and ROP:** Congenital heart defects can lead to inconsistent oxygen delivery, which can affect retinal vascular development. The retina is highly sensitive to oxygen levels, and inadequate oxygenation can result in ROP.\n   - **Management Strategy:**\n     - **Correcting the Heart Defect:** If the congenital heart defect is correctable, surgical intervention should be considered to improve systemic oxygenation.\n     - **Supplemental Oxygen:** In the interim, supplemental oxygen can be used to optimize oxygen levels, but it should be carefully monitored to avoid hyperoxia, which can also be detrimental.\n     - **Collaboration with Ophthalmology:** Regular ophthalmologic follow-up is essential to monitor retinal changes and intervene with laser therapy or surgical interventions if necessary.\n\n2. **Systemic Implications of Concurrent Conditions:**\n   - **Poor Growth and Circulatory Efficiency:** Poor growth in a child with both retinal and cardiovascular disorders may be due to systemic circulatory inefficiencies. This can be exacerbated by underlying cardiovascular anomalies.\n   - **Multidisciplinary Approach:**\n     - **Cardiovascular Optimization:** Focus on optimizing cardiovascular function to improve circulation efficiency. This may include pharmacological interventions, lifestyle modifications, and, if necessary, surgical interventions.\n     - **Comprehensive Care:** Collaboration between cardiology, ophthalmology, and pediatrics is essential to address the interplay between circulatory efficiency and ocular vascular health.\n\n3. **Ongoing Retinal Issues and Cardiovascular Management:**\n   - **Visual Limitations and Treatment Adherence:** Retinal issues, such as impaired visual acuity or peripheral vision loss, can affect a patient's ability to understand and adhere to complex medical instructions.\n   - **Tailored Communication Strategies:**\n     - **Simplified Instructions:** Use clear and simple language to ensure the patient or caregiver fully understands the treatment plan.\n     - **Visual Aids and Educational Materials:** Provide visual aids and educational materials to enhance understanding and compliance.\n     - **Regular Follow-ups:** Schedule regular check-ups to monitor both cardiovascular and retinal health, ensuring timely intervention if any complications arise.\n\n4. **Complications of Untreated ROP:**\n   - **Tractional Retinal Detachment:** Advanced ROP can lead to retinal traction and detachment, which can result in severe visual impairment or blindness.\n   - **Screening and Early Intervention:**\n     - **Regular Ophthalmic Screening:** Implement regular ophthalmic screening for premature infants to detect ROP early.\n     - **Timely Intervention:** Promptly intervene with laser photocoagulation or other treatments to prevent retinal detachment.\n\n### Evidence-Based Medical Analysis and Management Recommendations\n\n1. **Initial Assessment:**\n   - **Cardiovascular Examination:** Perform a thorough cardiovascular examination, including echocardiography, to assess the presence and severity of any congenital heart defects.\n   - **Ophthalmologic Evaluation:** Conduct a comprehensive ophthalmologic examination to assess the extent of retinal changes and determine the stage of ROP.\n\n2. **Management Plan:**\n   - **Correct Congenital Heart Defects:** If the heart defect is correctable, arrange for surgical intervention to improve systemic oxygenation.\n   - **Supplemental Oxygen Therapy:** Use supplemental oxygen cautiously to optimize oxygen levels, but monitor for hyperoxia.\n   - **Collaborative Care:** Establish a multidisciplinary care team including cardiology, ophthalmology, and pediatrics to coordinate treatment and monitoring.\n   - **Growth Monitoring:** Regularly monitor the child's growth and development to address any systemic circulatory inefficiencies.\n   - **Communication Strategies:** Use simplified instructions and visual aids to enhance treatment adherence, especially if the child has visual limitations.\n   - **Ophthalmic Screening:** Implement regular ophthalmic screening for premature infants to detect ROP early and intervene promptly.\n\n3. **Monitoring and Follow-ups:**\n   - **Regular Follow-ups:** Schedule regular follow-ups with both the cardiologist and ophthalmologist to monitor the child's cardiovascular and retinal health.\n   - **Adjustments to Treatment:** Be prepared to adjust the treatment plan based on the child's response to interventions and any new findings.\n\nBy following these evidence-based recommendations, the healthcare team can optimize the child's cardiovascular and retinal health, ensuring the best possible outcomes for the patient.", 'length': 5313, 'api_time': 89.44595098495483, 'timestamp': 1753351860.232497, 'error': False}
```

**Baseline**:

```
{'model': 'qwen2.5-7b-instruct', 'version': 'baseline', 'question_id': 9, 'prompt': "Analyze this clinical case as a senior medical expert:\n\nA 6-year-old child is referred to your cardiovascular clinic for evaluation after being diagnosed with retinopathy of prematurity (ROP). The ophthalmologist has noted significant retinal vessel changes and has expressed concerns regarding the child's cardiovascular health given the potential systemic implications of microvascular changes observed in ROP. As you assess the child, you consider possible cardiovascular complications that may arise. What cardiovascular assessments would be pertinent in this case, and how might the existing retinal findings influence your cardiovascular evaluation strategy, particularly concerning microvascular health and its potential systemic effects?\n\nPlease provide detailed medical analysis and recommendations.", 'response': "In this clinical case, a 6-year-old child with retinopathy of prematurity (ROP) presents with significant retinal vessel changes, raising concerns about potential systemic implications. As a senior medical expert, I would recommend a comprehensive cardiovascular evaluation to assess for any underlying cardiovascular complications that may be related to the microvascular changes observed in the retina. Here is a detailed analysis and a recommended evaluation strategy:\n\n### 1. **Medical History and Physical Examination**\n- **Medical History:**\n  - **Perinatal History:** Obtain detailed information about the child's birth, including gestational age, birth weight, and any complications during delivery.\n  - **Family History:** Inquire about any cardiovascular or ocular diseases in the family.\n  - **Past Medical History:** Review any previous medical conditions, surgeries, or treatments.\n  - **Current Medications:** Document any medications the child is currently taking.\n- **Physical Examination:**\n  - **General Appearance:** Assess for signs of prematurity or other systemic conditions.\n  - **Cardiovascular Examination:**\n    - **Heart Sounds:** Auscultate for any murmurs, gallops, or rubs.\n    - **Peripheral Vascular Signs:** Check for signs of hypertension, such as brachial artery blood pressure differences, or signs of coarctation of the aorta.\n    - **Capillary Refill Time:** Evaluate for any signs of poor perfusion.\n\n### 2. **Cardiovascular Assessments**\nGiven the potential systemic implications of microvascular changes observed in ROP, the following cardiovascular assessments are pertinent:\n\n#### **A. Blood Pressure Measurement**\n- **Non-Invasive Measurement:** Measure blood pressure in both arms to detect any differences that might suggest coarctation of the aorta.\n- **Ambulatory Blood Pressure Monitoring (ABPM):** Consider this if there are any signs of hypertension or if the child is symptomatic.\n\n#### **B. Echocardiography**\n- **Echocardiogram:** This is the gold standard for evaluating cardiac structure and function. It can help identify any congenital heart defects, valvular abnormalities, or other structural heart issues that might be related to the microvascular changes.\n- **Fetal Echocardiography:** If the child was born prematurely, a fetal echocardiogram might have been performed, which could provide additional information.\n\n#### **C. Cardiac MRI or CT**\n- **Imaging Studies:** If there are specific concerns about complex cardiac anatomy or if echocardiography is inconclusive, cardiac MRI or CT can provide detailed images of the heart and great vessels.\n\n#### **D. Cardiovascular Risk Factors**\n- **Fasting Lipid Profile:** Assess for dyslipidemia, which can be a risk factor for cardiovascular disease.\n- **Fasting Blood Glucose:** Evaluate for diabetes or impaired glucose tolerance, which can also contribute to cardiovascular risk.\n- **Anthropometric Measurements:** Measure height, weight, and body mass index (BMI) to assess for obesity, which is a significant risk factor for cardiovascular disease.\n\n### 3. **Ophthalmologic and Microvascular Health Considerations**\n- **Retinal Changes:** The significant retinal vessel changes in ROP suggest microvascular abnormalities. These changes are often associated with systemic conditions such as hypertension, diabetes, and other vascular disorders.\n- **Systemic Evaluation:** Given the systemic implications, a thorough evaluation for other microvascular diseases should be considered, including:\n  - **Fundoscopy:** Regular follow-up fundoscopy to monitor for progression of ROP.\n  - **Retinal Vessel Fluorescein Angiography:** To assess the integrity of the retinal vasculature and identify any areas of leakage or ischemia.\n  - **Systemic Blood Pressure Monitoring:** Regular monitoring of blood pressure to detect any hypertension.\n  - **Glucose Tolerance Testing:** To screen for diabetes or impaired glucose tolerance.\n\n### 4. **Recommendations**\n- **Referral to a Pediatric Cardiologist:** Given the potential systemic implications, it is crucial to refer the child to a pediatric cardiologist for a comprehensive cardiovascular evaluation.\n- **Regular Follow-Up:** Schedule regular follow-up visits to monitor the child's cardiovascular health and retinal status.\n- **Lifestyle Modifications:** If any risk factors are identified, implement lifestyle modifications such as a healthy diet, regular exercise, and weight management.\n- **Genetic Counseling:** Consider genetic counseling if there is a family history of cardiovascular or ocular diseases.\n\n### Conclusion\nThe microvascular changes observed in ROP suggest a potential systemic vascular disease. A comprehensive cardiovascular evaluation, including echocardiography, blood pressure monitoring, and other relevant tests, is essential to identify any underlying cardiovascular complications. Regular follow-up and monitoring are crucial to ensure early detection and management of any potential issues.", 'length': 4977, 'api_time': 92.66847014427185, 'timestamp': 1753351863.4531698, 'error': False}
```
**Case Analysis**:
In this case, the baseline model (Answer B) provided a conventional, standard clinical evaluation process, covering history taking, physical examination, and various cardiac tests. However, its response failed to delve into the intrinsic pathophysiological connection between ROP and the cardiovascular system.

In contrast, the MemCube-enhanced model (Answer A) demonstrated a higher level of clinical reasoning ability. It was able to invoke and integrate multiple related knowledge fragments (these knowledge pieces were distilled into QA memories for concepts such as “ROP,” “congenital heart disease,” and “systemic oxygenation”), for example:

* Explicitly pointed out that “congenital heart disease may lead to unstable oxygen delivery, thereby affecting retinal vascular development.”

* Emphasized the potential benefits of optimizing “systemic circulation efficiency” for improving ocular vascular health and overall development.

This reflects the core advantage of MemCube: it is not merely simple information retrieval, but rather the effective association of discrete knowledge points during reasoning, forming a multi-perspective, more in-depth analytical framework. This allows the enhanced model to approach problems like a senior expert—exploring issues from an etiological level and proposing interdisciplinary, integrated management strategies, rather than merely listing examination items.

---

### 32B Model MemCube Effect Evaluation

#### Case 1: Medical QA Comparison (ID: 146)

**Clinical Question**: For an adult patient already diagnosed with idiopathic dilated cardiomyopathy (DCM) who presents with palpitations and dizziness, how does the presence of arrhythmia affect their diagnostic and therapeutic strategy?
**Clinical Question**:

```
An adult patient with known idiopathic dilated cardiomyopathy presents with palpitations and dizziness. How does the presence of arrhythmias influence your diagnostic and therapeutic approach, especially in the context of managing dilated cardiomyopathy?
```

**answer of memCube enhanced**:

```
{'model': 'qwen2.5-32b-instruct', 'version': 'v2', 'question_id': 146, 'prompt': 'As an experienced medical expert, provide comprehensive analysis using evidence-based medicine principles.\n\n**CLINICAL CASE:**\nAn adult patient with known idiopathic dilated cardiomyopathy presents with palpitations and dizziness. How does the presence of arrhythmias influence your diagnostic and therapeutic approach, especially in the context of managing dilated cardiomyopathy?\n\n**KEY EVIDENCE:**\n• Question: A middle-aged patient diagnosed with idiopathic dilated cardiomyopathy presents with palpitations and dizziness. Considering the risk of proarrhythmia, what diagnostic strategies and management plans should be considered?\n\nReasoning Guidance: Evaluate the role of idiopathic dilated cardiomyopathy in altering cardiac electrophysiology, leading to arrhythmic complications. Discuss the impact of heart failure medications on arrhythmia risk and selection of antiarrhythmic drugs fostering minimal proarrhythmic potential.\n\nKnowledge Facts: Idiopathic dilated cardiomyopathy can lead to heart chamber enlargement affecting electrical conduction.; Proarrhythmia refers to the increased risk of arrhythmias caused by medications or cardiac conditions.; Monitoring with ECG and considering beta-blocker or anticoagulant therapy are key in management.\n\nAnswer: Given the history of idiopathic dilated cardiomyopathy, the patient should be monitored closely with ECG for arrhythmic patterns. Opt for rhythm-stabilizing medications like beta-blockers while avoiding drugs with high proarrhythmic potential.\n• Question: An adult presents with palpitations and a recent diagnosis of idiopathic dilated cardiomyopathy. How should the presence of frequent atrial premature beats influence the clinical management of this patient?\n\nReasoning Guidance: Evaluate how atrial arrhythmias can exacerbate heart failure symptoms and potential management strategies to mitigate this risk.\n\nKnowledge Facts: Idiopathic dilated cardiomyopathy can lead to heart failure symptoms.; Frequent atrial premature beats can worsen cardiac function.; Managing arrhythmias may improve heart failure control.\n\nAnswer: Focus on optimizing heart failure management and consider treatment options for arrhythmias, such as beta-blockers or antiarrhythmic drugs.\n• Question: A young adult has been diagnosed with idiopathic dilated cardiomyopathy and is experiencing palpitations. Analyze how idiopathic dilated cardiomyopathy can cause palpitations and determine an appropriate treatment strategy.\n\nReasoning Guidance: Palpitations in dilated cardiomyopathy could indicate arrhythmias. Evaluate cardiac function and rhythm, using diagnostics to determine arrhythmia presence and guide treatment such as antiarrhythmics or device therapy.\n\nKnowledge Facts: Idiopathic dilated cardiomyopathy can lead to arrhythmias causing palpitations.; Palpitations may reflect arrhythmic risks in cardiomyopathy due to ventricular dysfunction.; Evaluating arrhythmia type and severity is essential in managing palpitations and potential heart failure exacerbations.\n\nAnswer: Investigate arrhythmia presence using ECG, consider beta-blockers or anti-arrhythmic medication, and evaluate need for device therapy like ICD.\n• Question: A young adult with idiopathic dilated cardiomyopathy presents with arrhythmias. How might disruptions in cardiac action potentials contribute to this presentation, and what treatment options should be considered?\n\nReasoning Guidance: Understand the mechanics of cardiac action potentials and how disruptions can lead to arrhythmias in dilated cardiomyopathy. Analyze therapeutic strategies targeting electrophysiological abnormalities.\n\nKnowledge Facts: Action potentials are crucial for coordinated cardiac contraction.; Idiopathic dilated cardiomyopathy can alter cardiac electrical activity.; Arrhythmias in cardiomyopathy may result from ion channel dysfunction or structural changes.\n\nAnswer: Altered cardiac action potentials due to cardiomyopathy can cause electrical instability, resulting in arrhythmias. Management includes antiarrhythmic drugs, device therapy, and addressing underlying structural heart issues.\n\nPlease provide evidence-based medical analysis and management recommendations.', 'response': '### Clinical Case Analysis: Idiopathic Dilated Cardiomyopathy with Palpitations and Dizziness\n\n#### Background\nIdiopathic dilated cardiomyopathy (IDC) is characterized by ventricular dilation and impaired systolic function, often leading to heart failure. The presence of arrhythmias in IDC is common and can exacerbate symptoms such as palpitations and dizziness, potentially leading to more severe complications like syncope or sudden cardiac death.\n\n#### Diagnostic Approach\n1. **Electrocardiogram (ECG) Monitoring:**\n   - **Initial ECG:** To identify any immediate arrhythmias, such as atrial fibrillation, ventricular tachycardia, or frequent premature beats.\n   - **Holter Monitoring:** For 24-48 hours to capture intermittent arrhythmias.\n   - **Event Monitor:** For patients with infrequent symptoms, to record arrhythmias as they occur.\n   - **Implantable Loop Recorder:** For patients with recurrent symptoms and negative initial monitoring.\n\n2. **Echocardiography:**\n   - To assess ventricular function, chamber dimensions, and wall motion abnormalities.\n   - To evaluate for any thrombus formation, which could be a source of embolic events.\n\n3. **Blood Tests:**\n   - Cardiac biomarkers (e.g., BNP, NT-proBNP) to assess heart failure severity.\n   - Thyroid function tests, as hyperthyroidism can cause palpitations.\n   - Electrolyte levels, particularly potassium and magnesium, which can affect cardiac rhythm.\n\n#### Therapeutic Approach\n1. **Optimization of Heart Failure Therapy:**\n   - **Beta-Blockers:** Proven to reduce mortality and hospitalization in IDC. They also stabilize the heart rhythm, reducing the risk of arrhythmias.\n   - **ACE Inhibitors/ARBs:** To reduce afterload and improve ventricular function.\n   - **Diuretics:** To manage fluid overload and alleviate symptoms of heart failure.\n   - **SGLT2 Inhibitors:** Emerging evidence supports their use in reducing cardiovascular events in heart failure patients.\n\n2. **Antiarrhythmic Therapy:**\n   - **Class I Antiarrhythmics (e.g., flecainide, propafenone):** Used cautiously due to potential proarrhythmic effects.\n   - **Class III Antiarrhythmics (e.g., amiodarone, sotalol):** Amiodarone is effective but has significant side effects; sotalol is a beta-blocker with antiarrhythmic properties.\n   - **Calcium Channel Blockers (e.g., verapamil, diltiazem):** Useful for certain arrhythmias like atrial fibrillation, but use with caution due to negative inotropic effects.\n\n3. **Device Therapy:**\n   - **Implantable Cardioverter Defibrillator (ICD):** Indicated in patients with IDC and reduced ejection fraction (EF <35%) to prevent sudden cardiac death.\n   - **Pacemakers:** Considered in patients with bradyarrhythmias or those requiring resynchronization therapy (CRT).\n\n4. **Lifestyle Modifications:**\n   - Smoking cessation, alcohol moderation, and a low-sodium diet.\n   - Regular, moderate-intensity exercise as tolerated.\n   - Stress management techniques to reduce arrhythmia triggers.\n\n#### Proarrhythmic Risk and Management\n- **Proarrhythmic Potential:** Antiarrhythmic drugs can paradoxically increase the risk of arrhythmias, particularly in patients with structural heart disease. Careful selection and monitoring are essential.\n- **Risk Stratification:** Use risk stratification tools like the CHA2DS2-VASc score for thromboembolic risk and the European Society of Cardiology guidelines for ICD implantation.\n\n#### Conclusion\nIn managing a patient with IDC and arrhythmias, a comprehensive approach is necessary, combining optimal heart failure therapy with targeted antiarrhythmic treatment and device therapy as indicated. Close monitoring and patient education are crucial to prevent complications and improve quality of life.', 'length': 3725, 'api_time': 18.48910903930664, 'timestamp': 1753352210.820965, 'error': False}
```

**Baseline**:

```
{'model': 'qwen2.5-32b-instruct', 'version': 'baseline', 'question_id': 146, 'prompt': 'Analyze this clinical case as a senior medical expert:\n\nAn adult patient with known idiopathic dilated cardiomyopathy presents with palpitations and dizziness. How does the presence of arrhythmias influence your diagnostic and therapeutic approach, especially in the context of managing dilated cardiomyopathy?\n\nPlease provide detailed medical analysis and recommendations.', 'response': "In the context of an adult patient with known idiopathic dilated cardiomyopathy (DCM) presenting with palpitations and dizziness, the presence of arrhythmias significantly influences the diagnostic and therapeutic approach. Here is a detailed analysis and recommendations based on current medical practices:\n\n### Clinical Context and Initial Assessment\n- **Idiopathic Dilated Cardiomyopathy**: DCM is characterized by ventricular dilation and impaired systolic function, often leading to heart failure and arrhythmias.\n- **Symptoms**: Palpitations and dizziness are common symptoms that can be indicative of arrhythmias, which are frequent complications in DCM.\n- **Risk Factors**: The patient's history of DCM places them at higher risk for arrhythmias, particularly atrial fibrillation (AF), ventricular tachycardia (VT), and bradyarrhythmias.\n\n### Diagnostic Approach\n1. **History and Physical Examination**: Detailed history to understand the onset, duration, and triggers of palpitations and dizziness. Physical examination should focus on signs of heart failure, such as jugular venous distension, rales, and peripheral edema.\n2. **Electrocardiogram (ECG)**: Essential for detecting arrhythmias. Can identify AF, VT, or other conduction abnormalities.\n3. **Holter Monitoring**: Useful for patients with intermittent symptoms to capture arrhythmias that may not be evident on a standard ECG.\n4. **Echocardiography**: To assess ventricular function, size, and potential thrombus formation, especially if AF is suspected.\n5. **Cardiac MRI**: Provides detailed images of the heart structure and function, which can be crucial in assessing the extent of DCM and ruling out other causes of cardiomyopathy.\n6. **Blood Tests**: Including electrolytes, thyroid function tests, and markers of heart failure (BNP/NT-proBNP).\n\n### Therapeutic Approach\n1. **Management of Arrhythmias**:\n   - **Atrial Fibrillation**: If diagnosed, rate control or rhythm control strategies should be considered. Rate control can be achieved with beta-blockers or non-dihydropyridine calcium channel blockers. Rhythm control might involve antiarrhythmic drugs or catheter ablation.\n   - **Ventricular Tachycardia**: If VT is suspected or confirmed, antiarrhythmic drugs (e.g., amiodarone) or implantable cardioverter-defibrillator (ICD) may be necessary. Catheter ablation can also be considered.\n   - **Bradyarrhythmias**: If bradyarrhythmias are present, a pacemaker may be indicated.\n\n2. **Management of Dilated Cardiomyopathy**:\n   - **Heart Failure Medications**: Continue or initiate medications such as ACE inhibitors/ARBs, beta-blockers, aldosterone antagonists, and diuretics as needed.\n   - **Lifestyle Modifications**: Encourage a heart-healthy diet, regular physical activity, and smoking cessation.\n   - **Monitoring**: Regular follow-up with echocardiography and clinical assessment to monitor disease progression and response to therapy.\n\n3. **Anticoagulation**:\n   - If AF is present, anticoagulation therapy is necessary to prevent thromboembolic events. The choice of anticoagulant (e.g., warfarin, direct oral anticoagulants) should be based on the patient's risk factors and comorbidities.\n\n### Prognosis and Long-Term Management\n- **Prognosis**: The presence of arrhythmias in DCM can worsen prognosis. Regular monitoring and timely intervention are crucial.\n- **Long-Term Management**: Focus on preventing arrhythmias and heart failure exacerbations. Consider multidisciplinary care involving cardiologists, electrophysiologists, and heart failure specialists.\n\n### Conclusion\nThe presence of arrhythmias in a patient with idiopathic dilated cardiomyopathy requires a comprehensive approach, including thorough diagnostic evaluation and tailored therapeutic interventions. The goal is to manage both the underlying cardiomyopathy and the arrhythmias to improve the patient's quality of life and prognosis.", 'length': 3902, 'api_time': 13.865102052688599, 'timestamp': 1753352205.427208, 'error': False}
```
**Case Analysis**:
The base 32B model is already able to provide a fairly comprehensive and accurate response, covering diagnostic procedures, treatment plans, and prognostic management.
However, the MemCube-enhanced model excels further in terms of **structure, logic, and depth of detail**. By retrieving and integrating QA memories in MemCube related to concepts such as “DCM,” “arrhythmia,” and “proarrhythmic risk,” Answer A demonstrates the following characteristics:

* **Clearer logical hierarchy**: Answer A categorizes diagnostic and treatment methods, such as explaining antiarrhythmic drugs by class (Class I, Class III, etc.) and explicitly pointing out precautions when using them in the context of DCM (e.g., proarrhythmic risk).

* **Key knowledge points highlighted**: Answer A clearly identifies “optimized heart failure therapy” as the foundation for managing arrhythmias and lists drugs such as β-blockers, noting their dual role in stabilizing heart rhythm. These originate from QA memories in MemCube that emphasize critical points in clinical practice.

* **Stronger risk awareness**: Answer A includes a dedicated section on “Proarrhythmic Risk and Management,” showing that the model is not only stating knowledge but also imitating an expert’s risk assessment mindset.

This case demonstrates that even for a powerful 32B model, MemCube can still serve as a “knowledge coach,” helping the model organize and express its vast internal knowledge in a more structured and clinically logical manner, thereby providing more instructive and professional guidance.

---

## 🚀 Practical Experience: Try the Cardiovascular Medicine MemCube Demo
The cardiovascular medicine knowledge Q\&A system presented in this chapter has already been built, and a complete MemCube demo version is provided, containing **211,315 memory entries** and **522,368 semantic associations**.
### 📦 Features of the Demo System
* **🫀 Domain Expertise**: Cardiovascular medicine knowledge system
* **📊 Data Scale**: 211,315 high-quality memory entries
* **🔗 Association Network**: 522,368 semantic connections between concepts

* **💾 Data Size**: About 5.0GB of structured medical knowledge

* **🤖 AI Support**: Supports multiple LLM models (GPT-4o, Claude, local models, etc.)

* **🌐 Deployment Ready**: Production-grade architecture based on Neo4j + MemOS

### 🔍 Try It Now

Want to experience firsthand the complete build process and final effect introduced in this chapter? You can visit our demo project:
**👉 [Cardio MemCube Demo - Hugging Face](https://huggingface.co/datasets/MemCube/cardio-memcube-demo)**
This demo project provides:
* ✅ **Complete Installation Guide**: One-click deployment of the Cardiovascular MemCube system

* ✅ **Executable Code Examples**: Directly experience the knowledge Q\&A functionality

* ✅ **Detailed Technical Documentation**: Learn about the construction methodology and best practices
* ✅ **Multi-LLM Support**: Flexibly configure different AI model backends
### ⚠️ Important Notes

* **🏥 Medical Disclaimer**: This demo is for technical demonstration and educational purposes only and should not be used as a basis for medical diagnosis or treatment.
