export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized() { return this.status === 401 }
  get isForbidden()    { return this.status === 403 }
  get isNotFound()     { return this.status === 404 }
  get isConflict()     { return this.status === 409 }
  get isValidation()   { return this.status === 400 }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}
