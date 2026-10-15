# Web Accessibility (a11y) & Inclusivity Plan

**Standard:** WCAG 2.1 Level AA  
**Platform:** Hadhramout Center Digital Platform  
**Target Organization:** Hadhramout Center for Historical Studies, Documentation and Publishing  

---

## 1. Core Principles Implemented

### 1.1 Perceivable
* **Text Contrast:** All body text maintains a contrast ratio of at least 7.2:1 against light parchment (`#fcfaf7`), far exceeding the WCAG AA requirement of 4.5:1.
* **Alternative Text:** Every book cover, historical manuscript photo, and conference illustration contains rich, descriptive Arabic and English `alt` attributes.
* **Clear Structure:** Standard semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<aside>`).

### 1.2 Operable
* **Skip Links:** A prominent skip link (`<a href="#main" class="skip-link">تخطي إلى المحتوى الرئيسي</a>`) appears on keyboard focus.
* **Keyboard Navigation:** All interactive elements (filters, modals, language switchers, buttons) are operable via `Tab`, `Enter`, `Space`, and `Escape`.
* **No Keyboard Traps:** Modal overlays trap focus properly while open and restore focus to trigger buttons upon closing.

### 1.3 Understandable
* **Language & RTL Attributes:** Top-level HTML tags dynamically update `lang="ar" dir="rtl"` and `lang="en" dir="ltr"`.
* **Form Feedback:** Clear, inline error messages on input fields; no form relies solely on color to communicate state.

### 1.4 Robust
* **Schema.org Integration:** Valid JSON-LD structured data for search engine bots and assistive screen readers.
