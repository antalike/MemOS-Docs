---
title: 端云协同：为智能终端构建长期记忆
desc: 面向耳机、手表、家庭音箱、机器人与手机、电脑等长期相伴的终端，说明 MemOS 怎样形成、维护和调用记忆，以及端云协同、私有部署、托管服务、纯本地四种部署模式与接口接入方式。
---

**MemOS 让智能终端在长期相伴中，记住并理解用户。**

耳机伴随出行，手表参与日常活动，家庭音箱和机器人融入生活，电脑与手机承接工作。这些终端与用户长期相伴，MemOS 记忆能够让这些终端延续了解，为长期陪伴和个性化服务建立基础。

> 把日常交互中积累成后续服务可用的背景，让终端逐渐了解用户。

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:24px 0">
<div style="border-radius:12px;background:rgba(148,163,184,0.10);padding:12px;display:flex;flex-direction:column;gap:12px"><img src="https://cdn.memtensor.com.cn/img/1793103220143_ssk8xr_compressed.webp" alt="耳机交互写入记忆，家庭音箱读取同一用户的记忆并继续建议" style="display:block;width:100%;margin:0;border-radius:6px"><p style="margin:auto 0 0;text-align:center;font-size:14px;line-height:1.5;color:#64748b">可以在日常交互中，逐渐形成对用户的了解</p></div>
<div style="border-radius:12px;background:rgba(148,163,184,0.10);padding:12px;display:flex;flex-direction:column;gap:12px"><img src="https://cdn.memtensor.com.cn/img/1793103291876_gwvaey_compressed.webp" alt="家庭音箱、手机与厨房屏接入同一用户的记忆" style="display:block;width:100%;margin:0;border-radius:6px"><p style="margin:auto 0 0;text-align:center;font-size:14px;line-height:1.5;color:#64748b">让同一件事在不同时间、不同终端继续推进</p></div>
<div style="border-radius:12px;background:rgba(148,163,184,0.10);padding:12px;display:flex;flex-direction:column;gap:12px"><img src="https://cdn.memtensor.com.cn/img/1793103675373_chvydf_compressed.webp" alt="MemOS 维护记忆与适用范围，运动 App 结合当前背景安排训练" style="display:block;width:100%;margin:0;border-radius:6px"><p style="margin:auto 0 0;text-align:center;font-size:14px;line-height:1.5;color:#64748b">让终端对用户的理解跟上变化</p></div>
</div>

MemOS 端云协同记忆解决方案，可以为设备及其配套应用、系统功能和 Agent 提供记忆形成、组织、更新与调用能力。

**终端产品提供交互和业务信息，MemOS 负责判断记什么、怎么组织，并结合后续输入持续维护；需要时产品调用 MemOS 查询和使用记忆。** 这些服务可以运行在客户自己的服务器、MemOS 托管服务或选定本地节点，并按需要分工协作。客户可以结合终端资源、数据管理要求和模型选择安排运行位置。

## MemOS 如何为终端提供记忆服务

> 上述体验由终端产品及其对应的服务端与 MemOS 配合完成：产品提供信息，MemOS 形成并维护记忆，产品功能在需要时查询和使用。

### 信息接入：提供交互与业务信息

产品将获得授权的信息，连同用户、会话、时间或已有业务标识提交给 MemOS。多个终端接入时，由产品现有的账户与设备体系确认当前使用者，将获授权的请求对应到同一用户。**转写语音、识别运动事件属于输入处理；判断记什么、怎样组织属于 MemOS 的记忆处理。** 接入方无需先挑选「有价值的句子」，也无需先提炼偏好或生成标准记忆。

![耳机语音、手表事件与 App 业务信息经已有输入链路进入 MemOS](https://cdn.memtensor.com.cn/img/1793103966228_0ohk2y_compressed.webp){width="720" class="mx-auto"}

### 记忆处理：形成记忆，并随新输入持续维护

MemOS 理解输入中的事实、偏好、事件和背景，关联同一用户的已有记忆，处理重复、变化及适用范围，将形成或更新的记忆及相关索引保存到所选部署的数据节点。产品提交后续表达与业务背景，MemOS 沿同一链路继续维护，无需接入方先找到旧记忆再判断怎样覆盖。

用户需要查看、纠正或删除已有记忆时，可以通过产品提供的管理入口进行控制。日常的新信息与变化继续通过正常输入参与维护。记忆类型与加工说明见[记忆种类](/cn/memos_cloud/introduction/memory_types)和[写入说明](/cn/memos_cloud/mem_operations/add_message)。

![新输入与已有记忆关联，按适用范围更新后保存到所选数据节点](https://cdn.memtensor.com.cn/img/1793103995169_pxb90b_compressed.webp){width="720" class="mx-auto"}

### 按需查询：把相关记忆交给当前终端功能

产品以当前问题和上下文查询 MemOS。MemOS 从已保存的记忆与索引中检索相关内容，返回给产品的业务服务、工具或模型，再由产品完成当前功能并向终端呈现结果。**MemOS 提供记忆背景，产品功能完成路线规划、内容推荐、数据计算和设备动作。** 新的交互和业务结果还可以再次作为输入，参与后续记忆维护。

耳机、手机和家庭音箱可以使用各自的会话，按当前问题查询同一用户已积累的记忆，增加终端不改变数据保存位置。

![产品按当前问题查询，MemOS 返回相关记忆供业务功能使用](https://cdn.memtensor.com.cn/img/1793104021020_9iy9qe_compressed.webp){width="720" class="mx-auto"}

## 端侧怎样部署

为耳机、手表、手机或电脑提供持续记忆，在部署时需要关注几个核心要素：**MemOS 在哪里运行、记忆数据保存在哪里、大模型在哪里提供计算，以及终端怎样使用。**

下面按四种常见模式，说明这些环节怎样配合。

| 部署模式 | MemOS 与记忆数据在哪里 | 大模型在哪里 | 终端怎样使用 |
| --- | --- | --- | --- |
| 家庭中枢端云协同 | MemOS 在家庭中枢运行，记忆与索引保存在本地 | 调用客户自建或选定的远程大模型 | 终端访问中枢，请求经本地隐私处理后发往远程计算，结果回到本地继续保存和使用 |
| 客户私有部署 | 位于客户管理的服务器环境，数据由客户保存和管理 | 本例使用客户环境中的大模型及配套处理 | 终端经产品服务端写入、查询记忆，再用于产品功能 |
| MemOS 托管服务 | 位于 MemOS 托管环境，由托管方运行和保存 | 记忆处理所需的大模型由托管服务提供 | 产品服务端调用托管接口，取得记忆后用于自己的功能 |
| 家庭中枢纯本地 | MemOS、记忆与索引位于家庭中枢或同场所节点 | 大模型及配套处理也在本地 | 终端经家庭网络访问本地记忆与产品功能 |

### 端云协同：本地保存记忆，隐私处理后调用远程大模型

这套方案将**记忆保存在本地，先在中枢按配置处理敏感信息，再按需调用远程大模型**。手机 App、家庭音箱、厨房屏等终端经授权访问家庭中枢上的 MemOS，记忆内容、检索索引和真实值与代号的映射持续保存在中枢本地。

大模型由客户自己的推理服务器或选定模型服务提供。MemOS 内部隐私模块在本地完成指定信息的替换和结果还原；记忆加工及查询中需要远程模型参与的请求，均按对应隐私路径处理。本例的检索等轻量处理留在中枢，终端取得还原后的可用记忆背景。

家庭中枢可以采用常在线小主机或家用服务器，例如 32 GB 内存、1 TB NVMe SSD，以及千兆或 2.5 GbE 有线网络，作为家庭少用户场景的资源参考。它承担本地服务、记忆保存、检索、隐私处理和设备接入，远程节点承担大模型计算。

中枢固定放置、持续供电联网，手机或电脑离开后仍可继续运行；家中终端经局域网访问，外出则通过受控的远程接入网关或配套服务衔接。

记忆写入先保存记录并返回受理结果，后台再组织隐私处理和大模型调用。

::note
这一隐私处理的详细技术思路见 [MemPrivacy：端云协同智能体的个性化记忆隐私保护](https://arxiv.org/abs/2605.09530)。
::

![家庭中枢运行 MemOS 并保存记忆，敏感信息在本地替换后再调用远程大模型](https://cdn.memtensor.com.cn/img/1793104048129_7s9zki_compressed.webp){width="720" class="mx-auto"}

**家庭中枢内的 MemOS 怎样处理远程请求中的敏感信息**

例如，手机或家庭音箱经中枢的接入程序，将包含朋友姓名、集合时间和地址的交互提交给 MemOS。MemOS 准备记忆加工请求时，内部隐私模块将指定姓名和地址替换为代号，保留中枢上的本地映射，再调用远程模型。结果返回后，在 MemOS 内部完成还原，继续组织、维护和保存记忆。

```text
MemOS 接收：周六十点到王晨家集合，地址是某小区某栋某室。
MemOS 内部处理后发往模型：周六十点到〔人物01〕家集合，地址是〔地址01〕。
中枢内的本地映射：〔人物01〕→王晨；〔地址01〕→某小区某栋某室。
模型结果返回后：MemOS 内部还原指定内容，继续组织并保存记忆。
```

![敏感信息替换为代号后发往远程模型，返回结果在中枢内还原](https://cdn.memtensor.com.cn/img/1793104101624_41s0z8_compressed.webp){width="720" class="mx-auto"}

### 客户私有部署：在客户控制的服务器环境运行 MemOS

**私有部署与使用公有云资源可以同时成立。** 客户在自己的公有云账号中租用服务器，部署服务、保存数据并管理大模型，仍属于客户私有部署；它与最终用户家中的本地中枢，以及直接调用 MemOS 托管服务，是不同的运作方式。

以耳机厂商为例，耳机通过配套手机 App 接入厂商的产品服务端。服务端负责账号、授权和业务请求。**MemOS 在客户管理的服务器上运行，输入记录、形成的记忆与检索索引保存在客户指定的数据节点。** 本例同时在客户环境中运行大模型，为记忆理解、整理和维护提供计算。客户可使用机房服务器、已有虚拟机或自己云账号中的服务器。

终端提交信息后，MemOS 保存记录，在后台调用大模型加工并维护记忆。下次需要背景时，MemOS 从客户保存的数据中查找相关记忆，返回给产品服务端，再由产品的问答、推荐或计划功能使用。整个过程中，客户管理服务、数据、大模型及访问权限。

若改用外部大模型 API，记忆库仍可保留在客户环境，但相关请求内容会发往该服务。

![MemOS 与记忆数据部署在客户管理的服务器环境，终端经产品服务端接入](https://cdn.memtensor.com.cn/img/1793104177725_9yld8v_compressed.webp){width="720" class="mx-auto"}

### 托管云服务：调用由 MemOS 运营的记忆服务

仍以耳机与配套 App 为例，终端交互和产品业务由客户自己的产品承接，产品服务端调用 MemOS 托管接口。**MemOS 在托管环境中运行，记忆内容与索引保存在托管环境，记忆处理所需的大模型及配套处理也由托管服务提供。** 客户无需为这些记忆能力维护服务器或大模型运行环境。

写入时，产品服务端提交获授权的信息，先取得受理结果，MemOS 在后台完成加工和保存。查询时，产品提交当前问题，MemOS 返回相关记忆，再由产品自己的问答、推荐或计划功能使用。产品业务所需的大模型与工具仍由客户产品组织，接入时说明它们会收到哪些记忆内容。

用户的记忆在托管环境中持续积累，各终端经产品服务端授权访问。

![产品服务端调用 MemOS 托管接口，记忆与索引保存在托管环境](https://cdn.memtensor.com.cn/img/1793104247535_m2851g_compressed.webp){width="720" class="mx-auto"}

### 纯本地运行：由固定的家庭 AI 中枢承载记忆与模型

希望将记忆和大模型计算都放在家中时，可以采用带相应算力的固定主机，例如紧凑 AI 工作站或家用服务器。手机、音箱、厨房屏等终端经家庭网络和授权入口访问中枢。

**本方案将记忆保存和大模型计算一并留在本地。** MemOS 在中枢运行，记忆内容与索引保存在本地 SSD，大模型及其配套处理也在中枢或同场所固定节点运行。终端提交信息后，MemOS 在本地保存、加工和维护记忆；需要背景时，再从本地查找并交给当前产品功能使用。

本图将所用问答、语音等业务模型也安排在本地。要实现完整离线，相应工具与资料依赖也需在本地提供，并核验整条链路的实际可用范围。一台主机可以同时承担服务、存储和大模型，也可以连接同场所的固定算力节点。家庭少用户场景可用 64–128 GB 统一内存、2–4 TB SSD 的紧凑 AI 主机作为资源量级参考；采用独立显卡时分别核算系统内存与显存，再按所选大模型、上下文和并发验证。紧凑主机形态可参考 [DGX Spark 官方硬件说明](https://docs.nvidia.com/dgx/dgx-spark/hardware.html)。

需要留存的原始材料、记忆备份和日志按本地目录与权限管理，NAS 可保存资料与备份。已有 NAS 能否同时运行记忆服务或大模型，取决于处理器、内存及软件环境。

![记忆与业务模型都在家庭中枢或同场所节点运行，终端经家庭网络访问](https://cdn.memtensor.com.cn/img/1793104358743_ld177g_compressed.webp){width="720" class="mx-auto"}

## 接口接入示例：写入、状态跟踪与记忆查询

部署方式确定后，产品需要接通信息写入、加工状态跟踪和记忆查询。下面以 MemOS 托管 API 展示调用示例，并说明部署在家庭中枢时的接入流程。示例中的用户与凭证用于演示，接入时替换为实际配置。

### 服务端接口：异步写入与跨端查询

下面以 MemOS 托管 API 演示，由产品服务端保管项目 API Key，并依据产品账户校验用户访问权限。客户私有部署时，使用实际交付版本指定的服务地址、鉴权与接口。`user_id` 对应记忆用户，`conversation_id` 对应当前会话；同一用户的不同终端可以使用各自的会话标识。API Key 的项目范围见[项目配置](/cn/api_docs/start/configuration)。

![终端交互经产品服务端提交，写入、加工与查询在同一账户体系下完成](https://cdn.memtensor.com.cn/img/1793104423004_hsqwrg_compressed.webp){width="720" class="mx-auto"}

手机 App 获得耳机交互的转写文本后，由产品服务端提交完整表达，MemOS 负责记忆加工：

```bash
curl --request POST \
  --url 'https://memos.memtensor.cn/api/openmem/v1/add/message' \
  --header 'Authorization: Token YOUR_MEMOS_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "demo_user_001",
    "conversation_id": "weekend_plan_001",
    "messages": [
      {"role": "user", "content": "周六早上想带爸妈去苏州转转，周日晚上回来。对了，我妈吃不了辣。"}
    ],
    "async_mode": true
  }'
```

本例使用 `async_mode: true`。写入接口先返回受理结果与 `data.task_id`、`data.status`，MemOS 在后台继续加工并按托管服务配置保存记忆与索引；受理成功与加工完成是两个状态。产品服务端保存任务标识，按需要跟踪处理进度。字段与处理方式见[写入接口](/cn/api_docs/core/add_message)和[异步说明](/cn/memos_cloud/features/async_mode)。

周五用户在手机 App 中补充「周六上午有点事，吃完午饭再走吧。园林就放周日逛」，产品服务端继续异步提交新表达与会话背景，并记录这次返回的任务标识。需要确认本次写入或补充的完整加工结果时，使用对应 `task_id` 查询任务状态：

```bash
curl --request POST \
  --url 'https://memos.memtensor.cn/api/openmem/v1/get/status' \
  --header 'Authorization: Token YOUR_MEMOS_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"task_id": "YOUR_TASK_ID"}'
```

任务的 `data.status` 可以是 `running`、`completed` 或 `failed`。联调时可在 `completed` 后核对本次完整处理结果；线上查询可以使用已加工可用的记忆，`running` 也可能已有可检索内容。状态字段与失败信息见[任务状态接口](/cn/api_docs/message/get_status)。

回家后，用户向家庭音箱问起出游。音箱服务经产品服务端使用相同 `user_id` 查询，填写当前音箱会话的 `conversation_id`：

```bash
curl --request POST \
  --url 'https://memos.memtensor.cn/api/openmem/v1/search/memory' \
  --header 'Authorization: Token YOUR_MEMOS_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "demo_user_001",
    "conversation_id": "home_speaker_continue_002",
    "query": "周末去苏州那个，现在怎么安排的？还有啥要注意的？"
  }'
```

当前会话标识参与查询上下文，不要求所有终端共用一个会话。查询返回中，事实内容位于 `data.memory_detail_list[].memory_value`，偏好内容位于 `data.preference_detail_list[].preference`。产品服务端将相关记忆交给自己的问答或行程功能，生成音箱回答；手机 App 也可以在计划页查询并使用。具体召回取决于输入与处理结果，字段详见[记忆搜索接口](/cn/api_docs/core/search_memory)。

联调时，用同一演示用户完成首次写入、后续补充和另一终端的查询，确认记忆加工状态、召回内容及产品实际使用结果。用户需要精确管理已有内容时，再将[修改](/cn/api_docs/core/update_memory)和[删除](/cn/memos_cloud/mem_operations/delete_memory)接入产品的记忆管理入口。

### 中枢接口：本地写入与查询

在家庭中枢部署 MemOS 后，手机、音箱等终端通过中枢的授权服务入口提交信息和查询记忆。端云协同与纯本地方案使用相同的记忆业务流程，记忆与索引均保存在中枢本地；大模型沿用前述部署方案。

![终端经中枢授权入口写入与查询，记忆和索引留在本地](https://cdn.memtensor.com.cn/img/1793104448186_ghw8d9_compressed.webp){width="720" class="mx-auto"}

以下按 MemOS 云服务接口格式给出调用示例。调用前先设置环境变量：`MEMOS_ADD_MESSAGE_URL`、`MEMOS_GET_STATUS_URL` 和 `MEMOS_SEARCH_MEMORY_URL` 分别填写中枢部署提供的写入、状态查询和记忆查询接口完整地址，`MEMOS_API_KEY` 填写访问凭证。具体地址、路径、鉴权及存储配置以实际交付版本为准。

写入交互信息：产品将完整表达连同用户、会话等标识提交给中枢上的 MemOS。例如：

```bash
curl --request POST \
  --url "${MEMOS_ADD_MESSAGE_URL}" \
  --header "Authorization: Token ${MEMOS_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "demo_user_001",
    "conversation_id": "home_hub_dinner_001",
    "messages": [
      {"role": "user", "content": "下班回来都累死了，晚饭弄点省事的吧。哦对，别放香菜。"}
    ],
    "async_mode": true
  }'
```

写入接口返回受理结果后，MemOS 在后台形成、维护并保存记忆。接入程序保存返回的 `data.task_id`，并用它查询加工状态；将下例中的 `YOUR_TASK_ID` 替换为本次任务标识。`data.status` 为 `running`、`completed` 或 `failed`，查询记忆时使用已加工可用的内容。

```bash
curl --request POST \
  --url "${MEMOS_GET_STATUS_URL}" \
  --header "Authorization: Token ${MEMOS_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data '{"task_id": "YOUR_TASK_ID"}'
```

查询相关记忆：用户随后在家庭音箱询问晚饭安排时，产品以同一用户的身份和当前问题查询 MemOS。例如：

```bash
curl --request POST \
  --url "${MEMOS_SEARCH_MEMORY_URL}" \
  --header "Authorization: Token ${MEMOS_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "demo_user_001",
    "conversation_id": "home_speaker_dinner_002",
    "query": "今晚吃啥？想弄点省事的。"
  }'
```

MemOS 从中枢保存的记忆与索引中检索相关内容，返回给产品的问答或菜单功能使用；产品结合当前问题与相关记忆生成回答。

联调时确认写入记录可跟踪加工状态、查询返回可用背景，并检查重启后的记忆查询及备份、删除的作用范围。更多服务端调用方式见[快速接入](/cn/memos_cloud/getting_started/quick_start)。
