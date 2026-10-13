import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Barcode, Minus, Plus, RefreshCw, ScanLine, Search, ShoppingCart, Trash2 } from "lucide-react-native";
import type { Business, Product, SaleLine } from "../lib/data";
import NativeCashCheckout, { type CompletedMobileSale } from "./NativeCashCheckout";

type Props = {
  client: SupabaseClient; business: Business; products: Product[];
  cart: SaleLine[]; dark: boolean; online: boolean; refreshToken: number;
  onAdd: (product: Product) => void;
  onAdjust: (productId: string, quantityDelta: number) => void;
  onScan: () => void; onRefresh: () => void;
  onSaveDraft: () => void;
  onCompleted: (sale: CompletedMobileSale) => void;
};
type ServerQuote = {
  subtotal: number; discount: number; total: number;
  currency: string; lines: number;
};
const amount = (n: number, currency: string) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
function validQuote(value: unknown, currency: string, lines: number): value is ServerQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<ServerQuote>;
  return quote.currency === currency && quote.lines === lines &&
    [quote.subtotal, quote.discount, quote.total].every(number =>
      typeof number === "number" && Number.isFinite(number) && number >= 0);
}
export default function NativeCashRegister({
  client, business, products, cart, dark, online, refreshToken,
  onAdd, onAdjust, onScan, onRefresh, onSaveDraft, onCompleted
}: Props) {
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [promoRefresh, setPromoRefresh] = useState(0);
  const [recentSales, setRecentSales] = useState<Array<{
    id: string; total: number; created_at: string;
  }>>([]);
  const [salesError, setSalesError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const palette = useMemo(() => dark ?
    { surface: "#171719", tile: "#202024", line: "#323238", text: "#FAFAFA", muted: "#A3A3AE", red: "#BD101D" } :
    { surface: "#FFF", tile: "#F1F1F4", line: "#DEDEE5", text: "#16161A", muted: "#6A6A76", red: "#A40A14" }, [dark]);
  const s = useMemo(() => styles(palette), [palette]);
  const cartSubtotal = cart.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const subtotal = quote?.subtotal ?? cartSubtotal;
  const promoDiscount = quote?.discount ?? 0;
  const total = quote?.total ?? cartSubtotal;
  const totalItems = cart.reduce((sum, line) => sum + line.quantity, 0);
  const matches = products.filter(item => [item.name, item.barcode, item.sku].some(
    text => text?.toLowerCase().includes(search.trim().toLowerCase())
  )).slice(0, search.trim() ? 16 : 0);

  useEffect(() => {
    if (cart.length > 0) setSaleSuccess(false);
  }, [cart.length]);

  // One server preview replaces separate permission + promotion requests.
  // It uses the same catalog/pricing rules as the final atomic sales RPC.
  const linesSignature = JSON.stringify(cart.map(line => [
    products.find(item => item.id === line.product_id)?.client_key ?? null,
    line.quantity
  ]));
  useEffect(() => {
    let live = true;
    setQuote(null);
    setQuoteError("");
    if (!cart.length) { setQuoteLoading(false); return () => { live = false; }; }
    const lines = cart.map(line => {
      const product = products.find(item => item.id === line.product_id);
      return { productKey: product?.client_key ?? "", quantity: line.quantity };
    });
    if (lines.some(line => !line.productKey || !Number.isInteger(line.quantity) || line.quantity < 1)) {
      setQuoteError("Actualizá los productos del carrito.");
      setQuoteLoading(false);
      return () => { live = false; };
    }
    setQuoteLoading(true);
    void Promise.resolve(client.rpc("global_stock_preview_cash_sale", {
      target_business_id: business.id, sale_lines: lines
    })).then(({data,error}) => {
      if (!live) return;
      if (error) {
        setQuoteError(/not authorized/i.test(error.message)
          ? "No tenés permiso para cobrar."
          : /product|quantity|cart|price/i.test(error.message)
            ? "El carrito cambió. Actualizá Caja."
            : "No se pudo consultar el total. Tocá Actualizar.");
        return;
      }
      if (!validQuote(data, business.base_currency, lines.length)) {
        setQuoteError("No pudimos comprobar el importe de esta venta.");
        return;
      }
      setQuote(data);
    }).catch(() => {
      if (live) setQuoteError("No se pudo conectar para calcular el total.");
    }).finally(() => { if (live) setQuoteLoading(false); });
    return () => { live = false; };
  }, [client, business.id, business.base_currency, linesSignature, promoRefresh, refreshToken]);

  useEffect(() => {
    let live = true;
    setRecentSales([]);
    setSalesError("");
    void Promise.resolve(client.from("global_stock_sales")
      .select("id,total,created_at")
      .eq("business_id", business.id)
      .eq("channel", "pos")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8))
      .then(({ data, error }) => {
        if (!live) return;
        if (error) { setSalesError("No se pudo consultar el historial de Caja."); return; }
        setRecentSales((data ?? []).map(sale => ({
          id: String(sale.id),
          total: Number(sale.total) || 0,
          created_at: String(sale.created_at)
        })));
      }).catch(() => {
        if (live) setSalesError("No se pudo actualizar el historial.");
      });
    return () => { live = false; };
  }, [client, business.id, refreshToken]);

  function findCode() {
    const codeValue = code.trim();
    if (!codeValue || codeValue.length > 64) {
      setMessage("Ingresá un código de hasta 64 caracteres.");
      return;
    }
    const item = products.find(product =>
      product.barcode?.trim().toLowerCase() === codeValue.toLowerCase() ||
      product.sku?.trim().toLowerCase() === codeValue.toLowerCase());
    if (!item) { setMessage("No encontramos ese código en el inventario de este negocio."); return; }
    if (item.stock <= 0) { setMessage("El producto no tiene existencias disponibles."); return; }
    const current = cart.find(line => line.product_id === item.id)?.quantity ?? 0;
    if (current >= item.stock) { setMessage("Ya agregaste todas las unidades disponibles de ese producto."); return; }
    onAdd(item);
    setMessage("");
    setCode("");
  }
  function clearCart() {
    for (const line of cart) onAdjust(line.product_id, -line.quantity);
    setMessage("");
  }

  return <View style={s.container}>
    <View style={{ gap: 5 }}>
      <Text style={s.heading}>Caja</Text>
      <Text style={s.subtitle}>Escaneá o buscá productos para cobrar.</Text>
    </View>

    <View style={s.card}>
      <View style={s.between}><Text style={s.section}>Agregar artículos</Text>
        <Pressable accessibilityRole="button" onPress={onScan} style={s.smallButton}>
          <ScanLine size={17} color={palette.text}/><Text style={s.smallButtonText}>Escanear</Text>
        </Pressable>
      </View>
      <View style={s.searchBox}><Barcode size={18} color={palette.red}/>
        <TextInput style={s.searchInput} value={code}
          onChangeText={text => { setCode(text); setMessage(""); }}
          placeholder="Código de barras o SKU" placeholderTextColor={palette.muted}
          onSubmitEditing={findCode} returnKeyType="search"
          accessibilityLabel="Código de barras para Caja" maxLength={64} autoCorrect={false} autoCapitalize="none"/>
        <Pressable accessibilityRole="button" onPress={findCode} style={s.searchAction}>
          <Text style={s.searchActionText}>Agregar</Text>
        </Pressable>
      </View>
      <View style={s.searchBox}><Search size={16} color={palette.muted}/>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder="Buscar artículos del inventario" placeholderTextColor={palette.muted}
          accessibilityLabel="Buscar productos para Caja"/>
      </View>
      {matches.map(product => {
        const selected = cart.find(item => item.product_id === product.id)?.quantity ?? 0;
        return <View key={product.id} style={s.productRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={s.productInfo}>{product.stock} disponibles · {amount(product.price, business.base_currency)}</Text>
          </View>
          <Pressable accessibilityRole="button"
            accessibilityLabel={"Agregar " + product.name + " a Caja"}
            disabled={product.stock <= selected || product.stock <= 0}
            onPress={() => { onAdd(product); setMessage(""); }}
            style={[s.plus, (product.stock <= selected || product.stock <= 0) && { opacity: .4 }]}>
            <Plus size={19} color="#FFF"/>
          </Pressable>
        </View>;
      })}
      {message ? <Text accessibilityRole="alert" style={s.message}>{message}</Text> : null}
    </View>

    <View style={s.card}>
      <View style={s.between}><Text style={s.section}>Venta actual · {totalItems} {totalItems === 1 ? "unidad" : "unidades"}</Text>
        {cart.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Vaciar carrito"
          onPress={clearCart} style={s.smallButton}><Trash2 size={15} color={palette.red}/></Pressable> : null}
      </View>
      {cart.length === 0 ? <View style={s.empty}>
        <ShoppingCart size={27} color={palette.muted}/>
        <Text style={s.subtitle}>Agregá el primer producto.</Text>
      </View> : cart.map(line => {
        const product = products.find(item => item.id === line.product_id);
        return <View key={line.product_id} style={s.saleRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
            <Text style={s.productName} numberOfLines={2}>{line.name}</Text>
            <Text style={s.productInfo}>{amount(line.unit_price, business.base_currency)} × {line.quantity}</Text>
            <Text style={[s.productName, { fontSize: 12 }]}>{amount(line.quantity * line.unit_price, business.base_currency)}</Text>
          </View>
          <View style={s.quantity}>
            <Pressable accessibilityRole="button" accessibilityLabel={"Quitar una unidad de " + line.name}
              style={s.qtyButton} onPress={() => onAdjust(line.product_id, -1)}>
              <Minus size={16} color={palette.text}/>
            </Pressable>
            <Text style={s.qtyText}>{line.quantity}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={"Agregar una unidad de " + line.name}
              disabled={!product || line.quantity >= product.stock} style={s.qtyButton}
              onPress={() => onAdjust(line.product_id, 1)}>
              <Plus size={16} color={palette.text}/>
            </Pressable>
          </View>
        </View>;
      })}
      <View style={s.divider}/>
      <View style={s.between}><Text style={s.subtitle}>Subtotal</Text><Text style={s.value}>{amount(subtotal, business.base_currency)}</Text></View>
      {promoDiscount > 0 && <View style={s.between}><Text style={s.subtitle}>Descuento</Text>
        <Text style={[s.value, { color: "#58CFA2" }]}>− {amount(promoDiscount, business.base_currency)}</Text>
      </View>}
      <View style={s.between}><Text style={s.totalLabel}>Total a cobrar</Text><Text style={s.total}>{amount(total, business.base_currency)}</Text></View>

      <Pressable accessibilityRole="button" onPress={() => { setPromoRefresh(v => v + 1); onRefresh(); }}
        style={s.smallButton}><RefreshCw size={15} color={palette.muted}/><Text style={s.smallButtonText}>Actualizar</Text></Pressable>
      {cart.length > 0 && <Pressable accessibilityRole="button" onPress={onSaveDraft} style={s.secondary}>
        <Text style={s.smallButtonText}>Guardar presupuesto sin cobrar</Text>
      </Pressable>}
    </View>
    <NativeCashCheckout key={business.id} client={client} business={business}
      products={products} cart={cart} dark={dark} online={online}
      quoteReady={!quoteLoading && !quoteError && quote !== null}
      quoteError={quoteError}
      canSell={quote !== null} expectedTotal={quote?.total ?? 0} discount={promoDiscount}
      onCompleted={(sale) => { setSaleSuccess(true); onCompleted(sale); }}/>
    {saleSuccess && <Text accessibilityRole="alert" style={s.success}>Venta registrada · stock actualizado.</Text>}
    <View style={s.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHistory }}
        onPress={() => setShowHistory(value => !value)} style={s.between}>
        <Text style={s.section}>Últimas ventas</Text>
        <Text style={s.smallButtonText}>{showHistory ? "Ocultar" : "Ver"}</Text>
      </Pressable>
      {showHistory && (salesError ? <Text style={s.message}>{salesError}</Text> :
        recentSales.length === 0 ? <Text style={s.subtitle}>Sin ventas recientes.</Text> :
        recentSales.map(sale => <View key={sale.id} style={s.between}>
          <Text style={s.productInfo}>{new Date(sale.created_at).toLocaleString("es-AR")}</Text>
          <Text style={s.value}>{amount(sale.total, business.base_currency)}</Text>
        </View>))}
    </View>
  </View>;
}
function styles(p: { surface: string; tile: string; line: string; text: string; muted: string; red: string }) {
  return StyleSheet.create({
    container: { gap: 17 },
    kicker: { color: p.red, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
    heading: { color: p.text, fontSize: 26, fontWeight: "800", letterSpacing: -.55 },
    subtitle: { color: p.muted, fontSize: 12, lineHeight: 19 },
    card: { padding: 15, gap: 13, borderRadius: 17, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface },
    between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    section: { color: p.text, fontSize: 15, fontWeight: "800" },
    smallButton: { borderWidth: 1, borderColor: p.line, backgroundColor: p.tile, padding: 10, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    smallButtonText: { color: p.text, fontSize: 11, fontWeight: "700" },
    searchBox: { flexDirection: "row", gap: 9, alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: p.line, backgroundColor: p.tile, paddingLeft: 13 },
    searchInput: { color: p.text, flex: 1, minWidth: 0, paddingVertical: 13, fontSize: 12 },
    searchAction: { backgroundColor: p.red, minHeight: 43, borderTopRightRadius: 11, borderBottomRightRadius: 11, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
    searchActionText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
    productRow: { paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: .7, borderBottomColor: p.line },
    productName: { color: p.text, fontSize: 13, fontWeight: "700" },
    productInfo: { color: p.muted, fontSize: 11, marginTop: 3 },
    plus: { backgroundColor: p.red, width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    message: { color: "#D19A76", fontSize: 11, lineHeight: 18 },
    empty: { justifyContent: "center", alignItems: "center", paddingVertical: 22, gap: 12 },
    saleRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 12, borderBottomWidth: .7, borderBottomColor: p.line },
    quantity: { flexDirection: "row", alignItems: "center", gap: 7 },
    qtyButton: { borderWidth: 1, borderColor: p.line, backgroundColor: p.tile, borderRadius: 8, width: 35, height: 35, alignItems: "center", justifyContent: "center" },
    qtyText: { color: p.text, fontSize: 12, fontWeight: "800", minWidth: 16, textAlign: "center" },
    divider: { height: 1, backgroundColor: p.line },
    value: { color: p.text, fontSize: 12, fontWeight: "700" },
    totalLabel: { color: p.text, fontSize: 14, fontWeight: "800" },
    total: { color: p.text, fontSize: 20, fontWeight: "800" },
    secondary: { borderRadius: 11, padding: 13, borderWidth: 1, borderColor: p.line, backgroundColor: p.tile, alignItems: "center" },
    legal: { color: p.muted, fontSize: 10.5, lineHeight: 17 },
    success: { color: "#53C79A", fontWeight: "700", fontSize: 12, lineHeight: 19 }
  });
}
