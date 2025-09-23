---
title: Building a Home Life Assistant with Memory
desc: With the support of MemOS, a home assistant can connect daily chores and long-term plans, quickly understanding and responding to the user’s real needs.
---

## 1. Overview

When developing a home life assistant product, developers often encounter a problem: **once the dialogue context ends, user information is lost**.

*   User casually assigns a to-do (“Take the kids to the zoo on Saturday”)
*   User expresses a habit (“When reminding, first list the key points, then give one action suggestion”)
*   User introduces family information (“My wife is Xiaoyun, the child is 6 years old”)

If the assistant cannot remember this information, it will appear “heartless”: the next day when the user asks, “What plans do I have for the weekend?”, the assistant will have no idea what they are referring to.


### 1.1 Why not traditional RAG?

Many people’s first thought is: can we use RAG (Retrieval-Augmented Generation)?  
But the characteristics of traditional RAG determine that it is not suitable for this kind of “personalized assistant” scenario:

| Traditional RAG | MemOS |
| --- | --- |
| Relies on static knowledge bases, requiring manual document maintenance | Information generated during dialogue can be directly written in, no extra maintenance needed |
| Can only mechanically return fragments, does not learn preferences | Automatically forms to-do items, preferences, and profiles from conversations |
| Focuses on “common knowledge”, unsuitable for personal information | Designed for individualized scenarios, supports long-term tracking and invocation |


### 1.2 Why not build your own solution?

Of course, you could try to store this information yourself, but this brings several challenges:

*   **Complex storage and retrieval logic**: must distinguish dialogue content, long-term memory, preferences, and facts, and ensure they can be retrieved as needed.
*   **Troublesome integration with LLMs**: not only storing data, but also embedding relevant information into the prompt before generating responses.
*   **Poor scalability**: as features increase (to-dos, preferences, profiles), the code becomes increasingly hard to maintain.


### 1.3 Why use MemOS?

When making a technical choice, you can intuitively compare three approaches:

| Approach | Characteristics | Limitations | Advantages of MemOS |
| --- | --- | --- | --- |
| Traditional RAG | Retrieves documents from a vector database and appends them into the prompt | Requires manual static document maintenance; cannot store personal to-dos/preferences; only mechanically returns fragments | Automatically captures key information from dialogues, supports personalization and dynamic updates |
| Self-built storage solution | Custom tables/cache to save dialogue information | Complex logic: must distinguish dialogues/long-term memory/preferences/profiles; still need to manually build prompt before model calls; poor scalability | MemOS encapsulates storage + retrieval + prompt injection, reducing developer burden |
| MemOS | Only two interfaces: `addMessage` for writing, `searchMemory` for retrieval | —— | Supports long-term tracking, preference retention, and profile integration; ready-to-use and easily extendable |

Only two API calls are needed:

*   `addMessage`: writes user or assistant messages into the system
*   `searchMemory`: retrieves relevant memories before model response and injects them into the prompt

With this, the assistant can truly appear “with memory”:

*   **Track to-dos**
    *   User says “Take the kids to the zoo on Saturday”
    *   A few days later asks “What plans do I have for the weekend?” → Assistant can answer accurately
        
*   **Maintain preferences** (future versions will support more fine-grained instruction completion)
    *   User says “When reminding, first list three key points + one short suggestion”
    *   Later asks “Help me plan next week’s housework distribution” → Assistant outputs in the preferred style
        
*   **Incorporate profiles**
    *   User says “My wife is Xiaoyun, the child is 6 years old”
    *   Later asks “Arrange a weekend activity for the family?” → Suggests a family-friendly activity plan

### 1.4 What does this case demonstrate?

We will use MemOS cloud service to quickly implement a home life assistant “that remembers the user.”  
When running the example script, developers will see complete logs:

*   Requests/responses for each `addMessage` and `searchMemory` call
*   Matched memory entries
*   Concatenated and full instructions  ← TODO: coming soon
*   Model responses (if LLM is not connected, a message will indicate [LLM not connected])


## 2. Example

### 2.1 Environment Setup

Install required dependencies with pip:

```shell
pip install MemoryOS -U
```


### 2.2 Full Code

```python
import os
from openai import OpenAI
from memos.api.client import MemOSClient

os.environ["MEMOS_API_KEY"] = "mpg-xx"
os.environ["OPEN_API_KEY"] = "sk-xx"


class HomeAssistant:    
    def __init__(self):
        self.memos_client = MemOSClient(api_key=os.getenv("MEMOS_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))
    
    def search_memories(self, query, user_id, conversation_id):
        response = self.memos_client.search(query, user_id, conversation_id)

        return [memory_detail.memory_value for memory_detail in response.data.memory_detail_list]

    def add_messages(self, messages, user_id, conversation_id):
        self.memos_client.add(messages, user_id, conversation_id)

    def get_messages(self, user_id, conversation_id):
        response = self.memos_client.get_messages(user_id, conversation_id)
        
        return response.data.message_detail_list

    def build_system_prompt(self, memories):
        """Builds a system prompt containing formatted memories"""
        base_prompt = """
          You are a knowledgeable and considerate home life assistant.
          You can leverage conversation memories to provide more personalized responses.
          Use these memories to understand the user’s context, preferences, and past interactions.
          If memory content is provided, naturally reference it when relevant, but do not explicitly state you have memory functions.
        """

        if memories:
            # Format memories as a numbered list
            formatted_memories = "## Memories:\n"
            for i, memory in enumerate(memories, 1):
                formatted_memories += f"{i}. {memory}\n"
            
            return f"{base_prompt}\n\n{formatted_memories}"
        else:
            return base_prompt
        

    def chat(self, query, user_id, conversation_id):
        """Main chat function handling memory-integrated conversation"""
        # 1. Search relevant memories
        memories = self.search_memories(query, user_id, conversation_id)
        
        # Build system prompt including memories
        system_prompt = self.build_system_prompt(memories)
        
        # 2. Use OpenAI to generate response
        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )
        answer = response.choices[0].message.content

        # 3. Save dialogue into memory
        messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": answer}
        ]
        self.memos_client.add(messages, user_id, conversation_id)
        
        return answer

ai_assistant = HomeAssistant()
user_id = "memos_home_management_user_123"
conversation_id = "memos_home_management_conversation_123"

def demo_questions():
    return [
      "What plans do I have for the weekend?",
      "Help me plan next week’s housework distribution"
    ]

def pre_configured_conversations():
    """Return pre-configured dialogue pairs"""
    return [
        {
            "user": "Take the kids to the zoo on Saturday, please remember it.",
        },
        {
            "user": "For future reminders or plans, please first list three key points, then add one short suggestion.",
        }
    ]

def execute_pre_conversations():
    """Execute pre-configured dialogues"""
    conversations = pre_configured_conversations()
    
    print("\n🔄 Executing pre-configured dialogues...")
    print("=" * 60)
    
    for i, conv in enumerate(conversations, 1):
        print(f"\n💬 Dialogue {i}")
        print(f"👤 User: {conv['user']}")
        
        # Execute dialogue
        answer = ai_assistant.chat(conv['user'], user_id, conversation_id)
        print(f"🤖 Assistant: {answer}")
        print("-" * 40)
    
    print("\n✅ Pre-configured dialogues completed!")
    print("=" * 60)

def main():    
    print("🏠 Welcome to the example of MemOS applied in a home assistant!")
    print("💡 With the power of MemOS, your product can deliver a real butler-like experience! 😊 \n")
    
    # Ask whether to execute pre-configured dialogues first
    while True:
        pre_chat = input("🤔 Would you like to execute the pre-configured dialogues first? This will consume 2 add calls and 2 search calls. Proceed? (y/n): ").strip().lower()
        
        if pre_chat in ['y', 'yes']:
            execute_pre_conversations()
            break
        elif pre_chat in ['n', 'no']:
            print("📝 Starting a new dialogue...")
            break
        else:
            print("⚠️  Please enter 'y' for yes or 'n' for no")
    
    print("\n🎯 Here are some sample questions you can continue to ask the assistant:")
    for i, question in enumerate(demo_questions(), 1):
      print(f"  {i}. {question}")

    while True:
        user_query = input("\n🤔 Please enter your question (or type 'exit' to quit): ").strip()
        
        if user_query.lower() in ['quit', 'exit', 'q']:
            print("👋 Thank you for using the home assistant!")
            break
        
        if not user_query:
            continue
        
        print("🤖 Processing...")
        answer = ai_assistant.chat(user_query, user_id, conversation_id)
        print(f"\n💡 [Assistant]: {answer}\n")
        print("-" * 60)


if __name__ == "__main__":
    main()
```

### 2.3 Code Explanation

1.   Set your MemOS API key and OpenAI key in environment variables  
2.   Instantiate `HomeAssistant`  
3.   Choose whether to run pre-configured dialogues (consumes 2 add calls and 2 search calls)  
4.   Use the `main()` function to interact with the assistant in a dialogue loop  
5.   The assistant calls `chat`, first performing `search` to retrieve memories, then using OpenAI for conversation, and finally performing `add` to store the memory
