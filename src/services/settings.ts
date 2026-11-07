import type{ClubSettings}from'../types'
import{emitChange,fail,requireSupabase}from'./client'
import{mapSettings,type SettingsRow}from'./rows'

const COLUMNS:Record<keyof ClubSettings,string>={
 name:'name',college:'college',tagline:'tagline',description:'description',about:'about',
 mission:'mission',vision:'vision',objectives:'objectives',areas:'areas',pillars:'pillars',
 faqs:'faqs',email:'email',instagram:'instagram',linkedin:'linkedin',github:'github',
 logoUrl:'logo_url',heroHeading:'hero_heading',heroSubtitle:'hero_subtitle'
}

function patch(d:Partial<ClubSettings>){
 const out:Record<string,unknown>={}
 for(const [key,value] of Object.entries(d)){
  const column=COLUMNS[key as keyof ClubSettings]
  if(column&&value!==undefined)out[column]=value
 }
 return out
}

export const clubService={
 async getClubSettings():Promise<ClubSettings>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('club_settings').select('*').eq('id',1).single()
  if(error)fail(error,'Could not load the club settings.')
  return mapSettings(data as SettingsRow)
 },
 async updateClubSettings(d:Partial<ClubSettings>):Promise<ClubSettings>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('club_settings').update(patch(d)).eq('id',1).select('*').single()
  if(error)fail(error,'Could not save the club settings.')
  emitChange()
  return mapSettings(data as SettingsRow)
 }
}
