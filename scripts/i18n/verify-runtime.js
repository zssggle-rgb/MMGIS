const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { validateCatalogs } = require('./prepare')

function verifyRuntime(root) {
    const directory = path.join(root, 'API/i18n/generated')
    const index = JSON.parse(fs.readFileSync(path.join(directory, 'resource-index.json'), 'utf8'))
    const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version
    if (index.schemaVersion !== 1 || index.upstreamVersion !== version) throw new Error('UI runtime resource version mismatch.')
    validateCatalogs(JSON.parse(fs.readFileSync(path.join(directory, 'resources.json'), 'utf8')))
    function checkHash(filename, expected) {
        const actual = crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex')
        if (!/^[a-f0-9]{64}$/.test(expected || '') || actual !== expected) throw new Error('UI runtime resource fingerprint mismatch.')
    }
    checkHash(path.join(directory, 'resources.json'), index.resourcesHash)
    const files = [index.legacy, ...Object.values(index.help || {}).flatMap((helps) => Object.values(helps))]
    for (const filename of files) {
        if (typeof filename !== 'string' || !/^public\/i18n\/[\w./-]+$/.test(filename) || filename.split('/').includes('..')) throw new Error('Invalid UI runtime resource path.')
        if (!fs.statSync(path.join(root, filename)).isFile()) throw new Error('Missing UI runtime resource.')
    }
    for (const name of ['engine.js', 'locale.js', 'controller.js']) {
        if (!fs.statSync(path.join(directory, name)).isFile()) throw new Error('Missing UI runtime module.')
        checkHash(path.join(directory, name), (index.runtimeHashes || {})[name])
    }
    checkHash(path.join(root, index.legacy), index.legacyHash)
    return index.resourceVersion
}

if (require.main === module) {
    try {
        console.log('Verified local UI runtime resources: ' + verifyRuntime(path.resolve(__dirname, '../..')))
    } catch (error) {
        console.error('UI runtime validation failed: ' + error.message)
        process.exitCode = 1
    }
}

module.exports = { verifyRuntime }
