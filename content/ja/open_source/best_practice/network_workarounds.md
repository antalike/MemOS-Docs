---
title: ネットワーク問題の解決策
desc: 以下は、開発中に遭遇する可能性のあるネットワーク問題への対処法です。
---

## **Huggingface モデルのダウンロード**

### ミラーサイト（HF-Mirror）

ミラーサイトを通じて Huggingface モデルをダウンロードするには、以下の手順に従って操作できます：

::steps{level="4"}

#### 依存項目のインストール

以下のコマンドを実行して必要な依存項目をインストールします：

```bash
pip install -U huggingface_hub
```

#### 環境変数の設定

環境変数 `HF_ENDPOINT` を `https://hf-mirror.com` に設定します。

#### モデルまたはデータセットのダウンロード

huggingface-cli を使用してモデルまたはデータセットをダウンロードします。例えば：

- モデルをダウンロード：

  ```bash
  huggingface-cli download --resume-download gpt2 --local-dir gpt2
  ```
- データセットをダウンロード：
  ```
  huggingface-cli download --repo-type dataset --resume-download wikitext --local-dir wikitext
  ```

::

より詳細な説明と他の方法については、[このリンク](https://hf-mirror.com/)を参照してください。

### その他のソース

一部の地域では、依然として一部のモデルにアクセスできない可能性があります。この場合、modelscope を使用できます：

::steps{level="4"}

#### ModelScope のインストール

以下のコマンドを実行して必要な依存項目をインストールします：

```bash
pip install modelscope[framework]
```

#### モデルまたはデータセットのダウンロード

modelscope を使用してモデルまたはデータセットをダウンロードします。例えば：

* モデルをダウンロード：

  ```bash
  modelscope download --model 'Qwen/Qwen2-7b' --local_dir 'path/to/dir'
  ```

* データセットをダウンロード：

  ```bash
  modelscope download --dataset 'Tongyi-DataEngine/SA1B-Dense-Caption' --local_dir './local_dir'
  ```

::

より詳細な説明と他の方法については、[公式ドキュメント](https://modelscope.cn/docs/home)を参照してください。

## **Poetry の使用**

### インストール中のネットワークエラー

一部の地域で "poetry install" を使用するとネットワークエラーが発生する可能性があります。以下の手順に従って解決できます：

::steps{level="4"}

#### 設定の更新

ミラーソースを使用するために、`pyproject.toml` ファイルに以下の設定を追加します：

```toml
[[tool.poetry.source]]
name = "mirrors"
url = "https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/"
priority = "primary"
```

#### Poetry の再設定

ターミナルで `poetry lock` コマンドを実行し、新しいミラーソースを使用して Poetry を再設定します。

::

**ヒント：**
`poetry lock` は `pyproject.toml` および `poetry.lock` ファイルを変更することに注意してください。不要な変更をコミットしないために：

- 方法一：`poetry install` の実行に成功した後、`git reset --hard HEAD` を使用して Git HEAD ノードに復元します。
- 方法二：`git add` を実行する際、`pyproject.toml` と `poetry.lock` ファイルを除外し、他のファイルのみを追加します。

今後、依存パッケージを追加または削除する際には、以下のコマンドを使用できます：

```bash
poetry add <lib_name>
```

その他のコマンドと説明については、[Poetry CLI 公式ドキュメント](https://python-poetry.org/docs/cli/)を参照してください。

