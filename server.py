import os
import sys
from flask import Flask, request, jsonify, send_from_directory, redirect
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR)

# --- Static Page Routes ---
@app.route('/')
def index():
    for candidate in [BASE_DIR, os.path.join(BASE_DIR, 'costumer')]:
        if os.path.exists(os.path.join(candidate, 'index.html')):
            return send_from_directory(candidate, 'index.html')
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/admin')
@app.route('/admin.html')
def admin_page():
    for candidate in [BASE_DIR, os.path.join(BASE_DIR, 'Admin')]:
        if os.path.exists(os.path.join(candidate, 'admin.html')):
            return send_from_directory(candidate, 'admin.html')
    return send_from_directory(BASE_DIR, 'admin.html')

@app.route('/<path:filename>')
def serve_static(filename):
    if filename.startswith('api/'):
        return jsonify({'error': 'Endpoint not found'}), 404
    for candidate in [BASE_DIR, os.path.join(BASE_DIR, 'costumer'), os.path.join(BASE_DIR, 'Admin'), os.path.join(BASE_DIR, 'database')]:
        target = os.path.join(candidate, filename)
        if os.path.isfile(target):
            return send_from_directory(candidate, filename)
    return index()

# --- API: Settings ---
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(database.get_settings())

@app.route('/api/settings', methods=['POST'])
def save_settings():
    patch = request.json or {}
    updated = database.save_settings(patch)
    return jsonify(updated)

# --- API: Admin PIN Check ---
@app.route('/api/admin/verify-pin', methods=['POST'])
def verify_pin():
    data = request.json or {}
    pin = str(data.get('pin', '')).strip()
    correct_pin = str(database.get_settings().get('admin_pin', '1234'))
    if pin == correct_pin:
        return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'Invalid PIN'}), 401

# --- API: Categories ---
@app.route('/api/categories', methods=['GET'])
def list_categories():
    return jsonify(database.get_categories())

@app.route('/api/categories', methods=['POST'])
def save_category():
    data = request.json or {}
    if not data.get('name') and not data.get('kh'):
        return jsonify({'error': 'Category name is required'}), 400
    cat = database.upsert_category(data)
    return jsonify(cat)

@app.route('/api/categories/<cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    database.delete_category(cat_id)
    return jsonify({'ok': True})

# --- API: Products ---
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
def save_product():
    data = request.json or {}
    if not data.get('name') or data.get('price') is None:
        return jsonify({'error': 'Name and price are required'}), 400
    p = database.upsert_product(data)
    return jsonify(p)

@app.route('/api/products/<prod_id>', methods=['DELETE'])
def delete_product(prod_id):
    database.delete_product(prod_id)
    return jsonify({'ok': True})

@app.route('/api/products/<prod_id>/stock', methods=['POST'])
def adjust_stock(prod_id):
    data = request.json or {}
    delta = int(data.get('delta', 0))
    p = database.adjust_stock(prod_id, delta)
    return jsonify(p)

@app.route('/api/products/seed', methods=['POST'])
def seed_catalog():
    products = database.seed_sample_products()
    return jsonify({'ok': True, 'count': len(products)})

@app.route('/api/products/clear', methods=['POST'])
def clear_catalog():
    database.clear_products()
    return jsonify({'ok': True})

# --- API: Users ---
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

@app.route('/api/database/reset', methods=['POST'])
def reset_db():
    database.reset_database()
    return jsonify({'ok': True, 'message': 'Database reset successfully with fresh tester features.'})


# --- API: Orders ---
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
def approve_order(order_id):
    order, err = database.approve_order(order_id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(order)

@app.route('/api/orders/<order_id>/reject', methods=['POST'])
def reject_order(order_id):
    data = request.json or {}
    note = data.get('note', 'Item out of stock')
    order, err = database.reject_order(order_id, note)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(order)

@app.route('/api/orders/<order_id>/cancel', methods=['POST'])
def cancel_order(order_id):
    data = request.json or {}
    reason = data.get('reason', 'Cancelled by admin')
    order, err = database.cancel_order(order_id, reason)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(order)

@app.route('/api/orders/<order_id>/status', methods=['POST'])
def update_status(order_id):
    data = request.json or {}
    status = data.get('status', 'Shipped')
    order = database.set_order_status(order_id, status)
    return jsonify(order)

# --- API: Notifications ---
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Somphea Reak Python server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
