---
title: ドキュメント作成ガイド
desc: このプロジェクトは Nuxt Content を使用して、Markdown とリッチな Vue コンポーネントをサポートするドキュメントシステムを構築しています。
---

## 新しいドキュメントを作成する

::steps
### Markdown ファイルを作成する
`content/` ディレクトリまたはそのサブディレクトリ内に、新しい `.md` ファイルを作成します。内容タイプに応じて適切な場所を選択してください。

### Frontmatter を追加する
ファイルの先頭に YAML frontmatter を追加してメタデータを提供します。frontmatter は以下のフィールドをサポートします：

::card{title="Frontmatter フィールド"}
**必須フィールド：**
- `title`（文字列） - ナビゲーションとページタイトルに表示されるドキュメントタイトル

**任意フィールド：**
- `desc`（文字列） - ドキュメント内容の簡潔な説明
- `banner`（文字列） - ページ上部に表示されるバナー画像リンク
- `links`（配列） - ラベル、URL、アイコンを含む関連リンクの配列

![Frontmatter の例](https://statics.memtensor.com.cn/memos/frontmatter.png)
::

**完全な Frontmatter の例：**

```yaml
---
title: MemOS ドキュメント
desc: 高度でモジュール化された記憶能力を実現する大規模言語モデル（LLMs）を支援することを目的とした Python パッケージ、MemOS の公式ドキュメントへようこそ。
banner: https://statics.memtensor.com.cn/memos/memos-banner.gif
links:
  - label: 'PyPI'
    to: https://pypi.org/project/MemoryOS/
    target: _blank
    avatar:
      src: https://statics.memtensor.com.cn/icon/pypi.svg
      alt: PyPI logo
  - label: 'オープンソースアドレス'
    to: https://github.com/MemTensor/MemOS
    target: _blank
    icon: i-simple-icons-github
---
```

### 内容を記述する
Markdown 構文と MDC コンポーネントを使用してドキュメント内容を記述します。既存のコンポーネントを活用して、構造が明確で、対話しやすく、内容が豊富なドキュメントを構築します。

### ナビゲーションを更新する
新しいドキュメントを `content/settings.yml` 内の `nav` セクションに追加して、サイトナビゲーションからアクセスできるようにします。

### メインブランチにマージする
変更が `main` ブランチにマージされると、ドキュメントは自動的に更新およびデプロイされます。
::

## コンポーネント例

このプロジェクトは Nuxt Content の MDC（Markdown Components）構文を使用しており、Markdown 内で Vue コンポーネントを使用できます。これらのコンポーネントは、スタイルが一貫し、構造が良好で、体験に優れたドキュメント内容の作成に役立ちます。

### Image

ドキュメントに画像を追加する際は、複数の方法で参照できます：

#### Base64Image コンポーネントを使用してローカル画像を参照する

`public/assets` ディレクトリに保存されている画像については、`Base64Image` コンポーネントの使用を推奨します。このコンポーネントは画像をページに直接埋め込み、パフォーマンスを向上させます：

```mdc
:Base64Image{src="/assets/memos-architecture.png" alt="MemOS Architecture"}
```

#### Markdown 構文を使用してリモート画像を参照する

外部サーバーでホストされている画像については、標準の Markdown 画像構文を使用します：

```markdown
![MemOS Architecture](https://statics.memtensor.com.cn/memos/memos-architecture.png)
```

### Steps

`steps` コンポーネントを使用すると、ドキュメント見出しに自動で番号を付けて、段階的なガイド形式のチュートリアルを生成できます。

::code-preview
---
class: "[&>div]:*:w-full"
---
  :::steps{level="4"}
#### リポジトリを Fork してクローンする

ローカルでプロジェクトリポジトリをセットアップします：

- GitHub でリポジトリを fork する
- あなたの fork をローカルにクローンする：

  ```bash
  git clone https://github.com/YOUR-USERNAME/MemOS.git
  cd MemOS
  ```

- アップストリームリポジトリをリモートソースとして追加する：

  ```bash
  git remote add upstream https://github.com/MemTensor/MemOS.git
  ```

#### 開発依存関係を準備する

ローカルに以下がインストールされていることを確認してください：

- Git
- Python 3.9+
- Make

Python を確認する：

```bash
python3 --version
```

#### Poetry をインストールする

MemOS は Poetry を使用して Python の依存関係を管理します。公式インストールスクリプトの使用を推奨します：

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

インストールが成功したか確認する：

```bash
poetry --version
```

`poetry: command not found` と表示される場合は、インストーラー出力で示された Poetry 実行ファイルディレクトリを PATH に追加し、その後ターミナルを再度開いて確認してください。

その他のインストールオプションについては、[公式インストールガイド](https://python-poetry.org/docs/#installing-with-the-official-installer)を参照してください。

#### 依存関係をインストールして Pre-commit フックを設定する

リポジトリのルートディレクトリで、すべての依存関係と開発ツールをインストールします：

```bash
make install
```

ヒント：

- ブランチを切り替えた場合や依存関係が変更された場合は、環境の一貫性を保つために**`make install` を再実行する**必要がある場合があります
:::

#code
````mdc
::steps{level="4"}

#### リポジトリを Fork してクローンする

ローカルでプロジェクトリポジトリをセットアップします：

- GitHub でリポジトリを fork する
- あなたの fork をローカルにクローンする：

  ```bash
  git clone https://github.com/YOUR-USERNAME/MemOS.git
  cd MemOS
  ```

- アップストリームリポジトリをリモートソースとして追加する：

  ```bash
  git remote add upstream https://github.com/MemTensor/MemOS.git
  ```

#### 開発依存関係を準備する

ローカルに以下がインストールされていることを確認してください：

- Git
- Python 3.9+
- Make

Python を確認する：

```bash
python3 --version
```

#### Poetry をインストールする

MemOS は Poetry を使用して Python の依存関係を管理します。公式インストールスクリプトの使用を推奨します：

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

インストールが成功したか確認する：

```bash
poetry --version
```

`poetry: command not found` と表示される場合は、インストーラー出力で示された Poetry 実行ファイルディレクトリを PATH に追加し、その後ターミナルを再度開いて確認してください。

その他のインストールオプションについては、[公式インストールガイド](https://python-poetry.org/docs/#installing-with-the-official-installer)を参照してください。

#### 依存関係をインストールして Pre-commit フックを設定する

リポジトリのルートディレクトリで、すべての依存関係と開発ツールをインストールします：

```bash
make install
```

ヒント：

- ブランチを切り替えた場合や依存関係が変更された場合は、環境の一貫性を保つために**`make install` を再実行する**必要がある場合があります
::
````
::


### Accordion

`accordion` と `accordion-item` を使用して折りたたみ可能なコンテンツ領域を作成します。FAQ、展開可能な詳細、またはグループ化された情報などの整理に適しています。

::code-preview
---
class: "[&>div]:*:my-0"
---
 :::accordion
    ::::accordion-item
    ---
    icon: i-lucide-circle-help
    label: MemOS は API 経由でアクセスされる大規模言語モデル（LLM）と互換性がありますか？
    ---
    はい。MemOS は、できるだけさまざまなタイプのモデルと互換性を持つように設計されています。ただし、API ベースのモデルを使用している場合、活性化記憶とパラメータ記憶は使用できないことに注意してください。
    ::::
  
    ::::accordion-item
    ---
    icon: i-lucide-circle-help
    label: MemOS はどのように大規模言語モデルアプリケーションの効果を向上させますか？
    ---
    MemOS は、構造化された永続的な記憶機能、インテリジェントなスケジューリング機構、長期的な知識保持能力、および高速推論のための KV Cache を提供することで、大規模言語モデルのアプリケーション効果を強化します。細粒度のアクセス制御とユーザー分離をサポートし、マルチユーザー環境における記憶の安全性を保障します。そのモジュール化アーキテクチャにより、新しい記憶タイプ、LLM、およびストレージバックエンドをシームレスに統合でき、さまざまなインテリジェントアプリケーションシナリオに適しています。
    ::::
  
    ::::accordion-item{icon="i-lucide-circle-help" label="MemOS の価格はいくらですか？"}
    MemOS オープンソース版は無料です。
    ::::
:::


#code
```mdc
::accordion

:::accordion-item{label="MemOS は API 経由でアクセスされる大規模言語モデル（LLM）と互換性がありますか？" icon="i-lucide-circle-help"}
はい。MemOS は、できるだけさまざまなタイプのモデルと互換性を持つように設計されています。ただし、API ベースのモデルを使用している場合、活性化記憶とパラメータ記憶は使用できないことに注意してください。
:::

:::accordion-item{label="MemOS はどのように大規模言語モデルアプリケーションの効果を向上させますか？" icon="i-lucide-circle-help"}
MemOS は、構造化された永続的な記憶を提供し、インテリジェントなスケジューリング、長期知識保持メカニズム、および高速推論のための KV Cache と組み合わせることで、大規模言語モデルの応用能力を効果的に強化します。細粒度のアクセス制御とユーザー分離メカニズムをサポートし、マルチユーザー環境における記憶の安全性を確保します。そのモジュール化アーキテクチャは、新しい記憶タイプ、LLM、ストレージバックエンドのシームレスな統合をサポートし、多様なインテリジェントアプリケーションシナリオに適応できます。
:::

:::accordion-item{label="MemOS の価格はいくらですか？" icon="i-lucide-circle-help"}
MemOS オープンソース版は無料です。
:::

::
```
::

### Badge

badge を使用して状態インジケーターまたはラベルを表示します。内容内でバージョン番号、状態、または分類情報を強調表示する際に非常に便利です。

::code-preview
---
label: Preview
---
  :::badge
  **v1.0.0**
  :::

#code
```mdc
::badge
**v1.0.0**
::
```
::



### Callout

callout を使用すると重要なコンテキスト情報を強調できます。Callout は、メモ、ヒント、警告、または注意事項など、ユーザーの注意を引くために使用され、重要な情報をより目立たせます。

`icon` と `color` 属性でスタイルをカスタマイズすることも、事前定義された意味スタイル `note`、`tip`、`warning`、`caution` を使用して素早く呼び出すこともできます。

::code-preview
---
class: "[&>div]:*:my-0 [&>div]:*:w-full"
---
  :::callout
  これは完全な **markdown** をサポートする `callout` 提示ボックスです。
  :::

#code
```mdc
::callout
これは完全な **markdown** をサポートする `callout` 提示ボックスです。
::
```
::

::code-preview
  :::div{.flex.flex-col.gap-4.w-full}
    ::::note{.w-full.my-0}
    基本的な注記内容
    ::::

    ::::note{.w-full.my-0 to="/open_source/getting_started/quick_start"}
    リンク付きの注記 —— クリックしてクイックスタートガイドへ移動
    ::::
    
    ::::note{.w-full.my-0 to="/open_source/modules/mem_cube" icon="ri:database-line"}
    カスタムアイコン付きの注記 —— MemCube の詳細情報を見る
    ::::
    
    ::::tip{.w-full.my-0}
    これは役立つ提案です。
    ::::
    
    ::::warning{.w-full.my-0}
    慎重に操作してください。この動作は予期しない結果を招く可能性があります。
    ::::
    
    ::::caution{.w-full.my-0}
    この操作は取り消せません。
    ::::
  :::

#code
```mdc
::note
基本的な注記内容
::

::note{to="/open_source/getting_started/quick_start"}
リンク付きの注記 —— クリックしてクイックスタートガイドへ移動
::

::note{to="/open_source/modules/mem_cube" icon="ri:database-line"}
カスタムアイコン付きの注記 —— MemCube の詳細情報を見る
::

::tip
これは役立つ提案です。
::

::warning
この操作は慎重に実行してください。予期しない結果を招く可能性があります。
::

::caution
この操作は取り消せません。
::
```
::

### Card

`card` を使用すると、コンテンツモジュールを強調表示できます。カードは機能、リソース、または関連情報の表示に適しており、視覚的に区別してインタラクティブ性を高めます。

`title`、`icon`、`color` 属性によってスタイルをカスタマイズできます。Card は `<NuxtLink>` 属性を使用したナビゲーション遷移もサポートしています。

::code-preview
---
class: "[&>div]:*:my-0 [&>div]:*:w-full"
---
  :::card
  ---
  icon: i-simple-icons-github
  target: _blank
  title: オープンソースプロジェクト
  to: https://github.com/MemTensor/MemOS
  ---
  当社のオープンソース版を使用する
  :::

#code
```mdc
::card
---
title: オープンソースプロジェクト
icon: i-simple-icons-github
to: https://github.com/MemTensor/MemOS
target: _blank
---
当社のオープンソース版を使用する
::
```
::

### CardGroup

`card-group` を使用すると、複数のカードをグリッド形式で配置できます。構造化されたレスポンシブレイアウトのカード集合の表示に適しており、視覚効果も良好です。

::code-preview
  :::card-group{.w-full}
    ::::card
    ---
    icon: ri:play-line
    title: 最小Pipeline 
    to: /open_source/getting_started/examples#example-1-minimal-pipeline
    ---
    最小限の実用的なPipeline  — プレーンテキストメモリの追加、検索、更新、エクスポート。
    ::::
    
    ::::card
    ---
    icon: ri:tree-line
    title: TreeTextMemory のみ
    to: /open_source/getting_started/examples#example-2-treetextmemory-only
    ---
    Neo4j ベースの階層メモリを使用して、構造化されたマルチホップ知識グラフを構築します。
    ::::
    
    ::::card
    ---
    icon: ri:database-2-line
    title: KVCacheMemory のみ
    to: /open_source/getting_started/examples#example-3-kvcachememory-only
    ---
    短期 KV cache によって会話を高速化し、迅速なコンテキスト注入を実現します。
    ::::
    
    ::::card
    ---
    icon: hugeicons:share-07
    title: TreeText + KVCache のハイブリッド
    to: /open_source/getting_started/examples#example-4-hybrid
    ---
    単一の MemCube で、解釈可能なグラフメモリと高速な KV cache を組み合わせます。
    ::::
  :::

#code
```mdc
::card-group

:::card
---
icon: ri:play-line
title: 最小Pipeline の例
to: /open_source/getting_started/examples#example-1-minimal-pipeline
---
最小限で実行可能なPipeline の例——プレーンテキストメモリの追加、検索、更新、エクスポート。
:::

:::card
---
icon: ri:tree-line
title: TreeTextMemory のみを使用
to: /open_source/getting_started/examples#example-2-treetextmemory-only
---
Neo4j ベースの階層メモリを使用して、構造化されたマルチホップ知識グラフを構築します。
:::

:::card
---
icon: ri:database-2-line
title: KVCacheMemory のみを使用
to: /open_source/getting_started/examples#example-3-kvcachememory-only
---
短期 KV cache によって会話を高速化し、迅速なコンテキスト注入を実現します。
:::

:::card
---
icon: hugeicons:share-07
title: TreeText と KVCache のハイブリッド使用
to: /open_source/getting_started/examples#example-4-hybrid
---
単一の MemCube で、解釈可能なグラフメモリと高速な KV cache を組み合わせます。
:::

::
```
::

## Navigation Icons

`content/settings.yml` にナビゲーション項目を追加する際、`(ri:アイコン名)` の構文を使用してアイコンを埋め込めます：

```yaml
- "(ri:home-line) ホーム": overview.md
- "(ri:team-line) ユーザー管理": modules/mos/users.md
- "(ri:flask-line) テスト作成": contribution/writing_tests.md
```

利用可能なアイコンについては次を参照してください：[https://icones.js.org/](https://icones.js.org/)

## Local Preview

ドキュメントをローカルでプレビューする必要がある場合は、プロジェクトのルートディレクトリで以下のコマンドを実行できます。

まず依存関係をインストールします：

```bash
pnpm install
```

開発サーバーを起動します：

```bash
pnpm dev
```

上記のコマンドによりローカル Web サーバーが起動し、通常のアクセス先は `http://127.0.0.1:3000` です。

## Learn More

### Nuxt Content And Typography System

このプロジェクトは Nuxt Content を使用しており、豊富なタイポグラフィコンポーネントとスタイルをサポートしています。さらに多くのコンポーネントの使用方法とカスタマイズオプションについては、以下を参照してください：

* [Nuxt UI Typography ドキュメント](https://ui.nuxt.com/getting-started/typography)

## Writing Guidelines

::note
**ドキュメント作成の提案**

1. **構造を明確にする**：適切な見出し階層を使用して内容を整理する
2. **コンポーネントを適切に使用する**：note、card などのコンポーネントで可読性とインタラクティブ性を向上させる
3. **コード例を明確にする**：技術ドキュメントには明確なコードスニペットを提供し、構文ハイライトを使用する
4. **アイコンの使用**：ナビゲーションで適切なアイコンを使用してユーザー体験と階層感を強化する
::

::card{title="Quick Reference"}
提出前に、まずローカルでドキュメントの表示効果をテストしてください。`pnpm dev` を実行して変更をプレビューし、すべてのコンポーネントが正しくレンダリングされることを確認してください。
::

