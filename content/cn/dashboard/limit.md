---
title: 配额和限制
desc: MemOS为每位开发者免费赠送部分配额，便于快速体验和验证记忆功能。
---


## 1. 额度说明

![image.png](https://cdn.memtensor.com.cn/img/1764310350747_3h97on_compressed.png)

MemOS 云服务目前为所有开发者提供了从免费版到企业版的多种定价方案，满足不同规模团队的需求。目前，所有版本限时免费，欢迎前往[MemOS 官网-价格](https://memos.openmem.net/cn/pricing)，申请符合你需求的版本。
立即行动，享受 MemOS 云服务带来的无限可能，助力你的项目快速成长！

::note
**注意**
- 使用额度由每个开发者账号下的所有项目共同累计。
- 请求失败（鉴权失败、参数错误、超额限制等）**不消耗额度**。
::

## 2. 资源限制

为保证服务稳定与安全，MemOS 云服务对接口调用有如下限制，按照账号维度计算：

| 接口名称 | 单次输入上限 | 单次输出上限 |
| --- | --- | --- |
| addMessage | 4,000 token | \- |
| searchMemory | 4,000 token | 25 条记忆 |
| getMessage | \- | 50 条消息 |

::note
**注意**
- 当请求超出单次上限时，系统直接返回对应错误码，不会扣减调用次数。
- 另外，我们建议最大 QPS ≤ 50（即每秒最多 50 次请求），此非严格限制，但高并发请求可能会受到平台处理能力影响，请根据实际需求合理控制调用频率。
::

## 3. 用量监控

您可通过**API 控制台**查看各接口的剩余额度，并支持按项目、接口密钥和日期进行筛选，方便跟踪和管理调用情况。

![image.png](https://cdn.memtensor.com.cn/img/1758712749473_o1uvbd_compressed.png)


## 4. 联系我们

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
