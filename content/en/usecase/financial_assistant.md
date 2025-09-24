---
title: Let the Financial Assistant Understand Customer Preferences Behind Behaviors
desc: With MemOS, user operations and conversational behaviors are abstracted into "memories," enabling the identification and extraction of underlying investment preferences to deliver more personalized services.
---


## 1. Overview

In intelligent investment advisory products, users leave behind a large number of **behavioral traces**:

*   **Traffic Source**: Which ad or post did the user click? (e.g., clicked the “Retirement Finance” ad)
    
*   **In-App Operations**: Which fund products did they browse? Which financial products did they bookmark?
    
*   **Communication Records**: Conversations with financial advisors and interactions with the AI financial assistant.
    

These are just raw behaviors. If stored directly as logs, they are of limited help to large models. **The key is how to abstract behaviors into "memories."**


### 1.1 How are behaviors abstracted into memories?

| User Behavior (Raw Trace) | Corresponding Memory (Semantic Abstraction) |
| --- | --- |
| Clicked “Retirement Finance” ad to enter the app | Memory: “User has potential interest in retirement finance” |
| Frequently browsed low-risk fund detail pages | Memory: “User’s risk preference is conservative” |
| Bookmarked “low-risk financial products” | Memory: “User tends to choose low-risk financial products” |
| Said in conversation: “I don’t want to take too much risk” | Memory: “Explicitly expressed low-risk demand” |

When the user later asks, “What kind of investment suits me?”, the financial assistant does not need to scan through a pile of logs but instead directly uses these semantic memories to drive the model to generate personalized answers.


### 1.2 Why not traditional RAG?

RAG is more suitable for knowledge Q&A, such as explaining “What is a bond.” But it does not summarize preferences from user behaviors:

| Traditional RAG | MemOS |
| --- | --- |
| Returns static financial knowledge snippets | Abstracts user behaviors into semantic memories (interests, preferences, profiles) |
| Cannot answer “What kind of investment suits me?” | Can combine memories to generate personalized advice |

### 1.3 Why not build it yourself?

Of course, developers can store behaviors themselves, but they will face three challenges:

*   **Lack of abstraction**: Simply storing “clicked Fund A” is not useful; it needs to be transformed into “risk preference = low risk.”
    
*   **Integration complexity**: Before calling the model, developers must manually build prompts by abstracting scattered behaviors into semantic information.
    
*   **Poor scalability**: As more channels, products, and communication scenarios are added, the code quickly becomes unmanageable.
    

### 1.4 Why use MemOS?

When making a technology selection, you can directly compare three approaches:

| Approach | Characteristics | Limitations | Advantages of MemOS |
| --- | --- | --- | --- |
| **Traditional RAG** | Retrieves knowledge base documents | Does not process user behaviors, cannot build profiles | Suitable for FAQ, but not for personalized financial advisory |
| **Self-Built Storage** | Directly stores behavior logs | Requires manual abstraction from behavior → memory; high prompt engineering cost | Requires developing大量 glue code |
| **MemOS** | Two interfaces: `addMessage` for writing, `searchMemory` for retrieval | —— | Automatically abstracts behavior traces into memories for direct use by the model |


### 1.5 What will this case demonstrate?

This case demonstrates how to use MemOS cloud services to quickly build an intelligent financial assistant that “turns user behaviors into memories.”

In the demo:

*   **D1 Traffic Behavior**: Clicking the “Retirement Finance” ad → generates memory “Interest in retirement finance.”
    
*   **D2 In-App Behavior**: Browsing and bookmarking low-risk funds → generates memory “Risk preference = low risk.”
    
*   **D3 Conversational Behavior**: Saying “I don’t want to take risks” → generates memory “Explicit low-risk demand.”
    

When the user asks, “What kind of investment suits me?”:

*   `searchMemory` retrieves the above memories
    
*   The large model generates an answer that combines these profiles → outputs “More suitable for low-risk fixed income products.”
    

When running this case script, developers will see in the console:

*   Each `addMessage` request/response (behaviors stored)
    
*   Each `searchMemory` request/response (semantic memories retrieved)
    
*   The model’s final personalized investment recommendation
    

## 2. Example

### 2.1 Environment Setup

Use pip to install required dependencies:

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

class FinancialManagementAssistant:
    """AI financial management assistant with memory capability"""
    
    def __init__(self):
        self.memos_client = MemOSClient(api_key=os.getenv("MEMOS_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))
    
    def search_memory(self, query, user_id, conversation_id):
        """Search relevant memories based on query"""
        response = self.memos_client.search_memory(query, user_id, conversation_id)

        return [memory_detail.memory_value for memory_detail in response.data.memory_detail_list]

    def build_system_prompt(self, memories):
        """Construct a system prompt including formatted memories"""
        base_prompt = """
          You are a knowledgeable and professional financial management assistant.
          You can access conversational memories to help you provide more personalized answers.
          Use memories to understand the user’s background, preferences, and past interactions.
          If memories are provided, naturally reference them when relevant, but do not explicitly mention having memories.
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
        self.memos_client.add(messages, user_id, conversation_id)

    def get_message(self, user_id, conversation_id):
        """Retrieve the raw messages stored in MemOS (for debugging/inspection)"""
        response = self.memos_client.get_message(user_id, conversation_id)
        return response.data.message_detail_list

    def chat(self, query, user_id, conversation_id):
        """Main chat function for handling conversations with memory integration"""
        # 1) Search relevant memories
        memories = self.search_memories(query, user_id, conversation_id)
        
        # Build system prompt with memories
        system_prompt = self.build_system_prompt(memories)
        
        # 2) Use OpenAI to generate an answer
        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )
        answer = response.choices[0].message.content

        # 3) Save the interaction back to MemOS
        messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": answer}
        ]
        self.memos_client.add(messages, user_id, conversation_id)
        
        return answer

ai_assistant = FinancialManagementAssistant()
user_id = "memos_financial_management_user_123"
conversation_id = "memos_financial_management_conversation_123"

def demo_questions():
    return [
      "What is my risk preference?",
      "Recommend some investments suitable for me"
    ]

def preset_user_behaviors():
    """Show preset user behavior memories"""
    print("\n📊 Preset user behavior memories:")
    print("=" * 60)
    behaviors = [{
      "role": "user",
      "content": "Clicked 'Retirement Finance' ad to enter app"
    }, {
      "role": "user",
      "content": "Browsed and bookmarked low-risk funds"
    }]
    
    for i, behavior in enumerate(behaviors, 1):
        print(f"{i}. {behavior['content']}")
    ai_assistant.add_messages(behaviors, user_id, conversation_id)
    
    print("=" * 60)
    print("💡 The above behavior memories have been automatically loaded. The assistant will provide personalized recommendations based on them.")

def main():
    print("💰 Welcome to see how MemOS is used in a financial management assistant!")
    print("💡 With MemOS, your financial assistant becomes smarter and more caring! 😊 \n")
    
    # Ask whether to preload user behavior memories (consumes 1 add quota)
    while True:
        pre_chat = input("🤔 Do you want to preload user behavior memories? This will consume 1 add quota. Proceed? (y/n): ").strip().lower()
        
        if pre_chat in ['y', 'yes']:
            preset_user_behaviors()
            break
        elif pre_chat in ['n', 'no']:
            print("📝 Starting a new conversation...")
            break
        else:
            print("⚠️ Please enter 'y' for yes or 'n' for no")
    
    print("\n🎯 Here are some example questions you can continue to ask the assistant:")
    for i, question in enumerate(demo_questions(), 1):
      print(f"  {i}. {question}")

    while True:
        user_query = input("\n🤔 Please enter your question (or type 'exit' to quit): ").strip()
        
        if user_query.lower() in ['quit', 'exit', 'q']:
            print("👋 Thanks for using the financial management assistant!")
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

1.   Set your MemOS API key and OpenAI API key in environment variables
    
2.   Instantiate **FinancialManagementAssistant**
    
3.   Choose whether to execute preset conversations, which will consume 1 add and 2 search quotas
    
4.   Use the `main()` function to interact with the assistant through a conversation loop
    
5.   The assistant will call `chat`, first performing a `search` to retrieve memories, then calling OpenAI for conversation, and finally performing an `add` to store memories
