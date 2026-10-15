# Technical Decision Record (TDR-001)

**Title:** Architecture Selection for Hadhramout Center Knowledge Platform  
**Status:** Approved  
**Deciders:** Novixa Technical Director, Principal Architect, Full-Stack Lead  

---

## 1. Context & Problem Statement
The Hadhramout Center currently runs on a complex Next.js setup hosted on external infrastructure, which has fallen into decay:
- Critical endpoints (`/about`) are broken with 404 responses.
- Massive asset chunks cause high initial latency.
- There is no local staff to maintain complex Node runtime clusters, database servers, or server-side hydration mismatches.
- Power cuts and limited bandwidth in Mukalla require the site to load reliably even on slow 3G mobile connections.

---

## 2. Considered Alternatives

### Option A: Heavy Full-Stack Next.js with PostgreSQL & Headless CMS
* **Pros:** Familiar enterprise stack.
* **Cons:** High recurring hosting cost, vulnerability to database connection failures during regional power outages, complex maintenance requiring continuous DevOps attention that the Center lacks.

### Option B: WordPress / PHP CMS
* **Pros:** Familiar to some local developers.
* **Cons:** High security vulnerability profile, slow performance, plugin bloat, frequent maintenance headaches, vulnerable to spam bots and automated attacks.

### Option C: Modern High-Performance Modular Web Platform (Vanilla CSS + Modern ES6+ Architecture)
* **Pros:**
  1. **Zero Recurring Infrastructure Cost:** Can be hosted directly on static global edge CDNs (Vercel, Cloudflare Pages, GitHub Pages) with 99.99% uptime.
  2. **Sub-Second Load Times:** Under 200KB total bundle size (versus 3MB+ in legacy setup).
  3. **Zero Security Surface:** No database to breach, no PHP vulnerabilities, no server-side execution risks.
  4. **Instant Offline Readiness:** PWA service workers can cache the entire catalog for offline reading by scholars with intermittent connectivity.
  5. **Direct Data Portability:** Clean structured JSON content models that can be effortlessly plugged into any future headless CMS or API.

---

## 3. Decision
**We select Option C: A high-performance, modular, zero-bloat modern web platform** utilizing Vanilla CSS for tailored visual control, modern typed JavaScript architecture, and static edge deployment.
