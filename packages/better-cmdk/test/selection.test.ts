import { expect, test } from '@playwright/test'

test.describe('selection across filter changes', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selection')
  })

  test('keeps selected value when narrowing search still includes it', async ({ page }) => {
    const input = page.locator(`[cmdk-input]`)
    const selected = page.locator(`[cmdk-item][aria-selected="true"]`)

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await expect(selected).toHaveAttribute('data-value', 'echo')

    await input.fill('o')
    await expect(selected).toHaveAttribute('data-value', 'echo')

    const lastVisibleValue = await page.locator(`[cmdk-item]`).last().getAttribute('data-value')
    await input.press('End')
    await expect(selected).toHaveAttribute('data-value', lastVisibleValue || '')

    const firstVisibleValue = await page.locator(`[cmdk-item]`).first().getAttribute('data-value')
    await input.press('Home')
    await expect(selected).toHaveAttribute('data-value', firstVisibleValue || '')
  })

  test('selects first visible value when current selection is filtered out', async ({ page }) => {
    const input = page.locator(`[cmdk-input]`)
    const selected = page.locator(`[cmdk-item][aria-selected="true"]`)

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await expect(selected).toHaveAttribute('data-value', 'echo')

    await input.fill('br')
    await expect(page.locator(`[cmdk-item]`)).toHaveCount(1)
    await expect(selected).toHaveAttribute('data-value', 'bravo')
  })
})
