import{createClient,type SupabaseClient}from'@supabase/supabase-js'
const url=(import.meta.env.VITE_SUPABASE_URL as string|undefined)?.trim()
const anonKey=(import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined)?.trim()

export const isBackendConfigured=Boolean(url&&anonKey)
let client:SupabaseClient|null=null

export function getSupabase():SupabaseClient|null{
 if(!isBackendConfigured)return null
 if(!client){
  try{
   client=createClient(url!,anonKey!,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
    global:{headers:{'x-application-name':'android-club-vitap'}}
   })
  }catch{return null}
 }
 return client
}

export function requireSupabase():SupabaseClient{
 const sb=getSupabase()
 if(!sb)throw new Error('Backend not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.')
 return sb
}
const changeSubs=new Set<()=>void>()
export const onChange=(f:()=>void)=>{changeSubs.add(f);return()=>{changeSubs.delete(f)}}
export const emitChange=()=>changeSubs.forEach(f=>f())

type DbError={message?:string;code?:string;details?:string;hint?:string}
const INTERNAL=/^(new row|duplicate key|insert or update|update or delete|null value in column|violates |relation "|column "|permission denied|syntax error)/i

export function fail(error:unknown,fallback='Something went wrong. Please try again.'):never{
 const e=(error??{}) as DbError
 const message=(e.message||'').trim()
 const code=e.code||''
 if(code==='42501'||/row-level security|not allowed|not authorised|not authorized/i.test(message))
  throw new Error(message&&!/row-level security/i.test(message)?message:'You do not have permission to do that.')
 if(code==='23505')throw new Error('That record already exists.')
 if(code==='23503')throw new Error(INTERNAL.test(message)||!message?'That record is still used by other content.':message)
 if(code==='23502')throw new Error('A required field is missing.')
 if(code==='23514'||code==='22001'||code==='22P02')throw new Error('Some of the values are not valid. Check the form and try again.')
 if(code==='PGRST116')throw new Error('The record no longer exists. Refresh and try again.')
 if(/jwt expired|invalid refresh token|refresh token not found/i.test(message))
  throw new Error('Your session has expired. Please sign in again.')
 if(/failed to fetch|networkerror|fetch failed|load failed/i.test(message))
  throw new Error('Could not reach the backend. Check your connection and try again.')
 if(message&&!INTERNAL.test(message)&&code.startsWith('P0'))throw new Error(message)
 throw new Error(fallback)
}

export function failAuth(message:string):never{
 if(/invalid login credentials/i.test(message))throw new Error('Invalid email or password.')
 if(/email not confirmed/i.test(message))throw new Error('Confirm your email address before signing in.')
 if(/auth session missing|session.*not found|invalid.*token|token.*expired/i.test(message))
  throw new Error('This reset link is invalid or has expired. Request a new one from the sign-in screen.')
 if(/signups? not allowed|signup.*disabled|new users.*disabled/i.test(message))
  throw new Error('New sign-ups are disabled. Create the account in Supabase Auth first, or enable sign-ups temporarily.')
 if(/email address not authorized|not authorized.*email address|only.*team members/i.test(message))
  throw new Error('The built-in email sender can only reach project team addresses. Configure SMTP in Supabase.')
 if(/rate limit|too many|security purposes|only request this/i.test(message))
  throw new Error('Too many attempts. Please wait a minute and try again.')
 if(/failed to fetch|networkerror|fetch failed/i.test(message))throw new Error('Could not reach the backend. Check your connection and try again.')
 throw new Error(message||'Sign in failed. Please try again.')
}

export const today=()=>new Date().toISOString().slice(0,10)
