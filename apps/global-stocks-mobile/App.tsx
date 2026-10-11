import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
import PreviewMode from "./src/components/PreviewMode";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import ProductForm from "./src/components/ProductForm";

import { loadMobileSupabase } from "./src/lib/supabase";
import { createBusiness, loadBusinesses, loadProducts, type Business, type Product, type SaleDraft, type SaleLine } from "./src/lib/data";
import { cacheBusinesses, cacheProducts, loadOfflineDrafts, readCachedBusinesses, readCachedProducts, saveOfflineDraft } from "./src/lib/offline";

type Tab = "dashboard" | "inventory" | "pos" | "scanner";
type CartLine = SaleLine;

const C = {
  background: "#09090C",
  surface: "#141419",
  raised: "#1C1C23",
  border: "#30303A",
  white: "#FAFAFD",
  secondary: "#A8A9B5",
  red: "#B50914",
  green: "#53D5A5",
  amber: "#F5B86E"
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
    <SafeAreaView style={st.boot} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <Image source={require("./assets/brand-mark.png")} style={st.bootImage}
        resizeMode="contain" accessibilityLabel="Logo de Global Stock" />
      <Text style={st.bootTitle}>Global <Text style={{ color: "#F15A64" }}>Stock</Text></Text>
      <Text style={st.bootSubtitle}>Preparando tu negocio...</Text>
      <ActivityIndicator color={C.red} style={{ marginTop: 18 }} />
    </SafeAreaView>
  );
}

function Login({ onSubmit, onRegister, loading, error }: {
  onSubmit: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  loading: boolean;
  error: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={st.loginWrap} keyboardShouldPersistTaps="handled">
        <Image source={require("./assets/brand-mark.png")} style={st.loginLogoImage}
          resizeMode="contain" accessibilityLabel="Global Stock" />
        <Text style={st.brand}>Global <Text style={{ color: "#F15A64" }}>Stock</Text></Text>
        <Text style={st.subtitle}>Todo tu negocio, conectado.</Text>
        <View style={st.loginCard}>
          <Label>BIENVENIDO</Label>
          <Text style={st.heading}>{registerMode ? "Creá tu cuenta" : "Iniciá sesión"}</Text>
          <Text style={st.helper}>Usá la misma cuenta que en Global Stock web, sin crear otra base de datos.</Text>
          <TextInput
            style={st.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#858594"
            accessibilityLabel="Correo electrónico"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={st.input}
            placeholder="Contraseña"
            placeholderTextColor="#858594"
            accessibilityLabel="Contraseña"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text accessibilityRole="alert" style={st.warning}>{error}</Text> : null}
          <Button
            title={loading ? "Procesando..." : registerMode ? "Crear cuenta" : "Ingresar"}
            disabled={loading || !email.trim() || !password}
            onPress={() => registerMode ? onRegister(email.trim(), password) : onSubmit(email.trim(), password)}
          />
          <Button title={registerMode ? "Ya tengo cuenta · Iniciar sesión" : "No tengo cuenta · Registrarme"} secondary onPress={() => setRegisterMode((old) => !old)} />
        </View>
        <Text style={st.loginFoot}>Sesiones protegidas · Datos de cada negocio aislados</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MobileApp() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [connectionRetry, setConnectionRetry] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [starting, setStarting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
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
    setCart([]);
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
      const created = await createBusiness(supabase, user.id, newBusinessName);
      setBusinesses((list) => [...list.filter((b) => b.id !== created.id), created]);
      setBusiness(created);
      setNewBusinessName("");
      setNotice("Negocio real creado y conectado. Ya podés agregar productos.");
      await cacheBusinesses(user.id, [created]).catch(() => null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo crear el negocio.");
    } finally {
      setCreatingBusiness(false);
    }
  }

  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("No se pudo cerrar la sesión", error.message);
  }

  function add(product: Product) {
    setCart((items) => {
      const existing = items.find((line) => line.product_id === product.id);
      if (existing) return items.map((line) => line.product_id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      return [...items, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1 }];
    });
    setTab("pos");
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

  if (configLoading || (supabase && starting)) return <BrandedBootScreen />;
  if (!supabase) return <PreviewMode connectionError={configError} onRetry={() => setConnectionRetry((n) => n + 1)} />;

  if (!user) return <SafeAreaView style={st.base}><StatusBar style="light" /><Login onSubmit={login} onRegister={register} loading={authLoading} error={authError} /></SafeAreaView>;

  return (
    <SafeAreaView style={st.base} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={st.header}>
        <View style={st.headerBrand}>
          <Image source={require("./assets/brand-mark.png")} style={st.miniLogoImage} resizeMode="contain" accessibilityLabel="Global Stock" />
          <View>
            <Text style={st.headerTitle}>Global Stock</Text>
            <Text style={st.headerSubtitle} numberOfLines={1}>{business?.name ?? "Elegí tu negocio"}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cambiar negocio" style={st.headerAction} onPress={() => setShowBusinessPicker((v) => !v)}>
          <Text style={st.headerActionText}>NEGOCIOS</Text>
        </Pressable>
      </View>

      {showBusinessPicker ? (
        <View style={st.picker}>
          {businesses.map((b) => (
            <Pressable key={b.id} style={st.pickerItem} onPress={() => { setBusiness(b); setShowBusinessPicker(false); setSearch(""); setTab("dashboard"); }}>
              <Text style={{ color: C.white, fontWeight: "700" }}>{b.name}</Text>
              {b.id === business?.id ? <Text style={{ color: C.green }}>Activo</Text> : null}
            </Pressable>
          ))}
          <Button title="Cerrar sesión" secondary onPress={() => { setShowBusinessPicker(false); void logout(); }} />
        </View>
      ) : null}

      {!business ? (
        <View style={st.empty}>
          {businessLoading ? <ActivityIndicator color={C.red} /> : (
            <>
              <Text style={st.heading}>Todavía no hay un negocio conectado</Text>
              <Text style={st.helper}>
                No hay negocios reales vinculados con tu usuario todavía.
                Podés crear uno ahora; la PC y el celular usarán el mismo Supabase.
              </Text>
              <TextInput
                style={st.input}
                placeholder="Nombre de tu negocio"
                placeholderTextColor="#858594"
                accessibilityLabel="Nombre del negocio nuevo"
                value={newBusinessName}
                onChangeText={setNewBusinessName}
                maxLength={100}
              />
              <Button
                title={creatingBusiness ? "Creando negocio..." : "Crear mi negocio en Supabase"}
                disabled={creatingBusiness || newBusinessName.trim().length < 2}
                onPress={() => void createFirstBusiness()}
              />
              {notice ? <Text style={st.warning}>{notice}</Text> : null}
              <Button title="Volver a comprobar" onPress={() => { setRefresh((n) => n + 1); loadBusinesses(supabase!, user.id).then((list) => { setBusinesses(list); setBusiness(list[0] ?? null); }).catch((e: unknown) => setNotice(String(e))); }} />
              <Button title="Cerrar sesión" secondary onPress={() => void logout()} />
            </>
          )}
        </View>
      ) : (
        <>
          {notice ? (
            <View style={st.syncBar}>
              <View style={[st.dot, { backgroundColor: source === "live" ? C.green : C.amber }]} />
              <Text numberOfLines={2} style={st.syncText}>{notice}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Actualizar inventario" onPress={() => setRefresh((n) => n + 1)}>
                <Text style={st.syncRefresh}>Actualizar</Text>
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={st.scroll}
            contentContainerStyle={st.content}
            keyboardShouldPersistTaps="handled"
          >
            {tab === "dashboard" ? (
              <>
                <Label>PANEL CONECTADO</Label>
                <Text style={st.pageTitle}>Tu negocio, en un solo lugar.</Text>
                <Text style={st.helper}>Datos reales del negocio seleccionado. El estado offline se indica arriba.</Text>
                <View style={st.metrics}>
                  {[
                    ["Productos", products.length.toString()],
                    ["Unidades", units.toLocaleString("es-AR")],
                    ["Stock bajo", lowCount.toString()],
                    ["Borradores locales", drafts.length.toString()]
                  ].map(([label, value]) => (
                    <View key={label} style={st.metric}>
                      <Text style={st.metricLabel}>{label}</Text>
                      <Text style={st.metricValue}>{value}</Text>
                    </View>
                  ))}
                </View>
                <View style={st.panel}>
                  <Text style={st.sectionTitle}>Accesos rápidos</Text>
                  <Button title="Consultar inventario" onPress={() => setTab("inventory")} />
                  <Button title="Escanear un producto" secondary onPress={() => { setScanned(false); setTab("scanner"); }} />
                </View>
                <Label>PRODUCTOS DEL NEGOCIO</Label>
                {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} currency={currency} onAdd={add} />)}
                {source === "loading" ? <ActivityIndicator color={C.red} /> : null}
                {source !== "loading" && products.length === 0 ? <Text style={st.helper}>No hay productos cargados en este negocio.</Text> : null}
              </>
            ) : null}

            {tab === "inventory" ? (
              <>
                <Label>INVENTARIO</Label>
                <Text style={st.pageTitle}>Todos tus productos.</Text>
                <Text style={st.helper}>Stock real en Supabase. Actualizá para ver cambios realizados desde la PC. Sin internet se mostrará la última copia.</Text>
                <Button title={showProductForm ? "Cerrar nuevo producto" : "+ Agregar producto real"} secondary onPress={() => setShowProductForm((current) => !current)} />
                {showProductForm ? <ProductForm client={supabase} businessId={business.id} onCreated={() => { setShowProductForm(false); setRefresh((v) => v + 1); setNotice("Producto guardado en Supabase: también estará disponible en la web al actualizarla."); }} onCancel={() => setShowProductForm(false)} /> : null}
                <TextInput
                  style={st.input}
                  accessibilityLabel="Buscar por nombre, SKU o código"
                  placeholder="Buscar por nombre, SKU o código"
                  placeholderTextColor="#858594"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                <View style={st.sectionRow}>
                  <Text style={st.sectionTitle}>{filteredProducts.length} productos</Text>
                  <Pressable accessibilityRole="button" onPress={() => { setScanned(false); setTab("scanner"); }}><Text style={st.link}>Escanear ↗</Text></Pressable>
                </View>
                {filteredProducts.slice(0, 250).map((p) => (
                  <ProductCard key={p.id} product={p} currency={currency} onAdd={add} />
                ))}
                {filteredProducts.length > 250 ? <Text style={st.helper}>Mostrando los primeros 250. Usá la búsqueda para localizar otros productos.</Text> : null}
                {source === "loading" ? <ActivityIndicator color={C.red} /> : null}
                {source !== "loading" && filteredProducts.length === 0 ? <Text style={st.helper}>No se encontraron coincidencias.</Text> : null}
              </>
            ) : null}

            {tab === "pos" ? (
              <>
                <Label>CAJA / VENTAS</Label>
                <Text style={st.pageTitle}>Borradores de venta.</Text>
                <View style={st.caution}>
                  <Text style={st.cautionTitle}>MODO BORRADOR · NO ES UN COBRO</Text>
                  <Text style={st.cautionText}>
                    Podés preparar la venta sin internet. Por seguridad, guardar un borrador NO descuenta inventario,
                    NO confirma el pago y NO sincroniza ventas automáticamente.
                  </Text>
                </View>
                <View style={st.sectionRow}>
                  <Text style={st.sectionTitle}>Productos seleccionados</Text>
                  <Pressable accessibilityRole="button" onPress={() => setTab("inventory")}><Text style={st.link}>Agregar productos ↗</Text></Pressable>
                </View>
                {cart.length === 0 ? <Text style={st.helper}>Agregá productos desde Inventario o Inicio.</Text> : null}
                {cart.map((line) => (
                  <View key={line.product_id} style={st.cartLine}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.productName}>{line.name}</Text>
                      <Text style={st.productMeta}>{money(line.unit_price, currency)} c/u</Text>
                    </View>
                    <View style={st.stepper}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar una unidad de ${line.name}`} onPress={() => adjust(line.product_id, -1)} style={st.stepperBtn}><Text style={st.stepperText}>−</Text></Pressable>
                      <Text style={st.stepperQty}>{line.quantity}</Text>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Añadir una unidad de ${line.name}`} onPress={() => adjust(line.product_id, 1)} style={st.stepperBtn}><Text style={st.stepperText}>+</Text></Pressable>
                    </View>
                  </View>
                ))}
                <View style={st.totalRow}>
                  <Text style={st.helper}>Total estimado</Text>
                  <Text style={st.totalText}>{money(total, currency)}</Text>
                </View>
                <Button title="Guardar borrador en este dispositivo" disabled={cart.length === 0} onPress={() => void saveDraft()} />
                <Label>BORRADORES SIN SINCRONIZAR</Label>
                {drafts.map((d) => (
                  <View key={d.id} style={st.draft}>
                    <Text style={st.productName}>{money(d.total, currency)}</Text>
                    <Text style={st.productMeta}>{d.items.length} productos · {new Date(d.created_at).toLocaleString("es-AR")}</Text>
                    <Text style={st.draftNotice}>Pendiente · Sin venta registrada ni stock descontado</Text>
                  </View>
                ))}
                {drafts.length === 0 ? <Text style={st.helper}>Todavía no guardaste borradores.</Text> : null}
              </>
            ) : null}

            {tab === "scanner" ? (
              <>
                <Label>LECTOR DE CÓDIGOS</Label>
                <Text style={st.pageTitle}>Escaneá tus productos.</Text>
                <Text style={st.helper}>Códigos de barras y QR. La búsqueda utiliza el inventario de este negocio.</Text>
                {!permission ? (
                  <ActivityIndicator color={C.red} />
                ) : !permission.granted ? (
                  <View style={st.panel}>
                    <Text style={st.helper}>Necesitamos permiso para acceder a la cámara.</Text>
                    <Button title="Permitir acceso a la cámara" onPress={() => void requestPermission()} />
                  </View>
                ) : (
                  <View style={st.cameraWrap}>
                    <CameraView
                      style={st.camera}
                      facing="back"
                      barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"]
                      }}
                      onBarcodeScanned={scanned ? undefined : scanResult}
                    />
                    <View pointerEvents="none" style={st.cameraReticle} />
                  </View>
                )}
                <Button title="Volver al inventario" secondary onPress={() => setTab("inventory")} />
              </>
            ) : null}
          </ScrollView>
          <View style={st.tabBar}>
            {([
              ["dashboard", "Inicio"],
              ["inventory", "Inventario"],
              ["scanner", "Escanear"],
              ["pos", "Ventas"]
            ] as const).map(([id, title]) => (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === id }}
                accessibilityLabel={title}
                onPress={() => { if (id === "scanner") setScanned(false); setTab(id); }}
                style={[st.tabItem, tab === id && st.tabItemActive]}
              >
                <Text style={[st.tabText, tab === id && st.tabTextActive]}>{title}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
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
  cautionText: { color: "#E5CFB8", fontSize: 12, lineHeight: 19 },
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
