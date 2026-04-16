---
title: よくあるエラーと解決策
---

## 1. データベースとベクトル関連エラー

### Embedding 次元不一致

**現象**：
Embedding モデルを変更した後（例えば `openai` から `ollama` に切り替えた後）、システムがエラーを報告するか、検索効果が非常に悪くなります。
ログには `Dimension mismatch` または Qdrant 関連の `Wrong input vector size` エラーが現れる場合があります。

**原因**：
Qdrant は Collection を作成する際、設定ファイル内の `vector_dimension` に基づいてベクトル次元を固定します。
*   OpenAI `text-embedding-3-small`: 1536 次元
*   Ollama `nomic-embed-text`: 768 次元
*   BAAI `bge-m3`: 1024 次元

MemOS の `QdrantVecDB` は初期化時に、Collection がすでに存在することを検出すると、作成ステップをスキップします。このとき新しい次元のモデルを使用すると、ベクトル書き込み時にエラーが発生します。

**解決策**：
1.  **Collection 名を変更**：設定ファイル内で `collection_name` を変更し、MemOS に新しい Collection を作成させます。
    ```yaml
    vec_db:
      config:
        collection_name: "memos_v2" # 元の名前は memos_v1
        vector_dimension: 768       # この次元が新しいモデルと一致することを確認
    ```
2.  **古いデータを削除**：開発環境であれば、Qdrant のストレージボリュームを直接削除するか、古い Collection を Drop してください。

### データバックエンドの起動失敗 (Neo4j/Qdrant)

**現象**：
MemOS 起動時に `ConnectionRefusedError`, `ServiceUnavailable` または `AuthError` が報告されます。

**よくある原因とチェックリスト**：

1.  **Docker コンテナが起動していない**：
    必要なミドルウェアコンテナをすでに起動していることを確認してください。
    ```bash
    docker ps
    # neo4j と qdrant コンテナが実行中か確認
    ```

2.  **ポートがマッピングされていない**：
    `docker run` コマンドに `-p` パラメータが含まれているか確認してください。
    *   Qdrant は `6333` (gRPC/HTTP) の公開が必要です
    *   Neo4j は `7474` (HTTP) と `7687` (Bolt) の公開が必要です

3.  **Neo4j 認証失敗**：
    MemOS のデフォルト設定は通常 `neo4j/password` または `neo4j/neo4j` を使用します。
    環境変数または設定ファイルを確認してください：
    ```bash
    export NEO4J_PASSWORD="your_actual_password"
    ```
    *注意：Neo4j は初回起動時にデフォルトパスワードの変更を要求します。ブラウザ (http://localhost:7474) でこの手順を完了していることを確認してください。*

## 2. モデルサービスエラー

### Ollama 接続失敗

**現象**：
`Connection refused` が報告されて `localhost:11434` への接続に失敗する、またはモデルが存在しないと表示されます。

**解決策**：
1.  **サービスを起動**：ターミナルで `ollama serve` を実行していることを確認してください。
2.  **モデルを取得**：MemOS の `OllamaEmbedder` はローカルモデルの確認を試み、存在しない場合は pull を試みますが、成功を確実にするため手動実行を推奨します：
    ```bash
    ollama pull nomic-embed-text
    ```
3.  **アドレスの問題**：Docker で MemOS を実行している場合、`localhost` はコンテナ内部を指します。`host.docker.internal` (Mac/Windows) またはホスト IP (Linux) を使用して `api_base` を設定する必要があります。

## 3. 設定エラー

### 必須フィールドの欠落

```python
# ✅ 常に必須フィールドを含める必要があります
llm_config = {
    "backend": "openai",
    "config": {
        "api_key": "your-api-key",
        "model_name_or_path": "gpt-4"
    }
}
```

### バックエンド不一致

```python
# ✅ KVCache は HuggingFace バックエンドを使用する必要があります
# src/memos/memories/activation/kv.py を参照
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

## 4. 実行時リソースの問題

### メモリロード失敗 (Schema Mismatch)

**現象**：
`mem_cube.load()` がエラーを報告します。通常は JSON ファイル構造が現在のコードバージョンと互換性がないことが原因です。

**解決策**：
MemCube を再初期化して古いデータを上書きします（データ損失リスクに注意）：

```python
try:
    mem_cube.load("memory_dir")
except Exception:
    logger.warning("Loading failed, initializing new memory cube")
    mem_cube = GeneralMemCube(config)
    # 慎重に操作：これは古いデータを上書きします
    mem_cube.dump("memory_dir")
```

### GPU ビデオメモリ不足

**解決策**：
`CUDA_VISIBLE_DEVICES` を使用して GPU を指定するか、より小さいモデル（例：0.5B/1.5B バージョン）に切り替えてください。

```python
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
```

## 5. ユーザー管理のよくある問題

**現象**：
`get_user` を呼び出すと None が返るか、エラーが報告されます。

**解決策**：
MemOS には明確なユーザー登録フローが必要です。

```python
# 1. 特定ユーザーに MemCube を登録
mos.register_mem_cube(cube_path="path", user_id="user_id", cube_id="cube_id")

# 2. ユーザーを作成または取得
try:
    # ユーザーの作成を試行
    user_id = mos.create_user(user_name="john", role=UserRole.USER)
except ValueError:
    # ユーザーがすでに存在する場合は取得
    user = mos.user_manager.get_user_by_name("john")
```
