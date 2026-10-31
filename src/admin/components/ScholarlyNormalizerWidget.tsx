'use client';
import React, { useState } from 'react';
import { normalizeScholarlyArabic } from '../../lib/arabic-assist.ts';
import { dashboardStrings } from '../i18n.ts';

interface Props {
  lang: 'ar' | 'en';
}

export const ScholarlyNormalizerWidget: React.FC<Props> = ({ lang }) => {
  const t = dashboardStrings(lang);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  const handleNormalize = () => {
    if (!text.trim()) return;
    const normalized = normalizeScholarlyArabic(text);
    setText(normalized);
    setHasProcessed(true);
    setTimeout(() => setHasProcessed(false), 3000);
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  return (
    <div className="hc-normalizer-widget">
      <div className="hc-normalizer-widget__header">
        <div className="hc-normalizer-widget__title-group">
          <span className="hc-normalizer-widget__icon">✨</span>
          <h3 className="hc-normalizer-widget__title">{t.scholarlyAssistTitle}</h3>
        </div>
        <p className="hc-normalizer-widget__desc">{t.scholarlyAssistDesc}</p>
      </div>

      <div className="hc-normalizer-widget__body">
        <textarea
          className="hc-normalizer-widget__textarea"
          dir="auto"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.scholarlyAssistPlaceholder}
        />

        <div className="hc-normalizer-widget__actions">
          <button
            type="button"
            className="hc-normalizer-btn hc-normalizer-btn--primary"
            disabled={!text.trim()}
            onClick={handleNormalize}
          >
            {hasProcessed ? '✓ ' + (lang === 'ar' ? 'تم الضبط!' : 'Normalized!') : t.scholarlyAssistBtn}
          </button>

          {text.trim() && (
            <button
              type="button"
              className="hc-normalizer-btn hc-normalizer-btn--secondary"
              onClick={handleCopy}
            >
              {copied ? '✓ ' + t.scholarlyAssistCopied : (lang === 'ar' ? 'نسخ النص' : 'Copy Text')}
            </button>
          )}

          {text.trim() && (
            <button
              type="button"
              className="hc-normalizer-btn hc-normalizer-btn--ghost"
              onClick={() => setText('')}
            >
              {lang === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
