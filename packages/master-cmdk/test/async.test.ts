import { expect, test } from '@playwright/test'

test.describe('async behavior', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async')
  })

  test('debounce coalesces rapid input into one callback dispatch', async ({ page }) => {
    const input = page.locator('[data-testid="async-input"]')
    await input.type('alpha')

    await page.waitForTimeout(700)
    await expect(page.locator('[data-testid="calls"]')).toHaveText('1')
    await expect(page.locator('[data-testid="resolved"]')).toHaveText('1')
    await expect(page.locator('[data-testid="aborts"]')).toHaveText('0')
  })

  test('input echoes typed characters immediately despite debounce', async ({ page }) => {
    const input = page.locator('[data-testid="async-input"]')
    await input.type('alpha')
    // Read the displayed value before the debounce window elapses
    await expect(input).toHaveValue('alpha')
    // Callback has not yet fired during the debounce window
    await expect(page.locator('[data-testid="calls"]')).toHaveText('0')
  })

  test('controlled input still echoes immediately with debounce enabled', async ({ page }) => {
    const input = page.locator('[data-testid="controlled-debounce-input"]')
    await input.fill('alpha')
    // Controlled value remains stale until debounce elapses; display should still echo instantly.
    await expect(input).toHaveValue('alpha')
    await expect(page.locator('[data-testid="controlled-calls"]')).toHaveText('0')

    await page.waitForTimeout(220)
    await expect(page.locator('[data-testid="controlled-calls"]')).toHaveText('1')
    await expect(page.locator('[data-testid="controlled-search"]')).toHaveText('alpha')
  })

  test('new value aborts previous request and loading toggles through Command.Loading', async ({ page }) => {
    const input = page.locator('[data-testid="async-input"]')

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
