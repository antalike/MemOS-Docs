---
title: 概览
---

## 1. 接口介绍

目前 MemOS 提供两种类型的 API，帮助开发者实现对话记忆的存储与检索：

- **记忆 API**：检索召回用户的相关记忆片段，模型生成回答时能够结合用户历史、偏好、上下文；
- **消息 API**：添加与获取用户与系统的原始对话消息，支持储存完整的对话记录。

<br>

## 2. 鉴权认证

所有接口请求都需要认证，请确保每个请求的 Authorization 头中包含您的接口密钥。

<br>

## 3. 项目管理

MemOS 支持以项目为维度管理资源、权限和调用日志。一个项目可以是一款 App、一个 Agent，或者任何需要独立管理资源的模块。

1.  **新建项目**

- 每位新用户默认拥有一个“默认项目”。
- 通过控制台新建项目时，输入名称和描述，即可创建属于你的独立项目。

<br>

2.  **删除项目**

- 在拥有多个项目时，可删除不再需要的项目。

::note
❕删除项目将清空该项目下的所有记忆、消息及相关数据，该操作**不可恢复**。
::

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/8oLl952mYW6Kdlap/img/ff3b3e71-c0a8-493d-a971-0e7b61094a14.png?x-oss-process=image/crop,x_0,y_0,w_2880,h_1083/ignore-error,1)

<br>

3.  **接口密钥**

- 每个项目拥有独立的接口密钥列表，用于访问该项目下的所有记忆、消息和数据。
- 在控制台左上角切换项目，即可查看对应密钥。

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/8oLl952mYW6Kdlap/img/5b289923-24b0-495c-bb69-053cfa1618b7.png?x-oss-process=image/crop,x_0,y_0,w_2880,h_1141/ignore-error,1)

<br>

4.  **调用日志**

- 在控制台左上角切换项目，监控接口调用情况与历史记录。

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/8oLl952mYW6Kdlap/img/e2fb3b06-61be-4700-bba1-5e57cb4940c2.png?x-oss-process=image/crop,x_0,y_0,w_2880,h_1214/ignore-error,1)

<br>

## 4. 下一步行动

- 注册并登录 [MemOS 云平台](https://memos-dashboard.openmem.net/quickstart/)，获取您的接口密钥。
- 浏览每个接口的详细文档，详细了解请求 & 响应格式、参数和示例用法。
  - [添加消息](https://alidocs.dingtalk.com/i/nodes/QPGYqjpJYr4pmOa4T2KzMOMN8akx1Z5N?utm_scene=team_space)
  - [查询记忆](https://alidocs.dingtalk.com/i/nodes/vNG4YZ7JnPYAbkNYiZAraYOYW2LD0oRE?utm_scene=team_space)
  - [获取消息](https://alidocs.dingtalk.com/i/nodes/3NwLYZXWynMqb0RMiYGkBopzVkyEqBQm?utm_scene=team_space)
  - [错误码查询](https://alidocs.dingtalk.com/i/nodes/NkDwLng8ZLv2KPmvizpGoD7KVKMEvZBY?utm_scene=team_space)
- 进行第一次接口调用，添加或检索记忆。

<br>

## 5. 联系我们

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/4maOgXb0JEDR9lWN/img/0dcb729a-8897-4ced-a836-c8e33ae346dd.png)
