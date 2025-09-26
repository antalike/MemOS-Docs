---
title: A Writing Assistant with Memory is More Useful
desc: With MemOS, your product will automatically remember the user's writing habits and context, making the creative process more coherent and effortless.
---

## 1. Overview

In writing assistant products, users often hope that the assistant can **remember their writing style and habits** instead of starting from scratch each time.

*   **Writing Style**  
    "When helping me write a summary, keep the tone light."
    
*   **Common Information**  
    "Remember that I am in charge of the Marketing Department at XX company."
    
*   **Writing Preferences**  
    "From now on, always start emails with 'Dear Customer.'"
    
*   **Context Continuity**  
    "Please further optimize yesterday’s proposal summary by adding the budget section."
    

Without memory, this information is lost once the conversation ends. Users must repeatedly remind the assistant, which makes the experience feel fragmented and unprofessional.


### 1.1 Why Not Use Traditional RAG?

In the writing assistant scenario, RAG is not suitable.

| Traditional RAG | MemOS |
| --- | --- |
| Relies on a static knowledge base, requiring constant manual document maintenance | Information generated in the conversation can be directly written in, no extra maintenance required |
| Retrieval results are usually generic knowledge fragments | Can store and retrieve personalized style, tone, and commonly used expressions |
| More suitable for “company documents/encyclopedia knowledge” | More suitable for “continuous iteration and personalization” in writing assistants |


### 1.2 Why Not Build It Yourself?

Of course, you could try to save user preferences and context in a database, but this brings several challenges:

*   **Complex storage and retrieval logic**: You need to distinguish main text, preferences, and user profiles, and design retrieval strategies.
    
*   **Troublesome integration with large models**: Storing is only the first step; before calling the large model, you still need to “insert” the relevant information into the prompt.
    
*   **Poor scalability**: As user needs increase (writing style, common phrases, contextual links), the code will quickly become bloated.
    

### 1.3 Why Use MemOS?

When making a choice, you can directly compare the three approaches:

| Approach | Features | Limitations | Advantages of MemOS |
| --- | --- | --- | --- |
| **Traditional RAG** | Retrieves documents from a vector knowledge base and inserts into the prompt | Requires manual maintenance of static documents; unsuitable for personalized writing habits | Automatically captures styles and preferences revealed by users during conversations |
| **Self-built Storage Solution** | Build your own tables/caches to save preferences and content | Complex logic: must distinguish main text/preferences/profiles; manual prompt insertion needed; difficult to scale | MemOS encapsulates storage + retrieval + prompt injection, reducing development burden |
| **MemOS** | Just two APIs: `addMessage` for writing, `searchMemory` for retrieval | —— | Supports long-term tracking of writing styles and reuse of common information; out-of-the-box and easy to expand |


### 1.4 What Will This Case Show?

This case demonstrates how to use the MemOS cloud service to quickly implement a writing assistant that “remembers the user.”

In this demo, the user may:

*   Set preferences: “When helping me write a summary, keep the tone light.”
    
*   Reuse background: “Remember that I am in charge of the Marketing Department at XX company.”
    
*   Iterate tasks: “Please further optimize yesterday’s proposal summary by adding the budget section.”
    

With MemOS, the writing assistant can:

1.  **Maintain Style**: Keep consistent tone and formatting as required by the user.
    
2.  **Reuse Information**: Automatically include the user’s common background information.
    
3.  **Iterate Quickly**: Modify based on existing content instead of starting over.
    

When running this case script, developers will see in the console:

*   Each `addMessage` and `searchMemory` request/response
    
*   Retrieved memories such as writing style and background information
    
*   The final model-generated answer (if no large model is connected, it will display [No model connected])
    

## 2. Example

### 2.1 Environment Setup

Install the required dependencies via pip:

```shell
pip install MemoryOS -U
```


### 2.2 Complete Code

```python
import os
import uuid
from openai import OpenAI
from memos.api.client import MemOSClient

os.environ["MEMOS_API_KEY"] = "mpg-xx" # Get MemOS_API_KEY from cloud service console
os.environ["OPENAI_API_KEY"] = "sk-xx" # Replace with your own API_KEY

conversation_counter = 0

def generate_conversation_id():
    global conversation_counter
    conversation_counter += 1
    return f"conversation_{conversation_counter:03d}"

class WritingAssistant:
    """AI Writing Assistant, helps users write with memory capability"""
    
    def __init__(self):
        self.memos_client = MemOSClient(api_key=os.getenv("MEMOS_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def search_memory(self, query, user_id, conversation_id):
        """Search relevant memories based on query"""
        response = self.memos_client.search_memory(query, user_id, conversation_id)
        return [memory_detail.memory_value for memory_detail in response.data.memory_detail_list]

    def build_system_prompt(self, memories):
        """Build a system prompt that includes formatted memories"""
        base_prompt = """
          You are a professional writing assistant who can remember the user’s writing style and preferences.
          You can call conversation memories to provide more personalized replies.
          Please use these memories to understand the user’s background, preferences, and past interactions.
          If memories are provided, naturally reference them where relevant, but do not explicitly mention having memory capabilities.
        """

        if memories:
            # Format memories as a numbered list
            formatted_memories = "## Memories:\n"
            for i, memory in enumerate(memories, 1):
                formatted_memories += f"{i}. {memory}\n"
            
            return f"{base_prompt}\n\n{formatted_memories}"
        else:
            return base_prompt
        

    def add_message(self, messages, user_id, conversation_id):
        """Add messages to MemOS so they can be processed into memories"""
        self.memos_client.add_message(messages, user_id, conversation_id)

    def get_message(self, user_id, conversation_id):
        """Retrieve the raw messages stored in MemOS (for debugging/inspection)"""
        response = self.memos_client.get_message(user_id, conversation_id)
        return response.data.message_detail_list

    def chat(self, query, user_id, conversation_id):
        """Main chat function to handle dialogue with memory integration"""
        # 1. Search relevant memories
        memories = self.search_memory(query, user_id, conversation_id)
        
        # Build system prompt with memories
        system_prompt = self.build_system_prompt(memories)
        
        # 2. Use OpenAI to generate an answer
        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )
        answer = response.choices[0].message.content

        # 3. Save the conversation into memories
        messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": answer}
        ]
        self.memos_client.add_message(messages, user_id, conversation_id)
        
        return answer

ai_assistant = WritingAssistant()
user_id = "memos_writing_user_123"

def demo_questions():
    return [
      "Help me write a notification email for a team dinner",
      "Help me write a client email summarizing the new features of our upcoming finance app",
    ]

def pre_configured_conversations():
    """Return pre-configured dialogue pairs"""
    return [
        {
            "user": "I work in the marketing department at an internet company. Keep the tone light when writing emails, and start with 'Dear XX'."
        },
        {
            "user": "When writing summaries, I prefer to list three bullet points first."
        }
    ]

def execute_pre_conversations():
    """Execute pre-configured dialogues"""
    conversations = pre_configured_conversations()
    conversation_id = generate_conversation_id()
    
    print(f"\n🔄 Executing pre-configured dialogues（conversation_id={conversation_id}）...")
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
    print("📝 Welcome to the MemOS writing assistant example!")
    print("💡 With MemOS, your writing assistant better understands your style and preferences! ✍️ \n")
    
    # Ask whether to execute pre-configured dialogues first
    while True:
        pre_chat = input("🤔 Do you want to execute the pre-configured dialogues first? This will consume 2 add and 2 search calls. Execute? (y/n): ").strip().lower()
        
        if pre_chat in ['y', 'yes', 'Y']:
            execute_pre_conversations()
            break
        elif pre_chat in ['n', 'no', 'N']:
            print("📝 Starting a brand-new writing assistant dialogue...")
            break
        else:
            print("⚠️ Please enter 'y' for yes or 'n' for no")

    print("\n⚡️ Each question you enter next will take place in a brand-new conversation (with a new conversation ID). MemOS will automatically recall your historical behavioral memories across conversations to provide you with continuous and personalized service.")    
    print("\n🎯 Here are some example questions. You can continue chatting with the writing assistant:")
    for i, question in enumerate(demo_questions(), 1):
        print(f"  {i}. {question}")

    while True:
        user_query = input("\n🤔 Please enter your writing request (or type 'exit' to quit): ").strip()
        
        if user_query.lower() in ['quit', 'exit', 'q']:
            print("👋 Thank you for using the writing assistant. Happy writing!")
            break
        
        if not user_query:
            continue
        
        print("🤖 Creating...")
        conversation_id = generate_conversation_id()
        answer = ai_assistant.chat(user_query, user_id, conversation_id)
        print(f"\n💬 conversation_id: {conversation_id}\n💡 [Assistant]: {answer}\n")
        print("-" * 60)


if __name__ == "__main__":
    main()
```

### 2.3 Code Explanation

1.   Set your MemOS API key and OpenAI key in environment variables.
    
2.   Instantiate `WritingAssistant`.
    
3.   Choose whether to run pre-configured dialogues, which will consume 2 add and 2 search calls.
    
4.   Use the `main()` function to interact with the assistant through a dialogue loop.
    
5.   The assistant will call `chat`: first execute `search` to retrieve memories, then call OpenAI for dialogue, and finally execute `add` to store memories.
