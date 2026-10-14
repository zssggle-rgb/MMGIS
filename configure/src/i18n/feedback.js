import { createFeedback } from './generated/feedback';
import resources from './generated/resources.json';
import { i18n } from './index';

const feedback = createFeedback(resources, (key, params) => i18n.t(key, { ...params, interpolation: { escapeValue: false } }));
export const feedbackText = feedback.text;
export const feedbackMessage = feedback.message;
export const feedbackDescriptor = feedback.descriptor;
