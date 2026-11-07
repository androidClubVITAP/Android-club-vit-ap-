import type{EventImage,EventItem}from'../types'
import{emitChange,fail,requireSupabase}from'./client'
import{EVENT_SELECT,mapEvent,type EventRow}from'./rows'
import{mediaService}from'./media'

export interface EventFilters{q?:string;status?:string;category?:string;publishedOnly?:boolean}
type SupabaseClientLike=ReturnType<typeof requireSupabase>

function eventPatch(d:Partial<EventItem>){
 const out:Record<string,unknown>={}
 if(d.title!==undefined)out.title=d.title
 if(d.description!==undefined)out.description=d.description
 if(d.date!==undefined)out.date=d.date
 if(d.time!==undefined)out.time=d.time
 if(d.venue!==undefined)out.venue=d.venue
 if(d.category!==undefined)out.category=d.category
 if(d.status!==undefined)out.status=d.status
 if(d.published!==undefined)out.published=d.published
 if(d.registrationUrl!==undefined)out.registration_url=d.registrationUrl||null
 if(d.cover!==undefined)out.cover=d.cover
 if(d.highlights!==undefined)out.highlights=d.highlights
 if(d.links!==undefined)out.links=d.links
 return out
}

function createPatch(d:Omit<EventItem,'id'>){
 return{
  title:d.title,description:d.description??'',date:d.date,time:d.time??'',venue:d.venue,
  category:d.category,status:d.status??'upcoming',published:d.published??false,
  registration_url:d.registrationUrl||null,cover:d.cover??'',
  highlights:d.highlights??[],links:d.links??[]
 }
}

async function fetchEvent(sb:SupabaseClientLike,id:string):Promise<EventItem|null>{
 const{data,error}=await sb.from('events').select(EVENT_SELECT).eq('id',id).maybeSingle()
 if(error)fail(error,'Could not load the event.')
 return data?mapEvent(data as unknown as EventRow):null
}
async function saveRelations(sb:SupabaseClientLike,id:string,d:Partial<EventItem>){
 if(!('gallery'in d||'regImages'in d||'organizerIds'in d))return
 const{error}=await sb.rpc('set_event_relations',{
  p_event_id:id,
  p_gallery:'gallery'in d?(d.gallery??[]):null,
  p_reg_images:'regImages'in d?(d.regImages??[]):null,
  p_organizers:'organizerIds'in d?(d.organizerIds??[]):null
 })
 if(error)fail(error,'Could not save the event images or organizers.')
}

export const eventService={
 async getEvents(f:EventFilters={}):Promise<EventItem[]>{
  const sb=requireSupabase()
  let q=sb.from('events').select(EVENT_SELECT)
  if(f.publishedOnly)q=q.eq('published',true)
  if(f.status)q=q.eq('status',f.status)
  if(f.category)q=q.eq('category',f.category)
  if(f.q){
      const term=f.q.replace(/[,()%*"'\\]/g,' ').trim()
   if(term)q=q.or(`title.ilike.%${term}%,venue.ilike.%${term}%`)
  }
  const{data,error}=await q.order('date',{ascending:true})
  if(error)fail(error,'Could not load events.')
  return ((data??[]) as unknown as EventRow[]).map(mapEvent)
 },

 async getEventById(id:string):Promise<EventItem|null>{
  return fetchEvent(requireSupabase(),id)
 },

 async createEvent(d:Omit<EventItem,'id'>):Promise<EventItem>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('events').insert(createPatch(d)).select('id').single()
  if(error)fail(error,'Could not create the event.')
  const id=(data as{id:string}).id
  try{
   await saveRelations(sb,id,d)
  }catch(e){
      await sb.from('events').delete().eq('id',id)
   throw e
  }
  const event=await fetchEvent(sb,id)
  if(!event)throw new Error('The event was saved but could not be reloaded.')
  emitChange()
  return event
 },

 async updateEvent(id:string,d:Partial<EventItem>):Promise<EventItem>{
  const sb=requireSupabase()
  const patch=eventPatch(d)
  if(Object.keys(patch).length){
   const{data,error}=await sb.from('events').update(patch).eq('id',id).select('id').maybeSingle()
   if(error)fail(error,'Could not update the event.')
   if(!data)throw new Error('Event not found, or you do not have permission to edit it.')
  }
  await saveRelations(sb,id,d)
  const event=await fetchEvent(sb,id)
  if(!event)throw new Error('The event was saved but could not be reloaded.')
  emitChange()
  return event
 },

 async deleteEvent(id:string):Promise<boolean>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('events').delete().eq('id',id).select('id')
  if(error)fail(error,'Could not delete the event.')
  if(!data?.length)throw new Error('Event not found, or you do not have permission to delete it.')
  emitChange()
  return true
 },

 publishEvent(id:string){return eventService.updateEvent(id,{published:true})},

 async uploadEventImages(id:string,files:File[]):Promise<EventImage[]>{
  if(!files.length)return[]
  const sb=requireSupabase()
  const{data:last}=await sb.from('event_images').select('position')
   .eq('event_id',id).eq('kind','gallery').order('position',{ascending:false}).limit(1).maybeSingle()
  const start=Number((last as{position?:number}|null)?.position??-1)+1
  const uploaded=await Promise.all(files.map(f=>mediaService.uploadImage(f)))
  const{data,error}=await sb.from('event_images')
   .insert(uploaded.map((u,i)=>({event_id:id,kind:'gallery',url:u.url,alt:u.name,position:start+i})))
   .select('id,url,alt')
  if(error)fail(error,'Could not add the event images.')
  emitChange()
  return (data??[]).map(r=>({id:r.id,url:r.url,alt:r.alt}))
 },

 async deleteEventImage(id:string,imageId:string):Promise<boolean>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('event_images').delete()
   .eq('event_id',id).eq('id',imageId).select('id')
  if(error)fail(error,'Could not remove the image.')
  if(!data?.length)throw new Error('Image not found, or you do not have permission to remove it.')
  emitChange()
  return true
 }
}
