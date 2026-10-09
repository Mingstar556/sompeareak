import os
import sys
import json

# Ensure test client can import server and database
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import app
import database

def run_tests():
    print("=== STARTING COMPREHENSIVE SECURITY & API TESTS ===")
    client = app.test_client()

    # 1. Test GET /api/settings does not expose admin PIN or password hash
    print("\n--- Test 1: Credential Sanitization in Public Settings ---")
    res = client.get('/api/settings')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    settings_data = json.loads(res.data)
    assert 'admin_pin' not in settings_data, "VULNERABILITY: admin_pin found in public settings!"
    assert 'adminPin' not in settings_data, "VULNERABILITY: adminPin found in public settings!"
    assert 'password_hash' not in settings_data, "VULNERABILITY: password_hash found in public settings!"
    print("[PASS] Public settings do not leak admin PIN or password hash.")

    # 2. Test Admin Hash in Database
    print("\n--- Test 2: Admin PIN Stored as Secret Hash ---")
    correct_pin = os.environ.get('ADMIN_PIN', 'Sompheareak.com04/10/2026-Ming')
    assert database.verify_admin_pin(correct_pin) is True, "Failed to verify correct admin PIN against hash!"
    assert database.verify_admin_pin("WrongPin123") is False, "Incorrect PIN should not verify!"
    
    with database.get_db() as conn:
        row = conn.execute("SELECT password_hash FROM admin_auth WHERE id = 1").fetchone()
        assert row is not None, "admin_auth record missing!"
        stored_hash = row['password_hash']
        assert stored_hash.startswith(('scrypt:', 'pbkdf2:')), f"Invalid hash format: {stored_hash}"
        assert stored_hash != correct_pin, "PIN stored in plaintext!"
    print(f"[PASS] Admin PIN stored as secure hash: {stored_hash[:18]}...")

    # 3. Test Exchange Endpoint (/api/auth/exchange)
    print("\n--- Test 3: Token Exchange Endpoint ---")
    # Bad PIN
    res_bad = client.post('/api/auth/exchange', json={'pin': 'IncorrectSecret'})
    assert res_bad.status_code == 401, f"Expected 401 for bad pin, got {res_bad.status_code}"
    assert json.loads(res_bad.data).get('ok') is False

    # Good PIN
    res_good = client.post('/api/auth/exchange', json={'pin': correct_pin})
    assert res_good.status_code == 200, f"Expected 200 for valid pin, got {res_good.status_code}"
    good_data = json.loads(res_good.data)
    assert good_data.get('ok') is True
    assert 'token' in good_data
    token = good_data['token']
    assert len(token) > 20
    print(f"[PASS] Exchange endpoint generated signed token successfully: {token[:25]}...")

    # 4. Test Server-Side Permission Validation (Never Trust X-Client-Role)
    print("\n--- Test 4: Server-Side Permission & Untrusted X-Client-Role ---")
    # Attempting to call protected admin endpoint with fake X-Client-Role header
    res_spoof = client.post(
        '/api/products',
        headers={'X-Client-Role': 'admin', 'Content-Type': 'application/json'},
        json={'name': 'Hacked Product', 'price': 99}
    )
    assert res_spoof.status_code == 401, f"Expected 401 when spoofing X-Client-Role, got {res_spoof.status_code}: {res_spoof.data}"
    spoof_body = json.loads(res_spoof.data)
    assert spoof_body.get('code') == 'ADMIN_TOKEN_REQUIRED'
    print("[PASS] Spoofed 'X-Client-Role: admin' properly rejected with 401 ADMIN_TOKEN_REQUIRED.")

    # Legitimate call with Authorization: Bearer <token>
    res_auth = client.post(
        '/api/products',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json={
            'name': 'Test Protected Product',
            'category': 'minifigure',
            'price': 15.0,
            'active': 0
        }
    )
    assert res_auth.status_code == 200, f"Expected 200 with valid Bearer token, got {res_auth.status_code}: {res_auth.data}"
    auth_body = json.loads(res_auth.data)
    created_id = auth_body.get('id')
    assert created_id is not None
    print(f"[PASS] Authenticated request with Bearer token succeeded (created product: {created_id}).")

    # Clean up test product
    client.delete(f'/api/products/{created_id}', headers={'Authorization': f'Bearer {token}'})

    # 5. Test Strict Origin Restrictions
    print("\n--- Test 5: Strict CORS & Origin Enforcement ---")
    # Untrusted Origin
    res_untrusted = client.get('/api/settings', headers={'Origin': 'https://evil-hacker.com'})
    assert res_untrusted.status_code == 403, f"Expected 403 for untrusted origin, got {res_untrusted.status_code}"
    untrusted_body = json.loads(res_untrusted.data)
    assert untrusted_body.get('code') == 'UNTRUSTED_ORIGIN'
    print("[PASS] Untrusted origin https://evil-hacker.com blocked with 403 UNTRUSTED_ORIGIN.")

    # Untrusted Preflight OPTIONS
    res_preflight_bad = client.options('/api/auth/exchange', headers={'Origin': 'https://malicious.org'})
    assert res_preflight_bad.status_code == 403, f"Expected 403 for untrusted preflight, got {res_preflight_bad.status_code}"
    print("[PASS] Untrusted preflight OPTIONS blocked with 403.")

    # Trusted Origin
    res_trusted = client.get('/api/settings', headers={'Origin': 'https://sompheareak.com'})
    assert res_trusted.status_code == 200, f"Expected 200 for trusted origin, got {res_trusted.status_code}"
    assert res_trusted.headers.get('Access-Control-Allow-Origin') == 'https://sompheareak.com'
    assert 'Origin' in res_trusted.headers.get('Vary', '')
    print("[PASS] Trusted origin https://sompheareak.com allowed with dynamic CORS header.")

    # Trusted Admin Origin
    res_admin_trusted = client.options('/api/auth/exchange', headers={'Origin': 'https://admin.sompheareak.com'})
    assert res_admin_trusted.status_code == 204, f"Expected 204 for trusted preflight, got {res_admin_trusted.status_code}"
    assert res_admin_trusted.headers.get('Access-Control-Allow-Origin') == 'https://admin.sompheareak.com'
    print("[PASS] Trusted admin origin https://admin.sompheareak.com preflight allowed with 204.")

    # 6. Test Mobile LAN IP CORS & JSON Error Handling
    print("\n--- Test 6: Mobile LAN Origin & JSON Error Responses ---")
    # Mobile Wi-Fi request from LAN IP (e.g., 192.168.1.11:5500)
    res_mobile_opt = client.options('/api/auth/exchange', headers={'Origin': 'http://192.168.1.11:5500'})
    assert res_mobile_opt.status_code == 204, f"Expected 204 for mobile LAN origin, got {res_mobile_opt.status_code}"
    assert res_mobile_opt.headers.get('Access-Control-Allow-Origin') == 'http://192.168.1.11:5500'
    print("[PASS] Mobile LAN origin http://192.168.1.11:5500 preflight allowed with 204.")

    # Mobile POST exchange with correct PIN
    res_mobile_exchange = client.post(
        '/api/auth/exchange',
        headers={'Origin': 'http://192.168.1.11:5500'},
        json={'pin': correct_pin}
    )
    assert res_mobile_exchange.status_code == 200, f"Expected 200 for mobile auth, got {res_mobile_exchange.status_code}"
    assert res_mobile_exchange.content_type.startswith('application/json')
    assert res_mobile_exchange.headers.get('Access-Control-Allow-Origin') == 'http://192.168.1.11:5500'
    print("[PASS] Mobile auth exchange succeeded with JSON response and valid CORS headers.")

    # API 404 returns JSON, NEVER HTML
    res_api_404 = client.get('/api/some-nonexistent-endpoint')
    assert res_api_404.status_code == 404
    assert res_api_404.content_type.startswith('application/json'), f"Expected application/json, got {res_api_404.content_type}"
    assert json.loads(res_api_404.data).get('code') == 'NOT_FOUND'
    print("[PASS] API 404 correctly returns JSON instead of HTML <!doctype>.")

    # API 405 returns JSON, NEVER HTML
    res_api_405 = client.delete('/api/auth/exchange')
    assert res_api_405.status_code == 405
    assert res_api_405.content_type.startswith('application/json'), f"Expected application/json, got {res_api_405.content_type}"
    assert json.loads(res_api_405.data).get('code') == 'METHOD_NOT_ALLOWED'
    print("[PASS] API 405 correctly returns JSON instead of HTML <!doctype>.")

    print("\n=======================================================")
    print("ALL VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=======================================================")

def test_security_verification():
    run_tests()

if __name__ == '__main__':
    run_tests()

