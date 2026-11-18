import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const authorization=req.headers.get("Authorization");
  if(!authorization?.startsWith("Bearer "))return reply({error:"Login required"},401);
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!service)return reply({error:"Server configuration missing"},500);
  const auth=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
  const {data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return reply({error:"Invalid session"},401);
  const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const body=await req.json().catch(()=>null);
  if(body?.action==="load"){
   const {data,error}=await admin.from("player_progress").select("progress,updated_at").eq("user_id",user.id).maybeSingle();
   if(error){console.error("Progress load failed",error.code);return reply({error:"Could not load progress"},500)}
   return reply({progress:data?.progress||null,updated_at:data?.updated_at||null});
  }
  if(body?.action==="save"){
   const progress=body.progress;
   if(!progress||typeof progress!=="object"||Array.isArray(progress)||JSON.stringify(progress).length>200000)return reply({error:"Invalid progress"},400);
   const {error}=await admin.from("player_progress").upsert({user_id:user.id,progress,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error){console.error("Progress save failed",error.code);return reply({error:"Could not save progress"},500)}
   return reply({saved:true});
  }
  return reply({error:"Invalid action"},400);
 }catch(error){console.error("Progress error",error instanceof Error?error.message:"unknown");return reply({error:"Request failed"},500)}
});
