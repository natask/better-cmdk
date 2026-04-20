import { expect, test } from '@playwright/test'

test.describe('selected item scroll visibility', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scroll')
  })

  test('selected item stays visible after keyboard navigation in a constrained list', async ({ page }) => {
    const input = page.locator('[cmdk-input]')
    const list = page.locator('[cmdk-list]')

    for (let i = 0; i < 10; i++) {
      await input.press('ArrowDown')
    }

    const selected = page.locator('[cmdk-item][aria-selected="true"]')
    await expect(selected).toHaveAttribute('data-value', 'item-11')

    const isVisibleInList = await page.evaluate(() => {
      const listEl = document.querySelector('[cmdk-list]')
      const selectedEl = document.querySelector('[cmdk-item][aria-selected="true"]')
      if (!listEl || !selectedEl) return false
      const listRect = listEl.getBoundingClientRect()
      const selectedRect = selectedEl.getBoundingClientRect()
      return selectedRect.top >= listRect.top && selectedRect.bottom <= listRect.bottom
    })

    await expect(list).toHaveCount(1)
    expect(isVisibleInList).toBe(true)
  })
})
