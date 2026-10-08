# Somphea Reak Studio (សម្ភារៈ ស្ទូឌីយោ)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Database: SQLite3](https://img.shields.io/badge/Database-SQLite3-003B57.svg)](https://www.sqlite.org/)
[![Security: Enterprise](https://img.shields.io/badge/Security-Protected-success.svg)](SECURITY.md)

> **Cambodia Kingdom of Wonder • Premium Collectibles, Toys & Customizable Italy Charm Jewelry**  
> A high-performance, responsive luxury e-commerce web platform and live administrative management system featuring bilingual Khmer & English localization, Telegram customer verification, dynamic loyalty rewards, real-time audio/visual order confirmations, and robust data protection.

---

## 🌟 Key Features

### 🛍️ Customer Storefront (`index.html`)
- **Interactive Italy Charm Bracelet Designer**: Drag/click custom stainless steel bracelet link builder with live pricing calculation and real-time point reward estimators.
- **Dynamic Collections & General Shop**: Instant (<5ms) client-side category filtering (`All Items`, `Mini Figures`, `Toy Universe`, `Luxury Bracelets`) and real-time live search.
- **Telegram Verification & Contact Gate**: Telegram-authenticated checkout workflow with contact phone and delivery address memorization (`Remember Me` on device).
- **Gamified Loyalty Rewards**: Automated point engine (1–5 points earned per item) with point redemption for percentage-discount vouchers (e.g. 25 pt = 10% OFF voucher).
- **Bilingual Interface (ភាសាខ្មែរ / English)**: Instant language switching with smooth liquid animations across all products, modals, receipts, and order statuses.
- **Dark / Light Liquid Switch**: Custom circular theme toggle transition with balanced high-contrast dark mode and soft eye-friendly light mode.
- **Live Order Status Tracking**: Real-time sound chimes and visual toast notifications when admin confirms, ships, or disapproves an order.
- **Printable Official Receipts**: Formatted thermal/official invoices with itemized pricing, delivery fees, voucher discounts, and order references.

### 👑 Dedicated Store Owner Admin Management (`sompheareakAdmin`)
The Admin Management Desk is completely decoupled into its own repository:
- **Repository**: [`sompheareakAdmin`](https://github.com/Mingstar556/sompheareakAdmin)
- **Zero Customer Leakage**: Customer storefront is 100% clean and isolated from administrative controls.
- **Unified Backend & Live Sync**: Both customer and admin frontends sync seamlessly via the central Python API (`server.py`) and single SQLite database (`sompheareak.db`).
- **Middleware Pattern**: Enforces role classification, authentication guards, and CORS support.

---

## 🛡️ Security & Privacy Architecture

This repository is built following security-first engineering practices:

1. **Zero Database / PII Leaks (`.gitignore`)**:
   - Production and local SQLite databases (`sompheareak.db`, `*.db`, `*.sqlite*`) are explicitly excluded from Git to prevent customer names, phone numbers, delivery addresses, and orders from entering version control.
   - A clean auto-seeding engine automatically initializes a sample luxury catalog when starting from a fresh clone.
2. **Environment Variable Configuration (`.env`)**:
   - Sensitive values (`ADMIN_PIN`, `SECRET_KEY`, database paths, rate-limit settings) are kept exclusively in `.env`.
   - `.env.example` is committed as a clean template for deployment.
3. **HTTP Security Headers**:
   - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
   - `X-Frame-Options: SAMEORIGIN` (Clickjacking protection)
   - `X-XSS-Protection: 1; mode=block` (Cross-site scripting protection)
   - `Referrer-Policy: strict-origin-when-cross-origin` (Privacy protection)
   - `Permissions-Policy` (Hardware lockdown)
4. **Brute-Force Rate Limiting**:
   - The `/api/admin/verify-pin` endpoint enforces IP-based rate limiting (5 failed attempts within 60 seconds triggers a temporary security lock).
5. **Admin Authorization**:
   - Privileged operations (modifying settings, adjusting stock, deleting categories, approving/disapproving orders) require valid `X-Admin-PIN` or Bearer token verification.
6. **SQL Injection Immunity**:
   - All database queries in `database.py` are strictly parameterized (`?` placeholders).

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Python 3.10+**
- Modern Web Browser (Chrome, Edge, Safari, Firefox)

### 2. Clone the Repository
```bash
git clone https://github.com/Mingstar556/sompeareak.git
cd sompeareak
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your desired settings in `.env`:
```ini
PORT=5000
FLASK_ENV=development
ADMIN_PIN=Sompheareak.com04/10/2026-Ming
SECRET_KEY=your_secure_random_key
DATABASE_PATH=sompheareak.db
```

### 4. Install Dependencies
```bash
pip install flask python-dotenv
```

### 5. Launch the Server
```bash
python server.py
```

Open your browser:
- **Customer Storefront**: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- **Admin Management Portal**: [http://127.0.0.1:5000/admin.html](http://127.0.0.1:5000/admin.html)

---

## 📁 Project Structure

```
sompeareak/
├── .env.example        # Environment variables template (safe for git)
├── .gitignore          # Ignores .env, *.db, pycache, and logs
├── LICENSE             # MIT Open Source License
├── README.md           # Project documentation and guide
├── SECURITY.md         # Vulnerability reporting & security policy
├── server.py           # Flask REST API backend with security headers
├── database.py         # SQLite database engine & schema manager
├── db.js               # Reactive client database with cross-tab broadcast sync
├── index.html          # Customer storefront page
├── app.js              # Storefront controller & bilingual state
├── admin.html          # Administration desk portal
├── admin.js            # Admin controller & order confirmation desk
├── styles.css          # Fluid UI design, liquid toggles, and responsive layouts
├── logo.jpg            # Studio brand logo asset
├── Admin/              # Synchronized admin modular directory
├── costumer/           # Synchronized customer modular directory
└── database/           # Synchronized database modular directory
```

---

## ⚙️ Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the HTTP server |
| `FLASK_ENV` | `production` | Environment mode (`development` or `production`) |
| `DEBUG` | `False` | Flask debug mode flag |
| `SECRET_KEY` | *(Random)* | Secret key for session security |
| `ADMIN_PIN` | `Sompheareak.com04/10/2026-Ming` | Master PIN required for administrative access |
| `ADMIN_RATE_LIMIT_MAX_ATTEMPTS` | `5` | Maximum failed PIN attempts before locking |
| `ADMIN_RATE_LIMIT_WINDOW_SECONDS`| `60` | Duration in seconds of PIN lock |
| `DATABASE_PATH` | `sompheareak.db` | Local SQLite database file location |
| `ENABLE_SECURITY_HEADERS` | `True` | Inject OWASP-recommended HTTP security headers |
| `DELIVERY_FEE` | `1.5` | Standard flat delivery fee in USD ($) |
| `VOUCHER_COST` | `25` | Loyalty points required to redeem a voucher |
| `VOUCHER_PCT` | `10` | Percentage discount provided by redeemed voucher |

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).  
Copyright © 2026 **Somphea Reak Studio** (កម្ពុជា ព្រះរាជាណាចក្រអច្ឆរិយៈ).