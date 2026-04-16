---
title: 記憶を持つ家庭生活アシスタントを構築する
desc: MemOSの支援により、家庭アシスタントは日常の雑事と長期計画をつなぎ合わせ、ユーザーの本当のニーズをすばやく理解して応答できます。
---

## 1. 概要

家庭生活アシスタントのような製品を作る際、開発者はよく一つの問題に直面します：**対話コンテキストがひとたび終了すると、ユーザー情報が失われる**。

*   ユーザーが何気なく伝えたToDo（「土曜日は子どもを動物園に連れて行く」）
    
*   ユーザーが表明した習慣（「リマインドするときは先に要点を並べて、それから一言の行動提案を出して」）
    
*   ユーザーが紹介した家族状況（「妻の名前は小芸で、子どもは 6 歳」）
    

アシスタントがこれらの情報を覚えられないと、「薄情」に見えてしまいます：ユーザーが翌日に再び「週末は何を予定していたっけ？」と聞いたとき、アシスタントは何のことかまったく分かりません。


### 1.1 なぜ従来の RAG を使わないのか？

多くの人の第一反応は： RAG（検索拡張生成）を使えないだろうか？  
しかし、従来の RAG の特徴により、このような「パーソナライズドアシスタント」シナリオには適していません：

| 従来の RAG | MemOS |
| --- | --- |
| 静的ナレッジベースに依存し、ドキュメントを人手で継続的に保守する必要がある | 対話中に生成された情報を直接書き込め、追加の保守は不要 |
| 断片を機械的に返すことしかできず、好みを自動学習しない | 対話に応じてToDo、好み、プロフィールなどの記憶を自動的に形成する |
| 「共通知識」を対象としており、個人化情報の保存には適さない | 個別化シナリオ向けに特化して設計されており、長期追跡と呼び出しをサポートする |


### 1.2 なぜ自分で車輪を再発明しないのか？

もちろん、これらの情報を自分で保存してみることもできますが、その場合いくつかの課題が生じます：

*   **保存と検索のロジックが複雑**：対話内容、長期記憶、好み、事実を区別し、必要に応じていつでも検索できることを保証しなければならない。
    
*   **大規模モデルとの接続が面倒**：データを保存するだけでなく、回答を生成する前に関連情報を「Prompt に組み込む」必要がある。
    
*   **拡張性が低い**：機能が増えるにつれ（ToDo、好み、プロフィール）、コードはますます保守しにくくなる。
    

### 1.3 なぜ MemOS を使うのか？

選定を行う際、3つの方案を直感的に比較できます：

| 方案 | 特徴 | 制約 | MemOS の優位性 |
| --- | --- | --- | --- |
| 従来の RAG | ベクトル検索でナレッジベース文書を検索し、Prompt に連結する | 静的文書を人手で保守する必要がある；個人化されたToDo/好みを保存できない；断片を機械的に返すだけ | 対話中の重要情報を自動的に捉え、個別化と動的更新をサポート |
| 自前の保存方案 | 独自のテーブル/キャッシュを構築し、対話情報を保存する | ロジックが複雑：対話/長期記憶/好み/プロフィールを区別する必要がある；モデル呼び出し前に手動で Prompt を組み立てる必要がある；機能拡張が保守しにくい | MemOS は保存+検索+Prompt 注入をカプセル化し、開発負担を軽減 |
| MemOS | 2つのインターフェースだけでよい：`addMessage` で書き込み、`searchMemory` で検索 | —— | 長期追跡、好みの維持、プロフィール連携をサポート；すぐに使えて拡張しやすい |

必要なのは2つのインターフェースを呼び出すだけです：

*   `addMessage`：ユーザーまたはアシスタントのメッセージをシステムに書き込む。
    
*   `searchMemory`：モデルが応答を生成する前に関連記憶を検索し、その結果を Prompt に連結する。
    

こうして、アシスタントは本当の意味で「記憶がある」ように振る舞えるようになります：

*   **ToDoを追跡する**
    
    *   ユーザーが「土曜日は子どもを動物園に連れて行く」と言う
        
    *   数日後に「週末は何を予定していたっけ？」と聞く → 正確に答えられる
        
*   **好みを維持する**（将来のバージョンでは、より細かな指示補完をサポート予定）
    
    *   ユーザーが「リマインドは先に要点+一言の提案にして」と言う
        
    *   再び「来週の家事分担を計画して」と聞く → 出力が好みのスタイルを維持する
        
*   **プロフィールを組み合わせる**
    
    *   ユーザーが「妻の名前は小芸で、子どもは 6 歳」と言う
        
    *   再び「週末に家族向けの活動を手配して？」と聞く → 親子家庭に合った活動プランを提示する

### 1.4 この事例では何を示すのか？

私たちは MemOS クラウドサービスを使って、「ユーザーを覚えている」家庭生活アシスタントをすばやく実現します。  
事例スクリプトを実行すると、開発者は完全なログを確認できます：

*   毎回の `addMessage` と `searchMemory` のリクエスト/レスポンス
    
*   ヒットした記憶項目
    
*   連結された指示と完全な指示  ← TODO: まもなく公開、どうぞご期待ください
    
*   モデルが生成した回答（大規模モデルが未接続の場合は【大規模モデル未接続】と表示されます）


## 2. 例

### 2.1 環境準備

pipを使用して必要な依存項目をインストールする

```shell
pip install MemoryOS -U
```


### 2.2 完全なコード

```python
import os
import uuid
from openai import OpenAI
from memos.api.client import MemOSClient

os.environ["MEMOS_API_KEY"] = "mpg-xx" # クラウドサービスのコンソールからMemOS_API_KEYを取得
os.environ["OPENAI_API_KEY"] = "sk-xx" # ご自身のAPI_KEYに置き換えてください

conversation_counter = 0

def generate_conversation_id():
    global conversation_counter
    conversation_counter += 1
    return f"conversation_{conversation_counter:03d}"

class HomeAssistant:    
    def __init__(self):
        self.memos_client = MemOSClient(api_key=os.getenv("MEMOS_API_KEY"))
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def search_memory(self, query, user_id, conversation_id):
        """関連記憶を検索する"""
        response = self.memos_client.search_memory(query, user_id, conversation_id)

        return [memory_detail.memory_value for memory_detail in response.data.memory_detail_list]

    def add_message(self, messages, user_id, conversation_id):
        """メッセージを追加する"""
        self.memos_client.add_message(messages, user_id, conversation_id)

    def get_message(self, user_id, conversation_id):
        """メッセージを取得する"""
        response = self.memos_client.get_message(user_id, conversation_id)
        
        return response.data.message_detail_list

    def build_system_prompt(self, memories):
        """整形済み記憶を含むシステムプロンプトを構築する"""
        base_prompt = """
          あなたは知識が豊富で、思いやりがあり、気配りのできる家庭生活アシスタントです。
          あなたは対話記憶を呼び出して、よりパーソナライズされた応答を提供できます。
          これらの記憶を活用して、ユーザーのシナリオ背景、好みの傾向、および過去のやり取りの状況を理解してください。
          記憶内容が提供されている場合、関連するときにはその情報を自然に参照する必要がありますが、自分に記憶機能があることを明示的に言及する必要はありません。
        """

        if memories:
            # 記憶を番号付きリストに整形する
            formatted_memories = "## 記憶:\n"
            for i, memory in enumerate(memories, 1):
                formatted_memories += f"{i}. {memory}\n"
            
            return f"{base_prompt}\n\n{formatted_memories}"
        else:
            return base_prompt
        

    def chat(self, query, user_id, conversation_id):
        """記憶統合を含む対話を処理する主要なチャット関数"""
        # 1. 関連記憶を検索する
        memories = self.search_memory(query, user_id, conversation_id)
        
        # 記憶を含むシステムプロンプトを構築する
        system_prompt = self.build_system_prompt(memories)
        
        # 2. OpenAIを使って回答を生成する
        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )
        answer = response.choices[0].message.content

        # 3. 対話を記憶に保存する
        messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": answer}
        ]
        self.memos_client.add_message(messages, user_id, conversation_id)
        
        return answer

ai_assistant = HomeAssistant()
user_id = "memos_home_management_user_123"

def demo_questions():
    return [
      "私の週末の予定は何がありますか？",
      "来週の家事分担を計画してください"
    ]

def pre_configured_conversations():
    """事前設定済みの対話ペアを返す"""
    return [
        {
            "user": "土曜日は子どもを動物園に連れて行くので、覚えておいてください。",
        },
        {
            "user": "今後リマインドや予定を出すときは、先に3つの要点を並べてから、短い提案を一言添えてください。",
        }
    ]

def execute_pre_conversations():
    """事前設定済みの対話を実行する"""
    conversation_id = generate_conversation_id()
    conversations = pre_configured_conversations()
    
    print(f"\n🔄 事前設定済み対話を実行中（conversation_id={conversation_id}）...")
    print("=" * 60)
    
    for i, conv in enumerate(conversations, 1):
        print(f"\n💬 対話 {i}")
        print(f"👤 ユーザー: {conv['user']}")
        
        # 対話を実行する
        answer = ai_assistant.chat(conv['user'], user_id, conversation_id)
        print(f"🤖 [アシスタント]: {answer}")
        print("-" * 40)
    
    print("\n✅ 事前設定済み対話の実行が完了しました！")
    print("=" * 60)

def main():    
    print("🏠 家庭アシスタントにおけるMemOSの使用例へようこそ！")
    print("💡 MemOSの支援により、あなたが開発する製品で本物の執事のような効果を実現しましょう！ 😊 \n")
    
    # ユーザーに事前設定済み対話を先に実行するか尋ねる
    while True:
        pre_chat = input("🤔 先に事前設定済み対話を実行しますか？ addを2回、searchを2回の呼び出し枠を消費する見込みです。実行しますか？(y/n): ").strip().lower()
        
        if pre_chat in ['y', 'yes', '是', 'Y']:
            execute_pre_conversations()
            break
        elif pre_chat in ['n', 'no', '否', 'N']:
            print("📝 まったく新しい対話を開始します...")
            break
        else:
            print("⚠️  'y' で「はい」、または 'n' で「いいえ」を入力してください")

    print("\n⚡️ この後に入力するすべての質問は、それぞれまったく新しいセッション（新しい conversation id）で展開されます。MemOSはセッションをまたいであなたの過去の行動記憶を自動的に呼び戻し、継続的でパーソナライズされたサービスを提供します。")    
    print("\n🎯 以下はいくつかの例題です。引き続きアシスタントと対話できます:")
    for i, question in enumerate(demo_questions(), 1):
      print(f"  {i}. {question}")

    while True:
        user_query = input("\n🤔 質問を入力してください (または 'exit' を入力して終了): ").strip()
        
        if user_query.lower() in ['quit', 'exit', 'q', '退出']:
            print("👋 家庭アシスタントをご利用いただきありがとうございます！")
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

1.   環境変数でMemOS APIキーおよびOpen AIキーを設定する
    
2.   `HomeAssistant` をインスタンス化する
    
3.   事前設定値の対話を実行するかどうかを選択する。addを2回、searchを2回の枠を消費する
    
4.   `main()`関数を使用して対話ループでアシスタントとやり取りする
    
5.   アシスタントは chat を呼び出し、まず search で記憶を検索し、その後OpenAIを呼び出して対話し、最後に add を実行して記憶を保存する
