'use client';
import React, { useState, useMemo } from 'react';
import { useFormFields, useTranslation, useLocale } from '@payloadcms/ui';

export const SerpPreview: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = useLocale();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'google' | 'social'>('google');

  const fields = useFormFields(([f]) => ({
    title: f?.title?.value as string | undefined,
    metaTitle: f?.metaTitle?.value as string | undefined,
    metaDescription: f?.metaDescription?.value as string | undefined,
    slug: f?.slug?.value as string | undefined,
    lead: f?.lead?.value as string | undefined,
    badge: f?.badge?.value as string | undefined,
  }));

  const activeTitle = (fields.metaTitle || fields.title || (lang === 'ar' ? 'عنوان الصفحة' : 'Page Title')).trim();
  const activeSlug = fields.slug ? String(fields.slug).trim() : 'page-slug';
  const siteSuffix = lang === 'ar' ? ' — مركز حضرموت للدراسات التاريخية' : ' — Hadhramout Center';
  const fullTitle = `${activeTitle}${siteSuffix}`;

  const rawDesc = fields.metaDescription || fields.lead || '';
  const cleanDesc = useMemo(() => rawDesc.replace(/<[^>]*>/g, '').trim(), [rawDesc]);
  const activeDesc = cleanDesc || (lang === 'ar' ? 'ملخص ومقدمة محتوى الصفحة كما ستظهر للزوار في نتائج محركات البحث وشبكات التواصل الاجتماعي...' : 'Brief overview of the page content as it will appear in search engine results and social media shares...');

  const titleLen = fullTitle.length;
  const descLen = cleanDesc.length;

  const isTitleGood = titleLen >= 40 && titleLen <= 65;
  const isTitleLong = titleLen > 65;

  const isDescGood = descLen >= 120 && descLen <= 160;
  const isDescLong = descLen > 160;

  const currentLocale = locale?.code || 'ar';
  const displayUrl = `https://hadramout.center › ${currentLocale} › ${activeSlug}`;

  return (
    <div className="hc-serp-preview">
      <div className="hc-serp-preview__header">
        <div className="hc-serp-preview__tabs">
          <button
            type="button"
            className={`hc-serp-btn ${previewMode === 'google' ? 'active' : ''}`}
            onClick={() => setPreviewMode('google')}
          >
            🔍 {lang === 'ar' ? 'معاينة Google (SERP)' : 'Google Search Preview'}
          </button>
          <button
            type="button"
            className={`hc-serp-btn ${previewMode === 'social' ? 'active' : ''}`}
            onClick={() => setPreviewMode('social')}
          >
            🌐 {lang === 'ar' ? 'معاينة بطاقة التواصل (OG)' : 'Social Card Preview'}
          </button>
        </div>

        {previewMode === 'google' && (
          <div className="hc-serp-preview__devices">
            <button
              type="button"
              className={`hc-device-btn ${device === 'desktop' ? 'active' : ''}`}
              onClick={() => setDevice('desktop')}
              title={lang === 'ar' ? 'سطح المكتب' : 'Desktop'}
            >
              💻
            </button>
            <button
              type="button"
              className={`hc-device-btn ${device === 'mobile' ? 'active' : ''}`}
              onClick={() => setDevice('mobile')}
              title={lang === 'ar' ? 'الهاتف' : 'Mobile'}
            >
              📱
            </button>
          </div>
        )}
      </div>

      {previewMode === 'google' ? (
        <div className={`hc-serp-card hc-serp-card--${device}`}>
          <div className="hc-serp-card__top">
            <div className="hc-serp-card__favicon">
              <img src="/brand/logo-icon.svg" alt="" width={16} height={16} />
            </div>
            <div className="hc-serp-card__site">
              <span className="hc-serp-card__sitename">
                {lang === 'ar' ? 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر' : 'Hadhramout Center for Historical Studies'}
              </span>
              <span className="hc-serp-card__url">{displayUrl}</span>
            </div>
          </div>
          <h3 className="hc-serp-card__title">{fullTitle}</h3>
          <p className="hc-serp-card__desc">
            {activeDesc.length > 160 ? `${activeDesc.slice(0, 157)}...` : activeDesc}
          </p>
        </div>
      ) : (
        <div className="hc-social-card-preview">
          <div className="hc-social-card">
            <div className="hc-social-card__media">
              <div className="hc-social-card__placeholder">
                <img src="/brand/logo-icon.svg" alt="" width={44} height={44} />
                <span>1200 × 630</span>
              </div>
            </div>
            <div className="hc-social-card__content">
              <span className="hc-social-card__domain">HADRAMOUT.CENTER</span>
              <h4 className="hc-social-card__title">{fullTitle}</h4>
              <p className="hc-social-card__lead">
                {activeDesc.length > 125 ? `${activeDesc.slice(0, 122)}...` : activeDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="hc-serp-meters">
        <div className="hc-serp-meter">
          <div className="hc-serp-meter__label">
            <span>{lang === 'ar' ? 'طول عنوان البحث' : 'SEO Title Length'}:</span>
            <span className={`hc-meter-tag ${isTitleGood ? 'good' : isTitleLong ? 'warn' : 'short'}`}>
              {titleLen} / 60 {lang === 'ar' ? 'حرف' : 'chars'}
            </span>
          </div>
          <div className="hc-meter-bar">
            <div
              className={`hc-meter-bar__fill ${isTitleGood ? 'good' : isTitleLong ? 'warn' : 'short'}`}
              style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
            />
          </div>
        </div>

        <div className="hc-serp-meter">
          <div className="hc-serp-meter__label">
            <span>{lang === 'ar' ? 'طول الوصف التعريفي' : 'Meta Description Length'}:</span>
            <span className={`hc-meter-tag ${isDescGood ? 'good' : isDescLong ? 'warn' : 'short'}`}>
              {descLen} / 155 {lang === 'ar' ? 'حرف' : 'chars'}
            </span>
          </div>
          <div className="hc-meter-bar">
            <div
              className={`hc-meter-bar__fill ${isDescGood ? 'good' : isDescLong ? 'warn' : 'short'}`}
              style={{ width: `${Math.min(100, (descLen / 155) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
