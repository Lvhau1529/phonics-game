/** Kiểu giá trị của một object hằng (`as const`): `ValueOf<typeof X>` thay cho union chuỗi viết tay */
export type ValueOf<T> = T[keyof T];
