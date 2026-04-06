import { proxyImage } from "@/lib/image-proxy";

export interface Brand {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  logoUrl: string | null;
  logoWhite?: boolean;
}

export const BRANDS: Brand[] = [
  {
    id: "heineken",
    name: "Heineken",
    bgColor: "#006831",
    textColor: "#FFFFFF",
    logoUrl: proxyImage(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Heineken_logo.svg/200px-Heineken_logo.svg.png"
    ),
    logoWhite: true,
  },
  {
    id: "skol",
    name: "Skol",
    bgColor: "#F5C400",
    textColor: "#CC0000",
    logoUrl: proxyImage(
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/Skol_logo_%282016%29.svg/200px-Skol_logo_%282016%29.svg.png"
    ),
  },
  {
    id: "brahma",
    name: "Brahma",
    bgColor: "#CC0000",
    textColor: "#FFFFFF",
    logoUrl: proxyImage(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Logo-cerveza-brahma.svg/200px-Logo-cerveza-brahma.svg.png"
    ),
  },
  {
    id: "corona",
    name: "Corona",
    bgColor: "#002868",
    textColor: "#FFFFFF",
    logoUrl: proxyImage(
      "https://upload.wikimedia.org/wikipedia/en/thumb/7/71/Corona_Extra.svg/200px-Corona_Extra.svg.png"
    ),
    logoWhite: true,
  },
  {
    id: "budweiser",
    name: "Budweiser",
    bgColor: "#CC0000",
    textColor: "#FFFFFF",
    logoUrl: proxyImage(
      "https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/Budweiser.svg/200px-Budweiser.svg.png"
    ),
  },
  {
    id: "stella",
    name: "Stella Artois",
    bgColor: "#003087",
    textColor: "#C5A028",
    logoUrl: proxyImage(
      "https://upload.wikimedia.org/wikipedia/en/thumb/3/37/Stella_Artois_logo.svg/200px-Stella_Artois_logo.svg.png"
    ),
  },
];
