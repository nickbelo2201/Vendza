"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("leaflet-draw");

// Cores para as zonas (6 cores com boa distinção visual)
const CORES_ZONAS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ec4899", "#06b6d4"];

export type ZonaGeometria =
  | {
      tipo: "circle";
      centerLat: number;
      centerLng: number;
      radiusKm: number;
    }
  | {
      tipo: "polygon";
      points: [number, number][]; // array de [lat, lng]
    };

export type ZonaNoMapa = {
  zonaId: string;
  geometria: ZonaGeometria;
  nome: string;
  ativo: boolean;
};

type Props = {
  centerLat: number;
  centerLng: number;
  zonas: ZonaNoMapa[];
  selectedZonaId: string | null;
  onZonaCriada: (zonaId: string, geometria: ZonaGeometria) => void;
  onZonaSelecionada: (zonaId: string) => void;
  onZonaRemovida: (zonaId: string) => void;
};

export function MapaInterativo({
  centerLat,
  centerLng,
  zonas,
  selectedZonaId,
  onZonaCriada,
  onZonaSelecionada,
  onZonaRemovida,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null);
  const zonaLayersRef = useRef<Map<string, L.Layer>>(new Map());

  // Guardar callbacks em refs para evitar re-registro de eventos no mapa
  const onZonaCriadaRef = useRef(onZonaCriada);
  const onZonaSelecionadaRef = useRef(onZonaSelecionada);
  const onZonaRemovidaRef = useRef(onZonaRemovida);

  useEffect(() => {
    onZonaCriadaRef.current = onZonaCriada;
  }, [onZonaCriada]);
  useEffect(() => {
    onZonaSelecionadaRef.current = onZonaSelecionada;
  }, [onZonaSelecionada]);
  useEffect(() => {
    onZonaRemovidaRef.current = onZonaRemovida;
  }, [onZonaRemovida]);

  // Inicializar mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([centerLat, centerLng], 13);
    mapRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Marcador da loja
    const lojaIcon = L.divIcon({
      html: `<div style="background:var(--green,#2D6A4F);border:2px solid white;border-radius:50%;width:14px;height:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([centerLat, centerLng], { icon: lojaIcon })
      .bindTooltip("Sua loja")
      .addTo(map);

    // FeatureGroup para as camadas desenhadas
    const drawnLayers = new L.FeatureGroup();
    drawnLayersRef.current = drawnLayers;
    drawnLayers.addTo(map);

    // Toolbar de desenho leaflet-draw
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LAny = L as any;
    const drawControl = new LAny.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: "#3b82f6", weight: 2, fillOpacity: 0.2 },
        },
        circle: {
          shapeOptions: { color: "#3b82f6", weight: 2, fillOpacity: 0.2 },
        },
        rectangle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnLayers,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Evento: zona criada pelo usuário
    map.on(LAny.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      const zonaId = `zona-${Date.now()}`;
      drawnLayers.addLayer(layer);

      let geometria: ZonaGeometria;
      if (e.layerType === "circle") {
        const center = (layer as L.Circle).getLatLng();
        const radiusM = (layer as L.Circle).getRadius();
        geometria = {
          tipo: "circle",
          centerLat: center.lat,
          centerLng: center.lng,
          radiusKm: radiusM / 1000,
        };
      } else {
        const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
        geometria = {
          tipo: "polygon",
          points: latlngs.map((ll) => [ll.lat, ll.lng] as [number, number]),
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layer as any)._zonaId = zonaId;
      layer.on("click", () => onZonaSelecionadaRef.current(zonaId));
      onZonaCriadaRef.current(zonaId, geometria);
    });

    // Evento: zona(s) removida(s) via toolbar
    map.on(LAny.Draw.Event.DELETED, (e: any) => {
      e.layers.eachLayer((layer: any) => {
        if (layer._zonaId) onZonaRemovidaRef.current(layer._zonaId);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Inicialização depende apenas das coordenadas da loja — não reexecutar por mudanças de estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar zonas existentes no mapa quando a prop muda
  useEffect(() => {
    const map = mapRef.current;
    const drawnLayers = drawnLayersRef.current;
    if (!map || !drawnLayers) return;

    // Remover camadas que não existem mais
    zonaLayersRef.current.forEach((layer) => drawnLayers.removeLayer(layer));
    zonaLayersRef.current.clear();

    // Re-adicionar todas as zonas com estilo atualizado
    zonas.forEach((zona, idx) => {
      const cor = CORES_ZONAS[idx % CORES_ZONAS.length];
      const isSelected = zona.zonaId === selectedZonaId;
      const styleOpts = {
        color: cor,
        weight: isSelected ? 3 : 2,
        fillColor: cor,
        fillOpacity: 0.25,
        dashArray: isSelected ? undefined : "4 2",
      };

      let layer: L.Layer;
      if (zona.geometria.tipo === "circle") {
        layer = L.circle(
          [zona.geometria.centerLat, zona.geometria.centerLng],
          { radius: zona.geometria.radiusKm * 1000, ...styleOpts }
        );
      } else {
        layer = L.polygon(zona.geometria.points, styleOpts);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layer as any)._zonaId = zona.zonaId;
      layer.on("click", () => onZonaSelecionadaRef.current(zona.zonaId));
      (layer as L.Path).bindTooltip(zona.nome || "Zona sem nome");
      drawnLayers.addLayer(layer);
      zonaLayersRef.current.set(zona.zonaId, layer);
    });
  }, [zonas, selectedZonaId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", borderRadius: "10px 0 0 10px" }}
    />
  );
}
