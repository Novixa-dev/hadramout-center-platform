# Production Deployment Strategy & DNS Configuration

**Target Platform:** Hadhramout Center Digital Platform  
**Target Domain:** `hadramout.center` / Staging on Vercel Edge  

---

## 1. Hosting Options & Recommendations

### Option 1 (Recommended): Vercel Edge / Cloudflare Pages
* **Cost:** Free tier ($0/month forever).
* **SSL:** Automatic Let's Encrypt Wildcard SSL certificate.
* **Global CDN:** Instant edge caching in Frankfurt, Dubai, Riyadh, and Singapore, guaranteeing < 50ms latency across the Middle East.
* **Deploy Command:** Static directory deployment.

### Option 2: Apache / Nginx Static VirtualHost
* If the Center prefers local hosting in Yemen, the entire build folder can be dropped into `/var/www/html` or cPanel `public_html` without installing Node.js, Python, or MySQL.

---

## 2. DNS & Domain Configuration
To point `hadramout.center` to the new platform:
```dns
hadramout.center.       A       76.76.21.21
www.hadramout.center.   CNAME   cname.vercel-dns.com.
```

---

## 3. Deployment Checklist
- [x] Verify semantic HTML5 markup and zero console errors.
- [x] Test responsive viewport scaling from 320px to 2560px.
- [x] Verify Arabic RTL and English LTR alignment and text flows.
- [x] Confirm instant search execution and empty states.
- [x] Validate all book citation copy mechanisms (APA, Chicago, MLA).
- [x] Test WhatsApp routing buttons for book inquiries.
- [x] Validate Open Graph image headers and Schema.org JSON-LD.
