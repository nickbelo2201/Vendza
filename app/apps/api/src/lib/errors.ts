/**
 * Classe de erro tipada para a API Vendza.
 *
 * Uso:
 *   throw new AppError(409, "STORE_ALREADY_EXISTS", "Loja já configurada para este usuário.");
 *
 * O error handler global detecta instanceof AppError e retorna o envelope correto.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
