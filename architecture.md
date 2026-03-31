# アーキテクチャ ディレクトリツリー（Clean Architecture）

各ディレクトリ名は `memo.md` のClean Architecture構成と完全に一致させる。

```text
gold-vola-bunseki/
│
├── README.md
├── docker/                      # Docker コンテナ関連の構成
├── docs/                        # プロジェクト全体のドキュメント
│
├── apps/
│   │
│   ├── backend/                 # ★ メイン バックエンドAPI (TypeScript / Hono)
│   │   ├── package.json
│   │   ├── wrangler.jsonc       # Cloudflare Workers 設定
│   │   ├── src/
│   │   │   ├── index.ts         # アプリケーションのエントリーポイント
│   │   │   │
│   │   │   ├── domain/          # ── ドメイン層 (Zod スキーマ, ビジネスロジック)
│   │   │   │   ├── entities/    # コアエンティティ（例: price.ts, zigzag.ts）
│   │   │   │   └── types/       # Zod OpenAPI 定義、共通の型
│   │   │   │
│   │   │   ├── application/     # ── アプリケーション層
│   │   │   │   ├── port/        # ★ ポート (リポジトリ等のインターフェース定義)
│   │   │   │   └── use_case/    # ユースケースの具体的なビジネスロジック実装
│   │   │   │
│   │   │   ├── interface/       # ── インターフェース層
│   │   │   │   ├── controller/  # Hono ハンドラ（外部からのリクエスト窓口）
│   │   │   │   ├── routes/      # Hono Zod OpenAPI ルーティング定義
│   │   │   │   └── validator/   # Zod による入力バリデーション
│   │   │   │
│   │   │   └── infrastructure/  # ── インフラストラクチャ層
│   │   │       ├── database/    # Cloudflare D1 / KV / Postgres 接続
│   │   │       ├── repository/  # portで定義したインターフェースの具体的な実装
│   │   │       └── external/    # 外部API（Twelve Data, Python Analytics）の接続
│   │
│   └── analytics/               # ★ データ分析・サブモジュール (Python)
│       ├── pyproject.toml       # Pythonの依存関係
│       ├── main.py              # 分析処理のエントリーポイント
│       ├── core/                # ボラティリティ等の計算ロジック
│       └── helpers/             # ロガーや共通ユーティリティ
│
└── tests/                       # 全体テスト（必要に応じて）
```
