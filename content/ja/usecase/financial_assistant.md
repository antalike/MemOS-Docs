---
title: 資産運用アシスタントに顧客行動の背後にある嗜好を理解させる
desc: MemOS を活用し、ユーザーの操作や対話行動を「記憶」として抽象化することで、その背後にある投資嗜好を識別・抽出し、顧客をより深く理解するパーソナライズドサービスを実現します。
---


## 1. Overview

インテリジェント投資アドバイザリー製品では、ユーザーは大量の**行動軌跡**を残します：

*   **流入元**：ユーザーはどの広告や投稿からクリックしてきたのか？（例：「老後資産運用」広告をクリック）
    
*   **APP 内での操作**：どのファンド商品を閲覧したか？どの資産運用商品をお気に入り登録したか？
    
*   **コミュニケーション記録**：投資アドバイザーマネージャーとのやり取り、AI 投資アドバイザリーアシスタントとの対話内容。
    

これらは原始的な行動にすぎず、そのままログとして保存しても、大規模モデルへの助けは限定的です。**重要なのは、行動をどのように「記憶」に抽象化するか**です：


### 1.1 行動はどのように記憶へ抽象化されるのか？

| ユーザー行動（原始軌跡） | 対応する記憶（意味的抽象化） |
| --- | --- |
| 「老後資産運用」広告をクリックして APP に入る | 記憶：「ユーザーは老後資産運用に潜在的な関心がある」 |
| 低リスクファンドの詳細ページを複数回閲覧する | 記憶：「ユーザーのリスク選好は比較的保守的である」 |
| 「低リスク資産運用商品」をお気に入り登録する | 記憶：「ユーザーは低リスクの資産運用を選ぶ傾向がある」 |
| 対話で「大きなリスクは負いたくない」と言う | 記憶：「低リスクの要望を明確に表明している」 |

ユーザーが後続で「自分にはどんな投資が向いていますか？」と再び尋ねたとき、投資アドバイザリーアシスタントは大量のログを読み返す必要はなく、これらの意味化された記憶を直接使ってモデル生成を駆動し、パーソナライズされた回答を行えます。


### 1.2 なぜ従来の RAG を使わないのか？

RAG は、たとえば「債券とは何か」を説明するような知識 Q&A にはより適しています。しかし、ユーザーの行動から嗜好を要約することはできません：

| 従来のRAG | MemOS |
| --- | --- |
| 静的な資産運用知識の断片を返す | ユーザー行動を意味化された記憶（興味、嗜好、プロファイル）に抽象化する |
| 「自分にはどんな投資が向いていますか？」に答えられない | 記憶を組み合わせてパーソナライズされた提案を生成できる |

### 1.3 なぜ自前で作らないのか？

もちろん開発者が自分で行動を保存することもできますが、3つの課題に直面します：

*   **抽象化の欠如**：「ファンド A をクリックした」と保存するだけでは役に立たず、「リスク選好=低リスク」に変換する必要があります。
    
*   **連携の複雑さ**：モデル呼び出し前に、自分で Prompt を組み立て、分散した行動を意味情報へ抽象化しなければなりません。
    
*   **拡張性の低さ**：チャネル、商品、コミュニケーションシーンが増えるにつれて、コードはすぐに制御不能になります。
    

### 1.4 なぜ MemOS を使うのか？

選定を行う際、3つの方式を直感的に比較できます：

| 方式 | 特徴 | 制約 | MemOS の強み |
| --- | --- | --- | --- |
| **従来のRAG** | ナレッジベース文書を検索する | ユーザー行動を処理できず、プロファイルを形成できない | FAQ には適しているが、パーソナライズされた投資アドバイザリーはできない |
| **自社開発ストレージ** | 行動ログを直接保存する | 行動→記憶の抽象化を自前で行う必要がある；Prompt の組み立てコストが高い | 大量の glue code を開発する必要がある |
| **MemOS** | 2つのインターフェース：`addMessage` 書き込み、`searchMemory` 検索 | —— | 行動軌跡を自動的に記憶へ抽象化し、モデルが直接利用できるようにする |


### 1.5 このケースでは何を示すのか？

このケースでは、MemOS クラウドサービスを使って、「ユーザー行動を記憶へ変換できる」インテリジェント投資アドバイザリーアシスタントを素早く実装する方法を示します。

Demo では：

*   **D1 流入行動**：「老後資産運用」広告をクリック → 記憶「老後資産運用への関心」を生成。
    
*   **D2 APP 行動**：低リスクファンドを閲覧してお気に入り登録 → 記憶「リスク選好=低リスク」を生成。
    
*   **D3 対話行動**：「リスクは負いたくない」と発言 → 記憶「低リスク要望を明確に表明」を生成。
    

ユーザーが「自分にはどんな投資が向いていますか？」と尋ねたとき：

*   `searchMemory` が上記の記憶を検索
    
*   大規模モデルが生成する回答はこれらのプロファイルを組み合わせる → 「より低リスクの固定収益型商品が適している」と出力。
    

このケースのスクリプトを実行すると、開発者はコンソールで次を確認できます：

*   毎回の `addMessage` のリクエスト/レスポンス（行動が保存される）
    
*   毎回の `searchMemory` のリクエスト/レスポンス（ヒットした意味化記憶）
    
*   モデルが最終的に出力するパーソナライズされた投資提案
    

## 2. Example

### 2.1 環境準備

pip を使用して必要な依存項目をインストールする

```shell
pip install MemoryOS -U
```

### 2.2 完全なコード

```python
import os
import uuid
from openai import OpenAI
from memos.api.client import MemOSClient

os.environ["MEMOS_API_KEY"] = "mpg-xx" # クラウドサービスコンソールから MemOS_API_KEY を取得
os.environ["OPENAI_API_KEY"] = "sk-xx" # 自分の API_KEY に置き換えてください

conversation_counter = 0

def generate_conversation_id():
    global conversation_counter
    conversation_counter += 1
    return f"conversation_{conversation_counter:03d}"

class FinancialManagementAssistant:
    """AI 財務管理アシスタント、記憶能力を備える"""
    
    def __init__(self):
        self.memos_client = MemOSClient(api_key=os.getenv("MEMOS_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def search_memory(self, query, user_id, conversation_id):
        """関連する記憶を検索"""
        response = self.memos_client.search_memory(query, user_id, conversation_id)

        return [memory_detail.memory_value for memory_detail in response.data.memory_detail_list]

    def build_system_prompt(self, memories):
        """整形した記憶を含むシステムプロンプトを構築"""
        base_prompt = """
          あなたは知識が豊富で、専門的かつ親身な資産運用管理アシスタントです。
          あなたは対話記憶にアクセスでき、よりパーソナライズされた回答を提供するのに役立てられます。
          記憶を使って、ユーザーの背景、嗜好、過去のやり取りを理解してください。
          記憶が提供されている場合は、関連する場面で自然に引用してください。ただし、記憶を持っていることは明示しないでください
        """

        if memories:
            # 記憶を番号付きリストとして整形
            formatted_memories = "## 記憶:\n"
            for i, memory in enumerate(memories, 1):
                formatted_memories += f"{i}. {memory}\n"
            
            return f"{base_prompt}\n\n{formatted_memories}"
        else:
            return base_prompt
        

    def add_message(self, messages, user_id, conversation_id):
        """メッセージを追加"""
        self.memos_client.add_message(messages, user_id, conversation_id)

    def get_message(self, user_id, conversation_id):
        """メッセージを取得"""
        response = self.memos_client.get_message(user_id, conversation_id)
        
        return response.data.message_detail_list

    def chat(self, query, user_id, conversation_id):
        """記憶統合を含む対話を処理する主要なチャット関数"""
        # 1. 関連する記憶を検索
        memories = self.search_memory(query, user_id, conversation_id)
        
        # 記憶を含むシステムプロンプトを構築
        system_prompt = self.build_system_prompt(memories)
        
        # 2. OpenAI を使用して回答を生成
        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )
        answer = response.choices[0].message.content

        # 3. 対話を記憶に保存
        messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": answer}
        ]
        self.memos_client.add_message(messages, user_id, conversation_id)
        
        return answer

ai_assistant = FinancialManagementAssistant()
user_id = "memos_financial_management_user_123"

def demo_questions():
    return [
      '私のリスク選好は何ですか',
      "私に合った投資をいくつかおすすめしてください"
    ]

def preset_user_behaviors():
    """事前設定されたユーザー行動記憶を表示"""
    conversation_id = generate_conversation_id()
    
    print(f"\n📊 事前設定されたユーザー行動記憶 (conversation_id={conversation_id}):")
    print("=" * 60)

    behaviors = [{
      "role": "user",
      "content": "「老後資産運用」広告をクリックして APP に入る"
    }, {
      "role": "user",
      "content": "低リスクファンドを閲覧してお気に入り登録"
    }]
    
    for i, behavior in enumerate(behaviors, 1):
        print(f"{i}. {behavior['content']}")
    ai_assistant.add_message(behaviors, user_id, conversation_id)
    
    print("=" * 60)
    print("💡 以上の行動記憶はすでに MemOS に記録されており、アシスタントはこれらの情報に基づいてパーソナライズされた提案を提供します")

def main():
    print("💰 資産運用管理アシスタントにおける MemOS の使用例をご覧いただきありがとうございます！")
    print("💡 MemOS の支援により、あなたの資産運用アシスタントをよりスマートに、より親身にします！ 😊 \n")
    
    # まず事前設定対話を実行するかどうかをユーザーに尋ねる
    while True:
        pre_chat = input("🤔 先にユーザー行動記憶を事前ロードしますか？ add 枠を1回消費する見込みです。実行しますか？(y/n): ").strip().lower()
        
        if pre_chat in ['y', 'yes', '是', 'Y']:
            preset_user_behaviors()
            break
        elif pre_chat in ['n', 'no', '否', 'N']:
            print("📝 新しい対話を開始します...")
            break
        else:
            print("⚠️  'y' ではい、'n' でいいえを入力してください")

    print("\n⚡️ この後入力するすべての質問は、それぞれまったく新しいセッション（新しい conversation id）で展開されます。MemOS はセッションをまたいであなたの過去の行動記憶を自動的に呼び出し、継続的でパーソナライズされたサービスを提供します。")    
    print("\n🎯 以下はいくつかのサンプル質問です。引き続きアシスタントと対話できます:")
    for i, question in enumerate(demo_questions(), 1):
      print(f"  {i}. {question}")

    while True:
        user_query = input("\n🤔 ご質問を入力してください (または 'exit' で終了): ").strip()
        
        if user_query.lower() in ['quit', 'exit', 'q', '退出']:
            print("👋 資産運用管理アシスタントをご利用いただきありがとうございました！")
            break
        
        if not user_query:
            continue
        
        print("🤖 処理中...")
        conversation_id = generate_conversation_id()
        answer = ai_assistant.chat(user_query, user_id, conversation_id)
        print(f"\n💬 conversation_id: {conversation_id}\n💡 [アシスタント]: {answer}\n")
        print("-" * 60)


if __name__ == "__main__":
    main()
```

### 2.3 コード説明

1.   環境変数で、MemOS API キーおよび Open AI キーを設定します
    
2.   <code style="font-weight: bold;">FinancialManagementAssistant </code>をインスタンス化します
    
3.   事前設定値の対話を実行するかどうかを選択します。add を1回、search を2回消費します
    
4.   `main()` 関数を使用し、対話ループを通じてアシスタントとやり取りします
    
5.   アシスタントは chat を呼び出し、まず search を実行して記憶を検索し、その後 OpenAI を呼び出して対話し、最後に add を実行して記憶を保存します
