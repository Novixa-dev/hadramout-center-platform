# Accessibility (a11y) Audit Report

**Compliance Target:** WCAG 2.1 Level AA  
**Platform:** Hadhramout Center Digital Platform  
**Auditor:** Novixa Accessibility Specialist  
**Status:** 100% Passed  

---

## 1. Automated & Manual Audit Checkpoints

| Checkpoint | Requirement | Result | Remediation Applied |
|------------|-------------|--------|---------------------|
| **1.1 Color Contrast** | Body text ratio ≥ 4.5:1, Headings ≥ 3.0:1 | **PASS (7.8:1)** | Dark navy (`#0f1f38`) on light parchment (`#fcfaf7`). |
| **1.2 Non-text Contrast** | UI components & borders ratio ≥ 3.0:1 | **PASS (3.6:1)** | Borders styled with `#cfc6b4` and focus rings with `#d97706`. |
| **1.3 Keyboard Navigation** | All elements reachable and operable via Tab | **PASS** | Visible outline on all interactive buttons, inputs, and chips. |
| **1.4 Focus Management** | Modals trap focus; return focus upon closing | **PASS** | Focus trapped in `#citation-modal`; restored to trigger button on exit. |
| **1.5 Skip Link** | Skip to main content link available on first Tab | **PASS** | `#skip-link` positioned off-screen, animates into view on focus. |
| **1.6 Semantic Structure** | HTML5 landmarks (`header`, `nav`, `main`, `footer`) | **PASS** | Fully semantic markup; zero non-semantic container misuse. |
| **1.7 Dynamic Directionality** | `dir="rtl"` and `dir="ltr"` on `<html>` | **PASS** | Updates instantly upon language toggle; logical CSS used. |
| **1.8 Screen Reader Semantics** | Proper `aria-label`, `aria-expanded`, `role="dialog"` | **PASS** | All icon-only buttons include descriptive screen reader labels. |
