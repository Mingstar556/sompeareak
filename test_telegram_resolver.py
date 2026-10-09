"""
Unit & Integration Tests for Telegram MTProto Username Resolver
"""

import unittest
from unittest.mock import MagicMock, patch
from telethon.errors import UsernameNotOccupiedError, UsernameInvalidError, FloodWaitError
from telethon.tl.types import User, Channel

from telegram_resolver import clean_telegram_username, TelegramResolver
import server


class TestTelegramUsernameCleaner(unittest.TestCase):
    def test_strip_at_symbol(self):
        self.assertEqual(clean_telegram_username("@john_doe"), "john_doe")
        self.assertEqual(clean_telegram_username("@@john_doe"), "john_doe")

    def test_strip_whitespace(self):
        self.assertEqual(clean_telegram_username("  @john_doe  "), "john_doe")
        self.assertEqual(clean_telegram_username("  john_doe  "), "john_doe")

    def test_valid_usernames(self):
        self.assertEqual(clean_telegram_username("alex_99"), "alex_99")
        self.assertEqual(clean_telegram_username("sompheareak"), "sompheareak")

    def test_invalid_usernames(self):
        # Too short (< 5 chars)
        self.assertIsNone(clean_telegram_username("abc"))
        self.assertIsNone(clean_telegram_username("@ab"))
        # Invalid characters
        self.assertIsNone(clean_telegram_username("john-doe"))
        self.assertIsNone(clean_telegram_username("john.doe"))
        self.assertIsNone(clean_telegram_username("john@doe"))
        # Empty or None
        self.assertIsNone(clean_telegram_username(""))
        self.assertIsNone(clean_telegram_username(None))


class TestTelegramResolverLogic(unittest.TestCase):
    def setUp(self):
        self.resolver = TelegramResolver(
            api_id=12345,
            api_hash="mock_hash",
            session_string="mock_session",
        )

    def test_invalid_format_returns_not_exists(self):
        res = self.resolver.resolve("abc")
        self.assertFalse(res["exists"])
        self.assertEqual(res["reason"], "invalid_format")

    def test_not_configured(self):
        unconfigured = TelegramResolver()
        res = unconfigured.resolve("@valid_user")
        self.assertFalse(res["exists"])
        self.assertEqual(res["error"], "NOT_CONFIGURED")

    @patch("telegram_resolver.asyncio.run_coroutine_threadsafe")
    def test_resolve_existing_user(self, mock_run):
        mock_future = MagicMock()
        mock_user = MagicMock(spec=User)
        mock_user.id = 999999
        mock_user.username = "sompheareak_fan"
        mock_user.first_name = "Fan"
        mock_user.last_name = "Studio"
        mock_user.bot = False

        mock_result = MagicMock()
        mock_result.users = [mock_user]
        mock_result.chats = []
        mock_future.result.return_value = mock_result
        mock_run.return_value = mock_future

        self.resolver._started = True
        self.resolver._loop = MagicMock()
        self.resolver._client = MagicMock()

        res = self.resolver.resolve("@sompheareak_fan")
        self.assertTrue(res["exists"])
        self.assertEqual(res["type"], "user")
        self.assertEqual(res["username"], "sompheareak_fan")
        self.assertEqual(res["id"], 999999)
        self.assertFalse(res["is_bot"])

    @patch("telegram_resolver.asyncio.run_coroutine_threadsafe")
    def test_resolve_existing_bot(self, mock_run):
        mock_future = MagicMock()
        mock_user = MagicMock(spec=User)
        mock_user.id = 888888
        mock_user.username = "somphea_bot"
        mock_user.first_name = "Somphea Bot"
        mock_user.last_name = ""
        mock_user.bot = True

        mock_result = MagicMock()
        mock_result.users = [mock_user]
        mock_result.chats = []
        mock_future.result.return_value = mock_result
        mock_run.return_value = mock_future

        self.resolver._started = True
        self.resolver._loop = MagicMock()
        self.resolver._client = MagicMock()

        res = self.resolver.resolve("@somphea_bot")
        self.assertTrue(res["exists"])
        self.assertEqual(res["type"], "bot")
        self.assertTrue(res["is_bot"])

    @patch("telegram_resolver.asyncio.run_coroutine_threadsafe")
    def test_resolve_not_occupied(self, mock_run):
        mock_future = MagicMock()
        mock_future.result.side_effect = UsernameNotOccupiedError(request=None)
        mock_run.return_value = mock_future

        self.resolver._started = True
        self.resolver._loop = MagicMock()
        self.resolver._client = MagicMock()

        res = self.resolver.resolve("@nobody_occupied_username")
        self.assertFalse(res["exists"])
        self.assertEqual(res["reason"], "not_occupied")

    @patch("telegram_resolver.asyncio.run_coroutine_threadsafe")
    def test_resolve_flood_wait(self, mock_run):
        mock_future = MagicMock()
        mock_future.result.side_effect = FloodWaitError(request=None, capture=60)
        mock_run.return_value = mock_future

        self.resolver._started = True
        self.resolver._loop = MagicMock()
        self.resolver._client = MagicMock()

        res = self.resolver.resolve("@target_username")
        self.assertEqual(res["error"], "FLOOD_WAIT")
        self.assertEqual(res["retry_after"], 60)


class TestFlaskEndpointIntegration(unittest.TestCase):
    def setUp(self):
        server.app.config["TESTING"] = True
        self.client = server.app.test_client()

    def test_missing_username_parameter(self):
        resp = self.client.get("/api/telegram/check")
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["exists"])
        self.assertEqual(data["error"], "MISSING_USERNAME")

    @patch("server.tg_resolver.resolve")
    def test_endpoint_get_success(self, mock_resolve):
        mock_resolve.return_value = {
            "exists": True,
            "type": "user",
            "username": "tester",
            "id": 12345,
        }
        resp = self.client.get("/api/telegram/check?username=@tester")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["exists"])
        self.assertEqual(data["type"], "user")
        mock_resolve.assert_called_with("@tester")

    @patch("server.tg_resolver.resolve")
    def test_endpoint_post_success(self, mock_resolve):
        mock_resolve.return_value = {
            "exists": False,
            "reason": "not_occupied",
        }
        resp = self.client.post("/api/telegram/check", json={"username": "@empty_user"})
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertFalse(data["exists"])
        self.assertEqual(data["reason"], "not_occupied")

    @patch("server.tg_resolver.resolve")
    def test_endpoint_flood_wait_returns_429(self, mock_resolve):
        mock_resolve.return_value = {
            "error": "FLOOD_WAIT",
            "retry_after": 45,
            "message": "Rate limited",
        }
        resp = self.client.get("/api/telegram/check?username=@busy_user")
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.headers.get("Retry-After"), "45")
        data = resp.get_json()
        self.assertEqual(data["error"], "FLOOD_WAIT")


if __name__ == "__main__":
    unittest.main()
