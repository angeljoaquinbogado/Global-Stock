import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { Shirt, Beef, Store, Carrot, Croissant, Pill, BookOpen, Hammer, Laptop, Leaf, Scissors, Eye, PawPrint, Gem, UtensilsCrossed, Warehouse, Factory, BriefcaseBusiness, ShoppingBag, Check } from "lucide-react-native";
import PreviewMode from "./src/components/PreviewMode";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import ProductForm from "./src/components/ProductForm";
import NativeWorkspace from "./src/components/NativeWorkspace";
import NativeLegalGate from "./src/components/NativeLegalGate";
import NativeAuthLanding from "./src/components/NativeAuthLanding";

import { loadMobileSupabase } from "./src/lib/supabase";
import { SUPPORT_EMAIL, supportEmailUrl } from "./src/lib/support";
import { createBusiness, loadBusinesses, loadProducts, type Business, type BusinessKind, type Product, type SaleDraft, type SaleLine } from "./src/lib/data";
import { cacheBusinesses, cacheProducts, loadOfflineDrafts, purgeLocalAccountData, readCachedBusinesses, readCachedProducts, saveOfflineDraft } from "./src/lib/offline";

type Tab = "dashboard" | "inventory" | "pos" | "scanner";
type CartLine = SaleLine;
type BusinessCategory = { id: string; label: string; description: string; kind: BusinessKind; icon: typeof Store };
const MOBILE_BUSINESS_CATEGORIES: BusinessCategory[] = [
  { id: "almacen", label: "Almacén / Kiosco", description: "Productos de todos los días", kind: "retail", icon: Store },
  { id: "indumentaria", label: "Indumentaria", description: "Ropa, calzado y accesorios", kind: "retail", icon: Shirt },
  { id: "carniceria", label: "Carnicería", description: "Carnes y embutidos", kind: "retail", icon: Beef },
  { id: "verduleria", label: "Verdulería", description: "Frutas y verduras", kind: "retail", icon: Carrot },
  { id: "panaderia", label: "Panadería", description: "Pan, facturas y pastelería", kind: "retail", icon: Croissant },
  { id: "farmacia", label: "Farmacia", description: "Medicamentos y perfumería", kind: "retail", icon: Pill },
  { id: "libreria", label: "Librería", description: "Libros, útiles y papelería", kind: "retail", icon: BookOpen },
  { id: "ferreteria", label: "Ferretería", description: "Herramientas y materiales", kind: "retail", icon: Hammer },
  { id: "electronica", label: "Electrónica", description: "Celulares y accesorios", kind: "retail", icon: Laptop },
  { id: "dietetica", label: "Dietética", description: "Productos naturales", kind: "retail", icon: Leaf },
  { id: "estetica", label: "Estética", description: "Cosmética y tratamientos", kind: "services", icon: Scissors },
  { id: "optica", label: "Óptica", description: "Anteojos y lentes", kind: "retail", icon: Eye },
  { id: "veterinaria", label: "Veterinaria", description: "Alimentos y productos para mascotas", kind: "services", icon: PawPrint },
  { id: "joyeria", label: "Joyería", description: "Joyas, relojes y accesorios", kind: "retail", icon: Gem },
  { id: "peluqueria", label: "Peluquería", description: "Cuidado del cabello", kind: "services", icon: Scissors },
  { id: "restaurante", label: "Restaurante", description: "Cocina, ingredientes y comedor", kind: "restaurant", icon: UtensilsCrossed },
  { id: "mayorista", label: "Mayorista / Depósito", description: "Distribución y almacenamiento", kind: "wholesale", icon: Warehouse },
  { id: "fabricacion", label: "Taller / Fábrica", description: "Materiales, repuestos e insumos", kind: "industry", icon: Factory },
  { id: "tienda-online", label: "Tienda online", description: "Productos y pedidos", kind: "ecommerce", icon: ShoppingBag },
  { id: "servicios", label: "Servicios", description: "Insumos y materiales de trabajo", kind: "services", icon: BriefcaseBusiness },
  { id: "otro", label: "Otro negocio", description: "Organizá tus productos a tu manera", kind: "other", icon: Store }
];

const C = {
  background: "#09090C",
  surface: "#141419",
  raised: "#1C1C23",
  border: "#30303A",
  white: "#FAFAFD",
  secondary: "#A8A9B5",
  red: "#B50914",
  green: "#53D5A5",
  amber: "#B8B8C3"
};

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency, maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function Button({ title, onPress, secondary, disabled }: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        st.button,
        secondary && st.buttonSecondary,
        disabled && st.dim,
        pressed && st.pressed
      ]}
    >
      <Text style={[st.buttonText, secondary && st.buttonSecondaryText]}>{title}</Text>
    </Pressable>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={st.label}>{children}</Text>;
}

function ProductCard({ product, currency, onAdd }: {
  product: Product;
  currency: string;
  onAdd?: (product: Product) => void;
}) {
  const low = product.stock <= product.min_stock;
  return (
    <View style={st.productCard}>
      <View style={{ flex: 1 }}>
        <Text style={st.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={st.productMeta}>{product.sku || product.barcode || product.category || "Sin código"}</Text>
        <Text style={[st.productMeta, { color: low ? C.amber : C.green }]}>
          {product.stock} unidades {low ? "· Revisar stock" : "· Disponible"}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 9 }}>
        <Text style={st.productPrice}>{money(product.price, currency)}</Text>
        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${product.name} al borrador`}
            onPress={() => onAdd(product)}
            style={st.addButton}
          >
            <Text style={st.addButtonText}>+ Agregar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BrandedBootScreen() {
  return (
    <SafeAreaView style={[st.boot, { backgroundColor: "#09090C" }]} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <Image source={require("./assets/brand-mark.png")} style={st.bootImage}
        resizeMode="contain" accessibilityLabel="Logo de Global Stock" />
      <View style={st.bootTextPlate}>
        <Text style={st.bootTitle}>Global <Text style={{ color: "#F15A64" }}>Stock</Text></Text>
        <Text style={st.bootSubtitle}>Preparando tu negocio...</Text>
      </View>
      <ActivityIndicator color={C.red} style={{ marginTop: 18 }} />
    </SafeAreaView>
  );
}

function MobileApp() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [connectionRetry, setConnectionRetry] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [legalUserId, setLegalUserId] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginViewVersion, setLoginViewVersion] = useState(0);
  const signOutLock = useRef(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessType, setNewBusinessType] = useState<BusinessKind>("retail");
  const [newBusinessCategory, setNewBusinessCategory] = useState("almacen");
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<"loading" | "live" | "cache" | "empty">("loading");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drafts, setDrafts] = useState<SaleDraft[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    let active = true;
    setConfigLoading(true);
    void loadMobileSupabase()
      .then((client) => {
        if (!active) return;
        setConfigError("");
        setSupabase(client);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setConfigError(error instanceof Error ? error.message : "No se pudo conectar con Supabase.");
        setSupabase(null);
      })
      .finally(() => { if (active) setConfigLoading(false); });
    return () => { active = false; };
  }, [connectionRetry]);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setAuthError(error.message);
      setUser(data.session?.user ?? null);
    }).catch((error: unknown) => {
      if (alive) setAuthError(error instanceof Error ? error.message : "No se pudo iniciar la sesión.");
    }).finally(() => { if (alive) setStarting(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      if (!session) {
        setLegalUserId(null);
        setBusiness(null);
        setBusinesses([]);
        setProducts([]);
        setCart([]);
        setDrafts([]);
        setTab("dashboard");
      }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [supabase]);

  // Resume session renewal in the foreground; do not refresh a backgrounded app.
  useEffect(() => {
    if (!supabase) return;
    const update = (state: string) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    update(AppState.currentState);
    const subscription = AppState.addEventListener("change", update);
    return () => { subscription.remove(); supabase.auth.stopAutoRefresh(); };
  }, [supabase]);

  useEffect(() => {
    if (!user || !supabase) return;
    let alive = true;
    setBusinessLoading(true);
    const userId = user.id;
    void (async () => {
      const cached = await readCachedBusinesses(userId).catch(() => null);
      if (!alive) return;
      if (cached?.length) {
        setBusinesses(cached);
        setBusiness((prior) => cached.find((b) => b.id === prior?.id) ?? cached[0]);
        setNotice("Negocios cargados desde la copia local hasta confirmar conexión.");
      }
      try {
        const list = await loadBusinesses(supabase!, userId);
        if (!alive) return;
        setBusinesses(list);
        setBusiness((prior) => list.find((b) => b.id === prior?.id) ?? list[0] ?? null);
        await cacheBusinesses(userId, list).catch(() => null);
      } catch (error: unknown) {
        if (alive) setNotice(cached?.length
          ? "Sin conexión. Negocios mostrados desde caché; permisos aún no revalidados."
          : `No se pudieron cargar los negocios: ${error instanceof Error ? error.message : "Error de red"}`);
      } finally {
        if (alive) setBusinessLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, supabase]);

  useEffect(() => {
    if (!user || !business || !supabase) return;
    let alive = true;
    const userId = user.id;
    const businessId = business.id;
    setProducts([]);
    setDrafts([]);
    setSource("loading");
    // Refreshing prices or inventory must never discard an in-progress cash sale.
    // Business changes and sign-out clear the cart in their dedicated handlers.
    (async () => {
      const [cached, localDrafts] = await Promise.all([
        readCachedProducts(userId, businessId).catch(() => null),
        loadOfflineDrafts(userId, businessId).catch(() => [] as SaleDraft[])
      ]);
      if (!alive) return;
      setDrafts(localDrafts);
      if (cached) {
        setProducts(cached.products);
        setSource("cache");
        setNotice(`Copia local · ${new Date(cached.cachedAt).toLocaleDateString("es-AR")}`);
      }
      try {
        const live = await loadProducts(supabase!, businessId);
        if (!alive) return;
        setProducts(live);
        // Apply server prices/stock to the open cart after a refresh.
        setCart((lines) => lines.flatMap((line) => {
          const current = live.find((item) => item.id === line.product_id);
          if (!current || !current.active || current.stock <= 0) return [];
          return [{ ...line, unit_price: current.price,
            quantity: Math.min(line.quantity, Math.floor(current.stock)) }];
        }).filter((line) => line.quantity > 0));
        setSource("live");
        setNotice("Inventario sincronizado");
        await cacheProducts(userId, businessId, live).catch(() => null);
      } catch (error) {
        if (!alive) return;
        if (!cached) {
          setSource("empty");
          setNotice(error instanceof Error ? error.message : "No hay conexión ni copia local.");
        } else {
          setNotice("Sin conexión · mostrando la última copia local, posiblemente desactualizada.");
        }
      }
    })().catch((error: unknown) => {
      if (alive) {
        setSource("empty");
        setNotice(error instanceof Error ? error.message : "Error de almacenamiento local.");
      }
    });
    return () => { alive = false; };
  }, [user?.id, business?.id, refresh, supabase]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.barcode, p.category].some((part) => part?.toLowerCase().includes(q))
    );
  }, [products, search]);
  const units = products.reduce((n, p) => n + p.stock, 0);
  const lowCount = products.filter((p) => p.stock <= p.min_stock).length;
  const total = cart.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const currency = business?.base_currency || "ARS";

  async function login(email: string, password: string) {
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message.toLowerCase().includes("invalid login credentials")
          ? "Correo o contraseña incorrectos. La cuenta de demostración no sirve para iniciar sesión: usá tu cuenta real."
          : error.message);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function register(email: string, password: string) {
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else if (!data.session) setAuthError("Revisá tu correo para confirmar el registro; después iniciá sesión.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo crear la cuenta.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function createFirstBusiness() {
    if (!supabase || !user || creatingBusiness) return;
    setCreatingBusiness(true);
    setNotice("");
    try {
      const created = await createBusiness(supabase, user.id, newBusinessName, newBusinessType);
      setBusinesses((list) => [...list.filter((b) => b.id !== created.id), created]);
      setBusiness(created);
      setNewBusinessName("");
      setNewBusinessType("retail");
      setNewBusinessCategory("almacen");
      setNotice("Negocio real creado y conectado. Ya podés agregar productos.");
      await cacheBusinesses(user.id, [created]).catch(() => null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo crear el negocio.");
    } finally {
      setCreatingBusiness(false);
    }
  }

  async function performLogout() {
    if (!supabase || signOutLock.current) return;
    signOutLock.current = true;
    setLoggingOut(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        throw new Error("No se pudo comprobar la sesión. No se borraron datos locales.");
      }

      // Keep privacy cleanup transactional and require a successful logout.
      await purgeLocalAccountData(session.user.id);
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw new Error("No se pudo cerrar la sesión. Volvé a intentar.");

      // The auth listener normally resets these immediately. Also reset
      // explicitly, keeping the branded transition until iOS dismisses alerts.
      setAuthError("");
      setUser(null);
      setLegalUserId(null);
      setBusiness(null);
      setBusinesses([]);
      setProducts([]);
      setCart([]);
      setDrafts([]);
      setNotice("");
      setSource("loading");
      setTab("dashboard");
      setStarting(false);
      setLoginViewVersion((n) => n + 1);
      await new Promise<void>((resolve) => setTimeout(resolve, 450));
    } catch (error) {
      Alert.alert(
        "No se completó el cierre de sesión",
        error instanceof Error ? error.message : "Error de almacenamiento. Reintentá."
      );
    } finally {
      setLoggingOut(false);
      signOutLock.current = false;
    }
  }

  function logout() {
    if (!supabase || signOutLock.current) return;
    Alert.alert(
      "Cerrar sesión en este dispositivo",
      "Por privacidad, se borrarán las copias locales del inventario y los presupuestos no sincronizados de esta cuenta. Esto no elimina los datos guardados en Global Stock web. ¿Querés continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar y borrar copia local",
          style: "destructive",
          onPress: () => {
            // Wait for the native confirmation alert to disappear before
            // unmounting the authenticated navigation tree on iOS.
            setTimeout(() => { void performLogout(); }, 360);
          }
        }
      ]
    );
  }

  function add(product: Product) {
    if (!product.active || !Number.isFinite(product.price) || product.price < 0) return;
    setCart((items) => {
      const existing = items.find((line) => line.product_id === product.id);
      if (existing) {
        return items.map((line) => line.product_id === product.id
          ? { ...line, unit_price: product.price,
              quantity: Math.min(Math.floor(product.stock), line.quantity + 1) }
          : line);
      }
      if (product.stock < 1) return items;
      return [...items, { product_id: product.id, name: product.name,
        unit_price: product.price, quantity: 1 }];
    });
  }

  function adjust(id: string, delta: number) {
    setCart((items) => items.map((line) =>
      line.product_id === id ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line
    ).filter((line) => line.quantity > 0));
  }

  async function saveDraft() {
    if (!business || !user || cart.length === 0) return;
    const draft: SaleDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      business_id: business.id,
      created_at: new Date().toISOString(),
      total,
      items: cart.map((line) => ({ ...line }))
    };
    try {
      await saveOfflineDraft(user.id, draft);
      setDrafts((items) => [draft, ...items]);
      setCart([]);
      Alert.alert(
        "Borrador guardado en el dispositivo",
        "Esto NO es una venta cobrada, no descuenta stock ni se sincroniza automáticamente. No entregues mercadería hasta confirmar el cobro en el sistema online."
      );
    } catch (error) {
      Alert.alert("No se guardó el borrador", error instanceof Error ? error.message : "Error de almacenamiento.");
    }
  }

  const scanResult = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setSearch(data.trim());
    setTab("inventory");
    const found = products.some((p) => p.barcode === data.trim() || p.sku === data.trim());
    setNotice(found ? `Producto encontrado: ${data.trim()}` : `Código ${data.trim()}: no está en el inventario cargado`);
  };

  if (configLoading || (supabase && starting) || loggingOut) return <BrandedBootScreen />;
  if (!supabase) return <PreviewMode connectionError={configError} onRetry={() => setConnectionRetry((n) => n + 1)} />;

  if (!user) return <NativeAuthLanding key={`login-${loginViewVersion}`} onSubmit={login} onRegister={register} loading={authLoading} error={authError} />;

  if (legalUserId !== user.id) {
    return <NativeLegalGate
      client={supabase} userId={user.id}
      onReady={() => setLegalUserId(user.id)}
      onSignOut={() => void logout()}
    />;
  }

  if (!business) {
    return (
      <SafeAreaView style={[st.base, { paddingHorizontal: 23 }]}>
        <StatusBar style="light" />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: 16, paddingVertical: 25 }}>
        <Image source={require("./assets/brand-mark.png")} style={{width:80,height:80}} resizeMode="contain"/>
        <Text style={[st.heading,{fontSize:24}]}>Configurá tu negocio</Text>
        <Text style={st.helper}>Todavía no hay negocios vinculados con tu cuenta. Creá uno para usar la misma información desde PC y celular.</Text>
        <TextInput
          value={newBusinessName}
          onChangeText={setNewBusinessName}
          placeholder="Nombre del negocio"
          placeholderTextColor={C.secondary}
          accessibilityLabel="Nombre del negocio"
          style={st.input}
          maxLength={100}
        />
        <Text style={[st.helper,{fontWeight:"700",fontSize:16,color:C.white}]}>¿A qué se dedica tu negocio?</Text>
        <Text style={st.helper}>Elegí lo que más se parezca. Después podés cargar cualquier producto o insumo.</Text>
        <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",rowGap:10}}>
          {MOBILE_BUSINESS_CATEGORIES.map(item => {
            const Icon = item.icon;
            const selected = newBusinessCategory === item.id;
            return <Pressable key={item.id} accessibilityRole="button"
              accessibilityLabel={item.label} accessibilityState={{selected}}
              onPress={() => {setNewBusinessType(item.kind);setNewBusinessCategory(item.id);}}
              style={{width:"48.5%",minHeight:121,padding:13,borderRadius:15,
                borderWidth:1.5,borderColor:selected?"#E02D40":C.border,
                backgroundColor:selected?"#381018":C.raised,justifyContent:"space-between"}}>
              <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
                <Icon size={23} color={selected?"#FF6575":"#F2F2F7"} strokeWidth={1.9}/>
                {selected?<Check size={16} color="#FF7783"/>:null}
              </View>
              <View style={{gap:4}}>
                <Text style={{color:C.white,fontSize:13,fontWeight:"800"}}>{item.label}</Text>
                <Text style={{color:selected?"#F3B6C0":C.secondary,fontSize:11,lineHeight:15}}>{item.description}</Text>
              </View>
            </Pressable>;
          })}
        </View>
        <Button title={creatingBusiness ? "Creando..." : "Crear negocio real"} disabled={creatingBusiness || newBusinessName.trim().length < 2} onPress={() => void createFirstBusiness()} />
        {notice ? <View style={{gap:5}}><Text style={st.warning}>{notice}</Text><Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(supportEmailUrl("Ayuda para crear un negocio"))}><Text style={{color:C.red,fontWeight:"700"}}>{SUPPORT_EMAIL}</Text></Pressable></View> : null}
        {businessLoading ? <ActivityIndicator color={C.red}/> : <Button title="Volver a comprobar" secondary onPress={() => {
          if (!supabase || !user) return;
          setBusinessLoading(true);
          loadBusinesses(supabase,user.id).then((list) => {setBusinesses(list);setBusiness(list[0] ?? null);}).catch((e: unknown) => setNotice(e instanceof Error ? e.message : "No se pudieron cargar los negocios")).finally(() => setBusinessLoading(false));
        }}/>}
        <Button title="Cerrar sesión" secondary onPress={() => void logout()}/>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <NativeWorkspace
      client={supabase}
      userId={user.id}
      business={business}
      businesses={businesses}
      products={products}
      source={source}
      notice={notice}
      drafts={drafts}
      cart={cart}
      refreshToken={refresh}
      onRefresh={() => setRefresh((v) => v + 1)}
      onBusiness={(selected) => {
        setBusiness(selected);
        setCart([]);
        setSearch("");
      }}
      onReloadBusinesses={async () => {
        if (!supabase || !user) return;
        const list = await loadBusinesses(supabase,user.id);
        setBusinesses(list);
        await cacheBusinesses(user.id,list).catch(() => null);
      }}
      onSignOut={() => void performLogout()}
      onAdd={add}
      onAdjust={adjust}
      onSaveDraft={() => void saveDraft()}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  base: { flex: 1, backgroundColor: C.background },
  boot: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  bootImage: { width: 150, height: 150 },
  bootTextPlate: { backgroundColor: "#09090C", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 13, borderRadius: 16, marginTop: 8 },
  bootTitle: { color: C.white, fontWeight: "900", fontSize: 31, letterSpacing: -1, marginTop: 16 },
  bootSubtitle: { color: C.secondary, fontSize: 14, marginTop: 10 },
  loginLogoImage: { width: 90, height: 90, marginBottom: 7 },
  miniLogoImage: { width: 38, height: 38 },
  centered: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingVertical: 22, gap: 14, paddingBottom: 45 },
  logo: { width: 64, height: 64, borderRadius: 22, backgroundColor: C.red, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoSymbol: { fontSize: 30, fontWeight: "900", color: C.white },
  brand: { color: C.white, fontSize: 30, fontWeight: "900", letterSpacing: -1.5 },
  subtitle: { color: C.secondary, marginTop: 5, fontSize: 14 },
  loginWrap: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 26, justifyContent: "center" },
  loginCard: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 20, marginTop: 24, gap: 13 },
  loginFoot: { color: C.secondary, textAlign: "center", marginTop: 14, fontSize: 11 },
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 2.1, color: "#F56B73" },
  heading: { color: C.white, fontSize: 25, lineHeight: 30, fontWeight: "800", letterSpacing: -0.7 },
  pageTitle: { color: C.white, fontSize: 26, fontWeight: "800", lineHeight: 31, letterSpacing: -0.8 },
  helper: { color: C.secondary, fontSize: 13, lineHeight: 20 },
  input: { color: C.white, borderWidth: 1, borderColor: C.border, backgroundColor: "#1D1D24", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, minHeight: 48 },
  button: { backgroundColor: C.red, padding: 15, borderRadius: 12, alignItems: "center", justifyContent: "center", minHeight: 48 },
  buttonSecondary: { borderColor: C.border, borderWidth: 1, backgroundColor: C.raised },
  buttonText: { color: C.white, fontWeight: "800", fontSize: 13 },
  buttonSecondaryText: { color: C.white },
  dim: { opacity: 0.4 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  configWrap: { flex: 1, padding: 28, gap: 18, justifyContent: "center" },
  header: { paddingVertical: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerBrand: { flexDirection: "row", gap: 10, alignItems: "center", flex: 1 },
  miniLogo: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.red, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: C.white, fontSize: 15, fontWeight: "800" },
  headerSubtitle: { color: C.secondary, fontSize: 11, maxWidth: 190 },
  headerAction: { backgroundColor: C.raised, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: C.border },
  headerActionText: { color: C.white, fontSize: 10, letterSpacing: 0.5, fontWeight: "800" },
  picker: { padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  pickerItem: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: C.raised, borderRadius: 10 },
  empty: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  warning: { color: C.amber, fontSize: 13, lineHeight: 19 },
  syncBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 8, gap: 9, backgroundColor: "#15151B" },
  dot: { width: 7, height: 7, borderRadius: 6 },
  syncText: { color: C.secondary, fontSize: 11, flex: 1 },
  syncRefresh: { color: "#EF777D", fontSize: 11, fontWeight: "800" },
  metrics: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  metric: { width: "48%", minHeight: 90, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 14, padding: 14, justifyContent: "space-between" },
  metricLabel: { color: C.secondary, fontSize: 12 },
  metricValue: { color: C.white, fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  panel: { gap: 14, borderRadius: 16, padding: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  sectionTitle: { color: C.white, fontSize: 15, fontWeight: "800" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  link: { color: "#F07077", fontSize: 12, fontWeight: "800" },
  productCard: { flexDirection: "row", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, gap: 8 },
  productName: { color: C.white, fontSize: 13, fontWeight: "800", lineHeight: 18 },
  productMeta: { color: C.secondary, fontSize: 11, marginTop: 5, lineHeight: 15 },
  productPrice: { color: C.white, fontSize: 13, fontWeight: "800" },
  addButton: { backgroundColor: "#6C1017", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: C.white, fontSize: 11, fontWeight: "800" },
  caution: { borderWidth: 1, borderColor: "#6F4520", backgroundColor: "#2A2119", borderRadius: 12, padding: 13, gap: 7 },
  cautionTitle: { color: C.amber, fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  cautionText: { color: "#B8B8C3", fontSize: 12, lineHeight: 19 },
  cartLine: { flexDirection: "row", padding: 13, borderRadius: 13, borderColor: C.border, borderWidth: 1, backgroundColor: C.surface, alignItems: "center" },
  stepper: { flexDirection: "row", gap: 8, alignItems: "center" },
  stepperBtn: { width: 30, height: 30, justifyContent: "center", alignItems: "center", borderRadius: 8, backgroundColor: C.raised },
  stepperText: { color: C.white, fontSize: 18, fontWeight: "800" },
  stepperQty: { color: C.white, fontSize: 13, fontWeight: "800", minWidth: 14, textAlign: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  totalText: { fontSize: 21, fontWeight: "900", color: C.white },
  draft: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  draftNotice: { color: C.amber, marginTop: 7, fontSize: 11 },
  cameraWrap: { height: 360, borderRadius: 20, overflow: "hidden", backgroundColor: "#000", position: "relative" },
  camera: { flex: 1 },
  cameraReticle: { position: "absolute", left: "15%", right: "15%", top: "25%", bottom: "25%", borderColor: C.red, borderWidth: 2, borderRadius: 18 },
  tabBar: { flexDirection: "row", padding: 8, gap: 6, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: "#111115" },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 9 },
  tabItemActive: { backgroundColor: "#7D1119" },
  tabText: { color: C.secondary, fontSize: 11, fontWeight: "800" },
  tabTextActive: { color: C.white }
});
