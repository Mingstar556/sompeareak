"""
Telegram MTProto Username Resolver Service
Uses Telethon and contacts.resolveUsername to verify if a Telegram username exists.
"""

import os
import re
import time
import asyncio
import threading
from typing import Optional, Dict, Any

from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.contacts import ResolveUsernameRequest
from telethon.tl.types import User, Channel, Chat
from telethon.errors import (
    UsernameNotOccupiedError,
    UsernameInvalidError,
    FloodWaitError,
    RPCError,
)

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{5,32}$")


def clean_telegram_username(raw: Optional[str]) -> Optional[str]:
    """
    Cleans raw username:
    - Strips leading '@'
    - Trims whitespace
    - Validates Telegram username rules (5-32 alphanumeric or underscore characters)
    """
    if not raw or not isinstance(raw, str):
        return None
    cleaned = raw.strip().lstrip("@").strip()
    return cleaned if USERNAME_REGEX.match(cleaned) else None


class TelegramResolver:
    """
    Thread-safe, persistent MTProto client manager using Telethon StringSession.
    Runs an internal asyncio event loop on a daemon background thread so it can
    be called synchronously from Flask or other WSGI/threaded environments.
    """

    def __init__(
        self,
        api_id: Optional[int] = None,
        api_hash: Optional[str] = None,
        session_string: Optional[str] = None,
    ):
        self.api_id = api_id or os.environ.get("TELEGRAM_API_ID")
        self.api_hash = api_hash or os.environ.get("TELEGRAM_API_HASH")
        self.session_string = session_string or os.environ.get("TELEGRAM_SESSION_STRING")

        if self.api_id:
            try:
                self.api_id = int(self.api_id)
            except ValueError:
                self.api_id = None

        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._client: Optional[TelegramClient] = None
        self._started = False
        self._lock = threading.Lock()
        self._init_error: Optional[str] = None

    def is_configured(self) -> bool:
        """Check if required Telegram API credentials are provided."""
        return bool(self.api_id and self.api_hash and self.session_string)

    def _ensure_worker(self):
        """Starts the dedicated background Telethon worker loop if not already running."""
        if self._started:
            return

        with self._lock:
            if self._started:
                return

            if not self.is_configured():
                return

            ready_event = threading.Event()

            def _worker_target():
                try:
                    self._loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(self._loop)
                    self._client = TelegramClient(
                        StringSession(self.session_string),
                        self.api_id,
                        self.api_hash,
                        loop=self._loop,
                    )
                    self._loop.run_until_complete(self._client.connect())
                    self._started = True
                except Exception as ex:
                    self._init_error = str(ex)
                finally:
                    ready_event.set()

                if self._started:
                    self._loop.run_forever()

            self._thread = threading.Thread(
                target=_worker_target,
                daemon=True,
                name="TelegramResolverWorker",
            )
            self._thread.start()
            ready_event.wait(timeout=10.0)

    def resolve(self, raw_username: str) -> Dict[str, Any]:
        """
        Resolves a Telegram username.

        Returns:
            { "exists": True, "type": "user"|"bot"|"channel"|"supergroup", ... }
            or
            { "exists": False, "reason": "not_occupied"|"invalid_format"|... }
            or (in case of rate limit):
            { "error": "FLOOD_WAIT", "retry_after": <seconds>, "message": ... }
        """
        cleaned = clean_telegram_username(raw_username)
        if not cleaned:
            return {
                "exists": False,
                "reason": "invalid_format",
                "message": "Username must be 5-32 characters (letters, numbers, underscores).",
            }

        if not self.is_configured():
            return {
                "exists": False,
                "error": "NOT_CONFIGURED",
                "message": "TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION_STRING must be configured in .env",
            }

        self._ensure_worker()

        if self._init_error:
            return {
                "error": "SESSION_INIT_FAILED",
                "message": self._init_error,
            }

        if not self._started or not self._loop or not self._client:
            return {
                "error": "CLIENT_NOT_CONNECTED",
                "message": "Could not connect MTProto client to Telegram servers.",
            }

        async def _call_resolve():
            return await self._client(ResolveUsernameRequest(username=cleaned))

        future = asyncio.run_coroutine_threadsafe(_call_resolve(), self._loop)

        try:
            result = future.result(timeout=15.0)

            # 1. User or Bot match
            if result.users:
                user: User = result.users[0]
                peer_type = "bot" if getattr(user, "bot", False) else "user"
                return {
                    "exists": True,
                    "type": peer_type,
                    "username": user.username or cleaned,
                    "id": user.id,
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "is_bot": bool(getattr(user, "bot", False)),
                }

            # 2. Channel or Supergroup match
            if result.chats:
                chat = result.chats[0]
                if isinstance(chat, Channel):
                    peer_type = "channel" if getattr(chat, "broadcast", False) else "supergroup"
                elif isinstance(chat, Chat):
                    peer_type = "group"
                else:
                    peer_type = "chat"

                return {
                    "exists": True,
                    "type": peer_type,
                    "username": getattr(chat, "username", cleaned),
                    "id": chat.id,
                    "title": getattr(chat, "title", ""),
                }

            return {
                "exists": False,
                "reason": "empty_result",
            }

        except UsernameNotOccupiedError:
            return {
                "exists": False,
                "reason": "not_occupied",
            }

        except UsernameInvalidError:
            return {
                "exists": False,
                "reason": "invalid_username",
            }

        except FloodWaitError as ex:
            return {
                "error": "FLOOD_WAIT",
                "retry_after": ex.seconds,
                "message": f"Telegram rate limit: Please wait {ex.seconds} seconds before retrying.",
            }

        except RPCError as ex:
            return {
                "error": "RPC_ERROR",
                "message": str(ex),
            }

        except Exception as ex:
            return {
                "error": "INTERNAL_ERROR",
                "message": str(ex),
            }


# Singleton resolver instance
resolver = TelegramResolver()
