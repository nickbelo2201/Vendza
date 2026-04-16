const shimmerCSS = `
@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
.skel {
  background: #e8e4de;
  border-radius: 8px;
  animation: shimmer 1.5s ease-in-out infinite;
}
`;

export default function Loading() {
  return (
    <div>
      <style>{shimmerCSS}</style>

      {/* Header mock */}
      <div
        className="skel"
        style={{ height: 60, marginBottom: 24, borderRadius: 0 }}
      />

      {/* Grid de cards de produto */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          padding: "0 16px",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="skel"
            style={{ aspectRatio: "3/4", borderRadius: 12 }}
          />
        ))}
      </div>
    </div>
  );
}
