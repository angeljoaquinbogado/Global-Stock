import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CreditCard, ShieldCheck, Wallet } from "lucide-react-native";
import type { Business, Product, SaleLine } from "../lib/data";

export type CompletedMobileSale = {
  id: string; lines: SaleLine[]; createdAt: string;
  method: "cash" | "transfer"; total: number;
};
type Props = {
  client: SupabaseClient; business: Business; products: Product[];
  cart: SaleLine[]; online: boolean; dark: boolean;
  onCompleted: (sale: CompletedMobileSale) => void;
  expectedTotal: number; discount: number; quoteReady: boolean;
  canSell: boolean;
};
const money = (v: number, currency: string) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
const cents = (value: number) => Math.round(value * 100) / 100;
function parseTendered(value: string) {
  const text = value.trim().replace(/\s/g, "");
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, "") : text;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000_000 ? cents(amount) : null;
}
function newKey() { return "expo-cash-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14); }
export default function NativeCashCheckout({
  client, business, products, cart, online, dark, onCompleted,
  expectedTotal, discount, quoteReady, canSell
}: Props) {
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [received, setReceived] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const operation = useRef<{ signature: string; key: string } | null>(null);
  const colors = useMemo(() => dark ? {
    surface: "#19191D", tile: "#25252B", border: "#37373F", text: "#FAFAFD", muted: "#ADADB7"
  } : {
    surface: "#FFFFFF", tile: "#F2F2F6", border: "#E0E0E6", text: "#18181E", muted: "#666673"
  }, [dark]);
  const s = useMemo(() => styles(colors), [colors]);
  const total = cents(expectedTotal);
  const tendered = parseTendered(received);
  const change = tendered == null ? null : cents(tendered - total);
  const validCash = method !== "cash" || (change !== null && change >= 0);
  const cartSignature = JSON.stringify({
    business: business.id, lines: cart.map(item =>
      [item.product_id, item.quantity, item.unit_price]), method, total, discount
  });
  const signature = JSON.stringify({cartSignature, receivedAmount: method === "cash" ? tendered : total});
  const uncertainChanged = uncertain && operation.current?.signature !== signature;
  const valid = cart.length > 0 && online && canSell && quoteReady &&
    Number.isFinite(total) && total > 0 && validCash && !uncertainChanged;
  const blockReason = !cart.length ? "" : !online ? "Actualizá el stock para cobrar." :
    !quoteReady ? "Comprobando Caja…" :
    !canSell ? "Esta cuenta no tiene permiso para cobrar." :
    total <= 0 ? "El importe debe ser mayor que cero." :
    uncertainChanged ? "Cobro pendiente de verificación. Revisá el historial." :
    !validCash ? "Ingresá el dinero recibido." : "";

  useEffect(() => {
    setReceived("");
    setError("");
  }, [cartSignature]);

  async function completeSale() {
    if (busy || !valid) return;
    setBusy(true);
    setError("");
    try {
      const saleLines = cart.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product || !product.active || !product.client_key)
          throw new Error("Hay productos sin identificador de inventario. Actualizá la lista.");
        if (!Number.isInteger(item.quantity) || item.quantity < 1 ||
            item.quantity > product.stock)
          throw new Error("Las cantidades superan el stock disponible. Actualizá el inventario.");
        return { productKey: product.client_key, quantity: item.quantity };
      });
      if (!operation.current) operation.current = { signature, key: newKey() };
      if (operation.current.signature !== signature)
        throw new Error("La operación anterior quedó sin confirmar. Revisá el historial antes de cambiar el carrito.");
      // One atomic RPC. Prices and active promotions are recalculated server-side.
      // The payment amount must exactly match the server's total or nothing is saved.
      const { data, error: rpcError } = await client.rpc("global_stock_record_pos_sale", {
        target_business_id: business.id,
        operation_id: operation.current.key,
        sale_currency: business.base_currency,
        sale_total: total,
        sale_cost_total: 0,
        target_customer_id: null,
        sale_lines: saleLines,
        sale_payments: [{ method, amount: total }],
        received_amount: method === "cash" ? tendered : total
      });
      if (rpcError) throw rpcError;
      const id = String(data ?? "");
      if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("No se pudo verificar la venta registrada.");
      operation.current = null;
      setUncertain(false);
      setReceived("");
      onCompleted({ id, lines: cart.map(line => ({ ...line })),
        method, total, createdAt: new Date().toISOString() });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo registrar el cobro.";
      const connectionLost = /network|fetch|timeout|abort|connection|socket/i.test(message);
      if (connectionLost) setUncertain(true);
      else { operation.current = null; setUncertain(false); }
      const lower = message.toLowerCase();
      setError(connectionLost ? "Conexión interrumpida. Revisá el historial antes de reintentar." :
        /stock|insufficient|inventory/i.test(lower) ? "Stock insuficiente. Actualizá el inventario." :
        /mismatch|price|promotion|total/i.test(lower) ? "Cambió el importe. Actualizá Caja." :
        /product not found|invalid sale line/i.test(lower) ? "No encontramos el producto. Actualizá Caja." :
        /permission|authorized|policy/i.test(lower) ? "Tu cuenta no tiene permiso para cobrar." :
        /quantity|cantidad/i.test(lower) ? "Revisá las cantidades del carrito." :
        "No se pudo registrar el cobro. Actualizá e intentá otra vez.");
      if (!connectionLost) console.warn("[Global Stock Caja] Sale rejected", message);
    } finally {
      setBusy(false);
    }
  }

  return <View style={s.panel}>
    <View style={s.row}><Wallet size={19} color="#D52C3A"/><Text style={s.heading}>Cobro</Text></View>
    <View style={s.row}>
      {([["cash", "Efectivo"], ["transfer", "Transferencia"]] as const).map(([id, label]) =>
        <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: method === id }}
          onPress={() => { setMethod(id); setError(""); }}
          style={[s.option, method === id && s.selected]}>
          <Text style={[s.optionText, method === id && { color: "#FFF" }]}>{label}</Text>
        </Pressable>)}
    </View>
    {method === "cash" ? <View style={{ gap: 9 }}>
      <Text style={s.small}>Dinero recibido ({business.base_currency})</Text>
      <TextInput style={s.input} value={received} maxLength={18} keyboardType="decimal-pad"
        accessibilityLabel="Dinero recibido en efectivo" placeholder="Ej.: 20000"
        placeholderTextColor={colors.muted} onChangeText={setReceived}/>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000]
          .filter((value, index, values) => value > 0 && values.indexOf(value) === index)
          .map(value => <Pressable accessibilityRole="button" key={value}
            accessibilityLabel={"Recibido " + money(value, business.base_currency)}
            onPress={() => setReceived(String(value))} style={s.quick}>
            <Text style={s.optionText}>{money(value, business.base_currency)}</Text>
          </Pressable>)}
      </View>
      <View style={[s.amountBox, { backgroundColor: colors.tile }]}>
        <Text style={s.small}>Vuelto automático</Text>
        <Text style={[s.big, { color: change != null && change >= 0 ? "#5FD1A2" : colors.text }]}>
          {change === null ? "—" : money(Math.max(0, change), business.base_currency)}
        </Text>
        {change != null && change < 0 &&
          <Text style={s.error}>Faltan {money(Math.abs(change), business.base_currency)} para completar el pago.</Text>}
      </View>
    </View> : <View style={[s.amountBox, { backgroundColor: colors.tile }]}>
      <CreditCard size={16} color="#E5B073"/>
      <Text style={s.small}>Comprobá que la transferencia esté acreditada en tu cuenta. Global Stock no la verifica automáticamente.</Text>
    </View>}
    {(error || blockReason) ? <Text accessibilityRole={error ? "alert" : undefined} style={s.error}>{error || blockReason}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Confirmar cobro y registrar venta"
      disabled={!valid || busy} onPress={() => void completeSale()}
      style={[s.confirm, (!valid || busy) && { opacity: .4 }]}>
      {busy ? <ActivityIndicator color="#FFF"/> : <>
        <ShieldCheck size={18} color="#FFF"/><Text style={s.confirmText}>Confirmar cobro · {money(total, business.base_currency)}</Text>
      </>}
    </Pressable>
    <Text style={s.tiny}>Presioná solo cuando hayas recibido el pago. El stock se actualiza al confirmar.</Text>
  </View>;
}
function styles(p: { surface: string; tile: string; border: string; text: string; muted: string }) {
  return StyleSheet.create({
    panel: { backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: 18, padding: 15, gap: 14 },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    heading: { color: p.text, fontSize: 17, fontWeight: "800" },
    small: { color: p.muted, fontSize: 12, lineHeight: 18 },
    big: { color: p.text, fontSize: 25, fontWeight: "800" },
    savings: { color: "#5FD1A2", fontSize: 12, fontWeight: "700" },
    amountBox: { padding: 15, borderRadius: 13, gap: 8 },
    option: { flex: 1, minHeight: 43, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: p.border, borderRadius: 11 },
    selected: { backgroundColor: "#970013", borderColor: "#970013" },
    optionText: { color: p.text, fontSize: 12, fontWeight: "700" },
    quick: { borderWidth: 1, borderColor: p.border, padding: 9, borderRadius: 9 },
    input: { borderWidth: 1, borderColor: p.border, backgroundColor: p.tile, borderRadius: 12, color: p.text, padding: 13, fontSize: 18 },
    error: { color: "#E6A77E", fontSize: 11, lineHeight: 17 },
    checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: p.border, borderRadius: 7, alignItems: "center", justifyContent: "center" },
    confirm: { minHeight: 51, backgroundColor: "#9F0013", borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
    confirmText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
    tiny: { color: p.muted, fontSize: 10.5, lineHeight: 17 }
  });
}
