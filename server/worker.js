const limits={name:20,role:30,city:20,bio:90,about:180,tags:120};
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(/^\/(profile\/[^/]+|requirements\/new|messages(?:\/[^/]+)?)\/?$/.test(url.pathname))return env.ASSETS.fetch(new Request(new URL('/index.html',url),request));
  if(!['/api/profile','/api/registration'].includes(url.pathname))return env.ASSETS.fetch(request);
  const registration=url.pathname==='/api/registration';
  const table=registration?'registrations':'profiles';
  const fieldLimits=registration?{name:40,contact:120,direction:80,city:40,workTypes:160}:limits;
  const resultKey=registration?'registration':'profile';
  const userId=request.headers.get('oai-authenticated-user-id');
  if(!userId)return json({error:'请先登录'},401);
  try {
   if(request.method==='GET'){
    const row=await env.DB.prepare(`SELECT data FROM ${table} WHERE user_id = ?`).bind(userId).first();
    return json({[resultKey]:row?JSON.parse(row.data):null});
   }
   if(request.method!=='PUT')return json({error:'不支持此操作'},405);
   const origin=request.headers.get('origin');
   if(!origin||![url.origin,'https://flowin-home-wanjing.wanjing1991621.chatgpt.site'].includes(origin))return json({error:'请求来源不正确'},403);
   if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'格式不正确'},415);
   const raw=await request.text();
   if(raw.length>4000)return json({error:'内容过长'},413);
   let input;try{input=JSON.parse(raw)}catch{return json({error:'格式不正确'},400)}
   if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'格式不正确'},400);
   const profile={};
   for(const [key,max] of Object.entries(fieldLimits)){
    if(typeof input[key]!=='string'||input[key].trim().length>max)return json({error:'资料格式不正确'},400);
    profile[key]=input[key].trim();
   }
   if(registration){
    if(!profile.name||!profile.direction||!profile.workTypes)return json({error:'请填写姓名或昵称、职业方向和工作类型'},400);
    const contact=profile.contact;
    const valid=contact.includes('@')?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact):/^\+?[\d\s()-]+$/.test(contact)&&contact.replace(/\D/g,'').length>=7&&contact.replace(/\D/g,'').length<=15;
    if(!valid)return json({error:'请填写有效的手机号或邮箱'},400);
   }else if(!profile.name||!profile.role||!profile.city)return json({error:'请填写必填项'},400);
   await env.DB.prepare(`INSERT INTO ${table} (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).bind(userId,JSON.stringify(profile),new Date().toISOString()).run();
   return json({[resultKey]:profile});
  }catch{return json({error:'资料暂时无法保存或读取，请重试'},503)}
 }
};
