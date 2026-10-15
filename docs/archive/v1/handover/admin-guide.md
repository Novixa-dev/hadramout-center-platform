# Administrator & Deployment Guide

**Platform:** Hadhramout Center Digital Platform  
**Target Audience:** Center Technical Custodian / Web Administrator  

---

## 1. Hosting Architecture Overview
The platform is built as an ultra-fast, zero-bloat modular web application. It requires no database server, no Node.js daemon, and no monthly cloud hosting invoices.

### Deployment Options:
1. **Edge Hosting (Vercel / Cloudflare Pages / Netlify):**
   - Connect the repository or drag-and-drop the directory.
   - Point DNS `hadramout.center` to Vercel/Cloudflare CNAME.
   - Automatic wildcard SSL and global CDN distribution included free forever.
2. **Traditional cPanel / Apache / Nginx:**
   - Upload all files (`index.html`, `styles.css`, `app.js`, `data.js`) to the webroot directory (`public_html` or `/var/www/html`).
   - The site operates immediately with zero configuration.

---

## 2. DNS Migration Checklist
1. Log into your domain registrar (where `hadramout.center` is registered).
2. Set `A` record for `@` to `76.76.21.21` (or your chosen edge CDN IP).
3. Set `CNAME` for `www` to `cname.vercel-dns.com`.
4. Wait for DNS propagation (typically 15-30 minutes).
