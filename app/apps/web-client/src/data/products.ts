import { proxyImage } from "@/lib/image-proxy";

export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  listPriceCents: number;
  salePriceCents: number | null;
  isFeatured: boolean;
  offer: boolean;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "mock-1",
    name: "Heineken Lata 350ml",
    slug: "heineken-lata-350ml",
    categoryId: "cervejas",
    listPriceCents: 899,
    salePriceCents: 799,
    isFeatured: false,
    offer: true,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/604/550/6873/front_en.7.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-2",
    name: "Heineken Original 600ml",
    slug: "heineken-original-600ml",
    categoryId: "cervejas",
    listPriceCents: 1299,
    salePriceCents: null,
    isFeatured: true,
    offer: false,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/604/550/6590/front_en.3.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-3",
    name: "Amstel Puro Malte Lata 350ml",
    slug: "amstel-puro-malte-lata-350ml",
    categoryId: "cervejas",
    listPriceCents: 649,
    salePriceCents: 549,
    isFeatured: false,
    offer: true,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/604/550/6934/front_en.8.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-4",
    name: "Budweiser Long Neck 330ml",
    slug: "budweiser-long-neck-330ml",
    categoryId: "cervejas",
    listPriceCents: 849,
    salePriceCents: 749,
    isFeatured: false,
    offer: true,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/199/101/1723/front_fr.3.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-5",
    name: "Stella Artois 600ml",
    slug: "stella-artois-600ml",
    categoryId: "cervejas",
    listPriceCents: 1399,
    salePriceCents: null,
    isFeatured: true,
    offer: false,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/114/910/1900/front_en.3.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-6",
    name: "Johnnie Walker Red Label 1L",
    slug: "johnnie-walker-red-label-1l",
    categoryId: "destilados",
    listPriceCents: 10990,
    salePriceCents: 8990,
    isFeatured: false,
    offer: true,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/500/026/701/4203/front_en.10.400.jpg"
    ),
    category: { id: "destilados", name: "Destilados", slug: "destilados" },
  },
  {
    id: "mock-7",
    name: "Skol Beats Senses 269ml",
    slug: "skol-beats-senses-269ml",
    categoryId: "cervejas",
    listPriceCents: 499,
    salePriceCents: 399,
    isFeatured: false,
    offer: true,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/199/130/1138/front_pt.7.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-8",
    name: "Brahma Chopp Long Neck 330ml",
    slug: "brahma-chopp-long-neck-330ml",
    categoryId: "cervejas",
    listPriceCents: 799,
    salePriceCents: 699,
    isFeatured: false,
    offer: true,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/789/114/901/0509/front_pt.7.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
  {
    id: "mock-9",
    name: "Corona Extra Long Neck 330ml",
    slug: "corona-extra-long-neck-330ml",
    categoryId: "cervejas",
    listPriceCents: 999,
    salePriceCents: null,
    isFeatured: true,
    offer: false,
    imageUrl: proxyImage(
      "https://images.openfoodfacts.org/images/products/000/007/504/1670/front_en.6.400.jpg"
    ),
    category: { id: "cervejas", name: "Cervejas", slug: "cervejas" },
  },
];
