import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Check, X } from "lucide-react-native";

type Props = {
  selectedDate: string;
  onSelect: (date: string) => void;
  eventDates?: string[];
  dark: boolean;
};
const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const weekdays = ["L","M","M","J","V","S","D"];
function key(y: number, m: number, d: number) {
  return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function parse(iso:string) {
  const [y,m,d]=iso.split("-").map(Number);
  const valid=Number.isInteger(y)&&Number.isInteger(m)&&Number.isInteger(d)&&y>=1900&&y<=2100&&m>=1&&m<=12&&d>=1&&d<=new Date(y,m,0).getDate();
  if(valid)return {y,m,d};
  const n=new Date();return {y:n.getFullYear(),m:n.getMonth()+1,d:n.getDate()};
}
function move(y:number,m:number,offset:number){
  const dt=new Date(y,m-1+offset,1);
  return {y:dt.getFullYear(),m:dt.getMonth()+1};
}

export default function NativeCalendarSelector({ selectedDate, onSelect, eventDates=[], dark }: Props) {
  const selected = parse(selectedDate);
  const [shown, setShown] = useState({y:selected.y,m:selected.m});
  const [picker, setPicker] = useState(false);
  const [jumpYear, setJumpYear] = useState(String(selected.y));
  const [jumpMonth,setJumpMonth] = useState(selected.m);
  const [error,setError] = useState("");
  const p = dark
    ? {bg:"#1B1B20",tile:"#25252C",line:"#37373F",fg:"#F7F7FA",muted:"#B5B5BF"}
    : {bg:"#FFFFFF",tile:"#F3F3F6",line:"#DEDEE5",fg:"#1B1B21",muted:"#71717C"};
  const st=useMemo(()=>styles(p),[dark]);
  const today=new Date();const todayIso=key(today.getFullYear(),today.getMonth()+1,today.getDate());
  const first=new Date(shown.y,shown.m-1,1);
  const leading=(first.getDay()+6)%7;
  const total=new Date(shown.y,shown.m,0).getDate();
  const dayCells=Array.from({length:Math.ceil((leading+total)/7)*7},(_,index)=>{
    const day=index-leading+1;
    return day>0&&day<=total ? day : null;
  });
  const datesWithReminders=useMemo(()=>new Set(eventDates),[eventDates]);

  function choose(day:number) {
    onSelect(key(shown.y,shown.m,day));
  }
  function openJump() {
    setJumpYear(String(shown.y));
    setJumpMonth(shown.m);
    setError("");
    setPicker(true);
  }
  function confirmJump() {
    const year=Number(jumpYear);
    if(!Number.isInteger(year)||year<1900||year>2100){
      setError("Ingresá un año entre 1900 y 2100.");
      return;
    }
    setShown({y:year,m:jumpMonth});
    const last=new Date(year,jumpMonth,0).getDate();
    onSelect(key(year,jumpMonth,Math.min(selected.d,last)));
    setPicker(false);
  }
  function goToday(){
    const date=new Date();
    setShown({y:date.getFullYear(),m:date.getMonth()+1});
    onSelect(key(date.getFullYear(),date.getMonth()+1,date.getDate()));
    setPicker(false);
  }

  return <View style={st.container}>
    <View style={st.header}>
      <View style={{flexDirection:"row",gap:8,alignItems:"center"}}>
        <CalendarDays size={18} color="#D51C2A"/>
        <Text style={st.sectionTitle}>Elegí una fecha</Text>
      </View>
      <Pressable onPress={goToday} accessibilityRole="button" style={st.today}><Text style={st.todayText}>Hoy</Text></Pressable>
    </View>

    <View style={st.monthNav}>
      <Pressable onPress={()=>setShown(v=>move(v.y,v.m,-1))} accessibilityLabel="Mes anterior" accessibilityRole="button" style={st.arrow}><ChevronLeft size={18} color={p.fg}/></Pressable>
      <Pressable onPress={openJump} accessibilityLabel="Elegir mes y año" accessibilityRole="button" style={st.monthButton}>
        <Text style={st.monthText}>{months[shown.m-1]} {shown.y}</Text>
        <ChevronDown size={15} color="#E05260"/>
      </Pressable>
      <Pressable onPress={()=>setShown(v=>move(v.y,v.m,1))} accessibilityLabel="Mes siguiente" accessibilityRole="button" style={st.arrow}><ChevronRight size={18} color={p.fg}/></Pressable>
    </View>
    <Text style={st.hint}>Tocá el mes y el año para saltar directamente a cualquier fecha, incluso dentro de varios años.</Text>
    <View style={st.week}>
      {weekdays.map((d,i)=><View key={i} style={st.cell}><Text style={st.weekday}>{d}</Text></View>)}
    </View>
    <View style={st.grid}>
      {dayCells.map((day,i)=><View key={i} style={st.cell}>
        {day!==null?(()=>{
          const iso=key(shown.y,shown.m,day);
          const active=iso===selectedDate;
          const today=iso===todayIso;
          const marked=datesWithReminders.has(iso);
          return <Pressable onPress={()=>choose(day)} accessibilityRole="button" accessibilityLabel={`Seleccionar ${day} de ${months[shown.m-1]} de ${shown.y}`}
            style={[st.dateButton,active&&st.activeDay,today&&!active&&st.currentDay]}>
            <Text style={[st.dayText,active&&{color:"#FFF"}]}>{day}</Text>
            {marked&&<View style={[st.dot,active&&{backgroundColor:"#FFF"}]}/>}
          </Pressable>;
        })():null}
      </View>)}
    </View>
    <View style={st.selected}>
      <Text style={st.selectedLabel}>Fecha seleccionada</Text>
      <Text style={st.selectedValue}>{selected.d} de {months[selected.m-1].toLowerCase()} de {selected.y}</Text>
    </View>

    <Modal visible={picker} transparent animationType="fade" onRequestClose={()=>setPicker(false)}>
      <View style={st.backdrop}><View style={st.modal}>
        <View style={st.modalHeader}>
          <View><Text style={st.kicker}>IR DIRECTAMENTE A</Text><Text style={st.title}>Mes y año</Text></View>
          <Pressable accessibilityLabel="Cerrar selector" accessibilityRole="button" onPress={()=>setPicker(false)} style={st.close}><X size={20} color={p.fg}/></Pressable>
        </View>
        <Text style={st.label}>AÑO</Text>
        <TextInput value={jumpYear} onChangeText={v=>setJumpYear(v.replace(/[^0-9]/g,"").slice(0,4))} keyboardType="number-pad" maxLength={4}
          accessibilityLabel="Año al que querés ir" selectTextOnFocus style={st.yearInput} placeholder="2027" placeholderTextColor={p.muted}/>
        <View style={st.shortcuts}>
          {[new Date().getFullYear(), new Date().getFullYear()+1, new Date().getFullYear()+5].map(y=><Pressable key={y} onPress={()=>setJumpYear(String(y))} accessibilityRole="button" style={st.shortcut}><Text style={st.shortcutText}>{y}</Text></Pressable>)}
        </View>
        <Text style={st.label}>MES</Text>
        <View style={st.monthGrid}>{months.map((m,i)=><Pressable key={m} onPress={()=>setJumpMonth(i+1)} accessibilityRole="button" accessibilityState={{selected:jumpMonth===i+1}}
          style={[st.monthTile,jumpMonth===i+1&&st.monthSelected]}>
          <Text style={[st.monthTileText,jumpMonth===i+1&&{color:"#FFF"}]}>{m.slice(0,3)}</Text>
        </Pressable>)}</View>
        {!!error&&<Text style={st.error}>{error}</Text>}
        <Pressable onPress={confirmJump} accessibilityRole="button" style={st.confirm}><Check size={17} color="#FFF"/><Text style={st.confirmText}>Ir a la fecha</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

function styles(p:{bg:string;tile:string;line:string;fg:string;muted:string}){
  return StyleSheet.create({
    container:{borderWidth:1,borderColor:p.line,backgroundColor:p.bg,borderRadius:18,padding:14,gap:13},
    header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
    sectionTitle:{fontSize:14,fontWeight:"800",color:p.fg},
    today:{borderRadius:10,paddingHorizontal:12,paddingVertical:9,backgroundColor:p.tile},
    todayText:{fontSize:11,fontWeight:"800",color:"#DB5260"},
    monthNav:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:7},
    arrow:{width:38,height:40,backgroundColor:p.tile,borderRadius:11,justifyContent:"center",alignItems:"center"},
    monthButton:{flex:1,minWidth:0,height:40,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:p.tile,borderRadius:11},
    monthText:{fontSize:13,fontWeight:"800",color:p.fg},
    hint:{fontSize:10.5,color:p.muted,lineHeight:16,textAlign:"center"},
    week:{flexDirection:"row",gap:2},
    grid:{flexDirection:"row",flexWrap:"wrap",rowGap:3},
    cell:{width:"14.285%",minHeight:40,justifyContent:"center",alignItems:"center"},
    weekday:{fontWeight:"800",fontSize:11,color:p.muted},
    dateButton:{width:35,height:37,borderRadius:11,alignItems:"center",justifyContent:"center",gap:2},
    dayText:{fontSize:12,fontWeight:"700",color:p.fg},
    activeDay:{backgroundColor:"#A70010"},
    currentDay:{borderWidth:1,borderColor:"#B6202D"},
    dot:{height:4,width:4,borderRadius:3,backgroundColor:"#CF2030"},
    selected:{borderTopWidth:1,borderColor:p.line,paddingTop:10,gap:3},
    selectedLabel:{color:p.muted,fontSize:10.5},
    selectedValue:{color:p.fg,fontSize:12.5,fontWeight:"800"},
    backdrop:{flex:1,justifyContent:"center",backgroundColor:"rgba(0,0,0,0.77)",padding:23},
    modal:{backgroundColor:p.bg,borderRadius:22,borderWidth:1,borderColor:p.line,padding:18,gap:16},
    modalHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
    kicker:{color:"#CD1C2A",fontWeight:"900",fontSize:10,letterSpacing:1.3},
    title:{fontWeight:"800",fontSize:19,color:p.fg,marginTop:5},
    close:{height:37,width:37,alignItems:"center",justifyContent:"center",borderRadius:10,backgroundColor:p.tile},
    label:{fontWeight:"800",fontSize:11,color:p.muted,letterSpacing:0.7},
    yearInput:{borderWidth:1,borderColor:p.line,borderRadius:12,paddingHorizontal:13,paddingVertical:11,color:p.fg,fontSize:17,fontWeight:"800",backgroundColor:p.tile},
    shortcuts:{flexDirection:"row",gap:8},
    shortcut:{paddingVertical:8,paddingHorizontal:13,borderWidth:1,borderColor:p.line,borderRadius:10},
    shortcutText:{color:p.fg,fontSize:11,fontWeight:"700"},
    monthGrid:{flexDirection:"row",flexWrap:"wrap",gap:8},
    monthTile:{width:"22.5%",alignItems:"center",paddingVertical:11,backgroundColor:p.tile,borderRadius:10},
    monthSelected:{backgroundColor:"#A40010"},
    monthTileText:{fontSize:12,fontWeight:"800",color:p.fg},
    error:{color:"#D95C69",fontSize:11},
    confirm:{backgroundColor:"#A50012",borderRadius:12,minHeight:45,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8},
    confirmText:{color:"#FFF",fontSize:12,fontWeight:"800"}
  });
}
