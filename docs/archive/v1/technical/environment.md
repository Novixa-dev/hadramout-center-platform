# Environment Configuration & Variables

**Platform:** Hadhramout Center Digital Platform  
**Target:** Edge CDN & Static Hosting Environments  

---

## 1. Environment Architecture
Because the application is designed to be resilient, lightning-fast, and zero-maintenance, it does not require private backend database credentials in the browser bundle.

All public configurations are exposed via standard global variables or data attributes:
- `PRODUCTION_URL`: `https://hadramout.center`
- `STAGING_URL`: `https://hadramout-center-platform.vercel.app`
- `OFFICIAL_EMAIL`: `info@hadramout.center`
- `WHATSAPP_YEMEN`: `+967773570194`
- `WHATSAPP_KSA`: `+966556408983`

---

## 2. `.env.example`
A sample `.env.example` file is provided in the repository root for continuous integration and automated preview builds:
```bash
# Public Center Configuration
NEXT_PUBLIC_SITE_URL=https://hadramout.center
NEXT_PUBLIC_CONTACT_EMAIL=info@hadramout.center
NEXT_PUBLIC_WHATSAPP_YE=+967773570194
NEXT_PUBLIC_WHATSAPP_SA=+966556408983
```
