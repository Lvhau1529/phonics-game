"""
Phonics Ocean: gộp dữ liệu phonics của pack (`_source/phonics-ocean/data/`: word_bank.csv + levels/level_0x.json)
thành `src/games/phonics-ocean/content/levels.json` mà game đọc (kiểm tra lại bằng zod ở content/schema.ts).

Chạy:  pnpm assets:phonics-ocean   (chạy cùng build_sprites.py)

Đổi danh sách từ theo tuần: sửa word_bank.csv / level_0x.json rồi chạy lại — không phải vẽ lại sprite
(chữ trên cá được vẽ live trong game).

Bổ sung của game (pack không có):
  - MODE: kiểu câu hỏi của từng cấp (luật chọn đáp án đúng, xem session/questions.ts)
  - SPEECH: cách viết để Web Speech đọc gần đúng âm / vần / cụm phụ âm (vd "m" -> "mmm")
  - EXTRA_DISTRACTORS: từ gây nhiễu thêm (cặp Magic-E: kit / kite, cub / cube...)
  - PREDATORS: cá săn mồi theo biome (bảng §9 của GAMEPLAY_PHONICS_V2.md)
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common.paths import GAME_APP, SOURCE  # noqa: E402

DATA = SOURCE / "phonics-ocean" / "data"
OUT = GAME_APP / "src" / "games" / "phonics-ocean" / "content" / "levels.json"

# id ổn định (dùng cho lưu tiến độ) + kiểu câu hỏi của từng cấp
#   initial  — nghe âm đầu, ăn từ bắt đầu bằng âm đó
#   word     — nghe một từ, ăn đúng từ đó (từ gây nhiễu chỉ khác 1 âm)
#   rime     — vần (-at): ăn từ cùng họ vần, 3 câu cùng vần liền nhau = RHYME COMBO
#   contains — cụm phụ âm / digraph: ăn từ có chứa cụm đó
#   sentence — ôn tập: nghe "I can see a ___." rồi ăn từ còn thiếu
LEVELS = {
    1: ("sound-reef", "initial"),
    2: ("cvc-lagoon", "word"),
    3: ("cvc-deep-sea", "word"),
    4: ("rhyme-current", "rime"),
    5: ("blend-wreck", "contains"),
    6: ("digraph-trench", "contains"),
    7: ("magic-e-bay", "word"),
    8: ("treasure-review", "sentence"),
}

PREDATORS = {
    1: ["puffer"],
    2: ["puffer"],
    3: ["shark"],
    4: ["shark", "puffer"],
    5: ["eel", "barracuda"],
    6: ["angler"],
    7: ["shark", "puffer"],
    8: ["angler", "shark"],
}

# Web Speech không đọc được âm vị "sạch": viết gần đúng (tránh thêm "uh" khi có thể — README §11).
# Cụm phụ âm cuối từ (nd, mp, nt, sk) đọc bằng một từ ngắn kết thúc bằng cụm đó.
SPEECH = {
    "a": ["ah"], "e": ["eh"], "i": ["ih"], "o": ["aw"], "u": ["uh"],
    "m": ["mmm"], "s": ["sss"], "f": ["fff"], "n": ["nnn"], "t": ["tuh"], "p": ["puh"], "b": ["buh"],
    "c": ["kuh"], "d": ["duh"], "h": ["huh"],
    "bl": ["bluh"], "cl": ["kluh"], "fl": ["fluh"], "gl": ["gluh"], "pl": ["pluh"], "sl": ["sluh"],
    "br": ["bruh"], "cr": ["kruh"], "dr": ["druh"], "fr": ["fruh"], "gr": ["gruh"], "tr": ["truh"],
    "st": ["stuh"], "nd": ["and"], "mp": ["amp"], "nt": ["ant"], "sk": ["ask"],
    "sh": ["shh"], "ch": ["chuh"], "th": ["thuh"], "ph": ["fff"], "wh": ["wuh"], "ck": ["kuh"], "ng": ["ing"],
    # Vần dễ bị đọc thành chữ viết tắt
    "-et": ["ett"], "-ed": ["edd"],
}

EXTRA_DISTRACTORS = {
    7: ["kit", "cut", "rid", "cub", "tub", "cap", "hop", "not", "pin", "can", "tap", "rob"],
}

# Mục tiêu "chung chung" trong CSV (vd "blend") không làm đề, từ của nó chỉ làm từ gây nhiễu
GENERIC_TARGETS = {"blend", "mixed"}


def speech_for(target: str) -> list[str]:
    return SPEECH.get(target, [target.lstrip("-")])


def label_for(target: str, mode: str) -> str:
    return f"/{target}/" if mode == "initial" else target


def main() -> None:
    with (DATA / "word_bank.csv").open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    levels = []
    for number, (level_id, mode) in LEVELS.items():
        config = json.loads((DATA / "levels" / f"level_{number:02d}.json").read_text(encoding="utf-8"))
        level_rows = [row for row in rows if int(row["level"]) == number]
        words = list(dict.fromkeys(row["word"].strip().lower() for row in level_rows))

        targets: dict[str, list[str]] = {}
        if mode in ("initial", "rime", "contains"):
            for row in level_rows:
                target = row["target"].strip().lower()
                if target in GENERIC_TARGETS:
                    continue
                targets.setdefault(target, []).append(row["word"].strip().lower())

        difficulty = config["difficulty"]
        levels.append(
            {
                "id": level_id,
                "number": number,
                "title": config["name"].upper(),
                "focus": config["focus"],
                "mode": mode,
                "biome": config["biome"],
                "roundSeconds": config["round_seconds"],
                "correctToClear": config["correct_to_clear"],
                "minAccuracy": config["mastery_gate"]["min_accuracy"],
                "startChoices": difficulty["start_choices"],
                "maxChoices": difficulty["max_choices"],
                "predatorEverySec": difficulty["predator_spawn_sec"],
                "speed": difficulty["speed_multiplier"],
                "predators": PREDATORS[number],
                "targets": [
                    {
                        "id": target,
                        "label": label_for(target, mode),
                        "speech": speech_for(target),
                        "words": list(dict.fromkeys(target_words)),
                    }
                    for target, target_words in targets.items()
                ],
                "words": words,
                "extraDistractors": EXTRA_DISTRACTORS.get(number, []),
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"levels": levels}, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Built {len(levels)} levels -> {OUT}")


if __name__ == "__main__":
    main()
