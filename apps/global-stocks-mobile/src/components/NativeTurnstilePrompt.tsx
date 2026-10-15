import { useState } from "react";
import {
  ActivityIndicator, Modal, Pressable, StyleSheet, Text, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const HOSTED_URL = "https://globalstocks.vercel.app/auth/turnstile";

/**
 * Turnstile must run on the authorized Cloudflare hostname, not exp:// or a
 * file:// page in Expo Go. The hosted web page uses the PUBLIC site key and
 * sends a short-lived token over the WebView bridge. The native app forwards
 * the token directly to Supabase Auth, which validates it server-side.
 */
export function NativeTurnstilePrompt({
  visible, onVerified, onCancel
}: {
  visible: boolean;
  onVerified: (token: string) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  return (
    <Modal visible={visible} animationType="slide" transparent={false}
      presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.heading}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Verificación de seguridad</Text>
            <Text style={styles.subtitle}>Protección contra accesos automatizados</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar verificación"
            onPress={onCancel} style={styles.close}>
            <Text style={styles.closeText}>Cancelar</Text>
          </Pressable>
        </View>
        {loading && <ActivityIndicator accessibilityLabel="Cargando verificación"
          color="#A50017" size="small" style={{ marginTop: 25 }} />}
        <WebView
          source={{ uri: HOSTED_URL }}
          originWhitelist={["https://*"]}
          javaScriptEnabled
          domStorageEnabled={false}
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled={false}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError("No se pudo cargar la verificación. Revisá tu conexión."); }}
          onHttpError={event => {
            if (event.nativeEvent.statusCode >= 400) {
              setError("No se pudo cargar la verificación de seguridad.");
            }
          }}
          onMessage={event => {
            if (!visible || event.nativeEvent.url?.split("?")[0] !== HOSTED_URL) return;
            try {
              const response = JSON.parse(event.nativeEvent.data) as { type?: string; token?: string };
              if (response.type === "verified" &&
                typeof response.token === "string" &&
                response.token.length > 20 &&
                response.token.length <= 2048 &&
                /^[A-Za-z0-9._-]+$/.test(response.token)) {
                onVerified(response.token);
              } else if (response.type === "error") {
                setError("La verificación no se pudo completar. Intentá nuevamente o usá la web.");
              } else if (response.type === "expired") {
                setError("La verificación expiró. Cancelá y volvé a intentarlo.");
              }
            } catch { setError("Respuesta de verificación inválida."); }
          }}
          style={styles.webview}
          accessibilityLabel="Verificación Cloudflare Turnstile"
        />
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Text style={styles.footer}>La comprobación se realiza en globalstocks.vercel.app.</Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF8F7", padding: 16 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: "800", color: "#282025" },
  subtitle: { fontSize: 12, marginTop: 4, color: "#70686A" },
  close: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  closeText: { fontSize: 13, color: "#8F0000", fontWeight: "700" },
  webview: { flex: 1, backgroundColor: "#FAF8F7" },
  error: { color: "#9F001D", fontSize: 12, marginTop: 10 },
  footer: { color: "#777077", textAlign: "center", fontSize: 11, paddingVertical: 10 }
});
