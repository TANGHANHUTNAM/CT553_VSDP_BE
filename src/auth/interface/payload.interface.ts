export interface IPayload {
  id: number;
  email: string;
  name: string;
  roleId: number;
  active?: boolean;
  sub: string;
}
