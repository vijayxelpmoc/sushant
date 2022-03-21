export interface BasicResponse {
  statusCode: number;
  message: string;
}

export interface BasicErrorResponse {
  status: string;
  message: string;
  error: string;
}
