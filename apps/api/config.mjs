import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export const directory=fileURLToPath(new URL('.',import.meta.url));
export function config(){
 let local={};if(process.env.VERCEL!=='1')try{local=JSON.parse(readFileSync(new URL('../../.local/config.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 return {...local,businessId:process.env.ZURI_GO_BUSINESS_ID||local.businessId,port:Number(process.env.ZURI_GO_PORT||local.port||4319),databaseUrl:process.env.ZURI_GO_DATABASE_URL||local.databaseUrl,adminUrl:process.env.ZURI_GO_ADMIN_URL||local.adminUrl};
}
