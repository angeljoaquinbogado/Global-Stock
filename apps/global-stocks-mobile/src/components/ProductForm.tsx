import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createProduct } from "../lib/data";

type Props = {
  client: SupabaseClient;
  businessId: string;
  onCreated: () => void;
  onCancel: () => void;
};

function amount(text: string) {
  const value = Number(text.trim().replace(",", "."));
  return value;
}

export default function ProductForm({ client, businessId, onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Keep one stable idempotency key while retrying an uncertain network write.
  const operationKey = useRef(`mobile-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

  const fields = [
    ["Nombre del producto", name, setName, "default"],
    ["Código de barras (opcional)", barcode, setBarcode, "default"],
    ["Categoría (opcional)", category, setCategory, "default"],
    ["Precio de venta (ARS)", price, setPrice, "decimal-pad"],
    ["Stock inicial", stock, setStock, "decimal-pad"],
    ["Avisar stock bajo desde", minStock, setMinStock, "decimal-pad"]
  ] as const;

  async function submit() {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await createProduct(
        client,
        businessId,
        {
          name,
          barcode,
          category,
          price: amount(price),
          stock: amount(stock),
          minStock: amount(minStock)
        },
        operationKey.current
      );
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={st.card}>
      <Text style={st.caption}>PRODUCTO REAL · SUPABASE</Text>
      <Text style={st.title}>Nuevo producto</Text>
      <Text style={st.info}>
        Se guardará en el mismo negocio de Global Stock web. Lo vas a poder
        consultar desde otro dispositivo después de actualizar.
      </Text>
      {fields.map(([label, value, onChange, keyboardType]) => (
        <View key={label} style={st.field}>
          <Text style={st.label}>{label}</Text>
          <TextInput
            style={st.input}
            accessibilityLabel={label}
            placeholder={label}
            placeholderTextColor="#8E8E9B"
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
          />
        </View>
      ))}
      {error ? <Text accessibilityRole="alert" style={st.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Guardar producto en Supabase"
        disabled={saving || name.trim().length < 2 || !price.trim() || !stock.trim()}
        onPress={() => void submit()}
        style={[st.save, (saving || !name.trim() || !price.trim() || !stock.trim()) && st.disabled]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={st.saveText}>Guardar en la nube</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onCancel} style={st.cancel}>
        <Text style={st.cancelText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  card: { padding: 16, borderRadius: 17, backgroundColor: "#1C1C23", borderWidth: 1, borderColor: "#383843", gap: 13 },
  caption: { color: "#F7797F", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#fff", fontSize: 21, fontWeight: "800" },
  info: { color: "#B6B6C2", fontSize: 12, lineHeight: 18 },
  field: { gap: 5 },
  label: { color: "#D0D1DC", fontSize: 12, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#454550", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, minHeight: 47, fontSize: 14, color: "#fff", backgroundColor: "#15151B" },
  error: { color: "#FAB28E", fontSize: 12, lineHeight: 18 },
  save: { borderRadius: 12, padding: 14, minHeight: 48, alignItems: "center", backgroundColor: "#B50914" },
  saveText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  cancel: { padding: 10, alignItems: "center" },
  cancelText: { color: "#F7797F", fontWeight: "800" }
});
