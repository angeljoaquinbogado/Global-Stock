import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Linking, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View
} from "react-native";
import { appAlerts } from "../lib/alerts";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { preferenceStorage as SecureStore } from "../lib/preference-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { SupabaseClient } from "@supabase/supabase-js";
import Svg, { Defs, LinearGradient, Stop, Line, Path } from "react-native-svg";
import {
  Activity, ArrowRight, BarChart3, BellRing, Boxes, CalendarDays, ChartNoAxesCombined,
  Check, ChevronRight, CircleDollarSign, ClipboardList, CreditCard, FileText,
  Globe2, LayoutDashboard, LogOut, Menu, Moon, PackagePlus, RefreshCw,
  ScanLine, Search, Settings2, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Store,
  Sun, Truck, Users, Warehouse, Wallet, WifiOff, X, Plus, Minus
} from "lucide-react-native";
import type { Business, Product, SaleDraft, SaleLine } from "../lib/data";
import { SUPPORT_EMAIL, supportEmailUrl } from "../lib/support";
import ProductForm from "./ProductForm";
import NativeRestockPanel from "./NativeRestockPanel";
import NativeExtraModules, { type ExtraModule } from "./NativeExtraModules";
import NativeBusinessManager from "./NativeBusinessManager";
import NativeAssistant from "./NativeAssistant";
import NativeSettings from "./NativeSettings";
import NativeCashRegister from "./NativeCashRegister";
import NativePrintCenter from "./NativePrintCenter";

type Module = "overview" | "pos" | "cash" | "inventory" | "scan" | "charts" | "activities" |
  "notes" | "purchases" | "suppliers" | "online" | "documents" | "fiscal" | "operations" | "settings";
type Palette = { bg: string; surface: string; elevated: string; border: string; text: string; muted: string; red: string; redIcon: string };
const darkPalette: Palette = { bg: "#09090B", surface: "#171719", elevated: "#202024", border: "#313135", text: "#FAFAFA", muted: "#A3A3AE", red: "#A4000C", redIcon: "#CC1420" };
const lightPalette: Palette = { bg: "#F5F5F7", surface: "#FFFFFF", elevated: "#F1F1F4", border: "#DEDEE5", text: "#16161A", muted: "#6A6A76", red: "#8F0000", redIcon: "#A40A14" };
type DailyPoint = { day: string; profit: number };
type Dashboard = { revenue: number; cost: number; salesCount: number; chart: DailyPoint[] };

type Props = {
  client: SupabaseClient;
  userId: string;
  business: Business;
  businesses: Business[];
  products: Product[];
  source: "loading" | "live" | "cache" | "empty";
  notice: string;
  drafts: SaleDraft[];
  cart: SaleLine[];
  refreshToken: number;
  onRefresh: () => void;
  onBusiness: (business: Business) => void;
  onReloadBusinesses: () => Promise<void>;
  onSignOut: () => void;
  onAdd: (product: Product) => void;
  onAdjust: (productId: string, delta: number) => void;
  onSaveDraft: () => void;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return "$ " + amount.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  }
}

function ProfitTrend({ points, p, showLabels = true }: { points: DailyPoint[]; p: Palette; showLabels?: boolean }) {
  const width = 320, height = 162, top = 21, bottom = 127;
  const values = points.length ? points.map((x) => Number(x.profit) || 0) : Array(7).fill(0) as number[];
  const low = Math.min(0, ...values), high = Math.max(1, ...values);
  const coords = values.map((v, i) => ({
    x: 18 + (i * (width - 36)) / Math.max(1, values.length - 1),
    y: bottom - ((v - low) / (high - low)) * (bottom - top)
  }));
  const line = coords.map((xy, i) => `${i === 0 ? "M" : "L"}${xy.x.toFixed(1)} ${xy.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x} ${bottom} L${coords[0].x} ${bottom} Z`;
  return (
    <View>
      <Svg width="100%" height={showLabels ? 172 : 150} viewBox={`0 0 ${width} ${height}`} accessibilityLabel="Gráfico de ganancia bruta de los últimos siete días">
        <Defs>
          <LinearGradient id="gsProfitFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#B80A16" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#B80A16" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[29, 58, 87, 116].map((y) => <Line key={y} x1="18" y1={y} x2="304" y2={y} stroke={p.border} strokeWidth={0.75} strokeDasharray="1 6" />)}
        <Path d={area} fill="url(#gsProfitFill)" />
        <Path d={line} fill="none" stroke="#D20A18" strokeWidth={2.7} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
      {showLabels ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 5, marginTop: -8 }}>
          {points.map((x, i) => <Text key={i} style={{ fontSize: 9, color: p.muted }}>{x.day}</Text>)}
        </View>
      ) : null}
    </View>
  );
}

function Action({ children, onPress, p, secondary, compact }: { children: React.ReactNode; onPress: () => void; p: Palette; secondary?: boolean; compact?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({
    minHeight: compact ? 38 : 44, backgroundColor: secondary ? p.elevated : p.red,
    borderWidth: secondary ? 1 : 0, borderColor: p.border, borderRadius: 12, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 13, paddingVertical: compact ? 8 : 11, opacity: pressed ? 0.76 : 1
  })}><Text style={{ color: secondary ? p.text : "#FFFFFF", fontSize: compact ? 11 : 12, fontWeight: "700" }}>{children}</Text></Pressable>;
}

const navigation: Array<{ module: Module; label: string; icon: typeof LayoutDashboard; group: string; live: boolean }> = [
  { module: "overview", label: "Inicio", icon: LayoutDashboard, group: "PRINCIPAL", live: true },
  { module: "pos", label: "Punto de venta", icon: ShoppingCart, group: "PRINCIPAL", live: true },
  { module: "cash", label: "Caja", icon: Wallet, group: "PRINCIPAL", live: true },
  { module: "inventory", label: "Almacén", icon: Warehouse, group: "PRINCIPAL", live: true },
  { module: "charts", label: "Gráficos", icon: BarChart3, group: "ANÁLISIS", live: true },
  { module: "activities", label: "Actividad", icon: Activity, group: "ANÁLISIS", live: true },
  { module: "notes", label: "Agenda", icon: CalendarDays, group: "ORGANIZACIÓN", live: true },
  { module: "purchases", label: "Reposición", icon: Truck, group: "ORGANIZACIÓN", live: true },
  { module: "suppliers", label: "Proveedores", icon: Users, group: "ORGANIZACIÓN", live: true },
  { module: "online", label: "Tienda online", icon: ShoppingBag, group: "GESTIÓN", live: true },
  { module: "documents", label: "Comprobantes", icon: FileText, group: "GESTIÓN", live: true },
  { module: "fiscal", label: "ARCA · Facturación", icon: ShieldCheck, group: "GESTIÓN", live: true },
  { module: "operations", label: "Gestión", icon: ClipboardList, group: "GESTIÓN", live: true },
  { module: "settings", label: "Configuración", icon: Settings2, group: "GESTIÓN", live: true }
];

const fullWebsite = "https://globalstocks.vercel.app";

export default function NativeWorkspace({
  client, userId, business, businesses, products, source, notice, drafts, cart,
  refreshToken, onRefresh, onBusiness, onReloadBusinesses, onSignOut, onAdd, onAdjust, onSaveDraft
}: Props) {
  const [active, setActive] = useState<Module>("overview");
  const [dark, setDark] = useState(true);
  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync("gs.mobile.theme.v1").then((value) => {
      if (active && value) setDark(value === "dark");
    }).catch(() => null);
    return () => { active = false; };
  }, []);
  function setPersistedTheme(next: boolean) {
    setDark(next);
    void SecureStore.setItemAsync("gs.mobile.theme.v1", next ? "dark" : "light").catch(() => null);
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [businessPicker, setBusinessPicker] = useState(false);
  const [productForm, setProductForm] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [posSearch, setPosSearch] = useState("");
  const [message, setMessage] = useState("");
  const [scanned, setScanned] = useState(false);
  const [scanForCash, setScanForCash] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [pendingBarcode, setPendingBarcode] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [canManageInventory, setCanManageInventory] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function requestSignOut() {
    // Confirm within the same React tree. Native iOS alerts and modal sheets
    // were leaving a blank presentation layer above the signed-out screen.
    setMenuOpen(false);
    setBusinessPicker(false);
    setShowAi(false);
    setShowLogoutConfirm(true);
  }
  const [showOverviewDetails, setShowOverviewDetails] = useState(false);
  const p = dark ? darkPalette : lightPalette;
  const s = useMemo(() => stylesFor(p), [p]);

  useEffect(() => {
    let alive = true;
    setDashboard(null);
    setDashboardError("");
    setDashboardLoading(true);
    void (async () => {
      try {
        const { data, error } = await client.rpc("global_stock_mobile_dashboard", { target_business_id: business.id });
        if (!alive) return;
        if (error) {
          setDashboardError(error.message);
          return;
        }
        const result = data as { revenue?: number; cost?: number; salesCount?: number; chart?: DailyPoint[] } | null;
        setDashboard({
          revenue: Number(result?.revenue) || 0,
          cost: Number(result?.cost) || 0,
          salesCount: Number(result?.salesCount) || 0,
          chart: Array.isArray(result?.chart) ? result.chart.map((x) => ({ day: String(x.day), profit: Number(x.profit) || 0 })) : []
        });
      } catch (error) {
        if (alive) setDashboardError(error instanceof Error ? error.message : "No se pudieron cargar las ventas");
      } finally {
        if (alive) setDashboardLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [client, business.id, refreshToken]);

  useEffect(() => {
    let alive = true;
    setCanManageInventory(false);
    void Promise.resolve(client.rpc("global_stock_can_write", {
      target_business_id: business.id, domain: "inventory"
    })).then(({ data, error }) => {
      if (alive) setCanManageInventory(!error && data === true);
    }).catch(() => { if (alive) setCanManageInventory(false); });
    return () => { alive = false; };
  }, [client, business.id, userId, refreshToken]);

  useEffect(() => {
    setProductForm(false);
    setRestockProductId(null);
    setSearch("");
    setPosSearch("");
    setManualBarcode("");
    setBarcodeError("");
    setPendingBarcode("");
    setScanForCash(false);
    setActive("overview");
  }, [business.id]);

  const inventoryCost = products.reduce((sum, item) => sum + (item.cost ?? 0) * item.stock, 0);
  const costsMissing = products.some((item) => item.cost == null);
  const inventoryCostText = products.length && costsMissing ? "—" : formatMoney(inventoryCost, business.base_currency);
  const critical = products.filter((item) => item.stock <= item.min_stock).length;
  const totalCart = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const units = products.reduce((sum, item) => sum + item.stock, 0);
  const shownProducts = products.filter((item) =>
    [item.name, item.barcode, item.sku, item.category].some((v) => v?.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const posProducts = products.filter((item) =>
    [item.name, item.barcode, item.sku].some((v) => v?.toLowerCase().includes(posSearch.trim().toLowerCase()))
  ).slice(0, 35);
  const money = (n: number) => formatMoney(n, business.base_currency);
  const indicators = [
    { label: "Ingresos", value: dashboard ? money(dashboard.revenue) : "—", icon: CircleDollarSign, help: "Ventas registradas" },
    { label: "Costo de inventario", value: source === "loading" ? "—" : inventoryCostText, icon: Boxes, help: costsMissing ? "Faltan costos" : "Stock valorizado" },
    { label: "Ganancia bruta", value: dashboard ? money(dashboard.revenue - dashboard.cost) : "—", icon: ChartNoAxesCombined, help: "Ingresos − costos" },
    { label: "Stock crítico", value: String(critical), icon: BellRing, help: "alertas" }
  ];

  function open(module: Module) {
    setActive(module);
    setMenuOpen(false);
    if (module === "scan") setScanned(false);
    if (module !== "scan") setScanForCash(false);
  }
  function scanToCash() {
    setScanForCash(true);
    setScanned(false);
    open("scan");
  }
  function lookupBarcode(raw: string) {
    const value = raw.trim();
    if (!value || value.length > 64) {
      setBarcodeError("Ingresá un código válido de hasta 64 caracteres.");
      return;
    }
    setBarcodeError("");
    setManualBarcode(value);
    if (scanForCash) {
      const candidate = products.find(item =>
        item.barcode?.trim().toLowerCase() === value.toLowerCase() ||
        item.sku?.trim().toLowerCase() === value.toLowerCase());
      if (!candidate) {
        setBarcodeError("Ese código no está registrado en este negocio.");
        return;
      }
      if (candidate.stock <= 0 ||
        (cart.find(line => line.product_id === candidate.id)?.quantity ?? 0) >= candidate.stock) {
        setBarcodeError("No quedan existencias disponibles para sumar a Caja.");
        return;
      }
      onAdd(candidate);
      setMessage("");
      setScanForCash(false);
      open("cash");
      return;
    }
    // Keep leading zeroes (EAN/UPC), handle case-insensitive SKUs and
    // match only the currently selected business's inventory.
    const product = products.find(item =>
      item.barcode?.trim().toLowerCase() === value.toLowerCase() ||
      item.sku?.trim().toLowerCase() === value.toLowerCase()
    );
    setSearch(value);
    setPendingBarcode(product ? "" : value);
    setMessage(product ? `Encontrado: ${product.name}` :
      "No hay productos con ese código. Podés crearlo en este negocio si tenés permiso.");
    setProductForm(false);
    open("inventory");
  }
  function scanResult({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    lookupBarcode(data);
  }
  function addCart(product: Product) {
    if (product.stock <= 0) {
      appAlerts.alert("Sin existencias", "No se puede seleccionar un producto sin stock.");
      return;
    }
    const existing = cart.find((item) => item.product_id === product.id)?.quantity ?? 0;
    if (existing >= product.stock) {
      appAlerts.alert("Stock alcanzado", "El borrador no puede superar el stock consultado.");
      return;
    }
    onAdd(product);
    open("pos");
  }
  function openWebsite() {
    void Linking.openURL(fullWebsite).catch(() => appAlerts.alert("No se pudo abrir la web", fullWebsite));
  }

  function heading(title: string, subtitle: string) {
    return <View style={s.intro}>
      <View style={s.eyebrowLine}><Image source={require("../../assets/brand-mark.png")} style={s.eyebrowLogo} /><Text style={s.eyebrow}>GLOBAL STOCK</Text></View>
      <Text style={s.pageTitle}>{title}</Text>
      <Text style={s.pageSubtitle}>{subtitle}</Text>
    </View>;
  }

  function metricView(item: typeof indicators[number], index: number) {
    const Icon = item.icon;
    return <View key={item.label} style={s.metric}>
      <View style={s.metricIcon}><Icon size={15} color={p.redIcon} strokeWidth={1.9} /></View>
      <View>
        <Text style={s.metricLabel} numberOfLines={1}>{item.label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76} style={s.metricValue}>{item.value}</Text>
        {(index === 3 || (index === 1 && costsMissing)) ? <Text style={s.metricDetail}>{item.help}</Text> : null}
      </View>
    </View>;
  }

  function chartCard() {
    return <View style={s.bigCard}>
      <View style={s.cardHeadingRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>FLUJO DE VENTAS</Text>
          <Text style={s.chartTitle}>Ganancia bruta</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => open("charts")} style={s.smallPill}><Text style={s.smallPillText}>Gráficos</Text><ChevronRight size={12} color={p.muted}/></Pressable>
      </View>
      {dashboardError ? <View style={{gap:5}}><Text style={s.warning}>No pudimos actualizar las ventas. Volvé a intentar.</Text><Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(supportEmailUrl("Error en panel de ventas"))}><Text style={[s.meta,{color:p.redIcon,fontWeight:"700"}]}>{SUPPORT_EMAIL}</Text></Pressable></View> : null}
      {dashboardLoading ? <ActivityIndicator style={{ marginVertical: 58 }} color={p.redIcon} /> : <ProfitTrend points={dashboard?.chart ?? []} p={p} />}
      <View style={s.chartFooter}>
        <View style={s.liveDot} /><Text style={s.meta}>Últimos 7 días · datos reales</Text>
        <Pressable accessibilityRole="button" onPress={onRefresh} style={{ marginLeft: "auto" }}><RefreshCw size={15} color={p.muted}/></Pressable>
      </View>
    </View>;
  }

  function overview() {
    return <>
      {heading("Centro de control", "Una vista completa de la operación de tu negocio.")}
      {source === "cache" ? <View style={s.hint}><WifiOff size={13} color={p.muted} /><Text style={s.hintText}>Sin conexión · datos de la última sincronización.</Text></View> : null}
      <View style={s.metricsGrid}>{indicators.map(metricView)}</View>
      {chartCard()}
      <Pressable accessibilityRole="button" accessibilityLabel={showOverviewDetails?"Ocultar detalles del negocio":"Ver detalles del negocio"} accessibilityState={{expanded:showOverviewDetails}}
        onPress={() => setShowOverviewDetails((v) => !v)} style={s.detailsToggle}>
        <Text style={s.detailsText}>{showOverviewDetails ? "Ocultar detalles" : "Ver detalles del negocio"}</Text>
        <ChevronRight size={15} color={p.muted} style={{transform:[{rotate:showOverviewDetails?"90deg":"0deg"}]}}/>
      </Pressable>
      {showOverviewDetails ? <View style={s.bigCard}>
        <View style={s.cardHeadingRow}><Text style={s.sectionTitle}>Resumen del negocio</Text><Pressable onPress={onRefresh} accessibilityRole="button"><RefreshCw size={16} color={p.muted}/></Pressable></View>
        <View style={s.summaryRow}><Text style={s.meta}>Productos activos</Text><Text style={s.summaryValue}>{products.length}</Text></View>
        <View style={s.summaryRow}><Text style={s.meta}>Unidades en almacén</Text><Text style={s.summaryValue}>{units.toLocaleString("es-AR")}</Text></View>
        <View style={s.summaryRow}><Text style={s.meta}>Ventas registradas</Text><Text style={s.summaryValue}>{dashboard?.salesCount ?? "—"}</Text></View>
        <View style={s.summaryRow}><Text style={s.meta}>Borradores sin cobrar</Text><Text style={s.summaryValue}>{drafts.length}</Text></View>
      </View> : null}
      <View style={s.quickGrid}>
        <Pressable onPress={() => open("inventory")} style={s.quickCard} accessibilityRole="button"><Warehouse size={18} color={p.redIcon}/><Text style={s.quickText}>Almacén</Text><ArrowRight size={15} color={p.muted}/></Pressable>
        <Pressable onPress={() => open("cash")} style={s.quickCard} accessibilityRole="button"><Wallet size={18} color={p.redIcon}/><Text style={s.quickText}>Caja registradora</Text><ArrowRight size={15} color={p.muted}/></Pressable>
      </View>
    </>;
  }

  function inventory() {
    return <>
      {heading("Almacén y stock", "Controlá existencias, precios y códigos desde un solo lugar.")}
      <View style={s.rowBetween}><View style={{ flex: 1 }}><Text style={s.sectionTitle}>{products.length} productos</Text><Text style={s.meta}>Inventario de {business.name}</Text></View>
      <Pressable onPress={onRefresh} accessibilityRole="button" accessibilityLabel="Actualizar inventario" style={s.iconControl}><RefreshCw size={17} color={p.text}/></Pressable></View>
      <View style={s.searchBar}><Search size={17} color={p.muted}/><TextInput style={s.searchInput} value={search} onChangeText={(value) => {setSearch(value);setPendingBarcode("");}} autoCapitalize="none" placeholder="Buscar nombre, código o categoría" placeholderTextColor={p.muted} accessibilityLabel="Buscar productos"/></View>
      <View style={s.rowBetween}><Action p={p} compact onPress={() => { setScanned(false); open("scan"); }} secondary>Escanear código</Action>
      {canManageInventory ? <Action p={p} compact onPress={() => setProductForm((v) => !v)}>{productForm ? "Cerrar" : "+ Producto"}</Action> : null}</View>
      {pendingBarcode && canManageInventory && !productForm ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Crear producto con código de barras ingresado"
          onPress={() => setProductForm(true)} style={[s.menuTile,{borderColor:p.redIcon}]}>
          <PackagePlus size={18} color={p.redIcon}/>
          <Text style={[s.menuTileText,{flex:1}]}>Crear producto con código {pendingBarcode}</Text>
          <ChevronRight size={17} color={p.muted}/>
        </Pressable>
      ) : null}
      {productForm ? <ProductForm client={client} businessId={business.id} initialBarcode={pendingBarcode} currency={business.base_currency} onCancel={() => setProductForm(false)} onCreated={() => { setProductForm(false); setPendingBarcode(""); onRefresh(); setMessage("Producto guardado en Supabase."); }}/>:null}
      {source === "loading" ? <ActivityIndicator color={p.redIcon}/> : null}
      {shownProducts.slice(0, 200).map((product) =>
        <View key={product.id} style={{ gap: 8 }}>
          <View style={s.product}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={s.productMeta} numberOfLines={1}>{product.category || product.sku || product.barcode || "Sin categoría"}</Text>
              <Text style={[s.productMeta, { color: product.stock <= product.min_stock ? p.redIcon : "#65C5A1" }]}>
                {product.stock.toLocaleString("es-AR")} disponibles
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              <Text style={s.price}>{money(product.price)}</Text>
              {canManageInventory && <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Sumar stock a " + product.name}
                onPress={() => setRestockProductId(current => current === product.id ? null : product.id)}
                style={[s.addSmall, { backgroundColor: p.elevated, borderWidth: 1, borderColor: p.border }]}>
                <PackagePlus size={13} color={p.redIcon}/>
                <Text style={[s.addText, { color: p.text }]}>+ Stock</Text>
              </Pressable>}
              <Pressable onPress={() => addCart(product)} accessibilityRole="button"
                accessibilityLabel={"Agregar " + product.name + " al presupuesto"}
                style={s.addSmall}>
                <ShoppingCart size={13} color="#FFF"/>
                <Text style={s.addText}>Al carrito</Text>
              </Pressable>
            </View>
          </View>
          {restockProductId === product.id && canManageInventory &&
            <NativeRestockPanel key={product.id} client={client} businessId={business.id}
              product={product} p={p} online={source === "live"}
              onCancel={() => setRestockProductId(null)}
              onSaved={(stock) => {
                setRestockProductId(null);
                setMessage("Stock actualizado: " + stock.toLocaleString("es-AR") + " unidades.");
                onRefresh();
              }}
            />}
        </View>
      )}
      {shownProducts.length > 200 ? <Text style={s.meta}>Mostrando 200 productos. Usá la búsqueda para encontrar los demás.</Text> : null}
      {source !== "loading" && shownProducts.length === 0 ? <View style={s.empty}><Boxes size={26} color={p.muted}/><Text style={s.emptyTitle}>{search.trim() ? "Sin coincidencias" : "Todavía no hay productos"}</Text><Text style={s.meta}>{search.trim() ? "Revisá el código, SKU o categoría. No se creó ni modificó ningún producto." : "Agregá el primero y se sincronizará con Global Stock web."}</Text></View> : null}
    </>;
  }

  function pointOfSale() {
    return <>
      {heading("Punto de venta", "Prepará operaciones, presupuestos y comprobantes.")}
      <View style={s.warnBox}><CreditCard size={16} color="#D7A65C"/><Text style={s.warnText}>Desde Punto de venta podés preparar presupuestos. Para registrar una venta presencial, cobrar en efectivo, calcular el vuelto y descontar stock, abrí Caja desde el menú.</Text></View>
      <View style={s.searchBar}><Search size={17} color={p.muted}/><TextInput style={s.searchInput} value={posSearch} onChangeText={setPosSearch} placeholder="Buscar producto" placeholderTextColor={p.muted} accessibilityLabel="Buscar para punto de venta"/></View>
      <View style={s.rowBetween}><Text style={s.sectionTitle}>Productos</Text><Pressable onPress={() => open("cash")} accessibilityRole="button"><Text style={s.textLink}>Abrir Caja →</Text></Pressable></View>
      {posProducts.map((product) => <View key={product.id} style={s.product}>
        <View style={{ flex: 1 }}><Text style={s.productName}>{product.name}</Text><Text style={s.productMeta}>{product.stock} disponibles</Text></View>
        <View style={{ alignItems:"flex-end",gap:7 }}><Text style={s.price}>{money(product.price)}</Text><Pressable onPress={() => addCart(product)} accessibilityRole="button" style={s.addSmall}><Plus size={13} color="#fff"/><Text style={s.addText}>Agregar</Text></Pressable></View>
      </View>)}
      <View style={s.bigCard}><Text style={s.sectionTitle}>Detalle de productos</Text>
        {cart.length===0 ? <Text style={[s.meta,{marginTop:12}]}>Todavía no agregaste productos.</Text> : cart.map((line) => <View key={line.product_id} style={s.cartLine}>
          <View style={{ flex:1 }}><Text style={s.productName}>{line.name}</Text><Text style={s.productMeta}>{money(line.unit_price)} c/u</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={"Quitar una unidad de "+line.name} onPress={() => onAdjust(line.product_id,-1)} style={s.quantityButton}><Minus size={14} color={p.text}/></Pressable>
          <Text style={s.quantity}>{line.quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={"Agregar una unidad de "+line.name} onPress={() => {
            const product = products.find((p) => p.id === line.product_id);
            if (product && line.quantity >= product.stock) { appAlerts.alert("Stock máximo", "No quedan suficientes unidades."); return; }
            onAdjust(line.product_id,1);
          }} style={s.quantityButton}><Plus size={14} color={p.text}/></Pressable>
        </View>)}
        <View style={s.totalRow}><Text style={s.meta}>Total estimado</Text><Text style={s.total}>{money(totalCart)}</Text></View>
        <Action p={p} onPress={onSaveDraft}>Guardar presupuesto</Action>
        <Text style={s.smallPrint}>El presupuesto no registra un cobro ni modifica existencias.</Text>
      </View>
      <NativePrintCenter client={client} business={business} products={products} drafts={drafts} cart={cart}
        dark={dark} onFiscal={() => open("fiscal")} embedded />
      {drafts.length>0 ? <View style={s.bigCard}><Text style={s.sectionTitle}>Presupuestos guardados</Text>{drafts.slice(0,8).map((draft) => <View key={draft.id} style={s.summaryRow}><Text style={s.meta}>{new Date(draft.created_at).toLocaleDateString("es-AR")}</Text><Text style={s.summaryValue}>{money(draft.total)}</Text></View>)}</View> : null}
    </>;
  }

  function chartScreen() {
    return <>{heading("Gráficos", "Analizá las ventas, el stock y los costos del negocio.")}
      {chartCard()}
      <View style={s.metricsGrid}>{indicators.map(metricView)}</View>
      <View style={s.bigCard}><Text style={s.sectionTitle}>Stock por producto</Text>
        {products.length ? products.slice().sort((a,b) => b.stock-a.stock).slice(0,8).map((product) => <View key={product.id} style={{ marginTop: 16, gap: 7 }}>
          <View style={s.rowBetween}><Text style={[s.meta,{flex:1}]} numberOfLines={1}>{product.name}</Text><Text style={s.summaryValue}>{product.stock}</Text></View>
          <View style={[s.track,{backgroundColor:p.border}]}><View style={[s.trackFill,{width:`${Math.min(100,(product.stock/Math.max(1,...products.map(v=>v.stock)))*100)}%`, backgroundColor:p.redIcon}]}/></View>
        </View>) : <Text style={[s.meta,{marginTop:14}]}>Agregá productos para visualizar el stock.</Text>}
      </View>
    </>;
  }

  function activityScreen() {
    return <>{heading("Actividad", "Consultá el movimiento real del negocio.")}
      <View style={s.bigCard}><Text style={s.sectionTitle}>Resumen de ventas</Text>
      <View style={s.summaryRow}><Text style={s.meta}>Ventas completadas</Text><Text style={s.summaryValue}>{dashboard?.salesCount ?? "—"}</Text></View>
      <View style={s.summaryRow}><Text style={s.meta}>Ingresos registrados</Text><Text style={s.summaryValue}>{dashboard ? money(dashboard.revenue) : "—"}</Text></View>
      </View>
      <View style={s.bigCard}><Text style={s.sectionTitle}>Borradores de este dispositivo</Text>
      {drafts.length===0 ? <Text style={[s.meta,{marginTop:12}]}>Sin movimientos locales por ahora.</Text> : drafts.map(d => <View key={d.id} style={s.summaryRow}><Text style={s.meta}>{new Date(d.created_at).toLocaleString("es-AR")}</Text><Text style={s.summaryValue}>{money(d.total)}</Text></View>)}
      </View>
      <Text style={s.smallPrint}>El historial completo y los filtros de actividad están disponibles en Global Stock web.</Text>
      <Action p={p} secondary onPress={openWebsite}>Abrir historial en la web</Action>
    </>;
  }

  const groups = ["PRINCIPAL", "ANÁLISIS", "ORGANIZACIÓN", "GESTIÓN"];
  const isMenuActive = !["overview","pos","inventory","scan"].includes(active);


  // Native overlays added after the bottom dock were not full-height on iOS.
  // Render each destination as an ordinary full-screen route in this tree.
  if (showAi) return <NativeAssistant visible onClose={() => setShowAi(false)}
    client={client} business={business} userId={userId} products={products} dark={dark} />;

  if (showLogoutConfirm) return <SafeAreaView edges={["top","bottom"]} style={[s.shell,{backgroundColor:p.bg}]}>
    <StatusBar style={dark ? "light" : "dark"}/>
    <View style={s.header}>
      <Text style={[s.sectionTitle,{flex:1}]}>Cerrar sesión</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancelar cierre de sesión"
        onPress={() => setShowLogoutConfirm(false)} style={s.iconControl}><X size={20} color={p.text}/></Pressable>
    </View>
    <View style={{flex:1,justifyContent:"center",padding:22}}>
      <View style={s.modalCard}>
        <Text style={s.sectionTitle}>¿Cerrar sesión en este dispositivo?</Text>
        <Text style={[s.meta,{fontSize:12,lineHeight:20}]}>
          Por privacidad, se borrarán de este dispositivo las copias locales del inventario
          y los presupuestos no sincronizados. Los datos guardados en Global Stock web no se eliminan.
        </Text>
        <Action p={p} secondary onPress={() => setShowLogoutConfirm(false)}>Cancelar</Action>
        <Action p={p} onPress={() => {setShowLogoutConfirm(false);onSignOut();}}>
          Cerrar sesión y borrar copia local
        </Action>
      </View>
    </View>
  </SafeAreaView>;

  if (businessPicker) return <SafeAreaView edges={["top","bottom"]} style={[s.shell,{backgroundColor:p.bg}]}>
    <StatusBar style={dark ? "light" : "dark"}/>
    <View style={s.header}>
      <Text style={[s.sectionTitle,{flex:1}]}>Tus negocios</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver al panel"
        onPress={() => setBusinessPicker(false)} style={s.iconControl}><X size={20} color={p.text}/></Pressable>
    </View>
    <ScrollView style={{flex:1}} contentContainerStyle={{padding:18,gap:10}}>
      {businesses.map(b => <Pressable key={b.id} accessibilityRole="button" style={[s.menuLink,{padding:13,backgroundColor:p.surface,borderRadius:13}]}
        onPress={() => {setBusinessPicker(false);onBusiness(b);}}>
        <Store size={18} color={p.redIcon}/><Text style={s.menuLinkLabel}>{b.name}</Text>
        {b.id===business.id ? <Check size={17} color="#65C5A1"/> : null}
      </Pressable>)}
    </ScrollView>
  </SafeAreaView>;

  if (menuOpen) return <SafeAreaView edges={["top","bottom"]} style={[s.shell,{backgroundColor:p.bg}]}>
    <StatusBar style={dark ? "light" : "dark"}/>
    <View style={s.header}>
      <View style={{flex:1,gap:4}}>
        <Text style={s.sectionTitle}>Menú de Global Stock</Text>
        <Text style={s.meta} numberOfLines={1}>{business.name}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setMenuOpen(false)}
        style={s.iconControl}><X size={20} color={p.text}/></Pressable>
    </View>
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingHorizontal:18,paddingVertical:18,paddingBottom:35}}
      showsVerticalScrollIndicator={false}>
      {groups.map(group => <View key={group} style={{marginBottom:21}}>
        <Text style={s.menuGroup}>{group}</Text>
        <View style={s.menuGrid}>
          {navigation.filter(item => item.group===group).map(item => {
            const Icon=item.icon;
            return <Pressable key={item.module} accessibilityRole="button" style={[s.menuTile,active===item.module&&s.menuTileActive]}
              onPress={() => open(item.module)}>
              <View style={s.menuTileIcon}><Icon size={17} color={p.redIcon}/></View>
              <View style={{flex:1}}>
                <Text style={s.menuTileText}>{item.label}</Text>
                {!item.live ? <Text style={s.menuSoon}>En adaptación</Text> : null}
              </View>
              <ChevronRight size={17} color={p.muted}/>
            </Pressable>;
          })}
        </View>
      </View>)}
      <Pressable accessibilityRole="button" onPress={() => {setMenuOpen(false);setBusinessPicker(true);}}
        style={s.menuLink}><Store size={18} color={p.redIcon}/><Text style={s.menuLinkLabel}>Cambiar negocio</Text>
        <ChevronRight size={17} color={p.muted}/></Pressable>
      <Pressable accessibilityRole="button" onPress={requestSignOut} style={s.menuLink}>
        <LogOut size={18} color={p.redIcon}/><Text style={s.menuLinkLabel}>Cerrar sesión</Text>
        <ChevronRight size={17} color={p.muted}/></Pressable>
    </ScrollView>
  </SafeAreaView>;

  return <SafeAreaView edges={["top","bottom"]} style={[s.shell,{backgroundColor:p.bg}]}>
    <StatusBar style={dark ? "light" : "dark"}/>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ir a inicio" onPress={() => open("overview")} style={s.brandRow}>
        <Image source={require("../../assets/brand-mark.png")} style={s.brandIcon} resizeMode="contain"/>
        <Text style={s.brandName}>Global Stock</Text>
      </Pressable>
      <View style={s.headerButtons}>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir Global Intelligence" onPress={() => setShowAi(true)} style={s.iconControl}><Sparkles size={17} color={p.redIcon}/></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={dark?"Cambiar a claro":"Cambiar a oscuro"} onPress={() => setPersistedTheme(!dark)} style={s.iconControl}>{dark ? <Sun size={16} color={p.text}/> : <Moon size={16} color={p.text}/>}</Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú" onPress={() => setMenuOpen(true)} style={s.iconControl}><Menu size={17} color={p.text}/></Pressable>
      </View>
    </View>
    {notice && source==="empty" ? <View style={s.hint}><WifiOff size={12} color={p.muted}/><Text style={s.hintText} numberOfLines={2}>{notice}</Text></View> : null}
    <ScrollView
      key={active}
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {active==="overview" ? overview() : null}
      {active==="inventory" ? inventory() : null}
      {active==="pos" ? pointOfSale() : null}
      {active==="cash" ? <NativeCashRegister
        client={client} business={business} products={products}
        cart={cart} dark={dark} online={source==="live"} refreshToken={refreshToken}
        onAdd={onAdd} onAdjust={onAdjust}
        onScan={scanToCash} onRefresh={onRefresh} onSaveDraft={onSaveDraft}
        onCompleted={(sale) => {
          for (const line of sale.lines) onAdjust(line.product_id, -line.quantity);
          setMessage(""); // Caja displays a single inline success confirmation.
          onRefresh();
          open("cash");
        }}
      /> : null}
      {active==="charts" ? chartScreen() : null}
      {active==="activities" ? activityScreen() : null}
      {active==="settings" ? <NativeSettings
        client={client} business={business} userId={userId} dark={dark}
        onTheme={setPersistedTheme} onBusiness={onBusiness}
        onSwitchBusiness={() => setBusinessPicker(true)}
        onRefresh={onRefresh} onSignOut={requestSignOut} onOpenWeb={openWebsite}
      /> : null}
      {active==="scan" ? <>
        {heading("Buscar por código", "Escaneá o escribí el código de barras o SKU. Funciona aunque no otorgues acceso a la cámara.")}
        <View style={s.bigCard}>
          <Text style={s.sectionTitle}>Ingresar código manualmente</Text>
          <Text style={s.meta}>EAN, UPC, Code 128 o código interno de tu negocio. Los ceros iniciales se conservan.</Text>
          <View style={s.searchBar}>
            <ScanLine size={18} color={p.redIcon}/>
            <TextInput value={manualBarcode}
              onChangeText={(value) => { setManualBarcode(value); setBarcodeError(""); }}
              onSubmitEditing={() => lookupBarcode(manualBarcode)}
              autoCapitalize="characters" autoCorrect={false}
              returnKeyType="search" maxLength={64}
              placeholder="Ej.: 7791234567890"
              placeholderTextColor={p.muted}
              accessibilityLabel="Código de barras o SKU manual"
              style={s.searchInput}/>
          </View>
          {barcodeError ? <Text accessibilityRole="alert" style={s.warning}>{barcodeError}</Text> : null}
          <Action p={p} onPress={() => lookupBarcode(manualBarcode)}>Buscar código</Action>
        </View>
        <Text style={s.meta}>O escaneá con la cámara</Text>
        {!permission ? <ActivityIndicator color={p.redIcon}/> : !permission.granted ? <Action p={p} onPress={() => void requestPermission()}>Permitir acceso a la cámara</Action> :
        <View style={s.cameraWrap}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{barcodeTypes:["ean13","ean8","upc_a","upc_e","code128","code39","qr"]}} onBarcodeScanned={scanned ? undefined : scanResult}/><View pointerEvents="none" style={s.cameraReticle}/></View>}
        <Action p={p} secondary onPress={() => open(scanForCash ? "cash" : "inventory")}>{scanForCash ? "Volver a Caja" : "Volver al almacén"}</Action>
      </> : null}
      {active==="documents" ? <NativePrintCenter client={client} business={business} products={products}
        drafts={drafts} cart={cart} dark={dark} onFiscal={() => open("fiscal")} /> : null}
      {active==="operations" ? <NativeBusinessManager
        client={client} business={business} businesses={businesses} userId={userId}
        products={products} dark={dark} onBusiness={onBusiness}
        onReload={onReloadBusinesses} /> : null}
      {["notes","purchases","suppliers","online","fiscal"].includes(active) ? (
        <NativeExtraModules
          client={client} business={business} userId={userId} products={products}
          module={active as ExtraModule} dark={dark}
          onOpenInventory={() => open("inventory")}
          onOpenWeb={openWebsite}
        />
      ) : null}
      {message && active!=="cash" ? <View style={s.hint}><Check size={13} color="#67CFA8"/><Text style={s.hintText}>{message}</Text></View> : null}
    </ScrollView>

    <View style={[s.dock,{backgroundColor:p.surface}]}>
      <Pressable accessibilityRole="tab" accessibilityLabel="Inicio" accessibilityState={{selected:active==="overview"}} onPress={() => open("overview")} style={s.dockTab}><Store size={18} color={active==="overview" ? p.redIcon : p.muted}/><Text numberOfLines={2} style={[s.dockLabel,{color:active==="overview"?p.redIcon:p.muted}]}>Inicio</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityLabel="Punto de venta" accessibilityState={{selected:active==="pos"}} onPress={() => open("pos")} style={s.dockTab}><ShoppingCart size={18} color={active==="pos"?p.redIcon:p.muted}/><Text numberOfLines={2} style={[s.dockLabel,{color:active==="pos"?p.redIcon:p.muted}]}>Punto de venta</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityLabel="Escanear" accessibilityState={{selected:active==="scan"}} onPress={() => {setScanForCash(false);setScanned(false);open("scan");}} style={s.scanDockTab}><View style={s.scanCircle}><ScanLine size={23} color="#FFFFFF" strokeWidth={2}/></View><Text numberOfLines={2} style={[s.dockLabel,{color:p.redIcon}]}>Escanear</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityLabel="Almacén" accessibilityState={{selected:active==="inventory"}} onPress={() => open("inventory")} style={s.dockTab}><Boxes size={18} color={active==="inventory"?p.redIcon:p.muted}/><Text numberOfLines={2} style={[s.dockLabel,{color:active==="inventory"?p.redIcon:p.muted}]}>Almacén</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityLabel="Menú" accessibilityState={{selected:isMenuActive}} onPress={() => setMenuOpen(true)} style={s.dockTab}><Menu size={18} color={isMenuActive?p.redIcon:p.muted}/><Text numberOfLines={2} style={[s.dockLabel,{color:isMenuActive?p.redIcon:p.muted}]}>Menú</Text></Pressable>
    </View>



  </SafeAreaView>;
}

function stylesFor(p: Palette) {
  return StyleSheet.create({
    shell: { flex:1 },
    header: { height: 65, flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, borderBottomWidth:1, borderBottomColor:p.border, backgroundColor:p.surface },
    brandRow: { flexDirection:"row", alignItems:"center", gap:9, flex:1 },
    brandIcon: { width:27,height:27 },
    brandName: { fontWeight:"800",color:p.text,fontSize:13,letterSpacing:-0.25 },
    headerButtons: { flexDirection:"row",gap:7 },
    iconControl: { width:44,height:44,borderRadius:12,borderWidth:1,borderColor:p.border,backgroundColor:p.elevated,alignItems:"center",justifyContent:"center" },
    scroll: { flex:1 },
    content: { paddingHorizontal:18,paddingTop:24,paddingBottom:48,gap:20 },
    intro: { gap:8,marginBottom:5 },
    eyebrowLine: { flexDirection:"row",gap:6,alignItems:"center",marginBottom:2 },
    eyebrowLogo: { width:14,height:14 },
    eyebrow: { color:p.redIcon,fontSize:10,fontWeight:"800",letterSpacing:1.45 },
    pageTitle: { fontSize:24,fontWeight:"800",letterSpacing:-0.7,color:p.text,lineHeight:31 },
    pageSubtitle: { color:p.muted,fontSize:12.5,lineHeight:20 },
    metricsGrid: { flexDirection:"row",flexWrap:"wrap",columnGap:12,rowGap:12 },
    metric: { width:"48%",minHeight:122,borderWidth:1,borderColor:p.border,backgroundColor:p.surface,borderRadius:17,padding:15,justifyContent:"space-between" },
    metricIcon: { width:29,height:29,borderRadius:10,backgroundColor:p.red+"17",alignItems:"center",justifyContent:"center",marginBottom:8 },
    metricLabel: { color:p.muted,fontSize:11.5,lineHeight:16 },
    metricValue: { color:p.text,fontWeight:"800",fontSize:16,letterSpacing:-0.3,marginTop:5 },
    metricDetail: { color:p.muted,fontSize:9.5,marginTop:4 },
    bigCard: { backgroundColor:p.surface,borderColor:p.border,borderWidth:1,borderRadius:18,padding:17,gap:13 },
    cardHeadingRow: { flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:9 },
    chartTitle: { marginTop:5,fontSize:15,fontWeight:"800",color:p.text },
    smallPill: { flexDirection:"row",gap:3,alignItems:"center",borderWidth:1,borderColor:p.border,borderRadius:40,paddingHorizontal:9,paddingVertical:6 },
    smallPillText: { color:p.muted,fontSize:10 },
    chartFooter: { flexDirection:"row",alignItems:"center",gap:7,paddingTop:2 },
    liveDot: { width:6,height:6,borderRadius:4,backgroundColor:"#55CB9B" },
    meta: { fontSize:11,color:p.muted,lineHeight:17 },
    sectionTitle: { fontSize:15,fontWeight:"800",color:p.text },
    summaryRow: { flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:0.75,borderBottomColor:p.border,paddingVertical:12,gap:10 },
  detailsToggle: {flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:41,paddingHorizontal:9},
  detailsText: {color:p.muted,fontSize:12,fontWeight:"700"},
    summaryValue: { color:p.text,fontSize:12,fontWeight:"800" },
    quickGrid: { flexDirection:"row",gap:9 },
    quickCard: { flex:1,borderWidth:1,borderColor:p.border,borderRadius:13,backgroundColor:p.surface,padding:14,gap:12,alignItems:"flex-start" },
    quickText: { color:p.text,fontWeight:"800",fontSize:12 },
    dock: { height:80,borderTopWidth:1,borderTopColor:p.border,flexDirection:"row",justifyContent:"space-between",alignItems:"stretch",paddingHorizontal:6,paddingBottom:1 },
    dockTab: { flex:1,minWidth:0,height:78,justifyContent:"flex-start",alignItems:"center",paddingTop:12,gap:6 },
    dockLabel: { fontSize:10.5,fontWeight:"700",lineHeight:13,minHeight:26,textAlign:"center",textAlignVertical:"top",alignSelf:"stretch",paddingHorizontal:1 },
    scanDockTab: { flex:1.12,minWidth:0,height:78,alignItems:"center",justifyContent:"flex-start" },
    scanCircle: { width:54,height:54,borderRadius:32,alignItems:"center",justifyContent:"center",backgroundColor:p.red,borderWidth:5,borderColor:p.bg,marginTop:-19,marginBottom:7 },
    
    warning: { color:p.muted,fontSize:11,lineHeight:17 },
    rowBetween: { flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8 },
    searchBar: { flexDirection:"row",alignItems:"center",gap:10,borderWidth:1,borderColor:p.border,borderRadius:13,paddingHorizontal:12,backgroundColor:p.surface,minHeight:46 },
    searchInput: { flex:1,color:p.text,fontSize:12,paddingVertical:10 },
    textLink: { color:p.redIcon,fontSize:12,fontWeight:"800" },
    product: { flexDirection:"row",gap:10,alignItems:"center",backgroundColor:p.surface,borderWidth:1,borderColor:p.border,borderRadius:14,padding:13 },
    productName: { color:p.text,fontSize:12.5,fontWeight:"800",lineHeight:18 },
    productMeta: { color:p.muted,fontSize:10.5,lineHeight:16,marginTop:4 },
    price: { color:p.text,fontSize:12,fontWeight:"800" },
    addSmall: { flexDirection:"row",gap:4,alignItems:"center",backgroundColor:p.red,borderRadius:9,paddingHorizontal:8,paddingVertical:7 },
    addText: { color:"white",fontSize:10,fontWeight:"800" },
    empty: { backgroundColor:p.surface,borderWidth:1,borderColor:p.border,borderRadius:15,padding:20,alignItems:"center",gap:9 },
    emptyTitle: { color:p.text,fontSize:14,fontWeight:"800" },
    warnBox: { backgroundColor: "#2E231D", borderWidth:1,borderColor:"#765438",padding:12,borderRadius:12,flexDirection:"row",gap:10,alignItems:"flex-start" },
    warnText: { flex:1,color:"#F1D9B3",fontSize:11.5,lineHeight:18 },
    cartLine: { flexDirection:"row",alignItems:"center",gap:10,paddingVertical:10,borderBottomWidth:0.7,borderColor:p.border },
    quantityButton: { width:26,height:26,borderRadius:8,backgroundColor:p.elevated,borderWidth:1,borderColor:p.border,alignItems:"center",justifyContent:"center" },
    quantity: { color:p.text,fontSize:12,fontWeight:"800" },
    totalRow: { flexDirection:"row",justifyContent:"space-between",paddingVertical:14,alignItems:"center" },
    total: { color:p.text,fontWeight:"800",fontSize:20 },
    smallPrint: { color:p.muted,fontSize:11,lineHeight:17 },
    track: { height:6,borderRadius:10,overflow:"hidden" },
    trackFill: { height:6,borderRadius:10 },
    settingPrimary: { fontSize:19,fontWeight:"800",color:p.text },
    pendingPanel: { borderRadius:19,borderWidth:1,borderColor:p.border,backgroundColor:p.surface,alignItems:"center",padding:23,gap:16 },
    pendingTitle: { fontSize:18,fontWeight:"800",color:p.text,textAlign:"center" },
    pendingText: { color:p.muted,fontSize:12,lineHeight:19,textAlign:"center" },
    hint: { borderRadius:10,backgroundColor:p.elevated,padding:9,flexDirection:"row",alignItems:"center",gap:8 },
    hintText: { flex:1,color:p.muted,fontSize:10.5,lineHeight:15 },
    cameraWrap: { height:350,overflow:"hidden",borderRadius:17,position:"relative",backgroundColor:"#000" },
    cameraReticle: { position:"absolute",left:"15%",right:"15%",top:"26%",bottom:"26%",borderWidth:2,borderColor:p.redIcon,borderRadius:16 },
    backdrop: { flex:1,backgroundColor:"rgba(0,0,0,0.65)",justifyContent:"flex-end" },
    sheet: { maxHeight:"83%",borderTopLeftRadius:28,borderTopRightRadius:28,backgroundColor:p.surface,paddingHorizontal:16,paddingTop:10,paddingBottom:10,borderTopWidth:1,borderColor:p.border },
    sheetHandle: { alignSelf:"center",height:4,width:37,borderRadius:5,backgroundColor:p.border,marginBottom:15 },
    menuGroup: { color:p.muted,fontSize:9.5,letterSpacing:1.5,fontWeight:"800",marginBottom:9 },
    menuGrid: { flexDirection:"row",flexWrap:"wrap",columnGap:9,rowGap:9 },
    menuTile: { flexDirection:"row",alignItems:"center",gap:13,width:"100%",minHeight:56,paddingHorizontal:13,paddingVertical:10,backgroundColor:p.elevated,borderRadius:14,borderWidth:1,borderColor:p.border },
    menuTileActive: { borderColor:p.redIcon },
    menuTileIcon: { width:31,height:31,borderRadius:10,backgroundColor:p.red+"20",justifyContent:"center",alignItems:"center" },
    menuTileText: { color:p.text,fontSize:13,fontWeight:"700" },
    menuSoon: { color:p.muted,fontSize:10,marginTop:3 },
    menuLink: { flexDirection:"row",alignItems:"center",gap:12,paddingVertical:14,borderBottomWidth:0.7,borderColor:p.border },
    menuLinkLabel: { color:p.text,flex:1,fontSize:12,fontWeight:"700" },
    modalBackdrop: { flex:1,backgroundColor:"rgba(0,0,0,.72)",justifyContent:"center",paddingHorizontal:24 },
    modalCard: { borderRadius:20,borderWidth:1,borderColor:p.border,backgroundColor:p.surface,padding:19,gap:16 }
  });
}
