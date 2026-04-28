import { HubCard } from "./HubCard";

const CARDS = [
  {
    href: "/catalogo/produtos",
    titulo: "Produtos",
    descricao: "Gerencie os produtos disponíveis no catálogo da loja.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="15" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/catalogo/fardo",
    titulo: "Fardos e Pacotes",
    descricao: "Cadastre agrupamentos de produtos vendidos em conjunto.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M14 3L25 8.5V19.5L14 25L3 19.5V8.5L14 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M3 8.5L14 14M14 14L25 8.5M14 14V25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/catalogo/categorias",
    titulo: "Categorias",
    descricao: "Organize os produtos em categorias principais.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M3 7C3 5.9 3.9 5 5 5H11.17C11.7 5 12.21 5.21 12.59 5.59L13.41 6.41C13.79 6.79 14.3 7 14.83 7H23C24.1 7 25 7.9 25 9V21C25 22.1 24.1 23 23 23H5C3.9 23 3 22.1 3 21V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/catalogo/subcategorias",
    titulo: "Subcategorias",
    descricao: "Defina subdivisões dentro das categorias existentes.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M3 7C3 5.9 3.9 5 5 5H11.17C11.7 5 12.21 5.21 12.59 5.59L13.41 6.41C13.79 6.79 14.3 7 14.83 7H23C24.1 7 25 7.9 25 9V21C25 22.1 24.1 23 23 23H5C3.9 23 3 22.1 3 21V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 14H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 17H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/catalogo/combos",
    titulo: "Combos",
    descricao: "Crie combinações de produtos para vendas especiais.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="16" y="3" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="16" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="16" y="16" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/catalogo/grupos-de-complementos",
    titulo: "Grupos de Complementos",
    descricao: "Agrupe complementos para usar em produtos e combos.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="4" y="6" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="12" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="18" width="20" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/catalogo/complementos",
    titulo: "Complementos",
    descricao: "Cadastre itens opcionais que o cliente pode adicionar.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 10V18M10 14H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/catalogo/extras",
    titulo: "Extras",
    descricao: "Configure itens extras cobrados à parte no pedido.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M7 7H21L19 19H9L7 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 7L5.5 4H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="23" r="1.5" fill="currentColor" />
        <circle cx="18" cy="23" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/catalogo/nfe",
    titulo: "Importar NF-e",
    descricao: "Importe notas fiscais para cadastrar produtos automaticamente.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M8 25H20C21.1 25 22 24.1 22 23V9L16 3H8C6.9 3 6 3.9 6 5V23C6 24.1 6.9 25 8 25Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M16 3V9H22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 13V20M14 13L11 16M14 13L17 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function CatalogoPage() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
      className="wp-catalogo-hub"
    >
      <style>{`
        @media (max-width: 1024px) {
          .wp-catalogo-hub {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .wp-catalogo-hub {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {CARDS.map((card) => (
        <HubCard
          key={card.href}
          href={card.href}
          icone={card.icone}
          titulo={card.titulo}
          descricao={card.descricao}
        />
      ))}
    </div>
  );
}
