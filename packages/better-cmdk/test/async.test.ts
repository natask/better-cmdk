import { expect, test } from '@playwright/test'

test.describe('async behavior', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async')
  })

  test('debounce coalesces rapid input into one callback dispatch', async ({ page }) => {
    const input = page.locator('[cmdk-input]')
    await input.type('alpha')

    await page.waitForTimeout(700)
    await expect(page.locator('[data-testid="calls"]')).toHaveText('1')
    await expect(page.locator('[data-testid="resolved"]')).toHaveText('1')
    await expect(page.locator('[data-testid="aborts"]')).toHaveText('0')
  })

  test('new value aborts previous request and loading toggles through Command.Loading', async ({ page }) => {
    const input = page.locator('[cmdk-input]')

    await input.fill('a')
    await page.waitForTimeout(220)
    await expect(page.locator('[data-testid="loading"]')).toBeVisible()

    await input.fill('al')
    await page.waitForTimeout(700)

    await expect(page.locator('[data-testid="calls"]')).toHaveText('2')
    await expect(page.locator('[data-testid="aborts"]')).toHaveText('1')
    await expect(page.locator('[data-testid="resolved"]')).toHaveText('1')
    await expect(page.locator('[data-testid="loading"]')).toHaveCount(0)
  })
})
