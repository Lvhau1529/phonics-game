import { Password } from '@phonics/contracts';

/** Độ dài mật khẩu tối thiểu (theo `Password` của contracts) — màn đặt mật khẩu kiểm trước khi gửi, API kiểm lại */
export const PASSWORD_MIN_LENGTH: number = Password.minLength ?? 6;
