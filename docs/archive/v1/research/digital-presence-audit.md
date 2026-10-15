# Digital Presence & Technical Audit: hadramout.center

**Target Domain:** `https://hadramout.center`  
**Audit Conducted By:** Novixa Engineering Team  
**Audit Type:** Full Architectural, UX, Content, and SEO Inspection  
**Date:** September 2026  

---

## 1. Executive Summary of Audit Findings
The current website of Hadhramout Center (`hadramout.center`) was recently rebuilt using Next.js. While the attempt to modernize is commendable, the live production site suffers from **critical architectural regressions, broken core routes, complete absence of search functionality, unhandled 404 errors, and broken media assets** that directly compromise the Center's academic credibility.

---

## 2. Technical Audit Details

### 2.1 Critical Functional Defects
1. **Broken About Route (404 Error):**
   - The homepage contains a direct call to action button `<a href="/about">عن المركز</a>` in its core mission banner.
   - Clicking this link delivers:
     ```
     <h1 class="text-2xl font-bold mb-4">لم نتمكن من العثور على الصفحة</h1>
     <a class="text-blue-500" href="/">الرجوع للصفحة الرئيسية</a>
     ```
   - This means the most fundamental institutional page explaining who they are, their board, and their mission is completely broken in production.
2. **Total Absence of Search:**
   - With dozens of specialized books, 40+ magazine issues, and hundreds of research articles, there is **no search bar or query mechanism** anywhere on the site.
   - Users are forced to manually click through paginated lists without filtering by author, subject, or historical era.
3. **Broken Image Thumbnails & Placeholder Text:**
   - In the News section, items render with missing image sources and raw strings:
     `<img alt="Update" ... /><h3 class="mb-1 font-semibold text-md">Update</h3>`
   - This exposes unvetted staging content to the live public.
4. **No Digital Reading or Citation Tool:**
   - Book and magazine pages do not provide bibliographic citations (APA, Chicago, MLA) or interactive preview capabilities, rendering them inert for academic researchers.
5. **Zero Multilingual Support:**
   - The site is strictly Arabic-only, with no English abstracts or navigational toggles, cutting off international orientalists and diaspora scholars.

### 2.2 Performance & Asset Delivery
- Next.js static asset chunking is functional, but heavy unoptimized images are pulled directly from `files.hadramout.center` (some images exceed 2.5 MB each).
- No progressive image blurring or modern WebP/AVIF transformations on client requests.
- Mobile rendering has cramped padding, overflowing table tags, and suboptimal touch targets.

### 2.3 SEO & Schema Audit
- Meta title tag is generic: `<title>الرئيسية - مركز حضرموت للدراسات التاريخية</title>`.
- Open Graph tags lack rich metadata for scholarly articles and publications.
- Missing `Schema.org` entities (`ScholarlyArticle`, `Book`, `EducationalOrganization`, `Event`).

---

## 3. Heuristic UX & Visual Audit

| UX Dimension | Current Score | Critical Issues Identified |
|--------------|---------------|----------------------------|
| Information Architecture | Poor (2/5) | Fragmented flat lists; no thematic grouping (e.g. Pre-Islamic, Islamic, Qu'aiti Sultanate, Modern). |
| Navigational Clarity | Fair (3/5) | Top nav is adequate on desktop, but mobile drawer lacks sub-level navigation. Broken `/about` link. |
| Readability & Typography | Fair (3/5) | IBM Plex Sans Arabic is used, but line heights in article text are cramped; lack of font hierarchy. |
| Visual Dignity & Prestige | Poor (2/5) | Monotone color scheme; uninspired card layouts; lack of authentic historical visual accents. |
| Call to Action | Very Poor (1/5)| No clear mechanism to request research consultations, submit manuscripts, or order books. |
