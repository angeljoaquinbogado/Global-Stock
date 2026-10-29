import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ExternalLink, ShieldCheck } from "lucide-react-native";
import type { SupabaseClient } from "@supabase/supabase-js";

// Version changes must be reviewed with updated public legal text.
export const LEGAL_TERMS_VERSION = "2026-10-27-ar-suscripciones";
export const LEGAL_PRIVACY_VERSION = "2026-10-27-v6";
const BASE = "https://globalstocks.vercel.app";

type Props = { client: SupabaseClient; userId: string; onReady: () => void; onSignOut: () => void };

export default function NativeLegalGate({ client, userId, onReady, onSignOut }: Props) {
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [adult,setAdult]=useState(false);
  const [operatesInAr,setOperatesInAr]=useState(false);
  const [terms,setTerms]=useState(false);
  const [error,setError]=useState("");
  const [retry,setRetry]=useState(0);

  useEffect(()=>{
    let active=true;
    setLoading(true);setError("");
    void (async()=>{
      const {data,error}=await client.from("global_stock_legal_acceptances")
        .select("id,adult_18_attested,operates_in_ar_attested").eq("user_id",userId)
        .eq("terms_version",LEGAL_TERMS_VERSION)
        .eq("privacy_version",LEGAL_PRIVACY_VERSION)
        .maybeSingle();
      if(!active)return;
      if(error)throw error;
      if(data?.id && data.adult_18_attested === true && data.operates_in_ar_attested === true)readyCallback.current();
    })().catch((err:unknown)=>{
      if(active)setError(err instanceof Error ? err.message : "No se pudo verificar la aceptación.");
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[client,userId,retry]);

  async function accept() {
    if(!adult || !operatesInAr || !terms || loading || saving)return;
    setError("");setSaving(true);
    try{
      const {error}=await client.from("global_stock_legal_acceptances").upsert({
        user_id:userId,terms_version:LEGAL_TERMS_VERSION,privacy_version:LEGAL_PRIVACY_VERSION,
        adult_18_attested:true,operates_in_ar_attested:true
      },{onConflict:"user_id,terms_version,privacy_version",ignoreDuplicates:true});
      if(error)throw error;
      readyCallback.current();
    }catch(err){setError(err instanceof Error?err.message:"No se pudo registrar la aceptación.");}
    finally{setSaving(false);}
  }
  const open=(path:string)=>void Linking.openURL(BASE+path).catch(()=>setError("No se pudo abrir el documento legal. Probá desde "+BASE+"/legal."));
  return <SafeAreaView edges={["top","bottom"]} style={s.root}>
    <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      <View style={s.mark}><ShieldCheck size={23} color="#F5F5F7"/></View>
      <Text style={s.eyebrow}>GLOBAL STOCK · PRIMER ACCESO</Text>
      <Text style={s.title}>Tu cuenta. Tus datos. Tus decisiones.</Text>
      <Text style={s.subtitle}>Antes de usar la versión móvil, revisá las condiciones y cómo protegemos la información de tu negocio.</Text>
      {loading?<View style={s.loading}><ActivityIndicator color="#B80A19"/><Text style={s.secondary}>Verificando tu cuenta…</Text></View>:<>
        <View style={s.panel}>
          <Text style={s.panelTitle}>Documentos importantes</Text>
          <Pressable accessibilityRole="link" onPress={()=>open("/legal/terms")} style={s.link}><Text style={s.linkText}>Términos de uso</Text><ExternalLink size={15} color="#E56370"/></Pressable>
          <Pressable accessibilityRole="link" onPress={()=>open("/legal/privacy")} style={s.link}><Text style={s.linkText}>Política de privacidad</Text><ExternalLink size={15} color="#E56370"/></Pressable>
          <Pressable accessibilityRole="link" onPress={()=>open("/legal/cookies")} style={s.link}><Text style={s.linkText}>Cookies y almacenamiento</Text><ExternalLink size={15} color="#E56370"/></Pressable>
          <Pressable accessibilityRole="link" onPress={()=>open("/legal/security")} style={s.link}><Text style={s.linkText}>Información de seguridad</Text><ExternalLink size={15} color="#E56370"/></Pressable>
        </View>
        <Pressable onPress={()=>setAdult(v=>!v)} accessibilityRole="checkbox" accessibilityState={{checked:adult}} style={s.consent}>
          <View style={[s.checkbox,adult&&s.selected]}>{adult?<Check color="#fff" size={14}/>:null}</View>
          <Text style={s.consentText}>Confirmo que tengo <Text style={s.strong}>18 años o más</Text> y que tengo capacidad legal para crear o administrar una cuenta comercial.</Text>
        </Pressable>
        <Pressable onPress={()=>setOperatesInAr(v=>!v)} accessibilityRole="checkbox" accessibilityState={{checked:operatesInAr}} style={s.consent}>
          <View style={[s.checkbox,operatesInAr&&s.selected]}>{operatesInAr?<Check color="#fff" size={14}/>:null}</View>
          <Text style={s.consentText}>Confirmo que el negocio con el que voy a utilizar Global Stock <Text style={s.strong}>opera en Argentina</Text> y entiendo que esta primera beta no está dirigida a otros países.</Text>
        </Pressable>
        <Pressable onPress={()=>setTerms(v=>!v)} accessibilityRole="checkbox" accessibilityState={{checked:terms}} style={s.consent}>
          <View style={[s.checkbox,terms&&s.selected]}>{terms?<Check color="#fff" size={14}/>:null}</View>
          <Text style={s.consentText}>Leí y acepto los <Text style={s.strong}>Términos de uso</Text> y la <Text style={s.strong}>Política de privacidad</Text> de Global Stock.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!adult||!operatesInAr||!terms||saving} onPress={()=>void accept()} style={[s.button,(!adult||!operatesInAr||!terms||saving)&&{opacity:0.5}]}>
          {saving?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>Aceptar y continuar</Text>}
        </Pressable>
        <Text style={s.secondary}>Esta confirmación es una declaración del usuario, no una verificación documental de edad. El lanzamiento comercial en cada país requiere sus propias comprobaciones.</Text>
      </>}
      {error?<View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable onPress={()=>setRetry(v=>v+1)} accessibilityRole="button"><Text style={s.retry}>Reintentar</Text></Pressable></View>:null}
      <Pressable accessibilityRole="button" onPress={onSignOut} style={s.logout}><Text style={s.secondary}>Cerrar sesión</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:"#0A0A0D"},
  body:{paddingHorizontal:24,paddingTop:40,paddingBottom:35,gap:19},
  mark:{height:51,width:51,borderRadius:15,backgroundColor:"#960013",alignItems:"center",justifyContent:"center",marginBottom:6},
  eyebrow:{color:"#ED5361",fontSize:10,fontWeight:"800",letterSpacing:1.55},
  title:{color:"#F7F7FA",fontSize:27,fontWeight:"800",lineHeight:34,letterSpacing:-0.7},
  subtitle:{color:"#B0B0BD",fontSize:13,lineHeight:20},
  panel:{borderRadius:17,borderWidth:1,borderColor:"#313139",backgroundColor:"#19191F",padding:17,gap:6},
  panelTitle:{fontSize:14,fontWeight:"800",color:"#F6F6F8",marginBottom:6},
  link:{minHeight:42,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:0.7,borderColor:"#34343C"},
  linkText:{color:"#ECECF1",fontSize:13},
  consent:{paddingVertical:10,flexDirection:"row",alignItems:"flex-start",gap:12},
  checkbox:{width:22,height:22,borderWidth:1,borderColor:"#61616B",borderRadius:7,alignItems:"center",justifyContent:"center",marginTop:2},
  selected:{backgroundColor:"#9E0013",borderColor:"#9E0013"},
  consentText:{color:"#BDBDC6",fontSize:12.5,lineHeight:20,flex:1},
  strong:{color:"#F5F5F7",fontWeight:"700"},
  button:{minHeight:51,backgroundColor:"#A80014",borderRadius:13,alignItems:"center",justifyContent:"center"},
  buttonText:{fontWeight:"800",color:"#fff",fontSize:14},
  secondary:{color:"#9F9FAA",fontSize:11.5,lineHeight:18},
  logout:{alignSelf:"center",padding:10},
  loading:{flexDirection:"row",gap:10,alignItems:"center",paddingVertical:15},
  error:{borderRadius:11,borderWidth:1,borderColor:"#A65D45",padding:12,gap:10},
  errorText:{color:"#F2AD8B",fontSize:12},
  retry:{color:"#E76977",fontWeight:"800",fontSize:12}
});
