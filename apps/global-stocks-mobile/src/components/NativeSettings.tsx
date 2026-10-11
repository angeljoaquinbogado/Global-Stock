import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BellRing, Check, CreditCard, Globe2, LockKeyhole, LogOut, MonitorSmartphone, Moon, RefreshCw, ShieldCheck, Store, Sun, UserRound } from "lucide-react-native";
import type { Business } from "../lib/data";

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

const languageOptions = [
  { id: "es-AR", label: "Español (Argentina)" },
  { id: "en-US", label: "English" },
  { id: "pt-BR", label: "Português" },
  { id: "fr-FR", label: "Français" },
  { id: "de-DE", label: "Deutsch" }
];

export default function NativeSettings({ client, business, userId, dark, onTheme, onBusiness, onSwitchBusiness, onRefresh, onSignOut, onOpenWeb }: Props) {
  const [name, setName] = useState(business.name);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showLanguage, setShowLanguage] = useState(false);
  const p = dark ? {bg:"#09090B",panel:"#171719",line:"#34343B",fg:"#F8F8FA",muted:"#ABABB6",input:"#212126"} : {bg:"#F5F5F7",panel:"#FFF",line:"#E0E0E6",fg:"#17171B",muted:"#6B6B73",input:"#F2F2F5"};
  const st = styles(p);
  const canEdit=role==="owner"||role==="admin";

  useEffect(()=>{setName(business.name);setError("");setNotice("");},[business.id,business.name]);
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

  function saveName(){
    const clean=name.trim();
    if(clean.length<2||clean.length>100){setError("El nombre debe tener entre 2 y 100 caracteres.");return;}
    if(clean!==business.name)void update({name:clean});
  }

  function action(label:string,onPress:()=>void,secondary=true){
    return <Pressable accessibilityRole="button" onPress={onPress} style={[st.button,!secondary&&st.primary]}><Text style={[st.buttonText,!secondary&&{color:"#fff"}]}>{label}</Text></Pressable>;
  }

  return <View style={st.container}>
    <View style={{gap:7}}><Text style={st.kicker}>PREFERENCIAS</Text><Text style={st.title}>Configuración</Text><Text style={st.text}>Tu negocio, tus preferencias, la app y tu cuenta.</Text></View>
    <View style={st.card}>
      <View style={st.cardHeading}><Store size={19} color="#C91827"/><Text style={st.sectionTitle}>Negocio</Text></View>
      <Text style={st.label}>Nombre del negocio</Text>
      <TextInput style={st.input} value={name} onChangeText={setName} editable={canEdit&&!saving} placeholder="Nombre comercial" placeholderTextColor={p.muted} accessibilityLabel="Nombre del negocio"/>
      {canEdit&&name.trim()!==business.name?action(saving?"Guardando…":"Guardar nombre",saveName,false):null}
      <View style={st.line}><Text style={st.label}>Moneda base</Text><Text style={st.value}>{business.base_currency}</Text></View>
      <Text style={st.help}>La moneda base está vinculada a precios y ventas. No se cambia desde el celular para evitar modificar valores accidentalmente.</Text>
      <View style={st.line}><Text style={st.label}>Idioma de la cuenta comercial</Text><Text style={st.value}>{languageOptions.find(o=>o.id===business.locale)?.label??business.locale}</Text></View>
      {canEdit?action(showLanguage?"Cerrar idiomas":"Seleccionar idioma",()=>setShowLanguage(v=>!v)):null}
      {showLanguage&&canEdit?<View style={{gap:7}}>{languageOptions.map(item=><Pressable onPress={()=>chooseLanguage(item.id)} key={item.id} style={st.option} accessibilityRole="button">
        <Text style={st.value}>{item.label}</Text>{business.locale===item.id?<Check size={17} color="#54C29D"/>:null}
      </Pressable>)}</View>:null}
      {action("Cambiar negocio",onSwitchBusiness)}
    </View>
    <View style={st.card}>
      <View style={st.cardHeading}>{dark?<Moon size={19} color="#C91827"/>:<Sun size={19} color="#C91827"/>}<Text style={st.sectionTitle}>Apariencia</Text></View>
      <Text style={st.help}>Tema actual: {dark?"Oscuro":"Claro"}. El aspecto web es independiente del celular.</Text>
      <View style={st.two}><View style={{flex:1}}>{action("Oscuro",()=>onTheme(true))}</View><View style={{flex:1}}>{action("Claro",()=>onTheme(false))}</View></View>
    </View>
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
      <View style={st.cardHeading}><UserRound size={19} color="#C91827"/><Text style={st.sectionTitle}>Cuenta</Text></View>
      {action("Abrir Global Stock web",onOpenWeb)}
      {action("Cerrar sesión",onSignOut)}
    </View>
    {saving?<ActivityIndicator color="#C91827"/>:null}
    {!!error&&<Text style={[st.help,{color:"#E8A975"}]}>{error}</Text>}
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
  option:{paddingVertical:11,paddingHorizontal:13,borderRadius:10,backgroundColor:p.input,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}
})}
