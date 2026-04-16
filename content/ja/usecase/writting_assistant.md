---
title: 記憶のあるライティングアシスタントはより使いやすい
desc: MemOS を活用することで、あなたのプロダクトはユーザーのライティング習慣とコンテキストを自動的に記憶し、創作プロセスをより一貫性があり、より手間いらずなものにします。
---

## 1. 概要

ライティングアシスタントのようなプロダクトでは、ユーザーはしばしば、アシスタントが**自分の文体や習慣を記憶してくれること**を望み、毎回ゼロから始めることを望みません。

*   **文体**  
    「要約を書くのを手伝ってくれるときは、口調をもう少し軽くして」
    
*   **よく使う情報**  
    「私が XX 会社でマーケティング部を担当していることを覚えておいて」
    
*   **ライティングの好み**  
    「今後メールの冒頭には必ず『尊敬するお客様』を加えて」
    
*   **コンテキストの継続**  
    「昨日のあの提案書の要約をもう少し改善して、予算の部分を追加して」
    

記憶がなければ、これらの情報は会話が終わると失われてしまいます。ユーザーは繰り返しアシスタントに注意を促さなければならず、体験は分断され、プロフェッショナルではない印象になります。


### 1.1 なぜ従来の RAG を使わないのか？

ライティングアシスタントのシナリオでは、RAG は適していません

| 従来の RAG | MemOS |
| --- | --- |
| 静的な知識ベースに依存し、手動で継続的にドキュメントを保守する必要がある | 対話中に生成された情報を直接書き込めるため、追加の保守は不要 |
| 検索結果は通常、汎用的な知識の断片である | パーソナライズされた文体、口調、よく使う表現を保存し呼び出せる |
| 「企業文書/百科知識」系のシナリオにより適している | 「継続的な反復、パーソナライズされた」ライティングアシスタントにより適している |


### 1.2 なぜ自前で作らないのか？

もちろん、データベースにユーザーの好みやコンテキストを保存することを試すこともできますが、これにはいくつかの課題があります：

*   **保存と検索のロジックが複雑**：本文、好み、ユーザープロファイルを区別し、検索戦略を設計する必要があります。
    
*   **大規模モデルとの接続が面倒**：保存するのは第一歩にすぎず、大規模モデルを呼び出す前に関連情報を「Prompt に組み込む」必要があります。
    
*   **拡張性が低い**：ユーザー要件が増えるにつれて（文体、よく使うフレーズ、コンテキスト関連）、コードは急速に肥大化します。
    

### 1.3 なぜ MemOS を使うのか？

選定を行う際には、3 つの案を直感的に比較できます：

| 案 | 特徴 | 制約 | MemOS の利点 |
| --- | --- | --- | --- |
| **従来の RAG** | ベクトル検索で知識ベース文書を取得し、Prompt に連結する | 静的ドキュメントを手動で保守する必要がある；パーソナライズされたライティング習慣には不向き | ユーザーが対話で明かした文体や好みを自動的に捉える |
| **自社開発の保存案** | 自分でテーブル/キャッシュを構築し、好みと内容を保存する | ロジックが複雑：本文/好み/プロファイルを区別する必要がある；さらに Prompt を手動で組み立てる必要がある；拡張が難しい | MemOS は保存+検索+Prompt 注入をカプセル化し、開発負担を軽減する |
| **MemOS** | 2 つのインターフェースだけでよい：`addMessage` で書き込み、`searchMemory` で検索 | —— | 長期的な文体追跡、よく使う情報の再利用をサポート；すぐに使えて拡張しやすい |


### 1.4 このケースでは何を示すのか？

このケースでは、MemOS クラウドサービスを使って、「ユーザーを記憶する」ライティングアシスタントを素早く実現する方法を示します。

この Demo では、ユーザーは次のようなことをする可能性があります：

*   好みを伝える：「要約を書くのを手伝ってくれるときは、口調をもう少し軽くして」
    
*   背景を再利用する：「私が XX 会社でマーケティング部を担当していることを覚えておいて」
    
*   タスクを反復する：「昨日のあの提案書の要約をもう少し改善して、予算の部分を追加して」
    

MemOS があれば、ライティングアシスタントは次のことができます：

1.  **スタイルを継続する**：ユーザーが求める口調と形式の一貫性を保つ。
    
2.  **情報を再利用する**：ユーザーがよく使う背景情報を自動的に取り込む。
    
3.  **すばやく反復する**：既存の内容に基づいて引き続き修正し、最初からやり直さない。
    

このケースのスクリプトを実行すると、開発者はコンソールで次の内容を確認できます：

*   毎回の `addMessage` と `searchMemory` 呼び出しのリクエスト/レスポンス
    
*   検索された文体、背景情報などの記憶
    
*   モデルが生成した最終回答（大規模モデルが未接続の場合は、【大規模モデル未接続】と表示されます）
    

##  2. サンプル

### 2.1 環境準備

pip を使用して必要な依存項目をインストールします

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

class WritingAssistant:
    """AI ライティングアシスタント。ユーザーの執筆を支援し、記憶能力を備える"""
    
    def __init__(self):
        self.memos_client = MemOSClient(api_key=os.getenv("MEMOS_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def search_memory(self, query, user_id, conversation_id):
      """関連する記憶を検索する"""
      response = self.memos_client.search_memory(query, user_id, conversation_id)   

      return [memory_detail.memory_value for memory_detail in response.data.memory_detail_list]

    def build_system_prompt(self, memories):
        """フォーマットされた記憶を含むシステムプロンプトを構築する"""
        base_prompt = """
          あなたはプロフェッショナルなライティングアシスタントであり、ユーザーの文体と好みを記憶できます。
          あなたは対話記憶を呼び出して、よりパーソナライズされた返信を提供することができます。
          これらの記憶を活用して、ユーザーのシナリオ背景、好みの傾向、および過去のやり取りを理解してください。
          記憶が提供されている場合は、関連する場面で自然にそれらを参照してください。ただし、記憶機能を持っていることを明示的に言及しないでください
        """

        if memories:
            # 記憶を番号付きリストとしてフォーマットする
            formatted_memories = "## 記憶:\n"
            for i, memory in enumerate(memories, 1):
                formatted_memories += f"{i}. {memory}\n"
            
            return f"{base_prompt}\n\n{formatted_memories}"
        else:
            return base_prompt
        

    def add_message(self, messages, user_id, conversation_id):
      """メッセージを追加する"""
      self.memos_client.add_message(messages, user_id, conversation_id)

    def get_message(self, user_id, conversation_id):
      """メッセージを取得する"""
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

ai_assistant = WritingAssistant()
user_id = "memos_writing_user_123"

def demo_questions():
    return [
      "チーム懇親会の案内メールを書いてください",
      "まもなくリリースする資産運用 App の新機能を要約する顧客向けメールを書いてください",
    ]

def pre_configured_conversations():
    """事前設定された対話ペアを返す"""
    return [
        {
            "user": "私はインターネット企業のマーケティング部で働いていて、メールを書くときは口調を少し軽くして、冒頭に '親愛なるXX' を付けて"
        },
        {
            "user": "要約を書くときは、私は先に 3 つの要点を並べるのが習慣です"
        }
    ]

def execute_pre_conversations():
    """事前設定された対話を実行する"""
    conversations = pre_configured_conversations()
    conversation_id = generate_conversation_id()
    
    print(f"\n🔄 事前設定された対話を実行中です（conversation_id={conversation_id})...")
    print("=" * 60)
    
    for i, conv in enumerate(conversations, 1):
        print(f"\n💬 対話 {i}")
        print(f"👤 ユーザー: {conv['user']}")
        
        # 対話を実行
        answer = ai_assistant.chat(conv['user'], user_id, conversation_id)
        print(f"🤖 アシスタント: {answer}")
        print("-" * 40)
    
    print("\n✅ 事前設定された対話の実行が完了しました！")
    print("=" * 60)

def main():
    print("📝 ライティングアシスタントにおける MemOS の使用例へようこそ！")
    print("💡 MemOS の支援により、あなたのライティングアシスタントはあなたのスタイルや好みをより深く理解できます！ ✍️ \n")
    
    # 先に事前設定された対話を実行するかどうかをユーザーに尋ねる
    while True:
        pre_chat = input("🤔 先に事前設定された対話を実行しますか？add 2 回と search 2 回の呼び出し枠を消費します。実行しますか？(y/n): ").strip().lower()
        
        if pre_chat in ['y', 'yes', '是', 'Y']:
            execute_pre_conversations()
            break
        elif pre_chat in ['n', 'no', '否', 'N']:
            print("📝 まったく新しいライティングアシスタントの対話を開始します...")
            break
        else:
            print("⚠️  'y' で「はい」、または 'n' で「いいえ」を入力してください")

    print("\n⚡️ この後、あなたが入力するすべての質問は、まったく新しい会話内で展開されます（新しい conversation id）。MemOS は会話をまたいであなたの過去の行動記憶を自動的に呼び戻し、継続的でパーソナライズされたサービスを提供します。")    
    print("\n🎯 以下はいくつかのサンプル質問です。引き続きライティングアシスタントと対話できます:")
    for i, question in enumerate(demo_questions(), 1):
      print(f"  {i}. {question}")

    while True:
        user_query = input("\n🤔 あなたのライティング要件を入力してください (または 'exit' を入力して終了): ").strip()
        
        if user_query.lower() in ['quit', 'exit', 'q', '退出']:
            print("👋 ご利用ありがとうございました。楽しい執筆時間をお過ごしください！")
            break
        
        if not user_query:
            continue
        
        print("🤖 作成中...")
        conversation_id = generate_conversation_id()
        answer = ai_assistant.chat(user_query, user_id, conversation_id)
        print(f"\n💬 conversation_id: {conversation_id}\n💡 [アシスタント]: {answer}\n")
        print("-" * 60)


if __name__ == "__main__":
    main()
```

### 2.3 コード説明

1.   環境変数にあなたの MemOS API キーおよび Open AI キーを設定します
    
2.   `WritingAssistant` をインスタンス化します
    
3.   事前設定された対話を実行するかどうかを選択します。add 2 回と search 2 回の枠を消費します
    
4.   `main()` 関数を使用して対話ループを通じてアシスタントとやり取りします
    
5.   アシスタントは chat を呼び出し、先に search を実行して記憶を検索し、その後 OpenAI を呼び出して対話し、最後に add を実行して記憶を保存します
