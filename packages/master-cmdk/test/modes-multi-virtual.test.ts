import { expect, test } from '@playwright/test'

test.describe('modes + multi-select + virtualization', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/modes')
  })

  test('mode switching scopes rendered items', async ({ page }) => {
    await expect(page.locator('[data-testid="mode-value"]')).toHaveText('commands')
    await expect(page.locator('[cmdk-item][data-value="open-repo"]')).toBeVisible()
    await expect(page.locator('[cmdk-item][data-value="file-001"]')).toHaveCount(0)

    await page.locator('[data-testid="mode-files"]').click()

    await expect(page.locator('[data-testid="mode-value"]')).toHaveText('files')
    await expect(page.locator('[cmdk-item][data-value="open-repo"]')).toHaveCount(0)
    await expect(page.locator('[cmdk-item][data-value="file-001"]')).toBeVisible()
  })

  test('multi-select toggles checked state and callback payload', async ({ page }) => {
    const checked = page.locator('[cmdk-item][data-checked="true"]')

    await expect(checked).toHaveCount(0)
    await page.locator('[cmdk-item][data-value="open-repo"]').click()
    await page.locator('[cmdk-item][data-value="deploy"]').click()

    await expect(checked).toHaveCount(2)
    await expect(page.locator('[data-testid="checked-values"]')).toHaveText('open-repo|deploy')

    await page.locator('[cmdk-item][data-value="open-repo"]').click()

    await expect(checked).toHaveCount(1)
    await expect(page.locator('[data-testid="checked-values"]')).toHaveText('deploy')
  })

  test('virtualization hides off-window rows and reveals them on scroll', async ({ page }) => {
    await page.locator('[data-testid="mode-files"]').click()

    const list = page.locator('[data-testid="mode-list"]')
    await expect(list).toHaveAttribute('data-virtualized', 'true')

    const before = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-testid="mode-list"] [cmdk-item]')) as HTMLElement[]
      const hidden = nodes.filter((node) => getComputedStyle(node).display === 'none').length
      return { total: nodes.length, hidden }
    })

    expect(before.total).toBeGreaterThan(100)
    expect(before.hidden).toBeGreaterThan(0)

    await list.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })

    await expect(page.locator('[cmdk-item][data-value="file-140"]')).toBeVisible()
  })
})
