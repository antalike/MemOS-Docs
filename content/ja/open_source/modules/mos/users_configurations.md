---
title: MemOS設定ガイド
desc: このドキュメントでは、MemOSシステム内の異なるコンポーネントにおけるすべての設定フィールドと初期化方法を包括的に概説します.
---

1. [設定概要](#configuration-overview)
2. [MOS設定](#mos-configuration)
3. [LLM設定](#llm-configuration)
4. [MemReader設定](#memreader-configuration)
5. [MemCube設定](#memcube-configuration)
6. [メモリ設定](#memory-configuration)
7. [埋め込み器設定](#embedder-configuration)
8. [ベクトルデータベース設定](#vector-database-configuration)
9. [グラフデータベース設定](#graph-database-configuration)
10. [スケジューラー設定](#scheduler-configuration)
11. [初期化方法](#initialization-methods)
12. [設定例](#configuration-examples)

## 設定概要

MemOSは、異なるバックエンドファクトリパターンを持つ階層型設定システムを使用します。各コンポーネントには以下があります:
- 基本設定クラス
- バックエンド固有の設定クラス
- バックエンドに基づいて適切な設定を作成するファクトリクラス

## MOS設定

すべてのコンポーネントを調整するメインの MOS 設定

### MOSConfig フィールド

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `user_id` | str | "root" | MOSのユーザーID。この設定のユーザーIDがデフォルト値として使用されます |
| `session_id` | str | UUIDを自動生成 | MOSのセッションID |
| `chat_model` | LLMConfigFactory | 必須 | チャット用のLLM設定 |
| `mem_reader` | MemReaderConfigFactory | 必須 | MemReader設定 |
| `mem_scheduler` | SchedulerFactory | 任意 | スケジューラー設定 |
| `max_turns_window` | int | 15 | 保持する最大対話回数 |
| `top_k` | int | 5 | 各クエリで取得する最大メモリ数 |
| `enable_textual_memory` | bool | True | プレーンテキストメモリを有効化 |
| `enable_activation_memory` | bool | False | アクティベーションメモリを有効化 |
| `enable_parametric_memory` | bool | False | パラメトリックメモリを有効化 |
| `enable_mem_scheduler` | bool | False | メモリスケジューリングを有効化 |


### MOS設定例

```json
{
  "user_id": "root",
  "chat_model": {
    "backend": "huggingface",
    "config": {
      "model_name_or_path": "Qwen/Qwen3-1.7B",
      "temperature": 0.1,
      "remove_think_prefix": true,
      "max_tokens": 4096
    }
  },
  "mem_reader": {
    "backend": "simple_struct",
    "config": {
      "llm": {
        "backend": "ollama",
        "config": {
          "model_name_or_path": "qwen3:0.6b",
          "temperature": 0.8,
          "max_tokens": 1024,
          "top_p": 0.9,
          "top_k": 50
        }
      },
      "embedder": {
        "backend": "ollama",
        "config": {
          "model_name_or_path": "nomic-embed-text:latest"
        }
      },
    "chunker": {
      "backend": "sentence",
      "config": {
        "tokenizer_or_token_counter": "gpt2",
        "chunk_size": 512,
        "chunk_overlap": 128,
        "min_sentences_per_chunk": 1
      }
    }
    }
  },
  "max_turns_window": 20,
  "top_k": 5,
  "enable_textual_memory": true,
  "enable_activation_memory": false,
  "enable_parametric_memory": false
}
```

## LLM設定

異なるLLMバックエンドの設定

### 基本LLMフィールド

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `model_name_or_path` | str | 必須 | モデル名またはパス |
| `temperature` | float | 0.8 | サンプリング温度 |
| `max_tokens` | int | 1024 | 生成する最大token数 |
| `top_p` | float | 0.9 | Top-pサンプリングパラメータ |
| `top_k` | int | 50 | Top-k サンプリングパラメータ |
| `remove_think_prefix` | bool | False | 出力からthinkタグを削除 |

### バックエンド固有フィールド

#### OpenAI LLM
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `api_key` | str | 必須 | OpenAI API key |
| `api_base` | str | "https://api.openai.com/v1" | OpenAI API base URL |

#### Ollama LLM
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `api_base` | str | "http://localhost:11434" | Ollama API base URL |

#### HuggingFace LLM
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `do_sample` | bool | False | サンプリングVS貪欲デコーディングを使用 |
| `add_generation_prompt` | bool | True | 生成テンプレートを適用 |

### LLM設定例

```json
// OpenAI
{
  "backend": "openai",
  "config": {
    "model_name_or_path": "gpt-4o",
    "temperature": 0.8,
    "max_tokens": 1024,
    "top_p": 0.9,
    "top_k": 50,
    "api_key": "sk-...",
    "api_base": "https://api.openai.com/v1"
  }
}

// Ollama
{
  "backend": "ollama",
  "config": {
    "model_name_or_path": "qwen3:0.6b",
    "temperature": 0.8,
    "max_tokens": 1024,
    "top_p": 0.9,
    "top_k": 50,
    "api_base": "http://localhost:11434"
  }
}

// HuggingFace
{
  "backend": "huggingface",
  "config": {
    "model_name_or_path": "Qwen/Qwen3-1.7B",
    "temperature": 0.1,
    "remove_think_prefix": true,
    "max_tokens": 4096,
    "do_sample": false,
    "add_generation_prompt": true
  }
}
```

## MemReader設定

メモリ読み取りコンポーネントの設定

### 基本MemReaderフィールド

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `created_at` | datetime | 自動生成 | 作成タイムスタンプ |
| `llm` | LLMConfigFactory | 必須 | LLM設定 |
| `embedder` | EmbedderConfigFactory | 必須 | 埋め込み器設定 |
| `chunker` | chunkerConfigFactory | 必須 | チャンク設定 |

### Backend Types

- `simple_struct`: 構造化メモリリーダー

### MemReader設定例

```json
{
  "backend": "simple_struct",
  "config": {
    "llm": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.0,
        "remove_think_prefix": true,
        "max_tokens": 8192
      }
    },
    "embedder": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "nomic-embed-text:latest"
      }
    },
    "chunker": {
      "backend": "sentence",
      "config": {
        "tokenizer_or_token_counter": "gpt2",
        "chunk_size": 512,
        "chunk_overlap": 128,
        "min_sentences_per_chunk": 1
      }
    }
  }
}
```

## MemCube設定

メモリキューブコンポーネント設定

### GeneralMemCubeConfig フィールド

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `user_id` | str | "default_user" | MemCubeのユーザーID |
| `cube_id` | str | UUIDを自動生成 | MemCubeのキューブID |
| `text_mem` | MemoryConfigFactory | 必須 | プレーンテキストメモリ設定 |
| `act_mem` | MemoryConfigFactory | 必須 | アクティベーションメモリ設定 |
| `para_mem` | MemoryConfigFactory | 必須 | パラメトリックメモリ設定 |

### 許可されるバックエンド

- **プレーンテキストメモリ**: `naive_text`, `general_text`, `tree_text`, `uninitialized`
- **アクティベーションメモリ**: `kv_cache`, `uninitialized`
- **パラメトリックメモリ**: `lora`, `uninitialized`

### MemCube設定例

```json
{
  "user_id": "root",
  "cube_id": "root/mem_cube_kv_cache",
  "text_mem": {},
  "act_mem": {
    "backend": "kv_cache",
    "config": {
      "memory_filename": "activation_memory.pickle",
      "extractor_llm": {
        "backend": "huggingface",
        "config": {
          "model_name_or_path": "Qwen/Qwen3-1.7B",
          "temperature": 0.8,
          "max_tokens": 1024,
          "top_p": 0.9,
          "top_k": 50,
          "add_generation_prompt": true,
          "remove_think_prefix": false
        }
      }
    }
  },
  "para_mem": {
    "backend": "lora",
    "config": {
      "memory_filename": "parametric_memory.adapter",
      "extractor_llm": {
        "backend": "huggingface",
        "config": {
          "model_name_or_path": "Qwen/Qwen3-1.7B",
          "temperature": 0.8,
          "max_tokens": 1024,
          "top_p": 0.9,
          "top_k": 50,
          "add_generation_prompt": true,
          "remove_think_prefix": false
        }
      }
    }
  }
}
```

## メモリ設定

異なるタイプのメモリシステムを設定

### 基本メモリフィールド

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `cube_id` | str | None | 一意の MemCube 識別子。デフォルトでは cube_name または path にできます |

### プレーンテキストメモリ設定

#### 基本プレーンテキストメモリ
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `memory_filename` | str | "textual_memory.json" |  メモリを保存するファイル名 |

#### 純粋プレーンテキストメモリ（テキストのみ）
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | 必須 | メモリ抽出用のLLM |

#### 汎用プレーンテキストメモリ（ベクトルインデックス付き）
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | 必須 | メモリ抽出用のLLM |
| `vector_db` | VectorDBConfigFactory | 必須 | ベクトルデータベース設定 |
| `embedder` | EmbedderConfigFactory | 必須 | 埋め込み器設定 |

#### ツリー型プレーンテキストメモリ
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | 必須 | メモリ抽出用のLLM |
| `dispatcher_llm` | LLMConfigFactory | 必須 | メモリスケジューリング用のLLM |
| `embedder` | EmbedderConfigFactory | 必須 | 埋め込み器設定 |
| `graph_db` | GraphDBConfigFactory | 必須 | グラフデータベース設定 |

### アクティベーションメモリ設定

#### 基本アクティベーションメモリ
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `memory_filename` | str | "activation_memory.pickle" | メモリを保存するファイル名 |

#### KV Cacheメモリ
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | 必須 | LLMは記憶抽出に使用されます (must be huggingface) |

### Parametric Memory Configuration

#### Basic Parametric Memory
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `memory_filename` | str | "parametric_memory.adapter" | 記憶を保存するファイル名 |

#### LoRA Memory
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `extractor_llm` | LLMConfigFactory | 必須 | LLMは記憶抽出に使用されます (must be huggingface) |

### Memory Configuration Examples

```json
// ツリー状プレーンテキスト記憶
{
  "backend": "tree_text",
  "config": {
    "memory_filename": "tree_memory.json",
    "extractor_llm": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.0,
        "remove_think_prefix": true,
        "max_tokens": 8192
      }
    },
    "dispatcher_llm": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.0,
        "remove_think_prefix": true,
        "max_tokens": 8192
      }
    },
    "embedder": {
      "backend": "ollama",
      "config": {
        "model_name_or_path": "nomic-embed-text:latest"
      }
    },
    "graph_db": {
      "backend": "neo4j",
      "config": {
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "12345678",
        "db_name": "user08alice",
        "auto_create": true,
        "embedding_dimension": 768
      }
    }
  }
}
```

## Embedder Configuration

埋め込みモデル設定

### Basic Embedder Fields

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `model_name_or_path` | str | 必須 | モデル名またはパス |
| `embedding_dims` | int | None | 埋め込み次元数 |

### Backend-Specific Fields

#### Ollama Embedder
| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `api_base` | str | "http://localhost:11434" | Ollama API base URL |

#### Sentence Transformer Embedder
基本設定以外に追加のフィールドはありません。

### Embedder Configuration Examples

```json
// Ollama 埋め込み器
{
  "backend": "ollama",
  "config": {
    "model_name_or_path": "nomic-embed-text:latest",
    "api_base": "http://localhost:11434"
  }
}

// Sentence Transformer 埋め込み器
{
  "backend": "sentence_transformer",
  "config": {
    "model_name_or_path": "all-MiniLM-L6-v2",
    "embedding_dims": 384
  }
}
```

## Vector Database Configuration

ベクトルデータベースを設定します

### Basic Vector Database Fields

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `collection_name` | str | 必須 | コレクション名 |
| `vector_dimension` | int | None | ベクトル次元 |
| `distance_metric` | str | None | 距離メトリック (コサイン, ユークリッド, 内積) |

### Qdrant Vector Database Fields

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `host` | str | None | Qdrantホスト |
| `port` | int | None | Qdrantポート |
| `path` | str | None | Qdrantローカルパス |

### Vector Database Configuration Example

```json
{
  "backend": "qdrant",
  "config": {
    "collection_name": "memories",
    "vector_dimension": 768,
    "distance_metric": "cosine",
    "path": "/path/to/qdrant"
  }
}
```

## Graph Database Configuration

グラフデータベースを設定します

### Basic Graph Database Fields

| Field | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `uri` | str | 必須 | データベースURI |
| `user` | str | 必須 | データベースユーザー名 |
| `password` | str | 必須 | データベースパスワード |

### Neo4j Graph Database Fields

| Field | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `db_name` | str | 必須 | 対象データベース名 |
| `auto_create` | bool | False | 存在しない場合、データベースを作成します |
| `embedding_dimension` | int | 768 | ベクトル埋め込み次元 |

### Graph Database Configuration Example

```json
{
  "backend": "neo4j",
  "config": {
    "uri": "bolt://localhost:7687",
    "user": "neo4j",
    "password": "12345678",
    "db_name": "user08alice",
    "auto_create": true,
    "embedding_dimension": 768
  }
}
```

## Scheduler Configuration

記憶の取得とアクティベーションを管理する記憶スケジューリングシステムの設定

### Basic Scheduler Fields

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `top_k` | int | 10 | 初期取得で考慮する候補記憶の数 |
| `top_n` | int | 5 | 処理後に返される最終結果数 |
| `enable_parallel_dispatch` | bool | True | スレッドプールを使用して並列メッセージ処理を有効にするかどうか |
| `thread_pool_max_workers` | int | 5 | スレッドプール内の最大スレッド数(1-20) |
| `consume_interval_seconds` | int | 3 | キューからメッセージを消費する間隔（秒単位）(0-60) |

### General Scheduler Fields

| フィールド | 型 | デフォルト値 | 説明 |
|-------|------|---------|-------------|
| `act_mem_update_interval` | int | 300 | アクティブ記憶を更新する時間間隔（秒） |
| `context_window_size` | int | 5 | 会話履歴のコンテキストウィンドウのサイズ |
| `activation_mem_size` | int | 5 | アクティブ記憶のサイズ |
| `act_mem_dump_path` | str | 自動生成 | アクティブ記憶保存用のファイルパス |

### Backend Types

- `general_scheduler`: アクティブ記憶管理を備えた高度なスケジューラ

### Scheduler Configuration Example

```json
{
  "backend": "general_scheduler",
  "config": {
    "top_k": 10,
    "top_n": 5,
    "act_mem_update_interval": 300,
    "context_window_size": 5,
    "activation_mem_size": 1000,
    "thread_pool_max_workers": 10,
    "consume_interval_seconds": 3,
    "enable_parallel_dispatch": true
  }
}
```

## Initialization Methods

### From a JSON File

```python
from memos.configs.mem_os import MOSConfig

# JSONファイルから設定を読み込む
mos_config = MOSConfig.from_json_file("path/to/config.json")
```

### From a Dictionary

```python
from memos.configs.mem_os import MOSConfig

# 辞書から設定を作成する
config_dict = {
    "user_id": "root",
    "chat_model": {
        "backend": "huggingface",
        "config": {
            "model_name_or_path": "Qwen/Qwen3-1.7B",
            "temperature": 0.1
        }
    }
    # ... other fields
}

mos_config = MOSConfig(**config_dict)
```

### Factory Pattern Usage

```python
from memos.configs.llm import LLMConfigFactory

# ファクトリパターンを使用してLLM設定を作成
llm_config = LLMConfigFactory(
    backend="huggingface",
    config={
        "model_name_or_path": "Qwen/Qwen3-1.7B",
        "temperature": 0.1
    }
)
```

## Configuration Examples

### 完全な MOS の作成

```python
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS

# 設定を読み込む
mos_config = MOSConfig.from_json_file("examples/data/config/simple_memos_config.json")

# MOS を初期化する
mos = MOS(mos_config)

# ユーザーを作成して MemCube を登録する
user_id = "user_123"
mos.create_user(user_id=user_id)
mos.register_mem_cube("path/to/mem_cube", user_id=user_id)

# MOS を使用する
response = mos.chat("Hello, how are you?", user_id=user_id)
```

### ツリー メモリ設定

```python
from memos.configs.memory import MemoryConfigFactory

# ツリー メモリ設定を作成する
tree_memory_config = MemoryConfigFactory(
    backend="tree_text",
    config={
        "memory_filename": "tree_memory.json",
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b",
                "temperature": 0.0,
                "max_tokens": 8192
            }
        },
        "dispatcher_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b",
                "temperature": 0.0,
                "max_tokens": 8192
            }
        },
        "embedder": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "nomic-embed-text:latest"
            }
        },
        "graph_db": {
            "backend": "neo4j",
            "config": {
                "uri": "bolt://localhost:7687",
                "user": "neo4j",
                "password": "password",
                "db_name": "memories",
                "auto_create": True,
                "embedding_dimension": 768
            }
        }
    }
)
```

### マルチバックエンド LLM 設定

```python
from memos.configs.llm import LLMConfigFactory

# OpenAI 設定
openai_config = LLMConfigFactory(
    backend="openai",
    config={
        "model_name_or_path": "gpt-4o",
        "temperature": 0.8,
        "max_tokens": 1024,
        "api_key": "sk-...",
        "api_base": "https://api.openai.com/v1"
    }
)

# Ollama 設定
ollama_config = LLMConfigFactory(
    backend="ollama",
    config={
        "model_name_or_path": "qwen3:0.6b",
        "temperature": 0.8,
        "max_tokens": 1024,
        "api_base": "http://localhost:11434"
    }
)

# HuggingFace 設定
hf_config = LLMConfigFactory(
    backend="huggingface",
    config={
        "model_name_or_path": "Qwen/Qwen3-1.7B",
        "temperature": 0.1,
        "remove_think_prefix": True,
        "max_tokens": 4096,
        "do_sample": False,
        "add_generation_prompt": True
    }
)
```

この包括的な設定システムにより、異なるバックエンドとコンポーネントに対して柔軟で拡張可能な MemOS システム設定が可能になります
