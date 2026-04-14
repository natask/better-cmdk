import { expect, test } from '@playwright/test'

test.describe('item selection perf behavior', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/perf')
  })

  test('moving selection updates only prior and next selected items', async ({ page }) => {
    const input = page.locator('[cmdk-input]')
    const selected = page.locator('[cmdk-item][aria-selected="true"]')
    await expect(selected).toHaveAttribute('data-value', 'item-1')

    await page.evaluate(() => {
      const changed = new Set<string>()
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type !== 'attributes' || record.attributeName !== 'data-selected') continue
          const value = (record.target as HTMLElement).getAttribute('data-value')
          if (value) changed.add(value)
        }
      })

      const list = document.querySelector('[cmdk-list]')
      if (list) {
        observer.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-selected'] })
      }

      ;(window as any).__selectionMutationObserver = observer
      ;(window as any).__selectionMutationValues = changed
    })

    await input.press('ArrowDown')
    await expect(selected).toHaveAttribute('data-value', 'item-2')

    const changed = await page.evaluate(() => {
      ;(window as any).__selectionMutationObserver?.disconnect()
      return Array.from((window as any).__selectionMutationValues ?? [])
    })

    expect(changed).toContain('item-1')
    expect(changed).toContain('item-2')
    expect(changed.length).toBeLessThanOrEqual(2)
  })
})
