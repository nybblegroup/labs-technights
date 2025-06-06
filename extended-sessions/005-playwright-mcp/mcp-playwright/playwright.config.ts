import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Chromium visible',
      use: {
        browserName: 'chromium',
        headless: false, // 👈 No headless
        viewport: { width: 1280, height: 720 },
        video: 'on',
      },
    },
    // Puedes agregar otros navegadores si quieres:
    // {
    //   name: 'Firefox',
    //   use: { browserName: 'firefox', headless: false },
    // },
  ],
});
