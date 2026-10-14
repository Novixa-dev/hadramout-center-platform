# Responsive Test Matrix & Viewport Validation

| Device Class | Viewport (WxH) | Browser Engine | Key Validated Elements | Status |
|--------------|----------------|----------------|------------------------|--------|
| Small Smartphone (e.g. iPhone SE) | 375 x 667 | WebKit (iOS Safari) | Hamburger nav drawer, card stacking, search input touch target | PASS |
| Modern Smartphone (e.g. iPhone 14 Pro, Samsung Galaxy S23) | 390 x 844 / 412 x 915 | Blink / WebKit | Header sticky blur, timeline vertical alignment, citation toast visibility | PASS |
| Tablet Portrait (e.g. iPad 10th Gen) | 768 x 1024 | WebKit / Blink | 2-column grid cards, search suggestions dropdown, about section banner | PASS |
| Tablet Landscape (e.g. iPad Pro) | 1024 x 768 | WebKit / Blink | 3-column book grid, timeline expanded nodes, full top nav bar | PASS |
| Standard Laptop (e.g. MacBook Air, 1080p Desktop) | 1366 x 768 / 1440 x 900 | Blink (Chrome) & Gecko (Firefox) | Full desktop layout, hover states, academic modal dialogs | PASS |
| Ultra-wide Monitor | 1920 x 1080+ | Blink / Gecko / WebKit | Max-width containment (1280px), centered typography, high-res crispness | PASS |
