import { i18n, mapText } from '../../../../../i18n'
import { useUiTranslation } from '../../../../../i18n/generated/browser'
import { normalizeRootPath } from '../../../../../i18n/generated/locale'
import resourceIndex from '../../../../../i18n/generated/resource-index.json'
/**
 * Help — renders a help button that opens a markdown help modal.
 *
 * Renders a React element through the Modal service using design-system components.
 * Same imperative API:
 *   Help.getComponent(helpKey) → HTML string for the button
 *   Help.finalize(helpKey)     → binds the click handler
 */
import React, { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import Modal from '../Modal/Modal'
import showdown from 'showdown'

import styles from './Help.module.css'

showdown.setFlavor('github')

function HelpContent({ helpKey }) {
    const { t } = useUiTranslation('help', i18n)
    const language = i18n.resolvedLanguage || i18n.language
    const [attempt, setAttempt] = useState(0)
    const [result, setResult] = useState(null)
    const requestKey = `${language}:${helpKey}:${attempt}`
    const current = result?.key === requestKey ? result : null

    useEffect(() => {
        const controller = new AbortController()
        let active = true
        const resource = resourceIndex.help[language]?.[helpKey]
        if (typeof resource !== 'string') {
            setResult({ key: requestKey, status: 'error' })
            return () => { active = false }
        }
        const root = normalizeRootPath(window.mmgisglobal?.ROOT_PATH || '')
        const url = new URL(`${root.replace(/\/$/, '')}/${resource}`, window.location.origin)

        fetch(url.href, { signal: controller.signal, cache: 'no-cache' })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.text()
            })
            .then((doc) => {
                if (!active) return
                if (!doc.trim()) throw new Error('Empty help resource.')
                const converter = new showdown.Converter()
                setResult({
                    key: requestKey,
                    status: 'ready',
                    html: DOMPurify.sanitize(converter.makeHtml(doc)),
                })
            })
            .catch(() => {
                if (active) setResult({ key: requestKey, status: 'error' })
            })
        return () => {
            active = false
            controller.abort()
        }
    }, [helpKey, language, attempt, requestKey])

    return (
        <div className={styles.root}>
            <div className={styles.title}>
                <div className={styles.titleLeft}>
                    <i className="mdi mdi-help-rhombus-outline mdi-18px" />
                    <div>{t('title')}</div>
                </div>
                <div
                    className={styles.closeBtn}
                    title={t('close')}
                    aria-label={t('close')}
                    onClick={() => Modal.remove()}
                >
                    <i className="mdi mdi-close mdi-18px" />
                </div>
            </div>
            <div className={styles.content}>
                {!current ? (
                    <div role="status">{t('loading')}</div>
                ) : current.status === 'ready' ? (
                    <div dangerouslySetInnerHTML={{ __html: current.html }} />
                ) : (
                    <div role="alert">
                        <p>{t('unavailable')}</p>
                        <button className={styles.retryBtn} onClick={() => setAttempt((value) => value + 1)}>
                            {t('retry')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// Help buttons are rendered by legacy tools outside the React tree. Refresh
// only their application-owned labels when the shared language changes.
i18n.on('languageChanged', () => {
    document.querySelectorAll('.mmgisHelpButton').forEach((button) => {
        button.title = i18n.t('title', { ns: 'help' })
        button.setAttribute('aria-label', button.title)
    })
})

const Help = {
    getComponent: function (helpKey) {
        return `<div id='helpModal_${helpKey}' class='mmgisButton5 mmgisHelpButton' title='${mapText('help.title')}' aria-label='${mapText('help.title')}'><i class='mdi mdi-help-rhombus-outline mdi-18px'></i></div>`
    },
    finalize: function (helpKey) {
        const btn = document.getElementById(`helpModal_${helpKey}`)
        if (!btn) return
        btn.title = i18n.t('title', { ns: 'help' })
        btn.setAttribute('aria-label', btn.title)

        btn.addEventListener('click', function () {
            Modal.set(<HelpContent helpKey={helpKey} />)
        })
    },
}

export default Help
