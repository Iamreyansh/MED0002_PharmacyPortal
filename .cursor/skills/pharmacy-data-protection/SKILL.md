---
name: pharmacy-data-protection
description: PHI/PII handling in the pharmacy UI. Use when showing prescriptions, patients, GSTIN, or phone numbers.
---

# Pharmacy data protection

- Prescriptions, patient names, phone, GSTIN, addresses stay off URLs, telemetry, and MFE `feature` debug dumps.
- Do not put PHI in toast copy or `track()` properties.
