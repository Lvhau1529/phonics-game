"""
Cắt sprite sheet nền magenta (#FF00FF, không alpha) — Kids Bakery pack, Animal Avatar pack...

  key_sheet(path)              -> RGBA: nền magenta (và dải trắng nối mép) trong suốt, viền gỡ màu magenta
  find_items(rgba, rows, cols) -> từng vật theo thứ tự đọc; mảnh rời được gán vào ô gần trọng tâm nhất
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

MAGENTA = np.array([255, 0, 255], dtype=float)
# Sheet bản cũ: nhãn số in sẵn ở góc trên trái (bỏ mọi mảng nằm gọn trong vùng này)
BADGE_ZONE = (200, 135)
# Mảng nhỏ hơn MIN_AREA không tự tạo thành một vật (chỉ là chi tiết rời / lấp lánh)
MIN_AREA = 1500


def _magenta_score(rgb: np.ndarray) -> np.ndarray:
    """0 = không giống magenta, 1 = magenta thuần."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return np.clip((np.minimum(r, b) - g - 40) / 190, 0, 1)


def key_sheet(path: Path) -> np.ndarray:
    rgb = np.array(Image.open(path).convert("RGB")).astype(float)
    score = _magenta_score(rgb)
    # Họ màu nền: magenta, trắng và dải pha giữa hai màu (đường giáp mép dải trắng)
    candidate = (score > 0.55) | ((rgb[..., 0] > 200) & (rgb[..., 2] > 200))

    # Nền = mọi vùng magenta / trắng nối với mép sheet
    labels, _ = ndimage.label(candidate)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, edge[edge > 0])
    # Đốm magenta kẹt giữa các chi tiết (giữa chân nhện, trong quai cốc...) cũng là nền
    bg |= score > 0.8

    alpha = np.where(bg, 0.0, 1.0)
    # Viền 2px sát nền: alpha theo mức "magenta", gỡ màu magenta lẫn vào
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    a = np.clip(1 - score, 0.05, 1)
    alpha[band] = a[band]
    fg = rgb.copy()
    unmixed = (rgb - (1 - a)[..., None] * MAGENTA) / a[..., None]
    fg[band] = np.clip(unmixed[band], 0, 255)

    out = np.zeros(rgb.shape[:2] + (4,), dtype=np.uint8)
    out[..., :3] = fg.round().astype(np.uint8)
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    out[out[..., 3] < 40] = 0
    return out


def grid_centers(values: np.ndarray, weights: np.ndarray, k: int) -> np.ndarray:
    """K-means 1 chiều (có trọng số) — tâm hàng / cột của lưới trên sheet.

    Khởi tạo chia đều từ vật đầu tới vật cuối (lưới đều): khởi tạo theo phân vị bị lệch khi một hàng có nhiều
    mảnh rời (confetti, vụn bánh ở sheet 08) -> hai hàng trên bị gộp làm một.
    """
    centers = np.linspace(values.min(), values.max(), k) if k > 1 else np.array([np.average(values, weights=weights)])
    for _ in range(50):
        nearest = np.abs(values[:, None] - centers[None, :]).argmin(axis=1)
        updated = np.array([
            np.average(values[nearest == i], weights=weights[nearest == i]) if (nearest == i).any() else centers[i]
            for i in range(k)
        ])
        if np.allclose(updated, centers):
            break
        centers = updated
    return np.sort(centers)


def find_items(rgba: np.ndarray, rows: int, cols: int, legacy: bool = False) -> list[np.ndarray]:
    """Cắt từng vật theo thứ tự đọc (trái -> phải, trên -> dưới).

    Mảng lớn xác định tâm hàng / cột của lưới; mọi mảng (kể cả chi tiết rời: dây bóng bay, confetti...)
    được gán vào ô gần trọng tâm nhất. Sheet bản cũ (`legacy`): bỏ mảng nằm gọn trong góc nhãn số và
    đường mảnh dài (mép dải trắng) — bản 16-bit không cần, lọc này còn ăn nhầm vật mảnh như cần câu.
    """
    bx, by = BADGE_ZONE if legacy else (0, 0)
    rgba = rgba.copy()
    # Nhãn số (khối nâu đậm) có thể dính vào vật bên cạnh -> xoá phần tối trong góc nhãn
    corner = rgba[:by, :bx]
    corner[corner[..., :3].max(axis=2) < 100] = 0

    solid = rgba[..., 3] > 0
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    index = np.arange(1, count + 1)
    areas = ndimage.sum(solid, labels, index)
    cy, cx = np.array(ndimage.center_of_mass(solid, labels, index)).T
    boxes = ndimage.find_objects(labels)

    def usable(sl: tuple[slice, slice], area: float) -> bool:
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if not legacy:
            return area >= 30
        in_badge = sl[1].stop <= bx and sl[0].stop <= by
        # Đường mảnh dài: mép dải trắng / khung sheet còn sót lại
        stray_line = max(w, h) > 60 and (min(w, h) <= 14 or (max(w, h) > 150 and area < 0.12 * w * h))
        return area >= 30 and not in_badge and not stray_line

    keep = np.array([usable(sl, area) for sl, area in zip(boxes, areas)])
    big = keep & (areas >= MIN_AREA)
    row_centers = grid_centers(cy[big], areas[big], rows)
    col_centers = grid_centers(cx[big], areas[big], cols)

    cell = np.full(count, -1)
    for i in np.nonzero(keep)[0]:
        r = np.abs(row_centers - cy[i]).argmin()
        c = np.abs(col_centers - cx[i]).argmin()
        cell[i] = r * cols + c

    items = []
    for target in range(rows * cols):
        members = np.nonzero(cell == target)[0]
        if areas[members].sum() < MIN_AREA:
            raise RuntimeError(f"No item found in cell {divmod(target, cols)}")
        mask = np.isin(labels, members + 1)
        ys, xs = np.nonzero(mask)
        sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        crop = rgba[sl].copy()
        crop[~mask[sl]] = 0
        items.append(crop)
    return items
