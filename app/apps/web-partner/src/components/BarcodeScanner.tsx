"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onDetected: (barcode: string) => void;
  onFechar: () => void;
};

export function BarcodeScanner({ onDetected, onFechar }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const scannerRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current) return;

        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result, error) => {
            if (!ativo) return;
            if (result) {
              setSucesso(true);
              controls.stop();
              setTimeout(() => {
                if (ativo) onDetected(result.getText());
              }, 600);
            } else if (error && !(error instanceof Error && error.message.includes("No MultiFormat"))) {
              // ignorar erros de "nenhum código encontrado" — são esperados
            }
          },
        );

        scannerRef.current = controls;
      } catch (e) {
        if (ativo) {
          setErro(
            e instanceof Error && e.message.includes("NotAllowed")
              ? "Acesso à câmera negado. Permita o acesso nas configurações do navegador."
              : "Não foi possível acessar a câmera.",
          );
        }
      }
    }

    void iniciar();

    return () => {
      ativo = false;
      scannerRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Botão fechar */}
      <button
        type="button"
        onClick={onFechar}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {erro ? (
        <div style={{ color: "#fff", textAlign: "center", padding: "0 32px", maxWidth: 360 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" style={{ marginBottom: 16 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: 15, lineHeight: 1.5 }}>{erro}</p>
          <button
            type="button"
            onClick={onFechar}
            style={{
              marginTop: 20,
              padding: "10px 24px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Fechar
          </button>
        </div>
      ) : (
        <>
          {/* Viewfinder */}
          <div style={{ position: "relative", width: 280, height: 280 }}>
            <video
              ref={videoRef}
              style={{
                width: 280,
                height: 280,
                objectFit: "cover",
                borderRadius: 12,
                display: sucesso ? "none" : "block",
              }}
              muted
              playsInline
            />
            {sucesso && (
              <div style={{
                width: 280,
                height: 280,
                borderRadius: 12,
                background: "rgba(16,185,129,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
            )}

            {/* Cantos do viewfinder */}
            {!sucesso && (
              <>
                {/* Canto superior esquerdo */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 24, height: 24, borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "4px 0 0 0" }} />
                {/* Canto superior direito */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 24, height: 24, borderTop: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 4px 0 0" }} />
                {/* Canto inferior esquerdo */}
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 24, height: 24, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "0 0 0 4px" }} />
                {/* Canto inferior direito */}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 0 4px 0" }} />

                {/* Linha de scan animada */}
                <div style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  height: 2,
                  background: "linear-gradient(90deg, transparent, #4f46e5, transparent)",
                  animation: "scanLine 2s ease-in-out infinite",
                  top: "50%",
                }} />
              </>
            )}
          </div>

          <p style={{
            color: sucesso ? "#10b981" : "rgba(255,255,255,0.8)",
            marginTop: 24,
            fontSize: 14,
            fontWeight: 500,
          }}>
            {sucesso ? "Código detectado!" : "Aponte a câmera para o código de barras"}
          </p>
        </>
      )}

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
}
