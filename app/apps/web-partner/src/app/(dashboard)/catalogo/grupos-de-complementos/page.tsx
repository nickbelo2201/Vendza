import { fetchAPI } from "../../../../lib/api";
import { GruposComplementosClient } from "./GruposComplementosClient";

type ComplementGroup = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  isActive: boolean;
  complementsCount: number;
  createdAt: string;
  updatedAt: string;
};

export default async function GruposComplementosPage() {
  let grupos: ComplementGroup[] = [];

  try {
    grupos = await fetchAPI<ComplementGroup[]>("/partner/complement-groups");
  } catch {
    grupos = [];
  }

  return <GruposComplementosClient gruposIniciais={grupos} />;
}
