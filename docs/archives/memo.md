my-project/
│
├── index.ts # アプリエントリーポイント
├── Dockerfile
├── Pipfile / Pipfile.lock # Python依存関係
├── package.json / yarn.lock # Node.js依存関係
├── tsconfig.json
├── babel.config.js
├── nodemon.json
├── orval.config.ts # OpenAPI コード生成設定
├── openapitools.json
├── sf_client_config.json # Snowflake クライアント設定
├── version.json
├── README.md
│
├── .azure-pipeline/ # Azure CI/CD パイプライン設定
├── .github/ # GitHub Actions ワークフロー
├── .husky/ # Git フック
├── .vscode/ # VSCode 設定
│
├── api-docs/ # OpenAPI ドキュメント
├── certs/ # 証明書
├── db/
│ └── pto.sql # DB初期化SQL
├── docker/ # Docker compose等
├── scripts/ # ユーティリティスクリプト
│
├── src/ # ★ メインソースコード (TypeScript)
│ ├── apis/ # ── API エントリーポイント層
│ │ ├── index.ts
│ │ ├── apiDocs.ts
│ │ └── rootRoutes.ts
│ │
│ ├── application/ # ── アプリケーション層
│ │ ├── port/ # ポート (インターフェース定義)
│ │ ├── service/ # サービス
│ │ ├── use_case/ # ユースケース
│ │ └── utils/ # アプリ内ユーティリティ
│ │
│ ├── domain/ # ── ドメイン層
│ │ ├── entities/ # エンティティ
│ │ └── types/ # ドメイン型定義
│ │
│ ├── infrastructure/ # ── インフラストラクチャ層
│ │ ├── appError/ # アプリエラー定義
│ │ ├── configs/ # 設定ファイル
│ │ ├── env/ # 環境変数
│ │ ├── helpers/ # インフラ内ヘルパー
│ │ ├── orm/ # ORM (Snowflake等)
│ │ └── webserver/ # Webサーバー設定 (Express等)
│ │
│ ├── interface/ # ── インターフェース層
│ │ ├── controller/ # コントローラー
│ │ ├── router/ # ルーター
│ │ └── validation/ # バリデーション
│ │
│ └── models/ # ── 自動生成モデル (orval/OpenAPI)
│ ├── index.ts
│ ├── (多数の \*.ts ファイル) # API リクエスト/レスポンス型
│ └── ...
│
├── pysrc/ # ★ Pythonサブモジュール
│ ├── main.py # Pythonエントリーポイント
│ ├── cost_calculation/
│ │ └── unit_perf_cost_calculation.py # 発電費用計算ロジック
│ └── helpers/
│ └── logger.py # ロガー
│
├── pytest/ # Python テスト
│
├── test/ # ★ TypeScript テスト
│ ├── testConfig.ts
│ ├── integration/ # 統合テスト
│ │ ├── helpers/
│ │ └── v1/ # v1 API の統合テスト
│ ├── unit/ # ユニットテスト
│ │ ├── appError/
│ │ ├── controllers/
│ │ ├── env/
│ │ ├── helpers/
│ │ ├── repositories/
│ │ ├── service/
│ │ ├── snowflake/
│ │ ├── usecase/
│ │ ├── utils/
│ │ └── webserver/
│ ├── export/ # エクスポート関連テスト
│ └── util/ # テスト用ユーティリティ
│
└── testHarness/ # テストハーネス
