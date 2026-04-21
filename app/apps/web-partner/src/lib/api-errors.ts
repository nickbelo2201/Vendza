/**
 * Classe de erro para respostas HTTP da API.
 * Arquivo separado para uso em Client Components sem dependências server-side.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
