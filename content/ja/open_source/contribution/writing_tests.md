---
title: 単体テストの書き方
desc: このプロジェクトでは、単体テストに [pytest](https://docs.pytest.org/) を使用します。
---

## テストを書く

1. `tests/` ディレクトリの下に新しい Python ファイルを作成し、ファイル名は `test_` で始める必要があります。
2. そのファイル内で、`test_` で始まる関数を定義します。
3. `assert` 文を使用して期待される結果を確認します。

以下は基本的な例です：

```python
# tests/test_example.py

def test_addition():
    assert 1 + 1 == 2
```

## テストを実行する

すべてのテストを実行するには、プロジェクトのルートディレクトリで次のコマンドを実行してください：

```bash
make test
```

このコマンドは、`tests/` ディレクトリ配下のすべてのテストケースを自動的に検出して実行します。

## 高度なテクニック

Pytest は、fixtures や mocking などの多くの高度な機能を提供しています。

### Fixtures

Fixtures は、テストにデータを提供したり初期状態を設定したりできる関数です。`@pytest.fixture` デコレータを使用して定義します。

### Mocking

Mocking は、システム内の一部を mock オブジェクトで置き換えるために使用されます。これは、テスト対象のコードを分離するのに非常に有用です。一般的なツールは `unittest.mock` ライブラリで、通常は `patch` 関数と組み合わせて使用します。

mocking の例については、`tests/test_hello_world.py` を参照してください。
