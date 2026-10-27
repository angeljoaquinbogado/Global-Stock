"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote, CheckCircle2, Clock3,
  History, LockKeyhole, RefreshCw, ShieldCheck, Wallet, XCircle, CreditCard, ArrowUpRight
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ApexSelect } from "./ui/ApexSelect";
import type { LanguageCode } from "./GlobalPreferences";
import "./cash-register-center.css";

type Shift = {
  id:string; location_id:string|null; opened_at:string; opening_amount:number;
  closed_at:string|null; closing_amount:number|null; expected_amount:number|null;
  difference:number|null; status:"open"|"closed"; notes:string|null;
};
type Adjustment = {
  id:string; kind:"income"|"expense"|"withdrawal"|"deposit";
  amount:number;description:string|null;created_at:string;
};
type Snapshot = {
  opening:number;cash_sales:number;other_sales:number;sales_count:number;
  incomes:number;outgoings:number;expected:number;closed:boolean;
};
type Location = {id:string;name:string};
type Props={
  language:LanguageCode;businessId:string|null;demoMode:boolean;
  locations:Location[];money:(n:number)=>string;currency:string;
  canManage:boolean;onGoToPos:()=>void;
};
const words={
  es:{
    title:"Control de caja",subtitle:"Abrí y cerrá turnos, registrá movimientos de efectivo y controlá el arqueo.",
    demo:"Modo demostración: los movimientos de esta caja no se guardan.",noBusiness:"Conectá tu negocio para usar la caja compartida.",
    location:"Sucursal / local",open:"Abrir caja",opening:"Fondo inicial",openShift:"Comenzar turno",current:"Turno abierto",
    closed:"Turno cerrado",last:"Últimos turnos",none:"Todavía no hay turnos en esta ubicación.",
    POS:"Ir a cobros y ventas",reload:"Actualizar movimientos",since:"Desde",
    cashExpected:"Efectivo esperado",cashSales:"Ventas en efectivo",otherSales:"Otros medios",openingBalance:"Fondo inicial",
    manualIncome:"Entradas manuales",manualExpense:"Salidas manuales",activity:"Movimientos",history:"Historial",
    emptyActivity:"Sin movimientos manuales en este turno.",in:"Ingreso",out:"Egreso",withdrawal:"Retiro",deposit:"Depósito",
    movement:"Registrar movimiento",reason:"Motivo del movimiento",reasonPlaceholder:"Ej. Pago de proveedor, retiro a banco",
    amount:"Importe",record:"Confirmar movimiento",close:"Cerrar caja",count:"Efectivo contado",
    note:"Observaciones del cierre",countHelp:"Contá el dinero físicamente, ingresá el importe y comparalo con el esperado.",
    diff:"Diferencia",equal:"Caja exacta",positive:"Sobrante",negative:"Faltante",confirm:"Confirmar cierre",
    confirmStep:"Volvé a presionar para confirmar el arqueo",error:"No se pudo completar la operación.",
    syncing:"Consultando registros…",offline:"Necesitás conexión para registrar movimientos o cerrar un turno real.",
    role:"Tu usuario no tiene permiso para editar esta caja.",salesNote:"Se incluyen solo pagos POS en efectivo confirmados en el servidor durante este turno y en esta ubicación. Las ventas pendientes de sincronización no se cuentan todavía.",
    noShift:"No hay una caja abierta",openHelp:"Abrí un turno con el efectivo inicial. Los cobros se realizan en Punto de Venta.",
    readError:"No se pudo consultar el resumen. Actualizá antes de cerrar la caja.",
    adjustReason:"Especificá un motivo de al menos 3 caracteres.",cashBefore:"El total esperado se calcula con el fondo, cobros en efectivo e ingresos/retiros registrados.",
    locationNotConfigured:"Caja general",done:"Operación confirmada",historyNote:"Los turnos cerrados conservan el importe esperado, contado y la diferencia del cierre.",
    closePending:"Cerrando…",savePending:"Guardando…",refresh:"Actualizar",registered:"Registrado",counted:"Contado",
    details:"Detalle del turno",selectShift:"Ver movimientos",oneRegister:"Una caja por sucursal puede permanecer abierta al mismo tiempo.",
    validAmount:"Ingresá un importe válido (hasta dos decimales)."
  },
  en:{
    title:"Cash management",subtitle:"Open and close shifts, record cash movements and reconcile balances.",
    demo:"Demo mode: these cash movements are not saved.",noBusiness:"Connect your business to use the shared cash register.",
    location:"Store / location",open:"Open register",opening:"Opening float",openShift:"Start shift",current:"Open shift",
    closed:"Closed shift",last:"Previous shifts",none:"No shifts in this location yet.",
    POS:"Go to checkout",reload:"Refresh",since:"Since",
    cashExpected:"Expected cash",cashSales:"Cash POS sales",otherSales:"Non-cash payments",openingBalance:"Opening float",
    manualIncome:"Manual cash in",manualExpense:"Manual cash out",activity:"Movements",history:"History",
    emptyActivity:"No manual movements for this shift.",in:"Income",out:"Expense",withdrawal:"Withdrawal",deposit:"Deposit",
    movement:"New cash movement",reason:"Reason",reasonPlaceholder:"E.g. supplier expense, bank withdrawal",
    amount:"Amount",record:"Confirm movement",close:"Close register",count:"Counted cash",
    note:"Closing notes",countHelp:"Count the physical cash and compare it to the expected amount.",
    diff:"Difference",equal:"Balanced",positive:"Over",negative:"Short",confirm:"Confirm closing",
    confirmStep:"Press again to confirm",error:"Could not complete the operation.",
    syncing:"Loading cash records…",offline:"You need a connection to manage a real cash register.",
    role:"Your account cannot manage this cash register.",salesNote:"Only confirmed POS cash payments in this shift and location are counted. Pending offline sales are not yet included.",
    noShift:"No open register",openHelp:"Start with the opening float. Sales are processed in Point of Sale.",
    readError:"Could not retrieve the register totals. Refresh before closing.",
    adjustReason:"Enter a reason of at least 3 characters.",cashBefore:"Expected cash includes opening float, cash sales and manual cash movements.",
    locationNotConfigured:"General register",done:"Operation confirmed",historyNote:"Closed shifts retain the expected, counted and variance values.",
    closePending:"Closing…",savePending:"Saving…",refresh:"Refresh",registered:"Recorded",counted:"Counted",
    details:"Shift details",selectShift:"Show movements",oneRegister:"Only one register can be open per location.",
    validAmount:"Enter a valid amount (up to two decimals)."
  },
  pt:{
    title:"Controle do caixa",subtitle:"Abra e feche turnos, registre movimentos e confira o dinheiro.",
    demo:"Modo demonstração: movimentos não são salvos.",noBusiness:"Conecte sua empresa para usar o caixa.",
    location:"Filial / loja",open:"Abrir caixa",opening:"Fundo inicial",openShift:"Iniciar turno",current:"Turno aberto",
    closed:"Turno fechado",last:"Últimos turnos",none:"Nenhum turno registrado.",POS:"Ir para vendas e pagamentos",
    reload:"Atualizar",since:"Desde",cashExpected:"Dinheiro esperado",cashSales:"Vendas em dinheiro",
    otherSales:"Outros pagamentos",openingBalance:"Fundo inicial",manualIncome:"Entradas manuais",
    manualExpense:"Saídas manuais",activity:"Movimentos",history:"Histórico",emptyActivity:"Sem movimentos manuais.",
    in:"Entrada",out:"Saída",withdrawal:"Retirada",deposit:"Depósito",movement:"Registrar movimento",
    reason:"Motivo",reasonPlaceholder:"Ex. fornecedor, retirada para banco",amount:"Valor",
    record:"Confirmar movimento",close:"Fechar caixa",count:"Dinheiro contado",note:"Observações",
    countHelp:"Conte o dinheiro e compare com o valor esperado.",diff:"Diferença",
    equal:"Exato",positive:"Sobra",negative:"Falta",confirm:"Confirmar fechamento",
    confirmStep:"Pressione novamente para confirmar",error:"Não foi possível concluir.",
    syncing:"Carregando…",offline:"Conexão necessária para movimentar um caixa real.",role:"Sem permissão para editar.",
    salesNote:"Somente pagamentos em dinheiro confirmados no PDV neste turno entram na conferência.",
    noShift:"Nenhum caixa aberto",openHelp:"Abra o turno. As vendas são feitas no Ponto de Venda.",
    readError:"Não foi possível consultar os totais.",adjustReason:"Informe o motivo (mínimo 3 caracteres).",
    cashBefore:"O saldo considera fundo inicial, vendas e movimentos manuais.",locationNotConfigured:"Caixa geral",
    done:"Operação confirmada",historyNote:"Turnos fechados conservam os valores registrados.",
    closePending:"Fechando…",savePending:"Salvando…",refresh:"Atualizar",registered:"Registrado",counted:"Contado",
    details:"Detalhes",selectShift:"Ver movimentos",oneRegister:"Apenas um turno aberto por loja.",validAmount:"Insira um valor válido."
  }
} as const;
type Copy={ [K in keyof typeof words.es]: string };
function localized(language:LanguageCode):Copy {
  return (words as Record<string,Copy>)[language] ?? words.en;
}
const numeric=/^(?:\d+)(?:[.,]\d{1,2})?$/;
function readMoney(raw:string,allowZero:boolean) {
  const s=raw.trim();
  if(!numeric.test(s))return null;
  const n=Number(s.replace(",","."));
  return Number.isFinite(n) && n<=100000000000 && (allowZero?n>=0:n>0)?n:null;
}
function asNum(value:unknown) {
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}
function dateFormat(date:string,language:LanguageCode) {
  try {return new Intl.DateTimeFormat(language==="es"?"es-AR":language==="pt"?"pt-BR":language==="fr"?"fr-FR":language==="de"?"de-DE":"en-US",{
    dateStyle:"short",timeStyle:"short"
  }).format(new Date(date));} catch {return date;}
}

export function CashRegisterCenter({language,businessId,demoMode,locations,money,currency,canManage,onGoToPos}:Props) {
  const t=localized(language);
  const reduced=useReducedMotion();
  const [locationId,setLocationId]=useState<string>("");
  const [shifts,setShifts]=useState<Shift[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
  const [movements,setMovements]=useState<Adjustment[]>([]);
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [opening,setOpening]=useState("");
  const [movementKind,setMovementKind]=useState<Adjustment["kind"]>("income");
  const [movementAmount,setMovementAmount]=useState("");
  const [movementReason,setMovementReason]=useState("");
  const [counted,setCounted]=useState("");
  const [closingNote,setClosingNote]=useState("");
  const [confirmClose,setConfirmClose]=useState(false);
  const [revision,setRevision]=useState(0);
  const [paypalConfigured,setPaypalConfigured]=useState(false);
  const [paypalBusy,setPaypalBusy]=useState(false);
  const [paypalNotice,setPaypalNotice]=useState("");
  const movementRequest=useRef<{key:string;fingerprint:string}|null>(null);

  useEffect(() => {
    if (!demoMode) return;
    let active = true;
    void fetch("/api/paypal/sandbox/orders", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (active) setPaypalConfigured(data?.configured === true); })
      .catch(() => { if (active) setPaypalConfigured(false); });

    const params = new URLSearchParams(window.location.search);
    const status = params.get("paypal");
    const orderId = params.get("token");
    if (status === "cancelled") {
      setPaypalNotice("Compra de prueba cancelada. No se realizó ningún cobro real.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (status === "success" && orderId) {
      setPaypalBusy(true);
      void fetch("/api/paypal/sandbox/orders/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error("No se pudo confirmar la compra de prueba.");
        if (active) setPaypalNotice(`Pago de prueba confirmado en PayPal Sandbox: ${data.currency} ${data.amount}. ID: ${data.id}`);
      }).catch(() => {
        if (active) setPaypalNotice("No se pudo confirmar el resultado en Sandbox. Revisá el estado del pedido antes de volver a intentar.");
      }).finally(() => {
        if (active) setPaypalBusy(false);
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
    return () => { active = false; };
  }, [demoMode]);

  useEffect(()=>{
    if (!locations.length) {setLocationId("");return;}
    setLocationId(old=>locations.some(loc=>loc.id===old)?old:locations[0].id);
  },[locations]);

  useEffect(()=>{
    setSelectedId(null);
    setSnapshot(null);
    setShifts([]);
    setMovements([]);
    setConfirmClose(false);
  },[businessId,locationId]);

  const active=shifts.find(item=>item.status==="open")??null;
  const displayed=shifts.find(item=>item.id===selectedId)??active??shifts[0]??null;

  const reload=useCallback(async()=>{
    if(demoMode)return;
    if(!businessId)return;
    const client=getSupabaseBrowserClient();
    if(!client){setError(t.noBusiness);return;}
    setLoading(true);
    try {
      let query=client.from("global_stock_cash_sessions")
        .select("id,location_id,opened_at,opening_amount,closed_at,closing_amount,expected_amount,difference,status,notes")
        .eq("business_id",businessId)
        .order("opened_at",{ascending:false})
        .limit(25);
      query=locationId?query.eq("location_id",locationId):query.is("location_id",null);
      const {data,error:readError}=await query;
      if(readError)throw readError;
      setShifts((data??[]).map(v=>({
        id:String(v.id),location_id:v.location_id||null,opened_at:String(v.opened_at),
        opening_amount:asNum(v.opening_amount),closed_at:v.closed_at||null,
        closing_amount:v.closing_amount==null?null:asNum(v.closing_amount),
        expected_amount:v.expected_amount==null?null:asNum(v.expected_amount),
        difference:v.difference==null?null:asNum(v.difference),
        status:v.status==="open"?"open":"closed",notes:v.notes||null
      })));
      setError("");
    } catch(cause) {
      setError(cause instanceof Error?cause.message:t.readError);
    } finally {setLoading(false);}
  },[demoMode,businessId,locationId,t.noBusiness,t.readError]);

  useEffect(()=>{void reload();},[reload,revision]);

  useEffect(()=>{
    if(!displayed){setSnapshot(null);setMovements([]);return;}
    if(demoMode) {
      // Demo values are held in React state only, never mixed with a real business.
      return;
    }
    if(!businessId)return;
    const client=getSupabaseBrowserClient();
    if(!client)return;
    let alive=true;
    setSnapshot(null);
    Promise.all([
      client.rpc("global_stock_cash_shift_snapshot",{target_business_id:businessId,target_session_id:displayed.id}),
      client.from("global_stock_cash_movements")
        .select("id,kind,amount,description,created_at")
        .eq("business_id",businessId)
        .eq("cash_session_id",displayed.id)
        .order("created_at",{ascending:false}).limit(100)
    ]).then(([summary,items])=>{
      if(!alive)return;
      if(summary.error||items.error){
        setError(summary.error?.message||items.error?.message||t.readError);
        setSnapshot(null);
        return;
      }
      const v=summary.data as Partial<Snapshot>|null;
      if(!v){setSnapshot(null);return;}
      setSnapshot({
        opening:asNum(v.opening),cash_sales:asNum(v.cash_sales),
        other_sales:asNum(v.other_sales),sales_count:asNum(v.sales_count),
        incomes:asNum(v.incomes),outgoings:asNum(v.outgoings),
        expected:asNum(v.expected),closed:Boolean(v.closed)
      });
      setMovements((items.data??[]).map(item=>({
        id:String(item.id),kind:item.kind as Adjustment["kind"],
        amount:asNum(item.amount),description:item.description||null,created_at:String(item.created_at)
      })));
    }).catch(cause=>{if(alive){setError(cause instanceof Error?cause.message:t.readError);setSnapshot(null);}});
    return()=>{alive=false;};
  },[businessId,displayed?.id,demoMode,revision,t.readError]);

  const demoSnapshot=useMemo(()=>{
    if(!demoMode||!displayed)return null;
    const rows=movements.filter(m=>m.id.startsWith(displayed.id+"-"));
    const incoming=rows.filter(m=>m.kind==="income"||m.kind==="deposit").reduce((sum,m)=>sum+m.amount,0);
    const outgoing=rows.filter(m=>m.kind==="withdrawal"||m.kind==="expense").reduce((sum,m)=>sum+m.amount,0);
    return {opening:displayed.opening_amount,cash_sales:0,other_sales:0,sales_count:0,
      incomes:incoming,outgoings:outgoing,expected:displayed.opening_amount+incoming-outgoing,
      closed:displayed.status==="closed"} as Snapshot;
  },[demoMode,displayed,movements]);

  const totals=demoMode?demoSnapshot:snapshot;
  const currentExpected=displayed?.status==="closed"&&displayed.expected_amount!==null
    ?displayed.expected_amount:totals?.expected??null;
  const predictedDiff=readMoney(counted,true)!==null && currentExpected!==null
    ?(readMoney(counted,true)??0)-currentExpected:null;

  function validConnection(){
    if(demoMode)return true;
    if(!canManage){setError(t.role);return false;}
    if(!businessId){setError(t.noBusiness);return false;}
    if(typeof navigator!=="undefined"&&!navigator.onLine){setError(t.offline);return false;}
    return true;
  }
  function errorMessage(cause:unknown) {return cause instanceof Error?cause.message:t.error;}

  async function openShift(){
    const amount=readMoney(opening,true);
    if(amount===null){setError(t.validAmount);return;}
    if(!validConnection()||busy)return;
    setBusy(true);setError("");setNotice("");
    try {
      if(demoMode){
        const id=crypto.randomUUID();
        setShifts(current=>[{id,location_id:locationId||null,opened_at:new Date().toISOString(),
          opening_amount:amount,closed_at:null,closing_amount:null,expected_amount:null,
          difference:null,status:"open",notes:null},...current]);
      } else {
        const client=getSupabaseBrowserClient();
        if(!client)throw new Error(t.noBusiness);
        const {error:failed}=await client.rpc("global_stock_open_cash_shift",{
          target_business_id:businessId,target_location_id:locationId||null,opening_cash:amount
        });
        if(failed)throw failed;
        setRevision(x=>x+1);
      }
      setOpening("");setNotice(t.done);
    } catch(cause) {setError(errorMessage(cause));setRevision(x=>x+1);}
    finally {setBusy(false);}
  }

  async function addMovement(){
    const amount=readMoney(movementAmount,false);
    if(amount===null){setError(t.validAmount);return;}
    if(movementReason.trim().length<3){setError(t.adjustReason);return;}
    if(!active||!validConnection()||busy)return;
    const fingerprint=[active.id,movementKind,amount,movementReason.trim()].join(":");
    if(!movementRequest.current||movementRequest.current.fingerprint!==fingerprint){
      movementRequest.current={key:crypto.randomUUID(),fingerprint};
    }
    setBusy(true);setError("");setNotice("");
    try {
      if(demoMode){
        setMovements(current=>[{id:active.id+"-"+crypto.randomUUID(),kind:movementKind,
          amount,description:movementReason.trim(),created_at:new Date().toISOString()},...current]);
      } else {
        const client=getSupabaseBrowserClient();
        if(!client)throw new Error(t.noBusiness);
        const {error:failed}=await client.rpc("global_stock_record_cash_adjustment",{
          target_business_id:businessId,target_session_id:active.id,
          client_operation_id:movementRequest.current.key,movement_kind:movementKind,
          movement_amount:amount,movement_description:movementReason.trim()
        });
        if(failed)throw failed;
        setRevision(x=>x+1);
      }
      movementRequest.current=null;
      setMovementAmount("");setMovementReason("");setNotice(t.done);
    } catch(cause) {setError(errorMessage(cause));}
    finally {setBusy(false);}
  }

  async function closeShift(){
    const amount=readMoney(counted,true);
    if(amount===null){setError(t.validAmount);return;}
    if(!active||!totals||!validConnection()||busy)return;
    if(!confirmClose){setConfirmClose(true);return;}
    setBusy(true);setError("");setNotice("");
    try {
      if(demoMode){
        const expected=totals.expected;
        setShifts(current=>current.map(shift=>shift.id===active.id?{
          ...shift,status:"closed",closed_at:new Date().toISOString(),
          expected_amount:expected,closing_amount:amount,difference:amount-expected,notes:closingNote
        }:shift));
      } else {
        const client=getSupabaseBrowserClient();
        if(!client)throw new Error(t.noBusiness);
        const {error:failed}=await client.rpc("global_stock_close_cash_shift",{
          target_business_id:businessId,target_session_id:active.id,
          counted_cash:amount,closing_notes:closingNote.trim()||null
        });
        if(failed)throw failed;
        setRevision(x=>x+1);
      }
      setCounted("");setClosingNote("");setConfirmClose(false);
      setNotice(t.done);
    } catch(cause) {setError(errorMessage(cause));setConfirmClose(false);setRevision(x=>x+1);}
    finally {setBusy(false);}
  }

  const isOffline=!demoMode && typeof navigator!=="undefined" && !navigator.onLine;
  const disabled=busy||!canManage||isOffline||(!demoMode&&!businessId);

  return <section className="gs-cash-register space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="gs-cash-eyebrow"><Wallet size={14}/>{t.title}</p>
        <h2 className="mt-2 text-[clamp(24px,2.5vw,34px)] font-bold tracking-[-.045em]">{t.title}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--apex-muted)]">{t.subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={()=>setRevision(x=>x+1)} title={t.reload} aria-label={t.reload} className="gs-cash-secondary h-10 w-10 p-0"><RefreshCw size={16}/></button>
        <button type="button" onClick={onGoToPos} className="gs-cash-primary gap-2"><ArrowRight size={15}/>{t.POS}</button>
      </div>
    </div>
    {demoMode && <p className="gs-cash-note">{t.demo}</p>}
    {demoMode && (
      <div className="gs-cash-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={16} className="text-[var(--apex-accent)]"/> PayPal Sandbox · compra de prueba</p>
          <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">Probá el flujo de pago sin dinero real. El pedido es fijo y no modifica la caja ni el inventario del demo.</p>
        </div>
        <button type="button" disabled={!paypalConfigured || paypalBusy} onClick={async () => {
          setPaypalBusy(true); setPaypalNotice("");
          try {
            const response = await fetch("/api/paypal/sandbox/orders", { method: "POST" });
            const data = await response.json();
            if (!response.ok || typeof data.approvalUrl !== "string" || !data.approvalUrl.startsWith("https://www.sandbox.paypal.com/")) throw new Error("sandbox-unavailable");
            window.location.assign(data.approvalUrl);
          } catch {
            setPaypalNotice("PayPal Sandbox no está configurado o no pudo iniciar el checkout. No se realizó ningún cobro.");
            setPaypalBusy(false);
          }
        }} className="gs-cash-primary inline-flex shrink-0 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          <CreditCard size={15}/>{paypalBusy ? "Conectando…" : paypalConfigured ? "Probar pago de US$ 19,99" : "Sandbox no configurado"}<ArrowUpRight size={14}/>
        </button>
        {paypalNotice && <p role="status" className="text-xs leading-5 text-[var(--apex-muted)] sm:basis-full">{paypalNotice}</p>}
      </div>
    )}
    {!demoMode&&!businessId&&<p className="gs-cash-note">{t.noBusiness}</p>}
    {!canManage&&<p className="gs-cash-note">{t.role}</p>}
    {isOffline&&<p className="gs-cash-note">{t.offline}</p>}
    {error&&<p role="alert" className="gs-cash-error"><XCircle size={16}/>{error}</p>}
    {notice&&<p role="status" className="gs-cash-success"><CheckCircle2 size={16}/>{notice}</p>}
    <div className="gs-cash-panel flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
      <div className="min-w-[180px] flex-1">
        <p className="gs-cash-field-label">{t.location}</p>
        <div className="mt-2 max-w-sm">
          <ApexSelect value={locationId} onChange={event=>setLocationId(event.target.value)}
            className="apex-input min-h-11 w-full px-3 text-xs">
            {!locations.length&&<option value="">{t.locationNotConfigured}</option>}
            {locations.map(loc=><option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </ApexSelect>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end rounded-xl border border-[var(--apex-border)] px-3 py-2.5 text-xs">
        <span className={"gs-cash-dot "+(active?"gs-cash-dot--live":"")}/>
        <span className="font-semibold">{active?t.current:t.noShift}</span>
      </div>
    </div>

    <AnimatePresence mode="wait" initial={false}>
      {active ? <motion.div key="open" initial={reduced?false:{opacity:0,y:9}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.23}} className="space-y-4">
        <div className="gs-cash-stat-grid">
          {[
            {name:t.cashExpected,value:totals?.expected??null,icon:<Banknote size={18}/>},
            {name:t.cashSales,value:totals?.cash_sales??null,icon:<ArrowDownLeft size={18}/>},
            {name:t.manualIncome,value:totals?.incomes??null,icon:<ArrowDownLeft size={18}/>},
            {name:t.manualExpense,value:totals?.outgoings??null,icon:<ArrowUpRight size={18}/>}
          ].map(row=><div className="gs-cash-stat" key={row.name}>
            <div className="flex items-center justify-between gap-2"><span className="text-[11px] text-[var(--apex-muted)]">{row.name}</span><span className="text-[var(--apex-accent)]">{row.icon}</span></div>
            <strong className="mt-3 block truncate text-[clamp(16px,2.2vw,24px)] font-bold tracking-tight tabular-nums">{row.value===null?"—":money(row.value)}</strong>
          </div>)}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(315px,.8fr)]">
          <div className="space-y-4">
            <div className="gs-cash-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-base font-bold">{t.movement}</h3><p className="mt-1 text-xs text-[var(--apex-muted)]">{t.cashBefore}</p></div>
                <span className="text-[11px] text-[var(--apex-muted)]">{t.since}: {dateFormat(active.opened_at,language)}</span>
              </div>
              <form className="mt-4 space-y-3" onSubmit={event=>{event.preventDefault();void addMovement();}}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="gs-cash-field"><span>{t.movement}</span>
                    <ApexSelect value={movementKind} onChange={event=>{setMovementKind(event.target.value as Adjustment["kind"]);movementRequest.current=null;}} disabled={disabled} className="apex-input min-h-11 w-full px-3 text-xs">
                      <option value="income">{t.in}</option><option value="deposit">{t.deposit}</option>
                      <option value="expense">{t.out}</option><option value="withdrawal">{t.withdrawal}</option>
                    </ApexSelect>
                  </label>
                  <label className="gs-cash-field"><span>{t.amount} ({currency})</span>
                    <input className="apex-input min-h-11 px-3 text-sm tabular-nums" inputMode="decimal" placeholder="0,00" disabled={disabled}
                      value={movementAmount} onChange={event=>{setMovementAmount(event.target.value);movementRequest.current=null;}}/>
                  </label>
                </div>
                <label className="gs-cash-field"><span>{t.reason}</span>
                  <input className="apex-input min-h-11 px-3 text-sm" maxLength={240} placeholder={t.reasonPlaceholder} disabled={disabled}
                    value={movementReason} onChange={event=>{setMovementReason(event.target.value);movementRequest.current=null;}}/>
                </label>
                <button className="gs-cash-primary w-full sm:w-auto" type="submit"
                  disabled={disabled||!movementReason.trim()||readMoney(movementAmount,false)===null}>
                  {busy?t.savePending:t.record}
                </button>
              </form>
            </div>
            <div className="gs-cash-panel p-4 sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><History size={16}/>{t.activity}</h3>
              {loading?<p className="text-xs text-[var(--apex-muted)]">{t.syncing}</p>:movements.length?
                <div className="space-y-2">{movements.filter(item=>!demoMode||item.id.startsWith(active.id+"-")).slice(0,15).map(item=>
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--apex-border)] py-2.5 last:border-0">
                    <div className="min-w-0"><p className="truncate text-xs font-semibold">{item.description||item.kind}</p>
                      <p className="mt-1 text-[11px] text-[var(--apex-muted)]">{dateFormat(item.created_at,language)}</p></div>
                    <strong className="shrink-0 text-xs tabular-nums">{["income","deposit"].includes(item.kind)?"+":"−"}{money(item.amount)}</strong>
                  </div>)}</div>:
                <p className="py-4 text-xs text-[var(--apex-muted)]">{t.emptyActivity}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="gs-cash-panel p-4 sm:p-5">
              <h3 className="text-base font-bold">{t.close}</h3>
              <div className="mt-4 space-y-2.5">
                {[
                  {label:t.openingBalance,value:totals?.opening},
                  {label:t.cashSales,value:totals?.cash_sales},
                  {label:t.otherSales,value:totals?.other_sales},
                  {label:t.manualIncome,value:totals?.incomes},
                  {label:t.manualExpense,value:totals?.outgoings}
                ].map(line=><div key={line.label} className="flex justify-between gap-3 text-xs">
                  <span className="text-[var(--apex-muted)]">{line.label}</span>
                  <span className="font-semibold tabular-nums">{line.value===undefined?"—":money(line.value)}</span>
                </div>)}
                <div className="mt-3 flex justify-between gap-3 border-t border-[var(--apex-border)] pt-3 text-sm font-bold">
                  <span>{t.cashExpected}</span><span>{totals?money(totals.expected):"—"}</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--apex-muted)]">{t.countHelp}</p>
              <label className="gs-cash-field mt-3"><span>{t.count} ({currency})</span>
                <input className="apex-input min-h-11 px-3 text-sm" inputMode="decimal" placeholder="0,00"
                  disabled={disabled||!totals} value={counted} onChange={event=>{setCounted(event.target.value);setConfirmClose(false);}}/>
              </label>
              {predictedDiff!==null&&<div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--apex-border)] p-3 text-xs">
                <span>{t.diff}</span><strong className="tabular-nums">{predictedDiff>0?"+":""}{money(predictedDiff)} · {Math.abs(predictedDiff)<.005?t.equal:predictedDiff>0?t.positive:t.negative}</strong>
              </div>}
              <label className="gs-cash-field mt-3"><span>{t.note}</span>
                <textarea rows={2} maxLength={600} className="apex-input min-h-20 px-3 py-3 text-xs" disabled={disabled}
                  value={closingNote} onChange={event=>setClosingNote(event.target.value)}/>
              </label>
              <button type="button" disabled={disabled||!totals||readMoney(counted,true)===null}
                onClick={()=>void closeShift()} className={"mt-3 w-full "+(confirmClose?"gs-cash-danger":"gs-cash-primary")}>
                <LockKeyhole size={15}/>{busy?t.closePending:confirmClose?t.confirmStep:t.confirm}
              </button>
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--apex-muted)]">{t.salesNote}</p>
              {!totals&&<p className="mt-2 text-[11px] text-red-600">{t.readError}</p>}
            </div>
          </div>
        </div>
      </motion.div>:
      <motion.div key="empty" initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} className="gs-cash-panel p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="gs-cash-icon"><Wallet size={21}/></span><div>
          <h3 className="text-base font-bold">{t.noShift}</h3>
          <p className="mt-1 text-xs text-[var(--apex-muted)]">{t.openHelp}</p></div></div>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={event=>{event.preventDefault();void openShift();}}>
          <label className="gs-cash-field max-w-sm flex-1"><span>{t.opening} ({currency})</span>
            <input className="apex-input min-h-11 px-3 text-sm tabular-nums" inputMode="decimal" placeholder="0,00"
              disabled={disabled} value={opening} onChange={event=>setOpening(event.target.value)}/></label>
          <button type="submit" className="gs-cash-primary" disabled={disabled||readMoney(opening,true)===null}>{busy?t.savePending:t.openShift}</button>
        </form>
        <p className="mt-3 text-[11px] text-[var(--apex-muted)]">{t.oneRegister}</p>
      </motion.div>}
    </AnimatePresence>
    <div className="gs-cash-panel p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Clock3 size={16}/>{t.last}</h3>
      <p className="mt-2 text-[11px] text-[var(--apex-muted)]">{t.historyNote}</p>
      {shifts.filter(item=>item.status==="closed").length===0?
        <p className="py-5 text-xs text-[var(--apex-muted)]">{t.none}</p>:
        <div className="mt-3 space-y-2">{shifts.filter(item=>item.status==="closed").slice(0,8).map(item=>
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--apex-border)] p-3 text-xs">
            <div><p className="font-semibold">{dateFormat(item.opened_at,language)}</p>
              <p className="mt-1 text-[var(--apex-muted)]">{t.closed}: {item.closed_at?dateFormat(item.closed_at,language):"—"}</p></div>
            <div className="text-right"><p>{t.cashExpected}: <strong>{item.expected_amount===null?"—":money(item.expected_amount)}</strong></p>
              <p className="mt-1">{t.counted}: <strong>{item.closing_amount===null?"—":money(item.closing_amount)}</strong></p>
              <p className="mt-1">{t.diff}: <strong>{item.difference===null?"—":money(item.difference)}</strong></p></div>
          </div>)}</div>}
    </div>
  </section>;
}
