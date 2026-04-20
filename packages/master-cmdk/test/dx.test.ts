import { expect, test } from '@playwright/test'

test.describe('dx props and ime behavior', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dx')
  })

  test('inputId sets the underlying input id', async ({ page }) => {
    const input = page.getByTestId('input-id-input')
    await expect(input).toHaveAttribute('id', 'custom-search-id')
    await expect(page.locator('label[for="custom-search-id"]')).toHaveCount(1)
  })

  test('onEmpty fires once per transition into empty results', async ({ page }) => {
    const input = page.getByTestId('on-empty-input')
    const count = page.getByTestId('on-empty-count')

    await expect(count).toHaveText('0')

    await input.fill('z')
    await expect(count).toHaveText('1')

    await input.fill('zz')
    await expect(count).toHaveText('1')

    await input.fill('')
    await expect(count).toHaveText('1')

    await input.fill('zz')
    await expect(count).toHaveText('2')
  })

  test('defaultSearch sets initial input value and applies filtering', async ({ page }) => {
    const scope = page.getByTestId('default-search-scope')
    await expect(page.getByTestId('default-search-input')).toHaveValue('bet')
    await expect(scope.locator('[cmdk-item]')).toHaveCount(1)
    await expect(scope.locator('[cmdk-item]')).toHaveText('beta')
  })

  test('ime composition suppresses updates until compositionend', async ({ page }) => {
    const input = page.getByTestId('ime-input')
    const scope = page.getByTestId('ime-scope')

    await expect(scope.locator('[cmdk-item]')).toHaveCount(2)
    await input.dispatchEvent('compositionstart')
    await input.type('nih')

    await expect(page.getByTestId('ime-calls')).toHaveText('')
    await expect(scope.locator('[cmdk-item]')).toHaveCount(2)

    await input.dispatchEvent('compositionend')
    await expect(page.getByTestId('ime-calls')).toHaveText('nih')
    await expect(scope.locator('[cmdk-item]')).toHaveCount(1)
  })

  test('hidden label element is not rendered', async ({ page }) => {
    await expect(page.locator('[cmdk-label]')).toHaveCount(0)
  })
})
