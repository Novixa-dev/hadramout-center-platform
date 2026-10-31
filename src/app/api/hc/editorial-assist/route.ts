import { normalizeScholarlyArabic, auditScholarlyArabic } from '../../../../lib/arabic-assist.ts';
import { cleanDescription, clip, describe } from '../../../../lib/seo-text.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { appConfig } from '../../../../lib/runtime-light.ts';
import { createProvider } from '../../../../i18n/translation/providers.ts';
import { getLanguage } from '../../../../i18n/languages.ts';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      text?: string;
      title?: string;
      lead?: string;
      body?: string;
      targetLang?: string;
    };

    const action = body.action || (typeof body.text === 'string' ? 'normalize' : 'auto-fill-seo');

    // 1. Scholarly Normalization & Audit
    if (action === 'normalize') {
      const source = typeof body.text === 'string' ? body.text : '';
      if (!source) {
        return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
      const normalized = normalizeScholarlyArabic(source);
      const suggestions = auditScholarlyArabic(source);
      return new Response(JSON.stringify({ normalized, suggestions }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // 2. Auto-Fill SEO Meta Title & Description
    if (action === 'auto-fill-seo') {
      const title = (body.title || '').trim();
      const lead = (body.lead || '').trim();
      const rawBody = (body.body || '').trim();
      const cleanBodyText = htmlToText(rawBody);

      // Meta Title: crisp, under 60 chars
      const baseTitle = normalizeScholarlyArabic(title || 'مركز حضرموت للدراسات التاريخية');
      const metaTitle = clip(baseTitle, 58);

      // Meta Description: concise, informative, between 120 and 155 chars
      let metaDescription = '';
      if (lead) {
        metaDescription = cleanDescription(normalizeScholarlyArabic(lead));
      } else if (cleanBodyText) {
        metaDescription = describe(normalizeScholarlyArabic(cleanBodyText));
      } else {
        metaDescription = `${baseTitle} — مركز حضرموت للدراسات التاريخية والتوثيق والنشر (المكلا، اليمن).`;
      }

      if (metaDescription.length > 155) {
        metaDescription = clip(metaDescription, 152);
      }

      return new Response(JSON.stringify({ metaTitle, metaDescription }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // 3. Auto-Fill Lead / Overview
    if (action === 'auto-fill-lead') {
      const rawBody = (body.body || '').trim();
      const cleanBodyText = htmlToText(rawBody);
      let lead = '';
      if (cleanBodyText) {
        // Find first 1-2 sentences
        const sentences = cleanBodyText.split(/(?<=[.؟!؟])\s+/);
        lead = sentences.slice(0, 2).join(' ').trim();
        if (lead.length > 250) {
          lead = clip(lead, 240);
        }
        lead = normalizeScholarlyArabic(lead);
      }
      return new Response(JSON.stringify({ lead }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // 4. Academic Structure Template
    if (action === 'academic-template') {
      const template = `<h2>مقدمة ومدخل تاريخي</h2>
<p>توطئة حول موضوع البحث، وسياقه التاريخي والتوثيقي في حضرموت وجنوب الجزيرة العربية...</p>
<h2>المحاور والمباحث التوثيقية</h2>
<p>تفصيل المبحث الأول وتحليل الوثائق والمصادر والشواهد التاريخية المرتبطة...</p>
<h2>النتائج والتوصيات</h2>
<p>خلاصة النتائج العلمية التي خلصت إليها هذه المادة البحثية...</p>
<h2>المصادر والمراجع</h2>
<ol>
  <li>المصدر الأول: اسم الكتاب، المؤلف، الطبعة وسنة النشر.</li>
  <li>المصدر الثاني: ...</li>
</ol>`;
      return new Response(JSON.stringify({ template }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // 5. Translation Assistant
    if (action === 'translate') {
      const targetLang = (body.targetLang || 'en').toLowerCase();
      const cfg = appConfig();
      const textsToTranslate = [
        body.title || '',
        body.lead || '',
        body.body || '',
      ];

      // If translation provider is configured
      if (cfg.translation.provider !== 'none') {
        try {
          const provider = createProvider(cfg);
          if (provider) {
            const result = await provider.translate({
              texts: textsToTranslate.filter(Boolean),
              to: targetLang,
              toName: getLanguage(targetLang)?.english || targetLang,
              glossary: [],
              format: 'html',
            });
            let idx = 0;
            const translatedTitle = body.title ? result.texts[idx++] : '';
            const translatedLead = body.lead ? result.texts[idx++] : '';
            const translatedBody = body.body ? result.texts[idx++] : '';
            return new Response(
              JSON.stringify({
                translatedTitle,
                translatedLead,
                translatedBody,
                provider: provider.name,
              }),
              { status: 200, headers: { 'content-type': 'application/json' } },
            );
          }
        } catch {
          // Fall through to smart draft generation
        }
      }

      // Offline / Smart Draft translation fallback
      const translatedTitle = body.title ? `[${targetLang.toUpperCase()}] ${body.title}` : '';
      const translatedLead = body.lead ? `[Draft ${targetLang.toUpperCase()}] ${body.lead}` : '';
      const translatedBody = body.body ? `<p><em>[Draft ${targetLang.toUpperCase()} Translation]</em></p>${body.body}` : '';

      return new Response(
        JSON.stringify({
          translatedTitle,
          translatedLead,
          translatedBody,
          provider: 'draft-assistant',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
