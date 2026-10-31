'use client';
import React, { useState } from 'react';
import { useForm, useFormFields, useTranslation, useLocale } from '@payloadcms/ui';

export const AiEditorialBar: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = useLocale();
  const { dispatchFields, setModified } = useForm();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const currentLocale = locale?.code || 'ar';

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fields = useFormFields(([f]) => ({
    title: f?.title?.value as string | undefined,
    lead: f?.lead?.value as string | undefined,
    body: f?.body?.value as string | undefined,
    metaTitle: f?.metaTitle?.value as string | undefined,
    metaDescription: f?.metaDescription?.value as string | undefined,
  }));

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Auto-Fill SEO Meta
  const handleAutoFillSeo = async () => {
    if (!fields.title && !fields.body && !fields.lead) {
      showFeedback(lang === 'ar' ? 'يرجى إدخال عنوان الصفحة أو المحتوى أولاً.' : 'Please enter a title or content first.');
      return;
    }
    setLoadingAction('seo');
    try {
      const res = await fetch('/api/hc/editorial-assist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-fill-seo',
          title: fields.title,
          lead: fields.lead,
          body: fields.body,
        }),
      });
      const data = await res.json();
      if (data.metaTitle) {
        dispatchFields({ type: 'UPDATE', path: 'metaTitle', value: data.metaTitle });
      }
      if (data.metaDescription) {
        dispatchFields({ type: 'UPDATE', path: 'metaDescription', value: data.metaDescription });
      }
      setModified(true);
      showFeedback(lang === 'ar' ? 'تم توليد وضبط عنوان ووصف محركات البحث بنجاح!' : 'SEO Title and Meta Description generated successfully!');
    } catch {
      showFeedback(lang === 'ar' ? 'تعذر توليد بيانات الميتا.' : 'Failed to generate SEO metadata.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Extract / Generate Lead
  const handleAutoFillLead = async () => {
    if (!fields.body) {
      showFeedback(lang === 'ar' ? 'يرجى إدخال نص المحتوى الأساسي أولاً.' : 'Please enter body content first.');
      return;
    }
    setLoadingAction('lead');
    try {
      const res = await fetch('/api/hc/editorial-assist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-fill-lead',
          body: fields.body,
        }),
      });
      const data = await res.json();
      if (data.lead) {
        dispatchFields({ type: 'UPDATE', path: 'lead', value: data.lead });
        setModified(true);
        showFeedback(lang === 'ar' ? 'تم استخلاص المقدمة وتنسيقها بنجاح!' : 'Hero Lead extracted and formatted successfully!');
      }
    } catch {
      showFeedback(lang === 'ar' ? 'تعذر استخلاص المقدمة.' : 'Failed to extract lead.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Insert Academic Structure Template
  const handleInsertTemplate = async () => {
    if (fields.body && !window.confirm(lang === 'ar' ? 'هل تريد استبدال المحتوى الحالي بهيكل دراسة أكاديمية منظم؟' : 'Replace current body with academic research template?')) {
      return;
    }
    setLoadingAction('template');
    try {
      const res = await fetch('/api/hc/editorial-assist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'academic-template' }),
      });
      const data = await res.json();
      if (data.template) {
        dispatchFields({ type: 'UPDATE', path: 'body', value: data.template });
        setModified(true);
        showFeedback(lang === 'ar' ? 'تم إدراج هيكل المادة العلمية بنجاح!' : 'Academic template inserted successfully!');
      }
    } catch {
      showFeedback(lang === 'ar' ? 'تعذر إدراج القالب.' : 'Failed to insert template.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Auto-Translate to Current Locale
  const handleTranslate = async () => {
    if (!fields.title && !fields.body && !fields.lead) {
      showFeedback(lang === 'ar' ? 'لا يوجد محتوى لترجمته حالياً.' : 'No content available to translate.');
      return;
    }
    setLoadingAction('translate');
    try {
      const res = await fetch('/api/hc/editorial-assist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          title: fields.title,
          lead: fields.lead,
          body: fields.body,
          targetLang: currentLocale,
        }),
      });
      const data = await res.json();
      if (data.translatedTitle) {
        dispatchFields({ type: 'UPDATE', path: 'title', value: data.translatedTitle });
      }
      if (data.translatedLead) {
        dispatchFields({ type: 'UPDATE', path: 'lead', value: data.translatedLead });
      }
      if (data.translatedBody) {
        dispatchFields({ type: 'UPDATE', path: 'body', value: data.translatedBody });
      }
      setModified(true);
      showFeedback(lang === 'ar' ? `تمت الترجمة الآلية للغة (${currentLocale.toUpperCase()}) بنجاح!` : `Auto-translated to (${currentLocale.toUpperCase()}) successfully!`);
    } catch {
      showFeedback(lang === 'ar' ? 'تعذر إتمام الترجمة.' : 'Failed to complete translation.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="hc-ai-bar">
      <div className="hc-ai-bar__header">
        <div className="hc-ai-bar__title">
          <span className="hc-ai-bar__sparkle">✨</span>
          <strong>{lang === 'ar' ? 'أدوات الذكاء التحريري والمساعدة الآلية' : 'Editorial AI & Smart Assistant Tools'}</strong>
        </div>
        {statusMessage && (
          <div className="hc-ai-bar__status" role="status">
            {statusMessage}
          </div>
        )}
      </div>

      <div className="hc-ai-bar__actions">
        <button
          type="button"
          className="hc-ai-btn"
          disabled={Boolean(loadingAction)}
          onClick={handleAutoFillSeo}
          title={lang === 'ar' ? 'توليد عنوان ووصف SEO تلقائياً من المحتوى' : 'Generate SEO Title & Description from content'}
        >
          {loadingAction === 'seo' ? '⏳...' : '🎯 ' + (lang === 'ar' ? 'توليد الميتا دلالياً (SEO)' : 'Auto-Fill SEO')}
        </button>

        <button
          type="button"
          className="hc-ai-btn"
          disabled={Boolean(loadingAction)}
          onClick={handleAutoFillLead}
          title={lang === 'ar' ? 'استخلاص مقدمة موجزة من متن الصفحة' : 'Extract concise lead overview from body'}
        >
          {loadingAction === 'lead' ? '⏳...' : '💡 ' + (lang === 'ar' ? 'استخلاص المقدمة (Lead)' : 'Extract Lead')}
        </button>

        <button
          type="button"
          className="hc-ai-btn"
          disabled={Boolean(loadingAction)}
          onClick={handleInsertTemplate}
          title={lang === 'ar' ? 'إدراج هيكل دراسة أكاديمية متكامل' : 'Insert structured academic research outline'}
        >
          {loadingAction === 'template' ? '⏳...' : '📜 ' + (lang === 'ar' ? 'قالب بحثي منظم' : 'Academic Template')}
        </button>

        <button
          type="button"
          className="hc-ai-btn hc-ai-btn--translate"
          disabled={Boolean(loadingAction)}
          onClick={handleTranslate}
          title={lang === 'ar' ? `ترجمة المحتوى آلياً للغة الحالية (${currentLocale.toUpperCase()})` : `Translate content to current locale (${currentLocale.toUpperCase()})`}
        >
          {loadingAction === 'translate' ? '⏳...' : '🌐 ' + (lang === 'ar' ? `ترجمة للمسودة (${currentLocale.toUpperCase()})` : `Translate Draft (${currentLocale.toUpperCase()})`)}
        </button>
      </div>
    </div>
  );
};
