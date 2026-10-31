/**
 * Strings of the admin's own components (dashboard, editor, header), in the admin's two interface languages.
 * Payload's built-in screens come from @payloadcms/translations; ADMIN_TRANSLATIONS below only overrides the few of its
 * phrases that read wrong for this project. Arabic is the reference: every key must exist in both (unit-tested).
 */

export type AdminLang = 'ar' | 'en';
export const adminLang = (language: string | undefined): AdminLang => (language === 'en' ? 'en' : 'ar');

const EDITOR = {
  ar: {
    toolbar: 'أدوات التنسيق',
    loading: 'جارٍ تحميل المحرّر…',
    bold: 'عريض', boldShort: 'ع',
    italic: 'مائل', italicShort: 'مائل',
    underline: 'تسطير', underlineShort: 'U',
    h2: 'عنوان رئيسي', h2Short: 'عنوان',
    h3: 'عنوان فرعي', h3Short: 'فرعي',
    bullets: 'قائمة نقطية', bulletsShort: '• قائمة',
    numbers: 'قائمة رقمية', numbersShort: '1. قائمة',
    quote: 'اقتباس',
    link: 'إضافة رابط أو تعديله', linkShort: 'رابط',
    image: 'إدراج صورة', imageShort: 'صورة',
    rule: 'فاصل أفقي',
    scholarlyAssist: 'ضبط الترقيم والطباعة التراثية', scholarlyAssistShort: '« » ضبط',
    undo: 'تراجع', redo: 'إعادة',
    linkPrompt: 'الرابط (اتركه فارغاً لإزالته):',
    imagePrompt: 'رابط الصورة (ارفعها من «الوسائط» ثم الصق رابطها هنا):',
    altPrompt: 'وصف الصورة (يقرؤه قارئ الشاشة):',
  },
  en: {
    toolbar: 'Formatting tools',
    loading: 'Loading the editor…',
    bold: 'Bold', boldShort: 'B',
    italic: 'Italic', italicShort: 'I',
    underline: 'Underline', underlineShort: 'U',
    h2: 'Heading', h2Short: 'H2',
    h3: 'Subheading', h3Short: 'H3',
    bullets: 'Bulleted list', bulletsShort: '• List',
    numbers: 'Numbered list', numbersShort: '1. List',
    quote: 'Quotation',
    link: 'Add or edit a link', linkShort: 'Link',
    image: 'Insert an image', imageShort: 'Image',
    rule: 'Horizontal rule',
    scholarlyAssist: 'Scholarly punctuation & typography', scholarlyAssistShort: '« » Clean',
    undo: 'Undo', redo: 'Redo',
    linkPrompt: 'Link URL (leave empty to remove the link):',
    imagePrompt: 'Image URL (upload it under "Media" first, then paste its URL here):',
    altPrompt: 'Image description (read aloud by screen readers):',
  },
} as const;

const DASHBOARD = {
  ar: {
    greeting: 'أهلاً، {name}',
    section: 'القسم',
    roleAdmin: 'مدير النظام', roleEditor: 'محرر', roleReviewer: 'مراجع ترجمة',
    leadStaff: 'نظرة على حالة الموقع وما يحتاج انتباهك. كل رقم رابط إلى القائمة المصفّاة.',
    leadReviewer: 'دورك: مراجعة الترجمة — تعدّل نصوص اللغات غير العربية فقط، والأصل العربي للقراءة.',
    attention: 'ما يحتاج انتباهك',
    allClear: 'لا شيء معلّق الآن.',
    pendingReviews: 'مراجعات قرّاء بانتظار الموافقة', pendingReviewsHint: 'لا تظهر للعموم قبل الموافقة',
    newMessages: 'رسائل جديدة من الزوار', newMessagesHint: 'تواصل، طلبات كتب، بلاغات ترجمة',
    translationIssues: 'بلاغات عن أخطاء الترجمة', translationIssuesHint: 'صحّحها في العنصر نفسه، باللغة المعنية',
    uncategorised: 'مقالات منشورة بلا تصنيف', uncategorisedHint: 'التصنيف يُظهرها في صفحات المواضيع',
    latestEvent: 'آخر فعالية منشورة', latestEventHint: 'أضيفوا فعاليات المركز الأحدث ليبقى الموقع حيّاً',
    noEvent: 'لا توجد فعالية منشورة بعد',
    content: 'حالة المحتوى',
    published: 'منشور', drafts: 'مسودات', archived: 'مؤرشف',
    viewAll: 'عرض الكل', create: 'إضافة', createNew: 'إضافة {label}',
    recent: 'آخر التعديلات',
    recentEmpty: 'لم يُعدَّل شيء بعد.',
    untitled: '(بلا عنوان)',
    quick: 'اختصارات',
    viewSite: 'عرض الموقع',
    guide: 'دليل المحرر',
    profile: 'حسابي وكلمة المرور',
    users: 'المستخدمون والأدوار',
    translation: 'الترجمة الآلية اليوم',
    translationUsed: '{used} من {limit} حرف',
    translationNone: 'لم تُستخدم الترجمة الآلية اليوم.',
    updated: 'عُدّل',
  },
  en: {
    greeting: 'Welcome, {name}',
    section: 'Section',
    roleAdmin: 'Administrator', roleEditor: 'Editor', roleReviewer: 'Translation reviewer',
    leadStaff: 'The state of the site and what needs your attention. Every number opens the filtered list.',
    leadReviewer: 'Your role: translation review — you edit non-Arabic text only; the Arabic original is read-only.',
    attention: 'Needs your attention',
    allClear: 'Nothing is waiting right now.',
    pendingReviews: 'Reader reviews awaiting approval', pendingReviewsHint: 'Hidden from the public until approved',
    newMessages: 'New visitor messages', newMessagesHint: 'Contact, book requests, translation reports',
    translationIssues: 'Reported translation errors', translationIssuesHint: 'Fix them in the item itself, in that language',
    uncategorised: 'Published articles without a topic', uncategorisedHint: 'A topic makes them appear on topic pages',
    latestEvent: 'Latest published event', latestEventHint: 'Add the Center’s latest events to keep the site current',
    noEvent: 'No published event yet',
    content: 'Content status',
    published: 'Published', drafts: 'Drafts', archived: 'Archived',
    viewAll: 'View all', create: 'Add', createNew: 'Add {label}',
    recent: 'Recently edited',
    recentEmpty: 'Nothing has been edited yet.',
    untitled: '(untitled)',
    quick: 'Shortcuts',
    viewSite: 'View the site',
    guide: 'Editor guide',
    profile: 'My account and password',
    users: 'Users and roles',
    translation: 'Machine translation today',
    translationUsed: '{used} of {limit} characters',
    translationNone: 'No machine translation used today.',
    updated: 'Edited',
  },
} as const;

const HEADER = {
  ar: { switchTo: 'English', switchLabel: 'تبديل لغة الواجهة إلى الإنجليزية', viewSite: 'عرض الموقع', brand: 'مركز حضرموت', brandSub: 'لوحة التحكم' },
  en: { switchTo: 'العربية', switchLabel: 'Switch the interface to Arabic', viewSite: 'View site', brand: 'Hadhramout Center', brandSub: 'Admin' },
} as const;

export const editorStrings = (language?: string) => EDITOR[adminLang(language)];
export const dashboardStrings = (language?: string) => DASHBOARD[adminLang(language)];
export const headerStrings = (language?: string) => HEADER[adminLang(language)];

/** `{name}` placeholders, filled from `vars`. */
export const fill = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Exposed for the parity test. */
export const ADMIN_STRING_TABLES = { EDITOR, DASHBOARD, HEADER } as const;

/**
 * Overrides of Payload's own interface strings (merged over @payloadcms/translations).
 * - "locale" is the *content* language picker in the header; Payload calls it «اللغة»/"Locale", the same word as the
 *   interface language in the account settings, which confused editors. It now says what it is.
 */
export const ADMIN_TRANSLATIONS = {
  ar: { general: { locale: 'لغة المحتوى', locales: 'لغات المحتوى' } },
  en: { general: { locale: 'Content language', locales: 'Content languages' } },
};
