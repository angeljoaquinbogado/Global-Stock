import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View
} from "react-native";
import { ArrowLeftRight, RefreshCw, TrendingUp } from "lucide-react-native";

type Currency = "ARS" | "USD" | "EUR" | "BRL" | "MXN" | "GBP" | "JPY";
type Market = "oficial" | "blue" | "mep" | "ccl" | "tarjeta";
type Palette = {
  bg: string; surface: string; elevated: string;
  border: string; text: string; muted: string; redIcon: string;
};
type Quote = {
  base: Currency;
  target: Currency;
  rate: number;
  market: Market | null;
  quote?: { buy: number | null; sell: number; currency: "ARS"; reference: string } | null;
  provider: string;
  sourceUpdatedAt?: string | null;
  checkedAt: string;
};
const CURRENCIES: Currency[] = ["ARS", "USD", "EUR", "BRL", "MXN", "GBP", "JPY"];
const MARKETS: Array<{ key: Market; label: string }> = [
  { key: "oficial", label: "Oficial" },
  { key: "blue", label: "Blue" },
  { key: "mep", label: "MEP" },
  { key: "ccl", label: "CCL" },
  { key: "tarjeta", label: "Tarjeta" }
];
const CACHE_TTL = 120_000;
const requestCache = new Map<string, { value: Quote; at: number }>();
function formatValue(value: number, currency: Currency) {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2
    }).format(value);
  } catch {
    return value.toLocaleString("es-AR", { maximumFractionDigits: 2 }) + " " + currency;
  }
}
function parseAmount(raw: string) {
  const trimmed = raw.replace(/\s/g, "");
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 && value <= 1_000_000_000 ? value : null;
}
function isValidRate(data: unknown): data is Quote {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<Quote>;
  return typeof d.rate === "number" && Number.isFinite(d.rate) &&
    d.rate > 0 && CURRENCIES.includes(d.base as Currency) &&
    CURRENCIES.includes(d.target as Currency) &&
    typeof d.checkedAt === "string" && typeof d.provider === "string";
}
export default function NativeCurrencies({ p }: { p: Palette }) {
  const [base, setBase] = useState<Currency>("USD");
  const [target, setTarget] = useState<Currency>("ARS");
  const [market, setMarket] = useState<Market>("oficial");
  const [amount, setAmount] = useState("100");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const involvesArs = base === "ARS" || target === "ARS";
  const amountValue = useMemo(() => parseAmount(amount), [amount]);
  const cacheKey = [base, target, involvesArs ? market : "global"].join(":");

  useEffect(() => {
    let alive = true;
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL && revision === 0) {
      setQuote(cached.value); setError(""); setLoading(false);
      return () => { alive = false; };
    }
    if (base === target) {
      setQuote({ base, target, rate: 1, market: null, provider: "identity", checkedAt: new Date().toISOString() });
      setLoading(false); setError("");
      return () => { alive = false; };
    }
    setQuote(cached?.value ?? null);
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 13_000);
    void (async () => {
      try {
        const url = "https://globalstocks.vercel.app/api/fx?" + new URLSearchParams({
          base, target, market
        }).toString();
        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error("No pudimos consultar la cotización actual.");
        const data: unknown = await response.json();
        if (!isValidRate(data) || data.base !== base || data.target !== target)
          throw new Error("La respuesta de cotizaciones no es válida.");
        if (!alive) return;
        requestCache.set(cacheKey, { value: data, at: Date.now() });
        if (requestCache.size > 30) {
          const first = requestCache.keys().next().value;
          if (first) requestCache.delete(first);
        }
        setQuote(data);
      } catch {
        if (alive) setError("No pudimos actualizar las cotizaciones. Comprobá tu conexión e intentá nuevamente.");
      } finally {
        clearTimeout(timeout);
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; controller.abort(); clearTimeout(timeout); };
    // Revision only forces a new request when the user presses Refresh.
  }, [base, target, market, cacheKey, revision, involvesArs]);

  function swap() {
    setBase(target);
    setTarget(base);
    setRevision(0);
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TrendingUp size={17} color={p.redIcon}/>
          <Text style={[s.eyebrow, { color: p.redIcon }]}>GLOBAL STOCK · MERCADO</Text>
        </View>
        <Text style={[s.heading, { color: p.text }]}>Cotizaciones</Text>
        <Text style={[s.body, { color: p.muted }]}>Convertí precios y consultá tipos de cambio desde el celular o la PC.</Text>
      </View>

      <View style={[s.panel, { backgroundColor: p.surface, borderColor: p.border }]}>
        <Text style={[s.title, { color: p.text }]}>¿Cuánto querés convertir?</Text>
        <TextInput
          accessibilityLabel="Importe para convertir"
          keyboardType="decimal-pad"
          selectTextOnFocus
          value={amount}
          onChangeText={setAmount}
          maxLength={18}
          style={[s.amountInput, { color: p.text, borderColor: p.border, backgroundColor: p.elevated }]}
          placeholder="Ej.: 100" placeholderTextColor={p.muted}
        />
        {amountValue == null ? <Text style={{ color: "#C7515D", fontSize: 12 }}>Ingresá un importe válido.</Text> : null}
        <Text style={[s.label, { color: p.muted }]}>Moneda de origen</Text>
        <View style={s.choices}>
          {CURRENCIES.map(item => <Pressable key={"base-"+item} accessibilityRole="button"
            accessibilityLabel={"Moneda de origen "+item} accessibilityState={{ selected: item === base }}
            onPress={() => { setBase(item); setRevision(0); }}
            style={[s.choice, { borderColor: base === item ? p.redIcon : p.border, backgroundColor: base === item ? p.elevated : p.surface }]}>
            <Text style={[s.choiceText, { color: base === item ? p.redIcon : p.text }]}>{item}</Text>
          </Pressable>)}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Intercambiar monedas"
          onPress={swap} style={[s.swap, { borderColor: p.border, backgroundColor: p.elevated }]}>
          <ArrowLeftRight size={18} color={p.redIcon} />
          <Text style={[s.swapText, { color: p.text }]}>Intercambiar</Text>
        </Pressable>
        <Text style={[s.label, { color: p.muted }]}>Convertir a</Text>
        <View style={s.choices}>
          {CURRENCIES.map(item => <Pressable key={"target-"+item} accessibilityRole="button"
            accessibilityLabel={"Moneda de destino "+item} accessibilityState={{ selected: item === target }}
            onPress={() => { setTarget(item); setRevision(0); }}
            style={[s.choice, { borderColor: target === item ? p.redIcon : p.border, backgroundColor: target === item ? p.elevated : p.surface }]}>
            <Text style={[s.choiceText, { color: target === item ? p.redIcon : p.text }]}>{item}</Text>
          </Pressable>)}
        </View>
        {involvesArs && base !== target && <View style={{ gap: 10 }}>
          <Text style={[s.label, { color: p.muted }]}>Tipo de dólar</Text>
          <View style={s.choices}>
            {MARKETS.map(item => <Pressable key={item.key} accessibilityRole="button"
              accessibilityLabel={"Mercado "+item.label} accessibilityState={{ selected: item.key === market }}
              onPress={() => { setMarket(item.key); setRevision(0); }}
              style={[s.choice, { borderColor: market === item.key ? p.redIcon : p.border, backgroundColor: market === item.key ? p.elevated : p.surface }]}>
              <Text style={[s.choiceText, { color: market === item.key ? p.redIcon : p.text }]}>{item.label}</Text>
            </Pressable>)}
          </View>
        </View>}
      </View>

      <View style={[s.panel, { backgroundColor: p.surface, borderColor: p.border }]}>
        <View style={s.row}>
          <Text style={[s.title, { color: p.text }]}>Resultado</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar cotización"
            disabled={loading} onPress={() => setRevision(v => v + 1)}
            style={[s.refresh, { borderColor: p.border }]}>
            {loading ? <ActivityIndicator size="small" color={p.redIcon} /> : <RefreshCw size={16} color={p.redIcon} />}
            <Text style={{ color: p.text, fontSize: 12 }}>Actualizar</Text>
          </Pressable>
        </View>
        {error ? <Text accessibilityRole="alert" style={{ color: "#D45F69", fontSize: 12, lineHeight: 19 }}>{error}</Text> : null}
        {quote ? <>
          <Text style={[s.bigNumber, { color: p.text }]}>
            {amountValue == null ? "—" : formatValue(amountValue * quote.rate, target)}
          </Text>
          <Text style={[s.body, { color: p.muted }]}>1 {base} = {quote.rate.toLocaleString("es-AR", { maximumFractionDigits: 6 })} {target}</Text>
          {quote.quote && <Text style={[s.body, { color: p.muted }]}>
            USD / ARS · compra {quote.quote.buy != null ? formatValue(quote.quote.buy, "ARS") : "—"} · venta {formatValue(quote.quote.sell, "ARS")}
          </Text>}
          <Text style={[s.caption, { color: p.muted }]}>Fuente: {quote.provider}. Consultado: {new Date(quote.checkedAt).toLocaleString("es-AR")}.</Text>
        </> : !loading ? <Text style={[s.body, { color: p.muted }]}>Seleccioná las monedas para consultar.</Text> : null}
        <Text style={[s.caption, { color: p.muted }]}>
          Valores informativos: pueden diferir de los bancos y medios de pago. No se actualizan automáticamente los precios de tus productos.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: { letterSpacing: 1.35, fontSize: 10, fontWeight: "800" },
  heading: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  body: { fontSize: 12, lineHeight: 19 },
  panel: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 13 },
  title: { fontSize: 15, fontWeight: "800" },
  amountInput: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 20, fontWeight: "700" },
  label: { fontSize: 11.5, fontWeight: "700" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, minWidth: 54, alignItems: "center" },
  choiceText: { fontSize: 12, fontWeight: "700" },
  swap: { alignSelf: "center", borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 18 },
  swapText: { fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  refresh: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, minHeight: 38, paddingHorizontal: 12 },
  bigNumber: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  caption: { fontSize: 10.5, lineHeight: 17 }
});
