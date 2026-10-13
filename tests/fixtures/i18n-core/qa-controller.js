const runtime = window.MMGISI18n
runtime.ready.then((controller) => {
    const unsubscribe = controller.subscribe(() => {
        document.getElementById('save').textContent = runtime.i18n.t('action.save')
        document.getElementById('draft-label').textContent = runtime.i18n.t('entity.mission')
    })
    const change = (locale) => controller.switchLanguage(locale).catch(() => {
        document.getElementById('feedback').textContent = runtime.i18n.t('error.generic')
    })
    document.getElementById('english').addEventListener('click', () => change('en'))
    document.getElementById('chinese').addEventListener('click', () => change('zh-CN'))
    document.body.dataset.ready = 'true'
    window.addEventListener('pagehide', () => {
        unsubscribe()
        controller.dispose()
    }, { once: true })
})
