# Design System Tokens & Components

**Architecture:** Vanilla CSS Variables & Component Utility Matrix  
**Platform:** Hadhramout Center Digital Platform  

---

```css
:root {
  /* Colors */
  --hc-navy-900: #0a1526;
  --hc-navy-800: #0f1f38;
  --hc-navy-700: #1b2f4f;
  --hc-teal-700: #164e63;
  --hc-teal-600: #0e7490;
  --hc-amber-600: #c27803;
  --hc-amber-500: #d97706;
  --hc-amber-100: #fef3c7;
  --hc-parchment: #fcfaf7;
  --hc-surface: #ffffff;
  --hc-surface-card: #f8f6f0;
  --hc-border: #e7e2d6;
  --hc-border-strong: #cfc6b4;
  --hc-text-primary: #151d28;
  --hc-text-secondary: #4a5568;
  --hc-text-muted: #718096;

  /* Elevation Shadows */
  --hc-shadow-sm: 0 1px 3px rgba(15, 31, 56, 0.06), 0 1px 2px rgba(15, 31, 56, 0.04);
  --hc-shadow-md: 0 4px 8px -1px rgba(15, 31, 56, 0.08), 0 2px 4px -1px rgba(15, 31, 56, 0.05);
  --hc-shadow-lg: 0 12px 24px -4px rgba(15, 31, 56, 0.12), 0 4px 8px -2px rgba(15, 31, 56, 0.06);

  /* Spacing */
  --hc-space-xs: 0.25rem;
  --hc-space-sm: 0.5rem;
  --hc-space-md: 1rem;
  --hc-space-lg: 1.5rem;
  --hc-space-xl: 2rem;
  --hc-space-2xl: 3rem;
  --hc-space-3xl: 4.5rem;

  /* Radius */
  --hc-radius-sm: 6px;
  --hc-radius-md: 10px;
  --hc-radius-lg: 16px;
  --hc-radius-full: 9999px;

  /* Typography */
  --font-arabic: 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-latin: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading: 'IBM Plex Sans Arabic', 'Amiri', serif;
}
```

---

## Component Specifications
1. **Academic Card (`.hc-academic-card`):** Soft parchment background, delicate antique border, hover lift (`translateY(-3px)`), badge for subject taxonomy, citation action button.
2. **Interactive Search Input (`.hc-search-input`):** Full-width, prominent magnifier icon, keyboard shortcut badge (`/`), clear button (`Esc`), instant dropdown results.
3. **Timeline Node (`.hc-timeline-node`):** Vertical connecting line in amber, circular year badge, chronological summary card with historical citation.
4. **Citation Modal / Toast (`.hc-toast`):** Non-intrusive floating feedback confirming that APA/Chicago/MLA text has been copied to the clipboard.
