export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
  errors?: Record<string, string>;
}
