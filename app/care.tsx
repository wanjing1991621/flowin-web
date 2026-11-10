'use client';
import {useState} from 'react';
import {HeartHandshake,MapPin,Bookmark,ExternalLink,Ear,Eye,Accessibility,MessageSquareText,ShieldCheck,GraduationCap,Scale,Mail} from 'lucide-react';
import {Header} from './social-ui';
import {careJobs} from './care-jobs';
import CareAgent from './care-agent';

const disabilityTypes=[
  {key:'肢体障碍',icon:Accessibility,tips:['优先选择支持远程、居家办公的岗位，通勤不再是门槛','面试前可与企业确认无障碍通道、电梯与办公楼层安排','项目制、兼职合作灵活，可按自己的节奏安排工作与康复']},
  {key:'视力障碍',icon:Eye,tips:['本站页面支持屏幕阅读器朗读，按钮均有文字标签','内容运营、客服、编程、有声演播等岗位对视障伙伴更友好','可借助读屏软件与语音工具完成绝大多数线上协作']},
  {key:'听力障碍',icon:Ear,tips:['文字沟通为主的远程岗位（设计、开发、文案）适配度高','可提前与企业约定以文字会议、即时通讯替代电话沟通','在线接单、按交付结算的合作模式减少沟通成本']},
  {key:'言语障碍',icon:MessageSquareText,tips:['书面表达能力是核心竞争力，可重点展示作品与案例','多数线上协作以文字为主，言语沟通并非必需','面试可申请以文字或手语翻译辅助的方式进行']},
];
const resources=[
  {title:'中国残疾人就业创业网络服务平台',description:'中国残联主办的官方平台：残障专属岗位、职业培训、政策咨询。',url:'https://www.cdpee.org.cn/',icon:ShieldCheck},
  {title:'中国残疾人联合会',description:'就业政策、残障权益保障与各地残联服务信息。',url:'https://www.cdpf.org.cn/',icon:Scale},
  {title:'职业技能培训',description:'在官方平台报名免费职业技能培训，提升就业竞争力。',url:'https://www.cdpee.org.cn/',icon:GraduationCap},
];
export default function Care(){
  const [type,setType]=useState('肢体障碍'),[saved,setSaved]=useState<string[]>([]);
  const active=disabilityTypes.find(t=>t.key===type)??disabilityTypes[0];
  return <>
  <Header active="关爱残障群体"/>
  <main className="care-page">
    <section className="care-hero"><div className="wrap care-hero-inner">
      <span className="care-kicker"><HeartHandshake size={16}/>关爱残障群体</span>
      <h1>每一种能力，<br/>都值得被看见</h1>
      <p>我们相信，残障从来不是能力的边界。这里汇集了中国残联就业服务平台的在招岗位，每一个都明确标注了面向的残障类型，并为你准备了无障碍求职支持。</p>
      <div className="hero-actions"><a className="primary" href="#care-agent">让 AI 帮我搜</a><a className="secondary" href="#care-jobs">浏览在招岗位</a></div>
    </div></section>

    <div id="care-agent"><CareAgent/></div>

    <section className="wrap care-section" id="care-jobs">
      <div className="section-heading"><div><h2>残联平台在招岗位</h2><p>来自中国残疾人就业创业网络服务平台 · 均已标注面向的残障类型</p></div></div>
      <div className="job-grid care-job-grid">{careJobs.map((j,i)=><article className="job-card" key={j.id}>
        <div className="card-source"><span className="care-friendly-pill"><ShieldCheck size={12}/>残联官方平台</span><span>{j.publisher}</span></div>
        <div className="job-title"><span className={'job-icon icon-'+i%4}>{j.symbol}</span><h3><a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a></h3></div>
        <div className="job-meta"><span><MapPin size={12}/>{j.location}</span><span>{j.kind}</span></div>
        <p className="job-description">{j.summary||'岗位详情请前往残联就业服务平台查看。'}</p>
        <div className="skill-tags">{j.tags.map(t=><span key={t}>{t}</span>)}</div>
        <div className="compensation"><strong>{j.salary}</strong><button className={saved.includes(j.id)?'bookmark saved':'bookmark'} aria-pressed={saved.includes(j.id)} aria-label={(saved.includes(j.id)?'取消收藏':'收藏')+j.title} onClick={()=>setSaved(saved.includes(j.id)?saved.filter(id=>id!==j.id):[...saved,j.id])}><Bookmark size={17}/></button></div>
        {!!j.distypes.length&&<p className="card-note">面向：{j.distypes.join('、')}</p>}
        <div className="source-bottom"><span>中国残联就业平台{j.posted?' · '+j.posted:''}</span><a href={j.url} target="_blank" rel="noopener noreferrer">查看与投递 <ExternalLink size={13}/></a></div>
      </article>)}</div>
      <p className="verification-note">以上岗位信息来自中国残疾人就业创业网络服务平台（中国残联主办），收录时间 2026-11-10。岗位状态、薪资与无障碍安排以原平台实时信息为准，投递需前往原平台。</p>
    </section>

    <section className="wrap care-section">
      <div className="section-heading"><div><h2>无障碍求职指南</h2><p>按你的情况，找到更合适的方向</p></div></div>
      <div className="care-type-tabs" role="tablist" aria-label="残障类型">{disabilityTypes.map(t=>{const Icon=t.icon;return <button key={t.key} role="tab" aria-selected={type===t.key} className={type===t.key?'active':''} onClick={()=>setType(t.key)}><Icon size={16}/>{t.key}</button>})}</div>
      <div className="care-tips" role="tabpanel">{active.tips.map((tip,i)=><div className="care-tip" key={tip}><span>{i+1}</span><p>{tip}</p></div>)}</div>
    </section>

    <section className="wrap care-section">
      <div className="section-heading"><div><h2>政策与官方资源</h2><p>权威渠道，真实可靠</p></div></div>
      <div className="care-resources">{resources.map(r=>{const Icon=r.icon;return <a key={r.title+r.description} href={r.url} target="_blank" rel="noopener noreferrer"><Icon size={22}/><div><strong>{r.title}</strong><p>{r.description}</p></div><span className="care-resource-go">前往 <ExternalLink size={13}/></span></a>})}</div>
    </section>

    <section className="wrap care-section">
      <div className="care-contact"><Mail size={20}/>
        <p>如果你是企业或机构，愿意为残障伙伴提供工作机会，欢迎联系我们，我们会协助你发布岗位信息。</p>
        <a href="/?page=feedback">联系我们</a>
      </div>
    </section>
  </main>
  <footer className="wrap footer"><span>恣优 FlowIn</span><span>让经验被看见，让工作更自由。</span><span>关爱残障群体 · 2026</span></footer>
  </>;
}
