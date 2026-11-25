import "./download.css";

export default function DownloadLoading() {
  return (
    <div
      className="dl-page dl-skeleton-screen"
      role="status"
      aria-live="polite"
      aria-label="Cargando Global Stock"
    >
      <span className="dl-sr-only">Cargando contenido de Global Stock...</span>

      {/* Silueta de la barra superior */}
      <div className="dl-nav-wrap" aria-hidden="true">
        <div className="dl-nav-pill">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span className="dl-skel dl-skel-circle" style={{ width: 30, height: 30 }} />
            <span className="dl-skel" style={{ width: 102, height: 16 }} />
          </div>

          <div className="dl-dock-nav" style={{ gap: "0.5rem" }}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="dl-skel dl-skel-circle"
                style={{ width: 34, height: 34 }}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span className="dl-skel dl-skel-circle" style={{ width: 38, height: 38 }} />
            <span className="dl-skel dl-skel-pill" style={{ width: 96, height: 38 }} />
          </div>
        </div>
      </div>

      {/* Silueta del Hero y Showcase */}
      <main className="dl-hero" aria-hidden="true">
        <div className="dl-container">
          <div className="dl-hero-grid">
            <div>
              <span className="dl-skel dl-skel-pill" style={{ width: 230, height: 30 }} />
              <div style={{ marginTop: "0.95rem", display: "grid", gap: "0.55rem", maxWidth: 620 }}>
                <span className="dl-skel" style={{ width: "92%", height: 38 }} />
                <span className="dl-skel" style={{ width: "68%", height: 38 }} />
              </div>
              <div style={{ marginTop: "0.95rem", display: "grid", gap: "0.45rem", maxWidth: 560 }}>
                <span className="dl-skel" style={{ width: "96%", height: 16 }} />
                <span className="dl-skel" style={{ width: "78%", height: 16 }} />
              </div>
              <div className="dl-hero-actions">
                <span className="dl-skel" style={{ width: 190, height: 46, borderRadius: 13 }} />
                <span className="dl-skel" style={{ width: 205, height: 46, borderRadius: 13 }} />
              </div>
            </div>

            {/* Silueta del contenedor PC + Celular */}
            <div className="dl-showcase">
              <div className="dl-showcase-bar">
                <div className="dl-showcase-tabs">
                  <span className="dl-skel dl-skel-pill" style={{ width: 118, height: 36 }} />
                  <span className="dl-skel dl-skel-pill" style={{ width: 158, height: 36 }} />
                  <span className="dl-skel dl-skel-pill" style={{ width: 146, height: 36 }} />
                </div>
                <span className="dl-skel" style={{ width: 165, height: 14 }} />
              </div>

              <div className="dl-showcase-stage">
                <div className="dl-skel-stage-silhouette">
                  <div className="dl-skel-pc-card">
                    <div className="dl-skel-row-between">
                      <span className="dl-skel" style={{ width: 140, height: 14 }} />
                      <span className="dl-skel dl-skel-pill" style={{ width: 78, height: 22 }} />
                    </div>
                    <div className="dl-skel-kpi-row">
                      <span className="dl-skel" style={{ height: 54, borderRadius: 12 }} />
                      <span className="dl-skel" style={{ height: 54, borderRadius: 12 }} />
                      <span className="dl-skel" style={{ height: 54, borderRadius: 12 }} />
                    </div>
                    <span className="dl-skel" style={{ width: "100%", height: 110, borderRadius: 12 }} />
                  </div>

                  <div className="dl-skel-phone-card">
                    <span className="dl-skel dl-skel-pill" style={{ width: 54, height: 6, marginInline: "auto" }} />
                    <span className="dl-skel" style={{ width: "75%", height: 14 }} />
                    <span className="dl-skel" style={{ width: "100%", height: 84, borderRadius: 12 }} />
                    <span className="dl-skel" style={{ width: "100%", height: 48, borderRadius: 10 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}