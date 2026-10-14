# Security & Threat Model

**Platform:** Hadhramout Center Digital Platform  
**Target:** Hadhramout Center for Historical Studies, Documentation and Publishing  

---

## 1. Security Architecture & Threat Vectors

### 1.1 Zero Server Attack Surface
Because the platform operates without a dynamic backend database or PHP execution layer, classical vulnerability vectors are completely eliminated:
- **No SQL Injection (SQLi):** No relational database query interpreters exposed to the web.
- **No Server-Side Request Forgery (SSRF):** No server-side HTTP proxying or unvetted backend fetching.
- **No Remote Code Execution (RCE):** No server runtime executing dynamic user uploads.

### 1.2 Client-Side Security & Content Security Policy (CSP)
- **Cross-Site Scripting (XSS) Prevention:** All user-supplied search queries and form inputs are sanitized using strict DOM text insertion (`textContent` and safe template rendering).
- **Safe External Links:** All external URLs (social media, official publisher links, WhatsApp links) enforce `rel="noopener noreferrer"` to prevent reverse tabnabbing.
- **Content Security Policy Recommendations:**
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self';
  ```
