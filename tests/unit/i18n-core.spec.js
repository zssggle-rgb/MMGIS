import { test, expect } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { normalizeLocale, readLocaleCookie, resolveLocale, browserLocale, normalizeRootPath, withLocale, localeCookie } from '../../locales/runtime/locale'
import { createI18n } from '../../locales/runtime/engine'
import { STORAGE_KEY, parseEvent, newer, createLocaleController } from '../../locales/runtime/controller'
import { validateCatalogs, loadCatalogs, prepareResources, placeholders } from '../../scripts/i18n/prepare'
import { verifyRuntime } from '../../scripts/i18n/verify-runtime'
import crypto from 'crypto'

const resources = {
    en: { common: { 'action.save': 'Save', 'message.named': 'Hello, {{name}}.' } },
    'zh-CN': { common: { 'action.save': '保存', 'message.named': '{{name}}，您好。' } },
}

function browser({ blocked = false, url = 'https://example.test/proxy/mmgis/?mission=demo#map' } = {}) {
    const handlers = new Map()
    const storage = new Map()
    const location = new URL(url)
    const environment = {
        crypto: { randomUUID: () => 'test-tab' },
        document: { cookie: 'MMGISLocale=zh-CN', documentElement: { lang: '' } },
        history: { state: { viewport: 1 }, replaceState: (state, title, href) => { environment.history.state = state; environment.location = new URL(href) } },
        location,
        localStorage: {
            getItem: (key) => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value),
        },
        addEventListener: (name, callback) => handlers.set(name, callback),
        removeEventListener: (name, callback) => { if (handlers.get(name) === callback) handlers.delete(name) },
        console: { error: () => undefined },
    }
    if (blocked) {
        Object.defineProperty(environment, 'localStorage', { get() { throw new Error('storage blocked') } })
        Object.defineProperty(environment.document, 'cookie', { get() { throw new Error('cookie blocked') }, set() { throw new Error('cookie blocked') } })
        environment.history.replaceState = () => { throw new Error('history blocked') }
    }
    return { environment, handlers, storage }
}

test.describe('locale rules', () => {
    test('URL > allowlisted cookie > default Chinese', () => {
        expect(resolveLocale({ url: '/map?lang=en', cookie: 'MMGISLocale=zh-CN' })).toBe('en')
        expect(resolveLocale({ url: '/map?lang=invalid', cookie: 'MMGISLocale=en' })).toBe('en')
        expect(resolveLocale()).toBe('zh-CN')
        expect(resolveLocale({ url: 'http://[', cookie: 'MMGISLocale=en' })).toBe('en')
        expect(normalizeLocale('en-US')).toBeNull()
        expect(normalizeLocale(null)).toBeNull()
        expect(normalizeLocale('zh-CN')).toBe('zh-CN')
    })
    test('malformed and similarly named cookies do not override locale', () => {
        expect(readLocaleCookie('other=1; MMGISLocale=en')).toBe('en')
        expect(readLocaleCookie('MMGISLocale=%E0%A4')).toBeNull()
        expect(readLocaleCookie('xMMGISLocale=en')).toBeNull()
        expect(readLocaleCookie('MMGISLocale=fr')).toBeNull()
        expect(readLocaleCookie(null)).toBeNull()
    })
    test('blocked cookie reads still honor explicit URL language', () => {
        const { environment } = browser({ blocked: true, url: 'https://example.test/?lang=en' })
        expect(browserLocale(environment)).toBe('en')
    })
    test('deployment paths and switching preserve unrelated state', () => {
        expect(normalizeRootPath('/mmgis/', '/proxy/')).toBe('/proxy/mmgis')
        expect(normalizeRootPath()).toBe('/')
        expect(() => normalizeRootPath('/a/../b')).toThrow()
        expect(() => normalizeRootPath('/a; Domain=example.test')).toThrow()
        expect(() => normalizeRootPath(null)).toThrow()
        expect(localeCookie('zh-CN', '/proxy/mmgis', true)).toContain('Path=/proxy/mmgis;')
        expect(localeCookie('en')).not.toContain('Secure')
        expect(() => localeCookie('fr')).toThrow()
        const next = new URL(withLocale('https://example.test/a?mission=demo&x=1#map', 'en'))
        expect(next.searchParams.get('mission')).toBe('demo')
        expect(next.hash).toBe('#map')
        expect(next.searchParams.get('lang')).toBe('en')
        expect(() => withLocale('/a', 'fr')).toThrow()
    })
})

test.describe('translation engine', () => {
    test('independent instances and fixed translators do not leak languages', async () => {
        const a = createI18n(resources, 'en')
        const b = createI18n(resources, 'zh-CN')
        await Promise.all([a.ready, b.ready])
        const fixedEnglish = b.instance.getFixedT('en')
        await a.instance.changeLanguage('zh-CN')
        expect(a.instance.t('action.save')).toBe('保存')
        expect(b.instance.t('action.save')).toBe('保存')
        expect(fixedEnglish('action.save')).toBe('Save')
        expect(() => createI18n(resources, 'fr')).toThrow()
    })
    test('escapes interpolation by default and supports controlled English fallback', async () => {
        const catalogs = JSON.parse(JSON.stringify(resources))
        delete catalogs['zh-CN'].common['action.save']
        const { instance, ready } = createI18n(catalogs)
        await ready
        expect(instance.t('action.save')).toBe('Save')
        expect(instance.t('message.named', { name: '<b>name</b>' })).toContain('&lt;b&gt;')
        expect(instance.t('message.named', { name: '<b>name</b>', interpolation: { escapeValue: false } })).toBe('<b>name</b>，您好。')
    })
})

test.describe('controller', () => {
    test('rapid local changes are ordered with unique revisions and preserve URL/history', async () => {
        const { instance, ready } = createI18n(resources)
        await ready
        const { environment, storage, handlers } = browser()
        const controller = createLocaleController(instance, environment, { rootPath: '/mmgis', externalRootPath: '/proxy' })
        const events = []
        const unsubscribe = controller.subscribe((locale) => events.push(locale))
        await Promise.all([controller.switchLanguage('en'), controller.switchLanguage('zh-CN')])
        expect(events).toEqual(['zh-CN', 'en', 'zh-CN'])
        expect(environment.document.cookie).toContain('Path=/proxy/mmgis')
        expect(environment.document.documentElement.lang).toBe('zh-CN')
        expect(environment.location.searchParams.get('mission')).toBe('demo')
        expect(environment.history.state).toEqual({ viewport: 1 })
        const revision = JSON.parse(storage.get(STORAGE_KEY)).revision
        await controller.switchLanguage('en')
        expect(JSON.parse(storage.get(STORAGE_KEY)).revision).toBeGreaterThan(revision)
        unsubscribe()
        controller.dispose()
        expect(handlers.size).toBe(0)
        expect(await controller.switchLanguage('zh-CN')).toBe(false)
        expect(() => controller.subscribe(() => undefined)).toThrow()
    })
    test('cross-tab event changes language without echoing and ignores invalid/stale events', async () => {
        const { instance, ready } = createI18n(resources)
        await ready
        const { environment, storage, handlers } = browser()
        const controller = createLocaleController(instance, environment)
        const onStorage = handlers.get('storage')
        onStorage({ key: 'other', newValue: 'invalid' })
        onStorage({ key: STORAGE_KEY, newValue: 'invalid' })
        onStorage({ key: STORAGE_KEY, newValue: JSON.stringify({ locale: 'en', revision: Date.now() + 1000, source: 'remote-tab' }) })
        await expect.poll(() => instance.language).toBe('en')
        expect(storage.has(STORAGE_KEY)).toBe(false)
        onStorage({ key: STORAGE_KEY, newValue: JSON.stringify({ locale: 'zh-CN', revision: 1, source: 'remote-tab' }) })
        onStorage({ key: STORAGE_KEY, newValue: JSON.stringify({ locale: 'zh-CN', revision: Date.now() + 5000, source: 'test-tab' }) })
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(instance.language).toBe('en')
        await expect(controller.switchLanguage('fr')).rejects.toThrow()
        controller.dispose()
    })
    test('cookie/history/storage restrictions degrade to in-memory switching', async () => {
        const { instance, ready } = createI18n(resources)
        await ready
        const { environment } = browser({ blocked: true })
        const controller = createLocaleController(instance, environment)
        await controller.switchLanguage('en')
        expect(instance.language).toBe('en')
        expect(environment.document.documentElement.lang).toBe('en')
        expect(() => controller.subscribe(null)).toThrow()
        controller.dispose()
    })
    test('validates revision events and uses a deterministic tie-break', () => {
        expect(parseEvent('null')).toBeNull()
        expect(parseEvent('{}')).toBeNull()
        expect(parseEvent(JSON.stringify({ locale: 'fr', revision: 1, source: 'a' }))).toBeNull()
        expect(parseEvent(JSON.stringify({ locale: 'en', revision: -1, source: 'a' }))).toBeNull()
        expect(parseEvent(JSON.stringify({ locale: 'en', revision: 1.1, source: 'a' }))).toBeNull()
        expect(parseEvent(JSON.stringify({ locale: 'en', revision: 1, source: '' }))).toBeNull()
        expect(parseEvent(JSON.stringify({ locale: 'en', revision: 1, source: 'x'.repeat(129) }))).toBeNull()
        expect(newer({ revision: 2, source: 'a' }, { revision: 1, source: 'z' })).toBe(true)
        expect(newer({ revision: 1, source: 'z' }, { revision: 1, source: 'a' })).toBe(true)
        expect(newer({ revision: 1, source: 'a' }, { revision: 1, source: 'a' })).toBe(false)
    })
    test('surfaces engine errors while allowing a later local retry', async () => {
        const { instance, ready } = createI18n(resources)
        await ready
        const change = instance.changeLanguage.bind(instance)
        instance.changeLanguage = async () => { throw new Error('engine failure') }
        const { environment } = browser()
        const controller = createLocaleController(instance, environment)
        await expect(controller.switchLanguage('en')).rejects.toThrow('engine failure')
        instance.changeLanguage = change
        await controller.switchLanguage('en')
        expect(instance.language).toBe('en')
        controller.dispose()
    })
    test('faulty subscribers do not block other callbacks or persistence', async () => {
        const { instance, ready } = createI18n(resources)
        await ready
        const { environment } = browser()
        const controller = createLocaleController(instance, environment)
        expect(() => controller.subscribe(() => { throw new Error('initial callback failed') })).toThrow()
        const seen = []
        controller.subscribe((locale) => { if (locale === 'en') throw new Error('later callback failed') })
        controller.subscribe((locale) => seen.push(locale))
        await controller.switchLanguage('en')
        expect(seen).toEqual(['zh-CN', 'en'])
        expect(environment.document.cookie).toContain('MMGISLocale=en')
        controller.dispose()
    })
    test('disposing during an asynchronous switch prevents delayed persistence', async () => {
        const { instance, ready } = createI18n(resources)
        await ready
        let release
        instance.changeLanguage = () => new Promise((resolve) => { release = resolve })
        const { environment, storage } = browser()
        const controller = createLocaleController(instance, environment)
        const operation = controller.switchLanguage('en')
        await expect.poll(() => typeof release).toBe('function')
        controller.dispose()
        release()
        expect(await operation).toBe(false)
        expect(storage.size).toBe(0)
        expect(environment.location.searchParams.has('lang')).toBe(false)
    })
})

test.describe('catalog generation', () => {
    test('rejects missing keys, namespaces, invalid values and parameter drift', () => {
        expect(() => validateCatalogs(resources)).not.toThrow()
        expect(placeholders('Hello {{ name }}, {{name}}')).toEqual(['{{name}}', '{{name}}'])
        const cases = [
            { en: {}, 'zh-CN': {} },
            { en: resources.en, 'zh-CN': { ...resources['zh-CN'], auth: {} } },
            { en: resources.en, 'zh-CN': { common: {} } },
            { en: { common: [] }, 'zh-CN': { common: [] } },
            { en: { common: 1 }, 'zh-CN': { common: 1 } },
            { en: { common: { constructor: 'x' } }, 'zh-CN': { common: { constructor: 'x' } } },
            { en: { common: { message: ' ' } }, 'zh-CN': { common: { message: 'x' } } },
            { en: { common: { message: 1 } }, 'zh-CN': { common: { message: 'x' } } },
            { en: { common: { message: '{{name}}' } }, 'zh-CN': { common: { message: '{{other}}' } } },
            { en: { common: { message: '{{name}}' } }, 'zh-CN': { common: { message: '{{-name}}' } } },
        ]
        for (const invalid of cases) expect(() => validateCatalogs(invalid)).toThrow()
    })
    test('generates local resources and hash-addressed help deterministically', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmgis-i18n-'))
        try {
            fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '5.2.24-test' }))
            for (const locale of ['en', 'zh-CN']) {
                fs.mkdirSync(path.join(root, 'locales', locale), { recursive: true })
                fs.writeFileSync(path.join(root, 'locales', locale, 'common.json'), JSON.stringify(resources[locale].common))
            }
            fs.cpSync(path.resolve('locales/runtime'), path.join(root, 'locales/runtime'), { recursive: true })
            fs.mkdirSync(path.join(root, 'public/helps'), { recursive: true })
            fs.writeFileSync(path.join(root, 'public/helps/Draw.md'), '# Draw')
            expect(loadCatalogs(root)).toEqual(resources)
            const a = prepareResources(root)
            const b = prepareResources(root)
            expect(b).toEqual(a)
            for (const target of ['src/i18n/generated', 'configure/src/i18n/generated', 'API/i18n/generated']) {
                expect(JSON.parse(fs.readFileSync(path.join(root, target, 'resources.json')))).toEqual(resources)
                expect(fs.existsSync(path.join(root, target, 'engine.js'))).toBe(true)
            }
            expect(fs.readFileSync(path.join(root, a.help.en.Draw), 'utf8')).toBe('# Draw')
            expect(a.help['zh-CN']).toEqual({}) // Chinese help belongs to T8, not this task.
            const legacy = 'public/i18n/legacy.test.js'
            fs.writeFileSync(path.join(root, legacy), 'test legacy')
            const digest = (value) => crypto.createHash('sha256').update(value).digest('hex')
            const index = { ...a, legacy, legacyHash: digest('test legacy') }
            const indexPath = path.join(root, 'API/i18n/generated/resource-index.json')
            fs.writeFileSync(indexPath, JSON.stringify(index))
            expect(verifyRuntime(root)).toBe(a.resourceVersion)
            fs.appendFileSync(path.join(root, 'API/i18n/generated/engine.js'), '\n// interrupted rebuild')
            expect(() => verifyRuntime(root)).toThrow('fingerprint mismatch')
            fs.writeFileSync(path.join(root, 'API/i18n/generated/engine.js'), fs.readFileSync(path.join(root, 'locales/runtime/engine.js')))
            fs.writeFileSync(indexPath, JSON.stringify({ ...index, upstreamVersion: 'old' }))
            expect(() => verifyRuntime(root)).toThrow('version mismatch')
            fs.writeFileSync(indexPath, JSON.stringify({ ...index, legacy: '../private.txt' }))
            expect(() => verifyRuntime(root)).toThrow('resource path')
            fs.writeFileSync(path.join(root, 'public/helps/Draw.md'), '# Changed')
            expect(prepareResources(root).canonicalHash).not.toBe(a.canonicalHash)
            fs.writeFileSync(path.join(root, 'locales/en/Invalid Name.json'), '{}')
            expect(() => loadCatalogs(root)).toThrow('namespace filename')
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })
})
