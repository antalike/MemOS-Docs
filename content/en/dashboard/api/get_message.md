## Examples

### Supplement for LLM Prompts

If you think that the model’s reply should reference the user’s recent conversation history, you can use MemOS to fetch historical messages from the conversation and then concatenate the most recent messages into the prompt. This allows the model to maintain continuity and contextual understanding even in a stateless scenario.

As shown in the example below, if you’ve already followed [**Add Message > Importing Historical Conversations**](/dashboard/api/add-message#importing-historical-conversations) to add historical messages for `memos_user_345`, you can copy this example to quickly retrieve the conversation’s history.

```python
import os
import json
import requests

# Set your API key and base URL
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ["MEMOS_BASE_URL"]

def get_message(user_id: str, conversation_id: str, limit: int):
    data = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "message_limit_number": limit
    }

    res = requests.post(f"{BASE_URL}/get/message", headers=headers, data=json.dumps(data))
    result = res.json()

    if result.get("code") == 0:
        return result.get("data", {}).get("message_detail_list", [])
    else:
        print(f"❌ Failed to get message: {result.get('message')}")
        return []

# ---------------------------
# Fetch historical messages
model_context = get_message("memos_user_345", "memos_conversation_345", 4)

# Remove chat_time, directly generate format usable by the model, and print
model_context_simple = [{"role": m["role"], "content": m["content"]} for m in model_context]
print(json.dumps(model_context_simple, ensure_ascii=False, indent=2))

# ---------------------------
# Example Output：
# [
#   {
#     "role": "user",
#     "content": "I like spicy food."
#   },
#   {
#     "role": "assistant",
#     "content": "Got it — I’ll remember that you like spicy food."
#   },
#   {
#     "role": "user",
#     "content": "But I don’t really like heavy or oily dishes, like hotpot or spicy beef soup."
#   },
#   {
#     "role": "assistant",
#     "content": "So you prefer light but spicy dishes. I can recommend some that might suit your taste!"
#   }
# ]
```

### Restoring Chat Context

If you are in the early stages of building an AI application and haven’t yet set up local or database storage for user chat records, you can fetch the user’s most recent active conversation from MemOS when they refresh the page or reopen the app, and restore it in the chat window.

As shown in the example below, if you've already followed [**Add Message > Importing Historical Conversations**](/dashboard/api/add-message#importing-historical-conversations) to include past messages of user `memos_user_345`, you can copy this example to quickly retrieve the conversation history and output it in the structure needed for your chat interface.

```python
import os
import json
import requests

# Set your API key and base URL
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ["MEMOS_BASE_URL"]

def get_messages(user_id: str, conversation_id: str):
    data = {
        "user_id": user_id,
        "conversation_id": conversation_id,
    }

    res = requests.post(f"{BASE_URL}/get/message", headers=headers, data=json.dumps(data))
    result = res.json()

    if result.get("code") == 0:
        return result.get("data", {}).get("message_detail_list", [])
    else:
        print(f"❌ Failed to get message: {result.get('message')}")
        return []

# Assume: user opens the app
user_id = "memos_user_345"
conversation_id = "memos_conversation_345"

messages = get_messages(user_id, conversation_id)

# Print role, content, and time
for m in messages:
    print(f"[{m['role']}] {m['content']} (time={m.get('chat_time', 'unknown')})")

# ---------------------------
# Example Output：
# [user] I like spicy food. (time=2025-09-12 08:00:00)
# [assistant] Got it — I’ll remember that you like spicy food. (time=2025-09-12 08:01:00)
# [user] But I don’t really like heavy or oily dishes, like hotpot or spicy beef soup. (time=2025-09-25 12:00:00)
# [assistant] So you prefer light but spicy dishes. I can recommend some that might suit your taste! (time=2025-09-25 12:01:00)
```