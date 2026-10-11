import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, FileText, Globe2, Package, Plus, RefreshCw, Store, Trash2, Truck, Users } from "lucide-react-native";
import type { Business, Product } from "../lib/data";
import NativeCalendarSelector from "./NativeCalendarSelector";

export type ExtraModule = "notes" | "suppliers" | "purchases" | "online" | "documents" | "operations";
export type Note = { id: string; title: string; body: string; pinned: boolean; createdAt: string; updatedAt: string };
export type Reminder = { id: string; text: string; date: string; done: boolean; createdAt: string };
export type Supplier = { id: string; name: string; contactName: string; phone: string; email: string; website: string; address: string; taxId: string; notes: string; createdAt: string; updatedAt: string };
type Workspace = { freeNotes?: Note[]; notes?: Reminder[]; supplierProfiles?: Supplier[]; onlineConnections?: unknown; onlineOrders?: unknown; smartDocuments?: unknown; internalDocuments?: unknown };
type Props = { client: SupabaseClient; business: Business; products: Product[]; module: ExtraModule; dark: boolean; onOpenInventory: () => void; onOpenWeb: () => void };
const base = "#9F0011";

function key() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12); }
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateWithOffset(d: string, offset: number) {
  const [year, month, day] = d.split("-").map(Number);
  const date = new Date(year, month-1, day+offset);
  return dateKey(date);
}
function counts(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

export default function NativeExtraModules({ client, business, products, module, dark, onOpenInventory, onOpenWeb }: Props) {
  const c = useMemo(() => ({
    bg: dark?"#09090B":"#F5F5F7", panel:dark?"#18181C":"#FFF",
    elevated:dark?"#222227":"#F0F0F4", line:dark?"#34343A":"#E2E2E8",
    fg:dark?"#F8F8FA":"#1A1A1F", muted:dark?"#ABABB5":"#666673"
  }),[dark]);
  const [workspace, setWorkspace] = useState<Workspace>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"bloc" | "tasks" | "calendar">("bloc");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [taskText, setTaskText] = useState("");
  const [day, setDay] = useState(dateKey(new Date()));
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [showSupplierEditor, setShowSupplierEditor] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; kind: string }>>([]);
  const [refresh, setRefresh] = useState(0);
  const styles = useMemo(() => st(c), [c]);

  useEffect(() => {
    let active = true;
    setWorkspace({});
    setError("");
    setLoading(true);
    setShowSupplierEditor(false);
    const fetchData = async () => {
      const { data, error } = await client.from("global_stock_workspaces").select("state").eq("business_id", business.id).maybeSingle();
      if (error) throw error;
      if (!active) return;
      const state = (data?.state && typeof data.state==="object" && !Array.isArray(data.state)) ? data.state as Workspace : {};
      setWorkspace({
        freeNotes:Array.isArray(state.freeNotes)?state.freeNotes:[],
        notes:Array.isArray(state.notes)?state.notes:[],
        supplierProfiles:Array.isArray(state.supplierProfiles)?state.supplierProfiles:[],
        onlineConnections:state.onlineConnections, onlineOrders:state.onlineOrders,
        smartDocuments:state.smartDocuments,internalDocuments:state.internalDocuments
      });
      if (module==="operations") {
        const loc = await client.from("global_stock_locations").select("id,name,kind").eq("business_id",business.id).eq("active",true).order("name");
        if (!loc.error && active) setLocations((loc.data ?? []) as typeof locations);
      }
    };
    void fetchData().catch((err: unknown)=>{if(active)setError(err instanceof Error?err.message:"No se pudo cargar el espacio de trabajo.")})
      .finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  },[client,business.id,module,refresh]);

  const write = useCallback(async (patch: Workspace) => {
    if (saving) return false;
    setSaving(true);
    setError("");
    try {
      // Same atomic top-level workspace merge used by Global Stock web.
      const {error} = await client.rpc("global_stock_merge_workspace_state",{target_business_id:business.id,state_patch:patch});
      if(error) throw error;
      setWorkspace(old=>({...old,...patch}));
      return true;
    } catch(err) {
      setError(err instanceof Error?err.message:"Error al guardar los cambios.");
      return false;
    } finally {setSaving(false)}
  },[business.id,client,saving]);

  const input = (label:string,value:string,onChange:(s:string)=>void,extra?:{multiline?:boolean;keyboardType?:"email-address"|"phone-pad"}) => <View style={{gap:6}}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor={c.muted} value={value} onChangeText={onChange}
      multiline={extra?.multiline} keyboardType={extra?.keyboardType} autoCapitalize={extra?.keyboardType==="email-address"?"none":"sentences"}
      style={[styles.input,extra?.multiline?{minHeight:85,textAlignVertical:"top"}:null]}/>
  </View>;

  const button=(label:string,action:()=>void,secondary=false,disabled=false) => <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled||saving}
    style={({pressed})=>[styles.button, secondary&&{backgroundColor:c.elevated,borderWidth:1,borderColor:c.line},(disabled||saving)&&{opacity:0.45},pressed&&{opacity:0.7}]}
    onPress={action}><Text style={[styles.buttonText,secondary&&{color:c.fg}]}>{label}</Text></Pressable>;

  function infoLine(heading:string,text:string){return <View style={styles.summary}><Text style={styles.fieldLabel}>{heading}</Text><Text style={styles.itemTitle}>{text}</Text></View>}

  const notes = Array.isArray(workspace.freeNotes)?workspace.freeNotes:[];
  const tasks = Array.isArray(workspace.notes)?workspace.notes:[];
  const suppliers=Array.isArray(workspace.supplierProfiles)?workspace.supplierProfiles:[];

  async function addNote() {
    if(!noteTitle.trim() && !noteBody.trim()) {setError("Escribí un título o una nota.");return;}
    const now=new Date().toISOString();
    const note:Note={id:key(),title:noteTitle.trim()||"Sin título",body:noteBody.trim(),pinned:false,createdAt:now,updatedAt:now};
    if(await write({freeNotes:[note,...notes]})){setNoteTitle("");setNoteBody("");}
  }
  async function addTask() {
    if(!taskText.trim()){setError("Escribí el recordatorio.");return}
    const note:Reminder={id:key(),text:taskText.trim(),date:day,done:false,createdAt:new Date().toISOString()};
    if(await write({notes:[note,...tasks]}))setTaskText("");
  }
  async function toggleTask(id:string){
    await write({notes:tasks.map(t=>t.id===id?{...t,done:!t.done}:t)});
  }
  function deleteNote(id:string) {
    Alert.alert("Eliminar nota","¿Querés eliminar esta nota?",[
      {text:"Cancelar",style:"cancel"},
      {text:"Eliminar",style:"destructive",onPress:()=>void write({freeNotes:notes.filter(n=>n.id!==id)})}
    ]);
  }
  function deleteTask(id:string){
    Alert.alert("Eliminar recordatorio","¿Eliminar este recordatorio?",[
      {text:"Cancelar",style:"cancel"},
      {text:"Eliminar",style:"destructive",onPress:()=>void write({notes:tasks.filter(n=>n.id!==id)})}
    ]);
  }
  function resetSupplier(){
    setSupplierName("");setSupplierPhone("");setSupplierEmail("");setSupplierContact("");setSupplierId(null);setShowSupplierEditor(false);
  }
  function editSupplier(s:Supplier){
    setSupplierName(s.name);setSupplierPhone(s.phone);setSupplierEmail(s.email);setSupplierContact(s.contactName);setSupplierId(s.id);setShowSupplierEditor(true);
  }
  async function saveSupplier() {
    if(supplierName.trim().length<2){setError("Ingresá el nombre del proveedor.");return;}
    const now=new Date().toISOString();
    const existing=suppliers.find(s=>s.id===supplierId);
    const profile:Supplier={
      id:existing?.id??key(),name:supplierName.trim(),phone:supplierPhone.trim(),email:supplierEmail.trim(),
      contactName:supplierContact.trim(),website:existing?.website??"",address:existing?.address??"",
      taxId:existing?.taxId??"",notes:existing?.notes??"",createdAt:existing?.createdAt??now,updatedAt:now
    };
    const next=existing?suppliers.map(s=>s.id===existing.id?profile:s):[profile,...suppliers];
    if(await write({supplierProfiles:next}))resetSupplier();
  }
  function deleteSupplier(id:string){
    Alert.alert("Eliminar proveedor","Se quitará del directorio, pero no borrará productos.",[
      {text:"Cancelar",style:"cancel"},
      {text:"Eliminar",style:"destructive",onPress:()=>void write({supplierProfiles:suppliers.filter(s=>s.id!==id)})}
    ]);
  }

  function title(kicker:string,title:string,sub:string){
    return <View style={{gap:7}}><Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text><Text style={styles.caption}>{sub}</Text></View>;
  }

  function agenda(){
    const selectedTasks=tasks.filter(t=>t.date===day);
    return <>{title("ORGANIZACIÓN","Agenda","Bloc de notas, recordatorios y calendario sincronizados con la PC.")}
      <View style={styles.tabs}>
        {([["bloc","Bloc"],["tasks","Recordatorios"],["calendar","Calendario"]] as const).map(([value,label])=>
          <Pressable key={value} onPress={()=>setMode(value)} style={[styles.tab,mode===value&&styles.selected]} accessibilityRole="tab" accessibilityState={{selected:mode===value}}>
            <Text style={[styles.tabText,mode===value&&{color:"#FFF"}]}>{label}</Text>
          </Pressable>)}
      </View>
      {mode==="bloc"?<><View style={styles.card}><Text style={styles.cardTitle}>Nueva nota</Text>
        {input("Título",noteTitle,setNoteTitle)}
        {input("Escribí lo que necesites",noteBody,setNoteBody,{multiline:true})}
        {button(saving?"Guardando…":"Guardar nota",()=>void addNote(),false,!noteTitle.trim()&&!noteBody.trim())}
      </View>
      {notes.length===0?<Text style={styles.caption}>Todavía no hay notas guardadas.</Text>:notes.map(n=><View key={n.id} style={styles.card}>
        <View style={styles.row}><Text style={[styles.cardTitle,{flex:1}]}>{n.title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={"Eliminar "+n.title} onPress={()=>deleteNote(n.id)}><Trash2 size={17} color={c.muted}/></Pressable>
        </View><Text style={styles.caption}>{n.body}</Text><Text style={styles.timestamp}>{new Date(n.updatedAt).toLocaleDateString("es-AR")}</Text>
      </View>)}</>:null}
      {mode!=="bloc"?<><View style={styles.card}>
        <Text style={styles.cardTitle}>{mode==="calendar"?"Calendario de recordatorios":"Organizá tus recordatorios"}</Text>
        <NativeCalendarSelector
          selectedDate={day}
          onSelect={setDay}
          eventDates={tasks.filter(t => !t.done).map(t => t.date)}
          dark={dark}
        />
        {input("Nuevo recordatorio",taskText,setTaskText)}
        {button("Agregar recordatorio",()=>void addTask(),false,!taskText.trim())}
      </View>
      <Text style={styles.cardTitle}>{selectedTasks.length} recordatorios del día</Text>
      {selectedTasks.length===0?<Text style={styles.caption}>No hay recordatorios para la fecha seleccionada.</Text>:selectedTasks.map(t=><View key={t.id} style={[styles.card,styles.row]}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{checked:t.done}} onPress={()=>void toggleTask(t.id)} style={[styles.check,t.done&&{backgroundColor:base,borderColor:base}]}>{t.done?<Check size={15} color="#FFF"/>:null}</Pressable>
        <Text style={[styles.itemTitle,{flex:1},t.done&&{textDecorationLine:"line-through",color:c.muted}]}>{t.text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={"Eliminar "+t.text} onPress={()=>deleteTask(t.id)}><Trash2 size={16} color={c.muted}/></Pressable>
      </View>)}</>:null}
    </>;
  }

  function supplierModule(){
    return <>{title("PROVEEDORES","Directorio de proveedores","Contactos compartidos con la versión web.")}
      {button(showSupplierEditor?"Cancelar":"Añadir proveedor",()=>showSupplierEditor?resetSupplier():setShowSupplierEditor(true),showSupplierEditor)}
      {showSupplierEditor?<View style={styles.card}>
        <Text style={styles.cardTitle}>{supplierId?"Editar proveedor":"Nuevo proveedor"}</Text>
        {input("Empresa o nombre",supplierName,setSupplierName)}
        {input("Persona de contacto",supplierContact,setSupplierContact)}
        {input("Teléfono",supplierPhone,setSupplierPhone,{keyboardType:"phone-pad"})}
        {input("Correo electrónico",supplierEmail,setSupplierEmail,{keyboardType:"email-address"})}
        {button("Guardar proveedor",()=>void saveSupplier(),false,supplierName.trim().length<2)}
      </View>:null}
      {suppliers.length===0?<Text style={styles.caption}>Todavía no hay proveedores registrados.</Text>:suppliers.map(s=><View key={s.id} style={styles.card}>
        <View style={styles.row}><View style={{flex:1,gap:5}}><Text style={styles.cardTitle}>{s.name}</Text><Text style={styles.caption}>{s.contactName||"Sin contacto asignado"}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={"Editar "+s.name} onPress={()=>editSupplier(s)} style={styles.step}><Text style={{color:c.fg,fontSize:11}}>Editar</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={"Eliminar "+s.name} onPress={()=>deleteSupplier(s.id)}><Trash2 size={16} color={c.muted}/></Pressable>
        </View>
        {!!s.phone&&infoLine("Teléfono",s.phone)}
        {!!s.email&&infoLine("Correo",s.email)}
      </View>)}
    </>;
  }

  function purchases(){
    const low=products.filter(p=>p.stock<=p.min_stock).sort((a,b)=>a.stock-b.stock);
    return <>{title("ALMACÉN","Reposición inteligente","Revisá los productos por debajo del stock mínimo registrado.")}
      <View style={styles.card}><View style={styles.row}><Truck size={19} color="#CF1824"/><Text style={styles.cardTitle}>{low.length} productos requieren atención</Text></View>
        <Text style={styles.caption}>Son sugerencias basadas en existencias reales, no órdenes de compra emitidas.</Text>
      </View>
      {low.length===0?<View style={styles.card}><Text style={styles.itemTitle}>No hay alertas de reposición</Text><Text style={styles.caption}>Ajustá los mínimos desde Almacén para generar sugerencias.</Text></View>:
      low.slice(0,100).map(p=><View key={p.id} style={styles.card}>
        <Text style={styles.cardTitle}>{p.name}</Text>
        <View style={styles.row}><Text style={styles.caption}>Disponibles: {p.stock}</Text><Text style={styles.caption}>Mínimo: {p.min_stock}</Text></View>
        <Text style={styles.suggest}>Sugerido: al menos {Math.max(1,Math.ceil(p.min_stock-p.stock+1))} unidades para superar el mínimo</Text>
      </View>)}
      {button("Ir al Almacén",onOpenInventory,true)}
    </>;
  }

  function online(){
    return <>{title("ECOMMERCE","Tienda online","Integraciones de comercio y pedidos asociados a este negocio.")}
      <View style={styles.card}><Globe2 size={22} color="#D01A27"/><Text style={styles.cardTitle}>Conexiones actuales</Text>
        <Text style={styles.itemTitle}>{counts(workspace.onlineConnections)} registros de integración</Text>
        <Text style={styles.caption}>Las credenciales y la vinculación de tiendas requieren la configuración segura de Global Stock web.</Text>
      </View>
      <View style={styles.card}><Text style={styles.cardTitle}>Órdenes sincronizadas</Text><Text style={styles.itemTitle}>{counts(workspace.onlineOrders)} registros</Text></View>
      {button("Administrar conexiones desde la web",onOpenWeb,true)}
    </>;
  }

  function documents(){
    return <>{title("DOCUMENTOS","Comprobantes","Accedé al estado de tus documentos y registros guardados.")}
      <View style={styles.card}><FileText size={22} color="#C70D1C"/><Text style={styles.cardTitle}>Documentos inteligentes</Text>
      <Text style={styles.itemTitle}>{counts(workspace.smartDocuments)} registros</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Comprobantes internos</Text><Text style={styles.itemTitle}>{counts(workspace.internalDocuments)} registros</Text></View>
      <Text style={styles.caption}>La captura OCR, emisión fiscal y descarga de documentos aún se gestionan desde la versión web.</Text>
      {button("Abrir gestor de documentos",onOpenWeb,true)}
    </>;
  }

  function operations(){
    return <>{title("OPERACIÓN","Gestión del negocio","Tus ubicaciones, inventario y estructura operativa.")}
      <View style={styles.card}><Store size={22} color="#CB1220"/><Text style={styles.cardTitle}>{business.name}</Text>
      {infoLine("Moneda",business.base_currency)}
      {infoLine("Idioma",business.locale)}
      {infoLine("Productos activos",String(products.length))}
      {infoLine("Unidades",String(products.reduce((n,p)=>n+p.stock,0)))}
      </View>
      <Text style={styles.cardTitle}>Sucursales y depósitos</Text>
      {locations.length===0?<Text style={styles.caption}>No hay ubicaciones para mostrar.</Text>:locations.map(l=><View style={[styles.card,styles.row]} key={l.id}><Package size={16} color="#BE1623"/><Text style={[styles.itemTitle,{flex:1}]}>{l.name}</Text><Text style={styles.caption}>{l.kind}</Text></View>)}
      {button("Actualizar datos",()=>setRefresh(v=>v+1),true)}
      {button("Administrar sucursales desde la web",onOpenWeb,true)}
    </>;
  }

  return <View style={{gap:15,paddingBottom:35}}>
    {loading ? <View style={styles.loading}><ActivityIndicator color={base}/><Text style={styles.caption}>Cargando datos del negocio...</Text></View> : null}
    {error ? <View style={styles.error}><Text style={{fontSize:12,color:"#E6A675",lineHeight:18}}>{error}</Text>
      {button("Reintentar",()=>setRefresh(v=>v+1),true)}</View>:null}
    {!loading && (module==="notes" ? agenda() :
      module==="suppliers" ? supplierModule() :
      module==="purchases" ? purchases() :
      module==="online" ? online() :
      module==="documents" ? documents() : operations())}
  </View>;
}

function st(c:{panel:string;elevated:string;line:string;fg:string;muted:string}){
 return StyleSheet.create({
   kicker:{fontSize:10,fontWeight:"900",letterSpacing:1.3,color:"#D11D29"},
   title:{fontSize:23,fontWeight:"800",color:c.fg,letterSpacing:-0.5},
   caption:{fontSize:12,lineHeight:19,color:c.muted},
   card:{backgroundColor:c.panel,borderWidth:1,borderColor:c.line,borderRadius:17,padding:15,gap:12},
   cardTitle:{color:c.fg,fontSize:15,fontWeight:"800"},
   itemTitle:{color:c.fg,fontSize:13,fontWeight:"700",lineHeight:19},
   fieldLabel:{color:c.muted,fontWeight:"700",fontSize:11},
   input:{borderWidth:1,borderColor:c.line,backgroundColor:c.elevated,borderRadius:12,paddingHorizontal:12,paddingVertical:11,color:c.fg,fontSize:13,minHeight:44},
   button:{backgroundColor:base,borderRadius:12,paddingHorizontal:14,paddingVertical:13,minHeight:42,alignItems:"center",justifyContent:"center"},
   buttonText:{fontSize:12,color:"#FFF",fontWeight:"800"},
   tabs:{flexDirection:"row",borderRadius:12,backgroundColor:c.elevated,padding:4,gap:3},
   tab:{flex:1,borderRadius:10,paddingVertical:10,alignItems:"center"},
   selected:{backgroundColor:base},
   tabText:{color:c.muted,fontSize:11,fontWeight:"800"},
   row:{flexDirection:"row",alignItems:"center",gap:10},
   step:{padding:9,borderRadius:10,backgroundColor:c.elevated},
   dayText:{color:c.fg,fontWeight:"800",fontSize:13,flex:1,textAlign:"center"},
   check:{width:26,height:26,borderRadius:9,borderWidth:1,borderColor:c.line,alignItems:"center",justifyContent:"center"},
   timestamp:{fontSize:10,color:c.muted},
   summary:{gap:5},
   suggest:{color:"#DC8087",fontWeight:"700",fontSize:12,lineHeight:18},
   loading:{flexDirection:"row",alignItems:"center",gap:10,padding:16},
   error:{borderRadius:13,borderWidth:1,borderColor:"#B67447",padding:12,gap:8}
 });
}
