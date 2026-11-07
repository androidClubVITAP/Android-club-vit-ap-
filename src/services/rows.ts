import type{Announcement,ClubSettings,EventImage,EventItem,TeamMember,TeamRole}from'../types'


export interface SettingsRow{id:number;name:string;college:string;tagline:string;description:string;about:string;mission:string;vision:string;objectives:string[]|null;areas:string[]|null;pillars:string[]|null;faqs:string[]|null;email:string;instagram:string;linkedin:string;github:string;logo_url:string;hero_heading:string;hero_subtitle:string}

export interface TeamRoleRow{id:string;name:string;rank:number}

export interface TeamMemberRow{id:string;name:string;designation:string;bio:string;department:string;year:string;image:string;linkedin:string;github:string;current:boolean;sort_order:number}

export interface AnnouncementRow{id:string;title:string;message:string;published_on:string;expires_on:string|null;published:boolean;featured:boolean;event_id:string|null;cta_label:string;cta_url:string;registration_url:string;image:string;links:string[]|null}

export interface EventImageRow{id:string;url:string;alt:string;kind:string;position:number}
export interface EventOrganizerRow{member_id:string}

export interface EventRow{id:string;title:string;description:string;date:string;time:string;venue:string;category:string;status:'upcoming'|'completed';published:boolean;registration_url:string|null;cover:string;highlights:string[]|null;links:string[]|null;event_images:EventImageRow[]|null;event_organizers:EventOrganizerRow[]|null}

export const EVENT_SELECT='id,title,description,date,time,venue,category,status,published,registration_url,cover,highlights,links,event_images(id,url,alt,kind,position),event_organizers(member_id)'

export const mapSettings=(r:SettingsRow):ClubSettings=>({
 name:r.name,college:r.college,tagline:r.tagline,description:r.description,about:r.about,
 mission:r.mission,vision:r.vision,
 objectives:r.objectives??[],areas:r.areas??[],pillars:r.pillars??[],faqs:r.faqs??[],
 email:r.email,instagram:r.instagram,linkedin:r.linkedin,github:r.github,
 logoUrl:r.logo_url,heroHeading:r.hero_heading,heroSubtitle:r.hero_subtitle
})

export const mapRole=(r:TeamRoleRow):TeamRole=>({id:r.id,name:r.name,rank:Number(r.rank)})

export const mapMember=(r:TeamMemberRow):TeamMember=>({
 id:r.id,name:r.name,designation:r.designation,bio:r.bio,department:r.department,year:r.year,
 image:r.image,linkedin:r.linkedin||undefined,github:r.github||undefined,
 current:r.current,order:Number(r.sort_order)
})

export const mapAnnouncement=(r:AnnouncementRow):Announcement=>({
 id:r.id,title:r.title,message:r.message,publishedOn:r.published_on,
 expiresOn:r.expires_on??undefined,published:r.published,featured:r.featured,
 eventId:r.event_id??undefined,ctaLabel:r.cta_label||undefined,ctaUrl:r.cta_url||undefined,
 registrationUrl:r.registration_url||undefined,image:r.image||undefined,
 links:r.links??[]
})

const images=(rows:EventImageRow[]|null,kind:string):EventImage[]=>(rows??[])
 .filter(i=>i.kind===kind)
 .sort((a,b)=>a.position-b.position)
 .map(i=>({id:i.id,url:i.url,alt:i.alt}))

export const mapEvent=(r:EventRow):EventItem=>({
 id:r.id,title:r.title,description:r.description,date:r.date,time:r.time,venue:r.venue,
 category:r.category,status:r.status,published:r.published,
 registrationUrl:r.registration_url??undefined,
 cover:r.cover,gallery:images(r.event_images,'gallery'),regImages:images(r.event_images,'registration'),
 highlights:r.highlights??[],links:r.links??[],
 organizerIds:(r.event_organizers??[]).map(o=>o.member_id)
})
