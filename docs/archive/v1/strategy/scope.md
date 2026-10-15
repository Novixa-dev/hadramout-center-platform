# Project Scope & Boundary Specification

**Platform:** Hadhramout Center Digital Platform  
**Status:** Approved  
**Version:** 1.0.0  

---

## 1. In-Scope Deliverables

### 1.1 Core Platform Architecture
- High-performance bilingual (Arabic primary RTL, English secondary LTR) institutional platform.
- Zero-external-dependency, lightweight, ultra-fast client-side execution with static pre-rendering capability.
- Full responsive design supporting Mobile (320px–480px), Tablet (768px–1024px), and Desktop (1200px+).

### 1.2 Academic Content Modules
1. **Institutional Hub (`/about`):** Detailed, verified history, mission, vision, board of directors, scientific advisory council, organizational departments, and physical Mukalla headquarters.
2. **Magazines Archive (`/magazines`):** Catalog of *Majallat Hadramout Al-Thaqafiyyah* (مجلة حضرموت الثقافية), including Issue 40, issue summaries, editorial board, and table of contents.
3. **Scholarly Books & Monograph Catalog (`/books`):** Searchable archive of publications (Qu'aiti history, Ingrams treaties, ancient ports, linguistic studies, Ramadan customs, Hadhrami commerce) with detail views, download simulations, and bibliographic citations.
4. **Conferences & Scientific Symposia (`/conferences`):** Comprehensive archive of biennial academic conferences, themes, and researcher contributions.
5. **Cultural Forum (`/forum`):** Dedicated section for the periodic "منتدى عميد الوفاء الثقافي" lectures and events.
6. **Scholarly Articles & Essays (`/articles`):** Peer-reviewed articles, op-eds, and historical analyses categorized by era and topic.
7. **Multimedia & Video Archive (`/videos`):** Academic lectures, TV interviews, and "كاتب وكتاب" series.
8. **Interactive Historical Timeline (`/timeline`):** Curated timeline of Hadhramout's history from pre-Islamic times to modern eras.
9. **Interactive Unified Search Engine:** Instant client-side search across all titles, authors, categories, and tags.
10. **Research Inquiries & Contact (`/contact`):** Forms for manuscript inquiries, publication purchase requests, and academic collaboration.

### 1.3 Quality, SEO & Accessibility
- WCAG 2.1 AA compliant contrast, semantic HTML5, focus states, and keyboard navigation.
- Dynamic Schema.org structured data (`ResearchOrganization`, `Book`, `ScholarlyArticle`, `Periodical`).
- Open Graph, Twitter Cards, canonical tags, and XML sitemaps.

---

## 2. Explicit Out-of-Scope (Non-Goals for Phase 1)
- **Direct Online Payment Gateway:** Due to regional banking constraints in Yemen, direct credit card checkouts are replaced by direct WhatsApp/Email order and inquiry routing.
- **Full In-Browser OCR Manuscript Editing:** Advanced multi-gigabyte manuscript editing is reserved for Phase 2 enterprise archival software.
- **Unverified Content Fabrication:** Missing staff biographies or unverified statistics will not be created.
