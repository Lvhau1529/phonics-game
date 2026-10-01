"""Đường dẫn gốc của repo (monorepo) và thư mục asset xuất ra của app game (apps/game/public/assets/)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent  # gốc monorepo
SOURCE = ROOT / "_source"  # tài nguyên gốc (không đưa vào build)
GAME_APP = ROOT / "apps" / "game"  # app game (Vite)
PUBLIC_ASSETS = GAME_APP / "public" / "assets"
SHARED_ASSETS = PUBLIC_ASSETS / "shared"
