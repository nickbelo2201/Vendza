export default function NotFound() {
  return (
    <div className="wc-panel">
      <h1>Pagina nao encontrada</h1>
      <p>Esta rota faz parte da estrutura V1, mas o recurso solicitado nao existe.</p>
      <a className="wc-button" href="/">
        Voltar para a home
      </a>
    </div>
  );
}
