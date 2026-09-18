import { AdminRole } from '@libs/contracts/admin/admin.schema';

export interface AdminRequestUser {
  adminId: string;
  email: string;
  role: AdminRole;
}

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: AdminRequestUser['role'];
}
