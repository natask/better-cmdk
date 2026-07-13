import { PlaywrightTestConfig, devices } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '3100'
const baseURL = `http://localhost:${port}`

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['json', { outputFile: 'playwright-report.json' }]] : 'list',
  testDir: './test',
  use: {
    trace: 'on-first-retry',
    baseURL,
  },
  timeout: 10000,
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: baseURL,
    cwd: './test',
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1',
  },
  projects: [
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: true },
    },
  ],
}

export default config
