import type{Announcement}from'../types'
import{emitChange,fail,requireSupabase,today}from'./client'
import{mapAnnouncement,type AnnouncementRow}from'./rows'

function announcementPatch(d:Partial<Announcement>){
 const out:Record<string,unknown>={}
 if(d.title!==undefined)out.title=d.title
 if(d.message!==undefined)out.message=d.message
 if(d.publishedOn!==undefined)out.published_on=d.publishedOn
 if(d.expiresOn!==undefined)out.expires_on=d.expiresOn||null
 if(d.published!==undefined)out.published=d.published
 if(d.featured!==undefined)out.featured=d.featured
 if(d.eventId!==undefined)out.event_id=d.eventId||null
 if(d.ctaLabel!==undefined)out.cta_label=d.ctaLabel||''
 if(d.ctaUrl!==undefined)out.cta_url=d.ctaUrl||''
 if(d.registrationUrl!==undefined)out.registration_url=d.registrationUrl||''
 if(d.image!==undefined)out.image=d.image||''
 if(d.links!==undefined)out.links=d.links
 return out
}

function createPatch(d:Omit<Announcement,'id'>){
 return{
  title:d.title,message:d.message??'',published_on:d.publishedOn||today(),
  expires_on:d.expiresOn||null,published:d.published??false,featured:d.featured??false,
  event_id:d.eventId||null,cta_label:d.ctaLabel||'',cta_url:d.ctaUrl||'',
  registration_url:d.registrationUrl||'',image:d.image||'',links:d.links??[]
 }
}

export const announcementService={
 async getAnnouncements({activeOnly=false}:{activeOnly?:boolean}={}):Promise<Announcement[]>{
  const sb=requireSupabase()
  let q=sb.from('announcements').select('*')
  if(activeOnly){
   const t=today()
   q=q.eq('published',true).lte('published_on',t).or(`expires_on.is.null,expires_on.gte.${t}`)
  }
  const{data,error}=await q.order('published_on',{ascending:false})
  if(error)fail(error,'Could not load announcements.')
  return((data??[])as AnnouncementRow[]).map(mapAnnouncement)
 },

 async createAnnouncement(d:Omit<Announcement,'id'>):Promise<Announcement>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('announcements').insert(createPatch(d)).select('*').single()
  if(error)fail(error,'Could not create the announcement.')
  emitChange()
  return mapAnnouncement(data as AnnouncementRow)
 },

 async updateAnnouncement(id:string,d:Partial<Announcement>):Promise<Announcement>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('announcements').update(announcementPatch(d)).eq('id',id).select('*').maybeSingle()
  if(error)fail(error,'Could not update the announcement.')
  if(!data)throw new Error('Announcement not found, or you do not have permission to edit it.')
  emitChange()
  return mapAnnouncement(data as AnnouncementRow)
 },

 async deleteAnnouncement(id:string):Promise<boolean>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('announcements').delete().eq('id',id).select('id')
  if(error)fail(error,'Could not delete the announcement.')
  if(!data?.length)throw new Error('Announcement not found, or you do not have permission to delete it.')
  emitChange()
  return true
 },

 publishAnnouncement(id:string){return announcementService.updateAnnouncement(id,{published:true})},
 unpublishAnnouncement(id:string){return announcementService.updateAnnouncement(id,{published:false})}
}
