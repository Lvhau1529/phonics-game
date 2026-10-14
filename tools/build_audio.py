"""
Chuyển audio master (WAV) trong `_source/` thành file dùng trong game (`public/assets/`).

Chạy:  pnpm assets:audio   (= python tools/build_audio.py)

Audio gốc của các resource pack đã được mix sẵn nên chỉ encode lại, KHÔNG normalize.
Volume từng key nằm trong code (platform/audio/sfx.ts và config asset của từng game).

Mỗi dòng trong JOBS: thư mục WAV nguồn -> thư mục xuất (tên file giữ nguyên = key trong game).
(.ogg cho Chrome/Android/Firefox, .mp3 fallback cho iOS Safari)
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common.paths import PUBLIC_ASSETS, SOURCE  # noqa: E402

JOBS = [
    # SFX dùng chung cho mọi game (từ resource pack của Bread Catcher)
    ("bread-catcher/audio/sfx", "shared/sfx"),
    # SFX giao diện chung: nút back, bật/tắt, mở/đóng hộp thoại, kim cương, mở khoá (Phonics Arcade pack)
    ("platform/audio/sfx", "shared/sfx"),
    ("bread-catcher/audio/bgm", "bread-catcher/music"),
    ("food-stream/audio/bgm", "food-stream/music"),
    # SFX riêng của Phonics Ocean (resource pack v2: correct, wrong_soft, level_up, collect, danger)
    ("phonics-ocean/audio/sfx", "phonics-ocean/sfx"),
    # Nhạc riêng của Phonics Ocean (chưa có trong pack — xem docs/phonics-ocean/ASSET_PROMPTS.md; thư mục trống thì bỏ qua)
    ("phonics-ocean/audio/bgm", "phonics-ocean/music"),
]


def write_both(data: np.ndarray, rate: int, base: Path) -> None:
    base.parent.mkdir(parents=True, exist_ok=True)
    data = np.clip(data, -1, 1).astype(np.float32)
    targets = ((".ogg", "OGG", "VORBIS"), (".mp3", "MP3", "MPEG_LAYER_III"))
    for suffix, fmt, subtype in targets:
        # Ghi theo block: libsndfile crash khi encode Vorbis một khối quá lớn
        with sf.SoundFile(base.with_suffix(suffix), "w", rate, data.shape[1], subtype, format=fmt) as f:
            for start in range(0, len(data), rate):
                f.write(data[start:start + rate])


def main() -> None:
    for source, target in JOBS:
        for wav in sorted((SOURCE / source).glob("*.wav")):
            data, rate = sf.read(wav, always_2d=True)
            write_both(data, rate, PUBLIC_ASSETS / target / wav.stem)
            print(f"{target:20s} {wav.stem:28s} {len(data) / rate:5.2f}s  {data.shape[1]}ch {rate}Hz")


if __name__ == "__main__":
    main()
