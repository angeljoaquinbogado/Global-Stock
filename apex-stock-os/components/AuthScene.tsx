"use client";

export function AuthScene() {
  return (
    <div
      className="gs-auth-scene absolute inset-0 overflow-hidden bg-black"
      aria-hidden="true"
    >
      <div className="gs-space-layer gs-space-layer-a absolute -inset-[8%]" />
      <div className="gs-space-layer gs-space-layer-b absolute -inset-[10%]" />

      <div className="gs-earth-stage absolute inset-0 grid place-items-center">
        <div className="gs-earth-wrap relative">
          <img
            src="/global-stock-earth.png"
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="high"
            className="gs-earth-image h-full w-full select-none object-contain"
          />

          <div className="gs-earth-shade pointer-events-none absolute inset-[4%] rounded-full" />

          <div className="gs-orbit-plane gs-orbit-plane-a" aria-hidden="true">
            <div className="gs-orbit-line gs-orbit-line-a" />
            <span className="gs-orbit-node gs-orbit-node-a" />
          </div>

          <div className="gs-orbit-plane gs-orbit-plane-b" aria-hidden="true">
            <div className="gs-orbit-line gs-orbit-line-b" />
            <span className="gs-orbit-node gs-orbit-node-b" />
          </div>

          <div className="gs-orbit-plane gs-orbit-plane-c" aria-hidden="true">
            <div className="gs-orbit-line gs-orbit-line-c" />
            <span className="gs-orbit-node gs-orbit-node-c" />
          </div>
        </div>
      </div>

      <div className="gs-auth-horizon pointer-events-none absolute left-1/2 top-1/2 h-px w-[min(78vw,980px)] -translate-x-1/2" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.05)_50%,rgba(0,0,0,.66)_100%)]" />
    </div>
  );
}
