"""Đường dẫn gốc của repo và thư mục asset xuất ra của game (public/assets/)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent  # gốc repo
SOURCE = ROOT / "_source"  # tài nguyên gốc (không đưa vào build)
GAME_APP = ROOT  # app game (Vite) ở gốc repo
PUBLIC_ASSETS = GAME_APP / "public" / "assets"
SHARED_ASSETS = PUBLIC_ASSETS / "shared"
