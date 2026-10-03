// @trace implements FR-014-002, FR-014-004
import {fail} from './contracts.mjs';
const roles=[
 ['Visual Marketing Lead','วางแผนงาน','BriefSnapshot','StagePlan',['planning','delegation'],['context.read','artifact.read'],['run','project'],'human_start'],
 ['Audience Researcher','ตรวจหลักฐานผู้ชม','BriefSnapshot','ResearchFindings',['source_assessment'],['context.read'],['run','campaign'],'no_external_fetch'],
 ['Creative Strategist','วางกลยุทธ์และแนวคิด','ResearchFindings','StrategyConcept',['positioning','hooks'],['context.read','artifact.read'],['run','brand','campaign'],'strategy_gate'],
 ['Copywriter','เขียนข้อความจากหลักฐาน','StrategyConcept','CopyDraft',['copywriting'],['context.read','artifact.read'],['run','brand'],'final_review'],
 ['Art Director','กำหนดทิศทางภาพ','CopyDraft','VisualPrompt',['art_direction'],['context.read','artifact.read'],['run','brand'],'final_review'],
 ['Visual Designer','เตรียม visual prompt และภาพ','VisualPrompt','AssetResult',['generation','variants'],['asset.generate','asset.store'],['run'],'provider_grant'],
 ['Creative Reviewer','ตรวจคุณภาพแบบมีหลักฐาน','ArtifactBundle','QAResult',['verification'],['context.read','artifact.read'],['run','brand'],'cannot_approve'],
 ['Performance Analyst','ตีความผลการตลาด','ObservationRefs','LearningDraft',['metric_interpretation'],['analytics.read'],['campaign','performance'],'human_acceptance']
];
export const getAgentRegistry=(policy={})=>roles.map((r,i)=>({id:`VIS-MKT-0${i+1}`,identity:r[0],responsibility:r[1],inputSchema:{type:'object',name:r[2]},outputSchema:{type:'object',name:r[3]},skills:r[4],allowedTools:r[5],memoryScopes:r[6],approvalRequirement:r[7],modelPolicy:{primaryModel:policy.primaryModel||null,fallbackModels:policy.fallbackModels||[],timeoutMs:25000,maxRetries:1,costBudget:null},available:i!==7}));
export const TOOLS=[['context.read','READ',false],['artifact.read','READ',false],['asset.store','WRITE',false],['asset.generate','EXTERNAL_ACTION',true],['analytics.read','READ',false]].map(([id,sideEffects,networkAccess])=>({id,name:id,description:id==='analytics.read'?'Phase F; unavailable':'Scoped Visual Marketing tool',inputSchema:{type:'object',additionalProperties:false,properties:{project_id:{type:'string',format:'uuid'}}},outputSchema:{type:'object'},requiredPermissions:[id],networkAccess,sideEffects}));
export function checkDelegation(parent,child,maxDepth=2){
 const agent=getAgentRegistry().find(a=>a.id===child.agent_id);
 if(!agent||!Number.isInteger(maxDepth)||maxDepth<0||maxDepth>4||parent.delegation_depth>=maxDepth||parent.project_id!==child.project_id||parent.root_run_id!==child.root_run_id||child.id===parent.id)fail('DELEGATION_DENIED',403);
 if((child.allowed_tools||[]).some(t=>!parent.allowed_tools.includes(t)||!agent.allowedTools.includes(t)))fail('TOOL_DENIED',403);
 return {...child,parent_run_id:parent.id,delegation_depth:parent.delegation_depth+1};
}
export const STAGE_AGENT={RESEARCH:'VIS-MKT-02',STRATEGY:'VIS-MKT-03',CONCEPT:'VIS-MKT-03',COPY:'VIS-MKT-04',ART_DIRECTION:'VIS-MKT-05',GENERATION:'VIS-MKT-06',QA:'VIS-MKT-07'};
