import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeftRight, ChevronDown, RefreshCw, TrendingUp } from "lucide-react-native";

type Currency = "ARS" | "USD" | "EUR" | "BRL" | "MXN" | "GBP" | "JPY";
type Market = "oficial" | "blue" | "mep" | "ccl" | "tarjeta";
type FxQuote = {
  base: Currency;
  target: Currency;
  rate: number;
  provider: string;
  market: Market | null;
  quote?: { buy: number | null; sell: number; currency: string; reference: string } | null;
  sourceUpdatedAt?: string | null;
  checkedAt: string;
};
type Palette = { bg: string; panel: string; elevated: string; line: string; fg: string; muted: string };
type Props = { dark: boolean; baseCurrency: string };
const codes: Currency[] = ["ARS", "USD", "EUR", "BRL", "MXN", "GBP", "JPY"];
const names: Record<Currency, string> = {
  ARS: "Peso argentino", USD: "Dólar estadounidense", EUR: "Euro",
  BRL: "Real brasileño", MXN: "Peso mexicano", GBP: "Libra esterlina", JPY: "Yen japonés"
};
const markets: Array<{ id: Market; name: string }> = [
  { id: "oficial", name: "Oficial" }, { id: "blue", name: "Blue" },
  { id: "mep", name: "MEP" }, { id: "ccl", name: "CCL" }, { id: "tarjeta", name: "Tarjeta" }
];
const url = "https://globalstocks.vercel.app/api/fx";

function validQuote(input: unknown, expectedBase: Currency, expectedTarget: Currency): FxQuote {
  if (typeof input !== "object" || !input) throw new Error("Respuesta no válida del servidor de cotizaciones.");
  const value = input as Partial<FxQuote>;
  if (value.base !== expectedBase || value.target !== expectedTarget ||
      !Number.isFinite(value.rate) || Number(value.rate) <= 0 ||
      typeof value.checkedAt !== "string" || typeof value.provider !== "string")
    throw new Error("La cotización recibida no es válida.");
  return value as FxQuote;
}

async function fetchQuote(base: Currency, target: Currency, market: Market, signal: AbortSignal) {
  const response = await fetch(
    `${url}?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}&market=${market}`,
    { method: "GET", headers: { Accept: "application/json" }, signal }
  );
  if (!response.ok) {
    if (response.status === 429) throw new Error("Demasiadas solicitudes. Esperá unos segundos para actualizar.");
    throw new Error("Cotización no disponible. Verificá tu conexión o probá otro mercado.");
  }
  return validQuote(await response.json(), base, target);
}

function showNumber(value: number, currency: Currency) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency, maximumFractionDigits: 6,
    minimumFractionDigits: currency === "ARS" ? 2 : 2
  }).format(value);
}
function plain(value: number) { return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 8 }).format(value); }
function readAmount(raw: string) {
  const input = raw.trim().replace(/\s/g, "").replace(/[^\d,.]/g, "");
  if (!input) return NaN;
  const comma = input.lastIndexOf(",");
  const dot = input.lastIndexOf(".");
  if (comma >= 0 && dot >= 0)
    return Number(input.replace(comma > dot ? /\./g : /,/g, "").replace(",", "."));
  if (comma >= 0) return Number(input.replace(",", "."));
  return Number(input);
}

export default function NativeFxCenter({ dark, baseCurrency }: Props) {
  const [from, setFrom] = useState<Currency>(codes.includes(baseCurrency as Currency) ? baseCurrency as Currency : "ARS");
  const [to, setTo] = useState<Currency>("USD");
  const [market, setMarket] = useState<Market>("oficial");
  const [amount, setAmount] = useState("1");
  const [pick, setPick] = useState<"from" | "to" | null>(null);
  const [quote, setQuote] = useState<FxQuote | null>(null);
  const [overview, setOverview] = useState<Array<FxQuote | null>>([]);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const p = useMemo<Palette>(() => dark
    ? { bg: "#080809", panel: "#1B1B1E", elevated: "#101013", line: "#35353A", fg: "#F5F5F7", muted: "#AEAFB8" }
    : { bg: "#F5F5F7", panel: "#FFFFFF", elevated: "#F2F2F4", line: "#DFDFE5", fg: "#17171D", muted: "#666672" }, [dark]);
  const st = useMemo(() => makeStyles(p), [p]);
  const hasArs = from === "ARS" || to === "ARS";
  const validAmount = readAmount(amount);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setQuote(null);
    setLoading(true);
    setError("");
    void fetchQuote(from, to, market, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setQuote(result); })
      .catch((err: unknown) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "No se pudo consultar la cotización."); })
      .finally(() => { clearTimeout(timeout); if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [from, to, market, attempt]);

  useEffect(() => {
    const selected = codes.includes(baseCurrency as Currency) ? baseCurrency as Currency : "ARS";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    const others = codes.filter(v => v !== selected);
    setOverviewLoading(true);
    void Promise.allSettled(others.map(target => fetchQuote(selected, target, market, controller.signal)))
      .then((results) => {
        if (controller.signal.aborted) return;
        setOverview(results.map(v => v.status === "fulfilled" ? v.value : null));
      })
      .finally(() => { clearTimeout(timer); if (!controller.signal.aborted) setOverviewLoading(false); });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [baseCurrency, market, attempt]);

  return (
    <View style={st.card}>
      <View style={st.headingRow}>
        <View style={{flex:1,gap:7}}>
          <View style={{flexDirection:"row",alignItems:"center",gap:7}}>
            <TrendingUp size={16} color="#C91320"/>
            <Text style={st.heading}>Centro de cotizaciones</Text>
          </View>
          <Text style={st.helper}>Convertí monedas con el mismo servicio que Global Stock web.</Text>
        </View>
        <Pressable onPress={() => setAttempt(n => n+1)} accessibilityRole="button" accessibilityLabel="Actualizar cotizaciones" style={st.refresh}>
          <RefreshCw size={16} color={p.fg}/>
        </Pressable>
      </View>

      <View style={st.pair}>
        <View style={{flex:1,gap:6}}>
          <Text style={st.label}>DESDE</Text>
          <Pressable accessibilityRole="button" onPress={() => setPick(pick==="from"?null:"from")} style={st.selector}>
            <Text style={st.selectorText}>{from}</Text><ChevronDown size={13} color={p.muted}/>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Intercambiar monedas" onPress={() => {setFrom(to);setTo(from);}} style={[st.switch,{marginTop:20}]}>
          <ArrowLeftRight size={18} color="#E42A39"/>
        </Pressable>
        <View style={{flex:1,gap:6}}>
          <Text style={st.label}>HACIA</Text>
          <Pressable accessibilityRole="button" onPress={() => setPick(pick==="to"?null:"to")} style={st.selector}>
            <Text style={st.selectorText}>{to}</Text><ChevronDown size={13} color={p.muted}/>
          </Pressable>
        </View>
      </View>
      {pick && <View style={st.choices}>
        {codes.map(code => <Pressable key={code} onPress={() => { pick==="from"?setFrom(code):setTo(code);setPick(null); }} accessibilityRole="button"
          style={[st.choice,{backgroundColor:(pick==="from"?from:to)===code?"#84101B":p.elevated}]}>
          <Text style={[st.choiceText,{color:(pick==="from"?from:to)===code?"#FFF":p.fg}]}>{code}</Text>
          <Text style={[st.choiceHint,{color:(pick==="from"?from:to)===code?"#F3C2C5":p.muted}]}>{names[code]}</Text>
        </Pressable>)}
      </View>}

      {hasArs && from!==to ? <View style={{gap:9}}>
        <Text style={st.label}>MERCADO ARS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>
          {markets.map(m => <Pressable key={m.id} onPress={() => setMarket(m.id)} accessibilityRole="button" style={[st.market,{backgroundColor:market===m.id?"#A1000B":p.elevated,borderColor:market===m.id?"#A1000B":p.line}]}>
            <Text style={{fontSize:11,color:market===m.id?"#FFF":p.muted,fontWeight:"700"}}>{m.name}</Text>
          </Pressable>)}
        </ScrollView>
      </View> : null}

      <View style={st.pair}>
        <View style={{flex:1,gap:6}}>
          <Text style={st.label}>IMPORTE</Text>
          <TextInput accessibilityLabel="Cantidad que querés convertir" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={st.amount} placeholder="1" placeholderTextColor={p.muted}/>
        </View>
        <View style={{flex:1,gap:6}}>
          <Text style={st.label}>RESULTADO</Text>
          <View style={st.result}>
            {loading ? <ActivityIndicator color="#B50A18" size="small"/> :
              <Text numberOfLines={2} adjustsFontSizeToFit style={st.resultText}>
                {quote && Number.isFinite(validAmount) && validAmount >= 0 ? showNumber(validAmount*quote.rate,to) : "—"}
              </Text>}
          </View>
        </View>
      </View>
      {!Number.isFinite(validAmount) || validAmount < 0 ? <Text style={st.warning}>Ingresá un importe numérico válido.</Text> : null}
      {error ? <Text style={st.warning}>{error}</Text> : null}

      {quote && <View style={st.rateBox}>
        <Text style={st.helper}>1 {from} equivale a</Text>
        <Text style={st.largeRate}>{plain(quote.rate)} {to}</Text>
        {quote.quote && <View style={st.pair}>
          <View style={st.quoteItem}><Text style={st.label}>COMPRA USD/ARS</Text><Text style={st.quotePrice}>{quote.quote.buy !== null ? showNumber(quote.quote.buy,"ARS") : "No disponible"}</Text></View>
          <View style={st.quoteItem}><Text style={st.label}>VENTA USD/ARS</Text><Text style={st.quotePrice}>{showNumber(quote.quote.sell,"ARS")}</Text></View>
        </View>}
        <Text style={st.source}>Fuente: {quote.provider} · Mercado: {quote.market ?? "internacional"}</Text>
        <Text style={st.source}>Actualización del proveedor: {quote.sourceUpdatedAt ?? "Sin fecha informada"}</Text>
        <Text style={st.source}>Consultado: {new Date(quote.checkedAt).toLocaleString("es-AR")}</Text>
      </View>}

      <View style={{gap:10}}>
        <Text style={st.heading}>Cotizaciones desde {baseCurrency}</Text>
        <Text style={st.helper}>Valores de referencia de 1 {baseCurrency}. Si el proveedor no responde, no se muestran tasas antiguas como actuales.</Text>
        {overviewLoading ? <ActivityIndicator color="#B50A18"/> : null}
        {overview.map((v,i) => {
          const selected = codes.includes(baseCurrency as Currency) ? baseCurrency as Currency : "ARS";
          const target = codes.filter(x=>x!==selected)[i];
          if (!v) return <View style={st.quoteListItem} key={target}><Text style={st.listTitle}>{target}</Text><Text style={st.helper}>No disponible</Text></View>;
          return <Pressable key={target} accessibilityRole="button" onPress={() => {setFrom(selected);setTo(target);}}>
            <View style={st.quoteListItem}><View style={{flex:1}}><Text style={st.listTitle}>{target}</Text><Text style={st.small}>{names[target]}</Text></View><Text numberOfLines={1} adjustsFontSizeToFit style={st.listValue}>{plain(v.rate)}</Text></View>
          </Pressable>;
        })}
      </View>
    </View>
  );
}
function makeStyles(p: Palette) {
  return StyleSheet.create({
    card:{backgroundColor:p.panel,borderWidth:1,borderColor:p.line,borderRadius:18,padding:15,gap:18},
    headingRow:{flexDirection:"row",justifyContent:"space-between",gap:10,alignItems:"center"},
    heading:{color:p.fg,fontSize:14,fontWeight:"800"},
    helper:{color:p.muted,fontSize:11,lineHeight:17},
    label:{fontSize:10,fontWeight:"800",letterSpacing:0.65,color:p.muted},
    refresh:{width:39,height:39,borderWidth:1,borderColor:p.line,borderRadius:11,alignItems:"center",justifyContent:"center"},
    pair:{flexDirection:"row",gap:9,alignItems:"center"},
    selector:{height:46,backgroundColor:p.elevated,borderColor:p.line,borderWidth:1,borderRadius:12,paddingHorizontal:13,justifyContent:"space-between",alignItems:"center",flexDirection:"row"},
    selectorText:{fontWeight:"800",color:p.fg,fontSize:12},
    switch:{height:43,width:38,alignItems:"center",justifyContent:"center",borderRadius:10,backgroundColor:p.elevated,borderWidth:1,borderColor:p.line},
    choices:{flexDirection:"row",flexWrap:"wrap",gap:7},
    choice:{width:"31.5%",paddingVertical:10,paddingHorizontal:10,borderRadius:11},
    choiceText:{fontSize:12,fontWeight:"800"},
    choiceHint:{fontSize:9,marginTop:3},
    market:{borderWidth:1,paddingVertical:9,paddingHorizontal:12,borderRadius:24},
    amount:{height:49,borderWidth:1,borderColor:p.line,borderRadius:12,backgroundColor:p.elevated,color:p.fg,paddingHorizontal:12,fontSize:15,fontWeight:"700"},
    result:{height:49,borderWidth:1,borderColor:"#711821",borderRadius:12,backgroundColor: p.elevated,justifyContent:"center",paddingHorizontal:12},
    resultText:{color:p.fg,fontSize:12,fontWeight:"800"},
    warning:{color:"#E7A170",fontSize:11,lineHeight:17},
    rateBox:{backgroundColor:p.elevated,borderRadius:15,borderWidth:1,borderColor:p.line,padding:13,gap:7},
    largeRate:{color:p.fg,fontSize:21,fontWeight:"800"},
    quoteItem:{flex:1,borderRadius:12,backgroundColor:p.bg,padding:11,gap:7},
    quotePrice:{color:p.fg,fontSize:12,fontWeight:"800"},
    source:{fontSize:10,color:p.muted},
    quoteListItem:{paddingHorizontal:12,paddingVertical:13,backgroundColor:p.elevated,borderRadius:11,flexDirection:"row",justifyContent:"space-between",gap:8,alignItems:"center"},
    listTitle:{color:p.fg,fontSize:12,fontWeight:"800"},
    listValue:{color:p.fg,fontSize:12,fontWeight:"800",maxWidth:"48%"},
    small:{color:p.muted,fontSize:10,marginTop:3}
  });
}
