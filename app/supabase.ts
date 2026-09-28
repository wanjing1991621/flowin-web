import {createClient} from '@supabase/supabase-js';
export const supabase=createClient(import.meta.env.NEXT_PUBLIC_SUPABASE_URL,import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export type PublicProfile={id:string;name:string;avatar_url?:string;headline?:string;bio?:string;city?:string;skills?:string[]|string;xiaohongshu_url?:string;bilibili_url?:string;jike_url?:string;wechat_id?:string;wechat_qr_url?:string;wechat_public?:boolean};
export type Post={id:string;user_id:string;content:string;status:string;created_at:string};
export type Requirement={id:string;user_id:string;title:string;description:string;type?:string;work_mode?:string;budget_min?:number;budget_max?:number;budget_negotiable?:boolean;location?:string;remote?:boolean;duration?:string;experience_level?:string;skills?:string[]|string;deliverables?:string;company_name?:string;contact_note?:string;deadline?:string;created_at:string};
const hiddenTestUserIds=new Set(['08008609-bb9c-4290-b5ab-3e87ec91f68c']);
export function isHiddenTestUser(id?:string|null){return !!id&&hiddenTestUserIds.has(id)}
export function skillList(value?:string[]|string){return Array.isArray(value)?value:typeof value==='string'?value.split(/[、,，]/).map(s=>s.trim()).filter(Boolean):[]}
export async function profilesFor(ids:string[]){const unique=[...new Set(ids)].filter(id=>!isHiddenTestUser(id));if(!unique.length)return {} as Record<string,PublicProfile>;const {data,error}=await supabase.from('profiles').select('id,name,avatar_url,headline,bio,city,skills').in('id',unique);if(error)throw error;return Object.fromEntries((data??[]).filter(p=>!isHiddenTestUser(p.id)).map(p=>[p.id,p])) as Record<string,PublicProfile>}
export function dateLabel(value:string){return new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
export const publishUrl='/?page=publish';
export const profileUrl=(id:string)=>'/?page=profile&user='+encodeURIComponent(id);
export const messagesUrl=(id?:string)=>id?'/?page=messages&conversation='+encodeURIComponent(id):'/?page=messages';
export async function ensureProfile(user:{id:string;user_metadata?:Record<string,unknown>}){const {data,error}=await supabase.from('profiles').select('id').eq('id',user.id).maybeSingle();if(error)throw error;if(!data){const {error}=await supabase.from('profiles').upsert({id:user.id,name:String(user.user_metadata?.name||'新伙伴')},{onConflict:'id',ignoreDuplicates:true});if(error)throw error}}
