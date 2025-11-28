---
title: Limits
desc: MemOS provides each developer with free quota to quickly experience and validate its memory capabilities.
---


## 1. Free Quota

![image.png](https://cdn.memtensor.com.cn/img/1764313196213_l67bs9_compressed.png)

MemOS Cloud Services currently provides multiple pricing plans, from the free tier to the enterprise tier, to meet the needs of teams of different sizes. All plans are currently free for a limited time. Visit [MemOS Pricing page](https://memos.openmem.net/en/pricing) to apply for the plan that fits your needs.
Take action now and use MemOS Cloud Services to support the growth of your projects.

::note
**Note**
- The free quota is provided per **developer account** and is shared across all projects under that account.
- Failed requests (authentication failure, parameter error, exceeding limits, etc.) **do not consume quota**.
::

## 2. Resource Limits

To ensure stable and secure service, MemOS Cloud Service enforces the following limits on API calls, calculated at the account level:

| API Name | Max Input per Request | Max Output per Request | 
| --- | --- | --- |
| addMessage | 4,000 tokens | - |
| searchMemory | 4,000 tokens | 25 memories |
| getMessage | - | 50 messages |

::note
**Note**
- Requests exceeding the per-call limit will return the corresponding error code without deducting quota.
- Additionally, we recommend a maximum QPS ≤ 50 (i.e., up to 50 requests per second). This is not a strict limit, but high concurrency may be affected by platform capacity, so control request frequency according to actual needs.
::

## 3. Usage Monitoring

You can view the remaining quota for each API through the **API Console**, with filters for project, API key, and date to facilitate tracking and managing usage.

<img width="3024" height="1890" alt="image" src="https://github.com/user-attachments/assets/49cddd25-6fbf-40d4-a750-58c3b2ac5547" />


## 4. Contact Us

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
