---
title: Overview
---

## 1. Interface Introduction

MemOS provides a complete set of interfaces. Through simple API requests, you can integrate memory-related functions into your AI applications, realizing memory production, scheduling, recall, and lifecycle management for different users and AI agents.

::tip
**Quick Start:** Get your API key from the [**MemOS Console**](https://memos-dashboard.openmem.net/apikeys/) and complete your first memory operation in one minute.
::

## 2. Getting Started

Start using MemOS API through these two simple core steps:

*   [**Add Message**](/api_docs/core/add_message): Store original message content from user conversations and generate memories;
    
*   [**Search Memory**](/api_docs/core/search_memory): Retrieve and recall relevant user memory fragments to provide reference for model-generated responses.
    

## 3. Interface Categories

Explore the rich functional interfaces provided by MemOS:

*   [**Core API**](/api_docs/core/add_message): Provides core memory operation capabilities, realizing the full process from memory production to consumption.

*   [**Message API**](/api_docs/message/add_feedback): Used for uploading and managing original message content data.

*   [**Knowledge Base API**](/api_docs/knowledge/create_kb): Used for uploading and managing knowledge bases and their documents.


## 4. Authentication

All API requests require authentication. Please include your API key in the `Authorization` header of the request. Get your API key from the [**MemOS Console**](https://memos-dashboard.openmem.net/apikeys/).

::warning
Do not expose your API key in client-side code or public repositories. All requests should be made via environment variables or server-side calls.
::

## 5. Next Steps

*   👉 [**Add Message**](/api_docs/core/add_message): Generate your first memory;
    
*   👉 [**Search Memory**](/api_docs/core/search_memory): Use memory filters to implement advanced memory retrieval.
