---
title: Cloud & Open Source
desc: Choose the MemOS "Memory" solution that best suits your needs.
---

::note
**Tip**<br> Before writing your first line of code, you can quickly experience the effects of "Memory Capabilities" via **MemOS Playground**.<br>

* **No Installation Required**: Open directly in your browser to use immediately<br>

* **Real Interaction**: Chat just like with a standard Chatbot, but the system will automatically remember what you've said<br>

* **Visualized Memory**: See exactly what content is processed into memories, and how they are scheduled and recalled<br>

👉 [Try Playground Now](https://memos-playground.openmem.net/)
::

## 1. The MemOS Solution Best Suited for You


## 1. Find The Most Suitable MemOS Architecture Solution

MemOS Provides **Three** Flexible "Memory" Solutions For AI Applications, Meeting The Full Range Of Needs From Rapid Validation To Production-Level Deployment:

> _Whether it's Cloud Service or Open Source Framework, MemOS allows your AI to easily gain persistent memory._


## 2. Selection Guide

### Choose MemOS Cloud Platform


*   **Rapid Implementation**: Enable your AI application with built-in memory in just a few minutes. Focus on business logic and feature implementation without spending time maintaining complex storage and memory management systems.

*   **Zero-Cost Verification**: Provides ample free trial quotas to help you verify solution feasibility and product effects at the lowest cost.

*   **Logs & Monitoring**: View call logs in real-time in the console, obtain complete call chain analysis, facilitating debugging, monitoring, and performance optimization.

*   **Advanced Features**: Knowledge base and continuous dialogue capabilities are fully open via API, enabling more flexible customization and deep integration.

### Choose MemOS Open Source

*   **Data Security**: All components are deployed in your own environment, ensuring data is fully controllable, meeting localized deployment and privacy compliance requirements.

*   **Custom Configuration**: Freely choose LLM providers, inference backends, deployment strategies, etc., achieving higher flexibility and controllability.

*   **Code Extension**: Modify the codebase directly, extend custom features as needed, and contribute improvements back to the community.

## 3. Still Undecided?

*   [Try Free Platform](/memos_cloud/quick_start): Register and log in to [MemOS Cloud Platform](https://memos-dashboard.openmem.net/quickstart) to try all features for free.

*   [Explore Open Source](/open_source/getting_started/quick_start): Clone the project repository and run it directly locally. And don't forget to give us a Star!

### Scenarios Not Suitable For Open Source Solutions

> _If Your Team Does Not Have Dedicated Operations Personnel, Or The Project Is In The Early Validation Stage, It Is Recommended To Use Cloud Platforms First._


## 4. Quick Access Example

Accessing The Cloud Platform Only Requires Three Steps:

```python
from memos import MemOSClient

# 1. Initialize Client
client = MemOSClient(api_key="your_api_key")

# 2. Create User Memory
client.memory.add(
    user_id="user_123",
    content="User Preference: Prefers Concise Answer Style"
)

# 3. Recall Related Memory
memories = client.memory.search(
    user_id="user_123",
    query="User's Answer Preference"
)
```


## 5. Not Sure Yet?

*   [Try The Free Platform](/memos_cloud/quick_start): Register And Log In To [MemOS Cloud Platform](https://memos-dashboard.openmem.net/quickstart) To Try All Features For Free.

*   [Explore Open Source Solutions](/open_source/getting_started/quick_start): Clone The Project Repository And Run It Locally For A Trial.

*   [Join The Community](https://discord.gg/memos): Communicate With Other Developers About Selection Experiences In The Discord Community.

::tip
**Small Suggestion**: Not Sure How To Choose? You Can First Use The Cloud Platform To Do POC Verification, Confirm The Solution Is Feasible, And Then Migrate To Local Deployment As Needed. The API Interfaces Of Both Solutions Remain Compatible, And The Migration Cost Is Extremely Low.
::

---
*Note: Some Content In This Document Is Used For Incremental Translation Testing.*
