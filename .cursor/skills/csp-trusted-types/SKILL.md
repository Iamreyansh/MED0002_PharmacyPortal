---
name: csp-trusted-types
description: Markup that survives a strict CSP. Use when adding scripts, GSAP, or shadcn.
---

# CSP / Trusted Types

- No inline handlers. No inline script in `index.html`.
- Later GSAP/shadcn must not inject scripts. Prefer bundling.
