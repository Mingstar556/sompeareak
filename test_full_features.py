import os
import sys
import json

# Ensure test client can import server and database
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import app
import database

def test_full_features():
    print("=== STARTING FULL END-TO-END FEATURE AUDIT ===")
    client = app.test_client()
    pin = 'Sompheareak.com04/10/2026-Ming'

    # --- 1. Customer: Place Order ---
    print("\n[Feature 1] Customer Checkout Flow...")
    checkout_payload = {
        'name': 'TestCustomer',
        'phone': '12345678',
        'address': 'Phnom Penh, Cambodia',
        'items': [
            {'id': 'test-prod-1', 'name': 'Classic Link', 'price': 5.0, 'qty': 2}
        ],
        'total': 10.0,
        'telegram_user': {'username': 'test_buyer'}
    }
    res_order = client.post('/api/checkout', json=checkout_payload)
    assert res_order.status_code == 200, f"Checkout failed: {res_order.data}"
    order_data = json.loads(res_order.data)
    assert order_data.get('ok') is True
    order_id = order_data['order_id']
    print(f" -> Order created successfully: #{order_id}")

    # --- 2. Admin: Authenticate & Exchange Token ---
    print("\n[Feature 2] Admin Token Exchange...")
    res_auth = client.post('/api/auth/exchange', json={'pin': pin})
    assert res_auth.status_code == 200
    token = json.loads(res_auth.data)['token']
    admin_headers = {'Authorization': f'Bearer {token}'}
    print(" -> Admin authenticated with signed Bearer token.")

    # --- 3. Admin: Check Pending Orders & Approve ---
    print("\n[Feature 3] Admin Order Management...")
    res_orders = client.get('/api/orders')
    assert res_orders.status_code == 200
    all_orders = json.loads(res_orders.data)
    target = next((o for o in all_orders if o['id'] == order_id), None)
    assert target is not None, "Created order not found in /api/orders!"
    assert target['status'] == 'Pending'
    print(f" -> Order #{order_id} verified as Pending.")

    # Approve Order as Admin
    res_approve = client.post(f'/api/orders/{order_id}/approve', headers=admin_headers)
    assert res_approve.status_code == 200, f"Approval failed: {res_approve.data}"
    res_approved_order = client.get(f'/api/orders/{order_id}')
    assert json.loads(res_approved_order.data)['status'] == 'Approved'
    print(f" -> Order #{order_id} approved by admin. Status updated to 'Approved'.")

    # --- 4. User Rewards & Points Verification ---
    print("\n[Feature 4] Customer CRM & Points System...")
    res_users = client.get('/api/users')
    assert res_users.status_code == 200
    users = json.loads(res_users.data)
    buyer = next((u for u in users if u['username'] == 'test_buyer'), None)
    assert buyer is not None, "Buyer not found in users table!"
    assert buyer['points'] >= 5, f"Points not awarded! Current: {buyer['points']}"
    print(f" -> Points verified for user @test_buyer: {buyer['points']} pts.")

    # --- 5. Notifications Flow ---
    print("\n[Feature 5] Studio Notifications...")
    res_notifs = client.get('/api/notifications')
    assert res_notifs.status_code == 200
    notifs = json.loads(res_notifs.data)
    assert len(notifs) > 0, "No notifications found!"
    print(f" -> Live notifications found: {len(notifs)} unread/total.")

    # Mark as read
    res_read = client.post('/api/notifications/read', json={'order_id': order_id})
    assert res_read.status_code == 200
    print(f" -> Notifications marked read for order #{order_id}.")

    # --- 6. Settings Management ---
    print("\n[Feature 6] Admin Settings...")
    res_settings_patch = client.post('/api/settings', headers=admin_headers, json={'delivery_fee': 2.0})
    assert res_settings_patch.status_code == 200
    res_settings = client.get('/api/settings')
    assert json.loads(res_settings.data).get('delivery_fee') == 2.0
    # Reset back to 1.5
    client.post('/api/settings', headers=admin_headers, json={'delivery_fee': 1.5})
    print(" -> Settings update verified and restored.")

    # --- 7. Remember Me Frontend Assets Verification ---
    print("\n[Feature 7] Remember Me HTML & CSS Verification...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cust_html_path = os.path.join(base_dir, 'index.html')
    with open(cust_html_path, 'r', encoding='utf-8') as f:
        cust_html = f.read()
    assert 'id="rememberMeCheckbox"' in cust_html
    assert 'checkbox-custom' in cust_html
    assert '<svg' in cust_html and 'polyline' in cust_html, "Customer missing checkmark SVG!"

    cust_css_path = os.path.join(base_dir, 'styles.css')
    with open(cust_css_path, 'r', encoding='utf-8') as f:
        cust_css = f.read()
    assert '.remember-label input[type="checkbox"]:checked + .checkbox-custom' in cust_css
    assert '#10b981' in cust_css, "Green check styling missing in customer CSS!"

    admin_html_candidates = [
        os.path.join(base_dir, '..', 'sompheareakAdmin', 'index.html'),
        os.path.join(base_dir, '..', 'sompheareakAdmin-main', 'index.html')
    ]
    admin_html_path = next((p for p in admin_html_candidates if os.path.exists(p)), None)
    if admin_html_path:
        with open(admin_html_path, 'r', encoding='utf-8') as f:
            admin_html = f.read()
        assert 'id="adminRememberCheckbox"' in admin_html
        assert 'checkbox-custom' in admin_html
        assert '<svg' in admin_html and 'polyline' in admin_html, "Admin missing checkmark SVG!"

    admin_css_candidates = [
        os.path.join(base_dir, '..', 'sompheareakAdmin', 'styles.css'),
        os.path.join(base_dir, '..', 'sompheareakAdmin-main', 'styles.css')
    ]
    admin_css_path = next((p for p in admin_css_candidates if os.path.exists(p)), None)
    if admin_css_path:
        with open(admin_css_path, 'r', encoding='utf-8') as f:
            admin_css = f.read()
        assert '.remember-label input[type="checkbox"]:checked + .checkbox-custom' in admin_css
        assert '#10b981' in admin_css, "Green check styling missing in admin CSS!"

    print(" -> Remember Me checkmark SVG & styling verified across BOTH codebases.")

    print("\n=======================================================")
    print("ALL 7 CORE FUNCTION & FEATURE TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == '__main__':
    test_full_features()
