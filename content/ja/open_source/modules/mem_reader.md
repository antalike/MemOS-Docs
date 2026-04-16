---
title: "MemReader"
desc: “MemReader はあなたの「記憶翻訳官」です。雑多な入力（チャット、ドキュメント、画像）を、システムが理解できる構造化された記憶片に翻訳する役割を担います。"
---

## 1. 概要

AI アプリケーションを構築する際、私たちはしばしば次のような問題に直面します。ユーザーが送ってくるものは実にさまざまです——気軽なチャットもあれば、PDF ドキュメントもあり、画像もあります。**MemReader** の役割は、これらの生データ（Raw Data）を「噛み砕き」「消化」して、Embedding とメタデータを持つ標準的な記憶ブロック（Memory Item）に変えることです。

簡単に言うと、これは 3 つのことを行います：
1.  **正規化**：送られてきたものが文字列でも JSON でも、まず標準形式に統一します。
2.  **スライシング (Chunking)**：長い会話や長いドキュメントを、後続処理しやすい適切な小さなブロックに分割します。
3.  **精錬 (Extraction)**：LLM を呼び出して非構造化情報を構造化された知識ポイントに抽出するか（Fine モード）、または直接スナップショットを生成します（Fast モード）。

---

## 2. コアモード

MemReader には 2 つの動作モードが設計されており、それぞれ「速さ」と「精度」という 2 つのニーズに対応しています：

### ⚡ Fast モード（速さ最優先）
*   **特徴**：**LLM を呼び出しません**。スライシングと Embedding のみを行います。
*   **適用シーン**：
    *   ユーザーが非常に速いペースでメッセージを送信し、システムにミリ秒級の応答が求められる場合。
    *   会話の「スナップショット」を保持するだけでよく、深い理解が不要な場合。
*   **生成物**：元のテキスト断片 + ベクトルインデックス + ソース追跡 (Sources)。

### 🧠 Fine モード（丁寧に磨き上げる）
*   **特徴**：**LLM を呼び出して**詳細な分析を行います。
*   **適用シーン**：
    *   長期記憶への書き込み（重要な事実を抽出する必要がある）。
    *   ドキュメント分析（中核的な観点を要約する必要がある）。
    *   マルチモーダル理解（画像内の内容を理解する必要がある）。
*   **生成物**：構造化された事実 + 重要情報抽出 (Key) + 背景 (Background) + ベクトルインデックス + ソース追跡 (Sources) + マルチモーダルの詳細。

---

## 3. コード構造

MemReader のコード構造は非常に明確で、主に以下の部分で構成されています：

*   **`base.py`**: すべての Reader が従う必要のあるインターフェース仕様を定義します。
*   **`simple_struct.py`**: **最もよく使われる実装**。純テキスト会話とローカルドキュメントに特化し、軽量で高効率です。
*   **`multi_modal_struct.py`**: **万能型の実装**。画像、ファイル URL、Tool 呼び出しなどの複雑な入力を処理できます。
*   **`read_multi_modal/`**: さまざまな具体的パーサー（Parser）を格納しています。たとえば、画像専用の `ImageParser`、ファイル解析用の `FileParser` などです。

---

## 4. どのように選ぶか？

| あなたのニーズ | 推奨選択 | 理由 |
| :--- | :--- | :--- |
| **純テキスト会話のみを処理** | `SimpleStructMemReader` | シンプルで直接的、かつ高性能です。 |
| **画像やファイルリンクを処理する必要がある** | `MultiModalStructMemReader` | マルチモーダル解析機能が組み込まれています。 |
| **Fast から Fine にアップグレードする必要がある** | 任意の Reader の `fine_transfer` メソッド | 「まず保存し、その後に最適化する」段階的戦略をサポートします。 |

---

## 5. API 概要

### 統一ファクトリー：`MemReaderFactory`

自分で `new` してオブジェクトを作成しないでください。ファクトリーパターンを使うのがベストプラクティスです：

```python
from memos.configs.mem_reader import MemReaderConfigFactory
from memos.mem_reader.factory import MemReaderFactory

# 設定から Reader を作成
cfg = MemReaderConfigFactory.model_validate({...})
reader = MemReaderFactory.from_config(cfg)
```

### コアメソッド：`get_memory()`

これはあなたが最も頻繁に呼び出すメソッドです。

```python
memories = reader.get_memory(
    scene_data,       # あなたの入力データ
    type="chat",      # タイプ：chat または doc
    info=user_info,   # ユーザー情報（user_id, session_id）
    mode="fine"       # モード：fast または fine（明示的な指定を強く推奨！）
)
```

**戻り値**：`list[list[TextualMemoryItem]]`

::note{icon="ri:bnb-fill"}
なぜ二重リストなのですか？  
長い会話は複数のウィンドウ（Window）に分割される可能性があるためです。外側のリストはウィンドウを表し、内側のリストはそのウィンドウから抽出された記憶項目を表します。
::

---

## 6. 開発実践

### シーン 1：シンプルなチャット履歴を処理する

これは最も基本的な使い方で、`SimpleStructMemReader` を使用します。

```python
# 1. 入力を準備：標準的な OpenAI 形式の会話
conversation = [
    [
        {"role": "user", "content": "明日の午後 3 時に会議があります"},
        {"role": "assistant", "content": "会議のテーマは何ですか？"},
        {"role": "user", "content": "Q4 プロジェクトの締切について話し合います"},
    ]
]

# 2. 記憶を抽出 (Fine モード)
memories = reader.get_memory(
    conversation,
    type="chat",
    mode="fine",
    info={"user_id": "u1", "session_id": "s1"}
)

# 3. 結果
# memories には、たとえば「ユーザーは明日の午後3時にQ4プロジェクトに関する会議がある」のような抽出された事実が含まれます
```

### シーン 2：マルチモーダル入力を処理する

ユーザーが画像やファイルリンクを送ってきた場合は、`MultiModalStructMemReader` に切り替えます。

```python
# 1. 入力を準備：ファイルと画像を含む複雑なメッセージ
scene_data = [
    [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "このファイルと画像を見てください"},
                # ファイルは URL の自動ダウンロード解析をサポート
                {"type": "file", "file": {"file_data": "https://example.com/readme.md"}},
                # 画像は URL をサポート
                {"type": "image_url", "image_url": {"url": "https://example.com/chart.png"}},
            ]
        }
    ]
]

# 2. 記憶を抽出
memories = multimodal_reader.get_memory(
    scene_data,
    type="chat",
    mode="fine", # Fine モードでのみ視覚モデルを呼び出して画像を解析します
    info={"user_id": "u1", "session_id": "s1"}
)
```

### シーン 3：段階的最適化 (Fine Transfer)

ユーザー体験のために、まず Fast モードで会話をすばやく保存し、システムがアイドル時にそれを Fine 記憶へ「精錬」することができます。

```python
# 1. まず高速保存（ミリ秒級）
fast_memories = reader.get_memory(conversation, mode="fast", ...)

# ... データベースに保存 ...

# 2. バックグラウンドで非同期に精錬
refined_memories = reader.fine_transfer_simple_mem(
    fast_memories_flat_list, # ここで渡すのはフラット化後の Item リストであることに注意
    type="chat"
)

# 3. 元の fast_memories を refined_memories で置き換える
```

---

## 7. 設定項目の説明

`.env` または設定ファイルで、以下の主要パラメータを調整できます：

*   **`chat_window_max_tokens`**: **スライディングウィンドウサイズ**。デフォルトは 1024。どれだけのコンテキストをまとめて処理するかを決定します。小さすぎると文脈を失いやすく、大きすぎると LLM の Token 制限を超えやすくなります。
*   **`remove_prompt_example`**: **Prompt 内のサンプルを削除するかどうか**。True = Token を節約するが抽出品質が低下する可能性がある；False = サンプルを保持して精度を向上させるが、より多くの Token を消費する（Few-shot サンプルを保持）。
*   **`direct_markdown_hostnames`** (マルチモーダルのみ): **ドメインホワイトリスト**。リスト内のドメイン（例：`raw.githubusercontent.com`）は Markdown テキストとして直接処理され、OCR/フォーマット変換ステップをスキップして処理を高速化します。



