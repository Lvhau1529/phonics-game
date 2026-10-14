import type { MyPointsResponse } from '@phonics/contracts';

/**
 * Tổng điểm của học sinh đang đăng nhập (từ `MyPointsResponse` của BE, GET /me/points).
 * Field giữ nguyên tên như contracts; getter / hàm là dữ liệu chỉ phía FE dùng.
 */
export class MyPointsModel {
  readonly total: number;
  readonly byKind: MyPointsResponse['byKind'];
  readonly byGame: MyPointsResponse['byGame'];
  readonly class: MyPointsResponse['class'];
  readonly range: MyPointsResponse['range'];

  constructor(data: MyPointsResponse) {
    this.total = data.total;
    this.byKind = data.byKind;
    this.byGame = data.byGame;
    this.class = data.class;
    this.range = data.range;
  }

  /** Hạng trong lớp (null = chưa vào lớp / chưa có điểm) */
  get rank(): number | null {
    return this.class?.rank ?? null;
  }

  /** Điểm của một game (undefined = server chưa có dòng của game đó) */
  pointsOf(gameId: string): number | undefined {
    return this.byGame.find((item) => item.gameId === gameId)?.points;
  }
}
