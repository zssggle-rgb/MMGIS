const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// A file census is not a translation coverage percentage. Review each surface
// for static text, dynamic messages and controls before marking it complete.
const SURFACES = [
    { id: 'map', directories: ['src/essence', 'src/design-system'], extensions: ['.js', '.jsx'] },
    { id: 'map-entry', directories: ['src'], files: ['index.js', 'App.js'] },
    { id: 'html-entry', directories: ['public', 'configure/public'], files: ['index.html'] },
    { id: 'configure', directories: ['configure/src'], extensions: ['.js', '.jsx'] },
    { id: 'plugins', directories: ['plugins/core'], extensions: ['.js', '.jsx', '.json'] },
    { id: 'auth-templates', directories: ['views'], extensions: ['.pug'] },
    { id: 'auth-scripts', directories: ['public'], files: ['login.js', 'adminlogin.js', 'resetPassword.js'] },
    { id: 'help', directories: ['public/helps'], extensions: ['.md'] },
    { id: 'metadata', directories: ['configure/src/metaconfigs'], extensions: ['.json'] },
]

function walk(directory) {
    if (!fs.existsSync(directory)) return []
    return fs.readdirSync(directory, { withFileTypes: true })
        .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        .flatMap((entry) => {
            const filename = path.join(directory, entry.name)
            if (entry.isSymbolicLink()) return []
            if (entry.isDirectory()) {
                if (['tests', 'node_modules', 'generated'].includes(entry.name)) return []
                return walk(filename)
            }
            return entry.isFile() ? [filename] : []
        })
}

function collectSurfaceInventory(root) {
    const packageInfo = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    const surfaces = SURFACES.map((surface) => {
        const candidates = surface.directories.flatMap((directory) => walk(path.join(root, directory)))
        const files = candidates.filter((filename) => surface.files
            ? surface.files.includes(path.basename(filename)) && surface.directories.some((directory) => path.dirname(filename) === path.join(root, directory))
            : surface.extensions.includes(path.extname(filename)))
            .filter((filename) => !/toolConfigs|componentConfigs|interactionConfigs/.test(path.basename(filename)))
            .map((filename) => ({
                path: path.relative(root, filename).split(path.sep).join('/'),
                sha256: crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),
                status: 'pending-context-review',
            }))
        return { id: surface.id, count: files.length, files }
    })
    return {
        schemaVersion: 1,
        upstreamVersion: packageInfo.version,
        coverageMeaning: 'File census only; not a count of strings or proof of translated UI.',
        surfaces,
    }
}

if (require.main === module) {
    try {
        const root = path.resolve(__dirname, '../..')
        const inventory = collectSurfaceInventory(root)
        process.stdout.write(JSON.stringify(inventory, null, 2) + '\n')
    } catch (error) {
        console.error('UI surface inventory failed: ' + error.message)
        process.exitCode = 1
    }
}

module.exports = { collectSurfaceInventory }
