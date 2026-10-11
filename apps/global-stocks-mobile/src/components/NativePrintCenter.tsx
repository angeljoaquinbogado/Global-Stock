import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Barcode, FileCheck2, FileText, Printer, RefreshCw, Share2, Tag } from "lucide-react-native";
import type { Business, Product, SaleDraft, SaleLine } from "../lib/data";
import { SUPPORT_EMAIL, supportEmailUrl } from "../lib/support";

type FiscalDocument = {
  id: string; kind: string; letter: string | null; status: string; local_reference: string;
  total_amount: number; created_at: string; issued_at: string | null; authorization_code: string | null;
  voucher_number: number | null; point_of_sale: number | null; qr_url: string | null;
  customer_name: string; currency: string;
};
type Props = {
  client: SupabaseClient; business: Business; products: Product[]; drafts: SaleDraft[];
  cart: SaleLine[]; dark: boolean; onFiscal: () => void; embedded?: boolean;
};
type Tab = "receipt" | "labels" | "fiscal";
const CODE39: Record<string,string> = {
 "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw",
 "5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn",
 "A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn",
 "F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn",
 "K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn",
 "P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn",
 "U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn",
 "Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn",
 "$":"nwnwnwnnn","/":"nwnwnnnwn","+":"nwnnnwnwn","%":"nnnwnwnwn","*":"nwnnwnwnn"
};
function escapeHtml(s: unknown): string {
 return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
}
function barcode39(input: string) {
 const code=input.trim().toUpperCase();
 if (!code || code.length > 48 || [...code].some(v=>!CODE39[v]||v==="*"))
  return "";
 const encoded=`*${code}*`, rectangles:string[]=[];
 let x=10;
 for(const char of encoded) {
  const p=CODE39[char];
  for(let i=0;i<9;i++){
   const width=p[i]==="w"?3:1;
   if(i%2===0)rectangles.push(`<rect x="${x}" y="5" width="${width}" height="52" fill="#000"/>`);
   x+=width;
  }
  x+=2;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x+10} 65" width="100%" height="66" role="img" aria-label="Código de barras Code 39">${rectangles.join("")}</svg>`;
}
function money(n:number,currency:string){return new Intl.NumberFormat("es-AR",{style:"currency",currency,maximumFractionDigits:2}).format(n);}
function baseHtml(title:string,body:string){
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
 @page{margin:12mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:12px;color:#171717;margin:0}
 .header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #9f0011;padding-bottom:13px;margin-bottom:15px}
 .brand{font-weight:900;font-size:21px}.small{font-size:10px;color:#555}.warning{border:1px solid #9f0011;background:#fff7f8;border-radius:7px;padding:10px;margin:13px 0;font-weight:800}
 .field{margin:7px 0}.line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #ddd}.total{font-size:19px;font-weight:900;text-align:right;margin:18px 0}
 .label{display:inline-block;border:1px solid #ccc;border-radius:8px;margin:6px;padding:10px;width:260px;vertical-align:top;text-align:center;break-inside:avoid}
 .prod{font-size:13px;font-weight:800}.code{font-size:10px;letter-spacing:1.2px;margin-top:2px}
 </style><title>${escapeHtml(title)}</title></head><body>
 <div class="header"><div class="brand">Global Stock</div><div class="small">Argentina · Documento generado por el negocio</div></div>${body}</body></html>`;
}
function pendingHtml(business:Business,items:SaleLine[],ref:string,createdAt:string){
 const amount=items.reduce((n,l)=>n+l.quantity*l.unit_price,0);
 return baseHtml("Presupuesto no fiscal",`<h2>PRESUPUESTO / PEDIDO PENDIENTE</h2>
 <div class="warning">DOCUMENTO INTERNO NO FISCAL. NO ES FACTURA, TICKET FISCAL NI COMPROBANTE DE PAGO. NO ACREDITA COBRO NI AUTORIZACIÓN ARCA.</div>
 <div class="field"><strong>Negocio:</strong> ${escapeHtml(business.name)}</div>
 <div class="field"><strong>Referencia:</strong> ${escapeHtml(ref)}</div>
 <div class="field"><strong>Generado:</strong> ${escapeHtml(new Date(createdAt).toLocaleString("es-AR"))}</div>
 ${items.map(l=>`<div class="line"><span>${escapeHtml(l.name)}<br/><span class="small">${escapeHtml(l.quantity)} × ${escapeHtml(money(l.unit_price,business.base_currency))}</span></span><strong>${escapeHtml(money(l.quantity*l.unit_price,business.base_currency))}</strong></div>`).join("")}
 <div class="total">Total estimado: ${escapeHtml(money(amount,business.base_currency))}</div>
 <p class="small">El stock y los precios deben verificarse al confirmar la venta. Este documento no modifica existencias.</p>`);
}
function productLabels(products:Product[],business:Business){
 return baseHtml("Etiquetas de productos",`<h2>ETIQUETAS DE PRODUCTOS</h2>
 <p class="small">Códigos compatibles con Code 39 para lectores configurados para ese estándar. Verificá el código físico de cada producto antes de imprimir.</p>
 ${products.map(p=>{const code=(p.barcode||p.sku||"").trim().toUpperCase();const graphic=barcode39(code);return `<div class="label">
 <div class="prod">${escapeHtml(p.name)}</div><p style="margin:5px 0;font-size:16px;font-weight:900">${escapeHtml(money(p.price,business.base_currency))}</p>
 ${graphic||"<p class='small'>Producto sin código Code 39 compatible</p>"}
 <div class="code">${escapeHtml(code||"SIN CÓDIGO")}</div><div class="small">${escapeHtml(business.name)}</div></div>`}).join("")}`);
}
function fiscalHtml(business:Business,doc:FiscalDocument){
 const authorized=doc.status==="authorized"&&!!doc.authorization_code&&!!doc.voucher_number&&!!doc.point_of_sale&&!!doc.issued_at;
 const heading=authorized?"COMPROBANTE FISCAL AUTORIZADO":"COPIA DE DOCUMENTO NO AUTORIZADO";
 return baseHtml(heading,`<h2>${heading}</h2>
 ${!authorized?"<div class='warning'>SIN VALIDEZ FISCAL · NO ENTREGAR COMO FACTURA.</div>":""}
 <div class="field"><b>Negocio:</b> ${escapeHtml(business.name)}</div>
 <div class="field"><b>Tipo:</b> ${escapeHtml(doc.kind)} ${escapeHtml(doc.letter??"")}</div>
 <div class="field"><b>Cliente:</b> ${escapeHtml(doc.customer_name||"Consumidor final")}</div>
 <div class="field"><b>Referencia:</b> ${escapeHtml(doc.local_reference)}</div>
 ${authorized?`<div class="field"><b>Punto de venta:</b> ${escapeHtml(doc.point_of_sale)} · <b>Número:</b> ${escapeHtml(doc.voucher_number)}</div>
 <div class="field"><b>CAE:</b> ${escapeHtml(doc.authorization_code)}</div>
 <div class="field"><b>Fecha de emisión:</b> ${escapeHtml(new Date(doc.issued_at!).toLocaleString("es-AR"))}</div>`:""}
 <div class="total">Total: ${escapeHtml(money(Number(doc.total_amount)||0,doc.currency||"ARS"))}</div>
 ${authorized&&doc.qr_url?.startsWith("https://")?`<div class="field"><b>Enlace de verificación:</b> ${escapeHtml(doc.qr_url)}</div>`:""}
 <p class="small">Reproducción de datos almacenados. Para entrega fiscal definitiva, el formato, el QR fiscal y la información obligatoria deben verificarse contra las reglas de ARCA.</p>`);
}

export default function NativePrintCenter({ client,business,products,drafts,cart,dark,onFiscal,embedded }:Props){
 const [tab,setTab]=useState<Tab>(embedded?"receipt":"receipt");
 const [selected,setSelected]=useState<string[]>([]);
 const [documentList,setDocumentList]=useState<FiscalDocument[]>([]);
 const [loading,setLoading]=useState(false);
 const [working,setWorking]=useState(false);
 const [error,setError]=useState("");
 const [version,setVersion]=useState(0);
 const p=useMemo(()=>dark?{surface:"#19191D",line:"#38383E",text:"#F7F7FA",muted:"#ACACB5",tile:"#242429"}:
    {surface:"#FFF",line:"#E0E0E6",text:"#17171C",muted:"#666675",tile:"#F5F5F7"},[dark]);
 const st=useMemo(()=>styles(p),[p]);
 useEffect(()=>{
   // Only query fiscal documents when this section is actually opened.
   // Missing availability must never masquerade as an empty fiscal record.
   if (tab !== "fiscal") return;
   let active=true;setError("");
   setDocumentList([]);
   setLoading(true);
   void client.from("global_stock_fiscal_documents").select("id,kind,letter,status,local_reference,total_amount,created_at,issued_at,authorization_code,voucher_number,point_of_sale,qr_url,customer_name,currency")
     .eq("business_id",business.id).order("created_at",{ascending:false}).limit(50)
     .then(({data,error})=>{if(!active)return;if(error)throw error;setDocumentList((data??[]) as FiscalDocument[]);})
     .catch((err:unknown)=>{if(active){setError("No pudimos actualizar los documentos fiscales. Revisá tu conexión e intentá otra vez.");console.warn("Fiscal documents query failed",err instanceof Error?err.name:"query-error");}})
     .finally(()=>{if(active)setLoading(false)});
   return ()=>{active=false};
 },[client,business.id,version,tab]);
 const flagged=products.filter(p=>selected.includes(p.id));
 async function print(html:string,mode:"print"|"share"){
   if(working)return;
   setWorking(true);setError("");
   try{
     if(mode==="print")await Print.printAsync({html});
     else{
       const {uri}=await Print.printToFileAsync({html});
       const possible=await Sharing.isAvailableAsync();
       if(!possible)throw new Error("Este dispositivo no admite compartir archivos desde la app.");
       await Sharing.shareAsync(uri,{mimeType:"application/pdf",dialogTitle:"Compartir documento PDF"});
     }
   }catch(err){setError(err instanceof Error?err.message:"No se pudo generar el documento PDF.");}
   finally{setWorking(false)}
 }
 const btn=(label:string,onPress:()=>void,secondary=false,disabled=false)=> <Pressable disabled={disabled||working} onPress={onPress} accessibilityRole="button"
  style={[st.button,secondary&&{backgroundColor:p.tile,borderWidth:1,borderColor:p.line},(disabled||working)&&{opacity:0.45}]}>
  <Text style={[st.btnText,secondary&&{color:p.text}]}>{label}</Text></Pressable>;
 return <View style={{gap:13}}>
   {!embedded&&<><Text style={st.kicker}>DOCUMENTOS</Text><Text style={st.title}>Comprobantes e impresión</Text><Text style={st.helper}>Imprimí presupuestos, etiquetas de productos y consultá facturas registradas. Las impresiones no registran ventas.</Text></>}
   <View style={st.tabs}>{([["receipt","Presupuestos"],["labels","Etiquetas"],["fiscal","Facturas ARCA"]] as const).map(([name,label])=>
     <Pressable accessibilityRole="tab" accessibilityState={{selected:tab===name}} onPress={()=>setTab(name)} key={name} style={[st.tab,tab===name&&{backgroundColor:"#9F0011"}]}>
       <Text numberOfLines={2} style={[st.tabText,tab===name&&{color:"#fff"}]}>{label}</Text>
     </Pressable>)}</View>
   {tab==="receipt"?<View style={st.card}>
     <View style={st.heading}><FileText size={18} color="#C81724"/><Text style={st.headText}>Presupuesto interno</Text></View>
     <Text style={st.helper}>Para presupuestar o preparar una operación. No equivale a una venta cobrada ni a una factura.</Text>
     <Text style={st.meta}>Carrito: {cart.length} artículos</Text>
     {cart.length>0?<View style={{gap:8}}>
       {btn("Imprimir presupuesto actual",()=>void print(pendingHtml(business,cart,"CARRITO",new Date().toISOString()),"print"))}
       {btn("Compartir PDF del carrito",()=>void print(pendingHtml(business,cart,"CARRITO",new Date().toISOString()),"share"),true)}
     </View>:<Text style={st.helper}>Agregá productos desde Punto de venta para preparar un presupuesto.</Text>}
     {drafts.length>0?<Text style={st.headText}>Presupuestos guardados en este dispositivo</Text>:null}
     {drafts.slice(0,20).map(d=><View key={d.id} style={st.row}>
       <View style={{flex:1}}><Text style={st.meta}>{new Date(d.created_at).toLocaleString("es-AR")}</Text>
         <Text style={st.value}>{money(d.total,business.base_currency)}</Text></View>
       <Pressable accessibilityRole="button" accessibilityLabel="Imprimir presupuesto guardado" onPress={()=>void print(pendingHtml(business,d.items,d.id,d.created_at),"print")} style={st.iconButton}><Printer size={18} color={p.text}/></Pressable>
       <Pressable accessibilityRole="button" accessibilityLabel="Compartir PDF del presupuesto" onPress={()=>void print(pendingHtml(business,d.items,d.id,d.created_at),"share")} style={st.iconButton}><Share2 size={18} color={p.text}/></Pressable>
     </View>)}
   </View>:null}
   {tab==="labels"?<View style={st.card}>
     <View style={st.heading}><Barcode size={18} color="#C81724"/><Text style={st.headText}>Etiquetas con código de barras</Text></View>
     <Text style={st.helper}>Seleccioná los productos que querés imprimir. Se generan etiquetas Code 39 a partir de su código o SKU, con nombre y precio.</Text>
     {products.filter(p=>p.barcode||p.sku).slice(0,120).map(product=><Pressable key={product.id} onPress={()=>setSelected(old=>old.includes(product.id)?old.filter(v=>v!==product.id):[...old,product.id])}
       accessibilityRole="checkbox" accessibilityState={{checked:selected.includes(product.id)}} style={st.row}>
       <View style={[st.checkbox,selected.includes(product.id)&&{backgroundColor:"#A20C1B",borderColor:"#A20C1B"}]}><Text style={{color:"#fff"}}>{selected.includes(product.id)?"✓":""}</Text></View>
       <View style={{flex:1}}><Text style={st.value}>{product.name}</Text><Text style={st.meta}>{product.barcode||product.sku}</Text></View>
       <Text style={st.meta}>{money(product.price,business.base_currency)}</Text>
     </Pressable>)}
     {products.filter(p=>p.barcode||p.sku).length>120?<Text style={st.helper}>Mostrando 120 productos. Usá la web para lotes más grandes.</Text>:null}
     {btn("Imprimir "+flagged.length+" etiquetas",()=>void print(productLabels(flagged,business),"print"),false,flagged.length===0)}
     {btn("Compartir etiquetas PDF",()=>void print(productLabels(flagged,business),"share"),true,flagged.length===0)}
   </View>:null}
   {tab==="fiscal"?<View style={st.card}>
     <View style={st.heading}><FileCheck2 size={18} color="#C81724"/><Text style={st.headText}>Documentos fiscales de ARCA</Text></View>
     <Text style={st.helper}>Mostramos los documentos existentes y su autorización real. Un borrador no es una factura.</Text>
     {btn("Abrir configuración ARCA",onFiscal,true)}
     {btn("Actualizar documentos",()=>setVersion(v=>v+1),true)}
     {loading?<ActivityIndicator color="#C71B2A"/>:null}
     {documentList.length===0&&!loading&&!error?<Text style={st.helper}>Todavía no hay facturas registradas para este negocio.</Text>:null}
     {documentList.map(d=><View key={d.id} style={st.row}>
       <View style={{flex:1,gap:3}}><Text style={st.value}>{d.kind} {d.letter||""} · {d.local_reference}</Text>
         <Text style={[st.meta,{color:d.status==="authorized"?"#5AB995":p.muted}]}>{d.status==="authorized"?"AUTORIZADO":d.status.toUpperCase()}</Text>
         <Text style={st.meta}>{money(Number(d.total_amount)||0,d.currency||"ARS")}</Text></View>
       <Pressable accessibilityRole="button" disabled={d.status!=="authorized"||!d.authorization_code} accessibilityLabel="Imprimir copia de factura autorizada"
         style={[st.iconButton,d.status!=="authorized"&&{opacity:0.35}]} onPress={()=>void print(fiscalHtml(business,d),"print")}><Printer size={18} color={p.text}/></Pressable>
       <Pressable accessibilityRole="button" disabled={d.status!=="authorized"||!d.authorization_code} accessibilityLabel="Compartir factura autorizada en PDF"
         style={[st.iconButton,d.status!=="authorized"&&{opacity:0.35}]} onPress={()=>void print(fiscalHtml(business,d),"share")}><Share2 size={18} color={p.text}/></Pressable>
     </View>)}
   </View>:null}
   {working?<ActivityIndicator color="#C81724"/>:null}
   {!!error?<View style={st.alert}>
     <View style={{flex:1,gap:6}}>
       <Text accessibilityRole="alert" style={st.alertText}>{error}</Text>
       <Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(supportEmailUrl("Consulta sobre documentos de ARCA"))}>
         <Text style={{color:"#C91827",fontSize:11,fontWeight:"700"}}>{SUPPORT_EMAIL}</Text>
       </Pressable>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Reintentar consulta fiscal" onPress={()=>setVersion(v=>v+1)} style={st.retry}><Text style={{color:p.text,fontWeight:"700",fontSize:12}}>Reintentar</Text></Pressable>
   </View>:null}
 </View>;
}
function styles(p:{surface:string;line:string;text:string;muted:string;tile:string}){
 return StyleSheet.create({
  kicker:{color:"#D11B29",fontSize:10,fontWeight:"900",letterSpacing:1.6},
  title:{color:p.text,fontSize:23,fontWeight:"800"},
  helper:{color:p.muted,fontSize:11.5,lineHeight:19},
  tabs:{flexDirection:"row",borderRadius:13,gap:3,backgroundColor:p.tile,padding:4},
  tab:{flex:1,paddingVertical:12,paddingHorizontal:4,borderRadius:10,alignItems:"center",justifyContent:"center"},
  tabText:{fontSize:10.5,fontWeight:"800",textAlign:"center",color:p.muted},
  card:{borderRadius:17,backgroundColor:p.surface,borderWidth:1,borderColor:p.line,padding:15,gap:14},
  heading:{flexDirection:"row",alignItems:"center",gap:9},headText:{color:p.text,fontSize:14,fontWeight:"800"},
  meta:{color:p.muted,fontSize:10.5,lineHeight:16},value:{color:p.text,fontWeight:"800",fontSize:12},
  row:{flexDirection:"row",gap:9,alignItems:"center",paddingVertical:10,borderBottomWidth:0.5,borderColor:p.line},
  button:{backgroundColor:"#A00010",minHeight:43,borderRadius:11,justifyContent:"center",alignItems:"center",paddingHorizontal:12},
  btnText:{color:"#FFF",fontWeight:"800",fontSize:12},
  iconButton:{backgroundColor:p.tile,borderRadius:10,padding:11,borderWidth:1,borderColor:p.line},
  checkbox:{width:22,height:22,borderWidth:1,borderColor:p.line,borderRadius:5,alignItems:"center",justifyContent:"center"},
  alert:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:p.tile,padding:12,borderRadius:12,borderWidth:1,borderColor:p.line},
  alertText:{color:p.muted,fontSize:11,flex:1,lineHeight:17},
  retry:{paddingVertical:10,paddingHorizontal:12,borderRadius:9,backgroundColor:p.surface,borderWidth:1,borderColor:p.line}
 });
}
