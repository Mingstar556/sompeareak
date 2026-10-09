import subprocess
import time
import urllib.request
import json
import os
import sys

def test_live_servers():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(base_dir, '..'))
    admin_dir = os.path.join(root_dir, 'sompheareakAdmin-main')
    python_bin = os.path.join(base_dir, '.venv', 'bin', 'python')

    port_api = 5099
    port_admin = 5599

    print(f"--- Starting Backend API Server (server.py) on port {port_api} ---")
    server_env = os.environ.copy()
    server_env['PORT'] = str(port_api)
    server_env['ALLOWED_ORIGINS'] = f'http://127.0.0.1:{port_admin},http://localhost:{port_admin}'
    server_proc = subprocess.Popen(
        [python_bin, 'server.py'],
        cwd=base_dir,
        env=server_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    print(f"--- Starting Admin Server (serve.py) on port {port_admin} ---")
    admin_env = os.environ.copy()
    admin_env['PORT'] = str(port_admin)
    admin_proc = subprocess.Popen(
        [sys.executable, 'serve.py'],
        cwd=admin_dir,
        env=admin_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    def wait_for_url(url, timeout=12):
        start = time.time()
        while time.time() - start < timeout:
            try:
                with urllib.request.urlopen(url, timeout=1) as resp:
                    if resp.status == 200:
                        return True
            except Exception:
                time.sleep(0.2)
        return False

    try:
        assert wait_for_url(f'http://127.0.0.1:{port_api}/'), f"Backend server failed to start within 12s on {port_api}"
        assert wait_for_url(f'http://127.0.0.1:{port_admin}/'), f"Admin server failed to start within 12s on {port_admin}"

        # 1. Test Backend Root (Storefront)
        print(f"Testing Customer Storefront at http://127.0.0.1:{port_api}/ ...")
        with urllib.request.urlopen(f'http://127.0.0.1:{port_api}/', timeout=5) as resp:
            assert resp.status == 200
            html = resp.read().decode('utf-8')
            assert 'Somphea Reak' in html
            print(" -> Customer Storefront OK (200)")

        # 2. Test Backend API Settings
        print(f"Testing API endpoint at http://127.0.0.1:{port_api}/api/settings ...")
        with urllib.request.urlopen(f'http://127.0.0.1:{port_api}/api/settings', timeout=5) as resp:
            assert resp.status == 200
            settings = json.loads(resp.read().decode('utf-8'))
            assert 'site_title' in settings
            print(f" -> API Settings OK: {settings['site_title']}")

        # 3. Test Admin Gate
        print(f"Testing Admin Gate at http://127.0.0.1:{port_admin}/ ...")
        with urllib.request.urlopen(f'http://127.0.0.1:{port_admin}/', timeout=5) as resp:
            assert resp.status == 200
            admin_index = resp.read().decode('utf-8')
            assert 'Admin Panel' in admin_index
            print(" -> Admin Gate OK (200)")

        # 4. Test Admin Portal HTML
        print(f"Testing Admin Dashboard at http://127.0.0.1:{port_admin}/admin.html ...")
        with urllib.request.urlopen(f'http://127.0.0.1:{port_admin}/admin.html', timeout=5) as resp:
            assert resp.status == 200
            admin_page = resp.read().decode('utf-8')
            assert 'Admin' in admin_page
            print(" -> Admin Dashboard Page OK (200)")

        # 5. Test Cross-Origin API request from Admin origin (port_admin -> port_api)
        print("Testing CORS request from Admin origin to API ...")
        req = urllib.request.Request(
            f'http://127.0.0.1:{port_api}/api/settings',
            headers={'Origin': f'http://127.0.0.1:{port_admin}'}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
            assert resp.headers.get('Access-Control-Allow-Origin') == f'http://127.0.0.1:{port_admin}'
            print(" -> CORS Admin -> API communication verified (200)")

        print("\n=== ALL LIVE INTEGRATION CHECKS PASSED SUCCESSFULLY ===")
    finally:
        server_proc.terminate()
        admin_proc.terminate()
        try:
            server_proc.wait(timeout=2)
        except Exception:
            server_proc.kill()
        try:
            admin_proc.wait(timeout=2)
        except Exception:
            admin_proc.kill()

if __name__ == '__main__':
    test_live_servers()
