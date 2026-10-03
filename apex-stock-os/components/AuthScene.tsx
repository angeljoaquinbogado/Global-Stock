"use client";

import { GlobalStockGlobe } from "./GlobalStockGlobe";

export function AuthScene({
  active = true,
  panelVisible = false
}: {
  active?: boolean;
  panelVisible?: boolean;
}) {
  return (
    <div
      className="gs-auth-scene gs-auth-scene-active absolute inset-0 overflow-hidden bg-black"
      data-scene-active={active ? "true" : "false"}
      data-panel-visible={panelVisible ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="gs-space-layer gs-space-layer-a absolute -inset-[8%]" />
      <div className="gs-space-layer gs-space-layer-b absolute -inset-[10%]" />

      <div className="gs-earth-stage absolute inset-0 grid place-items-center">
        <div className="gs-earth-wrap relative">
          <GlobalStockGlobe />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.05)_50%,rgba(0,0,0,.68)_100%)]" />
    </div>
  );
}
