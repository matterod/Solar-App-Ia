"""
T6.1 — Unit tests for _current_threshold() in notifier.py

Pure function, no DB needed.
THRESHOLDS = [7, 3, 1, 0]
"""

import pytest

from app.services.notifier import _current_threshold


class TestCurrentThreshold:
    """Test the threshold matching logic for notification dedup."""

    # --- Exact threshold matches (should return the value itself) ---

    def test_days_7_returns_7(self):
        assert _current_threshold(7) == 7

    def test_days_3_returns_3(self):
        assert _current_threshold(3) == 3

    def test_days_1_returns_1(self):
        assert _current_threshold(1) == 1

    def test_days_0_returns_0(self):
        assert _current_threshold(0) == 0

    # --- Non-threshold values (should return None) ---

    def test_days_5_returns_none(self):
        """5 days is not in THRESHOLDS — no notification."""
        assert _current_threshold(5) is None

    def test_days_8_returns_none(self):
        """8 days is outside the window — no notification."""
        assert _current_threshold(8) is None

    def test_days_negative_returns_none(self):
        """Overdue events (-1) must never trigger a new notification."""
        assert _current_threshold(-1) is None

    def test_days_2_returns_none(self):
        assert _current_threshold(2) is None

    def test_days_4_returns_none(self):
        assert _current_threshold(4) is None

    def test_days_6_returns_none(self):
        assert _current_threshold(6) is None

    def test_days_large_positive_returns_none(self):
        assert _current_threshold(30) is None

    def test_days_large_negative_returns_none(self):
        assert _current_threshold(-100) is None
