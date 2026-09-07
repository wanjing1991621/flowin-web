import {useEffect} from 'react';
import {flushSync} from 'react-dom';
import {jobs} from './opportunities';
type ToolContext={registerTool:(tool:{name:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};
export function useOpportunityTools(setInput:(v:string)=>void,setQuery:(v:string)=>void){
 useEffect(()=>{
  const context=(document as Document & {modelContext?:ToolContext}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{void Promise.resolve(context.registerTool({name:'filter_opportunities',description:'筛选首页已收录的候选项目并更新可见列表；不搜索外部平台。',inputSchema:{type:'object',properties:{query:{type:'string',maxLength:100}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){
   if(!input||typeof input!=='object'||!('query' in input)||typeof input.query!=='string'||input.query.length>100)throw new Error('query 必须是100字以内的字符串');
   const query=input.query;const result=jobs.filter(j=>query.trim().toLowerCase().split(/\s+/).every(t=>[j.title,j.summary,j.tags.join(' '),j.publisher,j.kind,'远程 短期 项目制'].join(' ').toLowerCase().includes(t)));
   flushSync(()=>{setInput(query);setQuery(query)});
   return {query,count:result.length,opportunities:result.map(j=>({id:j.id,title:j.title,url:j.url}))};
  }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return ()=>lifecycle.abort();
 },[setInput,setQuery]);
}
