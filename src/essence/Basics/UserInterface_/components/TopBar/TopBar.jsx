import { useMapText, switchLocale, i18n } from '../../../../../i18n'
import Toast from '../../../../../design-system/components/Toast/Toast'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import useUIStore from '../../store/uiStore'
import BottomBar from '../../BottomBar'
import Toggle from '../../../../../design-system/components/Toggle/Toggle'
import Dropdown from '../../../../../design-system/components/Dropdown/Dropdown'
import IconButton from '../../../../../design-system/components/IconButton/IconButton'
import Tooltip from '../../../../../design-system/components/Tooltip/Tooltip'
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal'
import Modal from '../Modal/Modal'

import styles from './TopBar.module.css'

const STATUS_CONFIG = {
    RELOAD: {
        icon: 'mdi-reload-alert',
        color: 'var(--color-h)',
        tooltipKey: 'status.reload',
    },
    ADD_LAYER: {
        icon: 'mdi-reload',
        color: 'var(--color-green)',
        tooltipKey: 'status.layers',
    },
    DISCONNECTED: {
        icon: 'mdi-alert-outline',
        color: 'var(--color-r1)',
        tooltipKey: 'status.disconnected',
    },
}

function LayerUpdateContent({ queue, onUpdate }) {
    const t = useMapText()
    return (
        <div id="mainSettingsModal">
            <div id="mainSettingsModalTitle">
                <div><i className="mdi mdi-reload mdi-18px" /><div>{t('layers.updateTitle')}</div></div>
                <button id="mainSettingsModalClose" onClick={() => Modal.remove()} aria-label={t('action.close')}>
                    <i className="mmgisHoverBlue mdi mdi-close mdi-18px" />
                </button>
            </div>
            <div id="update-modal-content" className="update-modal-section">
                <div className="update-modal-section-title">{t('layers.changes')}</div>
                <div className="update-modal-table-container">
                    <table className="table" style={{ textAlign: 'left' }}>
                        <thead><tr><th>{t('layers.action')}</th><th>{t('layers.name')}</th></tr></thead>
                        <tbody>{queue.map(({ newLayerName, type }, index) => (
                            <tr key={index}><td>{t('layers.' + type, { defaultValue: type })}</td><td>{newLayerName}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
                <div id="update-modal-actions" className="update-modal-flex">
                    <button className="drawToolFileCancel drawToolButton1" onClick={() => Modal.remove()}>{t('layers.cancel')}</button>
                    <button className="drawToolFileSave drawToolButton1" onClick={onUpdate}>{t('layers.update')}</button>
                </div>
            </div>
        </div>
    )
}

function StatusIndicator() {
    const t = useMapText()
    const statusType = useUIStore((s) => s.statusIndicator)
    const config = statusType ? STATUS_CONFIG[statusType] : null

    const handleClick = useCallback(() => {
        if (!statusType) return
        if (statusType === 'RELOAD' || statusType === 'DISCONNECTED') {
            ConfirmationModal.prompt(
                { translationKey: 'status.reloadConfirm' },
                (isYes) => { if (isYes) location.reload() }
            )
        } else if (statusType === 'ADD_LAYER') {
            const L_ = require('../../../Layers_/Layers_').default
            const UserInterface_ = require('../../UserInterfaceBridge').default
            Modal.set(<LayerUpdateContent queue={L_.addLayerQueue} onUpdate={() => {
                Modal.remove()
                L_.updateQueueLayers()
                UserInterface_.removeLayerUpdateButton()
            }} />)
        }
    }, [statusType, t])

    return (
        <div
            className={styles.statusIndicator}
            style={{ display: config ? 'flex' : 'none', alignItems: 'center' }}
            onClick={handleClick}
        >
            {config && (
                <Tooltip content={t(config.tooltipKey)} placement="bottom">
                    <i
                        className={`mdi ${config.icon} mdi-18px`}
                        style={{ color: config.color }}
                    />
                </Tooltip>
            )}
        </div>
    )
}

function TopBar({ userInterface }) {
    const t = useMapText()
    const topBarLeftRef = useRef(null)
    const isMobile = useUIStore((s) => s.isMobile)
    const lookConfig = useUIStore((s) => s.lookConfig)

    const hasStatus = useUIStore((s) => !!s.statusIndicator)
    const hasViewer = useUIStore((s) => s.hasViewer)
    const hasGlobe = useUIStore((s) => s.hasGlobe)
    const showPanelToggles = hasViewer || hasGlobe

    const [viewerOpen, setViewerOpen] = useState(false)
    const [mapOpen, setMapOpen] = useState(true)
    const [globeOpen, setGlobeOpen] = useState(false)
    const [username, setUsername] = useState(null)
    const userBtnRef = useRef(null)
    const changeLanguage = (locale) => switchLocale(locale).catch(() => Toast.error(t('language.failed')))

    useEffect(() => {
        const el = topBarLeftRef.current
        if (el) {
            const handleWheel = (e) => {
                e.preventDefault()
                el.scrollLeft += e.deltaY
            }
            el.addEventListener('wheel', handleWheel, { passive: false })
            return () => el.removeEventListener('wheel', handleWheel)
        }
    }, [])

    // Sync panel open states from store
    useEffect(() => {
        const unsub = useUIStore.subscribe((state) => {
            setViewerOpen(state.pxIsViewer > 0)
            setMapOpen(state.pxIsMap > 0)
            setGlobeOpen(state.pxIsGlobe > 0)
        })
        // Initial sync
        const s = useUIStore.getState()
        setViewerOpen(s.pxIsViewer > 0)
        setMapOpen(s.pxIsMap > 0)
        setGlobeOpen(s.pxIsGlobe > 0)
        return unsub
    }, [])

    // Sync user login state
    useEffect(() => {
        function syncUser() {
            if (window.mmgisglobal && window.mmgisglobal.user && window.mmgisglobal.user !== 'guest') {
                setUsername(window.mmgisglobal.user)
            } else {
                setUsername(null)
            }
        }
        syncUser()
        const interval = setInterval(syncUser, 2000)
        return () => clearInterval(interval)
    }, [])

    // Hide the jQuery #loginDiv and #loginoutButton since we handle user UI in React now
    useEffect(() => {
        const loginDiv = document.getElementById('loginDiv')
        if (loginDiv) loginDiv.style.display = 'none'
        const loginoutBtn = document.getElementById('loginoutButton')
        if (loginoutBtn) loginoutBtn.style.display = 'none'
        return () => {
            if (loginDiv) loginDiv.style.display = ''
            if (loginoutBtn) loginoutBtn.style.display = ''
        }
    }, [])

    const handleToggleViewer = useCallback(() => {
        if (userInterface && userInterface.setPanelPercents) {
            if (isMobile) {
                const isOpen = useUIStore.getState().pxIsViewer > 0
                if (!isOpen) {
                    userInterface.setPanelPercents(100, 0, 0)
                }
                return
            }
            const pp = userInterface.getPanelPercents()
            const newState = !(useUIStore.getState().pxIsViewer > 0)
            if (newState) {
                const globeAmt = pp.globe > 0 ? 33 : 0
                const mapAmt = 100 - 33 - globeAmt
                userInterface.setPanelPercents(33, mapAmt, globeAmt)
            } else {
                if (pp.map > 0 && pp.globe > 0) {
                    userInterface.setPanelPercents(0, pp.map + pp.viewer / 2, pp.globe + pp.viewer / 2)
                } else if (pp.map > 0) {
                    userInterface.setPanelPercents(0, pp.map + pp.viewer, 0)
                } else if (pp.globe > 0) {
                    userInterface.setPanelPercents(0, 0, pp.globe + pp.viewer)
                } else {
                    userInterface.setPanelPercents(0, 100, 0)
                }
            }
        }
    }, [userInterface, isMobile])

    const handleToggleMap = useCallback(() => {
        if (userInterface && userInterface.setPanelPercents) {
            if (isMobile) {
                const isOpen = useUIStore.getState().pxIsMap > 0
                if (!isOpen) {
                    userInterface.setPanelPercents(0, 100, 0)
                }
                return
            }
            const pp = userInterface.getPanelPercents()
            const newState = !(useUIStore.getState().pxIsMap > 0)
            if (newState) {
                if (pp.viewer > 0 && pp.globe > 0) {
                    userInterface.setPanelPercents(pp.viewer / 2, 50, pp.globe / 2)
                } else if (pp.viewer > 0) {
                    userInterface.setPanelPercents(pp.viewer / 2, 50, 0)
                } else if (pp.globe > 0) {
                    userInterface.setPanelPercents(0, 50, pp.globe / 2)
                } else {
                    userInterface.setPanelPercents(0, 100, 0)
                }
            } else {
                if (pp.viewer > 0 || pp.globe > 0) {
                    if (pp.viewer > 0 && pp.globe > 0) {
                        userInterface.setPanelPercents(pp.viewer + pp.map / 2, 0, pp.globe + pp.map / 2)
                    } else if (pp.viewer > 0) {
                        userInterface.setPanelPercents(pp.viewer + pp.map, 0, 0)
                    } else {
                        userInterface.setPanelPercents(0, 0, pp.globe + pp.map)
                    }
                }
            }
        }
    }, [userInterface, isMobile])

    const handleToggleGlobe = useCallback(() => {
        if (userInterface && userInterface.setPanelPercents) {
            const Globe_ = require('../../../Globe_/Globe_').default
            const newState = !(useUIStore.getState().pxIsGlobe > 0)

            if (isMobile) {
                const isOpen = useUIStore.getState().pxIsGlobe > 0
                if (!isOpen) {
                    userInterface.setPanelPercents(0, 0, 100)
                    if (!Globe_.hasBeenOpened) {
                        requestAnimationFrame(() => {
                            if (!Globe_.hasBeenOpened) {
                                Globe_.init()
                                Globe_.hasBeenOpened = true
                            }
                            requestAnimationFrame(() => {
                                if (Globe_.litho) Globe_.litho.invalidateSize()
                            })
                        })
                    }
                }
                return
            }

            const pp = userInterface.getPanelPercents()
            if (newState) {
                const viewerAmt = pp.viewer > 0 ? 33 : 0
                const mapAmt = 100 - 33 - viewerAmt
                userInterface.setPanelPercents(viewerAmt, mapAmt, 33)
                if (!Globe_.hasBeenOpened) {
                    requestAnimationFrame(() => {
                        if (!Globe_.hasBeenOpened) {
                            Globe_.init()
                            Globe_.hasBeenOpened = true
                        }
                        requestAnimationFrame(() => {
                            if (Globe_.litho) Globe_.litho.invalidateSize()
                        })
                    })
                }
            } else {
                if (pp.map > 0 && pp.viewer > 0) {
                    userInterface.setPanelPercents(pp.viewer + pp.globe / 2, pp.map + pp.globe / 2, 0)
                } else if (pp.map > 0) {
                    userInterface.setPanelPercents(0, pp.map + pp.globe, 0)
                } else if (pp.viewer > 0) {
                    userInterface.setPanelPercents(pp.viewer + pp.globe, 0, 0)
                } else {
                    userInterface.setPanelPercents(0, 100, 0)
                }
            }
        }
    }, [userInterface, isMobile])

    const handleLogout = useCallback(() => {
        const loginoutBtn = document.getElementById('loginoutButton')
        if (loginoutBtn) loginoutBtn.click()
    }, [])

    const handleSignIn = useCallback(() => {
        const loginoutBtn = document.getElementById('loginoutButton')
        if (loginoutBtn) loginoutBtn.click()
    }, [])

    // TopBar stays full-width always — tool panel floats underneath it
    const topBarStyle = {}
    if (isMobile) {
        topBarStyle.background = 'var(--color-a)'
        topBarStyle.paddingLeft = '34px'
    } else {
        topBarStyle.paddingLeft = '40px'
    }

    return (
        <div id="topBar" style={topBarStyle}>
            <div id="topBarLeft" className="hideScrollbar" ref={topBarLeftRef}>
                <div id="topBarMain" className={hasStatus ? 'hasStatus' : ''}>
                    <StatusIndicator />
                    <div id="topBarTitle">
                        <div id="topBarTitleName" tabIndex={200}>
                            {window.mmgisglobal.name}
                        </div>
                    </div>
                </div>
                <div id="topBarSecondary">
                    <div
                        className="mainDescription"
                        title={t('navigation.active')}
                    ></div>
                    <div
                        className="mainInfo"
                        title={t('navigation.featured')}
                    ></div>
                </div>
            </div>
            <div id="topBarRight">

            </div>

            {/* Panel toggles + user area + kebab menu */}
            <div className={styles.reactOverlay} style={isMobile ? { gap: '6px' } : undefined}>
                    {showPanelToggles && (
                        <Toggle.Group className={styles.panelToggles}>
                            {hasViewer && (
                                <Tooltip content={t('panel.toggleViewer')} placement="bottom">
                                    <Toggle
                                        pressed={viewerOpen}
                                        onPressedChange={handleToggleViewer}
                                    >
                                        {t('panel.viewer')}
                                    </Toggle>
                                </Tooltip>
                            )}
                            <Tooltip content={t('panel.toggleMap')} placement="bottom">
                                <Toggle
                                    pressed={mapOpen}
                                    onPressedChange={handleToggleMap}
                                >
                                    {t('panel.map')}
                                </Toggle>
                            </Tooltip>
                            {hasGlobe && (
                                <Tooltip content={t('panel.toggleGlobe')} placement="bottom">
                                    <Toggle
                                        pressed={globeOpen}
                                        onPressedChange={handleToggleGlobe}
                                    >
                                        {t('panel.globe')}
                                    </Toggle>
                                </Tooltip>
                            )}
                        </Toggle.Group>
                    )}

                    {/* User account area — hidden when AUTH=off */}
                    {typeof window !== 'undefined' && window.mmgisglobal && window.mmgisglobal.AUTH !== 'off' && (
                        <div className={styles.userArea}>
                            {username ? (
                                <div className={styles.userWrapper}>
                                    <Dropdown
                                        trigger={
                                            <div
                                                ref={userBtnRef}
                                                className={styles.userAvatar}
                                                title={username}
                                            >
                                                {username[0].toUpperCase()}
                                            </div>
                                        }
                                    >
                                        <div className={styles.userCardName}>{username}</div>
                                        <div className={styles.userCardDivider} />
                                        <Dropdown.Item onClick={handleLogout}>
                                            <i className="mdi mdi-logout" style={{ marginRight: 6, fontSize: 14 }} />
                                            {t('account.logout')}
                                        </Dropdown.Item>
                                    </Dropdown>
                                </div>
                            ) : (
                                <IconButton
                                    onClick={handleSignIn}
                                    aria-label={t('account.login')}
                                >
                                    <i className="mdi mdi-login" style={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </div>
                    )}

                    {/* Right menu (kebab) */}
                    <Dropdown
                        trigger={
                            <IconButton className={styles.menuBtn} aria-label={t('menu.settings')}>
                                <i className="mdi mdi-dots-vertical" style={{ fontSize: 20 }} />
                            </IconButton>
                        }
                    >
                        <Dropdown.Item onClick={() => changeLanguage('zh-CN')} aria-current={i18n.language === 'zh-CN' ? 'true' : undefined}>
                            {i18n.language === 'zh-CN' ? '✓ ' : ''}简体中文
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => changeLanguage('en')} aria-current={i18n.language === 'en' ? 'true' : undefined}>
                            {i18n.language === 'en' ? '✓ ' : ''}English
                        </Dropdown.Item>
                        {!isMobile && (
                            <Dropdown.Item onClick={() => BottomBar.toggleHotkeys(true)}>
                                <i className="mdi mdi-keyboard" style={{ marginRight: 8, fontSize: 14 }} />
                                {t('menu.shortcuts')}
                            </Dropdown.Item>
                        )}
                        {lookConfig.settings !== false && (
                            <Dropdown.Item onClick={() => BottomBar.toggleSettings(true)}>
                                <i className="mdi mdi-cog" style={{ marginRight: 8, fontSize: 14 }} />
                                {t('menu.settings')}
                            </Dropdown.Item>
                        )}
                        <Dropdown.Item onClick={() => BottomBar.showAboutModal()}>
                            <i className="mdi mdi-information-outline" style={{ marginRight: 8, fontSize: 14 }} />
                            {t('menu.about')}
                        </Dropdown.Item>
                    </Dropdown>
                </div>
        </div>
    )
}

export default TopBar
