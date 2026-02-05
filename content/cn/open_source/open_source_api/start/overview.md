---
title: 概述
---

## 1. 接口介绍

MemOS 开源项目提供了一个使用 FastAPI 编写的 REST API 服务。用户可以通过 REST 接口执行所有操作。


![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)
<div style="text-align: center; margin-top: 10px">MemOS REST API 服务支持的 API</div>  

### 功能特点

- 添加新记忆：为指定用户创建一条新的记忆。
- 搜索记忆：为指定用户搜索其记忆内容。
- 获取用户所有记忆：获取某个用户的所有记忆内容。
- 记忆反馈：为指定用户反馈记忆内容。
- 与 MemOS 对话：与 MemOS 进行对话，返回 SSE 流式响应。


## 2. 入门指南

通过以下两个简单的核心步骤开始使用 MemOS 开源项目API：

*   [**添加消息**](/open_source/open_source_api/core/add_message)：通过 POST /memories 接口，储存用户对话中的原始消息内容，生成记忆；
    
*   [**检索记忆**](/open_source/open_source_api/core/search_memory)：通过 POST /search 接口，检索召回用户的相关记忆片段，为模型生成的回答内容提供参考。
    

## 3. 接口分类

探索 MemOS 提供的丰富功能接口：

*   [**核心记忆接口**](/open_source/open_source_api/core/add_message)：提供记忆核心操作能力，实现记忆生产到消费的全流程。

*   [**消息相关接口**](/open_source/open_source_api/message/add_feedback)：用于上传与管理原始消息内容数据。

*   [**MemCube 空间管理**](/open_source/open_source_api/knowledge/create_kb)：用于管理逻辑隔离的存储空间（MemCube），支持注册、注销及跨用户分享。


## 4. 鉴权认证与上下文

所有API请求都需要认证，请在请求头的 `Authorization` 中包含您的接口密钥。从[**MemOS 控制台**](https://memos-dashboard.openmem.net/apikeys/)获取接口密钥。

::warning
请勿在客户端或公共仓库中暴露您的接口密钥，所有请求都应通过环境变量或服务器端调用进行。
::

RequestContext： 系统内置了 RequestContextMiddleware 中间件，用于处理请求的上下文信息。

身份标识： 在请求体或 Header 中包含 user_id，以确保记忆归属于正确的用户。由于是开源环境，您可以根据需求在 middleware 中自定义更高级的 OAuth 或 API Key 校验。

## 5. 下一步行动

*   👉 [**添加消息**](/api_docs/core/add_message)：生成你的第一条记忆；
    
*   👉 [**检索记忆**](/api_docs/core/search_memory)：使用记忆过滤器实现记忆的高级检索。
