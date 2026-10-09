"""
Helper Script: Generate Telegram Persistent StringSession
Run this once to authenticate and generate a TELEGRAM_SESSION_STRING for .env

Usage:
    python generate_telegram_session.py
"""

import sys
import os

try:
    from telethon.sync import TelegramClient
    from telethon.sessions import StringSession
except ImportError:
    print("Telethon is required. Install it with: pip install telethon")
    sys.exit(1)


def main():
    print("=" * 60)
    print("Telegram Persistent Session Generator")
    print("Get your API_ID and API_HASH from https://my.telegram.org")
    print("=" * 60)

    api_id_input = os.environ.get("TELEGRAM_API_ID") or input("Enter Telegram API_ID: ").strip()
    api_hash_input = os.environ.get("TELEGRAM_API_HASH") or input("Enter Telegram API_HASH: ").strip()

    if not api_id_input or not api_hash_input:
        print("Error: API_ID and API_HASH are required.")
        sys.exit(1)

    try:
        api_id = int(api_id_input)
    except ValueError:
        print("Error: API_ID must be an integer.")
        sys.exit(1)

    api_hash = api_hash_input

    print("\nConnecting to Telegram MTProto...")
    with TelegramClient(StringSession(), api_id, api_hash) as client:
        session_str = client.session.save()
        me = client.get_me()
        print("\n" + "=" * 60)
        print(f"Authentication Successful for: {me.first_name} (@{me.username})")
        print("=" * 60)
        print("\nCopy the following line to your .env file:\n")
        print(f"TELEGRAM_API_ID={api_id}")
        print(f"TELEGRAM_API_HASH={api_hash}")
        print(f"TELEGRAM_SESSION_STRING={session_str}")
        print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
