---
title: Memory Filters
desc: Use memory filters when retrieving memories to filter by specific agents, metadata, time ranges, etc.
---

## 1. When to Use Memory Filters

When processing large-scale memories, you need to precisely control the range of memories that can be retrieved. Memory Filters provide fine-grained control over the retrieval scope, mainly including:

*   **Filter memories by specific agent**: Screen out memories belonging to a specific agent among multi-agent memories of the same user.
    
*   **Retrieve memories based on time**: Limit the retrieval range via timestamps, such as querying memories for a specific day or time period.
    
*   **Specify custom range of memories**: Retrieve only memories that meet business conditions based on custom metadata fields.
    

## 2. Filter Structure

Supports defining memory filters using JSON format, allowing logical operators at the outermost layer to combine multiple filter conditions.

```json
# Basic structure shown below
{
    "and": [  # Or 'or'
        { "field_name": "value" },
        { "field_name": { "operator": "value" } }
    ]
}
```

## 3. Available Fields and Operators

### 3.1 Instance Fields

| Field Name | Data Type | Operator | Example |
| --- | --- | --- | --- |
| agent\_id | str | `=` | `{"agent_id":"agent_123"}` |
| app\_id | str | `=` | `{"app_id":"app_123"}` |

### 3.2 Metadata Fields

When adding messages, you can pass custom metadata field `info`. Currently, memory filters support filtering on the following four fields.

| Field Name | Data Type |  Operator | Example | Note |
| --- | --- | --- | --- | --- |
| business\_type | str | `=` | `{"business_type":"Shopping"}` | We have added a database index, resulting in faster query speed. | 
| biz\_id | str | `=` | `{"biz_id":"order_123456"}` | We have added a database index, resulting in faster query speed. | 
| scene | str | `=` | `{"scene": "Payment"}` | We have added a database index, resulting in faster query speed. | 
| custom\_status | str | `=` | `{"custom_status": "VIP3"}` | You can define other fields on your own. |

### 3.3 Tag Fields

| Field Name | Data Type | Operator | Example |
| --- | --- | --- | --- |
| tags | list |`contains` | `{"tags": {"contains": "finance"}` |

### 3.4 Time Fields

| Field Name | Data Type | Operator | Example |
| --- | --- | --- | --- |
| create\_time | str | `lt`, `gt`, `lte`, `gte` | `{"create_time": {"gte": "2025-12-10"}}` |
| update\_time | str | `lt`, `gt`, `lte`, `gte` | `{"update_time": {"lte": "2025-12-10"}}` |

## 4. Usage Examples

:::note
**Tip**<br> The root node must be `and` or `or`, and combine a series of conditions; nested logical operators are not allowed;<br>
Specifying `user_id` in `filter` is not supported; MemOS retrieves memories by user dimension.
:::

Using the following memory filters can meet common retrieval needs without rebuilding filtering logic.

---

**Agent**

```json
# Retrieve memories related to any of the following agents
"filters" : {
    "or": [
        {"agent_id": "agent_123"},
        {"agent_id": "agent_456"}
    ]
}
```

**Metadata**

```json
# Retrieve attributes in custom metadata info
"filters" : {
    "and": [
        {"business_type":"Travel"}, # Macro business category
        {"biz_id":"travel_001"}, # Core business identifier
        {"scene":"Payment"}, # Specific environment or interaction link where the message occurred
        {"custom_status":"v1"} # Custom status/mark
    ]
}
```

**Tags**

```json
# Retrieve memories containing specific tags
"filters" : {
    "and": [
        {"tags":"Weather"}
    ]
}
```

**Date Range**

```json
# Retrieve memories from December 2025
"filters" : {
    "and": [
        {"create_time": {"gt": "2025-12-01"}},
        {"create_time": {"lt": "2026-01-01"}}
    ]
}

# Retrieve memories updated recently
"filters" : {
    "and": [
        {"update_time": {"gt": "2025-12-10"}}
    ]
}
```

**Multi-dimension**

```json
# Retrieve memories of a user regarding bills with customer service assistant in Q4
"filters" : {
    "and": [
        {"agent_id": "customer_service"},
        {"scene":"Bill"},
        {"create_time": {"gt": "2025-10-01"}},
        {"create_time": {"lt": "2026-01-01"}}
    ]
}
```
