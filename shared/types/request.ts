export interface IApiResponse<T = void> {
  data: T;
  code?: number;
  ok: boolean;
  message?: string;
  newToken?: string;
}
