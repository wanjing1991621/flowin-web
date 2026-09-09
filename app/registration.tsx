import {useEffect,useState} from 'react';
import {UserRoundPlus,ArrowRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
const empty={name:'',contact:'',direction:'',city:'',workTypes:''};
export default function Registration(){
 const [record,setRecord]=useState<typeof empty|null>(null),[draft,setDraft]=useState(empty),[open,setOpen]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 async function load(){setLoading(true);setError('');try{const r=await fetch('/api/registration',{cache:'no-store'});if(!r.ok)throw new Error('注册资料暂时无法读取，请重试。');const data=await r.json() as {registration:typeof empty;error?:string};setRecord(data.registration)}catch(e){setError((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setError('');try{const r=await fetch('/api/registration',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});const data=await r.json() as {registration:typeof empty;error?:string};if(!r.ok)throw new Error(data.error||'保存未成功，请重试。');setRecord(data.registration);setOpen(false);setMessage('注册资料已保存，可随时回来修改。')}catch(e){setError((e as Error).message||'保存未成功，请重试。')}finally{setSaving(false)}}
 return <section className="community-panel registration-entry" aria-labelledby="registration-heading">
  <div className="registration-icon"><UserRoundPlus size={24}/></div><div className="registration-copy"><h2 id="registration-heading">用户注册</h2><p>{record?'注册资料已留存，继续完善你的求职意向。':'留下你的职业方向与求职意向，开启在恣优的工作旅程。'}</p>{record&&<p className="registration-summary">{record.name} · {record.direction}{record.city?' · '+record.city:''} · {record.workTypes}</p>}{message&&<p role="status">{message}</p>}{error&&!open&&<p role="alert">{error} <button onClick={()=>void load()}>重新读取</button></p>}</div>
  <button className="primary" disabled={loading||!!error&&!open} onClick={()=>{setDraft(record?{...record}:empty);setError('');setMessage('');setOpen(true)}}>{loading?'读取中…':record?'编辑注册资料':'填写注册资料'}<ArrowRight size={16}/></button>
  <Dialog open={open} onOpenChange={v=>{if(!saving)setOpen(v)}}><DialogContent className="profile-edit-dialog registration-dialog"><DialogTitle>用户注册 · 基本资料</DialogTitle><DialogDescription>资料保存到当前账号。手机号或邮箱仅作联系方式，不会公开，也不作为新的登录方式。</DialogDescription><form onSubmit={save}>
   {[{key:'name',label:'姓名或昵称',placeholder:'你希望大家如何称呼你',max:40,auto:'nickname'}, {key:'contact',label:'手机号 / 邮箱',placeholder:'填写任意一项，手机号可包含国际区号',max:120,auto:'off'}, {key:'direction',label:'职业方向',placeholder:'例如：产品策划、设计、市场营销',max:80,auto:'organization-title'}, {key:'city',label:'所在城市（选填）',placeholder:'例如：上海',max:40,auto:'address-level2'}, {key:'workTypes',label:'想找什么类型的工作',placeholder:'例如：兼职、项目合作；偏好远程',max:160,auto:'off'}].map(f=><label key={f.key}>{f.label}<input required={f.key!=='city'} maxLength={f.max} autoComplete={f.auto} placeholder={f.placeholder} value={draft[f.key as keyof typeof empty]} onChange={e=>setDraft({...draft,[f.key]:e.target.value})}/></label>)}
   <p className="registration-help">职业方向与工作类型可填写多个，用顿号分隔。</p>{error&&<p role="alert">{error}</p>}<div className="profile-form-actions"><button type="button" disabled={saving} onClick={()=>setOpen(false)}>取消</button><button className="primary" type="submit" disabled={saving}>{saving?'保存中…':'保存注册资料'}</button></div>
  </form></DialogContent></Dialog>
 </section>
}
