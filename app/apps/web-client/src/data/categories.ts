export interface Category {
  id: string;
  label: string;
  emoji: string;
  imageUrl: string | null;
}

export const CATEGORIES: Category[] = [
  {
    id: "cervejas",
    label: "Cervejas",
    emoji: "🍺",
    imageUrl: "/images/categories/cervejas.png",
  },
  {
    id: "vinhos",
    label: "Vinhos",
    emoji: "🍷",
    imageUrl: "/images/categories/vinhos.png",
  },
  {
    id: "destilados",
    label: "Destilados",
    emoji: "🥃",
    imageUrl: "/images/categories/destilados.png",
  },
  {
    id: "sem-alcool",
    label: "Sem Álcool",
    emoji: "🧃",
    imageUrl: "/images/categories/sem-alcool.png",
  },
  {
    id: "agua-gelo",
    label: "Água e Gelo",
    emoji: "💧",
    imageUrl: "/images/categories/agua-gelo.png",
  },
  {
    id: "bebidas-quentes",
    label: "Bebidas Quentes",
    emoji: "☕",
    imageUrl: "/images/categories/bebidas-quentes.png",
  },
  {
    id: "snacks",
    label: "Snacks",
    emoji: "🍟",
    imageUrl: "/images/categories/snacks.png",
  },
  {
    id: "petiscos",
    label: "Petiscos",
    emoji: "🥜",
    imageUrl: "/images/categories/petiscos.png",
  },
  {
    id: "mercearia",
    label: "Mercearia",
    emoji: "🛒",
    imageUrl: "/images/categories/mercearia.png",
  },
  {
    id: "presentes",
    label: "Presentes",
    emoji: "🎁",
    imageUrl: "/images/categories/presentes.png",
  },
  {
    id: "churrasco",
    label: "Churrasco",
    emoji: "🥩",
    imageUrl: "/images/categories/churrasco.png",
  },
  {
    id: "hortifruti",
    label: "Hortifruti",
    emoji: "🥬",
    imageUrl: "/images/categories/hortifruti.png",
  },
  {
    id: "laticinios",
    label: "Laticínios",
    emoji: "🧀",
    imageUrl: "/images/categories/laticinios.png",
  },
  {
    id: "padaria",
    label: "Padaria",
    emoji: "🍞",
    imageUrl: "/images/categories/padaria.png",
  },
  {
    id: "limpeza",
    label: "Limpeza",
    emoji: "🧹",
    imageUrl: "/images/categories/limpeza.png",
  },
  {
    id: "higiene",
    label: "Higiene",
    emoji: "🧴",
    imageUrl: "/images/categories/higiene.png",
  },
];
