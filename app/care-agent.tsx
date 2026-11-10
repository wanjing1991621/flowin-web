'use client';
import {useRef,useState} from 'react';
import {MapPin,ExternalLink,Sparkles,RotateCcw} from 'lucide-react';

type CareJob={id:string;title:string;publisher:string;symbol:string;kind:string;salary:string;location:string;summary:string;tags:string[];distypes:string[];url:string;posted:string;reasons:string[]};
const disabilityOptions=['肢体残疾','视力残疾','听力残疾','言语残疾','智力残疾','精神残疾','多重残疾','暂不透露'];
const steps=['正在理解你的情况…','正在连接中国残联就业服务平台…','正在全网比对在招岗位…','正在核对各岗位面向的残障类型…'];

type RawJob={id:string;jobName?:string;jobType?:string;jobSalary?:string;jobMinSalary?:string|null;provinceid?:string;cityid?:string;edu?:string;exp?:string;distype?:{disType?:string}[];createTime?:string;companyInfo?:{companyName?:string}|null;jobClobOutDTO?:{jobDescript?:string}|null};

function normalizeCity(input:string){const t=input.trim();if(!t)return '';return /[市省县区]$/.test(t)?t:t+'市'}
function cleanSummary(text?:string){if(!text)return '';const t=text.replace(/【[^】]*】/g,'').replace(/\s+/g,' ').replace(/^[\d.、;；\s]+/,'').trim();return t.length>88?t.slice(0,87)+'…':t}

export default function CareAgent(){
  const [disability,setDisability]=useState(''),[city,setCity]=useState(''),[skill,setSkill]=useState('');
  const [phase,setPhase]=useState<'form'|'searching'|'done'>('form'),[step,setStep]=useState(0),[results,setResults]=useState<CareJob[]>([]),[error,setError]=useState(''),[scope,setScope]=useState('');
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  function reset(){timers.current.forEach(clearTimeout);timers.current=[];setPhase('form');setResults([]);setError('');setScope('')}
  async function search(e:{preventDefault():void}){
    e.preventDefault();
    timers.current.forEach(clearTimeout);timers.current=[];
    setError('');setPhase('searching');setStep(0);
    steps.forEach((_,i)=>timers.current.push(setTimeout(()=>setStep(i),i*850)));
    const cityName=normalizeCity(city),kw=skill.trim();
    async function queryPage(page:number,useCity:boolean){
      const params=new URLSearchParams({pageNum:String(page),pageSize:'50'});
      if(useCity&&cityName)params.set('cityid',cityName);
      const res=await fetch('https://www.cdpee.org.cn/api/app-jycy-job/querySearchJobInfo?'+params.toString());
      if(!res.ok)throw new Error('网络请求失败');
      const data=await res.json() as {data?:{records?:RawJob[]}}|null;
      return data?.data?.records??[];
    }
    async function queryPool(useCity:boolean){
      const pool:RawJob[]=[];
      for(let p=1;p<=3;p++){
        const recs=await queryPage(p,useCity);
        pool.push(...recs);
        if(recs.length<50)break;
      }
      return pool;
    }
    try{
      let records=await queryPool(true);
      let usedScope=cityName?cityName:'全国';
      if(!records.length&&cityName){records=await queryPool(false);usedScope='全国（'+cityName+'暂无匹配）';}
      let kwMiss=false;
      if(kw){
        const hit=records.filter(r=>((r.jobName??'')+(r.jobClobOutDTO?.jobDescript??'')).toLowerCase().includes(kw.toLowerCase()));
        if(hit.length)records=hit;else kwMiss=true;
      }
      const mapped=records.map(r=>{
        const distypes=[...new Set((r.distype??[]).map(d=>d.disType).filter(Boolean))] as string[];
        const title=(r.jobName??'').trim();if(!title)return null;
        const reasons:string[]=[];
        let score=0;
        if(disability&&disability!=='暂不透露'&&distypes.includes(disability)){score+=3;reasons.push('面向'+disability);}
        if(disability&&disability!=='暂不透露'&&distypes.length>=7){score+=1;reasons.push('不限残障类型');}
        if(cityName&&(r.cityid??'').includes(cityName.replace(/市$/,''))){score+=2;reasons.push('工作地点匹配');}
        if(kw&&(title+(r.jobClobOutDTO?.jobDescript??'')).toLowerCase().includes(kw.toLowerCase())){score+=2;reasons.push('技能关键词匹配');}
        const salary=r.jobSalary||(r.jobMinSalary?r.jobMinSalary+'起':'');
        return {id:r.id,title,publisher:r.companyInfo?.companyName??'企业详请见原页',symbol:title[0],kind:r.jobType??'全职',salary:salary||'薪资面议',location:[r.provinceid,r.cityid].filter(Boolean).join(' ')||'地点详见原页',summary:cleanSummary(r.jobClobOutDTO?.jobDescript??undefined),tags:[r.edu,r.exp].filter(Boolean) as string[],distypes,url:'https://www.cdpee.org.cn/job/jobDetail?id='+r.id,posted:r.createTime??'',reasons,score};
      }).filter((j):j is CareJob&{score:number}=>!!j);
      mapped.sort((a,b)=>b.score-a.score);
      const picked=mapped.slice(0,6).map(({score:_,...j})=>j);
      timers.current.push(setTimeout(()=>{setResults(picked);setScope(usedScope);setError(kwMiss?'没有找到包含「'+kw+'」的岗位，先为你推荐这些面向你情况的岗位：':'');setPhase('done');},steps.length*850+500));
    }catch{timers.current.push(setTimeout(()=>{setError('暂时连不上残联就业服务平台，请稍后重试，或直接前往原平台搜索。');setPhase('form');},1600))}
  }
  return <section className="wrap care-section care-agent-section" aria-label="AI 求职助手">
    <div className="care-agent">
      <div className="care-bot" aria-hidden="true">
        <div className="care-bot-head"><i className="care-bot-antenna"/><span className="care-bot-eye"/><span className="care-bot-eye"/>{phase==='searching'&&<i className="care-bot-scan"/>}</div>
        <div className="care-bot-body"><Sparkles size={15}/></div>
        <div className="care-bot-shadow"/>
      </div>
      <div className="care-agent-main">
        <h2><Sparkles size={19}/>小恣 AI 求职助手</h2>
        {phase==='form'&&<>
          <p className="care-agent-intro">告诉我你的情况，我会去中国残联就业服务平台实时搜寻适合你的在招岗位。</p>
          <form onSubmit={search} className="care-agent-form">
            <fieldset><legend>你的残障类型（用于匹配岗位面向人群）</legend>
              <div className="care-agent-chips">{disabilityOptions.map(d=><button type="button" key={d} aria-pressed={disability===d} className={disability===d?'active':''} onClick={()=>setDisability(disability===d?'':d)}>{d}</button>)}</div>
            </fieldset>
            <div className="care-agent-inputs">
              <label>所在城市<input value={city} onChange={e=>setCity(e.target.value)} placeholder="如：上海（可留空，搜全国）" maxLength={20}/></label>
              <label>擅长或想做的工作<input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="如：客服、设计、数据标注" maxLength={30}/></label>
            </div>
            {error&&<p role="alert" className="care-agent-error">{error}</p>}
            <button className="primary" type="submit"><Sparkles size={16}/> 开始帮我搜</button>
          </form>
        </>}
        {phase==='searching'&&<output className="care-agent-status">
          <p className="care-agent-step">{steps[step]}<span className="care-dots"><i/><i/><i/></span></p>
          <div className="care-agent-bar"><i style={{width:((step+1)/(steps.length+1))*100+'%'}}/></div>
          <p className="care-agent-hint">正在实时检索，不会使用或保存你的个人信息</p>
        </output>}
        {phase==='done'&&<div className="care-agent-results">
          {error&&<p className="care-agent-error">{error}</p>}
          <output className="care-agent-summary">{results.length?<>在{scope}为你找到 <strong>{results.length}</strong> 个匹配岗位{disability&&disability!=='暂不透露'&&<>，已优先展示面向「{disability}」的岗位</>}：</>:'这次没有找到完全匹配的岗位，可以换个关键词或城市再试试，也可以直接去残联平台浏览全部岗位。'}</output>
          {results.map(j=><article className="care-match" key={j.id}>
            <div className="care-match-top"><span className="job-icon">{j.symbol}</span><div><h3><a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a></h3><p className="care-match-meta"><span>{j.publisher}</span><span><MapPin size={12}/>{j.location}</span><span>{j.kind}</span></p></div><strong className="care-match-salary">{j.salary}</strong></div>
            {j.summary&&<p className="care-match-desc">{j.summary}</p>}
            {!!j.reasons.length&&<div className="care-match-reasons">{j.reasons.map(r=><span key={r}>{r}</span>)}</div>}
            <div className="source-bottom"><span>中国残联就业平台{j.posted?' · '+j.posted:''}</span><a href={j.url} target="_blank" rel="noopener noreferrer">查看与投递 <ExternalLink size={13}/></a></div>
          </article>)}
          <div className="care-agent-again"><button className="secondary" onClick={reset}><RotateCcw size={14}/> 重新搜一次</button><a className="care-agent-link" href="https://www.cdpee.org.cn/" target="_blank" rel="noopener noreferrer">去残联平台看全部岗位 <ExternalLink size={13}/></a></div>
        </div>}
      </div>
    </div>
  </section>;
}
