/**
 * Language catalog. Each entry: code, endonym (name in its own script), English name, Arabic name.
 * No flags: a language is not a country. RTL scripts are listed in RTL_CODES.
 */

export interface Language {
  code: string;
  native: string;
  english: string;
  arabic: string;
  dir: 'rtl' | 'ltr';
  /** BCP-47 tag used for Intl APIs and <html lang> */
  tag: string;
  /** OpenGraph locale, e.g. ar_YE */
  og: string;
}

const RTL_CODES = new Set(['ar', 'fa', 'ur', 'he', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'ku']);

// [code, native, english, arabic, ogLocale?]
type Row = readonly [string, string, string, string, string?];

const ROWS: readonly Row[] = [
  ['ar', 'العربية', 'Arabic', 'العربية', 'ar_YE'],
  ['en', 'English', 'English', 'الإنجليزية', 'en_US'],
  ['fr', 'Français', 'French', 'الفرنسية', 'fr_FR'],
  ['id', 'Bahasa Indonesia', 'Indonesian', 'الإندونيسية', 'id_ID'],
  ['ms', 'Bahasa Melayu', 'Malay', 'الملايوية', 'ms_MY'],
  ['ur', 'اردو', 'Urdu', 'الأردية', 'ur_PK'],
  ['tr', 'Türkçe', 'Turkish', 'التركية', 'tr_TR'],
  ['fa', 'فارسی', 'Persian', 'الفارسية', 'fa_IR'],
  ['ru', 'Русский', 'Russian', 'الروسية', 'ru_RU'],
  ['de', 'Deutsch', 'German', 'الألمانية', 'de_DE'],
  ['es', 'Español', 'Spanish', 'الإسبانية', 'es_ES'],
  ['it', 'Italiano', 'Italian', 'الإيطالية', 'it_IT'],
  ['pt', 'Português', 'Portuguese', 'البرتغالية', 'pt_PT'],
  ['nl', 'Nederlands', 'Dutch', 'الهولندية', 'nl_NL'],
  ['so', 'Soomaali', 'Somali', 'الصومالية', 'so_SO'],
  ['sw', 'Kiswahili', 'Swahili', 'السواحيلية', 'sw_KE'],
  ['am', 'አማርኛ', 'Amharic', 'الأمهرية', 'am_ET'],
  ['ha', 'Hausa', 'Hausa', 'الهوسا', 'ha_NG'],
  ['hi', 'हिन्दी', 'Hindi', 'الهندية', 'hi_IN'],
  ['bn', 'বাংলা', 'Bengali', 'البنغالية', 'bn_BD'],
  ['ta', 'தமிழ்', 'Tamil', 'التاميلية', 'ta_IN'],
  ['ml', 'മലയാളം', 'Malayalam', 'المالايالامية', 'ml_IN'],
  ['gu', 'ગુજરાતી', 'Gujarati', 'الغوجاراتية', 'gu_IN'],
  ['te', 'తెలుగు', 'Telugu', 'التيلوغوية', 'te_IN'],
  ['kn', 'ಕನ್ನಡ', 'Kannada', 'الكانادية', 'kn_IN'],
  ['mr', 'मराठी', 'Marathi', 'المراثية', 'mr_IN'],
  ['pa', 'ਪੰਜਾਬੀ', 'Punjabi', 'البنجابية', 'pa_IN'],
  ['ne', 'नेपाली', 'Nepali', 'النيبالية', 'ne_NP'],
  ['si', 'සිංහල', 'Sinhala', 'السنهالية', 'si_LK'],
  ['jv', 'Basa Jawa', 'Javanese', 'الجاوية', 'jv_ID'],
  ['su', 'Basa Sunda', 'Sundanese', 'السوندانية', 'su_ID'],
  ['tl', 'Filipino', 'Filipino', 'الفلبينية', 'tl_PH'],
  ['th', 'ไทย', 'Thai', 'التايلاندية', 'th_TH'],
  ['vi', 'Tiếng Việt', 'Vietnamese', 'الفيتنامية', 'vi_VN'],
  ['km', 'ខ្មែរ', 'Khmer', 'الخميرية', 'km_KH'],
  ['my', 'မြန်မာ', 'Burmese', 'البورمية', 'my_MM'],
  ['zh', '简体中文', 'Chinese (Simplified)', 'الصينية (المبسطة)', 'zh_CN'],
  ['zh-tw', '繁體中文', 'Chinese (Traditional)', 'الصينية (التقليدية)', 'zh_TW'],
  ['ja', '日本語', 'Japanese', 'اليابانية', 'ja_JP'],
  ['ko', '한국어', 'Korean', 'الكورية', 'ko_KR'],
  ['mn', 'Монгол', 'Mongolian', 'المنغولية', 'mn_MN'],
  ['kk', 'Қазақша', 'Kazakh', 'الكازاخية', 'kk_KZ'],
  ['uz', 'Oʻzbekcha', 'Uzbek', 'الأوزبكية', 'uz_UZ'],
  ['az', 'Azərbaycanca', 'Azerbaijani', 'الأذربيجانية', 'az_AZ'],
  ['ky', 'Кыргызча', 'Kyrgyz', 'القيرغيزية', 'ky_KG'],
  ['tg', 'Тоҷикӣ', 'Tajik', 'الطاجيكية', 'tg_TJ'],
  ['tk', 'Türkmençe', 'Turkmen', 'التركمانية', 'tk_TM'],
  ['ug', 'ئۇيغۇرچە', 'Uyghur', 'الأويغورية', 'ug_CN'],
  ['ps', 'پښتو', 'Pashto', 'البشتوية', 'ps_AF'],
  ['sd', 'سنڌي', 'Sindhi', 'السندية', 'sd_PK'],
  ['ku', 'Kurdî', 'Kurdish (Kurmanji)', 'الكردية (الكرمانجية)', 'ku_TR'],
  ['ckb', 'کوردیی ناوەندی', 'Kurdish (Sorani)', 'الكردية (السورانية)', 'ckb_IQ'],
  ['he', 'עברית', 'Hebrew', 'العبرية', 'he_IL'],
  ['hy', 'Հայերեն', 'Armenian', 'الأرمنية', 'hy_AM'],
  ['ka', 'ქართული', 'Georgian', 'الجورجية', 'ka_GE'],
  ['el', 'Ελληνικά', 'Greek', 'اليونانية', 'el_GR'],
  ['bg', 'Български', 'Bulgarian', 'البلغارية', 'bg_BG'],
  ['sr', 'Српски', 'Serbian', 'الصربية', 'sr_RS'],
  ['hr', 'Hrvatski', 'Croatian', 'الكرواتية', 'hr_HR'],
  ['bs', 'Bosanski', 'Bosnian', 'البوسنية', 'bs_BA'],
  ['sq', 'Shqip', 'Albanian', 'الألبانية', 'sq_AL'],
  ['mk', 'Македонски', 'Macedonian', 'المقدونية', 'mk_MK'],
  ['sl', 'Slovenščina', 'Slovenian', 'السلوفينية', 'sl_SI'],
  ['sk', 'Slovenčina', 'Slovak', 'السلوفاكية', 'sk_SK'],
  ['cs', 'Čeština', 'Czech', 'التشيكية', 'cs_CZ'],
  ['pl', 'Polski', 'Polish', 'البولندية', 'pl_PL'],
  ['uk', 'Українська', 'Ukrainian', 'الأوكرانية', 'uk_UA'],
  ['be', 'Беларуская', 'Belarusian', 'البيلاروسية', 'be_BY'],
  ['ro', 'Română', 'Romanian', 'الرومانية', 'ro_RO'],
  ['hu', 'Magyar', 'Hungarian', 'المجرية', 'hu_HU'],
  ['fi', 'Suomi', 'Finnish', 'الفنلندية', 'fi_FI'],
  ['sv', 'Svenska', 'Swedish', 'السويدية', 'sv_SE'],
  ['no', 'Norsk', 'Norwegian', 'النرويجية', 'nb_NO'],
  ['da', 'Dansk', 'Danish', 'الدنماركية', 'da_DK'],
  ['is', 'Íslenska', 'Icelandic', 'الأيسلندية', 'is_IS'],
  ['et', 'Eesti', 'Estonian', 'الإستونية', 'et_EE'],
  ['lv', 'Latviešu', 'Latvian', 'اللاتفية', 'lv_LV'],
  ['lt', 'Lietuvių', 'Lithuanian', 'الليتوانية', 'lt_LT'],
  ['ga', 'Gaeilge', 'Irish', 'الأيرلندية', 'ga_IE'],
  ['cy', 'Cymraeg', 'Welsh', 'الويلزية', 'cy_GB'],
  ['ca', 'Català', 'Catalan', 'الكتالانية', 'ca_ES'],
  ['gl', 'Galego', 'Galician', 'الغاليكية', 'gl_ES'],
  ['eu', 'Euskara', 'Basque', 'الباسكية', 'eu_ES'],
  ['mt', 'Malti', 'Maltese', 'المالطية', 'mt_MT'],
  ['af', 'Afrikaans', 'Afrikaans', 'الأفريقانية', 'af_ZA'],
  ['zu', 'isiZulu', 'Zulu', 'الزولو', 'zu_ZA'],
  ['xh', 'isiXhosa', 'Xhosa', 'الخوسا', 'xh_ZA'],
  ['yo', 'Yorùbá', 'Yoruba', 'اليوروبا', 'yo_NG'],
  ['ig', 'Igbo', 'Igbo', 'الإيغبو', 'ig_NG'],
  ['rw', 'Kinyarwanda', 'Kinyarwanda', 'الكينياروندا', 'rw_RW'],
  ['mg', 'Malagasy', 'Malagasy', 'المالاغاشية', 'mg_MG'],
  ['ln', 'Lingála', 'Lingala', 'اللينغالا', 'ln_CD'],
  ['ti', 'ትግርኛ', 'Tigrinya', 'التغرينية', 'ti_ER'],
  ['om', 'Oromoo', 'Oromo', 'الأورومو', 'om_ET'],
  ['lo', 'ລາວ', 'Lao', 'اللاوية', 'lo_LA'],
  ['dv', 'ދިވެހި', 'Dhivehi', 'الديفهية', 'dv_MV'],
  ['eo', 'Esperanto', 'Esperanto', 'الإسبرانتو', 'eo'],
  ['la', 'Latina', 'Latin', 'اللاتينية', 'la'],
];

export const LANGUAGES: readonly Language[] = ROWS.map(([code, native, english, arabic, og]) => ({
  code,
  native,
  english,
  arabic,
  dir: RTL_CODES.has(code) ? 'rtl' : 'ltr',
  tag: code === 'zh-tw' ? 'zh-TW' : code,
  og: og ?? `${code}_${code.toUpperCase()}`,
}));

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

/** Languages shown first in the picker. */
export const POPULAR_CODES = ['ar', 'en', 'fr', 'id', 'ms', 'ur', 'tr', 'fa', 'ru', 'de', 'es', 'so', 'sw', 'hi', 'zh'] as const;

/** Languages whose UI is hand-written by Novixa (never machine-translated). */
export const CURATED_CODES = ['ar', 'en'] as const;

export function getLanguage(code: string): Language | undefined {
  return BY_CODE.get(code.toLowerCase());
}

export function isRtl(code: string): boolean {
  return getLanguage(code)?.dir === 'rtl';
}

/** Languages the site offers, honoring the ENABLED_LANGS setting. `ar` is always included. */
export function enabledLanguages(enabled: '*' | string[]): Language[] {
  if (enabled === '*') return [...LANGUAGES];
  const set = new Set(['ar', ...enabled]);
  return LANGUAGES.filter((l) => set.has(l.code));
}

/** Pick the best supported language from an Accept-Language header. */
export function negotiateLanguage(header: string | undefined, available: Language[], fallback: string): string {
  if (!header) return fallback;
  const codes = new Set(available.map((l) => l.code));
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = Number.parseFloat(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? '1');
      return { tag: (tag ?? '').toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    if (codes.has(tag)) return tag;
    if (tag === 'zh-hant' || tag === 'zh-hk' || tag === 'zh-tw') {
      if (codes.has('zh-tw')) return 'zh-tw';
    }
    const primary = tag.split('-')[0] as string;
    if (codes.has(primary)) return primary;
    if (primary === 'nb' || primary === 'nn') {
      if (codes.has('no')) return 'no';
    }
  }
  return fallback;
}
