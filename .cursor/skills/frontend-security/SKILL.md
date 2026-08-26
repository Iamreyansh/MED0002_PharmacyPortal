---
name: frontend-security
description: OWASP ASVS-minded SPA checklist for this host. Use when changing auth, HTML, or navigation.
---

# Frontend security

- XSS: text content only. Open redirects: `isSafeReturnPath`.
- CSRF: Bearer in sessionStorage, not cookies — do not add cookie auth.
- Clickjacking: keep frame-ancestors in intended CSP.
