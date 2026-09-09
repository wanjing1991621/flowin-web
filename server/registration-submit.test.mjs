import {test} from 'node:test';
import assert from 'node:assert/strict';
import {insertRegistration,mapRegistration} from '../app/registration-submit.ts';
const config={url:'https://example.supabase.co',key:'sb_publishable_test'};
test('registration only inserts, asks for no rows, and uses a publishable key',async()=>{
 let calls=0;
 await insertRegistration({verified_column:'test'},config,async(url,options)=>{
  calls++;assert.equal(String(url),'https://example.supabase.co/rest/v1/FlowIn%20registrations');
  assert.equal(options.method,'POST');assert.equal(options.headers.Prefer,'return=minimal');assert.equal(options.headers.apikey,config.key);assert.equal(options.headers.Authorization,undefined);
  assert.deepEqual(JSON.parse(options.body),{verified_column:'test'});return new Response(null,{status:201});
 });assert.equal(calls,1);
});
test('denied inserts and duplicates produce readable errors and retain diagnostics',async()=>{
 for(const [status,code,message] of [[403,'42501','权限'],[409,'23505','已提交']]){
  await assert.rejects(()=>insertRegistration({},config,async()=>Response.json({code,message:'database diagnostic'},{status})),e=>{assert.match(e.message,new RegExp(message));assert.equal(e.detail.code,code);return true});
 }
});
test('mapping uses only verified columns and secret keys never result in a request',async()=>{
 assert.deepEqual(mapRegistration({profession:'设计师',contact:'a@b.co',direction:'产品',city:'上海',workTypes:'远程'}),{'联系方式':'a@b.co','城市':'上海','职业':'设计师','职业方向':'产品','工作方式':'远程'});
 await assert.rejects(()=>insertRegistration({},{...config,key:'sb_secret_not_allowed'},async()=>assert.fail('must not send')),/配置/);
});
