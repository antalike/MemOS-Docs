---
title: 統一チャットインターフェース（Chat API）——セマンティック検索、質問応答と記憶管理
desc: 本章では、統一されたチャットインターフェースを紹介し、AI 開発者が1つのインターフェースを通じてセマンティック検索、対話型質問応答、記憶追加を完了できるようにします。インターフェースはシンプルなフローに従います：まず記憶を検索し、次に LLM と対話し、最後に現在のターンの対話を記憶に書き込みます。ストリーミングおよび非ストリーミングの呼び出し例を提供し、迅速な統合と利用を容易にします。
---

## Chapter 5: Chat API

**🎯 問題シナリオ：** あなたはAIアプリケーション開発者ですが、記憶検索、質問応答、記憶追加のフローを自分で開発したくありません。

**🔧 ソリューション：** 私たちは統一されたチャットインターフェースを提供しており、ユーザーはこれを通じてセマンティック検索、対話型質問応答、記憶追加を完了でき、複数のインターフェースを個別に呼び出す必要はありません。

**🔧 実行フロー：** 実行フローは以下のとおりです：
```markdown
A[ユーザーのクエリ] --> B[記憶を検索] --> C[LLMチャット] --> D[記憶を追加]
```

### 具体的なステップ
#### ステップ1：MemOS APIサービスを起動する
まず、.env であなたのChat Model Listを設定する必要があります
```dotenv
CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "xxx", "model_name_or_path": "qwen2.5-72b-instruct", "support_models": ["qwen2.5-72b-instruct"]}, {"backend": "deepseek", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "xxx", "model_name_or_path": "deepseek-r1", "support_models": ["deepseek-r1"]}]
```
```bash
uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8001 --workers 8
```

#### ステップ2：chat apiインターフェースを呼び出す

**非ストリーミング**
```bash
curl -X POST "http://0.0.0.0:8001/product/chat/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "memos_user_123",
    "readable_cube_ids": ["xxx"],
    "writable_cube_ids": ["xxx"],
    "query": "夏休みに広州へ旅行に行く予定を立てましたが、宿泊についてはどのようなチェーンホテルを選べますか？",
    "model_name_or_path": "deepseek-r1",
    "add_message_on_answer": true
  }'
```

**ストリーミング**
```bash
curl -N -X POST "http://0.0.0.0:8001/product/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "memos_user_123",
    "readable_cube_ids": ["xxx"],
    "writable_cube_ids": ["xxx"],
    "query": "夏休みに広州へ旅行に行く予定を立てましたが、宿泊についてはどのようなチェーンホテルを選べますか？",
    "model_name_or_path": "deepseek-r1",
    "add_message_on_answer": true
  }'
```
