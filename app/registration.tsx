import {useEffect,useRef,useState} from 'react';
import {insertRegistration,mapRegistration,RegistrationError} from './registration-submit';
import {UserRoundPlus,ArrowRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
const empty={profession:'',contact:'',direction:'',city:'',workTypes:''};
export default function Registration(){
 const [draft,setDraft]=useState(empty),[open,setOpen]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const submitting=useRef(false),completed=useRef(false);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('register')==='1')setOpen(true)},[]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(submitting.current||completed.current)return;
  submitting.current=true;setSaving(true);setError('');
  try{const payload=mapRegistration(draft);await insertRegistration(payload,{url:import.meta.env.NEXT_PUBLIC_SUPABASE_URL,key:import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY});completed.current=true;setDraft({...empty});setOpen(false);setMessage('注册成功，欢迎加入 FlowIn！')}
  catch(e){setError(e instanceof Error?e.message:'注册未能提交，请稍后重试。');if(import.meta.env.DEV)console.error('[FlowIn registration]',e instanceof RegistrationError?e.detail:e)}
  finally{submitting.current=false;setSaving(false)}
 }
 return <section className="community-panel registration-entry" aria-labelledby="registration-heading">
  <div className="registration-icon"><UserRoundPlus size={24}/></div><div className="registration-copy"><h2 id="registration-heading">用户注册</h2><p>留下你的职业方向与求职意向，开启在恣优的工作旅程。</p>{message&&<p role="status">{message}</p>}</div>
  <button className="primary" disabled={!!message} onClick={()=>{setError('');setOpen(true)}}>{message?'已提交注册':'填写注册资料'}<ArrowRight size={16}/></button>
  <Dialog open={open} onOpenChange={v=>{if(!saving)setOpen(v)}}><DialogContent className="profile-edit-dialog registration-dialog"><DialogTitle>用户注册 · 基本资料</DialogTitle><DialogDescription>请填写你的基本资料与求职意向。手机号或邮箱用于联系，不作为登录方式。</DialogDescription><form onSubmit={save}>
   {[{key:'profession',label:'职业',placeholder:'例如：产品经理、设计师、自由职业者',max:80,auto:'organization-title'}, {key:'contact',label:'手机号 / 邮箱',placeholder:'填写任意一项，手机号可包含国际区号',max:120,auto:'off'}, {key:'direction',label:'职业方向',placeholder:'例如：产品策划、设计、市场营销',max:80,auto:'organization-title'}, {key:'city',label:'所在城市（选填）',placeholder:'例如：上海',max:40,auto:'address-level2'}, {key:'workTypes',label:'工作方式',placeholder:'例如：兼职、项目合作；偏好远程',max:160,auto:'off'}].map(f=><label key={f.key}>{f.label}<input disabled={saving} required={f.key!=='city'} maxLength={f.max} autoComplete={f.auto} placeholder={f.placeholder} value={draft[f.key as keyof typeof empty]} onChange={e=>setDraft({...draft,[f.key]:e.target.value})}/></label>)}
   <p className="registration-help">职业方向与工作类型可填写多个，用顿号分隔。</p>{error&&<p role="alert">{error}</p>}<div className="profile-form-actions"><button type="button" disabled={saving} onClick={()=>setOpen(false)}>取消</button><button className="primary" type="submit" disabled={saving}>{saving?'提交中…':'提交注册'}</button></div>
  </form></DialogContent></Dialog>
 </section>
}
