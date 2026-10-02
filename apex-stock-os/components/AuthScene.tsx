"use client";

import Image from "next/image";

import { GlobalConnectionOverlay } from "./GlobalConnectionOverlay";

export function AuthScene({ active = true }: { active?: boolean }) {
  return (
    <div
      className={
        "gs-auth-scene absolute inset-0 overflow-hidden bg-black " +
        (active ? "gs-auth-scene-active" : "gs-auth-scene-rest")
      }
      aria-hidden="true"
    >
      <div className="gs-space-layer gs-space-layer-a absolute -inset-[8%]" />
      <div className="gs-space-layer gs-space-layer-b absolute -inset-[10%]" />

      <div className="gs-earth-stage absolute inset-0 grid place-items-center">
        <div className="gs-earth-wrap relative">
          <Image
            src="/global-stock-earth.png"
            alt=""
            width={1254}
            height={1254}
            sizes="(max-width: 640px) 104vw, (max-width: 1000px) 76vw, 760px"
            draggable={false}
            preload
            className="gs-earth-image h-full w-full select-none object-contain"
          />

          <div className="gs-earth-shade pointer-events-none absolute inset-[4%] rounded-full" />

          <GlobalConnectionOverlay />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.05)_50%,rgba(0,0,0,.66)_100%)]" />
    </div>
  );
}
