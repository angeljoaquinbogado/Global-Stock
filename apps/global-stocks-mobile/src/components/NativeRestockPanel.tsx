import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PackagePlus, X } from "lucide-react-native";
import type { Product } from "../lib/data";

type Palette = {
  surface: string; elevated: string; border: string;
  text: string; muted: string; redIcon: string;
};
function parseQuantity(value: string): number | null {
  const raw = value.trim().replace(/\s/g, "");
  const decimal = raw.replace(",", ".");
  if (!/^\d+(?:\.\d{1,3})?$/.test(decimal)) return null;
  const quantity = Number(decimal);
  return Number.isFinite(quantity) && quantity > 0 && quantity <= 1_000_000 ? quantity : null;
}
function newOperationKey() {
  return "expo-restock-" + Date.now().toString(36) + "-" +
    Math.random().toString(36).slice(2, 14);
}

export default function NativeRestockPanel({
  client, businessId, product, p, online, onCancel, onSaved
}: {
  client: SupabaseClient;
  businessId: string;
  product: Product;
  p: Palette;
  online: boolean;
  onCancel: () => void;
  onSaved: (updatedStock: number) => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{ key: string; amount: number } | null>(null);
  const amount = parseQuantity(quantity);
  const updated = amount == null ? null : Math.round((product.stock + amount) * 1000) / 1000;

  async function addStock() {
    if (busy || !online || amount == null) return;
    if (pending.current && pending.current.amount !== amount) {
      setError("Reintentá la misma cantidad para verificar el ajuste anterior.");
      return;
    }
    setBusy(true);
    setError("");
    if (!pending.current) pending.current = { amount, key: newOperationKey() };
    try {
      const { data, error: writeError } = await client.rpc("global_stock_add_product_stock", {
        target_business_id: businessId,
        target_product_id: product.id,
        added_quantity: amount,
        client_operation_id: pending.current.key
      });
      if (writeError) throw writeError;
      const confirmed = Number(data);
      if (!Number.isFinite(confirmed) || confirmed < 0)
        throw new Error("Supabase no confirmó la cantidad actualizada.");
      pending.current = null;
      onSaved(confirmed);
    } catch (reason) {
      const details = reason instanceof Error ? reason.message : "";
      const uncertain = /fetch|network|timeout|socket|abort|connection|failed to fetch/i.test(details);
      if (!uncertain) pending.current = null;
      setError(uncertain
        ? "No se pudo confirmar la conexión. Reintentá con la misma cantidad: no se sumará dos veces."
        : /not authorized|permission|42501|denied/i.test(details)
          ? "Tu cuenta no tiene permiso para modificar el stock de este negocio."
          : /not found/i.test(details)
            ? "El producto ya no está disponible. Actualizá el inventario."
            : "No se pudo actualizar el stock. " + (details || "Probá nuevamente."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[s.panel, { backgroundColor: p.elevated, borderColor: p.border }]}>
      <View style={s.header}>
        <View style={s.heading}>
          <PackagePlus size={18} color={p.redIcon} />
          <Text style={[s.title, { color: p.text }]}>Sumar stock</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar carga de stock"
          onPress={onCancel} style={s.close}>
          <X size={18} color={p.muted}/>
        </Pressable>
      </View>
      <Text style={[s.product, { color: p.text }]} numberOfLines={2}>{product.name}</Text>
      <Text style={[s.info, { color: p.muted }]}>Disponible: {product.stock.toLocaleString("es-AR")} · Agregá las unidades recibidas</Text>
      <View style={s.inputLine}>
        <TextInput
          style={[s.input, { color: p.text, borderColor: p.border, backgroundColor: p.surface }]}
          accessibilityLabel="Cantidad de stock que querés sumar"
          keyboardType="decimal-pad"
          placeholder="Cantidad"
          placeholderTextColor={p.muted}
          maxLength={14}
          selectTextOnFocus
          value={quantity}
          editable={!busy}
          onChangeText={(value) => { setQuantity(value); setError(""); }}
          onSubmitEditing={() => void addStock()}
          returnKeyType="done"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Agregar stock al inventario"
          disabled={busy || amount == null || !online}
          onPress={() => void addStock()}
          style={[s.save, { backgroundColor: p.redIcon }, (busy || amount == null || !online) && s.disabled]}>
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveText}>Guardar</Text>}
        </Pressable>
      </View>
      {updated != null && <Text style={[s.info, { color: p.muted }]}>
        Stock después del ingreso: {updated.toLocaleString("es-AR")}
      </Text>}
      {!online && <Text style={s.error}>Conectate y actualizá el inventario para agregar stock.</Text>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 13, padding: 13, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 14, fontWeight: "800" },
  close: { minWidth: 35, minHeight: 35, alignItems: "center", justifyContent: "center" },
  product: { fontSize: 13, fontWeight: "700" },
  info: { fontSize: 11.5, lineHeight: 17 },
  inputLine: { flexDirection: "row", alignItems: "center", gap: 9 },
  input: { flex: 1, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, minHeight: 46 },
  save: { minHeight: 46, borderRadius: 11, paddingHorizontal: 21, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  error: { fontSize: 11, color: "#E7A17C", lineHeight: 17 }
});
