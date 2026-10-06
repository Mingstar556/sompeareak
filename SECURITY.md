# Security Policy & Data Protection Guidelines

**Somphea Reak Studio** (សម្ភារៈ ស្ទូឌីយោ) is committed to protecting user privacy, securing financial and order data, and preventing unauthorized access to the administration portal.

---

## 1. Supported Versions

Security updates and critical patches are actively applied to the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

---

## 2. Reporting a Vulnerability

If you discover a potential security vulnerability within the Somphea Reak storefront or admin desk, please report it responsibly.

* **Reporting Channel:** Please do **not** open a public issue on GitHub.
* **Email / Direct Message:** Contact the core team via Telegram: `@sompheareak` or email the project maintainer.
* **Response Timeline:** We acknowledge receipt within 24–48 hours and aim to deploy fixes within 3–5 business days.

---

## 3. Data Protection & Privacy Architecture

### SQLite Database Isolation
* **Zero PII Exposure in Git:** The production and development databases (`*.db`, `sompheareak.db`) are strictly ignored via `.gitignore` to prevent leaking customer names, Telegram IDs, contact phone numbers, and delivery addresses to public repositories.
* **Automated Seed Engine:** Clean installations automatically build a sterile local catalog with sample luxury products without needing sensitive production database snapshots.

### Environment Variable Protection
* All sensitive credentials (such as `ADMIN_PIN`, `SECRET_KEY`, database paths, and session tokens) are stored exclusively in `.env`.
* A sanitized template (`.env.example`) is committed to the repository for configuration reference.

### HTTP Security Headers
Every HTTP response is guarded with standard protective headers:
* `X-Content-Type-Options: nosniff` — Defends against MIME type sniffing.
* `X-Frame-Options: SAMEORIGIN` — Prevents unauthorized framing and clickjacking attacks.
* `X-XSS-Protection: 1; mode=block` — Client-side cross-site scripting filter.
* `Referrer-Policy: strict-origin-when-cross-origin` — Protects internal URI paths from external leaking.
* `Permissions-Policy` — Disables unneeded hardware features (camera, microphone, geolocation).

### Admin Authentication & Rate Limiting
* Privileged endpoints (product uploading, stock editing, pricing changes, order confirmation, and disapproval) require authenticated access.
* Brute-force protection is enforced on the admin PIN gate to prevent credential guessing.
