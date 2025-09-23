---
title: Memory Recall and Instruction Completion
desc: "In MemOS, memory is not just about archiving information, but also about being dynamically retrieved when needed and transformed into executable input. This process is achieved through two closely connected steps: Memory Recall and Instruction Completion."
---

## 1. Capability Overview

### 1.1 Memory Recall

Memory recall is responsible for quickly retrieving the most relevant memory fragments when the user initiates a new request.

*   **Role**: Ensures that the model does not start “from scratch” when generating responses, but instead integrates the user's history, preferences, and context.
    
*   **Returned Results**: The recalled content is presented as plaintext facts.
    
    *   Traceable: Each memory is accompanied by its source, timestamp, and confidence level.
        
    *   Highly controllable: Developers have full control over which memories enter downstream logic.


### 1.2 Instruction Completion (Coming Soon)

It is important to note that “facts” are not the same as “instructions.” If developers only obtain plaintext memory, they must write additional rules to translate this information into prompts that large models can directly execute.

:::note
**The role of instruction completion** is to automatically generate instructions of different granularity based on recall results.
:::

*   **In most systems, developers can only get “memory facts” and then manually piece together prompts. This leads to several challenges:**
    
    *   Task awareness: The same memory may require different phrasing under different tasks;
        
    *   Personalization: User style and habits need to be instantly supplemented;
        
    *   Dynamic optimization: Different models require different optimal prompt formulations;
        
    *   Efficient compression: Redundancy must be removed to reduce token consumption.

      
<br>

*   **MemOS instruction completion helps developers cover this “last mile”:**
    
    *   Saves the cost of rules assembly and tuning;
        
    *   Ensures that recalled memories are effectively utilized;
        
    *   Provides three modes: matches / instruction / full_instruction, to meet different levels of control needs.
        
        *   Memory facts (matches): Recall relevant memories for the current query.
            
        *   Semi-finished instruction (instruction): Combine recalled memories with the user’s current question to form a basic prompt, upon which developers can add business logic.
            
        *   Full instruction (full_instruction): Based on the semi-finished version, integrate context, preferences, compliance constraints, etc., to generate a terminal prompt directly executable by the model.
            

<br>

:::note
Instruction completion works through both **offline chain** and **real-time chain**.
:::

| **Chain** | **Description** |
| --- | --- |
| **Offline Chain** (Accumulation & Preparation) | Extract user preferences to form a profile.<br><br>Build a few-shot sample library.<br><br>Solidify long-term rules such as brand, compliance, and style. |
| **Real-time Chain** (Dynamic Decision) | Select which memories and templates to activate based on task intent.<br><br>Resolve conflicts (e.g., “likes poetic openings” vs. “requires conciseness”).<br><br>Perform compression and degradation based on token budget and model characteristics. |


## 2. Example (Pending Instruction Completion Launch) — Personalized Tutoring in AI Education

### 2.1 Historical Dialogue Input (Raw Material)

```json
2025-06-10
  Student: Hello teacher, my name is Xiao Ming, I am in 9th grade  
  Teacher: Hello Xiao Ming, nice to meet you
  ……

2025-08-01
  Student: Teacher, I really can’t solve this problem, can you explain more clearly?  
  Teacher: Sure, I will explain step by step. 
  ……

2025-09-03
  ……
  Student: You just explained too long, I couldn’t keep up. Can you make it simpler?  
  Teacher: Okay, I’ll tell you in a simpler way.
  ……

2025-10-09
  Student: I still can’t distinguish between linear and quadratic functions…  
  Teacher: The graph of a linear function is a straight line, while a quadratic function is a parabola. You need to remember this difference.
  ……
```

### 2.2 MemOS Instruction Preference Modeling (Offline Chain)

*   **Preference Extraction**
    
    *   Likes step-by-step explanations (from “can you explain step by step”).
        
    *   Prefers concise answers (from “you just explained too long”).
        
    *   Easily confuses similar concepts (from “I still can’t distinguish between linear and quadratic functions”).
        
*   **Few-shot Selection**: Pick dialogues with step-by-step, concise explanations, and concept clarification.
    
*   **Strategy Summary**: Summarized as “step-by-step + concise + clarify common confusions”.
    

```yaml
user_teaching_template_u123:
  audience: "9th grade student"
  task: "Solve math problems"
  structure:
    - "Step-by-step explanation (3–4 steps)"
    - "Correct confusion between linear and quadratic functions when necessary"
  constraints:
    - "Keep explanations concise, not too long"
    - "Highlight key points, avoid lengthy formula derivations"

fewshot_examples_u123:
  - id: "fs-step-01"
    user: "Teacher, I really can’t solve this problem, can you explain more clearly?"
    assistant: "Sure, I will explain step by step…"
    tag: "Step-by-step explanation"

  - id: "fs-brief-02"
    user: "You just explained too long, I couldn’t keep up. Can you make it simpler?"
    assistant: "Okay, I’ll tell you in a simpler way…"
    tag: "Concise expression"

  - id: "fs-contrast-03"
    user: "I still can’t distinguish between linear and quadratic functions…"
    assistant: "The graph of a linear function is a straight line, while a quadratic function is a parabola. You need to remember this difference…"
    tag: "Concept clarification"
```

### 2.3 Real-time Chain (Instruction Completion)

:::note{icon="ri:message-2-line"}
User query: [Teacher, can you teach me how to solve this problem? 2x² - 3x - 5 = 0]
:::

*   **Recalled matches:** Only returns facts, unprocessed. Developers need to piece together the prompt and decide how to guide the student.
    

```yaml
matches:
  - content: "9th grade student"
    score: 0.95
    source: "Dialogue record#2025-06-10"
    
  - content: "Prefers step-by-step explanations"
    score: 0.94
    source: "Dialogue record#2025-08-01"
    
  - content: "Likes concise explanations"
    score: 0.92
    source: "Dialogue record#2025-09-03"
    
  - content: "Confuses linear and quadratic functions"
    score: 0.90
    source: "Dialogue record#2025-10-09"

user_query: "Teacher, can you teach me how to solve this problem? 2x² - 3x - 5 = 0"
```

<br>

*   **Semi-finished instruction:** Translate facts into structured requirements: task / audience / steps / constraints
    

```yaml
instruction: |
  Task: Help student solve a quadratic equation problem  
  Audience: 9th grade student  
  Requirements:  
  - Explain in 3–4 steps  
  - Correct common confusion between linear/quadratic functions during explanation  
  - Keep it concise, avoid lengthy derivations  
  Note: If the question is incomplete, please ask for clarification first

user_query: "Teacher, can you teach me how to solve this problem? 2x² - 3x - 5 = 0"
```

<br>

*   **Full instruction:** Further refined from the semi-finished version
    
    *   Convert “often confuses” into explicit teaching action (must emphasize difference between quadratic and linear functions during explanation).
        
    *   Translate “prefers step-by-step explanations” into a clear problem-solving method (use step-by-step explanation).
        
    *   Rewrite “9th grade student” into the teaching role relationship (you are the math teacher of a 9th grade student).
        
    *   Select few-shot examples from historical dialogue and include them in the final instruction to help the model learn explanation and clarification patterns.
        

> Semi-finished instructions are more structured for developer customization; full instructions are closer to natural language and directly executable by models.

```yaml
final_prompt_to_model:
  - role: system
    content: |
      You are the math teacher of a 9th grade student.  
      The student often confuses linear and quadratic functions, and prefers concise, step-by-step explanations.  
      Please follow the style of the following historical examples:  

      [Example 1]  
      Student: Teacher, I really can’t solve this problem, can you explain more clearly?  
      Teacher: Sure, I will explain step by step.  

      [Example 2]  
      Student: You just explained too long, I couldn’t keep up. Can you make it simpler?  
      Teacher: Okay, I’ll tell you in a simpler way.  

      [Example 3]  
      Student: I still can’t distinguish between linear and quadratic functions…  
      Teacher: The graph of a linear function is a straight line, while a quadratic function is a parabola. You need to remember this difference.  

      Now please answer the student’s question: “Solve 2x² - 3x - 5 = 0.”  
      Requirements:  
      - Solve the problem step-by-step (3–4 steps);  
      - Point out the difference between linear and quadratic functions during the explanation;  
      - Keep the answer concise and clear, avoid lengthy derivations;  
      - If the problem statement is incomplete, please ask for clarification first.
  - role: user
    content: "Teacher, can you teach me how to solve this problem? 2x² - 3x - 5 = 0"
```

> Case Summary: In the “9th grade student solving quadratic equation” scenario, instruction completion provides the following benefits over returning raw memory only:

*   **From facts to executable**
    
    *   Raw memory only has “student often confuses linear and quadratic functions,” developers must convert this into a teaching action.
    
    *   Instruction completion directly generates “must emphasize the key difference during explanation,” avoiding extra developer rules.
    
*   **Context integration**
    
    *   Raw memory is fragmented; developers must decide how to place them into prompts.
    
    *   Instruction completion automatically merges memories with the user query into a coherent task description for direct model use.
    
*   **Optimization and pruning**
    
    *   If developers directly concatenate memories, the result is often redundant or conflicting.
 
    *   Instruction completion compresses into concise step-by-step requirements, reducing token consumption and improving focus.
    
*   **Robustness assurance**

    *   If developers only get memories, they must consider “what if the question is incomplete.”
  
    *   Instruction completion includes clarification strategies, making outputs more robust without reinventing the wheel.


## 3. Advanced: Deep Customization

In MemOS, recall and completion are not achieved through a single path, but through combinations of multiple strategies and components. Different scenarios may require different configurations. This section lists the main steps and customizable points for you to flexibly choose according to business needs.

| **Layer** | **Customizable Points** | **Example** |
| --- | --- | --- |
| Memory Recall | Adjust recall strategy | Raise similarity threshold to only return memories with confidence ≥0.9 |
|  | Set filters | Only retrieve the last 30 days of conversations; only preference memories, not factual ones |
| Semi-finished Instruction<br>instruction | Extend structured fields | Add extra fields such as “Output format: Markdown”, “Must include: Safety reminder” |
|  | Custom concatenation template | Replace default concatenation logic to generate semi-finished instructions with brand tone |
| Full Instruction<br>full_instruction | Few-shot strategy | Replace default historical messages with your own example library, fix to 2 examples each time |
|  | Role and tone control | Force setting to “Financial Advisor”, output style as “formal professional” |
|  | Token cost optimization | Define compression rules: keep core preferences, prune redundant background information |
|  | Multi-model adaptation | For GPT output with LaTeX, for LLaMA output plain text, auto-switch |
| Output Governance & Audit | Compliance fallback | Automatically prepend “Answer must comply with regulations” before completion |
|  | Logging & traceability | Record used memories and few-shot selection each call |
|  | A/B testing | Run two concatenation templates simultaneously, compare user satisfaction differences |


## 4. Next Steps

Learn more about MemOS core capabilities:

*   [Memory Lifecycle Management](/overview/quick_start/mem_lifecycle)
    

## 5. Contact Us

<img src="https://cdn.memtensor.com.cn/img/1758251354703_v1nwkz_compressed.png" alt="image" style="width:70%;">
