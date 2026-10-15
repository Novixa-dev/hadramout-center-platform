# Editorial and data issues — findings, safe fixes, items for the Center

**Date:** 2026-10-16 · **Source of truth:** the migrated database (identical to the production seed) and the legacy snapshot.
**Rule applied (audit §P0, AGENTS.md rule 2):** fix only what is *certain and mechanical*; never invent or "correct" historical facts; flag everything else for the Center's editors.

## A. Fixed (certain) — migration `20261015_223000_editorial_fixes`

Idempotent SQL on the Arabic source locale; translations regenerate from it on demand.

| # | Record(s) | Defect | Fix | Evidence |
|---|---|---|---|---|
| 1 | Forum events 8, 9 | Doubled preposition in the title: «فعالية منتدى عميد الوفاء الثقافي **عن بعنوان** *…» | «عن بعنوان» → «بعنوان» | the audit example; 2 rows |
| 2 | 10 articles, 4 forum events | Stray Markdown asterisks in titles, e.g. «فعالية بعنوان *محاولات توحيد الكلمة في حضرموت 1927 – 2024م*.» | asterisks removed, double spaces collapsed | legacy formatting residue; asterisks are never meaningful in titles |
| 3 | Magazine issue 41 (record id 40) | Heading of the announcement reads «صدور العدد **40** من مجلة (حضرموت الثقافية)» while the title, `issueNumber` and the paragraph below all say 41 | «صدور العدد 40» → «صدور العدد 41» in excerpt and body of issue 41 only | issue 40's own record correctly says 40; the paragraph under the wrong heading says «العدد (41)» |

## B. Taxonomy (data migration `20261015_222500_curate_topics`, proposal — editable in the admin)

The 53 "categories" of articles are the magazine's *columns*. They are now grouped under 8 main topics (new records), each column keeping its identity and articles:

| Topic | Columns filed under it |
|---|---|
| دراسات وبحوث | دراسات، ملف، ملف العدد |
| التاريخ والتراث والآثار | تاريخ، تراث، تراثيات، موروثات، تراث وآثار، آثار، ذاكرة، أمكنة |
| الأعلام والشخصيات | أعلام، شخصيات، «أضواء – ملف خاص: عن الشاعر سعيد محمد البطاطي» |
| الأدب والإبداع | إبداعات، إبداع، كتابات، قصة قصيرة، قصص قصيرة، نصوص قصيرة جدًّا، توقيع قلم، تباريح قلم، حكايات |
| الفنون والمسرح | فنون، تشكيل، مسرح |
| حوارات ولقاءات واستطلاعات | حوار، لقاء، لقاء العدد، استطلاع، «استطلاع عادل أحمد القحـوم»، «تحقيق وتصوير: …» |
| قراءات ونقد | قراءة، قراءات، قراءة في كتاب، عرض كتاب، نقد، متابعات، نقاش |
| مقالات ورؤى | أضواء، آفاق، تأملات، آراء، مدار، مدارات، لغويات، ترجمة، حديث البداية |

Three **unambiguous typos were merged** into their canonical column (articles re-pointed first, then the duplicate removed): «حديث الباية»→«حديث البداية» (1 article), «درايسات»→«دراسات» (1), «أضو»→«أضواء» (1).
Result on the seed data: 767 articles categorised, 142 without category, 2 articles in leftover columns.

**For the Center's editors**
- Confirm or re-file the grouping (admin → التصنيفات → «الموضوع الرئيسي»). It is a navigation aid, not a scholarly classification.
- The column named **«40»** (1 article) is an issue number captured as a category; **«توقيع فلم»** (1 article) looks like a typo of «توقيع قلم» but was **not** merged because it is not certain.
- 142 articles and all 52 books have no category; books have no classification data at all, so none was invented.

## C. Needs the Center's judgement (not changed)

| # | Item | Why it was not changed |
|---|---|---|
| C1 | **Authors «أ.م.د» (id 159) and «الشيخ» (id 78)** — generic honorific fragments stored as author names. Works: «مرثاة انهيار الإمبراطورية البريطانية في مسرحية…» (author blank in the title: «…للكاتب »), «غيل باوزير يجري في مدينة عدن», «المرحوم الشيخ / محمد عمر بارحيم بامشموس…» | The real author names are not in the source; they must be taken from the printed magazine. Do not merge with similar-looking names. |
| C2 | **Timeline** — 6 entries, 5 of them cite only «مرجع تاريخي عام — يخضع لمراجعة الهيئة العلمية». The first spans «800 ق.م – 300». | The UI now writes the range unambiguously («800 ق.م – 300 م») and shows a *pending scientific review* badge per entry. Dates, wording and sources must be reviewed by the Center's scientific committee; set «حالة المراجعة» to reviewed with a date when done. |
| C3 | Entry «ميناء سمهرم (خور روري)» cites «دراسة د. صلاح دويل لرضي، العدد 37» | The study exists in two parts (1)/(2); link the right one via «دراسة ذات صلة» in the admin. |
| C4 | **«عن المركز» and leadership names** | Placeholder text awaiting the Center's confirmation (TRACKER #2). |
| C5 | **«40 issues» vs «latest issue 41»** | Not a defect: 40 issue records exist (issue 25 is absent from the archive; numbers 1–24 and 26–41). The home page says «عدداً من المجلة» (issues *in the archive*), the hero says «العدد 41». If issue 25 exists in print, add it. |
| C6 | Articles/news with estimated dates | Dates flagged `estimated` stay hidden from readers and are excluded from year filters (they still order lists). |
| C7 | 7 broken pages in the legacy source (TRACKER) | Not recoverable from the source. |

## D. Checks that now exist (so regressions are caught)
- `tests/unit/messages.test.ts` — every UI key used in code exists in `ar.json` and `en.json` (found a pre-existing English plural gap: a 1-minute article showed Arabic text on English pages).
- `scripts/seo-audit.mjs` — titles, descriptions, canonicals, OG/Twitter, hreflang, JSON-LD, robots/sitemap host consistency on a running site.
- Facet engine tests assert that every advertised facet count equals the real result count.
