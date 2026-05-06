import { expect, test } from '@playwright/test'

test.describe('group', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/group')
  })

  test('groups are shown/hidden based on item matches', async ({ page }) => {
    await page.locator(`[cmdk-input]`).first().type('z')
    await expect(page.locator(`[cmdk-group][data-value="Animals"]`)).not.toBeVisible()
    await expect(page.locator(`[cmdk-group][data-value="Letters"]`)).toBeVisible()
  })

  test('group can be progressively rendered', async ({ page }) => {
    await expect(page.locator(`[cmdk-group][data-value="Numbers"]`)).not.toBeVisible()
    await page.locator(`[cmdk-input]`).first().type('t')
    await expect(page.locator(`[cmdk-group][data-value="Animals"]`)).not.toBeVisible()
    await expect(page.locator(`[cmdk-group][data-value="Letters"]`)).not.toBeVisible()
    await expect(page.locator(`[cmdk-group][data-value="Numbers"]`)).toBeVisible()
  })

  test('mounted group still rendered with filter using forceMount', async ({ page }) => {
    await page.locator(`data-testid=forceMount`).click()
    await page.locator(`[cmdk-input]`).first().type('Giraffe')
    await expect(page.locator(`[cmdk-group][data-value="Letters"]`)).toBeVisible()
  })

  test('group with special-char value does not throw and renders normally', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.locator(`[cmdk-input]`).first().type('needle')
    await expect(page.getByText('Special Needle')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('groups restore initial order after search clears', async ({ page }) => {
    const visibleGroupHeadings = page.locator(
      `[data-testid="restore-order-demo"] [cmdk-group]:not([hidden]) [cmdk-group-heading]`,
    )
    const restoreInput = page.locator(`[data-testid="restore-order-input"]`)

    await expect(visibleGroupHeadings).toHaveText(['A', 'B', 'C'])
    await restoreInput.fill('banana')
    await expect(visibleGroupHeadings).toHaveText(['B'])
    await restoreInput.fill('')
    await expect(visibleGroupHeadings).toHaveText(['A', 'B', 'C'])
  })

  test('items restore source order after search clears (upstream #264/#375)', async ({ page }) => {
    const input = page.locator(`[data-testid="item-restore-input"]`)
    const labels = page.locator(`[data-testid="item-restore-demo"] [cmdk-item]`)
    const selected = page.locator(`[data-testid="item-restore-demo"] [cmdk-item][aria-selected="true"]`)
    const expected = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon']
    await expect(labels).toHaveText(expected)
    // Query changes keep the user in search mode, so selection follows the
    // top-ranked item for the active query.
    await input.fill('e')
    await expect(labels.first()).toHaveText('elderberry')
    await expect(selected).toHaveText('elderberry')
    // After clear, DOM order resets to source and selection returns to the
    // first row of the browse order.
    await input.fill('')
    await expect(labels).toHaveText(expected)
    await expect(selected).toHaveText('apple')
  })

  test('query changes override a row you arrowed to during search', async ({ page }) => {
    const input = page.locator(`[data-testid="item-restore-input"]`)
    const selected = page.locator(`[data-testid="item-restore-demo"] [cmdk-item][aria-selected="true"]`)
    await input.focus()
    await input.fill('e')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    const pickedDuringSearch = await selected.textContent()
    expect(pickedDuringSearch).not.toBe('elderberry')
    await input.fill('el')
    await expect(selected).toHaveText('elderberry')
  })

  test('mixed items and groups restore interleaving after clear', async ({ page }) => {
    const input = page.locator(`[data-testid="mixed-restore-input"]`)
    const topLevelChildren = page.locator(
      `[data-testid="mixed-restore-demo"] [cmdk-list-sizer] > *`,
    )
    const initial = await topLevelChildren.evaluateAll((els) =>
      els.map((e) => {
        if (e.hasAttribute('cmdk-group')) return `group:${e.querySelector('[cmdk-group-heading]')?.textContent ?? ''}`
        if (e.hasAttribute('cmdk-item')) return `item:${e.getAttribute('data-value')}`
        return e.tagName.toLowerCase()
      }),
    )
    await input.fill('c')
    await input.fill('')
    const afterClear = await topLevelChildren.evaluateAll((els) =>
      els.map((e) => {
        if (e.hasAttribute('cmdk-group')) return `group:${e.querySelector('[cmdk-group-heading]')?.textContent ?? ''}`
        if (e.hasAttribute('cmdk-item')) return `item:${e.getAttribute('data-value')}`
        return e.tagName.toLowerCase()
      }),
    )
    expect(afterClear).toEqual(initial)
  })

  test('group-level filter overrides command filter for that group only', async ({ page }) => {
    const input = page.locator(`[data-testid="group-filter-input"]`)
    const demo = page.locator(`[data-testid="group-filter-demo"]`)

    await input.fill('nonmatch')

    await expect(demo.locator(`[cmdk-group][data-value="Always Match"]`)).toBeVisible()
    await expect(demo.locator(`[cmdk-group][data-value="Default Match"]`)).not.toBeVisible()
    await expect(demo.locator(`[cmdk-item]`)).toHaveCount(2)
  })
})
