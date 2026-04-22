import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vendza — Delivery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          padding: "80px 100px",
          position: "relative",
        }}
      >
        {/* Barra de acento verde no topo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#2D5A3D",
            display: "flex",
          }}
        />

        {/* Logo / Nome da marca */}
        <div
          style={{
            fontSize: 112,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-4px",
            lineHeight: 1,
            marginBottom: 32,
            display: "flex",
          }}
        >
          Vendza
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 34,
            color: "#9CA3AF",
            marginBottom: 56,
            display: "flex",
          }}
        >
          Seu pedido. Do jeito que você quer.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#2D5A3D",
            color: "#FFFFFF",
            fontSize: 26,
            fontWeight: 600,
            padding: "18px 40px",
            borderRadius: 999,
          }}
        >
          Peça agora
        </div>

        {/* Ponto decorativo canto inferior direito */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 100,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "#2D5A3D",
            opacity: 0.08,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
