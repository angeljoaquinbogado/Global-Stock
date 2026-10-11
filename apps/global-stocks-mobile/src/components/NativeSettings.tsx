import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BellRing, Check, CreditCard, Globe2, LockKeyhole, LogOut, Mail, MonitorSmartphone, Moon, RefreshCw, ShieldCheck, Store, Sun, UserRound } from "lucide-react-native";
import type { Business } from "../lib/data";
import { SUPPORT_EMAIL, supportEmailUrl } from "../lib/support";
import NativeFxCenter from "./NativeFxCenter";
import NativeAccountDeletion from "./NativeAccountDeletion";

type Props = {
  client: SupabaseClient;
  business: Business;
  userId: string;
  dark: boolean;
  onTheme: (v: boolean) => void;
  onBusiness: (b: Business) => void;
  onSwitchBusiness: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
  onOpenWeb: () => void;
};

const industries = [
  { id: "retail", name: "Comercio / retail" },
  { id: "restaurant", name: "Restaurante / gastronomía" },
  { id: "services", name: "Servicios" },
  { id: "wholesale", name: "Mayorista / distribución" },
  { id: "ecommerce", name: "Ecommerce" },
  { id: "industry", name: "Industria / fabricación" },
  { id: "advisory", name: "Asesoría / estudio contable" },
  { id: "other", name: "Otro" }
];

const languageOptions = [
  { id: "es-AR", label: "Español (Argentina)" },
  { id: "en-US", label: "English" },
  { id: "pt-BR", label: "Português" },
  { id: "fr-FR", label: "Français" },
  { id: "de-DE", label: "Deutsch" }
];

export default function NativeSettings({ client, business, userId, dark, onTheme, onBusiness, onSwitchBusiness, onRefresh, onSignOut, onOpenWeb }: Props) {
  const [name, setName] = useState(business.name);
  const [industry, setIndustry] = useState("retail");
  const [country, setCountry] = useState("Argentina");
  const [description, setDescription] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [showIndustries, setShowIndustries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showLanguage, setShowLanguage] = useState(false);
  const [pane, setPane] = useState<"profile"|"rates"|"appearance"|"account">("profile");
  const [aiSharing, setAiSharing] = useState<boolean|null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const p = dark ? {bg:"#09090B",panel:"#171719",line:"#34343B",fg:"#F8F8FA",muted:"#ABABB6",input:"#212126"} : {bg:"#F5F5F7",panel:"#FFF",line:"#E0E0E6",fg:"#17171B",muted:"#6B6B73",input:"#F2F2F5"};
  const st = styles(p);
  const canEdit=role==="owner"||role==="admin";
  useEffect(()=>{
    if(pane!=="account")return;
    let active=true;
    void (async()=>{
      const {data,error}=await client.from("global_stock_ai_data_consents").select("approved")
        .eq("user_id",userId).eq("business_id",business.id).maybeSingle();
      if(active){
        if(error)setError(error.message);
        else setAiSharing(data?.approved===true);
      }
    })().catch((err:unknown)=>{if(active)setError(err instanceof Error?err.message:"No se pudo cargar el permiso de IA.");});
    return ()=>{active=false;};
  },[pane,client,userId,business.id]);

  async function revokeAiSharing(){
    if(aiSaving)return;
    setAiSaving(true);setError("");
    try{
      const {error}=await client.from("global_stock_ai_data_consents").upsert({
        user_id:userId,business_id:business.id,approved:false,updated_at:new Date().toISOString()
      },{onConflict:"user_id,business_id"});
      if(error)throw error;
      setAiSharing(false);
      setNotice("Autorización de IA revocada para este negocio.");
    }catch(err){setError(err instanceof Error?err.message:"No se pudo revocar el permiso.");}
    finally{setAiSaving(false)}
  }
  function openLegal(path:string){void Linking.openURL("https://globalstocks.vercel.app"+path).catch(()=>setError("No se pudo abrir el documento."));}

  useEffect(()=>{setName(business.name);setError("");setNotice("");},[business.id,business.name]);
  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    void (async () => {
      const [entity, state] = await Promise.all([
        client.from("global_stock_businesses")
          .select("name,business_type,country").eq("id",business.id).single(),
        client.from("global_stock_workspaces")
          .select("state").eq("business_id",business.id).maybeSingle()
      ]);
      if (!active) return;
      if (entity.error) throw entity.error;
      setName(String(entity.data?.name ?? business.name));
      setIndustry(String(entity.data?.business_type ?? "retail"));
      setCountry(String(entity.data?.country ?? "Argentina"));
      if (!state.error && state.data?.state && typeof state.data.state === "object" && !Array.isArray(state.data.state)) {
        const cloud = state.data.state as Record<string,unknown>;
        setDescription(typeof cloud.businessDescription === "string" ? cloud.businessDescription : "");
      } else setDescription("");
    })().catch((err:unknown) => {
      if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
    }).finally(()=>{if(active)setProfileLoading(false)});
    return () => {active=false};
  },[client,business.id]);
  useEffect(()=>{
    let active=true;
    setRole(null);
    void (async()=>{
      const {data,error}=await client.from("global_stock_members").select("role").eq("business_id",business.id).eq("user_id",userId).eq("active",true).maybeSingle();
      if(active && !error)setRole(String(data?.role??""));
    })().catch(()=>{if(active)setRole("");});
    return ()=>{active=false;};
  },[business.id,client,userId]);

  async function update(values: Record<string,string>) {
    if(!canEdit||saving)return;
    setSaving(true);setError("");setNotice("");
    try {
      const {data,error}=await client.from("global_stock_businesses").update(values).eq("id",business.id).select("id,name,base_currency,locale").single();
      if(error)throw error;
      onBusiness(data as Business);
      setNotice("Cambios guardados. Se verán también desde la PC al actualizar.");
    } catch(err){setError(err instanceof Error?err.message:"No se pudo guardar la configuración.");}
    finally{setSaving(false);}
  }

  function chooseLanguage(id: string) {
    setShowLanguage(false);
    if(id === business.locale) return;
    Alert.alert("Idioma del negocio","Se guardará la preferencia en Supabase. Algunas pantallas nativas todavía se muestran en español mientras completamos las traducciones.",[
      {text:"Cancelar",style:"cancel"},
      {text:"Guardar",onPress:()=>void update({locale:id})}
    ]);
  }

  async function saveProfile() {
    if (!canEdit || saving || profileLoading) return;
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 100) {
      setError("El nombre debe tener entre 2 y 100 caracteres."); return;
    }
    if (!industries.some(x => x.id === industry)) {
      setError("Seleccioná una actividad válida."); return;
    }
    if (country.trim().length > 100 || description.length > 1500) {
      setError("El país o la descripción es demasiado largo."); return;
    }
    setSaving(true); setError("");setNotice("");
    try {
      const {data,error} = await client.from("global_stock_businesses").update({
        name:clean,business_type:industry,country:country.trim() || null
      }).eq("id",business.id).select("id,name,base_currency,locale").single();
      if (error) throw error;
      const {error:workspaceError} = await client.rpc("global_stock_merge_workspace_state",{
        target_business_id:business.id,
        state_patch: {
          businessName:clean,
          businessType:industry,
          businessCountry:country.trim(),
          businessDescription:description.trim()
        }
      });
      if(workspaceError) {
        // Never falsely claim a complete save when Supabase's workspace merge failed.
        onBusiness(data as Business);
        throw new Error("Se actualizó la ficha del negocio, pero no su perfil de la web: "+workspaceError.message);
      }
      onBusiness(data as Business);
      setNotice("Perfil actualizado en Supabase y compartido con la versión web.");
    } catch(err){setError(err instanceof Error?err.message:"No se pudo guardar el perfil.");}
    finally{setSaving(false)}
  }

  function action(label:string,onPress:()=>void,secondary=true){
    return <Pressable accessibilityRole="button" onPress={onPress} style={[st.button,!secondary&&st.primary]}><Text style={[st.buttonText,!secondary&&{color:"#fff"}]}>{label}</Text></Pressable>;
  }

  return <View style={st.container}>
    <View style={{gap:7}}><Text style={st.kicker}>PREFERENCIAS</Text><Text style={st.title}>Configuración</Text><Text style={st.text}>Perfil operativo, idiomas, cotizaciones, apariencia, seguridad y la app.</Text></View>
    <View style={st.tabs}>
      {([["profile","Perfil"],["rates","Cotizaciones"],["appearance","Apariencia"],["account","Cuenta"]] as const).map(([id,label])=>
        <Pressable key={id} onPress={()=>setPane(id)} accessibilityRole="tab" accessibilityState={{selected:pane===id}} style={[st.tab,pane===id&&st.tabActive]}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[st.tabLabel,pane===id&&st.tabLabelActive]}>{label}</Text>
        </Pressable>
      )}
    </View>
    {pane==="profile" ? <>
    <View style={st.card}>
      <View style={st.cardHeading}><Store size={19} color="#C91827"/><Text style={st.sectionTitle}>Perfil operativo</Text></View>
      <Text style={st.help}>Definí el tipo de operación para adaptar análisis, IA y procesos a tu negocio.</Text>
      {profileLoading ? <ActivityIndicator color="#C91827" /> : <>
        <Text style={st.label}>NOMBRE DEL NEGOCIO</Text>
        <TextInput style={st.input} value={name} onChangeText={setName} editable={canEdit&&!saving} placeholder="Nombre comercial" placeholderTextColor={p.muted} accessibilityLabel="Nombre del negocio"/>
        <Text style={st.label}>ACTIVIDAD</Text>
        {action(industries.find(x=>x.id===industry)?.name ?? industry,()=>setShowIndustries(v=>!v))}
        {showIndustries&&<View style={{gap:7}}>{industries.map(item=><Pressable accessibilityRole="button" accessibilityState={{selected:industry===item.id}} key={item.id}
          onPress={()=>{setIndustry(item.id);setShowIndustries(false)}} style={st.option}>
          <Text style={st.value}>{item.name}</Text>{industry===item.id?<Check size={16} color="#55C69E"/>:null}
        </Pressable>)}</View>}
        <Text style={st.label}>PAÍS DE OPERACIÓN</Text>
        <TextInput style={st.input} value={country} onChangeText={setCountry} editable={canEdit&&!saving} placeholder="País" placeholderTextColor={p.muted} accessibilityLabel="País de operación"/>
        <Text style={st.label}>¿A QUÉ SE DEDICA EL NEGOCIO?</Text>
        <TextInput multiline textAlignVertical="top" style={[st.input,{minHeight:85}]} value={description} onChangeText={setDescription} editable={canEdit&&!saving} placeholder="Descripción del negocio" placeholderTextColor={p.muted} accessibilityLabel="Descripción del negocio" maxLength={1500}/>
        {canEdit?action(saving?"Guardando…":"Guardar perfil",()=>void saveProfile(),false):<Text style={st.help}>Solo propietarios y administradores pueden editar este perfil.</Text>}
      </>}
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}><Globe2 size={18} color="#C91827"/><Text style={st.sectionTitle}>Idioma y moneda</Text></View>
      <View style={st.line}><Text style={st.label}>Moneda base</Text><Text style={st.value}>{business.base_currency}</Text></View>
      <Text style={st.help}>El centro de cotizaciones permite convertir importes sin cambiar precios históricos de venta.</Text>
      <View style={st.line}><Text style={st.label}>Idioma del negocio</Text><Text style={st.value}>{languageOptions.find(o=>o.id===business.locale)?.label??business.locale}</Text></View>
      {canEdit?action(showLanguage?"Cerrar idiomas":"Seleccionar idioma",()=>setShowLanguage(v=>!v)):null}
      {showLanguage&&canEdit?<View style={{gap:7}}>{languageOptions.map(item=><Pressable onPress={()=>chooseLanguage(item.id)} key={item.id} style={st.option} accessibilityRole="button">
        <Text style={st.value}>{item.label}</Text>{business.locale===item.id?<Check size={17} color="#54C29D"/>:null}
      </Pressable>)}</View>:null}
      {action("Cambiar negocio",onSwitchBusiness)}
    </View>
    </> : null}
    {pane==="appearance" ? <>
    <View style={st.card}>
      <View style={st.cardHeading}>{dark?<Moon size={19} color="#C91827"/>:<Sun size={19} color="#C91827"/>}<Text style={st.sectionTitle}>Apariencia</Text></View>
      <Text style={st.help}>Tema actual: {dark?"Oscuro":"Claro"}. El aspecto web es independiente del celular.</Text>
      <View style={st.two}><View style={{flex:1}}>{action("Oscuro",()=>onTheme(true))}</View><View style={{flex:1}}>{action("Claro",()=>onTheme(false))}</View></View>
    </View>
    </> : null}
    {pane==="rates" ? <NativeFxCenter dark={dark} baseCurrency={business.base_currency} /> : null}
    {pane==="account" ? <>
    <View style={st.card}>
      <View style={st.cardHeading}><RefreshCw size={18} color="#C91827"/><Text style={st.sectionTitle}>Sincronización y datos</Text></View>
      <Text style={st.help}>Los productos y ventas se consultan de Supabase. Agenda y Proveedores se guardan en tu espacio de trabajo. Los borradores de venta no registran cobros.</Text>
      {action("Sincronizar inventario",onRefresh)}
      <View style={st.line}><Text style={st.label}>Servidor</Text><Text style={[st.value,{color:"#55C69E"}]}>Global Stock · Supabase</Text></View>
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}><ShieldCheck size={19} color="#C91827"/><Text style={st.sectionTitle}>Seguridad</Text></View>
      <Text style={st.help}>La sesión se guarda cifrada en el dispositivo. Los datos de cada negocio están protegidos por sus permisos.</Text>
      <View style={st.line}><Text style={st.label}>Permiso del usuario</Text><Text style={st.value}>{role||"Consultando..."}</Text></View>
      {action("Administrar miembros y permisos",onOpenWeb)}
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}><BellRing size={19} color="#C91827"/><Text style={st.sectionTitle}>Notificaciones y dispositivo</Text></View>
      <Text style={st.help}>Las alertas aparecen en el tablero cuando el stock está por debajo del mínimo. Las notificaciones push nativas todavía no están activadas.</Text>
      <View style={st.line}><Text style={st.label}>Aplicación</Text><Text style={st.value}>Global Stock · Expo</Text></View>
      <View style={st.line}><Text style={st.label}>Escáner de cámara</Text><Text style={st.value}>Disponible desde Almacén</Text></View>
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}><Mail size={19} color="#C91827"/><Text style={st.sectionTitle}>Ayuda y soporte</Text></View>
      <Text style={st.help}>¿Tenés dudas o encontraste un error? Escribinos y contanos qué ocurrió, sin enviar contraseñas ni datos sensibles.</Text>
      <Pressable accessibilityRole="link" accessibilityLabel={`Contactar soporte: ${SUPPORT_EMAIL}`}
        onPress={()=>void Linking.openURL(supportEmailUrl("Consulta sobre Global Stock"))} style={st.supportLink}>
        <Text style={st.supportEmail}>{SUPPORT_EMAIL}</Text>
        <Mail size={16} color="#C91827"/>
      </Pressable>
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}><UserRound size={19} color="#C91827"/><Text style={st.sectionTitle}>Cuenta</Text></View>
      {action("Abrir Global Stock web",onOpenWeb)}
      {action("Cerrar sesión",onSignOut)}
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}><ShieldCheck size={19} color="#C91827"/><Text style={st.sectionTitle}>Privacidad y documentos legales</Text></View>
      <Text style={st.help}>Conocé tus derechos, nuestra política y cómo eliminar o exportar los datos de la cuenta.</Text>
      {action("Términos de uso",()=>openLegal("/legal/terms"))}
      {action("Política de privacidad",()=>openLegal("/legal/privacy"))}
      {action("Información de seguridad",()=>openLegal("/legal/security"))}
      <NativeAccountDeletion client={client} onDeleted={onSignOut} dark={dark} />
      <View style={st.line}><Text style={st.label}>Contexto del negocio compartido con Global Intelligence</Text><Text style={st.value}>{aiSharing===null?"Verificando":aiSharing?"Permitido":"No permitido"}</Text></View>
      {aiSharing===true?action(aiSaving?"Revocando…":"Revocar autorización de IA",()=>Alert.alert("Revocar datos para IA","Global Intelligence dejará de utilizar el contexto de este negocio desde la app.",[{text:"Cancelar",style:"cancel"},{text:"Revocar",style:"destructive",onPress:()=>void revokeAiSharing()}])):null}
      <Text style={st.help}>La confirmación de edad en la app es una declaración, no una verificación de identidad. La disponibilidad legal y fiscal puede variar según el país.</Text>
    </View>
    </> : null}
    {saving?<ActivityIndicator color="#C91827"/>:null}
    {!!error&&<View style={[st.card,{gap:8}]}>
      <Text accessibilityRole="alert" style={[st.help,{color:dark?"#B8B8C3":"#686877"}]}>{error}</Text>
      <Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(supportEmailUrl("Error en configuración"))}>
        <Text style={st.supportEmail}>{SUPPORT_EMAIL}</Text>
      </Pressable>
    </View>
    {!!notice&&<Text style={[st.help,{color:"#58C99A"}]}>{notice}</Text>}
  </View>;
}

function styles(p:{panel:string;line:string;fg:string;muted:string;input:string}){return StyleSheet.create({
  container:{gap:15,paddingBottom:30},
  kicker:{fontSize:10,letterSpacing:1.4,fontWeight:"900",color:"#CE1624"},
  title:{fontSize:24,fontWeight:"800",color:p.fg},
  text:{fontSize:12,color:p.muted,lineHeight:18},
  card:{backgroundColor:p.panel,borderWidth:1,borderColor:p.line,borderRadius:18,padding:16,gap:13},
  cardHeading:{flexDirection:"row",alignItems:"center",gap:9},
  sectionTitle:{fontSize:15,fontWeight:"800",color:p.fg},
  label:{fontSize:11,fontWeight:"700",color:p.muted,flex:1},
  value:{fontSize:12,fontWeight:"800",color:p.fg},
  help:{fontSize:11.5,lineHeight:18,color:p.muted},
  input:{minHeight:44,backgroundColor:p.input,borderWidth:1,borderColor:p.line,borderRadius:11,paddingHorizontal:12,color:p.fg,fontSize:13},
  line:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10},
  button:{borderRadius:11,minHeight:44,borderWidth:1,borderColor:p.line,backgroundColor:p.input,justifyContent:"center",alignItems:"center",paddingHorizontal:10},
  primary:{backgroundColor:"#A90011",borderWidth:0},
  buttonText:{fontSize:12,fontWeight:"800",color:p.fg},
  two:{flexDirection:"row",gap:9},
  tabs:{flexDirection:"row",gap:3,borderRadius:13,borderWidth:1,borderColor:p.line,backgroundColor:p.panel,padding:4},
  tab:{flex:1,minWidth:0,paddingVertical:12,paddingHorizontal:3,borderRadius:10,alignItems:"center"},
  tabActive:{backgroundColor:"#950014"},
  tabLabel:{color:p.muted,fontSize:10.5,fontWeight:"700",textAlign:"center"},
  tabLabelActive:{color:"#FFF"},
  option:{paddingVertical:11,paddingHorizontal:13,borderRadius:10,backgroundColor:p.input,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
   supportLink:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:9,backgroundColor:p.input,padding:13,borderRadius:11,borderWidth:1,borderColor:p.line},
   supportEmail:{color:"#C91827",fontSize:12,fontWeight:"800",flexShrink:1}
})}
