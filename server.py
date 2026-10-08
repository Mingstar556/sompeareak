import os
import sys
import time
import uuid
import hmac
import hashlib
import base64
import json
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, redirect, g, make_response
import database

# ================================================================
# Somphea Reak Studio - Unified Python API Server
# Powers both the Customer Storefront and the Standalone Admin Desk (sompheareakAdmin).
# ================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Environment Variable & Secrets Loading ---
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, '.env'))
except ImportError:
    _env_file = os.path.join(BASE_DIR, '.env')
    if os.path.exists(_env_file):
        with open(_env_file, 'r', encoding='utf-8') as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith('#') and '=' in _line:
                    _k, _v = _line.split('=', 1)
                    os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

# Initialize Database Schema & Admin Auth Hash
database.init_db()

app = Flask(__name__, static_folder=BASE_DIR)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'sompheareak_secret_key_prod_2026')
app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

# --- Token Configuration (Cryptographic Signed JWT) ---
TOKEN_LIFETIME_SECONDS = int(os.environ.get('TOKEN_LIFETIME_SECONDS', 86400)) # 24 Hours default

def create_signed_token(payload: dict) -> str:
    """Create an HMAC-SHA256 cryptographically signed JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    secret = app.config['SECRET_KEY'].encode('utf-8')
    h_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(',', ':')).encode('utf-8')).decode('utf-8').rstrip('=')
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(',', ':')).encode('utf-8')).decode('utf-8').rstrip('=')
    msg = f"{h_b64}.{p_b64}".encode('utf-8')
    sig = hmac.new(secret, msg, hashlib.sha256).digest()
    s_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
    return f"{h_b64}.{p_b64}.{s_b64}"

def verify_signed_token(token: str) -> dict | None:
    """Verify cryptographic signature, structure, and expiration of JWT token."""
    if not token or not isinstance(token, str):
        return None
    try:
        parts = token.strip().split('.')
        if len(parts) != 3:
            return None
        h_b64, p_b64, s_b64 = parts
        secret = app.config['SECRET_KEY'].encode('utf-8')
        msg = f"{h_b64}.{p_b64}".encode('utf-8')
        expected_sig = hmac.new(secret, msg, hashlib.sha256).digest()

        sig_pad = '=' * (-len(s_b64) % 4)
        actual_sig = base64.urlsafe_b64decode(s_b64 + sig_pad)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        p_pad = '=' * (-len(p_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(p_b64 + p_pad).decode('utf-8'))

        # Check expiration timestamp
        exp = payload.get('exp')
        if exp and int(exp) < time.time():
            return None

        return payload
    except Exception:
        return None

def extract_token_from_request(req) -> str | None:
    """Extract Bearer token or custom admin token header."""
    auth_hdr = req.headers.get('Authorization', '').strip()
    if auth_hdr.startswith('Bearer '):
        return auth_hdr[7:].strip()
    custom_hdr = req.headers.get('X-Admin-Token', '').strip()
    if custom_hdr:
        return custom_hdr
    return None

# --- Strict Allowed Origins Whitelist ---
def load_allowed_origins() -> set:
    configured = os.environ.get('ALLOWED_ORIGINS', '')
    origins = set()
    if configured:
        for item in configured.split(','):
            norm = item.strip().rstrip('/').lower()
            if norm:
                origins.add(norm)
    # Production Domains
    prod_domain = os.environ.get('PRODUCTION_DOMAIN', 'https://sompheareak.com').strip().rstrip('/').lower()
    if prod_domain:
        origins.add(prod_domain)
    origins.add('https://sompheareak.com')
    origins.add('https://www.sompheareak.com')
    origins.add('https://admin.sompheareak.com')
    origins.add('https://mingstar556.github.io')

    # Authorized Development Origins
    origins.add('http://127.0.0.1:5000')
    origins.add('http://localhost:5000')
    origins.add('http://127.0.0.1:5500')
    origins.add('http://localhost:5500')
    return origins

ALLOWED_ORIGINS = load_allowed_origins()

def is_origin_allowed(origin_hdr: str | None) -> bool:
    """Validate whether an Origin header matches authorized domains."""
    if not origin_hdr:
        return True # Non-browser or same-origin request
    norm = origin_hdr.strip().rstrip('/').lower()
    return norm in ALLOWED_ORIGINS

# --- Admin Authentication & Rate Limiting Storage ---
FAILED_PIN_ATTEMPTS = {}
MAX_PIN_ATTEMPTS = int(os.environ.get('ADMIN_RATE_LIMIT_MAX_ATTEMPTS', 3))
PIN_LOCK_WINDOW = int(os.environ.get('ADMIN_RATE_LIMIT_WINDOW_SECONDS', 60))

def check_pin_rate_limit(ip):
    now_ts = time.time()
    record = FAILED_PIN_ATTEMPTS.get(ip)
    if not record:
        return True, 0
    if record.get('locked_until', 0) > now_ts:
        return False, int(record['locked_until'] - now_ts)
    if now_ts - record.get('last_attempt', 0) > PIN_LOCK_WINDOW:
        FAILED_PIN_ATTEMPTS.pop(ip, None)
        return True, 0
    return True, 0

def record_failed_pin(ip):
    now_ts = time.time()
    record = FAILED_PIN_ATTEMPTS.setdefault(ip, {'count': 0, 'last_attempt': now_ts, 'locked_until': 0})
    record['count'] += 1
    record['last_attempt'] = now_ts
    if record['count'] >= MAX_PIN_ATTEMPTS:
        record['locked_until'] = now_ts + PIN_LOCK_WINDOW

def record_success_pin(ip):
    FAILED_PIN_ATTEMPTS.pop(ip, None)

def is_admin_authorized(req) -> bool:
    """Validate permission server-side based strictly on cryptographically signed token."""
    token = extract_token_from_request(req)
    if not token:
        return False
    claims = verify_signed_token(token)
    return bool(claims and claims.get('role') == 'admin')

def admin_required(f):
    """View decorator ensuring administrative rights (validated via signed JWT token)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not getattr(g, 'is_admin', False):
            return jsonify({
                'ok': False,
                'error': 'Unauthorized: Valid signed admin token required',
                'code': 'ADMIN_TOKEN_REQUIRED',
                'client_type': getattr(g, 'client_type', 'unknown')
            }), 401
        return f(*args, **kwargs)
    return decorated


# ================================================================
# MIDDLEWARE PATTERN PIPELINE
# 1. Enforces strict origin restriction
# 2. Validates signed tokens server-side (NEVER trusts X-Client-Role)
# 3. Enforces role-based guards on administrative routes
# ================================================================

ADMIN_MUTATION_PATHS = {
    ('/api/settings', 'POST'),
    ('/api/categories', 'POST'),
    ('/api/products', 'POST'),
    ('/api/products/seed', 'POST'),
    ('/api/products/clear', 'POST'),
    ('/api/charms', 'POST'),
    ('/api/charms/seed', 'POST'),
    ('/api/charms/clear', 'POST'),
}

def is_administrative_route(path: str, method: str) -> bool:
    """Determine if a route is inherently an administrative action."""
    if path.startswith('/api/admin/'):
        return True
    if (path, method) in ADMIN_MUTATION_PATHS:
        return True
    # DELETE operations on resources
    if method == 'DELETE' and (path.startswith('/api/categories/') or path.startswith('/api/products/') or path.startswith('/api/charms/')):
        return True
    # Stock adjustment
    if method == 'POST' and ('/stock' in path):
        return True
    # Order approval, rejection, cancellation, status updates
    if method == 'POST' and path.startswith('/api/orders/') and any(action in path for action in ('/approve', '/reject', '/cancel', '/status')):
        return True
    # Points adjustment by admin
    if method == 'POST' and path.startswith('/api/users/') and path.endswith('/points'):
        return True
    return False

@app.before_request
def request_pipeline_middleware():
    """
    Core Security & Classification Middleware:
    1. Restricts Origin to allowed production/development domains
    2. Handles CORS Preflight (OPTIONS)
    3. Validates permissions via cryptographic signed token (NEVER trusts X-Client-Role)
    4. Guards administrative routes
    """
    g.start_time = time.time()
    g.request_id = str(uuid.uuid4())[:8]

    origin = request.headers.get('Origin')

    # --- 1. Origin Restriction Guard ---
    if origin and not is_origin_allowed(origin):
        return jsonify({
            'ok': False,
            'error': f'Forbidden: Origin {origin} is untrusted and rejected by CORS policy',
            'code': 'UNTRUSTED_ORIGIN'
        }), 403

    # --- 2. CORS Preflight Handling ---
    if request.method == 'OPTIONS':
        response = make_response('', 204)
        if origin and is_origin_allowed(origin):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token, X-Request-ID'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response

    path = request.path
    method = request.method

    # Static routes
    if not path.startswith('/api/'):
        g.client_type = 'static'
        g.is_admin = False
        return

    # --- 3. Server-Side Token Authentication (NEVER trust X-Client-Role) ---
    token = extract_token_from_request(request)
    claims = verify_signed_token(token) if token else None

    if claims and claims.get('role') == 'admin':
        g.client_type = 'admin'
        g.is_admin = True
        g.admin_claims = claims
    else:
        g.client_type = 'customer'
        g.is_admin = False
        g.admin_claims = None

    # --- 4. Role-Based Access Guard for Protected Administrative Routes ---
    public_auth_paths = {'/api/auth/exchange', '/api/admin/exchange', '/api/admin/verify-pin'}
    is_admin_path = is_administrative_route(path, method)

    if is_admin_path and path not in public_auth_paths:
        if not g.is_admin:
            return jsonify({
                'ok': False,
                'error': 'Unauthorized: Valid signed admin token required for this protected operation',
                'code': 'ADMIN_TOKEN_REQUIRED',
                'client_type': g.client_type,
                'request_id': g.request_id
            }), 401

@app.after_request
def response_pipeline_middleware(response):
    """
    Post-Request Telemetry, CORS & Security Headers Middleware:
    Stamps diagnostic headers and strictly enforces authorized CORS origin.
    """
    origin = request.headers.get('Origin')
    if origin and is_origin_allowed(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token, X-Request-ID'
        response.headers['Access-Control-Expose-Headers'] = 'X-Client-Type, X-Request-ID, X-Response-Time-Ms'
        response.headers['Vary'] = 'Origin'

    # Security Headers
    if os.environ.get('ENABLE_SECURITY_HEADERS', 'True').lower() in ('true', '1'):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

    client_type = getattr(g, 'client_type', 'static')
    req_id = getattr(g, 'request_id', 'unknown')
    duration_ms = int((time.time() - getattr(g, 'start_time', time.time())) * 1000)

    response.headers['X-Client-Type'] = client_type
    response.headers['X-Request-ID'] = req_id
    response.headers['X-Response-Time-Ms'] = str(duration_ms)

    # Structured Audit Log in Terminal (Skip high-frequency sync polls to keep terminal I/O zero-latency)
    if request.path.startswith('/api/'):
        if request.path == '/api/sync/status' and response.status_code == 200:
            return response
        tag = '[ADMIN REQ]' if client_type == 'admin' else '[CUSTOMER REQ]'
        status = response.status_code
        print(f"{tag} {request.method} {request.path} -> {status} ({duration_ms}ms) [IP: {request.remote_addr}, ID: {req_id}]")

    return response


# ================================================================
# Static Page Routes (Customer Storefront Only)
# ================================================================

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/custom-bracelet')
@app.route('/custom-bracelet.html')
def custom_bracelet_page():
    return redirect('/#custom-bracelet')

# Decoupled Admin Route: Admin portal is moved to sompheareakAdmin repository
@app.route('/admin')
@app.route('/admin.html')
def admin_page_redirect():
    return jsonify({
        'ok': False,
        'message': 'Admin Dashboard has been decoupled into its dedicated portal repository (sompheareakAdmin).',
        'admin_portal': 'Please run the admin portal from the sompheareakAdmin repository (e.g. http://127.0.0.1:5500).',
        'api_status': 'Server and Database are active and synchronized.'
    }), 403


# ================================================================
# API: High-Performance Live Sync & Version Status (<1ms response)
# ================================================================

@app.route('/api/sync/status', methods=['GET'])
def get_sync_status():
    status = database.get_sync_status()
    return jsonify({
        'ok': True,
        **status
    })


# ================================================================
# API: Admin Authentication & Token Exchange Endpoint
# Exchanges verified PIN/password for a cryptographically signed Bearer token.
# ================================================================

@app.route('/api/auth/exchange', methods=['POST'])
@app.route('/api/admin/exchange', methods=['POST'])
@app.route('/api/admin/verify-pin', methods=['POST'])
def exchange_token():
    ip = request.remote_addr or 'unknown'
    allowed, remaining = check_pin_rate_limit(ip)
    if not allowed:
        return jsonify({
            'ok': False,
            'error': f'Too many failed attempts. Security lock active for {remaining}s.',
            'locked': True,
            'retry_after': remaining
        }), 429

    data = request.json or {}
    pin = str(data.get('pin') or data.get('password') or '').strip()

    if database.verify_admin_pin(pin):
        record_success_pin(ip)
        now_ts = int(time.time())
        exp_ts = now_ts + TOKEN_LIFETIME_SECONDS
        payload = {
            'sub': 'admin',
            'role': 'admin',
            'jti': uuid.uuid4().hex,
            'iat': now_ts,
            'exp': exp_ts
        }
        token = create_signed_token(payload)
        return jsonify({
            'ok': True,
            'token': token,
            'token_type': 'Bearer',
            'role': 'admin',
            'expires_in': TOKEN_LIFETIME_SECONDS,
            'expires_at': exp_ts
        })
    else:
        record_failed_pin(ip)
        current_attempts = FAILED_PIN_ATTEMPTS.get(ip, {}).get('count', 0)
        attempts_left = max(0, MAX_PIN_ATTEMPTS - current_attempts)
        return jsonify({
            'ok': False,
            'error': 'Invalid PIN or credentials' if attempts_left > 0 else f'Too many failed attempts. Locked for {PIN_LOCK_WINDOW}s.',
            'attempts_left': attempts_left
        }), 401


# ================================================================
# API: Store Settings (Read: Public Customer, Write: Admin)
# ================================================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(database.get_settings())

@app.route('/api/settings', methods=['POST'])
@admin_required
def save_settings():
    patch = request.json or {}
    updated = database.save_settings(patch)
    return jsonify(updated)


# ================================================================
# API: Categories (Read: Public Customer, Write: Admin)
# ================================================================

@app.route('/api/categories', methods=['GET'])
def list_categories():
    return jsonify(database.get_categories())

@app.route('/api/categories', methods=['POST'])
@admin_required
def save_category():
    data = request.json or {}
    if not data.get('name') and not data.get('kh'):
        return jsonify({'error': 'Category name is required'}), 400
    cat = database.upsert_category(data)
    return jsonify(cat)

@app.route('/api/categories/<cat_id>', methods=['DELETE'])
@admin_required
def delete_category(cat_id):
    database.delete_category(cat_id)
    return jsonify({'ok': True})


# ================================================================
# API: Products (Read: Public Customer, Write: Admin)
# ================================================================

@app.route('/api/products', methods=['GET'])
def list_products():
    include_inactive = request.args.get('all', '0') in ('1', 'true')
    products = database.get_products(include_inactive)
    return jsonify(products)

@app.route('/api/products/<prod_id>', methods=['GET'])
def get_product(prod_id):
    p = database.get_product(prod_id)
    if not p:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(p)

@app.route('/api/products', methods=['POST'])
@admin_required
def save_product():
    data = request.json or {}
    if not data.get('name') or data.get('price') is None:
        return jsonify({'error': 'Name and price are required'}), 400
    p = database.upsert_product(data)
    return jsonify(p)

@app.route('/api/products/<prod_id>', methods=['DELETE'])
@admin_required
def delete_product(prod_id):
    database.delete_product(prod_id)
    return jsonify({'ok': True})

@app.route('/api/products/<prod_id>/stock', methods=['POST'])
@admin_required
def adjust_stock(prod_id):
    data = request.json or {}
    delta = int(data.get('delta', 0))
    p = database.adjust_stock(prod_id, delta)
    return jsonify(p)

@app.route('/api/products/seed', methods=['POST'])
@admin_required
def seed_catalog():
    products = database.seed_sample_products()
    return jsonify({'ok': True, 'count': len(products)})

@app.route('/api/products/clear', methods=['POST'])
@admin_required
def clear_catalog():
    database.clear_products()
    return jsonify({'ok': True})


# ================================================================
# API: Charms & Custom Italian Charm Studio Catalog
# ================================================================

@app.route('/api/products/custom_bracelet', methods=['GET'])
def get_custom_bracelet_catalog():
    charms = database.get_charms(include_inactive=False)
    cat_summary = database.get_charm_categories()
    categories_list = [{'name': c['category'], 'image': c['thumb']} for c in cat_summary]

    products_list = []
    for c in charms:
        products_list.append({
            'id': c['id'],
            'title': c['name'],
            'category': c['category'],
            'price': c['price'],
            'price_khr': c.get('price_khr') or int(round(c['price'] * 4000)),
            'stock': c['stock'],
            'image': c['image'],
            'thumbnail': c['image'],
            'model_no': c.get('model_no', ''),
            'color': c.get('color', 'Silver'),
            'variants': []
        })
    return jsonify({
        'categories': categories_list,
        'products': products_list
    })

@app.route('/api/charms', methods=['GET'])
def list_charms():
    include_inactive = request.args.get('all', '0') in ('1', 'true')
    category = request.args.get('cat')
    charms = database.get_charms(include_inactive, category)
    return jsonify(charms)

@app.route('/api/charms/<charm_id>', methods=['GET'])
def get_single_charm(charm_id):
    charm = database.get_charm(charm_id)
    if not charm:
        return jsonify({'error': 'Charm not found'}), 404
    return jsonify(charm)

@app.route('/api/charms', methods=['POST'])
@admin_required
def save_charm():
    data = request.json or {}
    if not data.get('name') or data.get('price') is None:
        return jsonify({'error': 'Charm name and price are required'}), 400
    charm = database.upsert_charm(data)
    return jsonify(charm)

@app.route('/api/charms/<charm_id>', methods=['DELETE'])
@admin_required
def delete_charm_item(charm_id):
    database.delete_charm(charm_id)
    return jsonify({'ok': True})

@app.route('/api/charms/<charm_id>/stock', methods=['POST'])
@admin_required
def adjust_charm_stock_item(charm_id):
    data = request.json or {}
    delta = data.get('delta')
    stock = data.get('stock')
    charm = database.adjust_charm_stock(charm_id, delta=delta, new_stock=stock)
    return jsonify(charm)

@app.route('/api/charms/seed', methods=['POST'])
@admin_required
def seed_charms_catalog():
    count = database.seed_default_charms()
    return jsonify({'ok': True, 'count': count})

@app.route('/api/charms/clear', methods=['POST'])
@admin_required
def clear_charms_catalog():
    database.clear_charms()
    return jsonify({'ok': True})

@app.route('/api/charms/categories', methods=['GET'])
def list_charm_categories():
    return jsonify(database.get_charm_categories())


# ================================================================
# API: Customer Promo Codes & Checkout
# ================================================================

@app.route('/api/check-promo', methods=['GET'])
def check_promo():
    code = (request.args.get('code') or '').strip().upper()
    if code in ('SOMPHEA', 'SALE10', 'STUDIO10'):
        return jsonify({'ok': True, 'code': code, 'discountPercent': 10, 'discountAmount': 0})
    if code in ('VIP20', 'REAK20'):
        return jsonify({'ok': True, 'code': code, 'discountPercent': 20, 'discountAmount': 0})
    if code in ('SAVE2000', 'BOXFREE'):
        return jsonify({'ok': True, 'code': code, 'discountPercent': 0, 'discountAmount': 2000})
    return jsonify({'ok': False, 'error': 'Invalid or expired promo code'}), 404

@app.route('/api/checkout', methods=['POST'])
def universal_checkout():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    address = (data.get('address') or '').strip()
    items = data.get('items', [])
    total = float(data.get('total', 0))
    promo = data.get('redeemCode', '')
    tg_user = data.get('telegram_user') or {}

    username = tg_user.get('username') or name or 'customer'
    user = database.upsert_user(username, phone)

    order_data = {
        'user_id': user['id'],
        'items': items,
        'subtotal': total,
        'discount': 0,
        'delivery': 0,
        'total': total,
        'earned': 5,
        'voucher': promo,
        'contact': {'name': name, 'phone': phone, 'address': address, 'telegram': username}
    }
    order = database.place_order(order_data)
    return jsonify({'ok': True, 'order_id': order['id'], 'order': order})


# ================================================================
# API: Users & Loyalty Points
# ================================================================

@app.route('/api/users/login', methods=['POST'])
def user_login():
    data = request.json or {}
    username = data.get('username', '').strip()
    phone = data.get('phone', '').strip()
    if not username:
        return jsonify({'error': 'Username required'}), 400
    u = database.upsert_user(username, phone)
    return jsonify(u)

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    u = database.get_user(user_id)
    if not u:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(u)

@app.route('/api/users', methods=['GET'])
def list_users():
    return jsonify(database.get_users())

@app.route('/api/users/<user_id>/points', methods=['POST'])
def adjust_points(user_id):
    data = request.json or {}
    delta = int(data.get('delta', 0))
    reason = data.get('reason', 'Adjustment')
    u = database.add_user_points(user_id, delta, reason)
    return jsonify(u)

@app.route('/api/users/<user_id>', methods=['POST'])
def update_user_profile(user_id):
    data = request.json or {}
    u = database.update_user(user_id, data)
    return jsonify(u)

@app.route('/api/users/<user_id>/redeem-voucher', methods=['POST'])
def redeem_voucher(user_id):
    voucher, err = database.redeem_voucher(user_id)
    if err:
        return jsonify({'error': err}), 400
    u = database.get_user(user_id)
    return jsonify({'voucher': voucher, 'user': u})


# ================================================================
# API: Orders Desk (Customer Placement & Admin Processing)
# ================================================================

@app.route('/api/orders', methods=['GET'])
def list_orders():
    user_id = request.args.get('user_id')
    orders = database.get_orders(user_id)
    return jsonify(orders)

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    o = database.get_order(order_id)
    if not o:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(o)

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json or {}
    if not data.get('user_id') or not data.get('items'):
        return jsonify({'error': 'user_id and items are required'}), 400
    order = database.place_order(data)
    return jsonify(order)

@app.route('/api/orders/<order_id>/approve', methods=['POST'])
@admin_required
def approve_order(order_id):
    order, err = database.approve_order(order_id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(order)

@app.route('/api/orders/<order_id>/reject', methods=['POST'])
@admin_required
def reject_order(order_id):
    data = request.json or {}
    note = data.get('note', 'Item out of stock')
    order, err = database.reject_order(order_id, note)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(order)

@app.route('/api/orders/<order_id>/cancel', methods=['POST'])
@admin_required
def cancel_order(order_id):
    data = request.json or {}
    reason = data.get('reason', 'Cancelled by admin')
    order, err = database.cancel_order(order_id, reason)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(order)

@app.route('/api/orders/<order_id>/status', methods=['POST'])
@admin_required
def update_status(order_id):
    data = request.json or {}
    status = data.get('status', 'Shipped')
    order = database.set_order_status(order_id, status)
    return jsonify(order)


# ================================================================
# API: Notifications
# ================================================================

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id')
    notifs = database.get_notifications(user_id)
    return jsonify(notifs)

@app.route('/api/notifications/read', methods=['POST'])
def read_notifications():
    data = request.json or {}
    order_id = data.get('order_id')
    database.mark_notifications_read(order_id)
    return jsonify({'ok': True})


# ================================================================
# Fallback Static File Handler
# ================================================================

@app.route('/<path:filename>')
def serve_static(filename):
    if filename.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    target = os.path.join(BASE_DIR, filename)
    if os.path.isfile(target):
        return send_from_directory(BASE_DIR, filename)
    return index()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() in ('true', '1')
    print("=" * 65)
    print(f"✨ Somphea Reak Core API running on http://127.0.0.1:{port}")
    print(f"🛡️  Middleware Active: Customer & Admin Request Separation & Auth Guard")
    print(f"📦 Shared Database: sompheareak.db (SQLite)")
    print("=" * 65)
    app.run(host='0.0.0.0', port=port, debug=debug)
