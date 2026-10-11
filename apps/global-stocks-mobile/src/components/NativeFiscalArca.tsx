import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CheckCircle2, FileCheck2, LockKeyhole, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react-native";
import type { Business } from "../lib/data";

type FiscalProfile = {
  business_id: string; country: string; legal_name: string; tax_id: string;
  tax_condition: string; fiscal_address: string; point_of_sale: number | null;
  environment: string; enabled: boolean
};
type Props = { client: SupabaseClient; business: Business; userId: string; dark: boolean };
const conditions=[
  ["monotributo","Monotributista"],
  ["responsable_inscripto","Responsable inscripto"],
  ["exento","Exento"],
  ["otro","Otro / consultar con contador"]
];
function cuitValid(value: string): boolean {
  if(!/^\d{11}$/.test(value)) return false;
  const digits=[...value].map(Number), factors=[5,4,3,2,7,6,5,4,3,2];
  const sum=factors.reduce((n,x,i)=>n+x*digits[i],0);
  let check=11-sum%11;
  if(check===11)check=0;
  if(check===10)check=9;
  return digits[10]===check;
}
export default function NativeFiscalArca({client,business,userId,dark}:Props){
  const [profile,setProfile]=useState<FiscalProfile|null>(null);
  const [legalName,setLegalName]=useState("");
  const [taxId,setTaxId]=useState("");
  const [taxCondition,setTaxCondition]=useState("");
  const [address,setAddress]=useState("");
  const [pointOfSale,setPointOfSale]=useState("");
  const [chooseTax,setChooseTax]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [configured,setConfigured]=useState<boolean|null>(null);
  const [role,setRole]=useState("");
  const [version,setVersion]=useState(0);
  const canEdit=role==="owner"||role==="admin";
  const p=useMemo(()=>dark?{panel:"#19191E",tile:"#24242A",line:"#37373C",fg:"#F6F6F9",muted:"#ACADB7"}:
    {panel:"#FFF",tile:"#F3F3F5",line:"#DEDEE5",fg:"#17171C",muted:"#707078"},[dark]);
  const st=useMemo(()=>styles(p),[p]);

  useEffect(()=>{
    let live=true;
    setError("");setSuccess("");setLoading(true);setConfigured(null);
    void (async()=>{
      const [stored,member,provider]=await Promise.all([
        client.from("global_stock_fiscal_profiles")
          .select("business_id,country,legal_name,tax_id,tax_condition,fiscal_address,point_of_sale,environment,enabled")
          .eq("business_id",business.id).maybeSingle(),
        client.from("global_stock_members").select("role").eq("business_id",business.id).eq("user_id",userId).eq("active",true).maybeSingle(),
        fetch("https://globalstocks.vercel.app/api/fiscal/status",{headers:{Accept:"application/json"}})
          .then(v=>v.ok?v.json():null).catch(()=>null)
      ]);
      if(!live)return;
      if(stored.error)throw stored.error;
      const current=stored.data as FiscalProfile|null;
      setProfile(current);
      setRole(String(member.data?.role??""));
      setLegalName(current?.legal_name??"");
      setTaxId(current?.tax_id??"");
      setTaxCondition(current?.tax_condition??"");
      setAddress(current?.fiscal_address??"");
      setPointOfSale(current?.point_of_sale?String(current.point_of_sale):"");
      const state=provider as {configured?:boolean}|null;
      setConfigured(typeof state?.configured==="boolean"?state.configured:null);
    })().catch(err=>{if(live)setError(err instanceof Error?err.message:"No se pudo cargar la configuración fiscal.");})
      .finally(()=>{if(live)setLoading(false)});
    return()=>{live=false};
  },[client,business.id,userId,version]);
  const hasMinimum=Boolean(legalName.trim()&&cuitValid(taxId)&&taxCondition&&address.trim()&&
    Number.isInteger(Number(pointOfSale))&&Number(pointOfSale)>=1&&Number(pointOfSale)<=99999);
  const readiness=[
    ["Datos fiscales completos",hasMinimum],
    ["Proveedor fiscal configurado en el servidor",configured===true],
    ["Certificado, mandato y servicios ARCA del titular",false],
    ["Pruebas de homologación aprobadas",false],
    ["Autorización para emitir en producción",false]
  ];
  async function save(){
    if(!canEdit||saving||loading)return;
    setError("");setSuccess("");
    if(!hasMinimum){setError("Completá razón social, CUIT válido, condición fiscal, domicilio y punto de venta (1 a 99999).");return}
    setSaving(true);
    try{
      const body={
        business_id:business.id,country:"AR",legal_name:legalName.trim(),
        tax_id:taxId.trim(),tax_condition:taxCondition,
        fiscal_address:address.trim(),point_of_sale:Number(pointOfSale),
        provider:"arca",environment:profile?.environment==="production"?"production":"testing",
        enabled:profile?.enabled===true
      };
      const {data,error:saveError}=await client.from("global_stock_fiscal_profiles")
        .upsert(body,{onConflict:"business_id"})
        .select("business_id,country,legal_name,tax_id,tax_condition,fiscal_address,point_of_sale,environment,enabled")
        .single();
      if(saveError)throw saveError;
      setProfile(data as FiscalProfile);
      setSuccess("Datos fiscales guardados. Todavía no se habilitó la emisión de comprobantes.");
    }catch(err){setError(err instanceof Error?err.message:"No se pudo guardar el perfil fiscal.");}
    finally{setSaving(false)}
  }
  function field(label:string,value:string,onChange:(x:string)=>void,keyboardType:"default"|"numeric"="default"){
    return <View style={{gap:6}}><Text style={st.label}>{label}</Text>
      <TextInput accessibilityLabel={label} style={st.input} value={value} onChangeText={onChange} keyboardType={keyboardType}
        editable={canEdit&&!saving} placeholder={label} placeholderTextColor={p.muted} autoCapitalize={keyboardType==="numeric"?"none":"sentences"}/></View>;
  }
  return <View style={{gap:15}}>
    <View style={st.top}><FileCheck2 size={22} color="#D01B2A"/><View style={{flex:1}}><Text style={st.title}>ARCA · Facturación argentina</Text><Text style={st.caption}>Prepará los datos para emitir comprobantes electrónicos oficiales cuando se complete la integración.</Text></View></View>
    <View style={st.notice}><ShieldAlert size={18} color={p.muted}/><Text style={st.noticeText}>
      La beta NO emite facturas ni CAE. Un comprobante interno o una simulación no reemplazan una factura fiscal. No pegues clave fiscal, certificados, tokens ni contraseñas acá.
    </Text></View>
    {loading?<ActivityIndicator color="#A90815"/>:<View style={st.card}>
      <Text style={st.cardTitle}>Perfil del contribuyente</Text>
      {field("Razón social o nombre fiscal",legalName,setLegalName)}
      {field("CUIT (11 dígitos)",taxId,v=>setTaxId(v.replace(/\D/g,"").slice(0,11)),"numeric")}
      {!!taxId && !cuitValid(taxId) && <Text style={st.warning}>Revisá el CUIT: el dígito verificador no coincide.</Text>}
      <Text style={st.label}>CONDICIÓN FISCAL</Text>
      <Pressable accessibilityRole="button" onPress={()=>setChooseTax(v=>!v)} style={st.selector}><Text style={st.text}>{conditions.find(x=>x[0]===taxCondition)?.[1]??"Seleccionar condición"}</Text></Pressable>
      {chooseTax&&conditions.map(([value,label])=><Pressable accessibilityRole="button" key={value} style={st.option} onPress={()=>{setTaxCondition(value);setChooseTax(false);}}><Text style={st.text}>{label}</Text></Pressable>)}
      {field("Domicilio fiscal",address,setAddress)}
      {field("Punto de venta ARCA",pointOfSale,v=>setPointOfSale(v.replace(/\D/g,"").slice(0,5)),"numeric")}
      <Text style={st.caption}>El punto de venta debe corresponder a uno habilitado oficialmente para el contribuyente.</Text>
      {canEdit?<Pressable accessibilityRole="button" disabled={saving} onPress={()=>void save()} style={[st.save,saving&&{opacity:0.5}]}>
        {saving?<ActivityIndicator color="#FFF"/>:<Text style={st.saveText}>Guardar configuración fiscal</Text>}
      </Pressable>:<Text style={st.caption}>Solo el dueño o un administrador puede editar este perfil.</Text>}
    </View>}
    {!!error&&<Text accessibilityRole="alert" style={st.warning}>{error}</Text>}
    {!!success&&<Text style={st.success}>{success}</Text>}
    <View style={st.card}>
      <View style={st.heading}><Text style={st.cardTitle}>Estado de preparación</Text><Pressable accessibilityRole="button" accessibilityLabel="Actualizar estado fiscal" onPress={()=>setVersion(v=>v+1)}><RefreshCw size={16} color={p.muted}/></Pressable></View>
      {readiness.map(([label,ready],i)=><View style={st.row} key={String(label)}>
        {ready?<CheckCircle2 color="#55C99D" size={16}/>:<LockKeyhole color={p.muted} size={16}/>}
        <Text style={[st.text,{flex:1}]}>{label}</Text>
        <Text style={[st.small,{color:ready?"#5FCF9F":p.muted}]}>{ready?"Verificado":i===1&&configured===null?"Sin confirmar":"Pendiente"}</Text>
      </View>)}
      <Text style={st.caption}>Entorno registrado: {profile?.environment==="production"?"Producción (perfil existente)":"Pruebas"}. Guardar datos no activa la emisión automática.</Text>
    </View>
    <Text style={st.footer}>La condición fiscal, tipo de comprobante, impuestos, jurisdicción, punto de venta, autorizaciones y obligaciones del contribuyente deben confirmarse con un contador matriculado. Esta pantalla no certifica cumplimiento ARCA.</Text>
  </View>;
}
function styles(p:{panel:string;tile:string;line:string;fg:string;muted:string}){return StyleSheet.create({
  top:{flexDirection:"row",alignItems:"flex-start",gap:10},
  title:{fontSize:17,fontWeight:"800",color:p.fg},caption:{fontSize:11,lineHeight:17,color:p.muted},
  notice:{padding:12,backgroundColor:p.tile,borderRadius:12,flexDirection:"row",gap:10,alignItems:"flex-start"},
  noticeText:{flex:1,color:p.muted,fontSize:11,lineHeight:18},
  card:{padding:15,gap:13,borderWidth:1,borderRadius:17,borderColor:p.line,backgroundColor:p.panel},
  cardTitle:{color:p.fg,fontSize:14,fontWeight:"800"},label:{fontSize:10,fontWeight:"800",color:p.muted,letterSpacing:0.6},
  input:{minHeight:44,paddingHorizontal:12,backgroundColor:p.tile,borderRadius:11,borderWidth:1,borderColor:p.line,color:p.fg,fontSize:12},
  selector:{paddingHorizontal:12,paddingVertical:13,backgroundColor:p.tile,borderRadius:11,borderWidth:1,borderColor:p.line},
  option:{paddingHorizontal:12,paddingVertical:12,borderRadius:9,backgroundColor:p.tile},
  text:{color:p.fg,fontSize:11.5,lineHeight:18},small:{fontSize:9.5,fontWeight:"700"},
  save:{backgroundColor:"#A70012",minHeight:46,borderRadius:11,alignItems:"center",justifyContent:"center"},
  saveText:{color:"#FFF",fontSize:12,fontWeight:"800"},
  warning:{color:"#D65B65",fontSize:11,lineHeight:17},success:{color:"#57CDA0",fontSize:11,lineHeight:17},
  row:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:7,borderBottomWidth:0.5,borderColor:p.line},
  heading:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  footer:{fontSize:11,lineHeight:18,color:p.muted}
})}
