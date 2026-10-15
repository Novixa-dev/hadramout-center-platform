# Institutional Risk Register & Mitigation Strategy

**Project:** Hadhramout Center Digital Platform  
**Target Organization:** Hadhramout Center for Historical Studies, Documentation and Publishing  
**Author:** Novixa Strategy & Technical Governance  
**Status:** Approved  

---

## 1. Risk Matrix Overview

Each risk is evaluated on **Probability (1-5)** and **Impact (1-5)** yielding a **Risk Score (1-25)**:
- **Low Risk (1-6):** Monitor via standard procedures.
- **Medium Risk (8-12):** Active operational mitigation required.
- **High Risk (15-25):** Critical architectural or strategic safeguard required.

---

## 2. Identified Risks & Mitigation Protocols

| ID | Risk Description | Category | Prob. | Impact | Score | Mitigation Strategy | Owner |
|----|------------------|----------|-------|--------|-------|---------------------|-------|
| **RSK-01** | **Server Down / Power Outage in Mukalla:** Local hosting servers fail due to municipal electricity cuts, taking down the Center’s portal. | Operational / Infrastructure | 5 | 5 | **25 (Critical)** | **Mitigation:** Deploy the entire platform to a global distributed Edge CDN (Vercel / Cloudflare Pages). Edge servers remain 100% online worldwide with zero reliance on local power grids. | Novixa Cloud Architect |
| **RSK-02** | **DNS Custody & Registrar Delays:** Bureaucratic friction or lost credentials preventing timely pointing of `hadramout.center`. | Administrative | 3 | 4 | **12 (Medium)** | **Mitigation:** Deliver an immediately functional staging deployment (e.g., `hadramout-center.vercel.app`), then provide an illustrated step-by-step DNS guide to the Center’s IT manager. | Novixa Project Manager |
| **RSK-03** | **Unintentional Content Inaccuracies:** Historical dates, author attributions, or conference papers misstated. | Academic / Reputation | 2 | 5 | **10 (Medium)** | **Mitigation:** Strict Zero-Fabrication Protocol: all data in `data.js` sourced from verified printed monographs; unverified items flagged as `UNKNOWN — REQUIRES CONFIRMATION`. | Novixa Content Strategist |
| **RSK-04** | **Bandwidth Throttling on Cellular Networks:** Mobile users in Yemen experiencing slow 3G data speeds abandoning page loads. | Technical / Performance | 4 | 4 | **16 (High)** | **Mitigation:** Zero-bloat frontend payload (<130 KB total). In-memory client search, responsive image sizing, and deferred non-critical assets. | Novixa Performance Engineer |
| **RSK-05** | **Staff Turnover / Technical Maintenance Debt:** Center staff unable to update website after Novixa handoff. | Sustainability | 3 | 4 | **12 (Medium)** | **Mitigation:** Zero-database architecture. Clear, human-readable JSON/JS data file (`data.js`) paired with comprehensive Arabic documentation and 12-month voluntary support. | Novixa Documentation Lead |
| **RSK-06** | **Intellectual Property & Case Study Misalignment:** Misunderstanding regarding source code ownership or publicity rights. | Legal / Ethical | 2 | 4 | **8 (Medium)** | **Mitigation:** Formal pro bono handover agreement (`docs/handover/handover.md`) explicitly stating the Center owns all code, data, and IP, with Novixa requesting case study permission ethically. | Novixa Legal & Leadership |
