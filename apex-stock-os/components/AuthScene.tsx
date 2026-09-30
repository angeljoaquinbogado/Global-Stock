"use client";

import type { Viewer as CesiumViewer } from "cesium";
import { useEffect, useMemo, useRef, useState } from "react";

type ViewerAnchor = {
  lat: number;
  lng: number;
};

const TIMEZONE_ANCHORS: Record<string, ViewerAnchor> = {
  "America/Argentina/Buenos_Aires": { lat: -34.6037, lng: -58.3816 },
  "America/Sao_Paulo": { lat: -23.5505, lng: -46.6333 },
  "America/Mexico_City": { lat: 19.4326, lng: -99.1332 },
  "America/New_York": { lat: 40.7128, lng: -74.006 },
  "America/Chicago": { lat: 41.8781, lng: -87.6298 },
  "America/Denver": { lat: 39.7392, lng: -104.9903 },
  "America/Los_Angeles": { lat: 34.0522, lng: -118.2437 },
  "America/Toronto": { lat: 43.6532, lng: -79.3832 },
  "America/Bogota": { lat: 4.711, lng: -74.0721 },
  "America/Lima": { lat: -12.0464, lng: -77.0428 },
  "America/Santiago": { lat: -33.4489, lng: -70.6693 },
  "Europe/Madrid": { lat: 40.4168, lng: -3.7038 },
  "Europe/London": { lat: 51.5072, lng: -0.1276 },
  "Europe/Paris": { lat: 48.8566, lng: 2.3522 },
  "Europe/Berlin": { lat: 52.52, lng: 13.405 },
  "Europe/Rome": { lat: 41.9028, lng: 12.4964 },
  "Europe/Lisbon": { lat: 38.7223, lng: -9.1393 },
  "Africa/Cairo": { lat: 30.0444, lng: 31.2357 },
  "Africa/Johannesburg": { lat: -26.2041, lng: 28.0473 },
  "Asia/Dubai": { lat: 25.2048, lng: 55.2708 },
  "Asia/Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Asia/Singapore": { lat: 1.3521, lng: 103.8198 },
  "Asia/Tokyo": { lat: 35.6762, lng: 139.6503 },
  "Asia/Seoul": { lat: 37.5665, lng: 126.978 },
  "Australia/Sydney": { lat: -33.8688, lng: 151.2093 }
};

function fallbackAnchor(timeZone: string): ViewerAnchor {
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  const fallbackLng = Math.max(-175, Math.min(175, offsetHours * 15));

  if (timeZone.startsWith("America/")) return { lat: 18, lng: fallbackLng };
  if (timeZone.startsWith("Europe/")) return { lat: 48, lng: fallbackLng };
  if (timeZone.startsWith("Asia/")) return { lat: 24, lng: fallbackLng };
  if (timeZone.startsWith("Africa/")) return { lat: 8, lng: fallbackLng };
  if (timeZone.startsWith("Australia/")) return { lat: -25, lng: fallbackLng };

  return { lat: 8, lng: fallbackLng };
}

export function AuthScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [failed, setFailed] = useState(false);
  const timeZone = useMemo(
    () =>
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        : "UTC",
    []
  );
  const anchor = useMemo(
    () => TIMEZONE_ANCHORS[timeZone] ?? fallbackAnchor(timeZone),
    [timeZone]
  );

  useEffect(() => {
    let cancelled = false;
    let removePreRender: (() => void) | null = null;
    let introTimer: number | null = null;

    async function boot() {
      if (!containerRef.current) return;

      try {
        const runtimeWindow = window as Window & {
          CESIUM_BASE_URL?: string;
        };
        runtimeWindow.CESIUM_BASE_URL = "/cesium/";

        const Cesium = await import("cesium");
        if (cancelled || !containerRef.current) return;

        const mobile =
          window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        const options = {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          infoBox: false,
          selectionIndicator: false,
          fullscreenButton: false,
          shouldAnimate: true,
          baseLayer: false
        };

        const viewer = new Cesium.Viewer(
          containerRef.current,
          options as never
        );
        viewerRef.current = viewer;

        viewer.targetFrameRate = mobile ? 45 : 60;
        viewer.resolutionScale = mobile
          ? Math.min(window.devicePixelRatio || 1, 0.9)
          : Math.min(window.devicePixelRatio || 1, 1.15);

        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.sun.show = true;
        viewer.scene.moon.show = true;
        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.globe.maximumScreenSpaceError = mobile ? 3.1 : 1.8;
        viewer.scene.fog.enabled = false;
        viewer.scene.requestRenderMode = false;
        viewer.scene.highDynamicRange = !mobile;
        viewer.scene.screenSpaceCameraController.enableInputs = false;

        viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
        viewer.clock.shouldAnimate = true;
        viewer.clock.multiplier = 1;

        viewer.imageryLayers.removeAll();

        const imagery = new Cesium.UrlTemplateImageryProvider({
          url:
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maximumLevel: 18,
          credit:
            "Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        });

        viewer.imageryLayers.addImageryProvider(imagery);

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            anchor.lng - 22,
            anchor.lat + 8,
            26_000_000
          ),
          orientation: {
            heading: Cesium.Math.toRadians(12),
            pitch: Cesium.Math.toRadians(-88),
            roll: 0
          }
        });

        introTimer = window.setTimeout(() => {
          if (cancelled || viewer.isDestroyed()) return;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              anchor.lng,
              anchor.lat,
              mobile ? 15_500_000 : 13_500_000
            ),
            orientation: {
              heading: Cesium.Math.toRadians(8),
              pitch: Cesium.Math.toRadians(-89),
              roll: 0
            },
            duration: 4.55,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
          });
        }, 180);

        let last = performance.now();
        const onPreRender = () => {
          if (cancelled || viewer.isDestroyed()) return;

          const now = performance.now();
          const deltaSeconds = Math.min((now - last) / 1000, 0.05);
          last = now;

          if (now > 5200) {
            viewer.camera.rotate(
              Cesium.Cartesian3.UNIT_Z,
              -deltaSeconds * 0.0024
            );
          }

          viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
        };

        viewer.scene.preRender.addEventListener(onPreRender);
        removePreRender = () =>
          viewer.scene.preRender.removeEventListener(onPreRender);

        const canvas = viewer.canvas;
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.outline = "none";

        const creditContainer =
          viewer.cesiumWidget.creditContainer as HTMLElement | undefined;
        if (creditContainer) {
          creditContainer.style.fontSize = "8px";
          creditContainer.style.opacity = "0.55";
          creditContainer.style.pointerEvents = "none";
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (introTimer !== null) window.clearTimeout(introTimer);
      removePreRender?.();

      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, [anchor.lat, anchor.lng]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {failed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,#14161d_0%,#05060a_38%,#000_78%)]" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_42%_50%,transparent_0%,rgba(0,0,0,.03)_42%,rgba(0,0,0,.68)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.12)_0%,rgba(0,0,0,.02)_48%,rgba(0,0,0,.44)_100%)]" />
    </div>
  );
}
