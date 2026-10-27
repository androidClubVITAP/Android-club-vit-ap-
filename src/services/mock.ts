import type{ClubSettings,EventItem,EventImage,TeamMember,TeamRole,Announcement,AdminUser,MediaAsset}from'../types'
const art=(a:string,b:string)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><circle cx="620" cy="140" r="150" fill="#3DDC84" opacity=".25"/><circle cx="160" cy="420" r="110" fill="#00E676" opacity=".15"/></svg>`)
const pal:[string,string][]=[['#0B100D','#1f6b45'],['#050805','#0f3d29'],['#12201a','#3DDC84'],['#0B100D','#00a152']]
const uid=()=>Math.random().toString(36).slice(2,9)
const gal=(n:number,t:string):EventImage[]=>Array.from({length:n},(_,i)=>({id:uid(),url:art(...pal[(i+1)%4]),alt:`${t} – illustrative photo ${i+1}`}))
const E=(id:string,title:string,date:string,time:string,venue:string,category:string,status:'upcoming'|'completed',published:boolean,description:string,highlights:string[],organizerIds:string[],n:number,i:number):EventItem=>({id,title,date,time,venue,category,status,published,description,highlights,organizerIds,cover:art(...pal[i]),gallery:gal(n,title)})
const db={
club:{name:'ANDROID CLUB VIT-AP',college:'VIT-AP University',tagline:'Build for billions. Learn together.',description:'A student technical community at VIT-AP University for mobile developers, designers and curious builders.',about:'Sample copy: Android Club VIT-AP is a technical club where students learn Android and mobile development, ship projects together and explore emerging technology. Edit this text in Admin → Settings.',mission:'To help every member go from first app to shipped product through hands-on workshops and peer learning.',vision:'A campus where students build confidently for the platforms billions of people use.',objectives:['Teach Android and Kotlin through practical workshops','Run collaborative projects and build-a-thons','Connect members with mentors and the wider developer community','Encourage design-minded, accessible app development'],areas:['Android development','Kotlin','Jetpack Compose','App design','Emerging tech'],email:'',instagram:'',linkedin:'',github:'',logoUrl:'/logo.jpg',heroHeading:'ANDROID CLUB VIT-AP',heroSubtitle:'Workshops, build-a-thons and a community of student developers shaping what runs in your pocket.'} as ClubSettings,
roles:['Club Lead:1','Co-Lead:2','President:1','Vice President:2','Technical Lead:3','Design Lead:3','Event Coordinator:4','Core Team Member:5'].map(s=>({id:uid(),name:s.split(':')[0],rank:+s.split(':')[1]})) as TeamRole[],
team:[['t1','Alex Sample','Club Lead','Third year, CSE'],['t2','Jordan Demo','Co-Lead','Third year, CSE'],['t3','Sam Placeholder','Technical Lead','Second year, CSE'],['t4','Riya Example','Design Lead','Second year, IT'],['t5','Kai Mockwell','Club Lead','Final year, CSE']].map(([id,name,designation,y],i)=>({id,name,designation,department:y.split(', ')[1],year:y.split(', ')[0],bio:'Demo profile – replace via Admin → Team.',image:'',current:id!=='t5',order:i+1})) as TeamMember[],
events:[
E('e1','Jetpack Compose Workshop (sample)','2026-11-14','10:00','Academic Block, Room A-204 (sample)','Workshop','upcoming',true,'Illustrative event: a hands-on introduction to building declarative UIs with Jetpack Compose.',['Live-coding walkthrough','Starter project provided','Q&A with the tech team'],['t1','t3'],0,0),
E('e2','Mobile Build-a-thon (sample)','2026-12-05','09:00','Innovation Lab (sample)','Hackathon','upcoming',true,'Illustrative event: a one-day team build-a-thon for mobile app ideas.',['Teams of up to four','Mentor check-ins','Demo round'],['t2','t4'],0,1),
E('e3','Kotlin Study Jam (sample)','2026-09-12','14:00','Seminar Hall 2 (sample)','Study Jam','completed',true,'Illustrative past event with sample photographs, shown to demonstrate how history is archived.',['Kotlin basics to coroutines','Pair-programming exercises'],['t5','t3'],4,2),
E('e4','Android 101 Intro Session (sample)','2026-08-22','16:00','Auditorium (sample)','Talk','completed',true,'Illustrative past event introducing new members to the club.',['Club overview','Setting up Android Studio'],['t5','t4'],3,3),
E('e5','Draft: Native vs Cross-platform Talk','2027-01-10','15:00','TBD','Talk','upcoming',false,'Unpublished draft – only visible in the admin dashboard.',[],['t1'],0,1)],
news:[
{id:'a1',title:'Compose workshop registrations are being planned',message:'Sample announcement: details for the Jetpack Compose workshop will be shared soon.',publishedOn:'2026-10-20',published:true,featured:true,eventId:'e1',ctaLabel:'View event'},
{id:'a2',title:'Core team applications (sample)',message:'Sample announcement showing a compact card.',publishedOn:'2026-10-10',published:true,featured:false},
{id:'a3',title:'Expired sample notice',message:'Hidden on the public site because it expired.',publishedOn:'2026-09-01',expiresOn:'2026-09-30',published:true,featured:false},
{id:'a4',title:'Unpublished draft',message:'Visible only in admin.',publishedOn:'2026-10-25',published:false,featured:false}] as Announcement[]}
const subs=new Set<()=>void>(),emit=()=>subs.forEach(f=>f())
export const onChange=(f:()=>void)=>{subs.add(f);return()=>{subs.delete(f)}}
const wait=<T,>(v:T,ms=150)=>new Promise<T>(r=>setTimeout(()=>r(structuredClone(v)),ms))
const mk=<T extends{id:string}>(get:()=>T[],set:(v:T[])=>void)=>({
 list:()=>wait(get()),
 create:async(d:Omit<T,'id'>)=>{const x={...d,id:uid()} as T;set([...get(),x]);emit();return wait(x)},
 update:async(id:string,d:Partial<T>)=>{set(get().map(i=>i.id===id?{...i,...d}:i));emit();return wait(get().find(i=>i.id===id)!)},
 remove:async(id:string)=>{set(get().filter(i=>i.id!==id));emit();return wait(true)}})
export const clubService={getClubSettings:()=>wait(db.club),updateClubSettings:async(d:Partial<ClubSettings>)=>{db.club={...db.club,...d};emit();return wait(db.club)}}
const check=(f:File)=>{if(!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type))throw new Error('Only PNG, JPG, WebP or GIF images are allowed.');if(f.size>3*1024*1024)throw new Error('Image must be under 3 MB.')}
export const mediaService={
 async previewImage(f:File):Promise<MediaAsset>{check(f);return{id:uid(),url:URL.createObjectURL(f),name:f.name,size:f.size,temporary:true}},
 async uploadImage(f:File):Promise<MediaAsset>{check(f);const url=await new Promise<string>((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result as string);r.onerror=()=>no(new Error('Could not read file.'));r.readAsDataURL(f)});return{id:uid(),url,name:f.name,size:f.size,temporary:true}},
 async deleteImage(_id:string){return true}}
const ev=mk<EventItem>(()=>db.events,v=>{db.events=v})
export const eventService={
 getEvents:async(f:{q?:string;status?:string;category?:string;publishedOnly?:boolean}={})=>{let l=await ev.list();if(f.publishedOnly)l=l.filter(e=>e.published);if(f.status)l=l.filter(e=>e.status===f.status);if(f.category)l=l.filter(e=>e.category===f.category);if(f.q)l=l.filter(e=>(e.title+e.venue).toLowerCase().includes(f.q!.toLowerCase()));return l.sort((a,b)=>a.date.localeCompare(b.date))},
 getEventById:async(id:string)=>(await ev.list()).find(e=>e.id===id)??null,
 createEvent:(d:Omit<EventItem,'id'>)=>ev.create(d),updateEvent:(id:string,d:Partial<EventItem>)=>ev.update(id,d),deleteEvent:(id:string)=>ev.remove(id),
 publishEvent:(id:string)=>ev.update(id,{published:true}),
 async uploadEventImages(id:string,files:File[]){const e=db.events.find(e=>e.id===id);if(!e)throw new Error('Event not found.');const up=await Promise.all(files.map(f=>mediaService.uploadImage(f)));const added=up.map(u=>({id:u.id,url:u.url,alt:u.name}));await ev.update(id,{gallery:[...e.gallery,...added]});return added},
 async deleteEventImage(id:string,imageId:string){const e=db.events.find(e=>e.id===id);if(!e)throw new Error('Event not found.');await ev.update(id,{gallery:e.gallery.filter(i=>i.id!==imageId)});return true}}
const tm=mk<TeamMember>(()=>db.team,v=>{db.team=v}),rl=mk<TeamRole>(()=>db.roles,v=>{db.roles=v})
export const teamService={
 getTeamMembers:async()=>(await tm.list()).sort((a,b)=>a.order-b.order),
 createTeamMember:(d:Omit<TeamMember,'id'|'order'>)=>tm.create({...d,order:db.team.length+1}),
 updateTeamMember:tm.update,
 // Members referenced by events are kept as "former" so event history stays intact.
 async deleteTeamMember(id:string){if(db.events.some(e=>e.organizerIds.includes(id)))return tm.update(id,{current:false});return tm.remove(id)},
 async reorderTeamMembers(ids:string[]){db.team=db.team.map(m=>({...m,order:ids.indexOf(m.id)+1}));emit();return true},
 getTeamRoles:rl.list,createTeamRole:rl.create,updateTeamRole:rl.update,deleteTeamRole:rl.remove}
const an=mk<Announcement>(()=>db.news,v=>{db.news=v})
export const announcementService={
 getAnnouncements:async(o:{activeOnly?:boolean}={})=>{const t=new Date().toISOString().slice(0,10);let l=await an.list();if(o.activeOnly)l=l.filter(a=>a.published&&a.publishedOn<=t&&(!a.expiresOn||a.expiresOn>=t));return l.sort((a,b)=>b.publishedOn.localeCompare(a.publishedOn))},
 createAnnouncement:an.create,updateAnnouncement:an.update,deleteAnnouncement:an.remove,
 publishAnnouncement:(id:string)=>an.update(id,{published:true}),unpublishAnnouncement:(id:string)=>an.update(id,{published:false})}
// DEMO ONLY – not real security. Demo account: admin@androidclub.demo / android-demo
const KEY='acvit_admin'
export const authService={
 async login(c:{email:string;password:string}):Promise<AdminUser>{await wait(0,500);if(c.email.trim().toLowerCase()!=='admin@androidclub.demo'||c.password!=='android-demo')throw new Error('Invalid email or password.');const u={id:'a1',email:c.email.trim(),name:'Demo Admin'};sessionStorage.setItem(KEY,JSON.stringify(u));return u},
 async logout(){sessionStorage.removeItem(KEY)},
 getCurrentAdmin():AdminUser|null{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{return null}}}
