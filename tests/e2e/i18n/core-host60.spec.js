import { test, expect } from '@playwright/test'

test.skip(process.env.MMGIS_I18N_QA !== 'true', 'Explicitly enable the isolated Host60 fixture QA.')
const fixture = '/public/i18n/qa.html'

test('defaults to Chinese, preserves draft and URL state, persists across reload', async ({ page }) => {
    await page.goto(fixture + '?mission=demo#view')
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
    await expect(page.locator('#save')).toHaveText('保存')
    await page.locator('#draft').fill('未保存的项目说明')
    await page.locator('#english').click()
    await expect(page.locator('#save')).toHaveText('Save')
    await expect(page.locator('#draft')).toHaveValue('未保存的项目说明')
    expect(new URL(page.url()).searchParams.get('mission')).toBe('demo')
    expect(new URL(page.url()).hash).toBe('#view')
    await page.reload()
    await expect(page.locator('#save')).toHaveText('Save')
    await page.goto(fixture + '?lang=zh-CN')
    await expect(page.locator('#save')).toHaveText('保存')
})

test('language propagates between real tabs without losing unsaved input', async ({ context }) => {
    const a = await context.newPage()
    const b = await context.newPage()
    await a.goto(fixture)
    await b.goto(fixture)
    await expect(a.locator('body')).toHaveAttribute('data-ready', 'true')
    await expect(b.locator('body')).toHaveAttribute('data-ready', 'true')
    await b.locator('#draft').fill('第二个标签页的内容')
    await a.locator('#english').click()
    await expect(b.locator('#save')).toHaveText('Save')
    await expect(b.locator('#draft')).toHaveValue('第二个标签页的内容')
    await b.locator('#chinese').click()
    await expect(a.locator('#save')).toHaveText('保存')
})

test('blocked browser persistence still permits in-memory language changes', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage blocked') } })
        Object.defineProperty(document, 'cookie', { get() { throw new Error('cookie blocked') }, set() { throw new Error('cookie blocked') } })
    })
    await page.goto(fixture + '?lang=zh-CN')
    await expect(page.locator('#save')).toHaveText('保存')
    await page.locator('#english').click()
    await expect(page.locator('#save')).toHaveText('Save')
    await expect(page.locator('#feedback')).toHaveText('')
})
