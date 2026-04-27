import { fetchAPI } from "../../../../lib/api";
import { ExtrasClient } from "./ExtrasClient";

type Extra = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export default async function ExtrasPage() {
  let extras: Extra[] = [];

  try {
    extras = await fetchAPI<Extra[]>("/partner/extras");
  } catch {
    extras = [];
  }

  return <ExtrasClient extrasIniciais={extras} />;
}
