# UI localization resources

Canonical catalogs live in `locales/en/*.json` and `locales/zh-CN/*.json`.
Each catalog is a flat object of semantic keys and strings. Both languages must
have the same namespace/key sets and interpolation parameters. Runtime code
lives in `locales/runtime/` and is copied into each frontend's own `src` tree
and into `API/i18n/generated`; generated files must not be edited by hand.

Run `npm run i18n:prepare` after changing catalogs/runtime/help. It validates
catalogs, copies local runtime resources, builds the small non-React legacy
bundle, then freezes identical resource indexes for the two frontends and API.
Two identical runs produce the same version/index. `resourceVersion` depends on
canonical inputs and the source version, not final frontend bundle hashes.
Fingerprint checks reject mixed generated resources after an interrupted build.
Production startup only verifies built resources; it does not require Webpack.

The map and configure entries must await `createBrowserRuntime(window, options)`
once per document and pass its `i18n` to each independent React root/provider.
`useUiTranslation(namespace, instance)` disables escaping only for React text
rendering; other engine callers retain escaped interpolation. Never insert
untrusted translated values using raw HTML. Legacy controls explicitly subscribe
to the controller and release subscriptions when destroyed. Subscriptions are
synchronous callbacks; a callback failure is isolated and reported.

Only `en` and `zh-CN` are supported. A valid URL `lang` overrides the locale
cookie; otherwise Chinese is the default. Switching keeps unrelated URL state
and uses revision/source ordering for cross-tab storage events. Browser storage
restrictions degrade to in-memory language selection. Pass the deployment
`rootPath` and `externalRootPath`; the legacy page sets `data-mmgis-root` and
`data-mmgis-external-root` on `<html>` before loading its bundle.

Dependencies are pinned to i18next 23.16.8 / react-i18next 14.1.3, whose peer
metadata supports both existing React versions without changing CRA's optional
TypeScript 4 dependency tree. i18next 26 has incompatible TypeScript 5/6 peers
in configure; no `--force` or `--legacy-peer-deps` workaround is used.

This T2 foundation has 34 common message keys. It does not yet translate all UI
call sites (T3–T7), Chinese help (T8), or generate the final frontend/Docker
artifact manifest (T10). Fourteen original English help URLs are retained;
Chinese help is added by T8. Do not treat this foundation as complete UI QA.

Development workflow: complete the task, run the review skill, then submit the
formal PR automatically. Run the QA skill on Host60 only when integration
verification is required. Do not add or run other tests independently. This
explicit owner instruction overrides generic testing guidance for this work.
Install root and configure dependencies before their respective builds.
