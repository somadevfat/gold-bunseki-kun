import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 設定ファイル
 * @responsibility E2Eテストの実行環境（サーバー起動、ブラウザ選択、タイムアウト等）を定義する。
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* テスト実行前に「モックバックエンド」と「フロントエンド」を自動起動する */
  webServer: [
    {
      command: 'bun run dev:mock',
      port: 8788,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun run dev:vinext',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      env: {
        /* フロントエンドの API 接続先をモックサーバーに向ける */
        NEXT_PUBLIC_API_URL: 'http://localhost:8788',
      },
    }
  ],
});