import { expect, test } from '@playwright/test'

test.describe('dialog', async () => {
  test('dialog renders in portal', async ({ page }) => {
    await page.goto('/dialog')
    await expect(page.locator(`[cmdk-dialog]`)).toHaveCount(1)
    await expect(page.locator(`[cmdk-overlay]`)).toHaveCount(1)
  })

  test('dialog open without label has no console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text())
      }
    })

    await page.goto('/dialog')
    await expect(page.locator(`[cmdk-dialog]`)).toHaveCount(1)
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })
})
