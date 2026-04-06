import { fetchAPI } from "../lib/api";
import { TopbarV2 } from "./TopbarV2";
import { ToggleLojaAberta } from "./ToggleLojaAberta";

type StoreSettings = { status: string };

async function getStatusLoja(): Promise<"open" | "closed"> {
  try {
    const settings = await fetchAPI<StoreSettings>("/partner/store/settings");
    return settings.status === "open" ? "open" : "closed";
  } catch {
    return "closed";
  }
}

export async function TopbarWrapper() {
  const statusLoja = await getStatusLoja();

  return (
    <div style={{ display: "contents" }}>
      <TopbarV2 toggleLoja={<ToggleLojaAberta initialStatus={statusLoja} />} />
    </div>
  );
}
