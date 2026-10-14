# Design Direction & Visual Identity

**Platform:** Hadhramout Center Digital Platform  
**Design Philosophy:** "Heritage Dignity Meets Modern Precision" (وقار التراث يلتقي بدقة العصر)  
**Lead Designer:** Novixa Design Studio  

---

## 1. Aesthetic Rationale
The Hadhramout Center represents centuries of scholarship, ancient maritime trade, mud brick architectural mastery, and literary depth.
* **Avoid:** Cheap gradients, childish bright colors, trendy neon buttons, meaningless SaaS glassmorphism, or sterile generic AI templates.
* **Embrace:** Rich earthy tones reminiscent of Hadhramout’s natural geography—deep indigo/navy representing the Indian Ocean, warm amber/terracotta echoing the ancient clay palaces of Shibam and Tarim, crisp parchment ivory for readable body canvases, and disciplined gold accents for academic prestige.

---

## 2. Color Palette Token System
| Token Name | Hex Code | HSL Value | Intent & Usage |
|------------|----------|-----------|----------------|
| `--color-primary-navy` | `#0f1f38` | `hsl(216, 58%, 14%)` | Deep academic headers, institutional cards, primary text on light. |
| `--color-secondary-teal` | `#164e63` | `hsl(197, 63%, 24%)` | Interactive highlights, active navigation indicators, scholarly badges. |
| `--color-accent-amber` | `#c27803` | `hsl(37, 96%, 39%)` | Historical timeline nodes, primary CTAs, heritage accents. |
| `--color-accent-gold` | `#d97706` | `hsl(38, 92%, 50%)` | Focus rings, award stars, citation copy confirmation. |
| `--color-surface-parchment`| `#fbf9f5` | `hsl(40, 43%, 97%)` | Primary page background, soothing historical paper warmth. |
| `--color-surface-white` | `#ffffff` | `hsl(0, 0%, 100%)` | Card surfaces, modal dialogs, search containers. |
| `--color-border-subtle` | `#e2dcce` | `hsl(41, 24%, 85%)` | Delicate card dividers, book borders. |
| `--color-text-main` | `#1c2430` | `hsl(215, 26%, 15%)` | High-contrast body text (passes WCAG AAA). |
| `--color-text-muted` | `#576375` | `hsl(216, 15%, 40%)` | Secondary meta info, publication dates, page counts. |

---

## 3. Typography Hierarchy
* **Arabic Primary:** `IBM Plex Sans Arabic`, `Cairo`, and `Amiri` fallback for classical citations.
* **English Primary:** `IBM Plex Sans`, `Inter`, and `Cinzel` / `Merriweather` fallback for historical headings.
* **Scale:**
  - Display Titles: `clamp(2rem, 4vw, 3rem)` / Line Height: 1.25
  - Section Headings: `clamp(1.5rem, 2.5vw, 2rem)` / Line Height: 1.3
  - Card Titles: `1.15rem` / SemiBold / Line Height: 1.4
  - Body Text: `1rem` (16px) / Line Height: 1.75 / Optimized for long Arabic prose.
