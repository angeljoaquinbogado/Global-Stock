import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowUp, Bot, CheckCircle2, CircleAlert, Sparkles, X } from "lucide-react-native";
import type { Business, Product } from "../lib/data";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Props = { visible: boolean; onClose: () => void; client: SupabaseClient; business: Business; userId: string; products: Product[]; dark: boolean };
const ENDPOINT = "https://globalstocks.vercel.app/api/intelligence";

export default function NativeAssistant({ visible, onClose, client, business, userId, products, dark }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentSaving, setConsentSaving] = useState(false);
  const scroll = useRef<ScrollView | null>(null);
  const mounted = useRef(true);
  const bg = dark ? "#0F0F12" : "#FCFCFD";
  const panel = dark ? "#1B1B20" : "#F1F1F5";
  const fg = dark ? "#F8F8FA" : "#16161B";
  const muted = dark ? "#B7B8C0" : "#666774";
  const border = dark ? "#33343A" : "#E1E2E8";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setMessages([]);
    setError("");
    setDraft("");
  }, [business.id]);

  // Consent is independent from age/terms acceptance and revocable in Settings.
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setConsentLoading(true);
    setConsent(false);
    setError("");
    void (async () => {
      const { data, error } = await client.from("global_stock_ai_data_consents")
        .select("approved").eq("business_id", business.id).eq("user_id", userId).maybeSingle();
      if (!active) return;
      if (error) throw error;
      setConsent(data?.approved === true);
    })().catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "No se pudieron comprobar los permisos de IA.");
    }).finally(() => { if (active) setConsentLoading(false); });
    return () => { active = false; };
  }, [client, business.id, userId, visible]);

  async function approveSharing() {
    if (consentSaving) return;
    setConsentSaving(true);
    setError("");
    try {
      const { error } = await client.from("global_stock_ai_data_consents").upsert({
        user_id: userId, business_id: business.id, approved: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,business_id" });
      if (error) throw error;
      setConsent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la autorización.");
    } finally { setConsentSaving(false); }
  }

  const ask = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || !consent || text.length > 4000) return;
    setSending(true);
    setError("");
    setDraft("");
    const userMessage: Message = { id: Date.now().toString() + "-user", role: "user", content: text };
    setMessages((old) => [...old, userMessage].slice(-40));
    try {
      // getUser validates/renews the identity when returning from background.
      let { data: verified, error: userError } = await client.auth.getUser();
      if (userError || !verified.user?.id) {
        // A sleeping phone can keep a stale access token. Refresh once,
        // then validate the identity. Do not sign out on network failures.
        const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
        if (refreshError || !refreshed.session?.access_token) {
          throw new Error("No se pudo verificar la sesión. Comprobá internet y tocá Enviar de nuevo. Si sigue fallando, cerrá sesión e ingresá otra vez.");
        }
        const retried = await client.auth.getUser();
        verified = retried.data;
        userError = retried.error;
      }
      if (userError || !verified.user?.id || verified.user.id !== userId)
        throw new Error("No se pudo comprobar que esta sesión corresponda a tu usuario. Cerrá sesión y volvé a ingresar.");
      // The web API expects a profile in addition to a valid Auth identity.
      // Only create the authenticated user's own row; RLS remains enforced.
      const { data: profile, error: profileError } = await client
        .from("global_stock_profiles").select("user_id").eq("user_id", userId).maybeSingle();
      if (profileError) throw new Error("No se pudo comprobar el perfil de tu cuenta. Probá sincronizar y reintentar.");
      if (!profile?.user_id) {
        const { error: repairError } = await client
          .from("global_stock_profiles").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
        if (repairError) throw new Error("Falta completar tu perfil para usar Global Intelligence: " + repairError.message);
      }
      const sessionInfo = await client.auth.getSession();
      if (sessionInfo.error || !sessionInfo.data.session?.access_token)
        throw new Error("La sesión se cerró. Iniciá sesión nuevamente.");

      // Send only active merchant context with no fake sold30d or invented cost.
      const snapshot = {
        products: products.slice(0, 100).map((p) => ({
          id: p.id, barcode: p.barcode || "", name: p.name, category: p.category || "",
          stock: p.stock, minStock: p.min_stock, cost: p.cost ?? 0,
          costKnown: p.cost != null, price: p.price, sold30d: 0,
          supplier: "", active: p.active
        })),
        trend: [],
        currency: business.base_currency,
        currencyRate: 1,
        locale: business.locale
      };
      const payload = JSON.stringify({
        message: text,
        snapshot,
        history: messages.slice(-18).map(({ role, content }) => ({ role, content })),
        runtime: {
          clientNow: new Date().toISOString(),
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          appContext: { businessName: business.name, businessId: business.id, platform: "Global Stock React Native", dataQuality: "Inventario verificado; costos desconocidos indicados por costKnown=false; vendidos 30d no disponibles (sold30d=0 es marcador, no ventas reales). Nunca inventar proyecciones o resultados." }
        }
      });

      async function request(token: string): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          return await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: payload,
            signal: controller.signal
          });
        } finally { clearTimeout(timeout); }
      }
      let response = await request(sessionInfo.data.session.access_token);
      if (response.status === 401) {
        // Retry once with a newly issued token; a 401 can also mean backend
        // authorization, so do not erase the local session on a single failure.
        const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
        if (!refreshError && refreshed.session?.access_token)
          response = await request(refreshed.session.access_token);
      }
      const data = await response.json().catch(() => ({})) as { answer?: string; code?: string };
      if (!response.ok || !data.answer) {
        if (data.code === "AI_NOT_CONNECTED") throw new Error("El proveedor de IA todavía no está disponible. Probá más tarde.");
        if (response.status === 401) throw new Error("El servidor rechazó la autorización de IA. Actualizá y, si persiste, contactá soporte.");
        if (data.code === "AI_CONSENT_REQUIRED") throw new Error("El permiso para compartir el inventario con IA fue revocado. Cerrá y abrí Global Intelligence para autorizarlo de nuevo.");
        if (response.status === 403) throw new Error(data.code === "FORBIDDEN"
          ? "Tu cuenta necesita un permiso de acceso para este negocio. Comprobá tu membresía en Configuración."
          : "No tenés permiso para consultar este negocio.");
        if (response.status === 429) throw new Error("Demasiadas consultas seguidas. Esperá un momento.");
        throw new Error("El asistente no pudo responder. Probá nuevamente.");
      }
      if (mounted.current) setMessages((old) => [...old, { id: Date.now().toString() + "-ai", role: "assistant" as const, content: data.answer! }].slice(-40));
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error && err.name === "AbortError" ? "Se agotó el tiempo de respuesta del asistente." : err instanceof Error ? err.message : "Error de conexión.");
      }
    } finally {
      if (mounted.current) setSending(false);
    }
  }, [business, client, consent, draft, messages, products, sending, userId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1, backgroundColor:bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[st.header, { borderColor:border }]}>
          <View style={{ flexDirection:"row",alignItems:"center",gap:10,flex:1 }}>
            <View style={st.brand}><Sparkles size={18} color="#fff" /></View>
            <View style={{flex:1}}><Text style={{color:fg,fontWeight:"800",fontSize:16}}>Global Intelligence</Text><Text style={{color:muted,fontSize:11}} numberOfLines={1}>Inteligencia Global · {business.name}</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar IA" onPress={onClose} style={[st.close,{backgroundColor:panel}]}><X size={20} color={fg} /></Pressable>
        </View>
        {consentLoading ? (
          <View style={st.permission}><ActivityIndicator color="#B60819"/><Text style={{color:muted}}>Verificando autorización de IA…</Text></View>
        ) : !consent ? (
          <View style={st.permission}>
            <Bot size={33} color="#CF2433"/>
            <Text style={{fontSize:20,color:fg,fontWeight:"800"}}>Privacidad antes de conversar</Text>
            <Text style={{color:muted,fontSize:12.5,lineHeight:20}}>
              Para responder con datos de tu negocio, Global Intelligence envía tu pregunta
              y hasta 100 productos del negocio seleccionado al proveedor de IA configurado
              en nuestro servidor. No envía contraseñas ni tokens de acceso.
            </Text>
            <Pressable onPress={()=>void Linking.openURL("https://globalstocks.vercel.app/legal/privacy")} accessibilityRole="link">
              <Text style={{color:"#E7737D",fontWeight:"800",fontSize:12}}>Consultar política de privacidad ↗</Text>
            </Pressable>
            <Pressable onPress={()=>void approveSharing()} disabled={consentSaving} accessibilityRole="button" style={[st.permissionButton,consentSaving&&{opacity:0.5}]}>
              <Text style={{color:"#FFF",fontWeight:"800",fontSize:13}}>Autorizar contexto de IA</Text>
            </Pressable>
            <Text style={{color:muted,fontSize:11,lineHeight:17}}>Podés revocar este permiso en Configuración. Sin autorizar, el chat permanece desactivado.</Text>
          </View>
        ) : null}
        {consent ? <ScrollView ref={scroll} contentContainerStyle={st.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({animated:true})}>
          {messages.length === 0 && <View style={{alignItems:"center",gap:14,paddingVertical:45}}>
            <Bot size={40} color="#CD1221"/>
            <Text style={{color:fg,fontWeight:"800",fontSize:22,textAlign:"center"}}>¿En qué puedo ayudarte?</Text>
            <Text style={{color:muted,textAlign:"center",fontSize:13,lineHeight:20}}>Consultá productos, precios, stock y decisiones para tu negocio. Las respuestas las genera nuestro asistente conectado, no son mensajes predefinidos.</Text>
            <View style={{flexDirection:"row",alignItems:"center",gap:5}}><CheckCircle2 size={13} color="#56BB95"/><Text style={{color:muted,fontSize:11}}>Contexto: {products.length} productos del negocio actual</Text></View>
          </View>}
          {messages.map(m => <View key={m.id} style={[st.message, m.role==="user" ? st.userBubble : {alignSelf:"flex-start",backgroundColor:panel,borderWidth:1,borderColor:border}]}>
            <Text style={{color:m.role==="user"?"#fff":fg,fontSize:13,lineHeight:20}}>{m.content}</Text>
          </View>)}
          {sending && <View style={{alignSelf:"flex-start",backgroundColor:panel,padding:14,borderRadius:14}}><ActivityIndicator color="#C20D1A" /></View>}
          {error ? <View style={{flexDirection:"row",alignItems:"flex-start",gap:7,padding:10}}><CircleAlert size={16} color="#E29B65"/><Text style={{color:"#E29B65",fontSize:12,flex:1}}>{error}</Text></View> : null}
        </ScrollView> : null}
        {consent ? <View style={[st.composer,{borderColor:border,backgroundColor:bg}]}>
          <TextInput
            value={draft} onChangeText={setDraft} editable={!sending} multiline maxLength={4000}
            placeholder="Preguntale a Global Intelligence…" placeholderTextColor={muted}
            accessibilityLabel="Mensaje para la inteligencia artificial"
            style={[st.input,{color:fg,backgroundColor:panel,borderColor:border}]}
          />
          <Pressable disabled={sending || !draft.trim()} onPress={() => void ask()} accessibilityRole="button" accessibilityLabel="Enviar mensaje a la IA" style={[st.send,{opacity:sending || !draft.trim()?0.4:1}]}><ArrowUp size={21} color="#fff" /></Pressable>
        </View> : null}
        {!consent && error ? <Text style={{color:"#E6A579",paddingHorizontal:18,paddingVertical:8}}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st=StyleSheet.create({
  permission:{padding:25,gap:18,alignItems:"flex-start",flex:1},
  permissionButton:{backgroundColor:"#A60012",paddingHorizontal:19,minHeight:46,justifyContent:"center",borderRadius:12},
  header:{paddingHorizontal:16,paddingVertical:13,borderBottomWidth:1,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  brand:{width:34,height:34,borderRadius:12,backgroundColor:"#A90815",alignItems:"center",justifyContent:"center"},
  close:{height:37,width:37,borderRadius:11,alignItems:"center",justifyContent:"center"},
  messages:{padding:17,gap:12,paddingBottom:30,flexGrow:1},
  message:{maxWidth:"87%",borderRadius:16,paddingHorizontal:13,paddingVertical:10},
  userBubble:{backgroundColor:"#9C0D17",alignSelf:"flex-end"},
  composer:{flexDirection:"row",gap:9,borderTopWidth:1,padding:12,alignItems:"flex-end"},
  input:{flex:1,maxHeight:125,minHeight:43,borderRadius:13,borderWidth:1,paddingVertical:10,paddingHorizontal:12,fontSize:13},
  send:{width:43,height:43,borderRadius:12,backgroundColor:"#AD0011",alignItems:"center",justifyContent:"center"}
});
