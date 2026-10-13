const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const LOCALES = ['en', 'zh-CN']
const TARGETS = ['src/i18n/generated', 'configure/src/i18n/generated', 'API/i18n/generated']

function hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex')
}

function placeholders(value) {
    return (value.match(/{{\s*[\w.]+\s*}}/g) || []).map((item) => item.replace(/\s/g, '')).sort()
}

function validateCatalogs(resources) {
    const namespaces = Object.keys(resources.en || {}).sort()
    if (!namespaces.includes('common')) throw new Error('The common UI namespace is required.')
    if (JSON.stringify(namespaces) !== JSON.stringify(Object.keys(resources['zh-CN'] || {}).sort())) throw new Error('UI namespaces do not match.')
    for (const namespace of namespaces) {
        const english = resources.en[namespace]
        const chinese = resources['zh-CN'][namespace]
        if (!english || !chinese || typeof english !== 'object' || typeof chinese !== 'object' || Array.isArray(english) || Array.isArray(chinese)) throw new Error('Invalid UI catalog: ' + namespace)
        const keys = Object.keys(english).sort()
        if (JSON.stringify(keys) !== JSON.stringify(Object.keys(chinese).sort())) throw new Error('UI message keys do not match: ' + namespace)
        for (const key of keys) {
            if (!/^[a-z][\w.-]*$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Invalid UI message key: ' + key)
            if ([english[key], chinese[key]].some((value) => typeof value !== 'string' || !value.trim())) throw new Error('Empty or invalid UI message: ' + key)
            if ([english[key], chinese[key]].some((value) => /{{|}}/.test(value.replace(/{{\s*[\w.]+\s*}}/g, '')))) throw new Error('Invalid UI interpolation: ' + key)
            if (JSON.stringify(placeholders(english[key])) !== JSON.stringify(placeholders(chinese[key]))) throw new Error('UI interpolation parameters do not match: ' + key)
        }
    }
}

function loadCatalogs(root) {
    const resources = Object.fromEntries(LOCALES.map((locale) => {
        const directory = path.join(root, 'locales', locale)
        const names = fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
        const catalogs = Object.fromEntries(names.map((name) => {
            if (!/^[a-z][\w-]*\.json$/.test(name)) throw new Error('Invalid UI namespace filename: ' + name)
            const catalog = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))
            return [name.slice(0, -5), catalog]
        }))
        return [locale, catalogs]
    }))
    validateCatalogs(resources)
    return resources
}

function write(root, relative, value) {
    const filename = path.join(root, relative)
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, value)
}

function prepareResources(root) {
    const resources = loadCatalogs(root)
    const packageInfo = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    const serialized = JSON.stringify(resources, null, 4) + '\n'
    const runtimeNames = ['locale.js', 'engine.js', 'controller.js', 'browser.js']
    const runtime = Object.fromEntries(runtimeNames.map((name) => [name, fs.readFileSync(path.join(root, 'locales/runtime', name), 'utf8')]))
    const help = Object.fromEntries(LOCALES.map((locale) => [locale, {}]))
    const helpInputs = []
    for (const locale of LOCALES) {
        const directory = path.join(root, locale === 'en' ? 'public/helps' : 'locales/help/zh-CN')
        if (!fs.existsSync(directory)) continue
        for (const name of fs.readdirSync(directory).filter((entry) => /^[\w-]+\.md$/.test(entry)).sort()) {
            const content = fs.readFileSync(path.join(directory, name))
            const relative = `public/i18n/help/${locale}/${name.slice(0, -3)}.${hash(content).slice(0, 16)}.md`
            write(root, relative, content)
            help[locale][name.slice(0, -3)] = relative
            helpInputs.push([locale, name, hash(content)])
        }
    }
    const canonicalHash = hash(JSON.stringify({ resources, runtime, helpInputs, legacy: fs.readFileSync(path.join(root, 'locales/runtime/legacy.js'), 'utf8') }))
    const runtimeHashes = Object.fromEntries(Object.entries(runtime).filter(([name]) => name !== 'browser.js').map(([name, content]) => [name, hash(content)]))
    const index = { schemaVersion: 1, upstreamVersion: packageInfo.version, supportedLocales: LOCALES, canonicalHash, resourceVersion: `${packageInfo.version}-${canonicalHash.slice(0, 16)}`, resourcesHash: hash(serialized), runtimeHashes, help }
    for (const target of TARGETS) {
        write(root, `${target}/resources.json`, serialized)
        for (const name of runtimeNames) {
            if (target.startsWith('API/') && name === 'browser.js') continue
            write(root, `${target}/${name}`, runtime[name])
        }
    }
    const legacy = Object.fromEntries(LOCALES.map((locale) => [locale, Object.fromEntries(Object.entries(resources[locale]).filter(([namespace]) => ['common', 'auth', 'feedback'].includes(namespace)))]))
    write(root, 'API/i18n/generated/legacy-resources.json', JSON.stringify(legacy))
    return index
}

function buildLegacy(root) {
    const webpack = require('webpack')
    return new Promise((resolve, reject) => webpack({
        mode: 'production',
        target: 'web',
        entry: path.join(root, 'locales/runtime/legacy.js'),
        output: { path: path.join(root, 'public/i18n'), filename: 'legacy.[contenthash].js' },
        devtool: false,
    }, (error, stats) => {
        if (error) return reject(error)
        if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })))
        const assets = stats.compilation.entrypoints.get('main').getFiles().filter((name) => /^legacy\.[\w]+\.js$/.test(name))
        if (assets.length !== 1) return reject(new Error('Expected one legacy UI bundle.'))
        resolve('public/i18n/' + assets[0])
    }))
}

async function prepare(root) {
    const index = prepareResources(root)
    index.legacy = await buildLegacy(root)
    index.legacyHash = hash(fs.readFileSync(path.join(root, index.legacy)))
    for (const target of TARGETS) write(root, `${target}/resource-index.json`, JSON.stringify(index, null, 4) + '\n')
    return index
}

const BUILDS = { map: 'build', configure: 'configure/build' }

function buildCommit() {
    const commit = process.env.MMGIS_BUILD_COMMIT || 'unknown'
    if (commit !== 'unknown' && !/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid source commit for UI delivery.')
    return commit
}

function compiledFiles(root, directory) {
    const files = []
    function collect(relative) {
        for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const filename = `${relative}/${entry.name}`
            if (entry.name === 'i18n-build.json') continue
            if (entry.isDirectory()) collect(filename)
            else if (entry.isFile()) files.push({ path: filename, sha256: hash(fs.readFileSync(path.join(root, filename))) })
            else throw new Error('Unsupported compiled UI artifact: ' + filename)
        }
    }
    collect(directory)
    return files
}

// The postbuild receipt binds each compiled frontend to the catalogs it consumed.
function recordBuild(root, frontend) {
    const output = BUILDS[frontend]
    if (!output) throw new Error('Unknown UI build target.')
    const generated = frontend === 'map' ? TARGETS[0] : TARGETS[1]
    const index = JSON.parse(fs.readFileSync(path.join(root, generated, 'resource-index.json'), 'utf8'))
    for (const filename of ['index.html', 'index.pug', 'asset-manifest.json']) {
        if (!fs.statSync(path.join(root, output, filename)).isFile()) throw new Error('Missing compiled UI artifact: ' + frontend + '/' + filename)
    }
    write(root, `${output}/i18n-build.json`, JSON.stringify({
        frontend,
        upstreamVersion: index.upstreamVersion,
        resourceVersion: index.resourceVersion,
        canonicalHash: index.canonicalHash,
        sourceCommit: buildCommit(),
        files: compiledFiles(root, output),
    }, null, 4) + '\n')
    return index.resourceVersion
}

function finalizeDelivery(root) {
    // Reuse production resource validation as part of packaging, without rebuilding.
    const { verifyRuntime } = require('./verify-runtime')
    const resourceVersion = verifyRuntime(root)
    const index = JSON.parse(fs.readFileSync(path.join(root, TARGETS[2], 'resource-index.json'), 'utf8'))
    const configureVersion = JSON.parse(fs.readFileSync(path.join(root, 'configure/package.json'), 'utf8')).version
    if (configureVersion !== index.upstreamVersion) throw new Error('Frontend package versions do not match.')
    for (const [frontend, output] of Object.entries(BUILDS)) {
        const receipt = JSON.parse(fs.readFileSync(path.join(root, output, 'i18n-build.json'), 'utf8'))
        if (receipt.frontend !== frontend || receipt.resourceVersion !== resourceVersion || receipt.canonicalHash !== index.canonicalHash || receipt.sourceCommit !== buildCommit()) throw new Error('Compiled UI resources do not match: ' + frontend)
        if (JSON.stringify(receipt.files) !== JSON.stringify(compiledFiles(root, output))) throw new Error('Compiled UI artifacts changed after building: ' + frontend)
    }

    const files = []
    const manifestPath = `${TARGETS[2]}/delivery-manifest.json`
    function collect(directory) {
        for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const relative = `${directory}/${entry.name}`
            if (relative === manifestPath) continue
            if (entry.isDirectory()) collect(relative)
            else if (entry.isFile()) {
                const content = fs.readFileSync(path.join(root, relative))
                files.push({ path: relative, bytes: content.length, sha256: hash(content) })
            } else throw new Error('Unsupported UI delivery artifact: ' + relative)
        }
    }
    for (const directory of [...Object.values(BUILDS), 'API/i18n', 'public/i18n', 'public/helps', 'views']) collect(directory)
    for (const relative of ['package.json', 'configure/package.json', 'public/login.js', 'public/adminlogin.js', 'public/resetPassword.js']) {
        const content = fs.readFileSync(path.join(root, relative))
        files.push({ path: relative, bytes: content.length, sha256: hash(content) })
    }
    const sourceCommit = buildCommit()
    write(root, manifestPath, JSON.stringify({
        schemaVersion: 1,
        upstreamVersion: index.upstreamVersion,
        sourceCommit,
        resourceVersion,
        canonicalHash: index.canonicalHash,
        supportedLocales: index.supportedLocales,
        files,
    }, null, 4) + '\n')
    return resourceVersion
}

if (require.main === module) {
    const root = path.resolve(__dirname, '../..')
    const buildArgument = process.argv.find((argument) => argument.startsWith('--record-build='))
    Promise.resolve().then(() => {
        if (buildArgument) return recordBuild(root, buildArgument.slice('--record-build='.length))
        if (process.argv.includes('--finalize-delivery')) return finalizeDelivery(root)
        return prepare(root).then((index) => index.resourceVersion)
    }).then((version) => {
        console.log('Prepared local UI build resources: ' + version)
    }).catch((error) => {
        console.error('UI resource preparation failed: ' + error.message)
        process.exitCode = 1
    })
}

module.exports = { placeholders, validateCatalogs, loadCatalogs, prepareResources, prepare, recordBuild, finalizeDelivery }
