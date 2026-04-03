# Backend Refactoring TODO List

## 1. 依存性注入 (DI) の整理
現在の `index.ts` では、各ルートハンドラー内でリポジトリやユースケースを毎回手動でインスタンス化しています。これを改善し、テスタビリティと保守性を向上させます。

- [ ] `Dependency Middleware` の導入
  - Hono のコンテキスト (`c.set/c.get`) を利用し、リポジトリやサービスをミドルウェア層で注入する仕組みを作る。
  - テスト時に D1 データベースなどを簡単にモックに差し替えられるようにする。

## 2. コントローラー (Handler) の分離
`index.ts` にすべてのロジックが書かれており、ファイルが肥大化し始めています。

- [ ] `src/interface/controller/` ディレクトリの活用
  - 各ルートのロジックを `marketController.ts`, `syncController.ts` などに抽出する。
  - `index.ts` はルートの定義とミドルウェアの設定のみに集中させる。

## 3. 共通エラーハンドリングの導入
各ハンドラーにある `try-catch` と個別のエラーレスポンス生成を統一します。

- [ ] Hono の `app.onError` を活用したグローバルエラーハンドラーの実装。
- [ ] カスタムエラークラス (`AppError`, `NotFoundError` 等) の定義。
- [ ] エラーログ出力の統一。

## 4. ビジネスロジックの UseCase への完全委譲
`index.ts` 内に「データが空なら自動同期する」といったロジックが混入しています。

- [ ] `marketSessionsRoute` 内の自動同期ロジックを、新しい UseCase または既存の UseCase の内部へ移動する。
- [ ] インターフェース層 (Hono) は、単にリクエストを受け取って UseCase を呼び出すだけに徹する。

## 5. フロントエンド単体テスト (London School / Coverage 100%)
ロジック層の完全な保護を目指します。

- [ ] **Common Hooks テスト**
  - [ ] `useIndicatorSelection.ts`: `useRouter`, `useSearchParams` とのインタラクションを検証。
- [ ] **Market Replay Hooks テスト**
  - [ ] `useReplayChart.ts`: `lightweight-charts` の API 呼び出し（初期化、データセット、マーカー描画）が正しく行われるかをモックで検証。
- [ ] **Feature API テスト**
  - [ ] `getReplayData.ts`: `apiClient` の呼び出しとレスポンス変換の検証。
  - [ ] `getSessions.ts`: 同上。

## 6. Playwright による機能結合テスト
ユーザー視点での結合度を担保します。
- [ ] 指標切り替え時のチャート再描画シナリオの実装。
- [ ] エラー時の空表示（📭）の確認。

---
※このTODOリストは現状の分析結果です。優先順位を相談した上で作業に入ります。
