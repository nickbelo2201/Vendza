import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "images.openfoodfacts.org",
  "static.openfoodfacts.org",
  "upload.wikimedia.org",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const isAllowed = ALLOWED_DOMAINS.some(
    (domain) => parsedUrl.hostname === domain
  );
  if (!isAllowed) {
    return new NextResponse("Domain not allowed", { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "VendzaApp/1.0 (contact@vendza.com.br)",
        Accept: "image/*",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
