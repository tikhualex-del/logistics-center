export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse
