---
title: Common Errors and Solutions
---

## Configuration Errors

### Missing Required Fields

```python
# ✅ Always include required fields
llm_config = {
    "backend": "openai",
    "config": {
        "api_key": "your-api-key",
        "model_name_or_path": "gpt-4"
    }
}
```

### Backend Mismatch

```python
# ✅ KVCache requires HuggingFace backend
kv_config = {
    "backend": "kv_cache",
    "config": {
        "extractor_llm": {
            "backend": "huggingface",
            "config": {
                "model_name_or_path": "Qwen/Qwen3-1.7B"
            }
        }
    }
}
```
## Service Connection Issues
```bash
# Start required services as needed
docker run -p 6333:6333 qdrant/qdrant
ollama serve
```

### Memory Loading Failures

```python
try:
    mem_cube.load("memory_dir")
except Exception:
    mem_cube = GeneralMemCube(config)
    mem_cube.dump("memory_dir")
```

### GPU Out Of Memory
```python
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
# Use smaller models if GPU memory is limited: Qwen/Qwen3-0.6B
```

## User Management

```python
# Register user first
mos.register_mem_cube(cube_path="path", user_id="user_id", cube_id="cube_id")

# Check if user exists
try:
    user_id = mos.create_user(user_name="john", role=UserRole.USER)
except ValueError:
    user = mos.user_manager.get_user_by_name("john")
```

**Common Causes and Checklist**:

1.  **Docker Container Not Started**:
    Ensure you have run the necessary middleware containers.
    ```bash
    docker ps
    # Check if neo4j and qdrant containers are running
    ```

2.  **Port Not Mapped**:
    Check if the `docker run` command includes the `-p` parameter.
    *   Qdrant needs to expose `6333` (gRPC/HTTP)
    *   Neo4j needs to expose `7474` (HTTP) and `7687` (Bolt)

3.  **Neo4j Authentication Failed**:
    MemOS default configuration typically uses `neo4j/password` or `neo4j/neo4j`.
    Please check your environment variables or configuration file:
    ```bash
    export NEO4J_PASSWORD="your_actual_password"
    ```
    *Note: Neo4j requires changing the default password on first startup. Ensure you have completed this step in the browser (http://localhost:7474).*

## 2. Model Service Errors

### Ollama Connection Failed

**Symptom**:
Error `Connection refused` when connecting to `localhost:11434`, or prompts indicating the model does not exist.

**Solution**:

1.  **Start the Service**: Ensure `ollama serve` is running in the terminal.
2.  **Pull the Model**: MemOS's `OllamaEmbedder` will attempt to check for the local model and try to pull it if it doesn't exist, but it's recommended to do it manually to ensure success:
    ```bash
    ollama pull nomic-embed-text
    ```
3.  **Address Issue**: If MemOS is running in Docker, `localhost` points to inside the container. You need to configure `api_base` using `host.docker.internal` (Mac/Windows) or the host machine's IP (Linux).

## 3. Configuration Errors

### Missing Required Fields

```python
# ✅ Always include required fields
llm_config = {
    "backend": "openai",
    "config": {
        "api_key": "your-api-key",
        "model_name_or_path": "gpt-4"
    }
}
```

### Backend Mismatch

```python
# ✅ KVCache needs to use the HuggingFace backend
# Refer to src/memos/memories/activation/kv.py
kv_config = {
    "backend": "kv_cache",
    "config": {
        "extractor_llm": {
            "backend": "huggingface",
            "config": {
                "model_name_or_path": "Qwen/Qwen3-1.7B"
            }
        }
    }
}
```

## 4. Runtime Resource Issues

### Memory Loading Failed (Schema Mismatch)

**Symptom**:
`mem_cube.load()` reports an error, usually due to JSON file structure incompatibility with the current code version.

**Solution**:
Reinitialize the MemCube and overwrite old data (note the risk of data loss):

```python
try:
    mem_cube.load("memory_dir")
except Exception:
    logger.warning("Loading failed, initializing new memory cube")
    mem_cube = GeneralMemCube(config)
    # Proceed with caution: This will overwrite old data
    mem_cube.dump("memory_dir")
```

### GPU VRAM Insufficient

**Solution**:
Use `CUDA_VISIBLE_DEVICES` to specify the GPU, or switch to a smaller model (e.g., 0.5B/1.5B version).

```python
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
```

## 5. Common User Management Issues

**Symptom**:
Calling `get_user` returns None or reports an error.

**Solution**:
MemOS requires an explicit user registration process.

```python
# 1. Register MemCube to a specific user
mos.register_mem_cube(cube_path="path", user_id="user_id", cube_id="cube_id")

# 2. Create or get a user
try:
    # Attempt to create a user
    user_id = mos.create_user(user_name="john", role=UserRole.USER)
except ValueError:
    # If the user already exists, get them
    user = mos.user_manager.get_user_by_name("john")
```
