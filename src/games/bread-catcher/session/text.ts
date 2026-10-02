/**
 * Toàn bộ chữ hiển thị (tiếng Anh — plan §30). Nguồn: content/ui_text.en.json.
 */
import uiText from '@/games/bread-catcher/content/ui_text.en.json';

export const UI_TEXT = uiText;

/** Khen khi hứng đúng một chữ (plan §11) */
export const LETTER_PRAISE = [uiText.yes, uiText.nice, uiText.great];

/** Khen khi hoàn thành cả từ (plan §12) */
export const WORD_PRAISE = [uiText.great, uiText.amazing, uiText.wellDone, uiText.super];
