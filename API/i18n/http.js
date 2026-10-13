const { createI18n } = require('./generated/engine');
const { resolveLocale } = require('./generated/locale');
const resources = require('./generated/legacy-resources.json');
const manifest = require('./generated/resource-index.json');
const { createFeedback } = require('./generated/feedback');
const { normalizeRootPath } = require('./generated/locale');
const { instance } = createI18n(resources);
const authKeys = new Map(Object.entries(resources.en.auth || {}).map(([key, text]) => [text, key]));

// Each request binds a fixed translator; the shared instance's language is
// never changed by a visitor.
function uiLanguage(req, res, next) {
  const locale = resolveLocale({ url: req.originalUrl, cookie: req.headers.cookie || '' });
  const translate = instance.getFixedT(locale, 'auth');
  res.locals.uiLocale = locale;
  res.locals.uiText = (text) => {
    return authKeys.has(text) ? translate(authKeys.get(text), { defaultValue: text }) : text;
  };
  res.locals.uiLegacyScript = manifest.legacy;
  const root = normalizeRootPath(process.env.NODE_ENV === 'development' ? '' : process.env.ROOT_PATH || '', process.env.EXTERNAL_ROOT_PATH || '');
  res.locals.uiRoot = root;
  res.locals.uiLink = (path) => {
    const url = new URL(path, 'http://localhost' + (root.endsWith('/') ? root : root + '/'));
    url.searchParams.set('lang', locale);
    return url.pathname + url.search + url.hash;
  };
  const feedback = createFeedback(resources, instance.getFixedT(locale));
  const json = res.json;
  res.json = function (body) {
    if (body && !Array.isArray(body) && typeof body === 'object' && typeof body.message === 'string' && ['success', 'failure', 'error'].includes(body.status)) {
      const descriptor = feedback.descriptor(body);
      if (descriptor) body = { ...body, ...descriptor };
    }
    return json.call(this, body);
  };
  next();
}

module.exports = { uiLanguage };
