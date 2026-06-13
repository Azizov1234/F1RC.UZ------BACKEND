export type AuthUser = {
  id: number;
  email?: string | null;
  phone: string;
  role: string;
  status: string;
};