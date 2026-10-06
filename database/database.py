import sqlite3
import json
import os
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'sompheareak.db')

DEFAULT_SETTINGS = {
    'site_title': 'សម្ភារៈ - Somphea Reak',
    'subtitle': 'Premium Studio',
    'tagline': 'Cambodia Kingdom of Wonder',
    'admin_pin': '1234',
    'delivery_fee': 1.5,
    'voucher_cost': 25,
    'voucher_pct': 10,
    'custom_base_price': 8.0,
    'charm_price': 1.5,
    'custom_pt': 5,
    'site_logo': 'logo.jpg',
    'charms': json.dumps(['❤️','⭐','🌸','🦋','🐱','🍀','🌙','☀️','💎','🎀','🐶','🌈','⚽','🎵','🇰🇭','🔤','⚡','👑']),
    'announcement': '✨ Welcome to Somphea Reak Studio • Verified Telegram Orders • Earn Points on Every Item!'
}

DEFAULT_CATEGORIES = [
    {
        'id': 'custom-bracelet',
        'name': 'Custom Italy Charm',
        'kh': 'CUSTOMIZE ITALY CHARM',
        'en': 'Build your own charm bracelet',
        'icon': '🔗',
        'grad': 'linear-gradient(135deg,#d4af37,#8b5cf6)',
        'sort_order': 0
    },
    {
        'id': 'minifigure',
        'name': 'Minifigure',
        'kh': 'MINIFIGURE',
        'en': 'Collectible mini figures',
        'icon': '🧸',
        'grad': 'linear-gradient(135deg,#06b6d4,#3b82f6)',
        'sort_order': 1
    },
    {
        'id': 'toy-universe',
        'name': 'Toy Universe',
        'kh': 'TOY',
        'en': 'Toy universe',
        'icon': '🪀',
        'grad': 'linear-gradient(135deg,#f97316,#ec4899)',
        'sort_order': 2
    },
    {
        'id': 'bracelet',
        'name': 'Ready-Made Bracelet',
        'kh': 'Bracelet for Female&Male',
        'en': 'Ready-made bracelets',
        'icon': '📿',
        'grad': 'linear-gradient(135deg,#22c55e,#14b8a6)',
        'sort_order': 3
    }
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Settings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            val TEXT
        )
    ''')

    # Insert default settings if not exists
    for k, v in DEFAULT_SETTINGS.items():
        c.execute('INSERT OR IGNORE INTO settings (key, val) VALUES (?, ?)', (k, str(v)))

    # Categories table
    c.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            kh TEXT NOT NULL,
            en TEXT,
            icon TEXT DEFAULT '🛍️',
            grad TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')

    # Seed default categories if none exist
    c.execute('SELECT COUNT(*) as cnt FROM categories')
    if c.fetchone()['cnt'] == 0:
        for cat in DEFAULT_CATEGORIES:
            c.execute('''
                INSERT INTO categories (id, name, kh, en, icon, grad, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (cat['id'], cat['name'], cat['kh'], cat['en'], cat['icon'], cat['grad'], cat['sort_order'], datetime.now().isoformat()))

    # Products table
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cat TEXT NOT NULL,
            price REAL NOT NULL,
            discount REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            pt INTEGER DEFAULT 1,
            image TEXT,
            active INTEGER DEFAULT 1,
            created_at TEXT
        )
    ''')

    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            phone TEXT,
            name TEXT,
            points INTEGER DEFAULT 0,
            vouchers TEXT DEFAULT '[]',
            point_log TEXT DEFAULT '[]',
            created_at TEXT
        )
    ''')

    # Orders table
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL,
            discount REAL DEFAULT 0,
            delivery REAL DEFAULT 0,
            total REAL NOT NULL,
            earned INTEGER DEFAULT 0,
            voucher TEXT,
            status TEXT DEFAULT 'Pending',
            contact TEXT NOT NULL,
            note TEXT,
            created_at TEXT,
            decided_at TEXT
        )
    ''')

    # Notifications table
    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            type TEXT,
            order_id TEXT,
            user_id TEXT,
            text TEXT,
            read INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')

    conn.commit()
    conn.close()

def now():
    return datetime.now().isoformat()

# --- Settings ---
def get_settings():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT key, val FROM settings')
    rows = c.fetchall()
    conn.close()

    res = dict(DEFAULT_SETTINGS)
    for r in rows:
        k, v = r['key'], r['val']
        if k in ('delivery_fee', 'custom_base_price', 'charm_price'):
            try: res[k] = float(v)
            except: res[k] = 0.0
        elif k in ('voucher_cost', 'voucher_pct', 'custom_pt'):
            try: res[k] = int(float(v))
            except: res[k] = 0
        elif k == 'charms':
            try: res[k] = json.loads(v)
            except: res[k] = DEFAULT_SETTINGS['charms']
        else:
            res[k] = v
    return res

def save_settings(patch):
    conn = get_db()
    c = conn.cursor()
    for k, v in patch.items():
        if isinstance(v, (list, dict)):
            v = json.dumps(v)
        c.execute('INSERT OR REPLACE INTO settings (key, val) VALUES (?, ?)', (k, str(v)))
    conn.commit()
    conn.close()
    return get_settings()

# --- Categories ---
def get_categories():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

def get_category(cat_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM categories WHERE id = ?', (cat_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def upsert_category(data):
    conn = get_db()
    c = conn.cursor()
    cat_id = data.get('id')
    name = data.get('name', '').strip()
    kh = data.get('kh', name).strip()
    en = data.get('en', '').strip()
    icon = data.get('icon', '🛍️').strip()
    grad = data.get('grad', 'linear-gradient(135deg,#d4af37,#8b5cf6)').strip()
    sort_order = int(data.get('sort_order', 0))

    if cat_id:
        c.execute('SELECT id FROM categories WHERE id = ?', (cat_id,))
        exists = c.fetchone()
        if exists:
            c.execute('''
                UPDATE categories
                SET name = ?, kh = ?, en = ?, icon = ?, grad = ?, sort_order = ?
                WHERE id = ?
            ''', (name, kh, en, icon, grad, sort_order, cat_id))
        else:
            c.execute('''
                INSERT INTO categories (id, name, kh, en, icon, grad, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (cat_id, name, kh, en, icon, grad, sort_order, now()))
    else:
        # Generate slug or ID
        slug = ''.join(c if c.isalnum() else '-' for c in name.lower()).strip('-')
        cat_id = slug if slug else 'cat-' + uuid.uuid4().hex[:6]
        c.execute('''
            INSERT INTO categories (id, name, kh, en, icon, grad, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (cat_id, name, kh, en, icon, grad, sort_order, now()))

    conn.commit()
    conn.close()
    return get_category(cat_id)

def delete_category(cat_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM categories WHERE id = ?', (cat_id,))
    conn.commit()
    conn.close()
    return True

# --- Products ---
def get_products(include_inactive=False):
    conn = get_db()
    c = conn.cursor()
    if include_inactive:
        c.execute('SELECT * FROM products ORDER BY created_at DESC')
    else:
        c.execute('SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for p in rows:
        p['active'] = bool(p['active'])
        p['final_price'] = round(p['price'] * (1 - (p['discount'] or 0) / 100.0), 2)
    return rows

def get_product(prod_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM products WHERE id = ?', (prod_id,))
    row = c.fetchone()
    conn.close()
    if not row: return None
    p = dict(row)
    p['active'] = bool(p['active'])
    p['final_price'] = round(p['price'] * (1 - (p['discount'] or 0) / 100.0), 2)
    return p

def upsert_product(data):
    conn = get_db()
    c = conn.cursor()
    prod_id = data.get('id')
    name = data.get('name', '').strip()
    cat = data.get('cat', 'minifigure')
    price = float(data.get('price', 0))
    discount = max(0, min(100, float(data.get('discount', 0))))
    stock = max(0, int(data.get('stock', 0)))
    pt = max(0, int(data.get('pt', 1)))
    image = data.get('image')
    active = 1 if data.get('active', True) else 0

    if prod_id:
        c.execute('SELECT id FROM products WHERE id = ?', (prod_id,))
        exists = c.fetchone()
        if exists:
            c.execute('''
                UPDATE products
                SET name = ?, cat = ?, price = ?, discount = ?, stock = ?, pt = ?, image = coalesce(?, image), active = ?
                WHERE id = ?
            ''', (name, cat, price, discount, stock, pt, image, active, prod_id))
        else:
            c.execute('''
                INSERT INTO products (id, name, cat, price, discount, stock, pt, image, active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (prod_id, name, cat, price, discount, stock, pt, image, active, now()))
    else:
        prod_id = 'P' + uuid.uuid4().hex[:8]
        c.execute('''
            INSERT INTO products (id, name, cat, price, discount, stock, pt, image, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (prod_id, name, cat, price, discount, stock, pt, image, active, now()))

    conn.commit()
    conn.close()
    return get_product(prod_id)

def adjust_stock(prod_id, delta):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT stock FROM products WHERE id = ?', (prod_id,))
    row = c.fetchone()
    if row:
        new_stock = max(0, row['stock'] + delta)
        c.execute('UPDATE products SET stock = ? WHERE id = ?', (new_stock, prod_id))
        conn.commit()
    conn.close()
    return get_product(prod_id)

def delete_product(prod_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM products WHERE id = ?', (prod_id,))
    conn.commit()
    conn.close()
    return True

def clear_products():
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM products')
    conn.commit()
    conn.close()
    return True

def seed_sample_products():
    samples = [
        {
            'name': 'Space Explorer Astronaut Mini',
            'cat': 'minifigure',
            'price': 6.5,
            'discount': 10,
            'stock': 14,
            'pt': 1,
            'image': 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Stealth Ninja Shadow Warrior',
            'cat': 'minifigure',
            'price': 7.0,
            'discount': 0,
            'stock': 9,
            'pt': 1,
            'image': 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Cyber Mecha Sentinel (Rare)',
            'cat': 'minifigure',
            'price': 9.5,
            'discount': 15,
            'stock': 6,
            'pt': 2,
            'image': 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Arcane Wizard Figurine (Rare)',
            'cat': 'minifigure',
            'price': 8.5,
            'discount': 0,
            'stock': 11,
            'pt': 2,
            'image': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Vintage Die-Cast Speed Racer',
            'cat': 'toy-universe',
            'price': 12.0,
            'discount': 10,
            'stock': 8,
            'pt': 1,
            'image': 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Luxury Plush Velvet Bear',
            'cat': 'toy-universe',
            'price': 15.0,
            'discount': 0,
            'stock': 16,
            'pt': 2,
            'image': 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Galaxy Orbital Space Shuttle Set',
            'cat': 'toy-universe',
            'price': 19.5,
            'discount': 20,
            'stock': 5,
            'pt': 2,
            'image': 'https://images.unsplash.com/photo-1517976487502-53644f128e08?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': '18K Gold Plated Cuban Chain Bracelet',
            'cat': 'bracelet',
            'price': 26.0,
            'discount': 10,
            'stock': 8,
            'pt': 3,
            'image': 'https://images.unsplash.com/photo-1611591475155-42647548d617?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Sterling Silver Classic Unisex Bracelet',
            'cat': 'bracelet',
            'price': 22.0,
            'discount': 0,
            'stock': 12,
            'pt': 3,
            'image': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Natural Matte Black Onyx Beads',
            'cat': 'bracelet',
            'price': 18.0,
            'discount': 5,
            'stock': 15,
            'pt': 3,
            'image': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
            'active': True
        },
        {
            'name': 'Rose Gold Magnetic Couple Bracelet Pair',
            'cat': 'bracelet',
            'price': 28.0,
            'discount': 15,
            'stock': 7,
            'pt': 3,
            'image': 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop&q=80',
            'active': True
        }
    ]
    clear_products()
    for s in samples:
        upsert_product(s)
    return get_products(True)

# --- Users ---
def get_users():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM users ORDER BY created_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for u in rows:
        u['vouchers'] = json.loads(u.get('vouchers') or '[]')
        u['point_log'] = json.loads(u.get('point_log') or '[]')
    return rows

def get_user(user_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    conn.close()
    if not row: return None
    u = dict(row)
    u['vouchers'] = json.loads(u.get('vouchers') or '[]')
    u['point_log'] = json.loads(u.get('point_log') or '[]')
    return u

def upsert_user(username, phone):
    conn = get_db()
    c = conn.cursor()
    uname = username.strip().lstrip('@')
    c.execute('SELECT * FROM users WHERE lower(username) = lower(?)', (uname,))
    row = c.fetchone()

    if row:
        u_id = row['id']
        c.execute('UPDATE users SET phone = ? WHERE id = ?', (phone, u_id))
    else:
        u_id = 'U' + uuid.uuid4().hex[:8]
        c.execute('''
            INSERT INTO users (id, username, phone, name, points, vouchers, point_log, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (u_id, uname, phone, '', 0, '[]', '[]', now()))

    conn.commit()
    conn.close()
    return get_user(u_id)

def update_user(user_id, data):
    conn = get_db()
    c = conn.cursor()
    fields = []
    vals = []
    if 'name' in data:
        fields.append('name = ?'); vals.append(data['name'])
    if 'phone' in data:
        fields.append('phone = ?'); vals.append(data['phone'])
    if 'points' in data:
        fields.append('points = ?'); vals.append(int(data['points']))
    if 'vouchers' in data:
        fields.append('vouchers = ?'); vals.append(json.dumps(data['vouchers']))
    if 'point_log' in data:
        fields.append('point_log = ?'); vals.append(json.dumps(data['point_log']))

    if fields:
        vals.append(user_id)
        c.execute(f'UPDATE users SET {", ".join(fields)} WHERE id = ?', vals)
        conn.commit()
    conn.close()
    return get_user(user_id)

def add_user_points(user_id, delta, reason):
    u = get_user(user_id)
    if not u: return None
    new_points = max(0, u['points'] + delta)
    log = u.get('point_log', [])
    log.insert(0, {'t': reason, 'd': delta, 'at': now()})
    return update_user(user_id, {'points': new_points, 'point_log': log})

def redeem_voucher(user_id):
    u = get_user(user_id)
    if not u: return None, 'User not found'
    st = get_settings()
    vc = st.get('voucher_cost', 25)
    vp = st.get('voucher_pct', 10)
    if u['points'] < vc:
        return None, f'Insufficient points (need {vc} pt)'

    code = f'SR{vp}-' + uuid.uuid4().hex[:5].upper()
    vouchers = u.get('vouchers', [])
    v_obj = {'code': code, 'pct': vp, 'used': False, 'created_at': now()}
    vouchers.insert(0, v_obj)

    new_points = u['points'] - vc
    log = u.get('point_log', [])
    log.insert(0, {'t': f'Redeemed voucher {code}', 'd': -vc, 'at': now()})

    update_user(user_id, {'points': new_points, 'vouchers': vouchers, 'point_log': log})
    return v_obj, None

# --- Orders ---
def get_orders(user_id=None):
    conn = get_db()
    c = conn.cursor()
    if user_id:
        c.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    else:
        c.execute('SELECT * FROM orders ORDER BY created_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for o in rows:
        o['items'] = json.loads(o.get('items') or '[]')
        o['contact'] = json.loads(o.get('contact') or '{}')
    return rows

def get_order(order_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    row = c.fetchone()
    conn.close()
    if not row: return None
    o = dict(row)
    o['items'] = json.loads(o.get('items') or '[]')
    o['contact'] = json.loads(o.get('contact') or '{}')
    return o

def place_order(order_data):
    conn = get_db()
    c = conn.cursor()
    order_id = 'SR' + datetime.now().strftime('%y%m%d') + uuid.uuid4().hex[:4].upper()
    user_id = order_data['user_id']
    items = json.dumps(order_data.get('items', []))
    subtotal = float(order_data.get('subtotal', 0))
    discount = float(order_data.get('discount', 0))
    delivery = float(order_data.get('delivery', 0))
    total = float(order_data.get('total', subtotal - discount + delivery))
    earned = int(order_data.get('earned', 0))
    voucher = order_data.get('voucher')
    status = 'Pending'
    contact = json.dumps(order_data.get('contact', {}))
    created_at = now()

    c.execute('''
        INSERT INTO orders (id, user_id, items, subtotal, discount, delivery, total, earned, voucher, status, contact, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (order_id, user_id, items, subtotal, discount, delivery, total, earned, voucher, status, contact, created_at))

    # Mark the voucher as used in user's profile in SQLite so it never disappears or reverts
    if voucher:
        c.execute('SELECT vouchers FROM users WHERE id = ?', (user_id,))
        urow = c.fetchone()
        if urow:
            v_list = json.loads(urow['vouchers'] or '[]')
            v_matched = False
            for v_item in v_list:
                if v_item.get('code') == voucher:
                    v_item['used'] = True
                    v_item['used_at'] = created_at
                    v_item['order_id'] = order_id
                    v_matched = True
                    break
            if not v_matched:
                v_list.append({
                    'code': voucher,
                    'pct': int(order_data.get('voucher_pct', 10)),
                    'used': True,
                    'used_at': created_at,
                    'order_id': order_id
                })
            c.execute('UPDATE users SET vouchers = ? WHERE id = ?', (json.dumps(v_list), user_id))

    # Create notification for admin
    u = get_user(user_id)
    uname = u['username'] if u else 'customer'
    notif_id = 'N' + uuid.uuid4().hex[:8]
    c.execute('''
        INSERT INTO notifications (id, type, order_id, user_id, text, read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ''', (notif_id, 'receipt', order_id, user_id, f'New receipt #{order_id} from @{uname} • ${total:.2f}', created_at))

    conn.commit()
    conn.close()
    return get_order(order_id)

def approve_order(order_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return None, 'Order not found'
    if row['status'] != 'Pending':
        conn.close()
        return None, f'Order is already {row["status"]}'

    items = json.loads(row['items'] or '[]')

    # 1. Stock check
    for it in items:
        pid = it.get('productId')
        if pid:
            c.execute('SELECT name, stock FROM products WHERE id = ?', (pid,))
            p = c.fetchone()
            if not p:
                conn.close()
                return None, f'Product "{it.get("name")}" is no longer in catalog'
            if p['stock'] < it.get('qty', 1):
                conn.close()
                return None, f'Insufficient stock for "{p["name"]}" ({p["stock"]} remaining)'

    # 2. Stock deduct
    for it in items:
        pid = it.get('productId')
        if pid:
            c.execute('UPDATE products SET stock = max(0, stock - ?) WHERE id = ?', (it.get('qty', 1), pid))

    decided_at = now()
    c.execute('UPDATE orders SET status = "Approved", decided_at = ? WHERE id = ?', (decided_at, order_id))

    # 3. Award points to user
    earned = row['earned']
    user_id = row['user_id']
    c.execute('SELECT points, point_log FROM users WHERE id = ?', (user_id,))
    u = c.fetchone()
    if u:
        new_pts = u['points'] + earned
        log = json.loads(u['point_log'] or '[]')
        log.insert(0, {'t': f'Order #{order_id} approved by admin', 'd': earned, 'at': decided_at})
        c.execute('UPDATE users SET points = ?, point_log = ? WHERE id = ?', (new_pts, json.dumps(log), user_id))

    # 4. Notify customer
    notif_id = 'N' + uuid.uuid4().hex[:8]
    c.execute('''
        INSERT INTO notifications (id, type, order_id, user_id, text, read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ''', (notif_id, 'order_approved', order_id, user_id, f'Order #{order_id} was approved! +{earned} pt added to your balance.', decided_at))

    conn.commit()
    conn.close()
    return get_order(order_id), None

def reject_order(order_id, note='Out of stock'):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    row = c.fetchone()
    if not row or row['status'] != 'Pending':
        conn.close()
        return None, 'Order not in pending status'

    decided_at = now()
    c.execute('UPDATE orders SET status = "Rejected", note = ?, decided_at = ? WHERE id = ?', (note, decided_at, order_id))

    # Refund voucher if applied
    voucher_code = row['voucher']
    user_id = row['user_id']
    if voucher_code:
        c.execute('SELECT vouchers FROM users WHERE id = ?', (user_id,))
        u = c.fetchone()
        if u:
            vouchers = json.loads(u['vouchers'] or '[]')
            for v in vouchers:
                if v.get('code') == voucher_code:
                    v['used'] = False
            c.execute('UPDATE users SET vouchers = ? WHERE id = ?', (json.dumps(vouchers), user_id))

    # Customer notification
    notif_id = 'N' + uuid.uuid4().hex[:8]
    c.execute('''
        INSERT INTO notifications (id, type, order_id, user_id, text, read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ''', (notif_id, 'order_rejected', order_id, user_id, f'Order #{order_id} was declined: {note}. Voucher refunded.', decided_at))

    conn.commit()
    conn.close()
    return get_order(order_id), None

def cancel_order(order_id, reason='Cancelled by admin'):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return None, 'Order not found'

    old_status = row['status']
    decided_at = now()

    # If already approved, restore stock & revert points
    if old_status in ('Approved', 'Shipped'):
        items = json.loads(row['items'] or '[]')
        for it in items:
            pid = it.get('productId')
            if pid:
                c.execute('UPDATE products SET stock = stock + ? WHERE id = ?', (it.get('qty', 1), pid))

        user_id = row['user_id']
        earned = row['earned']
        c.execute('SELECT points, point_log FROM users WHERE id = ?', (user_id,))
        u = c.fetchone()
        if u:
            new_pts = max(0, u['points'] - earned)
            log = json.loads(u['point_log'] or '[]')
            log.insert(0, {'t': f'Order #{order_id} cancelled (stock refunded)', 'd': -earned, 'at': decided_at})
            c.execute('UPDATE users SET points = ?, point_log = ? WHERE id = ?', (new_pts, json.dumps(log), user_id))

    voucher_code = row['voucher']
    user_id = row['user_id']
    if voucher_code:
        c.execute('SELECT vouchers FROM users WHERE id = ?', (user_id,))
        u = c.fetchone()
        if u:
            vouchers = json.loads(u['vouchers'] or '[]')
            for v in vouchers:
                if v.get('code') == voucher_code:
                    v['used'] = False
            c.execute('UPDATE users SET vouchers = ? WHERE id = ?', (json.dumps(vouchers), user_id))

    c.execute('UPDATE orders SET status = "Cancelled", note = ?, decided_at = ? WHERE id = ?', (reason, decided_at, order_id))
    conn.commit()
    conn.close()
    return get_order(order_id), None

def set_order_status(order_id, status):
    conn = get_db()
    c = conn.cursor()
    c.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    conn.commit()
    conn.close()
    return get_order(order_id)

# --- Notifications ---
def get_notifications(user_id=None):
    conn = get_db()
    c = conn.cursor()
    if user_id:
        c.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30', (user_id,))
    else:
        c.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 40')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for n in rows:
        n['read'] = bool(n['read'])
    return rows

def mark_notifications_read(order_id=None):
    conn = get_db()
    c = conn.cursor()
    if order_id:
        c.execute('UPDATE notifications SET read = 1 WHERE order_id = ?', (order_id,))
    else:
        c.execute('UPDATE notifications SET read = 1')
    conn.commit()
    conn.close()
    return True

def reset_database():
    conn = get_db()
    c = conn.cursor()
    # Drop existing tables cleanly
    c.execute('DROP TABLE IF EXISTS notifications')
    c.execute('DROP TABLE IF EXISTS orders')
    c.execute('DROP TABLE IF EXISTS users')
    c.execute('DROP TABLE IF EXISTS products')
    c.execute('DROP TABLE IF EXISTS categories')
    c.execute('DROP TABLE IF EXISTS settings')
    conn.commit()
    conn.close()

    # Recreate tables and default settings/categories
    init_db()

    # Seed 11 sample products
    seed_sample_products()

    # Seed VIP Tester user (@test_vip) with 50 points and 1 demo test voucher
    conn = get_db()
    c = conn.cursor()
    vip_user_id = 'Utest_vip'
    vip_vouchers = json.dumps([{
        'code': 'SR10-VIPDEMO',
        'pct': 10,
        'used': False,
        'created_at': now()
    }])
    vip_point_log = json.dumps([{
        't': 'Welcome Tester Gift (+50 pt)',
        'd': 50,
        'at': now()
    }])
    c.execute('''
        INSERT OR REPLACE INTO users (id, username, phone, name, points, vouchers, point_log, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (vip_user_id, 'test_vip', '+855 12 345 678', 'VIP Tester', 50, vip_vouchers, vip_point_log, now()))

    # Welcome notification
    c.execute('''
        INSERT OR REPLACE INTO notifications (id, type, order_id, user_id, text, read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ''', ('N-welcome-vip', 'welcome', None, vip_user_id, '✨ Welcome to Somphea Reak Studio! You have 50 bonus points & 1 voucher ready to use.', now()))

    conn.commit()
    conn.close()
    return True

# Initialize database on module import
init_db()

