import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const calls: Array<{ block?: ScrollLogicalPosition; text: string | null }> =
      []
    Object.defineProperty(window, "__myCmdkScrollCalls", { value: calls })
    Element.prototype.scrollIntoView = function (
      options?: boolean | ScrollIntoViewOptions,
    ) {
      calls.push({
        block: typeof options === "object" ? options.block : undefined,
        text: this.textContent,
      })
    }
  })
  await page.goto("/?mycmdk")
})

test("filters case-insensitively and repairs selection", async ({ page }) => {
  const input = page.getByRole("combobox")
  const options = page.getByRole("option")

  await expect(options.filter({ hasText: "New File" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await input.fill("PUSH")

  await expect(options.filter({ hasText: "Git Push" })).toBeVisible()
  await expect(options.filter({ hasText: "Git Push" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(options.filter({ hasText: "Git Pull" })).toBeHidden()

  await input.fill("not present")
  await expect(page.getByRole("status")).toHaveText("no results")
  await expect(
    page.locator('[role="option"][aria-selected="true"]'),
  ).toHaveCount(0)
})

test("wraps keyboard selection and commits with Enter", async ({ page }) => {
  const input = page.getByRole("combobox")
  const selected = page.locator('[role="option"][aria-selected="true"]')

  await expect(selected).toHaveText("New File")
  await input.press("ArrowUp")
  await expect(selected).toHaveText("Deploy")
  await input.press("ArrowDown")
  await expect(selected).toHaveText("New File")
  await input.press("ArrowDown")
  await expect(selected).toHaveText("Open File")
  await input.press("Enter")

  await expect(page.getByText("last committed:")).not.toContainText("—")
})

test("keeps keyboard selection visible", async ({ page }) => {
  const input = page.getByRole("combobox")

  await page.evaluate(() => {
    ;(window as typeof window & {
      __myCmdkScrollCalls: unknown[]
    }).__myCmdkScrollCalls.length = 0
  })
  await input.press("ArrowDown")

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & {
            __myCmdkScrollCalls: Array<{
              block?: ScrollLogicalPosition
              text: string | null
            }>
          }).__myCmdkScrollCalls,
      ),
    )
    .toContainEqual({ block: "nearest", text: "Open File" })
})
