# ADR-0003: バックエンドのVPS/PostgreSQLへの移行とフロントエンドのCloudflare Pages継続利用

## ステータス
承認済み (Accepted)

## コンテキスト
プロジェクトの成長と運用コスト最適化、またデータベースに対する複雑なクエリ要件を鑑み、これまでの完全サーバーレス構成（Cloudflare Workers + D1）からアーキテクチャの再設計を行う必要があった。
フロントエンドは引き続きゼロコストでグローバルに高速配信したい一方で、バックエンドには強力で安定したリレーショナルデータベース（PostgreSQL）と、常駐プロセス（Bun）が必要と判断した。

## 決定事項
以下のハイブリッドなデプロイメントアーキテクチャを採用する。

1.  **Frontend**: `Cloudflare Pages`
    - 引き続き GitHub Actions CI/CD を用いて自動デプロイを行う。
    - 無料の帯域幅とグローバルな CDN の恩恵を受けるため、静的アセットとフロントエンドは Cloudflare に残す。
2.  **Backend API**: `VPS`上の `Bun.serve` + `Nginx`
    - バックエンドは VPS（仮想専用サーバー）に移行する。
    - Bun の高速なランタイムと組み込み HTTP サーバー (`Bun.serve`) を直接使用する。
    - Nginx をリバースプロキシとして配置し、HTTPS (Let's Encrypt) の終端とポートのルーティングを担当させる。
3.  **Database**: `PostgreSQL` (VPS上の Docker)
    - Cloudflare D1 (SQLite) から PostgreSQL に変更する。
    - Docker Compose を利用して VPS 内に構築し、バックエンド API からローカルネットワーク経由で接続する。

## 結果
- **メリット**: 
  - DB のロックや複雑なクエリのパフォーマンス問題が PostgreSQL によって解消される。
  - フロントエンドは Cloudflare のままなので、Web サーバーの負荷と転送コストを劇的に下げられる。
  - Nginx を挟むことで、将来的なスケールやセキュリティ設定（WAF等）が柔軟に行える。
- **リスク・デメリット**: 
  - VPS の運用・保守（OSのアップデート、SSL証明書の更新、Dockerの管理）というインフラ管理コストが発生する。
  - バックエンドのデプロイ自動化には、SSH経由での Pull & Restart スクリプトなど、Cloudflare よりも複雑な CI/CD パイプラインを後日組む必要がある。
