import React from 'react'
import { localeReady, i18n } from './i18n'
import { withLocale } from './i18n/generated/locale'
import essence from './essence/essence'
import $ from 'jquery'
import LandingPage from './essence/LandingPage/LandingPage'
import F_ from './essence/Basics/Formulae_/Formulae_'

import calls from './pre/calls'

import UserInterfaceLayout from './essence/Basics/UserInterface_/components/Layout/UserInterfaceLayout'
import ToastRenderer from './design-system/components/Toast/ToastRenderer'

// Ensure useReactUI is always set (defensive fallback for non-standard bootstrap)
;(function () {
    if (typeof window.mmgisglobal === 'undefined') window.mmgisglobal = {}
    window.mmgisglobal.useReactUI = true
})()

//Start MMGIS
localeReady.then(() => $(document).ready(function () {
    const browser = F_.getBrowser()
    if (browser === 'firefox') {
        $('body').css({
            'scrollbar-color': 'var(--color-a2) transparent',
            'scrollbar-width': 'thin',
        })
    }

    calls.api(
        'get_generaloptions',
        {},
        function (resp) {
            mmgisglobal.options = resp.options
            initApp()
        },
        function (err) {
            mmgisglobal.options = {}
            initApp()
        }
    )
}))

function initApp() {
    if (window.mmgisglobal.FORCE_CONFIG_PATH) {
        const u = new URL(window.location.href)
        const short = u.searchParams.get('s')
        if (!short) {
            //Not a shortened URL
            LandingPage.init(null, false, window.mmgisglobal.FORCE_CONFIG_PATH)
        } else {
            calls.api(
                'shortener_expand',
                {
                    short,
                },
                function (s) {
                    //Set and update the url
                    const url = new URL(s.body.url, u.origin + u.pathname).href
                    window.history.replaceState('', '', withLocale(url, i18n.language))

                    LandingPage.init(
                        null,
                        false,
                        window.mmgisglobal.FORCE_CONFIG_PATH
                    )
                },
                function (e) {
                    LandingPage.init(
                        null,
                        true,
                        window.mmgisglobal.FORCE_CONFIG_PATH
                    )
                }
            )
        }
    } else {
        calls.api(
            'missions',
            {},
            function (s) {
                const missions = (s.missions || [])
                    .slice()
                    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                continueOn(missions)
            },
            function (e) {
                continueOn([])
            }
        )

        function continueOn(missions) {
            const u = new URL(window.location.href)
            const short = u.searchParams.get('s')
            if (!short) {
                //Not a shortened URL
                LandingPage.init(missions)
            } else {
                calls.api(
                    'shortener_expand',
                    {
                        short,
                    },
                    function (s) {
                        //Set and update the url
                        const url = new URL(s.body.url, u.origin + u.pathname).href
                        window.history.replaceState('', '', withLocale(url, i18n.language))
                        LandingPage.init(missions)
                    },
                    function (e) {
                        LandingPage.init(missions, true)
                    }
                )
            }
        }
    }
}

function App() {
    return (
        <div className='App'>
            <UserInterfaceLayout />
            <ToastRenderer />
        </div>
    )
}

export default App
