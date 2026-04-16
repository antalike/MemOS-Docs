---
title: 開発フロー
---

以下の手順に従ってプロジェクト開発に参加してください。

::steps{level="4"}

#### Upstream リポジトリと同期

以前にこのリポジトリを fork した場合は、upstream リポジトリの変更と同期を保ってください：

```bash
git checkout dev        # dev ブランチに切り替え
git fetch upstream      # upstream リポジトリの最新の変更を取得
git pull upstream dev   # 変更をローカルの dev ブランチにマージ
git push origin dev     # マージ後のコードを自分の fork に push
```

#### 機能ブランチを作成

新しい機能または修正のために新しいブランチを作成してください：

```bash
git checkout -b feat/descriptive-name
```

#### 機能または修正を追加

対応するファイル内で、機能、修正、または改善を実装してください。

* 例えば、`src/memos/hello_world.py` に関数を追加し、`tests/test_hello_world.py` に対応するテストケースを記述できます。

#### 変更をテスト

変更が正しいことを確認するためにテストスイートを実行してください：

```bash
make test
```

#### 変更をコミット

コミット前または PR 前に、最新の upstream/dev に rebase してください：

```bash
git fetch upstream
git rebase upstream/dev      # あなたの feat ブランチを最新の dev に基づいて再適用
```

変更をコミットする際は、プロジェクトのコミット規約に従ってください（[コミット規約](commit_guidelines.md) を参照）。

#### あなたの Fork リポジトリに Push

機能ブランチを、fork したリモートリポジトリに push してください：

```bash
git push origin feat/descriptive-name
```

#### Pull Request を作成

レビュー用に変更を提出してください：

* **重要な注意：** 必ず Pull Request を次に提出してください：

  * ✅ upstream リポジトリの `dev` ブランチ、
  * ❎ upstream リポジトリの `main` ブランチではありません。
* GitHub 上の元のリポジトリを開く
* "Pull Requests" をクリック
* "New Pull Request" をクリック
* 対象ブランチとして `dev`、比較ブランチとしてあなたのブランチを選択
* PR 説明を注意深く記入

::
