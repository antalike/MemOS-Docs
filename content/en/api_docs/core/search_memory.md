---
title: 检索记忆
openapi: "POST /search/memory"
---

## Examples

### Retrieve User Memories During a Conversation

During a conversation between the user and the AI, you can use MemOS to retrieve the memories most relevant to the user’s current message and import them into llm’s prompt.

🍬 **Tip:** Filling `conversation_id` helps MemOS better understand the current session context and increase the weight of session-relevant memories, resulting in more coherent and context-aware responses from the model.

As shown in the example below, if you’ve already followed [**Add Message > Importing Historical Conversations**](/dashboard/api/add-message#importing-historical-conversations) to add historical messages for `memos_user_345`, you can copy the following example to retrieve this user’s memory.

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
BASE_URL = os.environ['MEMOS_BASE_URL']

# Use the user's current message as the query
query_text = "I'm going to Yunnan for National Day. Any food recommendations?"

data = {
    "user_id": "memos_user_345",
    "conversation_id": "memos_conversation_789", # Create a new conversation ID
    "query": query_text,
}

# Call /search/memory to retreive related memories
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
# Example response (showing retrieved memory snippets)
# {
#   "memory_detail_list": [
#     {
#       "id": "a8aec934-756b-4f7e-afdf-da4f567b2f85",
#       "memory_key": "Dislike for heavy or oily dishes",
#       "memory_value": "On September 25, 2025, the user clarified that while they enjoy spicy food, they do not like heavy or oily dishes, such as hotpot or spicy beef soup.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675057192,
#       "conversation_id": "memos_conversation_345",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "food preference",
#         "dietary restrictions",
#         "heavy dishes"
#       ],
#       "update_time": 1762675059740,
#       "relativity": 0.00003117323
#     },
#     {
#       "id": "4dfefe7b-9593-4924-be9b-efe6d15bfaf0",
#       "memory_key": "Preference for spicy food",
#       "memory_value": "On September 12, 2025, the user expressed a liking for spicy food.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675029246,
#       "conversation_id": "memos_conversation_345",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "food preference",
#         "spicy food"
#       ],
#       "update_time": 1762675058836,
#       "relativity": 0.000027298927
#     }
#   ],
#   "preference_detail_list": [
#     {
#       "id": "e3ea3b4e-5a9a-4deb-a11c-1502d4a996ce",
#       "preference_type": "explicit_preference",
#       "preference": "The user likes spicy food but does not like heavy or oily dishes like hotpot or spicy beef soup.",
#       "reasoning": "The user explicitly stated a liking for spicy food and a dislike for heavy or oily dishes. The dislike was specified by examples, indicating a clear preference for lighter dishes even if they are spicy.",
#       "create_time": 1762675319726,
#       "conversation_id": "memos_conversation_345",
#       "status": "activated",
#       "update_time": 1762674876250
#     },
#     {
#       "id": "b306d189-99fc-42a4-b870-07ea00ffc1ca",
#       "preference_type": "implicit_preference",
#       "preference": "Preference for balance between flavor intensity and dish lightness",
#       "reasoning": "The user explicitly states a preference for spicy food but dislikes heavy or oily dishes, suggesting a desire for a balance between intense flavors and the lightness of the dish. This implies a hidden motivation to enjoy the taste without the heaviness associated with certain spicy dishes, pointing to a preference for dishes that are both flavorful and light.",
#       "create_time": 1762674876398,
#       "conversation_id": "memos_conversation_345",
#       "status": "activated",
#       "update_time": 1762674885918
#     }
#   ],
#   "preference_note": "\n# Note:\nFact memory are summaries of facts, while preference memory are summaries of user preferences.\nYour response must not violate any of the user's preferences, whether explicit or implicit, and briefly explain why you answer this way to avoid conflicts.\n"
# }
```

### Get a User’s Profile

If you want to analyze users of your application or display a “personal key insights” summary to them in real time, you can use MemOS to retreive a user’s overall memories. This helps the model generate a personalized user profile.

🍬 **Tip:** In this case, you don’t need to specify `conversation_id`. After receiving the response, you can select memories with `memory_type` set to `UserMemory`. These memories summarize personalized information about the user and are ideal for generating user profiles or content recommendations.

As shown in the example below, if you’ve already followed [**Add Message > Storing User Preferences and Behaviors**](/dashboard/api/add-message#storing-user-preferences-and-behaviors)  to add historical messages for `memos_user_567`, you can copy the following example to retrieve that user’s memory.

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
BASE_URL = os.environ['MEMOS_BASE_URL']

# Query text for retrieving the user's profile
query_text = "What are my key personal traits?"

data = {
    "user_id": "memos_user_567",
    "query": query_text,
}

# Call /search/memory to retrieve related memories
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
# Example response (showing retrieved memory snippets)
# {
#   "memory_detail_list": [
#     {
#       "id": "d8ccc6b1-ca92-49d6-8f3c-beea6fa00e1e",
#       "memory_key": "Preferred conversation style",
#       "memory_value": "The user prefers a humorous, warm, and casual style in conversations.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675887693,
#       "conversation_id": "memos_conversation_id_567",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "conversation",
#         "style",
#         "preferences"
#       ],
#       "update_time": 1762675961289,
#       "relativity": 0.0007798947
#     },
#     {
#       "id": "a5c99814-f69d-448d-87f9-28836244dad8",
#       "memory_key": "Dietary preferences",
#       "memory_value": "The user enjoys spicy food and maintains a healthy eating lifestyle.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675848775,
#       "conversation_id": "memos_conversation_id_567",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "diet",
#         "preferences",
#         "healthy eating"
#       ],
#       "update_time": 1762675968743,
#       "relativity": 0.000111509864
#     },
#     {
#       "id": "7300e222-d526-4f59-bf30-b60952e9e508",
#       "memory_key": "Travel interests",
#       "memory_value": "The user is interested in nature, urban culture, and adventure when it comes to travel.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675868195,
#       "conversation_id": "memos_conversation_id_567",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "travel",
#         "interests",
#         "adventure"
#       ],
#       "update_time": 1762675960296,
#       "relativity": 0.00010057839
#     },
#     {
#       "id": "61a4aa7d-3532-4ee7-902f-4798a82f92ab",
#       "memory_key": "Favorite book genres",
#       "memory_value": "The user is interested in popular science, technology, and personal growth as their favorite book genres.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675781163,
#       "conversation_id": "memos_conversation_id_567",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "books",
#         "genres",
#         "preferences"
#       ],
#       "update_time": 1762675952467,
#       "relativity": 0.00009639777
#     },
#     {
#       "id": "10583713-7bdb-42ed-a01a-e5b54aeb34dd",
#       "memory_key": "AI assistance goals",
#       "memory_value": "The user would like AI to help with daily study planning, movie and book recommendations, and providing emotional companionship.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675948115,
#       "conversation_id": "memos_conversation_id_567",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "AI",
#         "assistance",
#         "goals"
#       ],
#       "update_time": 1762675969747,
#       "relativity": 0.000017721624
#     },
#     {
#       "id": "1b736daf-73aa-4c04-aae8-8b308c9a6b8a",
#       "memory_key": "Topics of interest",
#       "memory_value": "The user is most interested in artificial intelligence, future tech, and film reviews.",
#       "memory_type": "WorkingMemory",
#       "create_time": 1762675925831,
#       "conversation_id": "memos_conversation_id_567",
#       "status": "activated",
#       "confidence": 0.99,
#       "tags": [
#         "interests",
#         "topics",
#         "AI"
#       ],
#       "update_time": 1762675967351,
#       "relativity": 0.00001625416
#     }
#   ],
#   "preference_detail_list": [],
#   "preference_note": ""
# }
```
