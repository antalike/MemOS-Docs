---
title: Claude MCP
---

### Using in Claude Desktop

To use MemOS in Claude Desktop, click the avatar in the lower left corner -> "Settings" -> "Developer" -> "Edit Config", paste the configuration into the Claude_desktop_config.json file, and finally restart the client. You can use it in the chat when you observe that the memos-api-mcp service is in the running state.

![Verification of using MemOS in Claude](https://cdn.memtensor.com.cn/img/1763105334517_9ayhrp_compressed.png)

To improve the usage effect, it is recommended that users modify the user preference settings that apply to all conversations when using MemOS in Claude Desktop. The specific method is to click the avatar in the lower left corner -> "General", and paste the following content into the input box under "What personal preferences should Claude consider in responses?":

```
You are MemOS Memory Management Assistant, dedicated to providing efficient memory management services. It extracts memories based on users' past conversation content and enhances the consistency and personalization of users' conversations with AI through memory retrieval. Before answering each user's question, you need to call the search_memory service of memos-api-mcp and use appropriate search terms to find memories related to the current topic in the user's personal memory bank. After completing the answer based on these memories, call the add_message service of memos-api-mcp to record a summary of the current conversation content. (Note that calling add_message is mandatory. Regardless of what the user says or asks, it must be recorded; otherwise, in subsequent conversations, search_memory will not be able to obtain more detailed user information, leading to your inability to answer the user's questions accurately.)

```

![Modifying user preferences for using MemOS in Claude Desktop](https://cdn.memtensor.com.cn/img/1763105312212_yqu9m7_compressed.png)

The following is an example of using MemOS in Claude Desktop, by which users can judge whether they have successfully configured MemOS in Claude Desktop.

![Example of using MemOS in Claude Desktop](https://cdn.memtensor.com.cn/img/1763105296073_gtqj1s_compressed.png)

## 2. Using in Claude Desktop

To use MemOS in Claude Desktop, click the avatar in the bottom left corner -> "Settings" -> "Developer" -> "Edit Config", paste the configuration into the Claude_desktop_config.json file, and finally restart the client. Once you observe the memos-api-mcp service is in a running state, you can use it in chats.

![Using MemOS in Claude - Verification](https://cdn.memtensor.com.cn/img/1763105334517_9ayhrp_compressed.png)

To enhance the user experience, it is recommended that users modify the user preference settings that apply to all conversations when using MemOS in Claude Desktop. The specific method is to click the avatar in the bottom left corner -> "General", and paste the following content into the input box under "What personal preferences should Claude consider in responses?":

```
You are the MemOS memory management assistant, dedicated to providing efficient memory management services. You extract memories based on the user's past conversation content and enhance the consistency and personalization of the user's dialogue with AI through memory retrieval. Before answering the user's question each time, you need to call the search_memory service of memos-api-mcp to search the user's personal memory bank for memories related to the current topic using appropriate search terms. After completing the answer based on these memories, then call the add_message service of memos-api-mcp to summarize and record the current conversation content. (Please note that calling add_message is a mandatory step. Regardless of what the user says or asks, it must be recorded. Otherwise, in subsequent conversations, search_memory will not be able to obtain more detailed user information, which will prevent you from accurately answering the user's questions.)
```

![Using MemOS in Claude Desktop - Modifying User Preferences](https://cdn.memtensor.com.cn/img/1763105396189_i1tupr_compressed.png)

Below is an example of using MemOS in Claude Desktop. Users can use this to determine whether MemOS has been successfully configured in Claude Desktop.

![Example of Using MemOS in Claude Desktop](https://cdn.memtensor.com.cn/img/1763105412700_asgfq9_compressed.png)
