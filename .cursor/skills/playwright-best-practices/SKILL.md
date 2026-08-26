---
name: playwright-best-practices
description: Playwright practices for this host. Use when writing or changing e2e/portal.spec.ts.
---

# Playwright best practices

- Remotes off in webServer. Role/label locators over CSS.
- No real Core tokens in storageState committed to git.
- Assert chrome landmarks plus the page testid.
