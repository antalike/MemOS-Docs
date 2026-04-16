---
title: MemOS ドキュメント
desc: MemOS 公式ドキュメントへようこそ – 大規模言語モデル (LLMs) に高度なモジュール式記憶機能を提供するために特化した Python パッケージです。
banner: https://statics.memtensor.com.cn/memos/memos-banner.gif
links:
  - label: 'PyPI'
    to: https://pypi.org/project/MemoryOS/
    target: _blank
    avatar:
      src: https://statics.memtensor.com.cn/icon/pypi.svg
      alt: PyPI logo
  - label: 'Open Source'
    to: https://github.com/MemTensor/MemOS
    target: _blank
    icon: i-simple-icons-github
---

## MemOS とは何ですか？

大規模言語モデル（LLMs）が絶えず進化するにつれて、それらが担うタスクは、多ターン対話、計画、意思決定、およびパーソナライズされたエージェントなどを含め、ますます複雑になっています。このような背景のもと、記憶をいかに効率的に管理し活用するかが、長期的な知能と適応能力を実現するための重要な要素となっています。
しかし、主流の LLM アーキテクチャは、記憶の構造化、管理、および統合の面で不足していることが多く、その結果、知識更新コストが高く、行動状態を持続できず、ユーザーの嗜好を蓄積しにくいという問題を引き起こしています。

**MemOS** は、記憶を、統一された構造、ライフサイクル管理、およびスケジューリング戦略を備えた中核的な第一級リソースとして再定義することで、これらの課題を解決します。これは Python パッケージを提供し、LLM ベースのアプリケーションに統一された記憶レイヤーを提供して、永続的で、構造化され、高効率な記憶操作を実現します。これにより、LLMs は長期的な知識保持、強力なコンテキスト管理、および記憶拡張推論能力を備え、よりスマートで適応的な振る舞いを支援します。

![MemOS Architecture](https://statics.memtensor.com.cn/memos/memos-architecture.png)

## 主な特徴

- **モジュール式記憶アーキテクチャ**：プレーンテキスト、活性化（KV Cache）およびパラメータ（アダプター/LoRA）記憶をサポートします。
- **MemCube**：すべての記憶タイプの統一コンテナであり、読み込み/保存および API アクセスが容易です。
- **MOS**：LLMs のための記憶拡張システムで、プラグアンドプレイの記憶モジュールを備えています。
- **グラフベースのバックエンド**：構造化され、説明可能な記憶のために、Neo4j およびその他のグラフデータベースをネイティブにサポートします。
- **統合が容易**：HuggingFace、Ollama、およびカスタム LLMs と互換性があります。
- **拡張可能**：独自の記憶モジュールまたはバックエンドを追加できます。


## インストール

基本インストール、オプション依存関係、および外部依存関係を含む完全なインストール手順については、[インストールガイド](/open_source/getting_started/installation) を参照してください。

## 貢献

貢献を歓迎します！環境のセットアップおよび pull request の提出に関する詳細については、[貢献ガイド](/open_source/contribution/overview) を参照してください。

## ライセンス

MemOS は Apache 2.0 ライセンスの下で公開されています。
