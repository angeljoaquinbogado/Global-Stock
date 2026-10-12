import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const headers = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'"
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function documentPage(title:string,body:string,form="") {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Global Stock</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08080a;color:#fafafa;font:16px system-ui,sans-serif}main{max-width:440px;margin:20px;padding:32px;border:1px solid #29292e;border-radius:24px;background:#17171b}h1{font-size:24px}p{line-height:1.65;color:#bfc0ca}button{background:#990012;color:#fff;border:0;padding:15px 18px;border-radius:12px;cursor:pointer;font:600 14px system-ui}a{color:#ff8a9b}</style>
  </head><body><main><h1>${title}</h1><p>${body}</p>${form}<p><a href="/legal/privacy">Política de privacidad</a></p></main></body></html>`;
}

export async function GET(request:NextRequest) {
  const token=request.nextUrl.searchParams.get("token") ?? "";
  if(!uuid.test(token))return new Response(documentPage("Enlace no válido","Pedí un nuevo correo o gestioná la baja desde Configuración."),{status:400,headers});
  // Confirmation page first: link-preview bots may GET the link without
  // the person's intention. One-click List-Unsubscribe uses POST instead.
  const action="/api/newsletter/unsubscribe?token="+encodeURIComponent(token);
  return new Response(documentPage("Dejar de recibir novedades",
    "La baja es gratuita. No afecta tu cuenta, compras ni correos de seguridad.",
    `<form action="${action}" method="post"><button type="submit">Confirmar baja gratuita</button></form>`),
    {headers});
}

export async function POST(request:NextRequest) {
  const token=request.nextUrl.searchParams.get("token") ?? "";
  if(!uuid.test(token))return new Response(documentPage("Enlace no válido","No pudimos validar el enlace de baja."),{status:400,headers});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!publishable)return new Response(documentPage("Intentá más tarde","No pudimos conectar con el servicio de preferencias."),{status:503,headers});
  const client=createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {error}=await client.rpc("global_stock_newsletter_unsubscribe",{p_token:token});
  if(error)return new Response(documentPage("Intentá más tarde","No pudimos completar la solicitud. Volvé a intentarlo."),{status:503,headers});
  // Same success response even if token was previously used, to avoid
  // confirming whether a particular email ever subscribed.
  return new Response(documentPage("Baja procesada","Ya no vas a recibir novedades promocionales de Global Stock. Tu cuenta sigue funcionando normalmente."),{headers});
}
