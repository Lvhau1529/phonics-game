/**
 * Service bài giao của học sinh: gọi repository rồi đổi DTO → model. Store / màn hình chỉ gọi service.
 */
import type { MyAssignmentFilter } from '@phonics/contracts';
import { assignmentsRepository } from '@/modules/homework/repositories/assignmentsRepository';
import { LIST_PAGE_SIZE } from '@/modules/homework/constants';
import { AssignmentDetailModel, AssignmentModel } from '@/modules/homework/models/AssignmentModel';

export const assignmentsService = {
  list: async (filter: MyAssignmentFilter): Promise<AssignmentModel[]> => {
    const page = await assignmentsRepository.list({ filter, pageSize: LIST_PAGE_SIZE });
    return page.items.map((item) => new AssignmentModel(item));
  },
  detail: async (id: string): Promise<AssignmentDetailModel> =>
    new AssignmentDetailModel(await assignmentsRepository.detail(id)),
};
