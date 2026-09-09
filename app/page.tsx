'use client';
import {useState} from 'react';
import {Search,ArrowRight,MapPin,Clock3,UserRound,Bookmark,X,ExternalLink} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {jobs,opportunitySources} from './opportunities';
import {useOpportunityTools} from './use-opportunity-tools';
const tags=['AI产品经理','UI/UX设计','前端开发','品牌营销','法律','财务'];
export default function Home(){
const [input,setInput]=useState(''),[query,setQuery]=useState(''),[saved,setSaved]=useState<string[]>([]),[notice,setNotice]=useState('');
useOpportunityTools(setInput,setQuery);
const filtered=jobs.filter(j=>query.trim().toLowerCase().split(/\s+/).every(t=>[j.title,j.summary,j.tags.join(' '),j.publisher,j.kind,j.location??'远程'].join(' ').toLowerCase().includes(t)));
function search(value:string){setInput(value);setQuery(value);document.getElementById('opportunities')?.scrollIntoView({behavior:'smooth',block:'start'});}
return <>
<div className="topbar"><div className="wrap top-inner"><span>AI时代，让自由成为一种工作方式</span><div className="top-actions"><button onClick={()=>setNotice('当前无需注册即可浏览。申请与沟通请在原平台完成。')}>登录</button><button className="register" onClick={()=>{window.location.href='/?page=me&register=1'}}>注册</button></div></div></div>
<header className="header"><div className="wrap nav-inner"><a className="brand" href="#" aria-label="恣优 FlowIn 首页"><span className="brand-mark"/><span className="brand-cn">恣优</span><span className="brand-en">FlowIn</span></a><nav aria-label="主导航"><a className="active" href="#">首页</a><a href="#opportunities">项目机会</a><a href="/?page=community">人才社区</a><a className="mobile-me" href="/?page=me">我</a><button onClick={()=>setNotice('关于我们页面即将开放。')}>关于我们</button></nav><div className="nav-end"><button className="publish" onClick={()=>setNotice('项目发布功能即将开放。当前机会来自已核对的第三方公开页面。')}>发布项目</button><a className="avatar" href="/?page=me" aria-label="我的主页"><UserRound size={25}/></a></div></div></header>
<main><section className="hero"><div className="hero-art" role="img" aria-label="蓝色透明水波圆环，恣优品牌视觉"/><div className="wrap hero-inner"><div className="hero-copy"><h1>AI时代，<br/>让自由成为一种工作方式</h1><p>恣优 FlowIn 是一个项目机会发现平台，<br/>为自由职业者、OPC 发现并精选项目机会。</p><form className="search-box" onSubmit={e=>{e.preventDefault();search(input)}}><label className="sr-only" htmlFor="search">搜索已收录的项目、技能或发布方</label><input id="search" value={input} onChange={e=>setInput(e.target.value)} placeholder="搜索项目、技能、行业或公司…"/><button type="submit"><Search size={18}/> 搜索</button></form><div className="hot-tags"><span>热门搜索：</span>{tags.map(t=><button key={t} onClick={()=>search(t==='前端开发'?'前端':t)}>{t}</button>)}<button onClick={()=>search('')}>全部标签 ›</button></div><div className="hero-actions"><a className="primary" href="#opportunities">探索项目机会</a></div></div></div></section>
<section className="wrap opportunities" id="opportunities"><div className="section-heading"><div><h2>{query?'“'+query+'”的项目机会':'精选项目机会'}</h2><p>人工核对来源 · 前往原平台查看与沟通</p></div><button className="all-projects" onClick={()=>search('')}>查看全部项目 <ArrowRight size={16}/></button></div>
{query&&<div className="search-status" role="status">找到 {filtered.length} 条已收录机会<button onClick={()=>search('')}><X size={14}/>清除筛选</button></div>}
<div className="job-grid">{filtered.map((j,i)=><article className="job-card" key={j.id}><div className="card-source"><span className="pill">{j.badge??'候选 · 待审核'}</span><span>{j.publisher}</span></div><div className="job-title"><span className={'job-icon icon-'+i%4}>{j.symbol}</span><h3><a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a></h3></div><div className="job-meta"><span><MapPin size={12}/>{j.location??'远程'}</span><span><Clock3 size={12}/>{j.period}</span></div><p className="job-description">{j.summary}</p><div className="skill-tags">{j.tags.map(t=><span key={t}>{t}</span>)}</div><div className="compensation"><strong>{j.salary}</strong><button className={saved.includes(j.id)?'bookmark saved':'bookmark'} aria-pressed={saved.includes(j.id)} aria-label={(saved.includes(j.id)?'取消收藏':'收藏')+j.title} onClick={()=>setSaved(saved.includes(j.id)?saved.filter(id=>id!==j.id):[...saved,j.id])}><Bookmark size={17}/></button></div><div className="source-bottom"><span>{j.sourceLabel??'程序员客栈 · 09/07 核对'}</span><a href={j.url} target="_blank" rel="noopener noreferrer">前往原平台 <ExternalLink size={13}/></a></div><p className="card-note">{j.note}</p>{j.details&&<button className="profile-text-link" onClick={()=>setNotice(j.title+'\n\n'+j.details!.join('\n\n'))}>查看职位详情 <ArrowRight size={14}/></button>}</article>)}</div>
{!filtered.length&&<div className="empty-results"><Search size={28}/><h3>这个方向的机会还在整理中</h3><p>暂时没有符合条件的已核对机会。试试其他关键词，或查看全部项目。</p><button className="secondary" onClick={()=>search('')}>查看全部项目</button></div>}
<div className="opportunity-source-links">{opportunitySources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.title}</strong><p>{source.description}</p></div><span>查看更多机会 <ExternalLink size={15}/></span></a>)}</div><div className="verification-note">包含已核对项目与用户推荐链接，详情核对情况见各卡片。职位状态以原平台为准，沟通可能需要登录。</div></section></main>
<footer className="wrap footer"><span>恣优 FlowIn</span><span>让经验被看见，让工作更自由。</span><span>首页预览 · 2026</span></footer>
<Dialog open={!!notice} onOpenChange={open=>{if(!open)setNotice('')}}><DialogContent><DialogTitle>恣优 FlowIn</DialogTitle><DialogDescription style={{whiteSpace:'pre-line',maxHeight:'65vh',overflowY:'auto'}}>{notice}</DialogDescription></DialogContent></Dialog>
</>;}




