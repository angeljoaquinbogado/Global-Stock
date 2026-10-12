import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, BackHandler, Linking, Pressable,
  StyleSheet, Text, View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import WebView from "react-native-webview";
import { ArrowLeft, Camera, RefreshCw, WifiOff, X } from "lucide-react-native";
import LegacyNativeApp from "../../App";
import { loadMobileSupabase } from "../lib/supabase";

const WEB_ORIGIN = "https://globalstocks.vercel.app";
const READY_TIMEOUT_MS = 30000;
type BridgeMessage = { type?: string; value?: string };
const isSafePage = (url: string) => url === "about:blank" ||
  url === WEB_ORIGIN || url.startsWith(WEB_ORIGIN + "/") ||
  url.startsWith(WEB_ORIGIN + "?") || url.startsWith(WEB_ORIGIN + "#");
const injection = "window.__GLOBAL_STOCK_EXPO__=true;true;";

export default function UnifiedApp() {
  const webRef = useRef<React.ElementRef<typeof WebView>>(null);
  const scannedRef = useRef(false);
  const savedLegacySessionRef = useRef<{access_token: string; refresh_token: string} | null>(null);
  const migrationSentRef = useRef(false);
  const webReadyRef = useRef(false);
  const currentUrlRef = useRef(WEB_ORIGIN + "/");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [nativeRecovery, setNativeRecovery] = useState(false);
  const [webKey, setWebKey] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [error, setError] = useState("");
  const [pageStartedAt, setPageStartedAt] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    // Transfer a previously authenticated Expo Keychain session ONCE to the
    // single canonical web app. Do not persist access tokens in React state.
    void (async () => {
      const client = await loadMobileSupabase();
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;
      const { data: verified, error } = await client.auth.getUser();
      if (error || verified.user?.id !== session.user.id || !mounted) return;
      savedLegacySessionRef.current = {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      };
      if (webReadyRef.current) migrateSecureSession();
    })().catch(() => { /* Normal on new installs without a prior Expo login. */ });
    return () => { mounted = false; };
    // The readiness callback handles the reverse race with web initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function migrateSecureSession() {
    if (migrationSentRef.current || !isSafePage(currentUrlRef.current) ||
        !savedLegacySessionRef.current) return;
    const session = savedLegacySessionRef.current;
    savedLegacySessionRef.current = null;
    migrationSentRef.current = true;
    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent('globalstock:native-session'," +
      "{detail:" + JSON.stringify(session) + "}));true;"
    );
  }

  useEffect(() => {
    if (!loading || pageReady || nativeRecovery) return;
    const timer = setTimeout(() => {
      setError("La aplicación tardó demasiado en responder. Podés reintentar sin perder los datos guardados.");
      setLoading(false);
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading, pageReady, pageStartedAt, nativeRecovery]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (cameraOpen) {
        setCameraOpen(false);
        return true;
      }
      if (nativeRecovery) return false;
      if (canGoBack) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [cameraOpen, canGoBack, nativeRecovery]);

  function reload() {
    setError("");
    setPageReady(false);
    webReadyRef.current = false;
    setLoading(true);
    setCameraOpen(false);
    setPageStartedAt(Date.now());
    setWebKey(k => k + 1);
  }

  function emitToPage(type: string, barcode?: string) {
    const detail = barcode ? { barcode } : {};
    // JSON serialization safely quotes barcode values and never executes them.
    const eventName = type === "barcode" ? "globalstock:native-barcode" :
      "globalstock:native-scanner-cancelled";
    webRef.current?.injectJavaScript(
      "window.dispatchEvent(new CustomEvent(" +
      JSON.stringify(eventName) +
      ",{detail:" + JSON.stringify(detail) + "}));true;"
    );
  }

  async function openScanner() {
    if (cameraOpen) return;
    scannedRef.current = false;
    const allowed = cameraPermission?.granted ||
      (await requestCameraPermission()).granted;
    if (!allowed) {
      emitToPage("cancel");
      Alert.alert("Permiso de cámara", "Para escanear, habilitá la cámara en Configuración. También podés ingresar el código manualmente.");
      return;
    }
    setCameraOpen(true);
  }

  function closeScanner() {
    setCameraOpen(false);
    emitToPage("cancel");
  }

  function onBarcode(raw: string) {
    if (scannedRef.current || !raw || raw.length > 180) return;
    scannedRef.current = true;
    setCameraOpen(false);
    emitToPage("barcode", raw);
  }

  function onBridgeMessage(event: { nativeEvent: { data: string } }) {
    let message: BridgeMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
    } catch {
      return;
    }
    if (message.type === "app_ready") {
      webReadyRef.current = true;
      setPageReady(true);
      migrateSecureSession();
      setLoading(false);
      setError("");
    } else if (message.type === "open_scanner") {
      void openScanner();
    } else if (message.type === "close_scanner") {
      closeScanner();
    } else if (message.type === "session_cleared") {
      savedLegacySessionRef.current = null;
      migrationSentRef.current = true;
      void loadMobileSupabase().then(client => client.auth.signOut({ scope: "local" })).catch(() => null);
    }
  }

  function navigate(url: string) {
    if (url === "about:blank") return true;
    if (isSafePage(url)) { currentUrlRef.current = url; return true; }
    if (url.startsWith("https://")) {
      void Linking.openURL(url).catch(() => {
        Alert.alert("No se pudo abrir el enlace", "Probá abrirlo desde el navegador.");
      });
    }
    return false;
  }

  if (nativeRecovery) return <LegacyNativeApp />;

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "bottom"]} style={s.root}>
        <StatusBar style="light" />
        <WebView
          key={webKey}
          ref={webRef}
          source={{ uri: WEB_ORIGIN + "/?source=expo" }}
          style={s.web}
          originWhitelist={[WEB_ORIGIN]}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          mixedContentMode="never"
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          cacheEnabled
          incognito={false}
          injectedJavaScriptBeforeContentLoaded={injection}
          onMessage={onBridgeMessage}
          onShouldStartLoadWithRequest={request => navigate(request.url)}
          onNavigationStateChange={state => {setCanGoBack(state.canGoBack); if(isSafePage(state.url))currentUrlRef.current=state.url;}}
          onLoadStart={() => {
            if (!pageReady) {
              setLoading(true);
              setPageStartedAt(Date.now());
            }
          }}
          onError={e => {
            setError("No se pudo conectar con Global Stock: " + e.nativeEvent.description);
            setLoading(false);
          }}
          onHttpError={e => {
            if (e.nativeEvent.statusCode >= 500 && !pageReady && isSafePage(e.nativeEvent.url)) {
              setError("Global Stock está temporalmente fuera de servicio. Intentá de nuevo.");
              setLoading(false);
            }
          }}
          onContentProcessDidTerminate={reload}
          onRenderProcessGone={reload}
          renderError={() => <View style={s.web}/>}
        />
        {loading && !error && (
          <View pointerEvents="none" style={s.overlay}>
            <ActivityIndicator size="large" color="#D52532"/>
            <Text style={s.title}>Global Stock</Text>
            <Text style={s.muted}>Abriendo tu espacio…</Text>
          </View>
        )}
        {!!error && (
          <View style={s.overlay}>
            <WifiOff size={36} color="#E65361" />
            <Text style={s.title}>No pudimos abrir Global Stock</Text>
            <Text style={s.muted}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={reload} style={s.primary}>
              <RefreshCw size={17} color="#fff" />
              <Text style={s.primaryText}>Reintentar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setNativeRecovery(true)} style={s.secondary}>
              <Text style={s.secondaryText}>Recuperar borradores del modo anterior</Text>
            </Pressable>
          </View>
        )}
        {cameraOpen && (
          <View style={s.cameraOverlay}>
            <View style={s.cameraHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar escáner" onPress={closeScanner} style={s.cameraClose}>
                <ArrowLeft size={22} color="#fff" />
                <Text style={s.cameraTitle}>Volver</Text>
              </Pressable>
              <Text style={s.cameraTitle}>Escanear producto</Text>
              <Camera size={22} color="#fff"/>
            </View>
            <CameraView
              style={s.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr", "codabar"] }}
              onBarcodeScanned={({ data }) => onBarcode(data)}
            />
            <View pointerEvents="none" style={s.reticle}/>
            <View style={s.cameraFoot}>
              <Text style={s.cameraHint}>Enfocá el código de barras o QR.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar escáner" style={s.cameraCancel} onPress={closeScanner}>
                <X size={17} color="#fff"/><Text style={s.primaryText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#09090B" },
  web: { flex: 1, backgroundColor: "#09090B" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "#09090B", justifyContent: "center", alignItems: "center", padding: 28, gap: 16 },
  title: { color: "#F7F7F9", fontSize: 22, fontWeight: "800", textAlign: "center" },
  muted: { color: "#B6B6BE", fontSize: 14, lineHeight: 21, textAlign: "center" },
  primary: { backgroundColor: "#990010", paddingHorizontal: 20, minHeight: 50, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  secondary: { padding: 12 },
  secondaryText: { color: "#BABAC4", textAlign: "center", fontSize: 12, textDecorationLine: "underline" },
  cameraOverlay: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: "#070708" },
  cameraHeader: { height: 68, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cameraClose: { flexDirection: "row", gap: 8, alignItems: "center" },
  cameraTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  camera: { flex: 1 },
  reticle: { pointerEvents: "none", position: "absolute", top: "39%", left: "12%", right: "12%", height: 185, borderWidth: 2, borderColor: "#E02737", borderRadius: 20 },
  cameraFoot: { gap: 12, alignItems: "center", padding: 20, backgroundColor: "#070708" },
  cameraHint: { color: "#CBCBD0", fontSize: 14 },
  cameraCancel: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#222228", paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14 },
});
