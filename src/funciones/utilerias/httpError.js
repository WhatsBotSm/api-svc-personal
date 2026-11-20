// Errores de negocio con código HTTP
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}