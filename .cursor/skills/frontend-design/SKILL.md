---
name: frontend-design
description: Frontend layout and interaction patterns for the Pharmacy Portal host. Use when building or restyling screens.
---

# Frontend design

- Host chrome in `modules/shell`. Pages in module `pages/`.
- Landmarks required: skip link, banner, main, labelled nav.
- Mobile: bottom nav under 768px. Tablet: collapsible sidebar.
- Empty, loading, and error states must keep chrome visible.
