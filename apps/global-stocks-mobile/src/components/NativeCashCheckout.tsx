import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Check, CircleCheck, CircleAlert, CreditCard, ShieldCheck, Wallet } from "lucide-react-native";
import type { Business, Product, SaleLine } from "../lib/data";

export type CompletedMobileSale = {
 id:string; lines:SaleLine[]; createdAt:string; method:"cash"|"transfer"; total:number;
};
type Props={
 client:SupabaseClient; business:Business; products:Product[]; cart:SaleLine[];
 online:boolean; dark:boolean; onCompleted:(sale:CompletedMobileSale)=>void;
};
function numeric(raw:string){const v=raw.replace(/\./g,"").replace(",",".").trim();return Number(v);}
function money(n:number,c:string){return new Intl.NumberFormat("es-AR",{style:"currency",currency:c,maximumFractionDigits:2}).format(n);}
function newKey(){return "expo-pos-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12);}
export default function NativeCashCheckout({client,business,products,cart,online,dark,onCompleted}:Props){
 const [method,setMethod]=useState<"cash"|"transfer">("cash");
 const [paid,setPaid]=useState(false);
 const [received,setReceived]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [uncertain,setUncertain]=useState(false);
 const operation=useRef<{signature:string;key:string}|null>(null);
 const p=useMemo(()=>dark?{surface:"#19191D",tile:"#25252B",line:"#37373F",text:"#FAFAFD",muted:"#ADADB7"}:
 {surface:"#FFFFFF",tile:"#F2F2F6",line:"#E0E0E6",text:"#18181E",muted:"#666673"},[dark]);
 const st=useMemo(()=>styles(p),[p]);
 const total=cart.reduce((v,item)=>v+item.unit_price*item.quantity,0);
 const tendered=received.trim()?numeric(received):total;
 const validAmount=Number.isFinite(tendered)&&tendered>=total&&tendered>0;
 const signature=JSON.stringify({business:business.id,lines:cart.map(l=>[l.product_id,l.quantity,l.unit_price]),method});
 const changedAfterUncertainty=uncertain&&operation.current?.signature!==signature;
 const valid=cart.length>0&&online&&paid&&
  (method==="transfer"||(method==="cash"&&validAmount))&&!changedAfterUncertainty;

 async function commit(){
  if(busy||!valid||!Number.isFinite(total)||total<=0) return;
  setBusy(true);setError("");
  try{
   const saleLines=cart.map((l)=>{
    const product=products.find(p=>p.id===l.product_id);
    if(!product||!product.active||!product.client_key)throw new Error("Actualizá los productos antes de registrar la venta: hay artículos sin código interno.");
    if(l.quantity<=0||l.quantity>product.stock)throw new Error("Hay cantidades superiores a las existencias. Actualizá el inventario.");
    return {productKey:product.client_key,quantity:l.quantity};
   });
   if(!operation.current||operation.current.signature!==signature)
     operation.current={signature,key:newKey()};
   // Only a merchant-confirmed local payment, NOT a gateway charge.
   // The RPC recalculates server prices/promotions and moves stock atomically.
   const {data,error:rpcError}=await client.rpc("global_stock_record_pos_sale",{
     target_business_id:business.id,
     operation_id:operation.current.key,
     sale_currency:business.base_currency,
     sale_total:total,
     sale_cost_total:0,
     target_customer_id:null,
     sale_lines:saleLines,
     sale_payments:[{method,amount:total}],
     received_amount:method==="cash"?tendered:total
   });
   if(rpcError)throw rpcError;
   const id=String(data??"");
   if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error("No se confirmó el identificador de la venta.");
   const finished:CompletedMobileSale={
     id,lines:cart.map(l=>({...l})),createdAt:new Date().toISOString(),method,total
   };
   operation.current=null;setUncertain(false);setPaid(false);setReceived("");
   onCompleted(finished);
   Alert.alert("Venta registrada","Supabase confirmó la venta y el movimiento de stock. Podés imprimir el comprobante interno NO fiscal desde Punto de venta.");
  }catch(err){
   const msg=err instanceof Error?err.message:"No se pudo registrar la venta.";
   const network=/network|fetch|timeout|abort|connection|socket/i.test(msg);
   if(network)setUncertain(true);
   setError(network?
     "No se pudo confirmar el resultado por la conexión. No inicies otra venta: reintentá con el mismo carrito y verificá el historial si persiste.":
     "No se registró la venta: "+msg+". Si hay promociones o cambió el precio, actualizá o terminá el cobro desde la web.");
  }finally{setBusy(false)}
 }
 function confirm(){
  if(!valid)return;
  Alert.alert("Confirmar cobro",`¿Ya recibiste y verificaste ${money(total,business.base_currency)} por ${method==="cash"?"efectivo":"transferencia bancaria"}? Esta acción registrará la venta y descontará el stock.`,[
    {text:"Cancelar",style:"cancel"},
    {text:"Sí, cobro verificado",onPress:()=>void commit()}
  ]);
 }
 return <View style={st.panel}>
  <View style={st.row}><Wallet size={17} color="#DB1A28"/><Text style={st.title}>Finalizar venta presencial</Text></View>
  <Text style={st.helper}>Registrá ventas reales cobradas en persona. El servidor verifica precios, existencias y evita duplicados. La factura ARCA se emite por separado.</Text>
  <View style={st.row}>
   {([["cash","Efectivo"],["transfer","Transferencia verificada"]] as const).map(([id,label])=>
     <Pressable key={id} accessibilityRole="radio" accessibilityState={{checked:method===id}} onPress={()=>{setMethod(id);setPaid(false);setError("");}}
       style={[st.choice,method===id&&st.chosen]}><Text style={[st.choiceText,method===id&&{color:"#FFF"}]}>{label}</Text></Pressable>)}
  </View>
  {method==="cash"?<View style={{gap:7}}>
   <Text style={st.helper}>Dinero recibido (ARS)</Text>
   <TextInput style={st.input} value={received} onChangeText={setReceived} keyboardType="decimal-pad" placeholder={total.toFixed(2).replace(".",",")} placeholderTextColor={p.muted} accessibilityLabel="Dinero recibido en efectivo"/>
   {validAmount?<Text style={st.change}>Vuelto estimado: {money(Math.max(0,tendered-total),business.base_currency)}</Text>:
   <Text style={st.warning}>El importe recibido debe cubrir el total.</Text>}
  </View>:<View style={st.notice}><CreditCard color="#E1AA6E" size={16}/><Text style={st.noticeText}>Verificá en tu banco que la transferencia se acreditó. Global Stock todavía no verifica pagos bancarios automáticamente.</Text></View>}
  <Pressable accessibilityRole="checkbox" accessibilityState={{checked:paid}} onPress={()=>setPaid(v=>!v)} style={st.row}>
   <View style={[st.checkbox,paid&&{backgroundColor:"#A50011",borderColor:"#A50011"}]}>{paid?<Check color="#FFF" size={15}/>:null}</View>
   <Text style={[st.helper,{flex:1}]}>Confirmo que recibí y verifiqué el cobro. Autorizo registrar la venta y descontar stock.</Text>
  </Pressable>
  {changedAfterUncertainty?<Text style={st.warning}>El carrito cambió después de un error de conexión. Revisá las ventas en la web antes de iniciar otra operación para evitar duplicados.</Text>:null}
  {!online?<Text style={st.warning}>Sin conexión confirmada. Solo podés guardar un presupuesto hasta volver a estar online.</Text>:null}
  {!!error&&<Text accessibilityRole="alert" style={st.warning}>{error}</Text>}
  <Pressable accessibilityRole="button" disabled={!valid||busy} onPress={confirm} style={[st.commit,(!valid||busy)&&{opacity:0.45}]}>
   {busy?<ActivityIndicator color="#FFF"/>:<><ShieldCheck color="#FFF" size={17}/><Text style={st.commitText}>Registrar venta cobrada</Text></>}
  </Pressable>
  <Text style={st.tiny}>No procesa tarjetas ni crea una factura electrónica. Para eso se requiere la integración correspondiente.</Text>
 </View>;
}
function styles(p:{surface:string;tile:string;line:string;text:string;muted:string}){return StyleSheet.create({
 panel:{backgroundColor:p.surface,borderColor:p.line,borderWidth:1,borderRadius:18,padding:15,gap:13},
 row:{flexDirection:"row",gap:10,alignItems:"center"},
 title:{fontSize:14,fontWeight:"800",color:p.text},
 helper:{color:p.muted,fontSize:11.5,lineHeight:18},
 choice:{flex:1,alignItems:"center",justifyContent:"center",paddingVertical:12,borderRadius:11,borderWidth:1,borderColor:p.line,backgroundColor:p.tile},
 chosen:{backgroundColor:"#9F0011",borderColor:"#9F0011"},
 choiceText:{color:p.text,fontSize:10.5,fontWeight:"800",textAlign:"center"},
 input:{minHeight:43,borderWidth:1,borderRadius:11,borderColor:p.line,padding:11,color:p.text,backgroundColor:p.tile},
 change:{fontSize:12,fontWeight:"800",color:"#5CCB9B"},
 warning:{fontSize:11,lineHeight:17,color:"#E1AC7D"},
 notice:{flexDirection:"row",gap:9,padding:11,borderRadius:11,backgroundColor:p.tile},
 noticeText:{flex:1,fontSize:10.5,lineHeight:17,color:p.muted},
 checkbox:{width:24,height:24,borderWidth:1,borderColor:p.line,borderRadius:7,alignItems:"center",justifyContent:"center"},
 commit:{minHeight:47,paddingHorizontal:12,flexDirection:"row",gap:9,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:"#A70014"},
 commitText:{fontWeight:"800",fontSize:12,color:"#FFF"},
 tiny:{fontSize:10,color:p.muted,lineHeight:15}
});}
