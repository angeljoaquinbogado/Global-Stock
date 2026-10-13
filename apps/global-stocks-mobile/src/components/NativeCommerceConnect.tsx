import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { appAlerts } from "../lib/alerts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CheckCircle2, ChevronDown, ExternalLink, Globe2, Link2, LockKeyhole, RefreshCw, ShieldCheck, Store, WifiOff } from "lucide-react-native";
import type { Business } from "../lib/data";

type Provider = "mercadolibre" | "shopify" | "tiendanube" | "woocommerce" |
  "wix" | "prestashop" | "vtex" | "custom" | "other";
type StoreRequest = { id: string; provider: Provider; display_name: string | null; store_url: string | null; status: string; created_at: string };
type VerifiedAccount = { id: string; provider: string; display_name: string | null; status: string; last_synced_at: string | null };
type Props = { client: SupabaseClient; business: Business; dark: boolean; onOpenWeb: () => void };
const options: Array<{ value: Provider; name: string; method: string; help: string }> = [
  {value:"mercadolibre",name:"Mercado Libre",method:"OAuth",help:"Tu cuenta de vendedor debe autorizar el acceso a publicaciones y pedidos."},
  {value:"shopify",name:"Shopify",method:"OAuth",help:"La tienda autoriza los permisos necesarios desde su administración."},
  {value:"tiendanube",name:"Tiendanube",method:"OAuth",help:"Integración mediante una aplicación autorizada por el titular."},
  {value:"woocommerce",name:"WooCommerce",method:"REST API",help:"Requiere habilitar la API y generar credenciales en la tienda."},
  {value:"wix",name:"Wix",method:"API / app",help:"Requiere autorización de la tienda y soporte del conector."},
  {value:"prestashop",name:"PrestaShop",method:"API",help:"Requiere acceso al servicio web de PrestaShop."},
  {value:"vtex",name:"VTEX",method:"API",help:"Requiere permisos de una cuenta VTEX autorizada."},
  {value:"custom",name:"Tienda propia / web personal",method:"API o conector",help:"Para tiendas creadas por vos: la URL identifica el sitio, no da permiso a leer pedidos."},
  {value:"other",name:"Otra plataforma",method:"API o webhook",help:"Si no aparece en la lista, escribí el nombre de la plataforma y su dirección."}
];
const READY: Record<string,boolean> = { custom:true };
function publicStoreOrigin(text: string): string {
  const value = text.trim();
  if(!value || value.length>500 || /\s/.test(value) || /@/.test(value)) throw new Error("Ingresá una dirección web válida (https://mitienda.com).");
  const url = new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);
  if(url.protocol!=="https:" || url.username || url.password || (url.port && url.port!=="443")) throw new Error("Solo aceptamos direcciones públicas HTTPS sin usuario, contraseña ni puertos internos.");
  const hostname=url.hostname.toLowerCase().replace(/\.$/,"");
  if(!/^[a-z0-9.-]+$/.test(hostname) || hostname.length>253 || !hostname.includes(".") ||
    /(^|\.)(localhost|local|internal|intranet|example|test|invalid)(\.|$)/.test(hostname) ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
    hostname.split(".").some(label=>!label || label.length>63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    throw new Error("La dirección debe tener un dominio público. No se permiten IP ni servidores internos.");
  }
  return `https://${hostname}${url.port?":443":""}`;
}
const display = (provider:string) => options.find(o=>o.value===provider)?.name ?? provider;

export default function NativeCommerceConnect({client,business,dark,onOpenWeb}:Props) {
  const [selected,setSelected] = useState<Provider>("mercadolibre");
  const [expanded,setExpanded] = useState(false);
  const [storeUrl,setStoreUrl] = useState("");
  const [customName,setCustomName] = useState("");
  const [requests,setRequests] = useState<StoreRequest[]>([]);
  const [connected,setConnected] = useState<VerifiedAccount[]>([]);
  const [ready,setReady] = useState<Record<string,boolean>>(READY);
  const [busy,setBusy] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [version,setVersion] = useState(0);
  const [role,setRole] = useState("viewer");
  const [editingRequest,setEditingRequest] = useState<string|null>(null);
  const [editName,setEditName] = useState("");
  const [editUrl,setEditUrl] = useState("");
  const [workingId,setWorkingId] = useState<string|null>(null);
  const canEdit=role==="owner"||role==="admin";
  const p=useMemo(()=>dark?{panel:"#19191D",tile:"#24242A",line:"#37373C",fg:"#F6F6F9",muted:"#ACADB7"}:
    {panel:"#FFF",tile:"#F2F2F5",line:"#DEDEE4",fg:"#16161B",muted:"#6C6C75"},[dark]);
  const s=useMemo(()=>styles(p),[p]);
  const current=options.find(x=>x.value===selected)!;
  const isVerified=connected.filter(x=>x.provider===selected&&x.status==="connected");
  const isConfigured=ready[selected]===true;
  const requiresUrl=selected==="custom"||selected==="other";
  const activeRequests=requests.filter(x=>x.status==="requested");
  const refresh=useCallback(async()=>{
    const [{data:req,error:reqError},{data:linked,error:linkedError},{data:membership,error:roleError}]=await Promise.all([
      client.from("global_stock_integration_requests").select("id,provider,display_name,store_url,status,created_at").eq("business_id",business.id).order("created_at",{ascending:false}).limit(40),
      client.from("global_stock_integration_accounts").select("id,provider,display_name,status,last_synced_at").eq("business_id",business.id).limit(50),
      client.from("global_stock_members").select("role").eq("business_id",business.id).eq("user_id",(await client.auth.getUser()).data.user?.id||"").eq("active",true).maybeSingle()
    ]);
    if(reqError)throw reqError;
    if(linkedError)throw linkedError;
    if(roleError)throw roleError;
    setRole(String(membership?.role||"viewer"));
    setRequests((req??[]) as StoreRequest[]);
    setConnected((linked??[]) as VerifiedAccount[]);
  },[business.id,client]);
  useEffect(()=>{
    let live=true;setBusy(true);setError("");
    void Promise.allSettled([refresh(),fetch("https://globalstocks.vercel.app/api/integrations/status",{headers:{Accept:"application/json"}})
      .then(res=>{if(!res.ok)throw new Error("Status unavailable");return res.json()})
      .then((data:unknown)=>{if(live&&data&&typeof data==="object")setReady(data as Record<string,boolean>);})])
      .then(results=>{if(live && results[0].status==="rejected")setError("No se pudo consultar el estado de las conexiones. Reintentá.");})
      .finally(()=>{if(live)setBusy(false)});
    return()=>{live=false};
  },[refresh,version]);
  async function register() {
    if(saving)return;
    setSaving(true);setError("");setSuccess("");
    try{
      let origin:string|null=null;
      if(storeUrl.trim())origin=publicStoreOrigin(storeUrl);
      if(requiresUrl&&!origin)throw new Error("Para esta plataforma tenés que indicar la URL pública de tu tienda.");
      const name=selected==="other"?customName.trim():selected==="custom"?(customName.trim()||"Sitio propio"):display(selected);
      if(selected==="other"&&(name.length<2||name.length>120))throw new Error("Indicá el nombre de la plataforma.");
      const payload={
        business_id:business.id,provider:selected,display_name:name.slice(0,120),
        store_url:origin,status:"requested"
      };
      const {error:insertError}=await client.from("global_stock_integration_requests").insert(payload);
      if(insertError){
        if(insertError.code==="23505")throw new Error("Esta solicitud ya existe. Revisá las conexiones pendientes.");
        throw insertError;
      }
      setSuccess("Solicitud registrada. Falta autorizar la tienda. No hay stock ni pedidos sincronizados todavía.");
      setStoreUrl("");setCustomName("");setExpanded(false);setVersion(v=>v+1);
    }catch(err){setError(err instanceof Error?err.message:"No se pudo registrar la solicitud.");}
    finally{setSaving(false)}
  }
  function beginRequestEdit(item:StoreRequest) {
    setEditingRequest(item.id);setEditName(item.display_name||display(item.provider));
    setEditUrl(item.store_url||"");setError("");setSuccess("");
  }
  async function saveRequest(item:StoreRequest) {
    if(!canEdit||workingId)return;
    setWorkingId(item.id);setError("");setSuccess("");
    try{
      const origin=editUrl.trim()?publicStoreOrigin(editUrl):null;
      if(!origin&&(item.provider==="custom"||item.provider==="other"))
        throw new Error("Ingresá la URL pública de la tienda.");
      const {error}=await client.rpc("global_stock_manage_integration_request",{
        target_business_id:business.id,target_request_id:item.id,
        action:"edit",new_display_name:editName.trim(),new_store_url:origin
      });
      if(error)throw error;
      setEditingRequest(null);setSuccess("Solicitud actualizada.");setVersion(v=>v+1);
    }catch(e){setError(e instanceof Error?e.message:"No pudimos guardar la conexión.");}
    finally{setWorkingId(null);}
  }
  function deleteRequest(item:StoreRequest) {
    if(!canEdit)return;
    appAlerts.alert("Eliminar solicitud","Se quitará la solicitud pendiente. No elimina productos ni pedidos.",[
      {text:"Cancelar",style:"cancel"},
      {text:"Eliminar",style:"destructive",onPress:()=>void (async()=>{
        setWorkingId(item.id);setError("");
        try{
          const {error}=await client.rpc("global_stock_manage_integration_request",{
            target_business_id:business.id,target_request_id:item.id,action:"delete"
          });
          if(error)throw error;
          setSuccess("Solicitud eliminada.");setVersion(v=>v+1);
        }catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar la solicitud.");}
        finally{setWorkingId(null);}
      })()}
    ]);
  }
  function disconnect(account:VerifiedAccount) {
    if(!canEdit)return;
    appAlerts.alert("Desconectar tienda",
      "Se desconectará únicamente esta tienda de "+display(account.provider)+". El resto de las tiendas y sus datos seguirán intactos. Revocá el permiso también desde la plataforma.",[
      {text:"Cancelar",style:"cancel"},
      {text:"Desconectar",style:"destructive",onPress:()=>void (async()=>{
        setWorkingId(account.id);setError("");setSuccess("");
        try{
          const {error}=await client.rpc("global_stock_disconnect_integration_account",{
            target_business_id:business.id,target_account_id:account.id
          });
          if(error)throw error;
          setSuccess("Tienda desconectada de Global Stock. Las demás conexiones siguen activas.");
          setVersion(v=>v+1);
        }catch(e){setError(e instanceof Error?e.message:"No se pudo desconectar.");}
        finally{setWorkingId(null);}
      })()}
    ]);
  }
  async function renameAccount(item:VerifiedAccount) {
    if(!canEdit||workingId)return;
    setWorkingId(item.id);setError("");
    try{
      const name=editName.trim();
      if(name.length<2||name.length>120)throw new Error("Ingresá un nombre válido.");
      const {error}=await client.from("global_stock_integration_accounts")
        .update({display_name:name}).eq("business_id",business.id).eq("id",item.id);
      if(error)throw error;
      setEditingRequest(null);setSuccess("Nombre de la conexión actualizado.");setVersion(v=>v+1);
    }catch(e){setError(e instanceof Error?e.message:"No pudimos editar la conexión.");}
    finally{setWorkingId(null);}
  }
  return <View style={{gap:15}}>
    <View style={s.header}><Globe2 size={20} color="#D21B2A"/><View style={{flex:1}}><Text style={s.title}>Conectar canales de venta</Text><Text style={s.subtitle}>Elegí la plataforma de tu tienda. Cualquier web puede solicitar su conexión.</Text></View></View>
    <View style={s.notice}><ShieldCheck size={17} color="#6CD0A8"/><Text style={s.noticeText}>Una URL no demuestra propiedad del sitio. Los accesos a productos y pedidos se habilitan solo después de OAuth, API o verificación con permisos del dueño.</Text></View>
    <Text style={s.label}>SELECCIONÁ UNA PLATAFORMA</Text>
    <Pressable onPress={()=>setExpanded(v=>!v)} accessibilityRole="button" accessibilityLabel="Elegir plataforma" style={s.choice}><Store size={18} color="#D42331"/><View style={{flex:1}}><Text style={s.choiceName}>{current.name}</Text><Text style={s.caption}>{current.method}</Text></View><ChevronDown size={19} color={p.muted}/></Pressable>
    {expanded&&<View style={s.options}>{options.map(opt=><Pressable key={opt.value} accessibilityRole="button" onPress={()=>{setSelected(opt.value);setExpanded(false);setError("");setSuccess("");}} style={[s.option,opt.value===selected&&s.activeOption]}>
      <Text style={s.choiceName}>{opt.name}</Text><Text style={s.caption}>{opt.method}</Text>
    </Pressable>)}</View>}
    <View style={s.card}>
      <View style={s.statusLine}><Text style={s.cardTitle}>{current.name}</Text><Text style={[s.pill,{color:isVerified.length?"#66D1A4":"#B2B2BC"}]}>{isVerified.length?"Verificada":isConfigured?"API disponible":"Preparación"}</Text></View>
      <Text style={s.caption}>{current.help}</Text>
      {selected!=="custom" && selected!=="other" && <Text style={s.explainer}>
        {isConfigured?"El proveedor dispone de configuración inicial, pero necesitás autorizar tu cuenta en el portal web.":"Este proveedor todavía requiere configuración del conector oficial antes de sincronizar."}
      </Text>}
      {isVerified.map(v=><View key={v.id} style={s.connected}><CheckCircle2 color="#5CC79F" size={16}/><Text style={s.connectedText}>{v.display_name||display(v.provider)} · autorizada</Text></View>)}
      {selected==="other"&&<View style={s.field}><Text style={s.label}>NOMBRE DE LA PLATAFORMA</Text><TextInput value={customName} onChangeText={setCustomName} style={s.input} maxLength={120} placeholder="Ej.: mi plataforma de ecommerce" placeholderTextColor={p.muted} accessibilityLabel="Nombre de otra plataforma"/></View>}
      {selected==="custom"&&<View style={s.field}><Text style={s.label}>NOMBRE DE TU TIENDA (OPCIONAL)</Text><TextInput value={customName} onChangeText={setCustomName} style={s.input} maxLength={120} placeholder="Ej.: Mi tienda online" placeholderTextColor={p.muted} accessibilityLabel="Nombre de tu tienda"/></View>}
      <View style={s.field}><Text style={s.label}>{requiresUrl?"URL DE LA TIENDA · OBLIGATORIA":"URL DE TU TIENDA · OPCIONAL"}</Text>
        <TextInput value={storeUrl} onChangeText={setStoreUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url"
          style={s.input} placeholder="https://mitienda.com" placeholderTextColor={p.muted} accessibilityLabel="Dirección HTTPS de tu tienda"/>
        <Text style={s.caption}>No pegues tokens, claves, contraseñas ni URLs privadas.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={()=>void register()} disabled={saving} style={[s.action,saving&&{opacity:0.5}]}>
        {saving?<ActivityIndicator color="#FFF"/>:<Text style={s.actionText}>Solicitar vinculación segura</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>setVersion(v=>v+1)} style={s.secondary}>
        <RefreshCw size={15} color={p.fg}/><Text style={s.secondaryText}>Comprobar configuración</Text>
      </Pressable>
      <Text style={s.caption}>La configuración del conector no equivale a una conexión autorizada. Para dar acceso a una tienda real, el titular debe aprobar los permisos en el proveedor correspondiente.</Text>
    </View>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!!success&&<Text style={s.success}>{success}</Text>}
    <View style={s.card}>
      <View style={s.statusLine}><Text style={s.cardTitle}>Conexiones de este negocio</Text><Pressable accessibilityRole="button" accessibilityLabel="Actualizar conexiones" onPress={()=>setVersion(v=>v+1)}><RefreshCw size={16} color={p.muted}/></Pressable></View>
      {busy&&<ActivityIndicator color="#B00F1C"/>}
      {!busy && !connected.length&&!activeRequests.length&&<Text style={s.caption}>Todavía no hay conexiones registradas.</Text>}
      {connected.map(v=><View key={v.id} style={{gap:9,paddingVertical:11,borderTopWidth:0.7,borderColor:p.line}}>
        <View style={s.listItem}><View style={{flex:1}}><Text style={s.choiceName}>{v.display_name||display(v.provider)}</Text>
          <Text style={s.caption}>Estado: {v.status} · Última sincronización: {v.last_synced_at?new Date(v.last_synced_at).toLocaleDateString("es-AR"):"No comprobada"}</Text>
        </View><CheckCircle2 size={17} color={v.status==="connected"?"#60CB9E":p.muted}/></View>
        {canEdit&&<View style={{flexDirection:"row",gap:8}}>
          <Pressable accessibilityRole="button" style={[s.secondary,{flex:1}]} onPress={()=>{setEditingRequest("account:"+v.id);setEditName(v.display_name||display(v.provider));}}>
            <Text style={s.secondaryText}>Renombrar</Text></Pressable>
          <Pressable accessibilityRole="button" style={[s.secondary,{flex:1}]} onPress={()=>disconnect(v)} disabled={workingId===v.id}>
            <Text style={s.secondaryText}>Desconectar</Text></Pressable>
        </View>}
        {editingRequest==="account:"+v.id&&<View style={{gap:8}}>
          <TextInput style={s.input} accessibilityLabel="Nuevo nombre de conexión" value={editName} onChangeText={setEditName} maxLength={120}/>
          <Pressable accessibilityRole="button" style={s.action} onPress={()=>void renameAccount(v)}><Text style={s.actionText}>Guardar nombre</Text></Pressable>
          <Text style={s.caption}>Para cambiar URL o permisos de una cuenta verificada, desconectá y volvé a autorizarla.</Text>
        </View>}
      </View>)}
      {activeRequests.map(v=><View key={v.id} style={{gap:8,paddingVertical:11,borderTopWidth:0.7,borderColor:p.line}}>
        <View style={s.listItem}><View style={{flex:1}}><Text style={s.choiceName}>{v.display_name||display(v.provider)}</Text>
          <Text style={s.caption} numberOfLines={2}>{v.store_url||"Sin URL declarada"} · Pendiente</Text></View>
        </View>
        {canEdit&&<View style={{flexDirection:"row",gap:8}}>
          <Pressable accessibilityRole="button" onPress={()=>beginRequestEdit(v)} style={[s.secondary,{flex:1}]}><Text style={s.secondaryText}>Editar</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>deleteRequest(v)} disabled={workingId===v.id} style={[s.secondary,{flex:1}]}><Text style={s.secondaryText}>Eliminar</Text></Pressable>
        </View>}
        {editingRequest===v.id&&<View style={{gap:8}}>
          <TextInput style={s.input} accessibilityLabel="Nombre de la conexión" value={editName} onChangeText={setEditName} maxLength={120}/>
          <TextInput style={s.input} accessibilityLabel="URL de tienda a corregir" value={editUrl} onChangeText={setEditUrl}
            autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={500}/>
          <Pressable accessibilityRole="button" onPress={()=>void saveRequest(v)} style={s.action}>
            <Text style={s.actionText}>Guardar cambios</Text></Pressable>
        </View>}
      </View>)}
    </View>
    <Text style={s.footer}>La beta Argentina admite solicitudes para sitios de cualquier país, pero una conexión efectiva requiere API compatible, permisos del titular, seguridad y cumplimiento de los términos de cada plataforma.</Text>
  </View>;
}
function styles(p:{panel:string;tile:string;line:string;fg:string;muted:string}){return StyleSheet.create({
  header:{flexDirection:"row",gap:12,alignItems:"flex-start"},title:{fontSize:17,fontWeight:"800",color:p.fg},subtitle:{fontSize:12,lineHeight:19,color:p.muted,marginTop:5},
  notice:{flexDirection:"row",gap:9,padding:12,borderRadius:12,backgroundColor:p.tile,alignItems:"flex-start"},
  noticeText:{flex:1,color:p.muted,fontSize:11,lineHeight:17},label:{fontSize:10,fontWeight:"800",color:p.muted,letterSpacing:1},
  choice:{flexDirection:"row",alignItems:"center",gap:10,padding:13,backgroundColor:p.panel,borderWidth:1,borderColor:p.line,borderRadius:14},
  choiceName:{color:p.fg,fontSize:12,fontWeight:"800"},caption:{color:p.muted,fontSize:11,lineHeight:17},
  options:{gap:5},option:{padding:12,borderRadius:11,backgroundColor:p.tile,gap:4},activeOption:{borderWidth:1,borderColor:"#A9111C"},
  card:{borderWidth:1,borderColor:p.line,backgroundColor:p.panel,borderRadius:17,padding:15,gap:13},
  statusLine:{flexDirection:"row",justifyContent:"space-between",gap:8,alignItems:"center"},cardTitle:{color:p.fg,fontSize:14,fontWeight:"800",flex:1},
  pill:{fontSize:10,fontWeight:"800",backgroundColor:p.tile,overflow:"hidden",padding:7,borderRadius:8},
  explainer:{color:p.muted,fontSize:11,lineHeight:17},field:{gap:7},
  input:{minHeight:46,backgroundColor:p.tile,borderRadius:11,paddingHorizontal:12,borderWidth:1,borderColor:p.line,color:p.fg,fontSize:13},
  connected:{flexDirection:"row",gap:8,alignItems:"center",padding:9,backgroundColor:p.tile,borderRadius:10},
  connectedText:{color:p.fg,fontSize:11,flex:1},
  action:{minHeight:46,backgroundColor:"#A70013",borderRadius:12,alignItems:"center",justifyContent:"center",paddingHorizontal:14},
  actionText:{color:"#FFF",fontSize:12,fontWeight:"800"},
  secondary:{minHeight:43,borderRadius:11,backgroundColor:p.tile,flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center"},
  secondaryText:{fontSize:11,fontWeight:"700",color:p.fg},
  error:{fontSize:11,color:"#D95C69",lineHeight:18},success:{fontSize:11,color:"#62C99D",lineHeight:18},
  listItem:{flexDirection:"row",alignItems:"center",paddingVertical:10,borderTopWidth:0.7,borderColor:p.line,gap:8},
  pending:{fontSize:10,fontWeight:"700",color:"#D8A76B"},footer:{fontSize:11,color:p.muted,lineHeight:17}
})}
