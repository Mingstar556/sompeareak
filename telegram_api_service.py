"""
Standalone Lightweight Telegram MTProto Username Verification Microservice
Can run independently as a microservice on port 8000.

Usage:
    python telegram_api_service.py
"""

import os
from flask import Flask, request, jsonify, make_response
from telegram_resolver import resolver

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'configured': resolver.is_configured(),
    })


@app.route('/api/telegram/check', methods=['GET', 'POST'])
@app.route('/api/telegram/resolve', methods=['GET', 'POST'])
def check_username():
    """
    Accepts:
      - GET /api/telegram/check?username=@john_doe
      - POST /api/telegram/check with JSON {"username": "@john_doe"}
    """
    if request.method == 'POST':
        body = request.get_json(silent=True) or {}
        raw = body.get('username') or request.args.get('username', '')
    else:
        raw = request.args.get('username', '')

    if not raw:
        return jsonify({
            'exists': False,
            'error': 'MISSING_USERNAME',
            'message': 'Username parameter is required (e.g. ?username=@john_doe)',
        }), 400

    result = resolver.resolve(raw)

    # 429 Too Many Requests on FLOOD_WAIT
    if result.get('error') == 'FLOOD_WAIT':
        resp = make_response(jsonify(result), 429)
        resp.headers['Retry-After'] = str(result.get('retry_after', 60))
        return resp

    # 503 If session is not configured yet
    if result.get('error') == 'NOT_CONFIGURED':
        return jsonify(result), 503

    return jsonify(result)


if __name__ == '__main__':
    port = int(os.environ.get('TELEGRAM_SERVICE_PORT', 8000))
    print(f"Starting Telegram MTProto Resolver API on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
