import{useEffect,useState,type ReactNode}from'react'
import{Link,Outlet,useLocation,useParams}from'react-router-dom'
import{Menu,X,MapPin,ArrowRight,ArrowLeft,CheckCircle2,Mail,ChevronLeft,ChevronRight}from'lucide-react'
import{clubService,eventService,teamService,announcementService}from'../services'
import{useService,Logo,Avatar,Reveal,BlurIn,Spinner,Empty}from'../ui'
import{smoothScrollTo}from'../smooth'
import type{ClubSettings,EventItem,TeamMember}from'../types'
export const fmt=(d:string)=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
const links:[string,string][]=[['Home','/'],['About','/#about'],['Events','/#events'],['Team','/#team'],['Contact','/#contact']]

function Nav({c}:{c:ClubSettings}){const[o,setO]=useState(false),[s,setS]=useState(false),loc=useLocation()
 useEffect(()=>{const f=()=>setS(scrollY>20);f();addEventListener('scroll',f,{passive:true});return()=>removeEventListener('scroll',f)},[])
 useEffect(()=>setO(false),[loc])
 const on=(h:string)=>h==='/'?loc.pathname==='/'&&!loc.hash:loc.hash===h.slice(1)
 const cls=(h:string)=>`rounded-full px-3 py-2 text-sm font-medium transition ${on(h)?'bg-droid/15 text-droid':'text-mute hover:text-white'}`
 return<header className={`sticky top-0 z-50 border-b transition ${s||o?'border-white/10 bg-ink/75 backdrop-blur-xl':'border-transparent bg-white/[.02] backdrop-blur-sm'}`}><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
  <Link to="/" className="flex items-center gap-3"><Logo src={c.logoUrl} className="h-10 w-10"/><span className="font-bold tracking-tight">{c.name}</span></Link>
  <nav aria-label="Main" className="hidden items-center gap-1 md:flex">{links.map(([l,h])=><Link key={h} to={h} className={cls(h)} aria-current={on(h)?'page':undefined}>{l}</Link>)}</nav>
  <Link to="/admin/login" className="hidden text-sm text-mute hover:text-droid lg:inline">Admin login ↗</Link><Link to="/#events" className="btn-p hidden md:inline-flex">Explore Events</Link>
  <button className="rounded-full p-2 hover:bg-white/10 md:hidden" aria-label={o?'Close menu':'Open menu'} aria-expanded={o} aria-controls="mnav" onClick={()=>setO(!o)}>{o?<X/>:<Menu/>}</button></div>
  {o&&<nav id="mnav" aria-label="Mobile" className="flex flex-col gap-1 px-5 pb-4 md:hidden">{links.map(([l,h])=><Link key={h} to={h} className={cls(h)+' py-3'}>{l}</Link>)}<Link to="/admin/login" className="px-3 py-3 text-sm text-mute">Admin login ↗</Link><Link to="/#events" className="btn-p mt-2">Explore Events</Link></nav>}</header>}

function Footer({c}:{c:ClubSettings}){const soc=[['Instagram',c.instagram],['LinkedIn',c.linkedin],['GitHub',c.github]].filter(s=>s[1])
 return<footer id="contact" className="scroll-mt-20 border-t border-white/10 bg-surface/60"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
  <div><div className="flex items-center gap-3"><Logo src={c.logoUrl} className="h-12 w-12"/><div><p className="font-bold">{c.name}</p><p className="text-sm text-mute">{c.college}</p></div></div><p className="mt-4 text-sm text-mute">{c.tagline}</p></div>
  <div><h2 className="font-semibold">Explore</h2><ul className="mt-3 space-y-2 text-sm text-mute">{links.map(([l,h])=><li key={h}><Link className="hover:text-droid" to={h}>{l}</Link></li>)}</ul></div>
  <div><h2 className="font-semibold">Contact</h2><div className="mt-3 space-y-2 text-sm text-mute">{c.email?<a className="flex items-center gap-2 hover:text-droid" href={`mailto:${c.email}`}><Mail size={16}/>{c.email}</a>:<p>Contact email not configured yet.</p>}{soc.map(([l,u])=><a key={l} className="block hover:text-droid" href={u} target="_blank" rel="noreferrer">{l}</a>)}</div></div></div>
  <p className="border-t border-white/10 py-4 text-center text-xs text-mute">© {new Date().getFullYear()} {c.name}, {c.college}. Sample content for demonstration.</p></footer>}

export function PublicLayout(){const{data:c}=useService(clubService.getClubSettings),loc=useLocation(),ready=!!c
 useEffect(()=>{if(!ready)return;if(loc.hash)setTimeout(()=>{const el=document.getElementById(loc.hash.slice(1));if(el)smoothScrollTo(el)},60);else smoothScrollTo(0,true)},[loc,ready])
 if(!c)return<Spinner/>
 return<><Nav c={c}/><main key={loc.pathname} className="page-in"><Outlet/></main><Footer c={c}/></>}

const Sec=({id,kicker,title,children}:{id:string;kicker:string;title:string;children:ReactNode})=><section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24"><Reveal><p className="text-sm font-semibold text-droid">{kicker}</p><h2 className="mb-8 mt-1 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2></Reveal>{children}</section>

function Hero({c}:{c:ClubSettings}){const{data:ev}=useService(()=>eventService.getEvents({publishedOnly:true,status:'upcoming'})),{data:pe}=useService(()=>eventService.getEvents({publishedOnly:true})),{data:tm}=useService(teamService.getTeamMembers),f=ev?.[0]
 const stats=[[String(pe?.length??0).padStart(2,'0'),'Featured activities'],[String(tm?.filter(m=>m.current).length??0).padStart(2,'0'),'Team members'],['∞','Ideas to build']]
 return<section className="relative overflow-hidden"><div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-droid/20 blur-[120px]"/><div className="absolute bottom-[-12rem] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-neon/10 blur-[120px]"/><div className="grid-bg absolute inset-0"/></div>
 <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:py-24 lg:grid-cols-[1.2fr_.8fr]"><div>
  <BlurIn><Logo src={c.logoUrl} className="h-28 w-28 shadow-[0_0_60px_-10px_rgba(61,220,132,.5)]"/><p className="mt-6 text-sm text-mute">{c.college} · Student technical community</p></BlurIn>
  <BlurIn delay={.12}><h1 className="mt-2 text-[clamp(2.4rem,7vw,5rem)] font-extrabold leading-[1.02] tracking-tight">{c.heroHeading}</h1></BlurIn>
  <BlurIn delay={.24}><p className="mt-4 text-xl font-semibold text-droid">{c.tagline}</p><p className="mt-4 max-w-xl text-lg text-mute">{c.heroSubtitle}</p></BlurIn>
  <BlurIn delay={.36}><div className="mt-8 flex flex-wrap gap-3"><Link to="/#events" className="btn-p">Explore Events</Link><Link to="/#team" className="btn-g">Meet Our Team</Link></div></BlurIn>
  <BlurIn delay={.48}><div className="mt-10 flex gap-8">{stats.map(([n,l])=><div key={l}><p className="text-3xl font-extrabold text-droid">{n}</p><p className="text-sm text-mute">{l}</p></div>)}</div></BlurIn></div>
 <BlurIn delay={.4}><div>{f?<Link to={`/events/${f.id}`} className="glass group block overflow-hidden transition hover:border-droid/40"><img src={f.cover} alt="" className="aspect-[16/10] w-full object-cover"/><div className="p-6"><p className="text-sm font-semibold text-droid">Next up · {fmt(f.date)}</p><h2 className="mt-1 text-xl font-bold">{f.title}</h2><p className="mt-1 text-sm text-mute">{f.venue}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-droid">View Details <ArrowRight size={14}/></span></div></Link>:<div className="glass p-8 text-mute">No upcoming events yet. Check back soon.</div>}
  <div className="mt-4 flex flex-wrap gap-3"><span className="glass px-4 py-2 text-sm">Android Development · Learn, build, share</span><span className="glass px-4 py-2 text-sm">Made by students</span></div></div></BlurIn></div></section>}
function About({c}:{c:ClubSettings}){return<Sec id="about" kicker="Who we are" title="Curiosity meets code."><div className="grid gap-6 lg:grid-cols-2"><div className="grid content-start gap-6">
 <Reveal><div className="glass border-l-4 border-l-droid p-6"><h3 className="font-bold text-droid">Our mission</h3><p className="mt-2 text-lg text-mute">{c.mission}</p></div></Reveal>
 <Reveal><div className="flex flex-wrap gap-2">{c.areas.map(a=><span key={a} className="rounded-full border border-droid/30 bg-droid/10 px-3 py-1 text-sm text-droid">{a}</span>)}</div></Reveal>
 <Reveal><h3 className="text-xl font-bold">About {c.name}</h3><p className="mt-2 text-lg leading-relaxed text-mute">{c.about}</p></Reveal></div>
 <div className="grid content-start gap-6"><Reveal><div className="glass border-l-4 border-l-droid p-6"><h3 className="font-bold text-droid">Our vision</h3><p className="mt-2 text-mute">{c.vision}</p></div></Reveal>
 <Reveal><ul className="grid gap-3">{c.objectives.map(o=><li key={o} className="flex gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4"><CheckCircle2 className="shrink-0 text-droid" size={20}/>{o}</li>)}</ul></Reveal></div></div></Sec>}

export function EventCard({e}:{e:EventItem}){return<Link to={`/events/${e.id}`} className="glass group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-droid/40"><div className="relative aspect-[16/10] overflow-hidden"><img src={e.cover} alt={`${e.title} cover`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent"/><span className="absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-droid">{fmt(e.date)}</span><span className="absolute right-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs">{e.status==='upcoming'?'Upcoming':'Completed'}</span></div>
 <div className="flex flex-1 flex-col p-5"><p className="text-xs font-semibold text-droid">{e.category}</p><h3 className="mt-1 text-lg font-bold">{e.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-mute"><MapPin size={14}/>{e.venue}, {e.time}</p><p className="mt-3 line-clamp-2 text-sm text-mute">{e.description}</p><span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-droid">View Details <ArrowRight size={14}/></span></div></Link>}

function Events(){const[tab,setTab]=useState('');const{data,loading}=useService(()=>eventService.getEvents({publishedOnly:true,status:tab||undefined}),[tab])
 return<Sec id="events" kicker="What we've been building" title="Events & highlights."><div className="mb-6 flex flex-wrap gap-2">{[['','All events'],['upcoming','Upcoming'],['completed','Past']].map(([v,l])=><button key={v} aria-pressed={tab===v} onClick={()=>setTab(v)} className={tab===v?'btn-p':'btn-g'}>{l}</button>)}</div>
 {loading?<Spinner/>:!data?.length?<Empty title="No events here yet" hint="New events will appear as soon as they are published."/>:<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map(e=><Reveal key={e.id}><EventCard e={e}/></Reveal>)}</div>}</Sec>}

function News(){const{data:a,loading}=useService(()=>announcementService.getAnnouncements({activeOnly:true}))
 return<Sec id="announcements" kicker="Stay in the loop" title="Club announcements.">{loading?<Spinner/>:!a?.length?<Empty title="No announcements right now" hint="Check back soon."/>:<div className="grid gap-4 md:grid-cols-2">{a.map(x=><Reveal key={x.id} className={x.featured?'md:col-span-2':''}><article className={`glass h-full p-6 ${x.featured?'border-droid/40 bg-droid/5':''}`}>{x.featured&&<span className="rounded-full bg-droid px-2 py-0.5 text-xs font-bold text-ink">Featured</span>}<h3 className={`mt-2 font-bold ${x.featured?'text-2xl':'text-lg'}`}>{x.title}</h3><p className="mt-2 text-mute">{x.message}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="text-mute">{fmt(x.publishedOn)}</span>{x.eventId&&<Link className="text-droid underline" to={`/events/${x.eventId}`}>Related event</Link>}{x.ctaUrl&&<a className="btn-p" href={x.ctaUrl} target="_blank" rel="noreferrer">{x.ctaLabel||'Learn more'}</a>}</div></article></Reveal>)}</div>}</Sec>}

const Card=({m,big}:{m:TeamMember;big?:boolean})=><article className={`glass flex gap-4 p-5 ${big?'flex-col sm:flex-row sm:p-7':'flex-col items-start'}`}><Avatar src={m.image} name={m.name} className={big?'h-28 w-28 text-2xl':'h-16 w-16'}/><div><h3 className="text-lg font-bold">{m.name}</h3><p className="text-sm font-semibold text-droid">{m.designation}</p><p className="text-xs text-mute">{[m.department,m.year].filter(Boolean).join(', ')}</p><p className="mt-2 text-sm text-mute">{m.bio}</p><div className="mt-3 flex gap-3 text-sm">{m.linkedin&&<a className="text-droid underline" href={m.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}{m.github&&<a className="text-droid underline" href={m.github} target="_blank" rel="noreferrer">GitHub</a>}</div></div></article>
function Team(){const{data:m,loading}=useService(teamService.getTeamMembers),{data:r}=useService(teamService.getTeamRoles)
 const cur=(m||[]).filter(x=>x.current),rank=(d:string)=>r?.find(x=>x.name===d)?.rank??9,lead=cur.filter(x=>rank(x.designation)<=2),rest=cur.filter(x=>rank(x.designation)>2)
 return<Sec id="team" kicker="The people behind it" title="Meet the team.">{loading?<Spinner/>:!cur.length?<Empty title="Team profiles coming soon"/>:<><p className="mb-6 text-sm text-mute">Demo profiles. Replace them from the admin dashboard.</p><div className="grid gap-5 lg:grid-cols-2">{lead.map(x=><Reveal key={x.id}><Card m={x} big/></Reveal>)}</div><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map(x=><Reveal key={x.id}><Card m={x}/></Reveal>)}</div></>}</Sec>}

export function Home(){const{data:c}=useService(clubService.getClubSettings);if(!c)return<Spinner/>;return<><Hero c={c}/><About c={c}/><News/><Events/><Team/></>}

export function NotFound({what='Page'}:{what?:string}){return<div className="grid min-h-[60vh] place-items-center px-5 text-center"><div><p className="text-6xl font-extrabold text-droid">404</p><h1 className="mt-2 text-2xl font-bold">{what} not found</h1><p className="mt-2 text-mute">It may have been moved, unpublished or never existed.</p><Link to="/" className="btn-p mt-6">Back to home</Link></div></div>}

function Lightbox({imgs,i,setI,close}:{imgs:{url:string;alt:string}[];i:number;setI:(n:number)=>void;close:()=>void}){const n=imgs.length
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')close();if(e.key==='ArrowRight')setI((i+1)%n);if(e.key==='ArrowLeft')setI((i-1+n)%n)};addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[i,n])
 return<div role="dialog" aria-modal="true" aria-label="Image viewer" data-lenis-prevent className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4"><button autoFocus aria-label="Close image viewer" onClick={close} className="absolute right-4 top-4 rounded-full bg-white/10 p-3"><X/></button><button aria-label="Previous image" onClick={()=>setI((i-1+n)%n)} className="absolute left-3 rounded-full bg-white/10 p-3"><ChevronLeft/></button><img src={imgs[i].url} alt={imgs[i].alt} className="max-h-[85vh] max-w-full rounded-xl"/><button aria-label="Next image" onClick={()=>setI((i+1)%n)} className="absolute right-3 rounded-full bg-white/10 p-3"><ChevronRight/></button><p className="absolute bottom-4 text-sm text-mute">{i+1} / {n}</p></div>}

export function EventDetail(){const{id}=useParams(),{data:e,loading}=useService(()=>eventService.getEventById(id!),[id]),{data:t}=useService(teamService.getTeamMembers),[lb,setLb]=useState<number|null>(null)
 if(loading)return<Spinner/>;if(!e||!e.published)return<NotFound what="Event"/>
 const org=(t||[]).filter(m=>e.organizerIds.includes(m.id))
 return<article className="mx-auto max-w-4xl px-5 py-10"><Link to="/#events" className="inline-flex items-center gap-1 text-sm text-droid"><ArrowLeft size={16}/>Back to events</Link>
 <img src={e.cover} alt={`${e.title} cover`} className="mt-4 aspect-[16/8] w-full rounded-2xl object-cover"/>
 <p className="mt-6 text-sm font-semibold text-droid">{e.category} · {e.status==='upcoming'?'Upcoming':'Completed'}</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">{e.title}</h1>
 <p className="mt-3 flex flex-wrap items-center gap-x-4 text-mute"><span>{fmt(e.date)}, {e.time}</span><span className="flex items-center gap-1"><MapPin size={16}/>{e.venue}</span></p>
 <p className="mt-6 text-lg leading-relaxed text-mute">{e.description}</p>
 {e.registrationUrl&&<a href={e.registrationUrl} target="_blank" rel="noreferrer" className="btn-p mt-6">Register</a>}
 {!!e.highlights.length&&<section className="mt-10"><h2 className="text-xl font-bold">Highlights</h2><ul className="mt-3 grid gap-2">{e.highlights.map(h=><li key={h} className="flex gap-2 text-mute"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-droid"/>{h}</li>)}</ul></section>}
 {!!org.length&&<section className="mt-10"><h2 className="text-xl font-bold">Organizers</h2><ul className="mt-3 flex flex-wrap gap-3">{org.map(m=><li key={m.id} className="glass flex items-center gap-3 p-3"><Avatar src={m.image} name={m.name} className="h-10 w-10 text-sm"/><div><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-mute">{m.designation}{!m.current&&' (former)'}</p></div></li>)}</ul></section>}
 <section className="mt-10"><h2 className="text-xl font-bold">Gallery</h2>{e.gallery.length?<ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">{e.gallery.map((g,i)=><li key={g.id}><button className="block w-full overflow-hidden rounded-xl" aria-label={`Open photo ${i+1}: ${g.alt}`} onClick={()=>setLb(i)}><img src={g.url} alt={g.alt} loading="lazy" className="aspect-video w-full object-cover transition hover:scale-105"/></button></li>)}</ul>:<p className="mt-3 text-mute">No photographs yet.</p>}</section>
 {lb!==null&&<Lightbox imgs={e.gallery} i={lb} setI={setLb} close={()=>setLb(null)}/>}</article>}
