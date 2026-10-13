import { defineConfig } from '@playwright/test'

// Deliberately no globalSetup: this fixture uses only public assets and browser
// state on an already provisioned isolated QA server. No DB lifecycle or writes.
if (!process.env.TEST_BASE_URL) throw new Error('TEST_BASE_URL must identify the isolated QA server.')
export default defineConfig({
    testDir: './tests/e2e/i18n',
    testMatch: 'core-host60.spec.js',
    workers: 1,
    retries: 0,
    timeout: 30000,
    reporter: [['list'], ['json', { outputFile: 'test-results/i18n-core-qa.json' }]],
    use: { baseURL: process.env.TEST_BASE_URL, channel: 'chrome', headless: true },
})
