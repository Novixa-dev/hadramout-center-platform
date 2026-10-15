# Technical Architecture Specification

**Platform:** Hadhramout Center Digital Platform  
**Architecture Style:** High-Performance Edge-Delivered Modular Web Application  
**Standard:** Modern Web Standards (HTML5 / Vanilla CSS Design System / Modern ES Modules)  

---

## 1. Directory Structure

```
hadramout-center-platform/
│
├── index.html                  # Single-entry orchestrator with semantic routing
├── app.js                      # Core reactive application orchestrator & state manager
├── data.js                     # Verified institutional data repository (Books, Magazines, Forum, Timeline)
├── styles.css                  # Comprehensive design system, typography, RTL/LTR layout
│
├── assets/                     # Static media assets & optimized images
│   ├── logo.svg                # Center official identity vectors
│   └── covers/                 # Optimized publication covers & archival photographs
│
├── docs/                       # Complete institutional engineering documentation
│   ├── research/
│   ├── strategy/
│   ├── ux/
│   ├── content/
│   ├── design/
│   ├── technical/
│   ├── qa/
│   └── handover/
│
├── PRD.md                      # Product Requirements Document
├── README.md                   # Project overview, setup, and maintenance guide
├── CHANGELOG.md                # Release log
├── ROADMAP.md                  # Future roadmap for Phase 2 & Phase 3
├── TODO.md                     # Detailed task tracking
├── PROJECT_STATUS.md           # Current live project status
├── DECISIONS.md                # Summary of key architectural decisions
└── ASSUMPTIONS.md              # Explicit operational assumptions
```

---

## 2. Core Architectural Subsystems

### 2.1 State & Routing Engine
- Client-side pushState / hash router managing active views (`#home`, `#about`, `#magazines`, `#books`, `#conferences`, `#forum`, `#articles`, `#videos`, `#timeline`, `#search`, `#contact`).
- Synchronized URL parameters for search queries and category filters (`?q=...&category=...`).
- History stack support with browser back/forward buttons and title synchronization.

### 2.2 Dual-Language Translation Engine
- In-memory i18n dictionary supporting instant swapping between Arabic (`ar`) and English (`en`).
- Persisted user language preference in `localStorage`.
- Dynamic document reconfiguration: updates `document.documentElement.lang`, `dir="rtl"` vs `dir="ltr"`, page title, and meta tags.

### 2.3 Academic Search & Discovery Engine
- In-memory index of all publications, magazine issues, articles, and timeline events.
- Tokenized fuzzy substring matching across titles, authors, categories, keywords, and dates.
- Sub-5ms execution time for instant live updates as the user types.

### 2.4 Citation & Clipboard Subsystem
- Dynamic generator of academic citations in APA 7th, Chicago 17th, and MLA 9th editions.
- Modern asynchronous Clipboard API (`navigator.clipboard.writeText`) with fallback for older browsers.
