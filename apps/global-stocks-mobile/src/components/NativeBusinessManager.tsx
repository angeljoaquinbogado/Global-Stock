import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Building2, MapPin, Plus, RefreshCw, Store, Trash2, Truck, CheckCircle2 } from "lucide-react-native";
import { createBusiness, type Business, type BusinessKind, type Product } from "../lib/data";

type Branch = { id:string;business_id:string;name:string;kind:string;address:string|null;active:boolean };
type Level = { location_id:string;product_id:string;on_hand:number;reserved:number };
type Props = {
  client:SupabaseClient;business:Business;businesses:Business[];
  userId:string;products:Product[];dark:boolean;
  onBusiness:(item:Business)=>void;onReload:()=>Promise<void>;
};
const kinds: Array<{ value:BusinessKind;label:string }> = [
  {value:"retail",label:"Comercio"}, {value:"wholesale",label:"Mayorista"},
  {value:"restaurant",label:"Gastronomía"}, {value:"ecommerce",label:"Tienda online"},
  {value:"industry",label:"Taller o fábrica"}, {value:"services",label:"Servicios"},
  {value:"other",label:"Otro"}
];
export default function NativeBusinessManager({client,business,businesses,userId,products,dark,onBusiness,onReload}:Props){
  const [branches,setBranches]=useState<Branch[]>([]);
  const [levels,setLevels]=useState<Level[]>([]);
  const [role,setRole]=useState("viewer");
  const [selectedLocation,setSelectedLocation]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [branchName,setBranchName]=useState("");
  const [branchAddress,setBranchAddress]=useState("");
  const [branchKind,setBranchKind]=useState("store");
  const [businessName,setBusinessName]=useState("");
  const [newBusinessName,setNewBusinessName]=useState("");
  const [newBusinessType,setNewBusinessType]=useState<BusinessKind>("retail");
  const [newBusinessForm,setNewBusinessForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [revision,setRevision]=useState(0);
  const p=useMemo(()=>dark?{fg:"#F5F5F7",muted:"#ABABB6",tile:"#19191E",field:"#24242A",border:"#37373C"}:
    {fg:"#17171C",muted:"#6C6C78",tile:"#FFF",field:"#F3F3F5",border:"#E1E1E7"},[dark]);
  const canEdit=role==="owner"||role==="admin";
  const locations = branches.filter(x=>x.active);
  const refresh=useCallback(async()=>{
    const [locations,stock,membership]=await Promise.all([
      client.from("global_stock_locations")
        .select("id,business_id,name,kind,address,active")
        .eq("business_id",business.id).order("created_at",{ascending:true}).limit(200),
      client.from("global_stock_inventory_levels")
        .select("location_id,product_id,on_hand,reserved")
        .eq("business_id",business.id).range(0,9999),
      client.from("global_stock_members")
        .select("role").eq("business_id",business.id).eq("user_id",userId).eq("active",true).maybeSingle()
    ]);
    if(locations.error)throw locations.error;
    if(stock.error)throw stock.error;
    if((stock.data??[]).length===10000)throw new Error("Hay demasiados movimientos para resumirlos de forma completa.");
    setBranches((locations.data??[]) as Branch[]);
    setLevels((stock.data??[]) as Level[]);
    setRole(String(membership.data?.role|| (businesses.find(b=>b.id===business.id)?"viewer":"viewer")));
  },[client,business.id,businesses,userId]);
  useEffect(()=>{let live=true;setLoading(true);setError("");setSuccess("");setBusinessName(business.name);
    void refresh().catch(e=>{if(live)setError(e instanceof Error?e.message:"No pudimos cargar los locales.");})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false};
  },[refresh,revision,business.name]);
  const action=(label:string,run:()=>void,primary=false,disabled=false)=><Pressable accessibilityRole="button"
    disabled={saving||disabled} onPress={run} style={{
      backgroundColor:primary?"#A90017":p.field,
      borderRadius:11,paddingHorizontal:13,paddingVertical:12,minHeight:43,
      opacity:saving||disabled?.5:1,alignItems:"center",justifyContent:"center"}}>
    <Text style={{color:primary?"#FFF":p.fg,fontWeight:"700",fontSize:12}}>{label}</Text>
  </Pressable>;
  const input=(label:string,value:string,change:(value:string)=>void,limit=120)=><View style={{gap:5}}>
    <Text style={{color:p.muted,fontSize:11,fontWeight:"700"}}>{label}</Text>
    <TextInput accessibilityLabel={label} style={{borderWidth:1,borderColor:p.border,
      backgroundColor:p.field,borderRadius:10,padding:12,color:p.fg,fontSize:13,minHeight:44}}
      value={value} onChangeText={change} editable={!saving} maxLength={limit}
      placeholder={label} placeholderTextColor={p.muted}/>
  </View>;
  async function run(task:()=>Promise<void>,message:string){
    if(saving)return;setSaving(true);setError("");setSuccess("");
    try{await task();setSuccess(message);setRevision(i=>i+1);}
    catch(e){setError(e instanceof Error?e.message:"No pudimos guardar el cambio.");}
    finally{setSaving(false);}
  }
  function openEditor(item?:Branch){
    setEditing(item?.id||"new");setBranchName(item?.name||"");setBranchAddress(item?.address||"");setBranchKind(item?.kind||"store");setError("");setSuccess("");
  }
  function saveBranch(){
    const name=branchName.trim(),address=branchAddress.trim();
    if(name.length<2||name.length>100||address.length>220){setError("Revisá el nombre y la dirección del local.");return;}
    void run(async()=>{
      const payload={name,address:address||null,kind:branchKind};
      const req=editing==="new"
        ?client.from("global_stock_locations").insert({...payload,business_id:business.id,active:true})
        :client.from("global_stock_locations").update(payload).eq("business_id",business.id).eq("id",editing);
      const {error}=await req;
      if(error)throw error;
      setEditing(null);
    },editing==="new"?"Local creado.":"Local actualizado.");
  }
  function archiveBranch(item:Branch){
    Alert.alert("Archivar local",`¿Archivar "${item.name}"? Se conserva el historial. Primero debe quedar sin stock ni reservas y tiene que existir otro local activo.`,[
      {text:"Cancelar",style:"cancel"},
      {text:"Archivar",style:"destructive",onPress:()=>void run(async()=>{
        const {error}=await client.rpc("global_stock_archive_location",{
          target_business_id:business.id,target_location_id:item.id
        });
        if(error)throw error;
        if(selectedLocation===item.id)setSelectedLocation(null);
      },"Local archivado sin borrar ventas antiguas.")}
    ]);
  }
  function createAnotherBusiness(){
    if(newBusinessName.trim().length<2){setError("Ingresá el nombre del negocio.");return;}
    void run(async()=>{
      const b=await createBusiness(client,userId,newBusinessName,newBusinessType);
      await onReload();
      onBusiness(b);
      setNewBusinessName("");setNewBusinessForm(false);
    },"Negocio creado.");
  }
  function saveBusinessName(){
    if(businessName.trim().length<2||businessName.trim().length>100){setError("Nombre inválido.");return;}
    void run(async()=>{
      const {data,error}=await client.from("global_stock_businesses")
        .update({name:businessName.trim()}).eq("id",business.id).select("*").single();
      if(error)throw error;
      await onReload();
      onBusiness(data as Business);
    },"Nombre actualizado en celular y PC.");
  }
  const card={backgroundColor:p.tile,borderColor:p.border,borderWidth:1,borderRadius:16,padding:15,gap:12} as const;
  return <View style={{gap:16,paddingBottom:20}}>
    <View style={{gap:5}}>
      <Text style={{fontSize:10,fontWeight:"800",color:"#C91B2C",letterSpacing:1.2}}>ADMINISTRACIÓN</Text>
      <Text style={{fontSize:24,fontWeight:"800",color:p.fg}}>Negocios y locales</Text>
      <Text style={{fontSize:12,lineHeight:19,color:p.muted}}>Cada negocio mantiene sus datos separados. Cada sucursal tiene existencias propias.</Text>
    </View>
    {!!error&&<Text accessibilityRole="alert" style={{color:"#DB606B",fontSize:12}}>{error}</Text>}
    {!!success&&<Text style={{color:"#69CB9C",fontSize:12}}>{success}</Text>}
    {loading?<ActivityIndicator color="#B91B29"/>:null}
    <View style={card}>
      <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
        <Building2 size={19} color="#CD1B2C"/><Text style={{fontSize:15,fontWeight:"800",color:p.fg}}>Mis negocios</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Actualizar negocios" onPress={()=>void onReload().then(()=>setRevision(x=>x+1))}>
          <RefreshCw size={17} color={p.muted}/>
        </Pressable>
      </View>
      {businesses.map(b=><Pressable key={b.id} accessibilityRole="button" onPress={()=>onBusiness(b)}
        style={{flexDirection:"row",gap:11,padding:11,borderRadius:11,backgroundColor:p.field,alignItems:"center"}}>
        <Store size={18} color={b.id===business.id?"#D62938":p.muted}/>
        <Text numberOfLines={1} style={{flex:1,fontSize:13,fontWeight:"700",color:p.fg}}>{b.name}</Text>
        {b.id===business.id?<CheckCircle2 size={17} color="#64C99F"/>:
          <Text style={{fontSize:11,color:p.muted}}>Abrir</Text>}
      </Pressable>)}
      {canEdit&&<>{input("Nombre de este negocio",businessName,setBusinessName,100)}
        {action("Guardar nombre",saveBusinessName,false,saving||businessName.trim()===business.name)}</>}
      {action(newBusinessForm?"Cerrar nuevo negocio":"+ Agregar otro negocio",()=>setNewBusinessForm(!newBusinessForm))}
      {newBusinessForm&&<View style={{gap:10}}>
        {input("Nombre del nuevo negocio",newBusinessName,setNewBusinessName,100)}
        <View style={{flexDirection:"row",gap:6,flexWrap:"wrap"}}>
          {kinds.map(k=><Pressable key={k.value} accessibilityRole="button"
            accessibilityState={{selected:newBusinessType===k.value}}
            onPress={()=>setNewBusinessType(k.value)}
            style={{padding:9,backgroundColor:newBusinessType===k.value?"#A20017":p.field,borderRadius:10}}>
            <Text style={{color:newBusinessType===k.value?"#FFF":p.fg,fontSize:11}}>{k.label}</Text>
          </Pressable>)}
        </View>
        {action("Crear negocio",createAnotherBusiness,true)}
      </View>}
    </View>
    <View style={card}>
      <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
        <MapPin size={19} color="#CD1B2C"/><Text style={{fontSize:15,fontWeight:"800",color:p.fg,flex:1}}>Sucursales y depósitos</Text>
        <Text style={{color:p.muted,fontSize:11}}>{locations.length} activos</Text>
      </View>
      {locations.map(branch=>{
        const stock=levels.filter(x=>x.location_id===branch.id);
        const units=stock.reduce((sum,x)=>sum+Number(x.on_hand||0),0);
        const reserved=stock.reduce((sum,x)=>sum+Number(x.reserved||0),0);
        const expanded=selectedLocation===branch.id;
        return <View key={branch.id} style={{backgroundColor:p.field,borderRadius:12,padding:12,gap:10}}>
          <Pressable accessibilityRole="button" accessibilityLabel={"Ver stock de "+branch.name}
            onPress={()=>setSelectedLocation(expanded?null:branch.id)}
            style={{flexDirection:"row",alignItems:"center",gap:10}}>
            <Store size={18} color="#D52B3B"/>
            <View style={{flex:1,gap:3}}>
              <Text style={{fontSize:13,color:p.fg,fontWeight:"800"}}>{branch.name}</Text>
              <Text style={{color:p.muted,fontSize:11}}>{branch.address||"Sin dirección"} · {units} unidades · {reserved} reservadas</Text>
            </View>
            <Text style={{color:p.muted,fontSize:11}}>{expanded?"Ocultar":"Ver"}</Text>
          </Pressable>
          {expanded&&<View style={{gap:7}}>
            {stock.length?stock.slice(0,70).map(level=>{
              const product=products.find(x=>x.id===level.product_id);
              return <View key={level.product_id} style={{flexDirection:"row",justifyContent:"space-between",gap:8}}>
                <Text style={{color:p.muted,fontSize:11,flex:1}} numberOfLines={1}>{product?.name||"Producto "+level.product_id.slice(0,8)}</Text>
                <Text style={{color:p.fg,fontSize:11,fontWeight:"700"}}>{level.on_hand} · res. {level.reserved}</Text>
              </View>;
            }):<Text style={{fontSize:11,color:p.muted}}>Sin existencias asignadas a esta sucursal.</Text>}
            {stock.length>70&&<Text style={{color:p.muted,fontSize:11}}>Mostrando los primeros 70 productos.</Text>}
            {canEdit&&<View style={{flexDirection:"row",gap:8}}>
              <View style={{flex:1}}>{action("Editar",()=>openEditor(branch))}</View>
              <View style={{flex:1}}>{action("Archivar",()=>archiveBranch(branch))}</View>
            </View>}
          </View>}
        </View>;
      })}
      {canEdit&&action(editing==="new"?"Cancelar alta":"+ Agregar local",()=>editing==="new"?setEditing(null):openEditor())}
      {editing&&<View style={{gap:10,borderTopWidth:1,borderColor:p.border,paddingTop:12}}>
        {input("Nombre del local",branchName,setBranchName,100)}
        {input("Dirección (opcional)",branchAddress,setBranchAddress,220)}
        <View style={{flexDirection:"row",gap:8}}>
          {([["store","Local"],["warehouse","Depósito"]] as const).map(([v,label])=>
          <Pressable key={v} accessibilityRole="button" accessibilityState={{selected:branchKind===v}}
            onPress={()=>setBranchKind(v)}
            style={{backgroundColor:branchKind===v?"#A50016":p.field,padding:12,borderRadius:9}}>
            <Text style={{color:branchKind===v?"#FFF":p.fg,fontSize:12}}>{label}</Text>
          </Pressable>)}
        </View>
        {action("Guardar local",saveBranch,true)}
        {action("Cancelar",()=>setEditing(null))}
      </View>}
      {!canEdit&&<Text style={{fontSize:11,color:p.muted}}>Solo propietarios y administradores pueden modificar locales.</Text>}
      <Text style={{fontSize:11,lineHeight:17,color:p.muted}}>Los movimientos y las existencias por local se conservan al archivar. Para pasar mercadería entre locales, utilizá una transferencia de inventario; no se suman unidades nuevas automáticamente.</Text>
      {action("Actualizar existencias",()=>setRevision(x=>x+1))}
    </View>
  </View>;
}
