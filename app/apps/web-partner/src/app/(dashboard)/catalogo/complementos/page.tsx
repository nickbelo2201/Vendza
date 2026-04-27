import { fetchAPI } from "../../../../lib/api";
import { ComplementosClient } from "./ComplementosClient";

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

type Complement = {
  id: string;
  storeId: string;
  complementGroupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export default async function ComplementosPage() {
  let grupos: ComplementGroup[] = [];
  let complementos: Complement[] = [];

  try {
    [grupos, complementos] = await Promise.all([
      fetchAPI<ComplementGroup[]>("/partner/complement-groups"),
      fetchAPI<Complement[]>("/partner/complements"),
    ]);
  } catch {
    grupos = [];
    complementos = [];
  }

  return <ComplementosClient gruposIniciais={grupos} complementosIniciais={complementos} />;
}
