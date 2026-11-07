import type{AdminUser,TotpSecret}from'../types'
import{getSupabase,fail,failAuth,requireSupabase}from'./client'

const UNLOCK_KEY='acvit_unlock'
const ACCESS_KEY=(import.meta.env.VITE_ADMIN_ACCESS_KEY as string|undefined)||'admin@17'

interface AuthUserLike{id:string;email?:string;user_metadata?:Record<string,unknown>}
export interface AuthSnapshot{user:AdminUser|null;unlocked:boolean;ready:boolean;totpEnabled?:boolean;}
export type LoginOutcome={status:'admin'}|{status:'setup';email:string}|{status:'totp_enrollment';email:string}|{status:'totp_verification';email:string}

const readUnlocked=()=>{
 try{return sessionStorage.getItem(UNLOCK_KEY)==='1'}catch{return false}
}

let snapshot:AuthSnapshot={user:null,unlocked:readUnlocked(),ready:false}
const subs=new Set<()=>void>()

export const getAuthSnapshot=()=>snapshot
export const onAuthChange=(f:()=>void)=>{subs.add(f);return()=>{subs.delete(f)}}

function publish(next:Partial<AuthSnapshot>){
 const merged={...snapshot,...next}
 if(
  merged.user?.id===snapshot.user?.id&&
  merged.user?.email===snapshot.user?.email&&
  merged.unlocked===snapshot.unlocked&&
  merged.ready===snapshot.ready
 )return
 snapshot=merged
 subs.forEach(f=>f())
}

const toAdmin=(user:AuthUserLike):AdminUser=>{
 const meta=user.user_metadata??{}
 const name=[meta.name,meta.full_name].find(v=>typeof v==='string'&&v.trim()) as string|undefined
 return{id:user.id,email:user.email??'',name:name?.trim()||user.email?.split('@')[0]||'Admin'}
}
async function resolveAdmin(user:AuthUserLike):Promise<AdminUser|null>{
 const sb=getSupabase()
 if(!sb)return null
 const{data,error}=await sb.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(error||!data)return null
 return toAdmin(user)
}
async function getTotpSecret(userId:string):Promise<string|null>{
 const sb=getSupabase()
 if(!sb)return null
 const{data,error}=await sb.from('totp_secrets').select('secret').eq('user_id',userId).eq('is_active',true).maybeSingle()
 if(error||!data)return null
 return data.secret
}
async function setTotpSecret(userId:string,secret:string):Promise<void>{
 const sb=requireSupabase()
 const{error}=await sb.from('totp_secrets').upsert({user_id:userId,secret,created_at:new Date().toISOString(),is_active:true})
 if(error)fail(error)
}
async function verifyTotpCode(userId:string,code:string):Promise<boolean>{
 const sb=requireSupabase()
 const{data,error}=await sb.rpc('verify_totp_code',{p_user_id:userId,p_code:code})
 if(error)fail(error)
 return data as boolean
}
async function generateTotpSecretData():Promise<{secret:string;qrCodeUrl:string;provisioningUrl:string}>{
 const sb=requireSupabase()
 const{data,error}=await sb.rpc('generate_totp_secret')
 if(error)fail(error)
 const secret=data as string
 const{data:u}=await sb.auth.getUser()
 const email=u.user?.email||''
 const qrCodeUrl=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Android%20Club%20VIT-AP:${email}?secret=${secret}&issuer=Android%20Club`
 const provisioningUrl=`otpauth://totp/Android%20Club%20VIT-AP:${email}?secret=${secret}&issuer=Android%20Club`
 return {secret, qrCodeUrl, provisioningUrl}
}
async function canSetup():Promise<boolean>{
 const sb=getSupabase()
 if(!sb)return false
 const{data,error}=await sb.rpc('admin_setup_available')
 return !error&&data===true
}
async function acceptInvite():Promise<boolean>{
 const sb=getSupabase()
 if(!sb)return false
 const{data,error}=await sb.rpc('accept_admin_invite')
 return !error&&data===true
}
async function resolveWithInvite(user:AuthUserLike):Promise<AdminUser|null>{
 const admin=await resolveAdmin(user)
 if(admin)return admin
 if(!(await acceptInvite()))return null
 return resolveAdmin(user)
}
async function disableTotp(userId:string):Promise<void>{
 const sb=requireSupabase()
 await sb.from('totp_secrets').update({is_active:false, last_verified_at: new Date().toISOString()}).eq('user_id',userId).eq('is_active',true)
 await sb.from('profiles').update({totp_enabled: false, backup_codes: []}).eq('id', userId)
}
async function logTwoFactorAction(userId:string, action:'enabled'|'disabled'|'setup'|'verify'|'failed', details?:string):Promise<void>{
 const sb=requireSupabase()
 await sb.from('two_factor_logs').insert({
  user_id: userId,
  action,
  ip_address: null,
  timestamp: new Date().toISOString(),
  details
 })
}

let initialized=false
export async function initAuth():Promise<void>{
 if(initialized)return
 initialized=true
 const sb=getSupabase()
 if(!sb){
  publish({user:null,unlocked:readUnlocked(),ready:true})
  return
 }
 try{
  const{data}=await sb.auth.getSession()
  const admin=data.session?await resolveWithInvite(data.session.user):null
  publish({user:admin,unlocked:readUnlocked(),ready:true})
 }catch{
  publish({user:null,unlocked:readUnlocked(),ready:true})
 }
 sb.auth.onAuthStateChange((_event,session)=>{
  setTimeout(()=>{
   if(!session){publish({user:null,ready:true});return}
   resolveWithInvite(session.user)
    .then(user=>publish({user,ready:true}))
    .catch(()=>publish({user:null,ready:true}))
  },0)
 })
}

function markUnlocked(){
 try{sessionStorage.setItem(UNLOCK_KEY,'1')}catch{}
 publish({unlocked:true})
}

export const authService={
 async login(c:{email:string;password:string}):Promise<LoginOutcome>{
  const sb=requireSupabase()
  const{data,error}=await sb.auth.signInWithPassword({email:c.email.trim(),password:c.password})
  if(error)failAuth(error.message)
  if(!data.session||!data.user)throw new Error('Sign in failed. Please try again.')
  const admin=await resolveWithInvite(data.user)
  if(!admin){
   if(await canSetup().catch(()=>false)){
    publish({user:null,ready:true})
    return{status:'setup',email:data.user.email||c.email.trim()}
   }
   await sb.auth.signOut()
   throw new Error('This account does not have admin access. Ask an admin to invite you.')
  }

  const existingSecret=await getTotpSecret(data.user.id)
  if(!existingSecret){
   publish({user:admin,ready:true,totpEnabled:false})
   return{status:'totp_enrollment',email:data.user.email||c.email.trim()}
  }

  publish({user:admin,ready:true,totpEnabled:true})
  return{status:'admin'}
 },
 async generateTotpSecret():Promise<{secret:string;qrCodeUrl:string;provisioningUrl:string}>{
  return generateTotpSecretData()
 },
 async setTotpSecret(userId:string,secret:string):Promise<void>{
  await setTotpSecret(userId,secret)
 },
 async verifyTotp(code:string):Promise<void>{
  const{data:{user}}=await requireSupabase().auth.getUser()
  if(!user)throw new Error('No user found for TOTP verification.')
  const valid=await verifyTotpCode(user.id,code)
  if(!valid)throw new Error('Invalid code.')
  try{
   const sb=requireSupabase()
   await sb.from('totp_secrets').update({is_active:false}).eq('user_id',user.id).eq('is_active',true)
  }catch{}
 },
 async enableTotp(userId:string,secret:string):Promise<{qrCodeUrl:string;provisioningUrl:string;secretKey:string}>{
  await setTotpSecret(userId,secret)
  const {qrCodeUrl,provisioningUrl} = await generateTotpSecretData()
  const backupCodes = Array.from({length: 8}, () => Math.random().toString(36).substring(2, 10).toUpperCase())
  const sb=requireSupabase()
  if(sb)await sb.from('profiles').upsert({id: userId, backup_codes: backupCodes, totp_enabled: true, last_totp_setup: new Date().toISOString()}, {onConflict: 'id'})
  return { qrCodeUrl, provisioningUrl, secretKey: secret }
 },
 async disableTotp(userId:string):Promise<void>{
  await disableTotp(userId)
 },
 async getTotpStatus(userId:string):Promise<{enabled:boolean;totpSecret?:TotpSecret;backupCodes:string[];lastSetup?:string;lastVerification?:string}>{
  const sb=requireSupabase()
  const{ data } = await sb.from('profiles').select('totp_enabled, backup_codes, last_totp_setup, last_totp_verification').eq('id', userId).single()
  const totp = await getTotpSecret(userId)
  return {
   enabled: data?.totp_enabled || false,
   totpSecret: totp ? { id: userId, secret: totp, createdAt: data?.last_totp_setup || '', lastVerifiedAt: data?.last_totp_verification, isActive: data?.totp_enabled } : undefined,
   backupCodes: data?.backup_codes || [],
   lastSetup: data?.last_totp_setup,
   lastVerification: data?.last_totp_verification
  }
 },
 async generateBackupCodes(userId:string):Promise<string[]>{
  const backupCodes = Array.from({length: 8}, () => Math.random().toString(36).substring(2, 10).toUpperCase())
  const sb=requireSupabase()
  await sb.from('profiles').update({backup_codes: backupCodes}).eq('id', userId)
  return backupCodes
 },
 async logTwoFactorAction(userId:string, action:'enabled'|'disabled'|'setup'|'verify'|'failed', details?:string):Promise<void>{
  await logTwoFactorAction(userId, action, details)
 },
 async getTwoFactorLogs(userId:string):Promise<any[]>{
  const sb=requireSupabase()
  const { data } = await sb.from('two_factor_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false })
  return data || []
 },
 async adminForceTotp(userId:string, enable:boolean):Promise<void>{
  if(enable) {
   const secret = await generateTotpSecretData()
   await setTotpSecret(userId, secret.secret)
  } else {
   await disableTotp(userId)
  }
  await logTwoFactorAction(userId, enable ? 'enabled' : 'disabled', `Admin ${enable ? 'enabled' : 'disabled'} 2FA`)
 },
 async getUserProfiles():Promise<any[]>{
  const sb=requireSupabase()
  const { data } = await sb.from('profiles').select('id, totp_enabled, backup_codes, last_totp_setup, last_totp_verification')
  return data || []
 },
 async logout():Promise<void>{
  await requireSupabase().auth.signOut()
 },
 async setupSession():Promise<string|null>{
  if(!(await canSetup()))return null
  const{data}=await requireSupabase().auth.getSession()
  return data.session?.user.email??null
 },
 async hasSession():Promise<boolean>{
  const{data}=await requireSupabase().auth.getSession()
  return !!data.session
 },
 async completePasswordReset(pw:string):Promise<void>{
  await requireSupabase().auth.updateUser({password:pw})
 },
 async claim():Promise<void>{
  await requireSupabase().rpc('claim_first_admin')
 },
 async sendResetPassword(email:string):Promise<void>{
  await requireSupabase().auth.resetPasswordForEmail(email)
 },
 async verifyAccessKey(key:string):Promise<boolean>{
  return key === ACCESS_KEY
 },
}
