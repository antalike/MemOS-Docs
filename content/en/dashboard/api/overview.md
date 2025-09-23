---
title: 概览
---

## 接口介绍

目前 MemOS 提供两种类型的 API，帮助开发者实现对话记忆的存储与检索：

*   **记忆 API：** 检索召回用户的相关记忆片段，模型生成回答时能够结合用户历史、偏好、上下文；
    
*   **消息 API：** 添加与获取用户与系统的原始对话消息，支持储存完整的对话记录。
    

## 鉴权认证

所有接口请求都需要认证，请确保每个请求的 Authorization 头中包含您的接口密钥。

## 项目管理

MemOS 支持以项目为维度管理资源、权限和调用日志。一个项目可以是一款 App、一个 Agent，或者任何需要独立管理资源的模块。

1.  **新建项目**
    

*   每位新用户默认拥有一个“默认项目”。
    
*   通过控制台新建项目时，输入名称和描述，即可创建属于你的独立项目。
    

2.  **删除项目**
    

*   在拥有多个项目时，可删除不再需要的项目。
    

❕删除项目将清空该项目下的所有记忆、消息及相关数据，该操作**不可恢复**。

![image.png](https://cdn.memtensor.com.cn/img/1758595933287_286261_compressed.png)

3.  **接口密钥**
    

*   每个项目拥有独立的接口密钥列表，用于访问该项目下的所有记忆、消息和数据。
    
*   在控制台左上角切换项目，即可查看对应密钥。
    

![image.png](https://cdn.memtensor.com.cn/img/1758596003390_f084vw_compressed.png)

4.  **调用日志**
    

*   在控制台左上角切换项目，监控接口调用情况与历史记录。
    

![image.png](https://cdn.memtensor.com.cn/img/1758596026089_503m42_compressed.png)

## 下一步行动

*   注册并登录 ++MemOS 云平台++，获取您的接口密钥。
    
*   浏览每个接口的详细文档，详细了解请求 & 响应格式、参数和示例用法。
    
    *   [《添加消息》](/dashboard/api/add-message-api-add-message-post)
        
    *   [《查询记忆》](/dashboard/api/search-memory-api-search-memory-post)
        
    *   [《获取消息》](/dashboard/api/get-message-api-get-message-get)
        
    *   [《错误码查询》](/dashboard/api/error_code)
        
*   进行第一次接口调用，添加或检索记忆。
    

## 联系我们

![image.png](https://cdn.memtensor.com.cn/img/1758251354703_v1nwkz_compressed.png)