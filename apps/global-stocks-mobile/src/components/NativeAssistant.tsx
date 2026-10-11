import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowUp, Bot, CheckCircle2, CircleAlert, Sparkles, X } from "lucide-react-native";
import type { Business, Product } from "../lib/data";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Props = { visible: boolean; onClose: () => void; client: SupabaseClient; business: Business; products: Product[]; dark: boolean };
const ENDPOINT = "https://globalstocks.vercel.app/api/intelligence";

export default function NativeAssistant({ visible, onClose, client, business, products, dark }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
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

  const ask = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || text.length > 4000) return;
    setSending(true);
    setError("");
    setDraft("");
    const userMessage: Message = { id: Date.now().toString() + "-user", role: "user", content: text };
    setMessages((old) => [...old, userMessage].slice(-40));
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.access_token) throw new Error("La sesión venció. Volvé a iniciar sesión para usar la IA.");

      // Send only data for the active authenticated merchant, not other businesses.
      const snapshot = {
        products: products.slice(0, 200).map((p) => ({
          id: p.id, barcode: p.barcode || "", name: p.name, category: p.category || "",
          supplier: "", stock: p.stock, minStock: p.min_stock, cost: p.cost ?? 0,
          costKnown: p.cost != null, price: p.price, sold30d: 0, active: p.active
        })),
        trend: [],
        currency: business.base_currency,
        currencyRate: 1,
        locale: business.locale
      };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            message: text,
            snapshot,
            history: messages.slice(-18).map(({ role, content }) => ({ role, content })),
            runtime: {
              clientNow: new Date().toISOString(),
              clientTimeZone: "America/Argentina/Buenos_Aires",
              appContext: { businessName: business.name, businessId: business.id, platform: "Global Stock React Native" }
            }
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }
      const data = await response.json() as { answer?: string; code?: string };
      if (!response.ok || !data.answer) {
        if (data.code === "AI_NOT_CONNECTED") throw new Error("El proveedor de IA no está disponible en este momento.");
        if (data.code === "AUTH_REQUIRED" || response.status === 401) throw new Error("Tu sesión ya no es válida. Volvé a iniciar sesión.");
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
  }, [business, client, draft, messages, products, sending]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1, backgroundColor:bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[st.header, { borderColor:border }]}>
          <View style={{ flexDirection:"row",alignItems:"center",gap:10,flex:1 }}>
            <View style={st.brand}><Sparkles size={18} color="#fff" /></View>
            <View style={{flex:1}}><Text style={{color:fg,fontWeight:"800",fontSize:16}}>Global Stock IA</Text><Text style={{color:muted,fontSize:11}} numberOfLines={1}>Asistente de {business.name}</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar IA" onPress={onClose} style={[st.close,{backgroundColor:panel}]}><X size={20} color={fg} /></Pressable>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={st.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({animated:true})}>
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
        </ScrollView>
        <View style={[st.composer,{borderColor:border,backgroundColor:bg}]}>
          <TextInput
            value={draft} onChangeText={setDraft} editable={!sending} multiline maxLength={4000}
            placeholder="Preguntale a Global Stock IA…" placeholderTextColor={muted}
            accessibilityLabel="Mensaje para la inteligencia artificial"
            style={[st.input,{color:fg,backgroundColor:panel,borderColor:border}]}
          />
          <Pressable disabled={sending || !draft.trim()} onPress={() => void ask()} accessibilityRole="button" accessibilityLabel="Enviar mensaje a la IA" style={[st.send,{opacity:sending || !draft.trim()?0.4:1}]}><ArrowUp size={21} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st=StyleSheet.create({
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
