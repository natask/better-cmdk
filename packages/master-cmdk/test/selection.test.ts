import { expect, test } from '@playwright/test'

test.describe('selection follows the active search query', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selection')
  })

  test('query changes always select the first visible result and clear returns to browse order', async ({ page }) => {
    const input = page.locator(`[cmdk-input]`)
    const selected = page.locator(`[cmdk-item][aria-selected="true"]`)
    await expect(selected).toHaveAttribute('data-value', 'alpha')

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await expect(selected).toHaveAttribute('data-value', 'echo')

    await input.fill('o')
    const firstVisibleValue = await page.locator(`[cmdk-item]`).first().getAttribute('data-value')
    expect(firstVisibleValue).toBeTruthy()
    expect(firstVisibleValue).not.toBe('echo')
    await expect(selected).toHaveAttribute('data-value', firstVisibleValue || '')

    await input.fill('')
    await expect(selected).toHaveAttribute('data-value', 'alpha')
  })

  test('home and end target the current filtered result set', async ({ page }) => {
    const input = page.locator(`[cmdk-input]`)
    const selected = page.locator(`[cmdk-item][aria-selected="true"]`)

    await input.fill('o')

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
    await expect(selected).toHaveAttribute('data-value', 'alpha')

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
