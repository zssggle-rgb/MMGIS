import { test, expect } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { collectSurfaceInventory } from '../../scripts/i18n/inventory'
let root

test.beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmgis-ui-census-'))
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '5.2.24-test' }))
})

test.afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

function write(relative, content = 'display text') {
    const filename = path.join(root, relative)
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, content)
}

test('records nested UI surfaces and stable hashes without reporting translation coverage', () => {
    write('src/essence/Basics/Panel.jsx')
    write('configure/src/pages/Page.js')
    write('plugins/core/tools/Draw/plugin.json', '{}')
    write('public/helps/Draw.md')
    write('views/admin.pug')
    write('public/adminlogin.js')
    write('public/resetPassword.js')
    write('configure/src/metaconfigs/layer-vector-config.json', '{}')
    write('public/index.html', '<p>JavaScript is required.</p>')
    write('configure/public/index.html', '<title>Configure</title>')
    const result = collectSurfaceInventory(root)
    expect(result.upstreamVersion).toBe('5.2.24-test')
    expect(result.surfaces.map((s) => [s.id, s.count])).toContainEqual(['map', 1])
    expect(result.surfaces.find((s) => s.id === 'plugins').files[0].path).toBe('plugins/core/tools/Draw/plugin.json')
    expect(result.surfaces.find((s) => s.id === 'map').files[0].sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(result.surfaces.find((s) => s.id === 'auth-scripts').count).toBe(2)
    expect(result.surfaces.find((s) => s.id === 'metadata').count).toBe(1)
    expect(result.surfaces.find((s) => s.id === 'html-entry').count).toBe(2)
    expect(result.coverageMeaning).toContain('not a count of strings')
    expect(collectSurfaceInventory(root)).toEqual(result)
})

test('excludes generated artifacts, tests, dependencies and symlinks', () => {
    write('src/essence/Panel.js')
    write('src/essence/generated/Panel.js')
    write('src/essence/tests/Panel.js')
    write('src/essence/node_modules/vendor.js')
    write('configure/public/toolConfigs.json', '{}')
    write('public/private.js')
    write('src/nested/App.js')
    write('public/vendor/index.html')
    fs.symlinkSync(path.join(root, 'package.json'), path.join(root, 'src/essence/link.js'))
    const result = collectSurfaceInventory(root)
    expect(result.surfaces.find((s) => s.id === 'map').count).toBe(1)
    expect(result.surfaces.find((s) => s.id === 'metadata').count).toBe(0)
    expect(result.surfaces.find((s) => s.id === 'auth-scripts').count).toBe(0)
    expect(result.surfaces.find((s) => s.id === 'map-entry').count).toBe(0)
    expect(result.surfaces.find((s) => s.id === 'html-entry').count).toBe(0)
})

test('handles absent optional directories but rejects unreadable package metadata', () => {
    expect(collectSurfaceInventory(root).surfaces.every((s) => s.count === 0)).toBe(true)
    fs.writeFileSync(path.join(root, 'package.json'), 'invalid JSON')
    expect(() => collectSurfaceInventory(root)).toThrow()
    fs.unlinkSync(path.join(root, 'package.json'))
    expect(() => collectSurfaceInventory(root)).toThrow()
})
