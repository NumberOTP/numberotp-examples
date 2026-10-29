import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  retries: 0, // every retry buys another number
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: { command: 'node src/server.js', url: 'http://localhost:3000', reuseExistingServer: true },
})
