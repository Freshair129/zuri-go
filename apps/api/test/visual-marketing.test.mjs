// @trace verifies FR-014-001, FR-014-002, FR-014-003, FR-014-004, FR-014-005, FR-014-007, FR-014-010
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateBrief,validateBrand,validateStage,reviewBundle,validateAsset} from '../visual-marketing/contracts.mjs';
import {getAgentRegistry,checkDelegation,TOOLS} from '../visual-marketing/registry.mjs';
import {executeProvider,localProvider,visualProvider} from '../visual-marketing/providers.mjs';
import {visualApi} from '../visual-marketing/api.mjs';
const brief={project_id:randomUUID(),brand_profile_id:randomUUID(),objective:'awareness',product:'ชา',audience:'คนทำงาน',message:'พักกับชา',channel:'facebook',format:'image',aspect_ratio:'1:1',cta:'ดูรายละเอียด'};
test('Visual Studio fails closed before schema 10 is ready',async()=>{
 const c={query:async sql=>{assert.match(sql,/visual_record_review/);assert.match(sql,/canonical_hash/);return {rows:[{ready:false}]};}};
 await assert.rejects(visualApi(c,randomUUID(),'/projects','GET',null),error=>error.code==='FEATURE_UNAVAILABLE'&&error.status===503);
});
test('AC-014-001-02 brief rejects unknown fields, impossible dates and invalid IDs',()=>{
 assert.equal(validateBrief(brief).product,'ชา');
 for(const patch of [{actor:'admin'},{due_date:'2026-02-30'},{project_id:'x'},{product:'x'.repeat(4001)},{aspect_ratio:'0:1'}])assert.throws(()=>validateBrief({...brief,...patch}));
 assert.throws(()=>validateBrand({identity:'x',shell:'bad'}));
});
test('AC-014-002-01 eight model-independent definitions and declared tools',()=>{
 const agents=getAgentRegistry();assert.equal(agents.length,8);assert.equal(new Set(agents.map(a=>a.id)).size,8);
 for(const a of agents)for(const field of ['identity','responsibility','inputSchema','outputSchema','skills','allowedTools','memoryScopes','modelPolicy','approvalRequirement'])assert.ok(a[field],field);
 for(const t of TOOLS)for(const field of ['id','name','description','inputSchema','outputSchema','requiredPermissions','networkAccess','sideEffects'])assert.notEqual(t[field],undefined);
 assert.ok(!JSON.stringify(agents).includes('api_key'));
});
test('AC-014-004-01 / AC-014-004-02 delegation depth and authority are bounded',()=>{
 const p={id:'parent',root_run_id:'root',project_id:'p',delegation_depth:1,allowed_tools:['context.read']};
 assert.equal(checkDelegation(p,{project_id:'p',root_run_id:'root',agent_id:'VIS-MKT-05',allowed_tools:['context.read']}).delegation_depth,2);
 for(const bad of [{...p,delegation_depth:2},{...p,project_id:'other'}])assert.throws(()=>checkDelegation(bad,{project_id:'p',root_run_id:'root',agent_id:'VIS-MKT-05',allowed_tools:['context.read']}));
 assert.throws(()=>checkDelegation(p,{project_id:'p',root_run_id:'root',agent_id:'VIS-MKT-05',allowed_tools:['shell']}));
});
test('AC-014-003-02 generated stage output is bounded data, never executable authority',()=>{
 assert.deepEqual(validateStage('COPY',{text:'พักกับชา',claims:[]}),{text:'พักกับชา',claims:[]});
 assert.throws(()=>validateStage('COPY',{text:'hi',tool:'shell'}));assert.throws(()=>validateStage('UNKNOWN',{text:'hi'}));
});
test('AC-014-007-01 / AC-014-007-02 QA blocks unsupported claims and does not verify nonexistent pixels',()=>{
 const b={...brief,proof_points:[],forbidden_elements:[]},brand={approved_claims:[],forbidden_claims:[]};
 const result=reviewBundle(b,brand,{COPY:{text:'cure disease',claims:['cure disease']},ART_DIRECTION:{text:'tea',claims:[]}},{});
 assert.equal(result.status,'needs_revision');assert.ok(result.blockingIssues.length);assert.ok(result.findings.some(f=>f.category==='readability'&&f.status==='not_assessed'));
});
test('AC-014-007-03 QA requires bounded source references for approved brand claims',()=>{
 const b={...brief,proof_points:[],forbidden_elements:[]},outputs={COPY:{text:'ชาอร่อย',claims:[]},ART_DIRECTION:{text:'ภาพชา',claims:[]}},assessment=Object.fromEntries(['brand_consistency','message_accuracy','offer_accuracy','cta_clarity','channel_suitability','policy_safety','hallucinated_claims','duplicate_concepts'].map(check=>[check,true]));
 const missing=reviewBundle(b,{approved_claims:['ชาออร์แกนิก'],forbidden_claims:[]},outputs,assessment);
 assert.equal(missing.status,'needs_revision');assert.ok(missing.blockingIssues.some(f=>f.category==='claim_source_refs'));
 const valid=reviewBundle(b,{approved_claims:['ชาออร์แกนิก'],source_refs:['https://example.test/brand-proof'],forbidden_claims:[]},outputs,assessment);
 assert.equal(valid.status,'pass');assert.deepEqual(valid.findings.find(f=>f.category==='claim_source_refs').evidenceRefs,['https://example.test/brand-proof']);
 const manual=reviewBundle(b,{approved_claims:[],forbidden_claims:[]},outputs,assessment);
 assert.equal(manual.status,'pass');assert.equal(manual.findings.some(f=>f.category==='claim_source_refs'),false);
 const invalid=reviewBundle(b,{approved_claims:['ชาออร์แกนิก'],source_refs:['  '],forbidden_claims:[]},outputs,assessment);
 assert.equal(invalid.status,'needs_revision');
});
test('AC-014-005-01 / AC-014-005-02 authorized fallback only for definite safe failures',async()=>{
 const calls=[];const adapters={one:{completeStructured:async()=>{calls.push('one');throw Object.assign(Error('down'),{code:'UNAVAILABLE'});}},two:{completeStructured:async()=>{calls.push('two');return {output:{text:'ok',claims:[]},provider:'two'};}}};
 const policy={primaryModel:'one',fallbackModels:['two'],timeoutMs:100,maxRetries:1};const grant={providers:['one','two'],expires_at:new Date(Date.now()+60000).toISOString()};
 const out=await executeProvider({stage:'COPY'},policy,grant,undefined,adapters);assert.equal(out.output.text,'ok');assert.deepEqual(calls,['one','two']);assert.deepEqual(out.attemptRecords.map(a=>a.status),['failed','succeeded']);
 adapters.one.completeStructured=async()=>{throw Object.assign(Error('no'),{code:'DENIED'});};calls.length=0;
 await assert.rejects(executeProvider({stage:'COPY'},policy,grant,undefined,adapters),{code:'DENIED'});assert.deepEqual(calls,[]);
 await assert.rejects(executeProvider({stage:'COPY'},policy,{...grant,providers:[]},undefined,adapters),{code:'PROVIDER_DENIED'});
});
test('AC-014-005-03 provider configuration is opt-in and loopback-only; visual port advertises unavailable',()=>{
 assert.equal(localProvider({}),null);assert.throws(()=>localProvider({ZURI_GO_VISUAL_MODEL:'x',ZURI_GO_VISUAL_ENDPOINT:'https://example.com'}));
 for(const method of ['generateImage','editImage','generateVariation','getJob','cancelJob'])assert.throws(()=>visualProvider()[method]({}),{code:'UNSUPPORTED'});
});
test('AC-014-010-02 asset metadata refuses paths, binaries and forged checksum',()=>{
 assert.throws(()=>validateAsset({object_key:'../private',mime_type:'text/plain',checksum:'bad'}));
 assert.throws(()=>validateAsset({bytes:'secret'}));
});
test('NFR-014-001 non-cooperative adapters still respect deadline; malformed output and ambiguous submission never retry',async()=>{
 const grant={providers:['one'],expires_at:new Date(Date.now()+10000).toISOString()},policy={primaryModel:'one',timeoutMs:10,maxRetries:0};
 const started=Date.now();await assert.rejects(executeProvider({stage:'COPY'},policy,grant,undefined,{one:{completeStructured:()=>new Promise(resolve=>setTimeout(()=>resolve({output:{text:'late'}}),100))}}),{code:'TIMEOUT'});assert.ok(Date.now()-started<90);
 for(const code of ['SUBMISSION_UNKNOWN','DENIED','PROVIDER_OUTPUT_INVALID']){let calls=0;await assert.rejects(executeProvider({stage:'COPY'},{...policy,maxRetries:1},grant,undefined,{one:{completeStructured:async()=>{calls++;throw Object.assign(Error('safe'),{code});}}}),{code});assert.equal(calls,1);}
});
