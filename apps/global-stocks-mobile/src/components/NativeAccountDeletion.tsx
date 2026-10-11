import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AlertTriangle, Trash2 } from "lucide-react-native";

const PHRASE = "ELIMINAR MI CUENTA";
type Props = { client: SupabaseClient; onDeleted: () => void; dark: boolean };

export default function NativeAccountDeletion({ client, onDeleted, dark }: Props) {
  const [open,setOpen] = useState(false);
  const [email,setEmail] = useState("");
  const [confirmEmail,setConfirmEmail] = useState("");
  const [phrase,setPhrase] = useState("");
  const [checking,setChecking] = useState(false);
  const [deleting,setDeleting] = useState(false);
  const [error,setError] = useState("");
  const fg=dark?"#F4F4F6":"#19191D";
  const muted=dark?"#AEAFBA":"#696A75";
  const panel=dark?"#212126":"#F0F0F4";
  const border=dark?"#3A3A43":"#E1E1E7";
  const canDelete=!!email && confirmEmail.trim().toLowerCase()===email.trim().toLowerCase() && phrase.trim()===PHRASE && !deleting;

  async function start() {
    setChecking(true);setError("");
    try {
      const {data:{user},error:userError}=await client.auth.getUser();
      if(userError||!user?.email)throw new Error("No se pudo verificar la sesión. Iniciá sesión nuevamente.");
      setEmail(user.email);setOpen(true);setConfirmEmail("");setPhrase("");
    }catch(err){setError(err instanceof Error?err.message:"No se pudo verificar la cuenta.");}
    finally{setChecking(false);}
  }
  async function remove() {
    if(!canDelete)return;
    setDeleting(true);setError("");
    try {
      const {error:rpcError}=await client.rpc("global_stock_delete_my_account",{
        p_confirm_email:confirmEmail.trim(),p_confirm_phrase:phrase.trim()
      });
      if(rpcError)throw rpcError;
      await client.auth.signOut({scope:"local"}).catch(()=>null);
      onDeleted();
    }catch(err) {
      const msg=err instanceof Error?err.message:"";
      setError(msg.includes("OWNERSHIP_TRANSFER_REQUIRED")
        ? "Tenés que transferir la propiedad del negocio compartido antes de eliminar la cuenta."
        : msg.includes("EMAIL_MISMATCH") ? "El correo ingresado no coincide con tu cuenta."
        : msg.includes("AUTH_REQUIRED") ? "La sesión venció. Volvé a iniciar sesión."
        : "No se pudo eliminar la cuenta. Los datos se conservaron. Contactá a soporte si persiste.");
    }finally{setDeleting(false);}
  }

  return <View style={{gap:12}}>
    <View style={{flexDirection:"row",gap:9,alignItems:"center"}}><Trash2 size={18} color="#D0444D"/><Text style={{color:fg,fontSize:14,fontWeight:"800"}}>Eliminar mi cuenta y datos</Text></View>
    <Text style={{color:muted,fontSize:12,lineHeight:18}}>Podés solicitar y ejecutar la eliminación desde esta misma aplicación. Si hay otros miembros, primero tendrás que transferir la propiedad.</Text>
    {!open ? <Pressable accessibilityRole="button" disabled={checking} onPress={()=>void start()} style={[st.button,{backgroundColor:panel,borderColor:border}]}>
      <Text style={{color:fg,fontWeight:"800",fontSize:12}}>{checking?"Verificando…":"Iniciar eliminación de cuenta"}</Text>
    </Pressable> : <View style={[st.box,{backgroundColor:panel,borderColor:border}]}>
      <View style={{flexDirection:"row",gap:9}}><AlertTriangle size={20} color="#D6505F"/><Text style={{flex:1,color:fg,fontSize:12,lineHeight:19}}>Acción irreversible. Puede eliminar negocios y datos de tu propiedad exclusiva. Revisá antes de continuar.</Text></View>
      <Text style={{color:muted,fontSize:12}}>Cuenta autenticada: {email}</Text>
      <Text style={{color:fg,fontWeight:"700",fontSize:12}}>Repetí tu correo</Text>
      <TextInput accessibilityLabel="Correo para confirmar eliminación" value={confirmEmail} onChangeText={setConfirmEmail} autoCapitalize="none" keyboardType="email-address" placeholder={email} placeholderTextColor={muted} style={[st.input,{color:fg,borderColor:border}]}/>
      <Text style={{color:fg,fontWeight:"700",fontSize:12}}>Escribí exactamente {PHRASE}</Text>
      <TextInput accessibilityLabel="Frase para confirmar eliminación" value={phrase} onChangeText={setPhrase} autoCapitalize="characters" placeholder={PHRASE} placeholderTextColor={muted} style={[st.input,{color:fg,borderColor:border}]}/>
      <Pressable accessibilityRole="button" disabled={!canDelete} onPress={()=>Alert.alert("Confirmar eliminación definitiva","Tu cuenta y los datos que correspondan se eliminarán. Esto no se puede deshacer.",[{text:"Cancelar",style:"cancel"},{text:"Eliminar definitivamente",style:"destructive",onPress:()=>void remove()}])} style={[st.button,{backgroundColor:"#A00011",opacity:canDelete?1:0.4}]}>
        {deleting?<ActivityIndicator color="#FFF"/>:<Text style={{color:"#FFF",fontSize:12,fontWeight:"800"}}>Eliminar definitivamente mi cuenta</Text>}
      </Pressable>
      <Pressable disabled={deleting} accessibilityRole="button" onPress={()=>{setOpen(false);setError("");}} style={st.button}><Text style={{color:fg,fontWeight:"700"}}>Cancelar</Text></Pressable>
    </View>}
    {!!error && <Text accessibilityRole="alert" style={{color:"#D95C69",fontSize:12,lineHeight:18}}>{error}</Text>}
  </View>;
}
const st=StyleSheet.create({
  button:{minHeight:44,borderRadius:12,borderWidth:1,borderColor:"transparent",alignItems:"center",justifyContent:"center",paddingHorizontal:10},
  box:{borderRadius:15,borderWidth:1,padding:13,gap:12},
  input:{minHeight:45,borderRadius:11,borderWidth:1,paddingHorizontal:12,fontSize:13}
});
