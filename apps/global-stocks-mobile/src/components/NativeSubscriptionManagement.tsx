import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react-native";

type Subscription = { user_id: string; plan_key: "free" | "starter" | "pro"; status: "trialing" | "active" | "past_due" | "cancelled" | "expired"; trial_ends_at: string; current_period_end: string | null; provider_subscription_id: string | null; cancel_at_period_end: boolean };
type Props = { client: SupabaseClient; userId: string; dark: boolean };

export default function NativeSubscriptionManagement({ client, userId, dark }: Props) {
  const [item, setItem] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fg = dark ? "#F5F5F7" : "#17171C";
  const muted = dark ? "#A6A7B2" : "#686975";
  const border = dark ? "#34353F" : "#E0E1E8";
  const surface = dark ? "#17181E" : "#FFFFFF";
  const red = dark ? "#F06472" : "#A50017";

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    const { data, error: readError } = await client.from("global_stock_subscriptions")
      .select("user_id,plan_key,status,trial_ends_at,current_period_end,provider_subscription_id,cancel_at_period_end")
      .eq("user_id", userId).maybeSingle();
    if (readError) setError("No pudimos consultar tu suscripción.");
    else setItem(data as Subscription | null);
    setLoading(false);
  }, [client, userId]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function cancel() {
    if (!item || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (item.provider_subscription_id) {
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError || !data.session) throw new Error("No se pudo verificar la sesión.");
        const response = await fetch("https://globalstocks.vercel.app/api/billing/cancel", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` } });
        if (!response.ok) throw new Error("No se pudo cancelar el cobro en PayPal. Contactá a soporte.");
      } else {
        const { error: updateError } = await client.from("global_stock_subscriptions").update({ cancel_at_period_end: true }).eq("user_id", userId);
        if (updateError) throw new Error("No se pudo cancelar el período de prueba.");
      }
      setNotice("La suscripción quedó cancelada. Tus datos no se borraron.");
      setConfirm(false);
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cancelar la suscripción."); }
    finally { setBusy(false); }
  }

  const status = item?.status === "trialing" && item.trial_ends_at && Date.parse(item.trial_ends_at) <= Date.now() ? "expired" : item?.status;
  const plan = item?.plan_key === "starter" ? "Emprendedor" : item?.plan_key === "pro" ? "Profesional" : "Gratis";
  const date = (value: string) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value));
  return (
    <View style={{ backgroundColor: surface, borderColor: border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}><CalendarClock size={19} color={red}/><Text style={{ color: fg, fontSize: 16, fontWeight: "800", flex: 1 }}>Tu suscripción</Text><Pressable onPress={() => void refresh()} accessibilityRole="button"><Text style={{ color: red, fontSize: 12 }}>Actualizar</Text></Pressable></View>
      {loading ? <ActivityIndicator color={red}/> : item ? <>
        <View style={{ backgroundColor: dark ? "#22232B" : "#F4F4F7", borderRadius: 12, padding: 12, gap: 5 }}>
          <Text style={{ color: fg, fontSize: 15, fontWeight: "700" }}>{plan}</Text>
          <Text style={{ color: muted, fontSize: 12 }}>{status === "trialing" ? `Prueba gratuita hasta ${date(item.trial_ends_at)}` : status === "active" ? "Suscripción activa" : status === "expired" ? "Prueba finalizada" : status === "cancelled" ? "Cancelada" : "Pago pendiente"}</Text>
        </View>
        {status === "trialing" ? <Text style={{ color: muted, fontSize: 12, lineHeight: 18 }}>No se te cobrará automáticamente al terminar la prueba. Para contratar un plan pago tendrás que confirmarlo.</Text> : null}
        {notice ? <Text style={{ color: "#16845B", fontSize: 12 }}>{notice}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={{ color: red, fontSize: 12 }}>{error}</Text> : null}
        {status !== "cancelled" && status !== "expired" ? confirm ? <View style={{ gap: 9 }}>
          <Text style={{ color: fg, fontSize: 12, lineHeight: 18 }}>¿Confirmás la cancelación? Se cancelará el período actual. Tus datos del negocio no se borran.</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => setConfirm(false)} style={{ flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center" }}><Text style={{ color: fg, fontWeight: "700" }}>Volver</Text></Pressable>
            <Pressable disabled={busy} onPress={() => void cancel()} style={{ flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: red, alignItems: "center", justifyContent: "center" }}>{busy ? <ActivityIndicator color="#fff"/> : <Text style={{ color: "#fff", fontWeight: "700" }}>Confirmar cancelación</Text>}</Pressable>
          </View>
        </View> : <Pressable onPress={() => setConfirm(true)} style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, minHeight: 40, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: border }}><XCircle size={15} color={red}/><Text style={{ color: red, fontSize: 12, fontWeight: "700" }}>{item.provider_subscription_id ? "Cancelar suscripción" : "Cancelar prueba"}</Text></Pressable> : <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><CheckCircle2 size={15} color={muted}/><Text style={{ color: muted, fontSize: 12 }}>Sin cobros automáticos activos</Text></View>}
      </> : <Text style={{ color: muted, fontSize: 12 }}>Todavía no encontramos un plan para esta cuenta. Actualizá o volvé a ingresar.</Text>}
    </View>
  );
}