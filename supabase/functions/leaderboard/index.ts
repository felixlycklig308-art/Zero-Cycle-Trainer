import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
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
  const body=await req.json().catch(()=>({}));
  if(body?.action==='set-username'){
   const username=String(body.username||'').trim();
   if(!/^[a-zA-Z0-9_ -]{3,24}$/.test(username))return reply({error:"Använd 3–24 tecken: bokstäver, siffror, mellanslag, _ eller -"},400);
   const {error:saveError}=await admin.from("profiles").upsert({id:user.id,username},{onConflict:"id"});
   if(saveError)return reply({error:saveError.code==='23505'?"Namnet är upptaget. Välj ett annat.":"Kunde inte spara spelarnamnet."},409);
   return reply({username});
  }
  const {data:scores,error}=await admin.from("player_scores").select("user_id,total_points,current_streak,best_streak,correct_answers").order("total_points",{ascending:false}).order("correct_answers",{ascending:false}).limit(100);
  if(error){console.error("Leaderboard query failed",error.code);return reply({error:"Could not load leaderboard"},500)}
  const ids=(scores||[]).map(s=>s.user_id);
  let names=new Map<string,string>();
  if(ids.length){const {data:profiles,error:profileError}=await admin.from("profiles").select("id,username").in("id",ids);if(profileError)console.error("Leaderboard profile lookup failed",profileError.code);else names=new Map((profiles||[]).map(p=>[p.id,p.username]));}
  const leaderboard=(scores||[]).map((s,i)=>({rank:i+1,username:names.get(s.user_id)||"Spelare",total_points:s.total_points,best_streak:s.best_streak,correct_answers:s.correct_answers,is_you:s.user_id===user.id}));
  const {data:own,error:ownError}=await admin.from("player_scores").select("total_points,current_streak,best_streak,correct_answers").eq("user_id",user.id).maybeSingle();
  if(ownError)console.error("Own score lookup failed",ownError.code);
  return reply({leaderboard,my_score:own||{total_points:0,current_streak:0,best_streak:0,correct_answers:0}});
 }catch(error){console.error("Leaderboard error",error instanceof Error?error.message:"unknown");return reply({error:"Request failed"},500)}
});
