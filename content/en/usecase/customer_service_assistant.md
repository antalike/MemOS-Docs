---
title: "Help a Support Agent Remember Users: Cross-Session Customer Service with MemOS"
desc: Separate user memories, Agent Skills, and a policy knowledge base so support agents can continue customer cases across sessions and reuse general workflows.
---

A customer reports a faulty headset in web chat, then follows up by email the next day—only to be asked for the order number and problem description again. For the customer, service continuity has broken. The system often has a straightforward gap: the new conversation did not receive previously confirmed information.

Support agents need two kinds of memory. Customer-specific information includes orders, pending work, and notification preferences. Agent-level information includes reusable tool workflows for similar problems. Formal after-sales policies remain in a centrally maintained knowledge base.

This article combines all three through Python examples.

## Key ideas

- Write user facts and preferences with both `user_id` and `agent_id`; use `related_id` to select the current user's memories during retrieval.
- Submit each complete task trace to the support agent's independent memory, requesting Skill generation only. MemOS decides whether to create or update a Skill.
- Store policies in a knowledge base and include them in the same search using `knowledgebase_ids`.
- Call `/search/memory` once before answering to retrieve user facts, preferences, Agent Skills, and policies together.
- The agent maintains current conversation history; MemOS handles cross-session memory.

## What you will build

The example has three stages:

```text
DAY 1 · Web chat
customer_001 requests a headset exchange. The agent queries the order,
checks policy, creates a ticket, and records delivery timing, address,
and SMS notification requirements.

DAY 4 · Email ticket
customer_001 follows up using a new conversation_id.

DAY 7 · Web chat
customer_002 reports a similar buzzing issue. The agent tries to reuse
a Skill derived from the earlier task.
```

DAY 4 checks continuity of user facts and preferences across sessions. DAY 7 switches customers to check isolation while testing reuse of general Agent Skills.

## Separate the three information scopes

1. **User memory:** orders, faults, ticket status, addresses, and notification preferences belonging to the current `user_id`.
2. **Agent Skills:** general workflows derived from complete task traces and associated with a stable `agent_id`.
3. **Policy knowledge base:** formal returns, warranty, shipping, and invoice rules maintained by the business.

Policies determine what the rules require, user memories show the customer's progress, and Agent Skills supply the usual steps for completing that type of task.

## End-to-end flow

```text
Customer request
  |
  +-- Agent reads current conversation history from the application
  |
  +-- One combined search: agent_id + knowledgebase_ids
  |   filter selects the current user's memories (related_id)
  |   and Agent Skills (SkillMemory)
  |   -> user facts, preferences, Skills, policies
  |
  +-- Assemble context and execute order, ticket, and notification tools
  |
  +-- Model generates a final response based on tool results
  |
  +-- Write 1: user_id + agent_id -> facts and preferences
  |
  +-- Write 2: agent_id -> request Skill generation or updates
```

Both writes submit the same task record but select different types through `allow_memory_view`. The user write supplies both IDs, assigning memory to the user and associating it with the support agent's memory space. The Skill write supplies only `agent_id`. The user view does not generate Skills; the Agent view does not duplicate user facts and preferences.

Retrieval uses one `/search/memory` call. `related_id` limits facts and preferences to the current user, `SkillMemory` allows Agent Skills to return across users, and `knowledgebase_ids` includes policy material in the same search.

## Prerequisites

The [complete Demo](#complete-demo) below can be copied and run locally.

You need a MemOS API key and an OpenAI or OpenAI-compatible model endpoint. Create a Python environment and install dependencies:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install openai requests
```

Configure these values:

```python
MEMOS_API_KEY = "YOUR_MEMOS_API_KEY"
OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
MEMOS_BASE_URL = "YOUR_MEMOS_BASE_URL"
OPENAI_MODEL = "YOUR_MODEL_NAME"
OPENAI_BASE_URL = "YOUR_OPENAI_BASE_URL"
AGENT_ID = "YOUR_AGENT_ID"
```

Derive `user_id` from authentication or your CRM. Keep `agent_id` stable for the same support agent across customers and conversations.

Enable **Create Independent Memory for Agent** in the project console. It is off by default. Without it, `agent_id` provides tagging and filtering, rather than an independent subject for Agent Skill writes or retrieval. See [multi-agent isolation](/memos_cloud/introduction/isolation_filters).

## Prepare the policy knowledge base

During initialization, create a policy knowledge base, upload the policy document, and wait for processing:

```python
def create_policy_knowledge_base():
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Token {MEMOS_API_KEY}",
    }

    # 1. Create knowledge base: POST /create/knowledgebase
    res = requests.post(
        f"{MEMOS_BASE_URL}/create/knowledgebase",
        headers=headers,
        json={
            "knowledgebase_name": "Consumer After-Sales Policy Knowledge Base",
            "knowledgebase_description": "Consumer returns, exchanges, warranty, shipping, and invoice policies",
        },
    )
    body = res.json()
    if body.get("code") != 0:
        sys.exit(f"Failed to create knowledge base: {body.get('message')}")
    policy_kb_id = body["data"]["id"]

    # 2. Upload policy: POST /add/knowledgebase-file
    # Encode file content as base64 and pass a data URL
    encoded = base64.b64encode(POLICY_DOC_MD.encode("utf-8")).decode("utf-8")
    res = requests.post(
        f"{MEMOS_BASE_URL}/add/knowledgebase-file",
        headers=headers,
        json={
            "knowledgebase_id": policy_kb_id,
            "file": [{
                "type": "document",
                "name": "consumer-after-sale-policy.md",
                "content": f"data:text/markdown;base64,{encoded}",
            }],
        },
    )
    if res.json().get("code") != 0:
        sys.exit(f"Failed to upload policy: {res.json().get('message')}")

    # 3. Poll parsing status: POST /get/knowledgebase-file
    print("Policy document uploaded; waiting for parsing...")
    for _ in range(40):
        time.sleep(3)
        res = requests.post(
            f"{MEMOS_BASE_URL}/get/knowledgebase-file",
            headers=headers,
            json={"knowledgebase_id": policy_kb_id, "page": 1, "page_size": 20},
        )
        files = res.json().get("data", {}).get("file_detail_list", [])
        statuses = {str(item.get("status", "")).lower() for item in files}
        if files and statuses <= {"completed", "available", "failed"}:
            if "failed" in statuses:
                sys.exit("Policy parsing failed")
            break
    print(f"Policy knowledge base ready: {policy_kb_id}")
    return policy_kb_id
```

Use the ID returned by the creation API to initialize the assistant:

```python
policy_kb_id = create_policy_knowledge_base()
assistant = CustomerServiceAssistant(policy_kb_id)
```

## Write back the complete task trace

Each message uses `role_id` to identify the actual speaker. User messages use `user_id`; support responses and tool calls use `agent_id`:

```python
# Complete message list written to MemOS for the DAY 1 exchange request
memory_messages = [
    # 1. User message: role_id identifies the current user
    {
        "role": "user",
        "role_id": user_id,  # For example, customer_001
        "content": "The left ear of my noise-canceling headphones buzzes; I want an exchange",
    },
    # 2. Tool call: the support Agent queries the order; role_id is agent_id
    {
        "role": "assistant",
        "role_id": AGENT_ID,
        "content": "",
        "tool_calls": [{
            "id": "call_1",
            "type": "function",
            "function": {
                "name": "query_order",
                "arguments": '{"order_id": "20260820-88"}',
            },
        }],
    },
    # 3. Tool result: tool_call_id links to the call above; no role_id is needed
    {
        "role": "tool",
        "tool_call_id": "call_1",
        "content": '{"order_id": "20260820-88", "status": "delivered"}',
    },
    # 4. Final response: also attributed to the support Agent
    {
        "role": "assistant",
        "role_id": AGENT_ID,
        "content": "Exchange ticket EX20260821-03 has been created, with free shipping both ways...",
    },
]
```

The agent maintains current conversation history in the application. For MemOS writes, the user request, tool calls, tool results, and final response form a complete task record:

```text
user
→ assistant.tool_calls
→ tool
→ assistant
```

MemOS derives Skills and user facts/preferences from the same trace.

### Separate the write types

Users and agents use different write views, while retrieval includes all three types:

```python
USER_WRITE_VIEWS = ["detail_factual", "preference"]
AGENT_SKILL_WRITE_VIEWS = ["skill"]
CONTEXT_VIEWS = ["detail_factual", "preference", "skill"]
```

The same trace can enter both memory spaces without generating the same memory types twice.

### Write user facts and preferences

The first `/add/message` request supplies both `user_id` and `agent_id`:

```python
def add_user_memories(self, messages, user_id, conversation_id, channel):
    """First write: generate only user facts and preferences."""
    user_data = {
        "user_id": user_id,
        "agent_id": AGENT_ID,
        "conversation_id": conversation_id,
        "info": {"channel": channel, "scene": "consumer_support"},
        "allow_memory_view": USER_WRITE_VIEWS,
        "messages": messages,
    }
    # POST /add/message: writes run asynchronously; after receiving task_id,
    # poll /get/status until completed (see the full Demo below)
    res = requests.post(
        f"{MEMOS_BASE_URL}/add/message",
        headers=self.headers,
        json=user_data,
    )
    if res.json().get("code") != 0:
        print(f"  [MemOS] Failed to write user facts/preferences: {res.json().get('message')}")
```

The memory belongs to the current user and is associated with the support agent's memory space, so the agent-scoped combined search can select it through `related_id`. MemOS decides whether the conversation produces facts or preferences. A turn without a stable preference can produce only facts.

### Write Agent Skills

The second `/add/message` request supplies only `agent_id` and permits only Skill generation:

```python
def add_agent_skill(self, messages, conversation_id, channel):
    """Second write: request only Agent Skill generation or updates."""
    skill_data = {
        "agent_id": AGENT_ID,
        "conversation_id": conversation_id,
        "info": {"channel": channel, "scene": "consumer_support"},
        "allow_memory_view": AGENT_SKILL_WRITE_VIEWS,
        "custom_extract_prompt": {"skill": SKILL_EXTRACT_PROMPT},
        "messages": messages,
    }
    # Also POST /add/message, without user_id and with only skill in allow_memory_view
    res = requests.post(
        f"{MEMOS_BASE_URL}/add/message",
        headers=self.headers,
        json=skill_data,
    )
    if res.json().get("code") != 0:
        print(f"  [MemOS] Failed to write Agent Skill: {res.json().get('message')}")
```

Skills belong to the Agent view and are reusable across users. Submit this write after every response. The caller declares the allowed memory type; MemOS compares the task trace with existing Skills and decides whether to generate, update, or skip.

## Keep Skills general

MemOS performs Skill extraction. Use `custom_extract_prompt.skill` to add customer-service generalization requirements:

- Identify a Skill by its business goal, trigger conditions, core tool chain, and success criteria.
- Prefer merging the same workflow into an existing Skill; skip duplicates when no new general information is added.
- Remove names, addresses, user IDs, order and ticket numbers, and specific dates.
- Replace instance values with parameters such as `order_id`, `ticket_id`, and `shipping_address`.
- Keep personal preferences and one customer's deadlines out of general rules.
- Retain only executed steps evidenced by tool results.

MemOS compares and updates existing Skills; callers do not need to manage Skill IDs or implement merging.

## Run one combined retrieval

Before generating a response, the assistant makes one `/search/memory` call for user facts, preferences, Agent Skills, and policy knowledge:

```python
def search_memory(self, query, user_id):
    """One combined retrieval: user facts/preferences + Agent Skills + policy knowledge."""
    context_data = {
        "query": query,
        "agent_id": AGENT_ID,
        "knowledgebase_ids": self.knowledgebase_ids,
        "include_memory_view": CONTEXT_VIEWS,
        "memory_limit_number": 9,
        "preference_limit_number": 6,
        "filter": {
            "user": {
                "or": [
                    {"related_id": [user_id]},
                    {"memory_type": "SkillMemory"},
                ]
            }
        },
    }
    # POST /search/memory: retrieve user facts, preferences, Agent Skills, and policies in one call
    res = requests.post(
        f"{MEMOS_BASE_URL}/search/memory",
        headers=self.headers,
        json=context_data,
    )
    result = res.json().get("data") or {}
    return (
        result.get("memory_detail_list", []),   # User facts
        result.get("preference_detail_list", []),  # User preferences
        result.get("skill_detail_list", []),    # Agent Skill
    )
```

The two `filter` conditions are joined by OR: `related_id` selects the current user's memories, keeping personal facts and preferences isolated; `memory_type: "SkillMemory"` returns Agent Skills across users. `knowledgebase_ids` includes policy material without a separate search.

Together, policies explain the rules, user memories supply case progress, and Agent Skills provide reusable task steps.

## Verify memory behavior

Check all three stages:

1. After DAY 1, confirm that facts and preferences enter the User Cube and the same trace is submitted to the Agent Cube for Skill evaluation.
2. On DAY 4, use a new `conversation_id` and confirm that `customer_001` can still retrieve the earlier order, fault, and notification requirements.
3. On DAY 7, use `customer_002` and confirm that the first customer's facts remain absent while general Skills belonging to the support agent can be retrieved.

Clear boundaries let the agent remember the current customer, follow common policies, and turn completed work into reusable capability.

## Complete Demo

Expand the block, use its copy button, and save the code as `app.py`. Fill in Demo configuration before running.

<details class="not-prose my-5 rounded-md border border-default bg-muted/30 px-4 py-3">
  <summary class="cursor-pointer select-none text-sm font-medium text-highlighted">
    Expand and copy the complete Python Demo
  </summary>
  <div class="mt-4">

```python
# -*- coding: utf-8 -*-
"""
MemOS customer service best practice: a cross-channel memory-enabled support assistant

Scenario: after-sales support. MemOS supplies memory infrastructure for the support agent
with three capabilities:

1. Request user fact/preference and Agent Skill writes separately each turn; MemOS decides what to retain
2. Store after-sales policies in a knowledge base and retrieve them alongside memory
3. One combined /search/memory call: related_id selects the current user's memories;
   SkillMemory returns Agent Skills across users

Enable only the three types needed here: factual, preference, and skill memory.
MemOS asynchronously derives skills from submitted task traces (user -> assistant.tool_calls -> tool ->
assistant), without requiring a skill upload in advance.

Run:
    pip install openai requests

    # Fill in the parameters under Demo configuration below
    python app.py
"""

import base64
import sys
import time
from datetime import datetime

import requests

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

# ---------------------------------------------------------------------------
# Demo configuration
# ---------------------------------------------------------------------------

MEMOS_API_KEY = "YOUR_MEMOS_API_KEY"
OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
MEMOS_BASE_URL = "https://memos.memtensor.cn/api/openmem/v1"
OPENAI_MODEL = "YOUR_MODEL_NAME"
OPENAI_BASE_URL = "YOUR_OPENAI_BASE_URL"
AGENT_ID = "YOUR_AGENT_ID"

# Users and the Agent write different memory types; retrieval uses one combined search
USER_WRITE_VIEWS = ["detail_factual", "preference"]
AGENT_SKILL_WRITE_VIEWS = ["skill"]
CONTEXT_VIEWS = ["detail_factual", "preference", "skill"]

SKILL_EXTRACT_PROMPT = """Extract Skills reusable across users from complete customer service task traces.

A Skill is identified by its business objective, trigger conditions, core tool chain, and success criteria.
Compare existing Skills before extraction:
- If an existing Skill covers the same objective, triggers, and core tool chain, merge new information into it;
  avoid creating a duplicate Skill.
- Skip generation when the trace adds no new general steps, decision branches, or verification evidence.
- Create a new Skill only when the business objective or core workflow materially differs.

Generalize the Skill content:
- Remove names, contact details, addresses, user/Agent/conversation IDs, order and ticket numbers, and specific dates.
- Replace instance values with parameters such as order_id, ticket_id, and shipping_address.
- Exclude personal preferences and avoid turning one user's deadlines or notification choices into general rules.
- Do not copy specific policy conclusions; describe the step as checking and validating the current policy.
- Retain steps evidenced by tool results; do not describe suggestions or unexecuted actions as verified experience.

Use stable, concise Skill names based on the issue type and resolution goal, excluding user or case details.
"""

# Relevance threshold: exclude lower-scoring memories from the prompt to reduce noise
RELATIVITY_THRESHOLD = 0.5

# ---------------------------------------------------------------------------
# Example policy uploaded to the policy knowledge base
# ---------------------------------------------------------------------------

POLICY_DOC_MD = """# Consumer After-Sales Policy (Example)

## Returns and exchanges
- Unopened, resalable products may be returned within 7 days starting the day after delivery.
- Products with functional faults may be exchanged within 15 days, with free shipping both ways.
- Customized products are excluded from no-fault returns and exchanges.

## Warranty
- The main product has a 12-month warranty; included accessories have a 6-month warranty.
- Non-user-caused damage is repaired free during warranty; user-caused damage is charged at cost.

## Shipping
- SF Express is used by default; an SMS with tracking details is sent when a replacement ships.
- The delivery address may be changed once before the replacement ships.

## Invoices
- Standard electronic invoices are available by self-service on the order page after completion.
"""


# ---------------------------------------------------------------------------
# Support assistant: combined retrieval -> prompt -> response -> two writes
# ---------------------------------------------------------------------------

class CustomerServiceAssistant:
    def __init__(self, policy_kb_id):
        self.openai_client = OpenAI(
            api_key=OPENAI_API_KEY,
            base_url=OPENAI_BASE_URL or None,
        )
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Token {MEMOS_API_KEY}",
        }
        self.knowledgebase_ids = [policy_kb_id]
        # The Agent maintains current conversation history without MemOS message reads
        self.conversation_histories = {}

    # ---- MemOS reads and writes ----

    def search_memory(self, query, user_id):
        """One combined retrieval: user facts/preferences + Agent Skills + policy knowledge."""
        context_data = {
            "query": query,
            "agent_id": AGENT_ID,
            "knowledgebase_ids": self.knowledgebase_ids,
            "include_memory_view": CONTEXT_VIEWS,
            "memory_limit_number": 9,
            "preference_limit_number": 6,
            "filter": {
                "user": {
                    "or": [
                        {"related_id": [user_id]},
                        {"memory_type": "SkillMemory"},
                    ]
                }
            },
        }
        context_res = requests.post(
            f"{MEMOS_BASE_URL}/search/memory",
            headers=self.headers,
            json=context_data,
        )
        context_body = context_res.json()
        if context_body.get("code") != 0:
            print(f"  [MemOS] Combined retrieval failed: {context_body.get('message')}")
            return [], [], []

        context_result = context_body.get("data") or {}
        memories = [
            m for m in context_result.get("memory_detail_list", [])
            if m.get("relativity", 0) >= RELATIVITY_THRESHOLD
        ]
        preferences = context_result.get("preference_detail_list", [])
        skills = context_result.get("skill_detail_list", [])
        return memories, preferences, skills

    def add_user_memories(self, messages, user_id, conversation_id, channel):
        """First write: generate only user facts and preferences."""
        user_data = {
            "user_id": user_id,
            "agent_id": AGENT_ID,
            "conversation_id": conversation_id,
            "info": {"channel": channel, "scene": "consumer_support"},
            "allow_memory_view": USER_WRITE_VIEWS,
            "messages": messages,
        }
        self._post_memory(user_data, "user facts and preferences", timeout_seconds=120)

    def add_agent_skill(self, messages, conversation_id, channel):
        """Second write: request only Agent Skill generation or updates."""
        skill_data = {
            "agent_id": AGENT_ID,
            "conversation_id": conversation_id,
            "info": {"channel": channel, "scene": "consumer_support"},
            "allow_memory_view": AGENT_SKILL_WRITE_VIEWS,
            "custom_extract_prompt": {"skill": SKILL_EXTRACT_PROMPT},
            "messages": messages,
        }
        self._post_memory(skill_data, "Agent Skill", timeout_seconds=300)

    def _post_memory(self, data, label, timeout_seconds):
        res = requests.post(
            f"{MEMOS_BASE_URL}/add/message", headers=self.headers, json=data
        )
        body = res.json()
        if body.get("code") != 0:
            print(f"  [MemOS] Failed to write {label}: {body.get('message')}")
            return

        details = body.get("data") or {}
        if details.get("status") == "running" and details.get("task_id"):
            self._wait_for_task(details["task_id"], label, timeout_seconds)

    def _wait_for_task(self, task_id, label, timeout_seconds):
        """Wait for the asynchronous memory task to complete."""
        deadline = time.time() + timeout_seconds
        while time.time() < deadline:
            time.sleep(2)
            res = requests.post(
                f"{MEMOS_BASE_URL}/get/status",
                headers=self.headers,
                json={"task_id": task_id},
            )
            body = res.json()
            if body.get("code") != 0:
                sys.exit(f"Failed to query memory task: {body.get('message')}")
            status = (body.get("data") or {}).get("status")
            if status == "completed":
                print(f"  [MemOS] {label} write completed")
                return
            if status in {"failed", "error", "cancelled", "canceled"}:
                sys.exit(f"Memory task failed: {task_id} -> {status}")
        sys.exit(f"Timed out waiting for {label} task: {task_id}")

    # ---- Prompt and generation ----

    def build_system_prompt(self, channel, memories, preferences, skills):
        channel_name = {"webchat": "Web chat", "email": "Email ticket"}.get(channel, channel)

        memory_text = "\n".join(
            f"{i}. {m.get('memory_value')}" for i, m in enumerate(memories, 1)
        ) or "(No related memories)"
        preference_text = "\n".join(
            f"{i}. {p.get('preference')}" for i, p in enumerate(preferences, 1)
        ) or "(No preferences)"
        # Inject only Skills with structured content; skip matches without returned content
        valid_skills = [
            s for s in skills
            if isinstance(s.get("skill_value"), dict) and s["skill_value"].get("name")
        ]
        skill_text = "\n".join(
            f"{i}. {s['skill_value']}" for i, s in enumerate(valid_skills, 1)
        ) or "(No matching Skills)"

        return f"""# Role
You are the brand's official support assistant, serving a customer through {channel_name}.
Use retrieved memories, preferences, after-sales policies, and Skills to give accurate, personalized, actionable answers.

# Current time
{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

# Retrieved user memories, after-sales policies, and Agent Skills
<agent_memories>
{memory_text}
</agent_memories>

<preferences>
{preference_text}
</preferences>

<skills>
{skill_text}
</skills>

# Memory usage rules
1. Distinguish direct customer statements from system inferences; give inferences less weight.
2. Confirm that each memory concerns the current customer, rather than another user or a historical case.
3. Use only directly relevant memories; ignore keyword matches from a different context.
4. When memory conflicts with the customer's current input, follow the current input.
5. Use the policy knowledge base as the authority for policies, deadlines, and amounts.

# Response requirements
1. Answer directly without exposing internal memory or retrieval implementation details.
2. Continue pending work without asking customers to repeat information already provided.
3. Reply in the language used by the customer."""

    def generate_reply(self, system_prompt, messages):
        response = self.openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "system", "content": system_prompt}, *messages],
            temperature=0.3,
            top_p=0.9,
        )
        return response.choices[0].message.content

    # ---- Main workflow ----

    def chat(self, query, user_id, conversation_id, channel, tool_steps=None):
        # 1. Read current conversation history from the Agent's local state
        history_key = (user_id, conversation_id)
        history = self.conversation_histories.get(history_key, [])

        # 2. One combined retrieval: user facts/preferences, Agent Skills, and policies
        memories, preferences, skills = self.search_memory(query, user_id)
        self._print_retrieved(memories, preferences, skills)

        # 3. Assemble the current task trace so the model answers from tool results
        llm_turn = [{"role": "user", "content": query}]
        memory_messages = [{"role": "user", "role_id": user_id, "content": query}]
        for step in tool_steps or []:
            tool_call = {
                "role": "assistant",
                "content": "",
                "tool_calls": [{
                    "id": step["id"],
                    "type": "function",
                    "function": {
                        "name": step["name"],
                        "arguments": step["arguments"],
                    },
                }],
            }
            tool_result = {
                "role": "tool",
                "tool_call_id": step["id"],
                "content": step["result"],
            }
            llm_turn.extend([tool_call, tool_result])
            memory_messages.extend([
                {**tool_call, "role_id": AGENT_ID},
                tool_result,
            ])

        system_prompt = self.build_system_prompt(channel, memories, preferences, skills)
        reply = self.generate_reply(system_prompt, [*history, *llm_turn])

        # 4. Save conversation locally; write user context and general Skills separately to MemOS
        self.conversation_histories.setdefault(history_key, []).extend([
            {"role": "user", "content": query},
            {"role": "assistant", "content": reply},
        ])
        memory_messages.append({
            "role": "assistant",
            "role_id": AGENT_ID,
            "content": reply,
        })
        self.add_user_memories(memory_messages, user_id, conversation_id, channel)
        self.add_agent_skill(memory_messages, conversation_id, channel)
        return reply

    @staticmethod
    def _print_retrieved(memories, preferences, skills):
        print("  ---- MemOS Agent retrieval results ----")
        for m in memories:
            value = str(m.get("memory_value", "")).replace("\n", " ")
            print(f"  [Memory {m.get('relativity', 0):.2f}] {value[:80]}")
        for p in preferences:
            print(f"  [Preference] {p.get('preference')}")
        for s in skills:
            value = s.get("skill_value") or {}
            label = value.get("name") or f"id={s.get('id')}"
            print(f"  [Skill {s.get('relativity', 0):.2f}] {label}")
            print(f"  [Skill details] {value}")
        print("  ------------------------")


# ---------------------------------------------------------------------------
# Initialize the policy knowledge base
# ---------------------------------------------------------------------------

def _b64_md(text):
    encoded = base64.b64encode(text.encode("utf-8")).decode("utf-8")
    return f"data:text/markdown;base64,{encoded}"


def _create_kb(headers, name, description):
    res = requests.post(
        f"{MEMOS_BASE_URL}/create/knowledgebase",
        headers=headers,
        json={"knowledgebase_name": name, "knowledgebase_description": description},
    )
    body = res.json()
    if body.get("code") != 0:
        sys.exit(f"Failed to create knowledge base: {body.get('message')}")
    kb_id = body.get("data", {}).get("id") or body.get("data", {}).get("knowledgebase_id")
    if not kb_id:
        sys.exit(f"Knowledge base created, but no ID returned: {name}")
    print(f"Knowledge base created: {name} -> {kb_id}")
    return kb_id


def _upload_file(headers, kb_id, name, text):
    res = requests.post(
        f"{MEMOS_BASE_URL}/add/knowledgebase-file",
        headers=headers,
        json={
            "knowledgebase_id": kb_id,
            "file": [{"type": "document", "name": name, "content": _b64_md(text)}],
        },
    )
    if res.json().get("code") != 0:
        sys.exit(f"Failed to upload file: {res.json().get('message')}")


def _wait_kb_ready(headers, kb_id):
    for _ in range(40):
        time.sleep(3)
        res = requests.post(
            f"{MEMOS_BASE_URL}/get/knowledgebase-file",
            headers=headers,
            json={"knowledgebase_id": kb_id, "page": 1, "page_size": 20},
        )
        files = res.json().get("data", {}).get("file_detail_list", [])
        statuses = {str(item.get("status", "")).lower() for item in files}
        if files and statuses <= {"completed", "available", "failed"}:
            if "failed" in statuses:
                sys.exit(f"File parsing failed in policy knowledge base {kb_id}")
            return
    sys.exit(f"Timed out waiting for policy knowledge base {kb_id}")


def create_policy_knowledge_base():
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Token {MEMOS_API_KEY}",
    }
    policy_kb_id = _create_kb(
        headers,
        "Consumer After-Sales Policy Knowledge Base",
        "Consumer returns, exchanges, warranty, shipping, and invoice policies",
    )
    _upload_file(
        headers,
        policy_kb_id,
        "consumer-after-sale-policy.md",
        POLICY_DOC_MD,
    )
    print("Policy document uploaded; waiting for parsing...")
    _wait_kb_ready(headers, policy_kb_id)
    print(f"Policy knowledge base ready: {policy_kb_id}")
    return policy_kb_id


# ---------------------------------------------------------------------------
# Demo: user context isolation and Agent Skill reuse across users
# ---------------------------------------------------------------------------

CUSTOMER_ID = "customer_001"    # Use a stable authenticated user ID in production
CUSTOMER_ID_2 = "customer_002"  # Second customer for testing Skill reuse and user isolation


def run_demo():
    policy_kb_id = create_policy_knowledge_base()
    assistant = CustomerServiceAssistant(policy_kb_id)

    print("=" * 64)
    print("DAY 1 · Web chat: a customer reports headphone noise, requests an exchange, and gives timing and notification preferences")
    print("=" * 64)
    chat_conv = "conv_chat_0821"

    q1 = ("Hi, I received order 20260820-88 on August 20. The left ear of the noise-canceling headphones has "
          "a constant, noticeable buzzing sound. I would like an exchange.")
    print(f"\n[Customer] {q1}")
    # The support Agent's business-system workflow (orders, tickets, notifications),
    # written with the conversation as a task trace for automatic Skill extraction
    tool_steps = [
        {"id": "call_1", "name": "query_order",
         "arguments": '{"order_id": "20260820-88"}',
         "result": '{"order_id": "20260820-88", "product": "noise-canceling headphones", "sign_date": "2026-08-20", "status": "delivered"}'},
        {"id": "call_2", "name": "check_exchange_policy",
         "arguments": '{"order_id": "20260820-88", "issue": "buzzing in the left ear"}',
         "result": '{"eligible": true, "policy": "exchange within 15 days for functional faults", "shipping": "free shipping both ways"}'},
        {"id": "call_3", "name": "create_exchange_ticket",
         "arguments": '{"order_id": "20260820-88", "reason": "buzzing in the left ear", "type": "exchange for a quality issue"}',
         "result": '{"ticket_id": "EX20260821-03", "status": "created"}'},
        {"id": "call_4", "name": "update_ticket",
         "arguments": '{"ticket_id": "EX20260821-03", "address": "100 Century Avenue, Pudong, Shanghai", "deliver_before": "this Friday", "notify": "sms"}',
         "result": '{"ticket_id": "EX20260821-03", "updated": true}'},
        {"id": "call_5", "name": "schedule_notification",
         "arguments": '{"ticket_id": "EX20260821-03", "channel": "sms", "events": ["shipped", "out for delivery"]}',
         "result": '{"scheduled": true, "channel": "sms"}'},
    ]
    print(f"[Support assistant] {assistant.chat(q1, CUSTOMER_ID, chat_conv, 'webchat', tool_steps=tool_steps)}")

    q2 = ("I'm traveling next week. Please deliver the replacement to my office by this Friday: "
          "100 Century Avenue, Pudong, Shanghai. Please send progress updates by SMS.")
    print(f"\n[Customer] {q2}")
    print(f"[Support assistant] {assistant.chat(q2, CUSTOMER_ID, chat_conv, 'webchat')}")

    print()
    print("=" * 64)
    print("DAY 4 · Email ticket: the same customer asks for progress in a new conversation and channel")
    print("=" * 64)
    mail_conv = "conv_mail_0824"

    q3 = "Hi, what is the status of the headphone exchange I requested?"
    print(f"\n[Customer] {q3}")
    print(f"[Support assistant] {assistant.chat(q3, CUSTOMER_ID, mail_conv, 'email')}")

    print()
    print("=" * 64)
    print("DAY 7 · Web chat: another customer has a similar issue (Agent Skill reuse)")
    print("=" * 64)
    conv_2 = "conv_chat_0828"

    q4 = "Hi, my new noise-canceling headphones make a buzzing sound. What should I do?"
    print(f"\n[Customer] {q4}")
    print(f"[Support assistant] {assistant.chat(q4, CUSTOMER_ID_2, conv_2, 'webchat')}")

    print()
    print("Demo complete. Check three things:")
    print("1. The User Cube generates facts/preferences; the Agent Cube generates Skills only.")
    print("2. DAY 4 combined retrieval returns customer_001's order, issue, and notification preferences.")
    print("3. DAY 7 excludes customer_001's facts/preferences but can retrieve")
    print(f"   generalized Skills belonging to {AGENT_ID}.")


if __name__ == "__main__":
    config = {
        "MEMOS_API_KEY": MEMOS_API_KEY,
        "OPENAI_API_KEY": OPENAI_API_KEY,
        "MEMOS_BASE_URL": MEMOS_BASE_URL,
        "OPENAI_MODEL": OPENAI_MODEL,
        "OPENAI_BASE_URL": OPENAI_BASE_URL,
        "AGENT_ID": AGENT_ID,
    }
    missing = [name for name, value in config.items() if not value or value.startswith("YOUR_")]
    if missing:
        sys.exit(f"Configure these values at the top of the file first: {', '.join(missing)}")
    if OpenAI is None:
        sys.exit("Install openai first: pip install openai")
    run_demo()
```

  </div>
</details>
