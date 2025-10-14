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
# result: {
#   'code': 0, 
#   'data': {
#     'memory_detail_list': [
#       {
#         'id': '30017d87-c340-4ae0-ac13-9a2992333c2b', 
#         'memory_key': "Assistant's acknowledgment of user's taste", 
#         'memory_value': "[assistant viewpoint] The assistant acknowledged the user's preference for spicy food and noted the user's preference for light but spicy dishes, offering to recommend suitable options.", 
#         'memory_type': 'WorkingMemory', 
#         'memory_time': None, 
#         'conversation_id': 'memos_conversation_345',
#         'status': 'activated',
#         'confidence': 0.0, 
#         'tags': ['food preferences', 'recommendations'], 
#         'update_time': 1760341879781,
#         'relativity': 0.00031495094
#       }, 
#       {
#         'id': '22a6092e-9b4f-479f-9cd7-37f56d1a6777',
#         'memory_key': "User's food preferences", 
#         'memory_value': '[user viewpoint] The user likes spicy food but does not prefer heavy or oily dishes, such as hotpot or spicy beef soup.',
#         'memory_type': 'WorkingMemory',
#         'memory_time': None,
#         'conversation_id': 'memos_conversation_345', 
#         'status': 'activated', 
#         'confidence': 0.0, 
#         'tags': ['food preferences', 'spicy', 'light dishes'],
#         'update_time': 1760341879780, 
#         'relativity': 0.0002937317
#       }
#     ]
#   },
#   'message': 'ok'
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
# result: {
#   'code': 0, 
#   'data': {
#     'memory_detail_list': [
#       {'id': 'e2d8dc71-dc05-41c0-a4ec-74cf1b29447b', 
#        'memory_key': "User's preferred conversation style", 
#        'memory_value': 'The user prefers a conversation style that is humorous, warm, and casual.', 
#        'memory_type': 'WorkingMemory', 
#        'memory_time': None, 
#        'conversation_id': 'memos_conversation_id_567', 
#        'status': 'activated', 
#        'confidence': 0.0, 
#        'tags': ['conversation', 'style', 'preferences'], 
#        'update_time': 1760342037762, 
#        'relativity': 0.00082969666
#       }, 
#       {
#         'id': '9f0a99b3-87c1-47b8-92c6-fa6edaacaf2b', 
#        'memory_key': "User's preferred conversation style", 
#        'memory_value': '[user viewpoint] The user prefers conversations that are Humorous, Warm, and Casual.', 
#        'memory_type': 'WorkingMemory', 
#        memory_time': None, 
#        'conversation_id': 'memos_conversation_id_567', 
#        'status': 'activated', 
#        'confidence': 0.0, 
#        'tags': ['conversation', 'style'], 
#        'update_time': 1760343893000, 
#        'relativity': 0.00036263466
#       }, 
#       {
#         'id': 'ac0f19ac-7a0e-47d8-a1b6-f9d9faa6cfcd', 
#         'memory_key': "User's favorite book genres", 
#         'memory_value': '[user viewpoint] The user likes reading books on Popular science, Technology, and Personal growth.', 
#         'memory_type': 'WorkingMemory', 
#         'memory_time': None, 
#         'conversation_id': 'memos_conversation_id_567', 
#         'status': 'activated', 
#         'confidence': 0.0, 
#         'tags': ['books', 'preferences'], 
#         'update_time': 1760343892997, 
#         'relativity': 7.033348e-05
#       }, 
#       {
#         'id': 'f7f0d39a-8177-42c6-9194-d445332a0dad', 
#         'memory_key': "User's entertainment preferences", 
#         'memory_value': 'The user enjoys sci-fi, action, and comedy movies; mystery and historical drama TV shows; and popular science, technology, and personal growth books.', 
#         'memory_type': 'WorkingMemory', 
#         'memory_time': None, 
#         'conversation_id': 
#         'memos_conversation_id_567', 
#         'status': 'activated', 
#         'confidence': 0.0, 
#         'tags': ['entertainment', 'movies', 'TV shows', 'books'], 
#         'update_time': 1760342037756, 
#         'relativity': 4.130602e-05
#       }, 
#       {
#         'id': '46ce3e1b-431e-4361-90dc-df85c001d1e1', 
#         'memory_key': '用户的运动和饮食习惯', 
#         'memory_value': '[user观点]用户的运动习惯包括跑步和健身；饮食偏好为偏爱辣和健康饮食。', 
#         'memory_type': 'UserMemory', 
#         'memory_time': None, 
#         'conversation_id': 'memos_conversation_id_567',
#         'status': 'activated', 
#         'confidence': 0.0, 
#         'tags': ['运动', '饮食', '习惯'], 
#         'update_time': 1760322048850,
#         'relativity': 2.6285648e-05
#       }, 
#       {
#         'id': 'a15f1804-c3fa-476a-886e-658cb9930780', 
#         'memory_key': "User's desired AI assistance", 
#         'memory_value': 'The user would like AI to help with daily study planning, movie and book recommendations, and emotional companionship.', 
#         'memory_type': 'WorkingMemory',
#         'memory_time': None, 
#         'conversation_id': 'memos_conversation_id_567', 
#         'status': 'activated', 
#         'confidence': 0.0, 
#         'tags': ['AI assistance', 'study', 'recommendations', 'companionship'], 
#         'update_time': 1760342037764, 
#         'relativity': 2.4139881e-05
#       }
#     ]
#   }, 
#   'message': 'ok'
# }
```