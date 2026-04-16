---
title: MemOS MCP統合ガイド
description: CozeなどのプラットフォームでMemOSのMCPサービスを設定し、エージェントと記憶システムのシームレスな統合を実現
---

本ガイドは、CozeスペースなどのプラットフォームでMemOSのMCPサービスを設定し、エージェントと記憶システムのシームレスな統合を実現するのに役立ちます。

## MCPデプロイ方式の選択

MemOSは2種類のMCPデプロイ方式を提供しており、実際の要件に応じて選択できます：

### MemOSクラウドサービスを使用（推奨）

迅速に接続したい場合で、サーバーを自分でデプロイする必要がない場合は、MemOS公式クラウドサービスの使用を推奨します。

**利点：**
- ✅ すぐに使え、デプロイ不要
- ✅ 高可用性を保証
- ✅ 自動スケーリングと保守
- ✅ 複数のクライアントをサポート（Claude、Cursor、Clineなど）

**設定方法：**

詳細な設定説明については、[MemOSクラウドサービスMCP設定ガイド](https://memos-docs.openmem.net/cn/mcp_agent/mcp/guide) を参照してください。

主な手順：
1. [MemOS APIコンソール](https://memos-dashboard.openmem.net/cn/apikeys/) でアカウントを登録し、API Keyを取得
2. MCPクライアントで `@memtensor/memos-api-mcp` サービスを設定
3. 環境変数を設定（`MEMOS_API_KEY`、`MEMOS_USER_ID`、`MEMOS_CHANNEL`）

### MCPサービスを自分でデプロイ

プライベートデプロイまたはカスタマイズ要件が必要な場合は、自分のサーバーにMCPサービスをデプロイできます。

**利点：**
- ✅ データを完全にプライベート化
- ✅ カスタマイズ可能な設定
- ✅ サービスを完全に制御
- ✅ 企業内利用に適する

**前提要件：**
- Python 3.9+
- Neo4jデータベース（またはその他のサポートされているグラフデータベース）
- HTTPSドメイン（Cozeなどのプラットフォーム用）

詳細なデプロイ手順については、以下の内容を読み進めてください。

---

## 自前デプロイMCPサービス設定

以下の内容は、自分でMCPサービスをデプロイする必要があるユーザーに適用されます。

## アーキテクチャの説明

自前デプロイのMCPサービスは以下のアーキテクチャを採用します：

```
クライアント(Coze/Claudeなど) 
    ↓ [HTTPS]
MCPサーバー(8002ポート)
    ↓ [HTTP呼び出し]
Server API(8001ポート)
    ↓
MemOSコアサービス
```

**コンポーネントの説明：**
- **Server API**: REST APIインターフェース（`/product/*`）を提供し、記憶の作成・削除・更新・検索を処理
- **MCPサーバー**: HTTP転送を通じてMCPプロトコルを公開し、Server APIを呼び出して操作を完了
- **HTTPSリバースプロキシ**: CozeなどのプラットフォームではHTTPSセキュア接続の使用が必要

::steps{level="3"}

### ステップ1: Server APIを起動する

Server APIはMCPサービスのバックエンドであり、実際の記憶管理機能を提供します。

```bash
cd /path/to/MemOS
python src/memos/api/server_api.py --port 8001
```

Server APIが正常に実行されているかを確認します：

```bash
curl http://localhost:8001/docs
```

APIドキュメントページが返された場合、起動成功を示します。

::note
**設定ファイル**<br>
Server APIは自動的に設定を読み込みます。Neo4jなどの依存サービスが正しく設定されていることを確認してください。設定例は `examples/data/config/tree_config_shared_database.json` を参照できます。
::

### ステップ2: MCP HTTPサービスを起動

別のターミナルでMCPサービスを起動します：

```bash
cd /path/to/MemOS
python examples/mem_mcp/simple_fastmcp_serve.py --transport http --port 8002
```

MCPサービスの起動後、以下のような情報が表示されます：

```
╭──────────────────────────────────────────────────╮
│       MemOS MCP via Server API                   │
│       Transport:   HTTP                          │
│       Server URL:  http://localhost:8002/mcp     │
╰──────────────────────────────────────────────────╯
```

**環境変数の設定（任意）：**

`.env`ファイルまたは環境変数でServer APIアドレスを設定できます：

```bash
export MEMOS_API_BASE_URL="http://localhost:8001/product"
```

::note
**ツール一覧**<br>
MCPサービスは以下のツールを提供します：
- `add_memory`: 記憶を追加
- `search_memories`: 記憶を検索
- `chat`: 記憶システムと対話

完全なツール一覧は `examples/mem_mcp/simple_fastmcp_serve.py` を参照
::

### ステップ3: HTTPSリバースプロキシを設定

CozeなどのプラットフォームではHTTPS接続の使用が必要です。HTTPSリバースプロキシ（Nginxなど）を設定して、トラフィックをMCPサービスに転送する必要があります。

**Nginx設定例：**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /mcp {
        proxy_pass http://localhost:8002/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSEサポート
        proxy_buffering off;
        proxy_cache off;
    }
}
```

::warning
**HTTPS証明書**<br>
有効なSSL証明書を使用していることを確認してください。自己署名証明書はCozeなどのプラットフォームで受け入れられない可能性があります。Let's Encryptを使用して無料で証明書を取得できます。
::

### ステップ4: MCPサービスをテスト

クライアントのテストスクリプトを使用してサービスを検証します：

```bash
cd /path/to/MemOS
python examples/mem_mcp/simple_fastmcp_client.py
```

成功時の出力例：

```
Working FastMCP Client
========================================
Connected to MCP server

  1. Adding memory...
    Result: Memory added successfully
  
  2. Searching memories...
    Result: [検索結果]
  
  3. Chatting...
    Result: [AI応答]

✓ All tests completed!
```

::

## CozeスペースでMCPを設定

サービスのデプロイ完了後、CozeスペースでMCP接続を設定します。

::steps{level="3"}

### ステップ1: Cozeスペースを開いてツール設定ページに入る

![Cozeスペース設定ページ](https://statics.memtensor.com.cn/memos/coze_space_1.png)

### ステップ2: カスタムMCPツールを追加する

ツール設定ページでカスタムツールを追加します：

![カスタムツールを追加](https://statics.memtensor.com.cn/memos/coze_space_2.png)

### ステップ3: MCP接続アドレスを設定する

MCP接続URLを設定し、設定したHTTPSアドレスを使用します：

```
https://your-domain.com/mcp
```
利用可能なMCPツール：
- **add_memory**: 新しいメモリを追加
- **search_memories**: 既存のメモリを検索  
- **chat**: メモリに基づく対話

::note
**接続をテスト**<br>
設定完了後、CozeでMCP接続が正常かどうかをテストします。各ツールを正常に呼び出せることを確認してください。
::

::

---

## REST APIを直接使用する（上級）

より柔軟な統合が必要なシナリオでは、Server APIのRESTインターフェースを直接使用できます。

::steps{level="3"}

### ステップ1: Server APIを起動する

```bash
cd /path/to/MemOS
python src/memos/api/server_api.py --port 8001
```
**ポートの説明**
- Server APIはデフォルトで8001ポートで実行されます
- `/product/*` REST APIエンドポイントを提供します

### ステップ2: Coze IDEでカスタムツールを設定する

1. Cozeで"IDEプラグイン"作成方式を選択します
2. デプロイしたServer APIサービスへのリクエストを設定します

![Coze IDEプラグイン設定](https://statics.memtensor.com.cn/memos/coze_tools_1.png)

### ステップ3: add_memoryツールを実装する

![add_memory操作を設定](https://statics.memtensor.com.cn/memos/coze_tools_2.png)

**コード例：** IDEで`add_memory`操作を設定して公開します：

![add_memory操作を設定](https://statics.memtensor.com.cn/memos/coze_tools_2.png)
詳細なコードは以下のとおりです

```python 
import json
import requests
from runtime import Args
from typings.add_memory.add_memory import Input, Output

def handler(args: Args[Input])->Output:
    memory_content = args.input.memory_content
    user_id = args.input.user_id
    cube_id = args.input.cube_id
    
    # Server APIのaddインターフェースを呼び出す
    url = "https://your-domain.com:8001/product/add"
    payload = json.dumps({
        "user_id": user_id,
        "messages": memory_content,  # 文字列またはメッセージ配列をサポート
        "writable_cube_ids": [cube_id] if cube_id else None
    })
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, data=payload, timeout=30)
    response.raise_for_status()
    
    return response.json()
```

**その他のツール実装：**

同様にsearchおよびchatツールを実装します：

```python
# Searchツール
def search_handler(args: Args[Input]) -> Output:
    url = "https://your-domain.com:8001/product/search"
    payload = json.dumps{
        "user_id": args.input.user_id,
        "query": args.input.query,
    })
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, data=payload, timeout=30)
    response.raise_for_status()
    
    return response.json()

# Chatツール
def chat_handler(args: Args[Input]) -> Output:
    url = "https://your-domain.com:8001/product/chat/complete"
    payload = json.dumps({
        "user_id": args.input.user_id,
        "query": args.input.query
    })
    response = requests.post(url, json=payload, timeout=30)
    return response.json()
```

### ステップ4: ツールを公開してテストする

公開完了後、"マイリソース"でプラグインを確認できます：

![公開後のプラグインリソース](https://statics.memtensor.com.cn/memos/coze_tools_3.png)

### ステップ5: エージェントワークフローに統合する

プラグインをエージェントワークフローに追加します：

1. 新しいエージェントを作成するか、既存のエージェントを編集します
2. ツールリストで公開済みのMemOSプラグインを追加します
3. ワークフローを設定し、メモリツールを呼び出します
4. メモリ保存と検索機能をテストします

::

---

## よくある質問

### Q1: MCPサービスがServer APIに接続できない

**解決策：**
- Server APIが正常に実行されているか確認します：`curl http://localhost:8001/docs`
- 環境変数`MEMOS_API_BASE_URL`の設定が正しいか確認します
- MCPサービスのログを確認し、呼び出しアドレスを確認します

### Q2: CozeがMCPサービスに接続できない

**解決策：**
- HTTPS接続を使用していることを確認します
- SSL証明書が有効か確認します
- リバースプロキシ設定をテストします：`curl https://your-domain.com/mcp`
- ファイアウォールとセキュリティグループの設定を確認します

### Q3: Neo4j接続に失敗する

**解決策：**
- Neo4jサービスが正常に実行されていることを確認します
- 設定ファイル内の接続情報（uri、user、password）を確認します
- `examples/data/config/tree_config_shared_database.json` の設定例を参照してください

### Q4: 完全なAPIサンプルを確認するには？

**参照ファイル：**
- MCPサーバー側: `examples/mem_mcp/simple_fastmcp_serve.py`
- MCPクライアント側: `examples/mem_mcp/simple_fastmcp_client.py`
- APIテスト: `examples/api/server_router_api.py`

---

## まとめ

このガイドを通じて、以下が可能です：
- ✅ 適切なMCPデプロイ方式を選択する（クラウドサービスまたはセルフデプロイ）
- ✅ MCPサービスの完全なデプロイ手順を完了する
- ✅ CozeなどのプラットフォームでMemOSメモリ機能を統合する
- ✅ REST APIを使用して直接統合する

どの方式を選択しても、MemOSはあなたのエージェントに強力なメモリ管理ders=headers, data=payload)
    return json.loads(response.text)

::note
**APIパラメータの説明**
- Server APIの標準パラメータ形式を使用
- `messages`: 元の `memory_content` を置き換え、文字列またはメッセージ配列をサポート
- `writable_cube_ids`: 元の `mem_cube_id` を置き換え、複数のcubeをサポート
- Server APIは8001ポートで動作し、パスは `/product/add`
- MemOS Server APIインターフェースとの一貫性を確保し、`examples/api/server_router_api.py` 内のサンプルを参照可能
**IDE設定**<br>IDEではツールのパラメータ、戻り値の形式などをカスタマイズでき、MemOS APIインターフェースとの一貫性を確保します。 この方法を採用して search インターフェースおよびユーザー登録インターフェースの作成を完了し、公開をクリックします
::

### プラグインを公開して使用

公開完了後、"マイリソース"でプラグインを確認でき、プラグイン形式でエージェントのワークフローに統合できます：

![公開後のプラグインリソース](https://statics.memtensor.com.cn/memos/coze_tools_3.png)

### エージェントを構築してテスト

最も簡易なエージェントを構築した後、メモリ操作テストを実行できます：

1. 新しいエージェントを作成
2. 公開済みのメモリプラグインを追加
3. ワークフローを設定
4. メモリの保存および検索機能をテスト

以上の設定により、Coze空間でMemOSのメモリ機能を正常に統合し、エージェントに強力なメモリ能力を提供できます。
