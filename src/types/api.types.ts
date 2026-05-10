export interface IApiSuccessResponse<T> {
  status: number;
  message: string;
  data?: T;
  timestamp: string;
}

export interface IApiErrorResponse {
  status: number;
  message: string;
  errors?: unknown;
  timestamp?: string;
}
