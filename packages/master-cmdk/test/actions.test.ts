import { expect, test } from '@playwright/test'

test.describe('actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/actions')
  })

  test('maps action metadata into searchable command items', async ({ page }) => {
    const find = page.locator('[cmdk-item][data-action-id="find-customer"]')
    const invite = page.locator('[cmdk-item][data-action-id="invite-teammate"]')

    await expect(find).toHaveAttribute('data-action-status', 'idle')
    await expect(find).toHaveAttribute('data-action-authority', 'read')
    await expect(invite).toHaveAttribute('data-action-status', 'idle')
    await expect(invite).toHaveAttribute('data-action-authority', 'write')

    await page.locator('[cmdk-input]').fill('account lookup')
    await expect(find).toBeVisible()
    await expect(invite).toBeHidden()
  })

  test('runs read actions and exposes their result state', async ({ page }) => {
    await page.locator('[cmdk-item][data-action-id="find-customer"]').click()

    await expect(page.locator('[data-testid="find-status"]')).toHaveText('succeeded')
    await expect(page.locator('[data-testid="find-output"]')).toHaveText('Ada')
  })

  test('requires approval before a write executor runs', async ({ page }) => {
    const invite = page.locator('[cmdk-item][data-action-id="invite-teammate"]')

    await invite.click()
    await expect(page.locator('[data-testid="confirm-calls"]')).toHaveText('1')
    await expect(page.locator('[data-testid="invite-calls"]')).toHaveText('0')
    await expect(page.locator('[data-testid="invite-status"]')).toHaveText('idle')

    await page.locator('[data-testid="approve-writes"]').check()
    await invite.click()

    await expect(page.locator('[data-testid="confirm-calls"]')).toHaveText('2')
    await expect(page.locator('[data-testid="invite-calls"]')).toHaveText('1')
    await expect(page.locator('[data-testid="invite-status"]')).toHaveText('succeeded')
    await expect(page.locator('[data-testid="invite-output"]')).toHaveText('ada@example.com')
  })

  test('shows permission denial without running the executor', async ({ page }) => {
    await page.locator('[cmdk-item][data-action-id="delete-account"]').click()

    await expect(page.locator('[data-testid="delete-status"]')).toHaveText('denied')
    await expect(page.locator('[data-testid="delete-reason"]')).toHaveText('Account deletion is disabled')
    await expect(page.locator('[data-testid="delete-calls"]')).toHaveText('0')
  })

  test('renders a searchable action generated from OpenAPI', async ({ page }) => {
    const generated = page.locator('[cmdk-item][data-action-id="directory-api:listTeams"]')

    await expect(generated).toHaveText('List teams from OpenAPI')
    await expect(generated).toHaveAttribute('data-action-authority', 'read')
    await page.locator('[cmdk-input]').fill('directory')
    await expect(generated).toBeVisible()
  })

  test('executes an OpenAPI action against the local fixture', async ({ page }) => {
    await page.locator('[cmdk-item][data-action-id="directory-api:listTeams"]').click()

    await expect(page.locator('[data-testid="teams-status"]')).toHaveText('succeeded')
    await expect(page.locator('[data-testid="teams-output"]')).toHaveText('{"teams":["Core","Growth"]}')
  })
})
