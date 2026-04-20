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

  test('group-level filter overrides command filter for that group only', async ({ page }) => {
    const input = page.locator(`[data-testid="group-filter-input"]`)
    const demo = page.locator(`[data-testid="group-filter-demo"]`)

    await input.fill('nonmatch')

    await expect(demo.locator(`[cmdk-group][data-value="Always Match"]`)).toBeVisible()
    await expect(demo.locator(`[cmdk-group][data-value="Default Match"]`)).not.toBeVisible()
    await expect(demo.locator(`[cmdk-item]`)).toHaveCount(2)
  })
})
