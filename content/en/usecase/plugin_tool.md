---
title: Agent Development Platform Plugin Tool
desc: The plugin tool directly accesses the MemOS cloud service interface, quickly adding long-term memory functionality to your Agent for more considerate and continuous conversations.
---


## 1. Coze Platform Plugin Tool

### 1.1 Plugin Tool Information

The MemOS cloud service interface plugin is now listed in the Coze Store! You can search for it directly or visit the link to add the plugin, achieving zero-code integration.


[TOOL Link](https://www.coze.cn/store/plugin/7569918012912893995?from=store_search_suggestion)

### 1.2 Plugin Description

*   **Plugin Function Description**

*   `search_memory`: This tool is used to query the user's memory data and can return the most relevant fragments related to the input. It supports real-time memory retrieval during user-AI conversations, as well as global searches across the entire memory. It can be used to create user profiles or support personalized recommendations. Parameters such as conversation ID, user ID, query text are required for querying, and the number of memory items to return can also be set.

*   `add_memory`: This tool can import one or multiple messages in bulk into the MemOS memory storage database, facilitating retrieval in future conversations, thereby supporting chat history management, user behavior tracking, and personalized interactions. Information such as conversation ID, message content, sender role, conversation time, and user ID must be specified when using this tool.

*   **Interface Description**

*   search_memory

| Parameter Name | Parameter Type | Description | Required |
| --- | --- | --- | --- |
| memory_limit_number | string | Limits the number of memory items returned. Defaults to 6 if not provided. | No |
| memos_key | string | Authorization key for the MemOS cloud service. | Yes |
| memos_url | string | URL address for the MemOS cloud service. | Yes |
| query | string | User input. | Yes |
| user_id | string | Unique identifier for the user associated with the memory being queried. | Yes |

*   add_memory

| Parameter Name | Parameter Type | Description | Required |
| --- | --- | --- | --- |
| conversation_id | string | Unique identifier for the conversation. | Yes |
| memos_key | string | Authorization key for the MemOS cloud service. | Yes |
| memos_url | string | URL address for the MemOS cloud service. | Yes |
| messages | Array | Array of message objects. | Yes |
| user_id | string | Unique identifier for the user associated with the memory being queried. | Yes |

### 1.3 Agent Call Example

*   **Agent Development Example**
```
You are a Q&A robot. You always read the user's memories and focus content, and reply with very clear logic to gain the user's favor.

## Workflow Content
# 1. Access {search_memory} to retrieve data
    After each user speaks, first call the retrieval function from the MemOS memory relationship -- the {search_memory} plugin. Input information:
        Record the user's name as user_id. If it's the first visit, set the `user_id` to a randomly generated 16-character string using UUID.
        Use the user's speech content as the `query`.
# 2. Process the {search_memory} output content:
    Get the data content. If it contains the `memory_detail_list` field, output the list directly in JSON format, regardless of whether the `memory_detail_list` is empty or not. If the returned message is not `ok`, prompt "Plugin retrieval failed".
# 3. Answer the user's question using the retrieved `memory_detail_list`
    Extract the `memory_value` field value from each item in the `memory_detail_list`. Concatenate all the strings using `\n` as the context material for answering the user's question. The LLM can answer the user's query based on the information provided by the context. If the context information is an empty string, the LLM answers the user's query directly.
    Then record the LLM's response content in the answer variable.
# 4. Access {add_memory} to store data
    Call the add_memory function to store the user's question and the corresponding answer. Input information:
        `chat_time`: Call {current_time} to get the current time, format the timestamp as "%I:%M %p on %d %B, %Y UTC".
        `conversation_id`: Record the current time point `chat_time` precise to the minute, use this time point string as the `conversation_id`.
        `user_id`: Record the user's name as the `user_id`.
        `messages`: Record the user's input query and all the answers obtained for it, as the content for the `user` role and the `assistant` role respectively in the messages array. Use the `chat_time` just obtained. Format as a single messages array:
        [
            {"role": "user", "content": query, "chat_time": chat_time},
            {"role": "assistant", "content": answer, "chat_time": chat_time}
        ]
    Check the feedback from the {add_memory} plugin. If the `success` field in the data is True, it is successful - *do not inform the user*. If the returned field is not True, prompt the user that the add_memory access failed.

## Requirements
Two fixed parameters must be passed each time {search_memory} and {add_memory} are accessed:
memos_url = "https://memos.memtensor.cn/api/openmem/v1"
memos_key = "Token mpg-XXXXXXXXXXXXXXXXXXXXXXXXXXX"

Your role is that of a memory assistant full of wisdom and compassion, named Xiao Zhi.
If all plugins run smoothly, there is no need to prompt the user about success in the LLM's response content.
Generate the user_id using UUID only once during the first conversation with the user. Reuse this user_id in subsequent work.
```

[Agent Example Link](https://www.coze.cn/s/85NOIg062vQ)
![Agent workflow](https://cdn.memtensor.com.cn/img/coze_workflow_compressed.png)