import type { LucideIcon } from "lucide-react";
import {
  Beer,
  Wine,
  GlassWater,
  Droplets,
  Wind,
  Coffee,
  Cookie,
  UtensilsCrossed,
  ShoppingCart,
  Gift,
  Flame,
  Leaf,
  Package,
  Wheat,
  Sparkles,
  Smile,
} from "lucide-react";

export interface StaticCategory {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const CATEGORIES: StaticCategory[] = [
  { id: "cervejas", label: "Cervejas", Icon: Beer },
  { id: "vinhos", label: "Vinhos", Icon: Wine },
  { id: "destilados", label: "Destilados", Icon: GlassWater },
  { id: "sem-alcool", label: "Sem Álcool", Icon: Droplets },
  { id: "agua-gelo", label: "Água e Gelo", Icon: Wind },
  { id: "bebidas-quentes", label: "Bebidas Quentes", Icon: Coffee },
  { id: "snacks", label: "Snacks", Icon: Cookie },
  { id: "petiscos", label: "Petiscos", Icon: UtensilsCrossed },
  { id: "mercearia", label: "Mercearia", Icon: ShoppingCart },
  { id: "presentes", label: "Presentes", Icon: Gift },
  { id: "churrasco", label: "Churrasco", Icon: Flame },
  { id: "hortifruti", label: "Hortifruti", Icon: Leaf },
  { id: "laticinios", label: "Laticínios", Icon: Package },
  { id: "padaria", label: "Padaria", Icon: Wheat },
  { id: "limpeza", label: "Limpeza", Icon: Sparkles },
  { id: "higiene", label: "Higiene", Icon: Smile },
];
