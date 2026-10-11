import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";

type Page = "inicio" | "inventario" | "escanear" | "ventas";
type DemoItem = { id: string; name: string; code: string; stock: number; price: number };

const sample: DemoItem[] = [
  { id: "1", name: "Reel de pesca (ejemplo)", code: "7791234567895", stock: 24, price: 48900 },
  { id: "2", name: "Línea multifilamento (ejemplo)", code: "7791234567896", stock: 8, price: 12700 },
  { id: "3", name: "Caña telescópica (ejemplo)", code: "7791234567897", stock: 4, price: 85500 }
];

const colors = {
  bg: "#090A0D",
  surface: "#15161B",
  elevated: "#1C1D24",
  line: "#32343B",
  text: "#FAFAFC",
  muted: "#ABB0BC",
  red: "#BF101E",
  green: "#6ADCB4",
  yellow: "#F8C57D"
};

function FormatPrice({ amount }: { amount: number }) {
  return <Text style={styles.price}>{"$ " + amount.toLocaleString("es-AR")}</Text>;
}

export default function PreviewMode() {
  const [page, setPage] = useState<Page>("inicio");
  const [query, setQuery] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sample.filter((product) =>
      !q || product.name.toLowerCase().includes(q) || product.code.includes(q)
    );
  }, [query]);

  function openScanner() {
    setScanned(false);
    setPage("escanear");
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.mark}><Text style={styles.markText}>G</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Global <Text style={styles.brandRed}>Stock</Text></Text>
          <Text style={styles.headerSub}>App móvil · React Native + Expo</Text>
        </View>
        <View style={styles.previewPill}><Text style={styles.previewText}>DEMO</Text></View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.notice}>
          <Text style={styles.noticeHead}>ESTÁS EN NUESTRA APP</Text>
          <Text style={styles.noticeText}>
            Esta es la vista previa de Global Stock. Son datos ficticios:
            falta configurar la clave pública de Supabase para iniciar sesión
            y consultar los datos reales de tu negocio.
          </Text>
        </View>

        {page === "inicio" ? (
          <>
            <Text style={styles.kicker}>GLOBAL STOCK · MÓVIL</Text>
            <Text style={styles.title}>Todo tu negocio, en tus manos.</Text>
            <Text style={styles.subtitle}>Una app para controlar inventario, ventas, caja y productos desde cualquier lugar.</Text>

            <View style={styles.metrics}>
              {[
                { title: "Productos", value: "3", note: "De ejemplo" },
                { title: "Unidades", value: "36", note: "Inventario demo" },
                { title: "Stock bajo", value: "1", note: "Atención" },
                { title: "Conexión", value: "Demo", note: "Sin Supabase" }
              ].map((item) => (
                <View key={item.title} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{item.title}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                  <Text style={styles.metricNote}>{item.note}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={() => setPage("inventario")}
            >
              <Text style={styles.primaryButtonText}>Consultar inventario →</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={openScanner}
            >
              <Text style={styles.secondaryButtonText}>Abrir lector de códigos →</Text>
            </Pressable>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Para conectar tu cuenta real</Text>
              <Text style={styles.cardBody}>
                Configurá EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
                en el archivo .env de la app móvil. Reiniciá Expo después.
                Nunca agregues service_role ni secretos privados.
              </Text>
            </View>
          </>
        ) : null}

        {page === "inventario" ? (
          <>
            <Text style={styles.kicker}>INVENTARIO · DEMOSTRACIÓN</Text>
            <Text style={styles.title}>Tus productos.</Text>
            <Text style={styles.subtitle}>Buscá por nombre o código y probá la interfaz sin datos reales.</Text>
            <TextInput
              style={styles.search}
              placeholder="Buscar productos o códigos"
              placeholderTextColor="#858996"
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Buscar en el inventario de demostración"
              autoCapitalize="none"
            />
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{results.length} productos demo</Text>
              <Pressable accessibilityRole="button" onPress={openScanner}>
                <Text style={styles.link}>Escanear →</Text>
              </Pressable>
            </View>
            {results.map((product) => (
              <View style={styles.product} key={product.id}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>Código de ejemplo: {product.code}</Text>
                  <Text style={styles.stock}>{product.stock} unidades · DEMO</Text>
                </View>
                <FormatPrice amount={product.price} />
              </View>
            ))}
            {results.length === 0 ? (
              <Text style={styles.subtitle}>No hay productos de ejemplo para ese código.</Text>
            ) : null}
          </>
        ) : null}

        {page === "escanear" ? (
          <>
            <Text style={styles.kicker}>CÁMARA</Text>
            <Text style={styles.title}>Escaneá un código.</Text>
            <Text style={styles.subtitle}>Lector real de cámara. Los productos mostrados todavía son de demostración.</Text>
            {!permission ? <ActivityIndicator color={colors.red} /> : !permission.granted ? (
              <Pressable
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={() => void requestPermission()}
              >
                <Text style={styles.primaryButtonText}>Permitir acceso a la cámara</Text>
              </Pressable>
            ) : (
              <View style={styles.cameraBox}>
                <CameraView
                  facing="back"
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"]
                  }}
                  onBarcodeScanned={scanned ? undefined : ({ data }) => {
                    setScanned(true);
                    setQuery(data);
                    setPage("inventario");
                  }}
                />
                <View pointerEvents="none" style={styles.scanFrame} />
              </View>
            )}
            <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => setPage("inventario")}>
              <Text style={styles.secondaryButtonText}>Volver a inventario</Text>
            </Pressable>
          </>
        ) : null}

        {page === "ventas" ? (
          <>
            <Text style={styles.kicker}>VENTAS · CAJA</Text>
            <Text style={styles.title}>Preparada para crecer.</Text>
            <View style={styles.notice}>
              <Text style={styles.noticeHead}>SIN COBROS EN EL MODO DEMO</Text>
              <Text style={styles.noticeText}>
                Las ventas offline reales solo estarán disponibles después
                de validar permisos, stock y confirmaciones atómicas del servidor.
                Este modo no cobra, no vende y no modifica el inventario.
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Próximas herramientas</Text>
              <Text style={styles.cardBody}>Carrito · Caja · Historial · Reportes · Sincronización segura</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.bottom}>
        {([
          ["inicio", "Inicio"],
          ["inventario", "Inventario"],
          ["escanear", "Escanear"],
          ["ventas", "Ventas"]
        ] as const).map(([id, label]) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: page === id }}
            style={[styles.tab, page === id && styles.tabActive]}
            onPress={() => id === "escanear" ? openScanner() : setPage(id)}
          >
            <Text style={[styles.tabLabel, page === id && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", paddingHorizontal: 18, paddingVertical: 16,
    borderBottomColor: colors.line, borderBottomWidth: 1, gap: 10, alignItems: "center"
  },
  mark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.red, alignItems: "center", justifyContent: "center" },
  markText: { color: colors.text, fontSize: 24, fontWeight: "900" },
  brand: { color: colors.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.5 },
  brandRed: { color: "#FC626C" },
  headerSub: { color: colors.muted, fontSize: 10, marginTop: 2 },
  previewPill: { paddingVertical: 6, paddingHorizontal: 9, backgroundColor: "#2B1820", borderRadius: 7, borderWidth: 1, borderColor: "#7A3540" },
  previewText: { color: "#FF969B", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 18, paddingVertical: 20, gap: 16, paddingBottom: 35 },
  notice: { borderColor: "#67424A", borderWidth: 1, borderRadius: 13, padding: 13, gap: 7, backgroundColor: "#21161B" },
  noticeHead: { fontSize: 11, fontWeight: "900", color: "#FF828C", letterSpacing: 0.7 },
  noticeText: { color: "#F0CBD0", fontSize: 12, lineHeight: 19 },
  kicker: { color: "#F25C67", fontSize: 10, letterSpacing: 1.8, fontWeight: "900", marginTop: 10 },
  title: { color: colors.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.5, lineHeight: 33 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  metrics: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  metricCard: { width: "48%", minHeight: 110, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 14, borderRadius: 14, justifyContent: "space-between" },
  metricLabel: { color: colors.muted, fontSize: 11 },
  metricValue: { color: colors.text, fontSize: 25, fontWeight: "800" },
  metricNote: { color: colors.green, fontSize: 10 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButton: { backgroundColor: colors.red, padding: 15, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: colors.text, fontWeight: "800", fontSize: 13 },
  secondaryButton: { backgroundColor: colors.elevated, borderColor: colors.line, borderWidth: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  secondaryButtonText: { color: colors.text, fontWeight: "800", fontSize: 13 },
  card: { borderRadius: 15, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.surface, padding: 15, gap: 8 },
  cardHeading: { color: colors.text, fontWeight: "800", fontSize: 15 },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  search: { borderRadius: 12, backgroundColor: colors.elevated, borderColor: colors.line, borderWidth: 1, padding: 14, color: colors.text, fontSize: 14 },
  product: { padding: 13, gap: 8, borderRadius: 13, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, flexDirection: "row" },
  productName: { color: colors.text, fontSize: 13, fontWeight: "800" },
  productMeta: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  stock: { color: colors.green, fontSize: 11, marginTop: 5 },
  price: { color: colors.text, fontSize: 12, fontWeight: "800" },
  link: { color: "#FE858C", fontSize: 12, fontWeight: "800" },
  cameraBox: { height: 300, borderRadius: 16, overflow: "hidden", backgroundColor: "#000", position: "relative" },
  scanFrame: { position: "absolute", top: "23%", bottom: "23%", left: "14%", right: "14%", borderRadius: 20, borderWidth: 2, borderColor: colors.red },
  bottom: { flexDirection: "row", gap: 4, padding: 7, borderTopWidth: 1, borderTopColor: colors.line },
  tab: { flex: 1, paddingVertical: 14, borderRadius: 9, alignItems: "center" },
  tabActive: { backgroundColor: "#7D1420" },
  tabLabel: { fontSize: 11, color: colors.muted, fontWeight: "800" },
  tabLabelActive: { color: colors.text }
});
