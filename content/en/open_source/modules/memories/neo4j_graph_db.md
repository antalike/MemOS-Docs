---
title: Graph Memory Backend
desc: "This module provides graph-based memory storage and querying for memory-augmented systems such as RAG, cognitive agents, or personal memory assistants. <br/>It defines a clean abstraction (`BaseGraphDB`) and includes a production-ready implementation using **Neo4j**."
---

## Why Graph for Memory?

Unlike flat vector stores, a graph database allows:

- Structuring memory into **chains, hierarchies, and causal links**
- Performing **multi-hop reasoning** and **subgraph traversal**
- Supporting memory **deduplication, conflict detection, and scheduling**
- Dynamically evolving a memory graph over time

This forms the backbone of long-term, explainable, and compositional memory reasoning.

## Features

- Unified interface across different graph databases
- Built-in support for Neo4j
- Support for vector-enhanced retrieval (`search_by_embedding`)
- Modular, pluggable, and testable
- [v0.2.1 New! ] Supports **multi-tenant graph memory architecture** (shared 
  DB, 
  per-user 
  logic)
- [v0.2.1 New! ] Compatible with **Neo4j Community Edition** environments

## Directory Structure

```

src/memos/graph_dbs/
├── base.py            # Abstract interface: BaseGraphDB
├── factory.py         # Factory to instantiate GraphDB from config
├── neo4j.py           # Neo4jGraphDB: production implementation

````

## How to Use

```python
from memos.graph_dbs.factory import GraphStoreFactory
from memos.configs.graph_db import GraphDBConfigFactory

# Step 1: Build factory config
config = GraphDBConfigFactory(
    backend="neo4j",
    config={
        "uri": "bolt://localhost:7687",
        "user": "your_neo4j_user_name",
        "password": "your_password",
        "db_name": "memory_user1",
        "auto_create": True,
        "embedding_dimension": 768
    }
)

# Step 2: Instantiate the graph store
graph = GraphStoreFactory.from_config(config)

# Step 3: Add memory
graph.add_node(
    id="node-001",
    memory="Today I learned about retrieval-augmented generation.",
    metadata={"type": "WorkingMemory", "tags": ["RAG", "AI"], "timestamp": "2025-06-05"}
)

# Step 4: Search memory
graph.get_node(id='node-001')
or graph.search_by_embedding()
See neo4j_example.example_complex_shared_db_search_filter for full method docs

# Step 5: Delete memory
db.delete_node(id='node-001')
See neo4j_example.example_complex_shared_db_delete_memory for full method docs
````

## Pluggable Design

### Interface: `BaseGraphDB`

All implementations must implement:

* `add_node`, `update_node`, `delete_node`
* `add_edge`, `delete_edge`, `edge_exists`
* `get_node`, `get_path`, `get_subgraph`, `get_context_chain`
* `search_by_embedding`, `get_by_metadata`
* `deduplicate_nodes`, `detect_conflicts`, `merge_nodes`
* `clear`, `export_graph`, `import_graph`

See src/memos/graph_dbs/base.py for full method docs.

### Current Backend:

| Backend | Status | File       |
| ------- | ------ | ---------- |
| Neo4j   | Stable | `neo4j.py` |

## Shared DB, Multi-Tenant Support

By specifying the `user_name` field, MemOS can isolate memory graphs for multiple users in a single Neo4j database. Ideal for collaborative systems or multi-agent applications:

```python
config = GraphDBConfigFactory(
    backend="neo4j",
    config={
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "your_password",
        "db_name": "shared-graph",
        "user_name": "alice",
        "use_multi_db": False,
        "embedding_dimension": 768,
    },
)
```

User data is logically isolated via the `user_name` field. Filtering is handled automatically during reads, writes, and searches.

:::note
**Example? You bet.**<br>
No blah blah, just go check the code:  
`examples/basic_modules/neo4j_example.example_complex_shared_db(db_name="shared-traval-group-complex-new")`
:::

## Neo4j Community Edition Support

New backend identifier: `neo4j-community`

Usage is similar to standard Neo4j, but disables Enterprise-only features:

- ❌ No support for `auto_create` databases
- ❌ No native vector indexes (uses external engines like Qdrant)
- ✅ Enforces `user_name` logic-based isolation

Example configuration:

```python
config = GraphDBConfigFactory(
    backend="neo4j-community",
    config={
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "12345678",
        "db_name": "paper",
        "user_name": "bob",
        "auto_create": False,
        "embedding_dimension": 768,
        "vec_config": {
            "backend": "qdrant",
            "config": {
                "host": "localhost",
                "port": 6333,
                "collection_name": "neo4j_vec_db",
                "vector_dimension": 768
            },
        },
    },
)
```

:::note
**Example? You bet.**<br>
No blah blah, just go check the code:  
`examples/basic_modules/neo4j_example.example_complex_shared_db(db_name="paper", community=True)`
:::

## Extending

You can add support for any other graph engine (e.g., **TigerGraph**, **DGraph**, **Weaviate hybrid**) by:

1. Subclassing `BaseGraphDB`
2. Creating a config dataclass (e.g., `DgraphConfig`)
3. Registering it in:

   * `GraphDBConfigFactory.backend_to_class`
   * `GraphStoreFactory.backend_to_class`

See `src/memos/graph_dbs/neo4j.py` as a reference implementation.
