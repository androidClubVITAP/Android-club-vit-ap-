import{useEffect,useRef,useState,type ReactNode}from'react'
import{Link,Outlet,useLocation,useNavigate,useParams}from'react-router-dom'
import{Menu,X,MapPin,ArrowRight,ArrowLeft,CheckCircle2,Mail,ExternalLink,ChevronLeft,ChevronRight}from'lucide-react'
import{clubService,eventService,teamService,announcementService,authService}from'../services'
import{useService,Logo,Avatar,Reveal,BlurIn,Spinner,Empty,Modal}from'../ui'
import{smoothScrollTo}from'../smooth'
import type{Announcement,ClubSettings,EventItem,TeamMember}from'../types'
export const fmt=(d:string)=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})

// Links are stored as "Label | https://…" lines (or just a URL).
export const parseLinks=(l:string[]=[])=>l.map(s=>{const[a,...b]=s.split('|'),u=(b.join('|')||a).trim();return{label:b.length?a.trim():u,url:u}}).filter(x=>/^https?:\/\//.test(x.url))
// Only docs.google.com/forms links can be embedded; short forms.gle links open in a new tab instead.
const embed=(u:string)=>{try{const x=new URL(u);if(x.hostname==='docs.google.com'&&x.pathname.includes('/forms/')){x.searchParams.set('embedded','true');return x.toString()}}catch{}return null}
export function RegisterModal({open,onClose,title,url,images=[],links=[]}:{open:boolean;onClose:()=>void;title:string;url:string;images?:{id?:string;url:string;alt?:string}[];links?:string[]}){const src=embed(url),ls=parseLinks(links)
 return<Modal open={open} onClose={onClose} title={`Register: ${title}`}>
  {!!images.length&&<div className="mb-4 grid gap-3 sm:grid-cols-2">{images.map((g,i)=><img key={g.id||i} src={g.url} alt={g.alt||`${title} info ${i+1}`} className="w-full rounded-xl object-cover"/>)}</div>}
  {src?<iframe title={`${title} registration form`} src={src} className="h-[65vh] w-full rounded-xl bg-white" loading="lazy"/>:<p className="text-mute">This form can't be shown inside the page, so it opens in a new tab.</p>}
  <div className="mt-4 flex flex-wrap gap-2"><a className="btn-p" href={url} target="_blank" rel="noreferrer"><ExternalLink size={16}/>Open form in new tab</a>{ls.map(l=><a key={l.url} className="btn-g" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}</div></Modal>}
const links:[string,string][]=[['Home','/'],['About','/#about'],['Events','/#events'],['Team','/#team'],['Contact','/#contact']]

function Nav({c}:{c:ClubSettings}){const[o,setO]=useState(false),[s,setS]=useState(false),loc=useLocation()
 useEffect(()=>{const f=()=>setS(scrollY>20);f();addEventListener('scroll',f,{passive:true});return()=>removeEventListener('scroll',f)},[])
 useEffect(()=>setO(false),[loc])

 // Scroll-spy: highlight the nav item for the section currently in view. Clicking a link highlights it immediately
 // and pauses the spy while the smooth scroll travels, so intermediate sections don't flicker.
 const[spy,setSpy]=useState('home'),lock=useRef(0)
 useEffect(()=>{if(loc.pathname!=='/')return
  if(loc.hash){lock.current=Date.now()+2600;setSpy(loc.hash.slice(1))}else{lock.current=Date.now()+300;setSpy('home')}
  let raf=0
  const calc=()=>{raf=0;if(Date.now()<lock.current)return;let cur='home';for(const id of['about','events','team','contact']){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=innerHeight*.4)cur=id}
   if(innerHeight+scrollY>=document.documentElement.scrollHeight-8)cur='contact';setSpy(cur)}
  const f=()=>{if(!raf)raf=requestAnimationFrame(calc)}
  addEventListener('scroll',f,{passive:true});addEventListener('resize',f);const t=setTimeout(f,2800)
  return()=>{removeEventListener('scroll',f);removeEventListener('resize',f);cancelAnimationFrame(raf);clearTimeout(t)}},[loc.pathname,loc.hash,loc.key])
 const on=(h:string)=>loc.pathname==='/'&&(h==='/'?spy==='home':spy===h.slice(2))
 const cls=(h:string)=>`rounded-full px-3 py-2 text-sm font-medium transition ${on(h)?'bg-droid/15 text-droid':'text-mute hover:text-white'}`
 return<header className={`sticky top-0 z-50 border-b transition ${s||o?'border-white/10 bg-ink/75 backdrop-blur-xl':'border-transparent bg-white/[.02] backdrop-blur-sm'}`}><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
  <Link to="/" className="flex items-center gap-3"><Logo src={c.logoUrl} className="h-10 w-10"/><span className="font-bold tracking-tight">{c.name}</span></Link>
  <nav aria-label="Main" className="hidden items-center gap-1 md:flex">{links.map(([l,h])=><Link key={h} to={h} className={cls(h)} aria-current={on(h)?'page':undefined}>{l}</Link>)}</nav>
  <Link to="/#events" className="btn-p hidden md:inline-flex">Explore Events</Link>
  <button className="rounded-full p-2 hover:bg-white/10 md:hidden" aria-label={o?'Close menu':'Open menu'} aria-expanded={o} aria-controls="mnav" onClick={()=>setO(!o)}>{o?<X/>:<Menu/>}</button></div>
  {o&&<nav id="mnav" aria-label="Mobile" className="flex flex-col gap-1 px-5 pb-4 md:hidden">{links.map(([l,h])=><Link key={h} to={h} className={cls(h)+' py-3'}>{l}</Link>)}<Link to="/#events" className="btn-p mt-2">Explore Events</Link></nav>}</header>}

function Footer({c}:{c:ClubSettings}){const soc=[['Instagram',c.instagram],['LinkedIn',c.linkedin],['GitHub',c.github]].filter(s=>s[1])
 return<footer id="contact" className="scroll-mt-20 border-t border-white/10 bg-surface/60"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
  <div><div className="flex items-center gap-3"><Logo src={c.logoUrl} className="h-12 w-12"/><div><p className="font-bold">{c.name}</p><p className="text-sm text-mute">{c.college}</p></div></div><p className="mt-4 text-sm text-mute">{c.tagline}</p></div>
  <div><h2 className="font-semibold">Explore</h2><ul className="mt-3 space-y-2 text-sm text-mute">{links.map(([l,h])=><li key={h}><Link className="hover:text-droid" to={h}>{l}</Link></li>)}</ul></div>
  <div><h2 className="font-semibold">Contact</h2><div className="mt-3 space-y-2 text-sm text-mute">{c.email?<a className="flex items-center gap-2 hover:text-droid" href={`mailto:${c.email}`}><Mail size={16}/>{c.email}</a>:<p>Contact email not configured yet.</p>}{soc.map(([l,u])=><a key={l} className="block hover:text-droid" href={u} target="_blank" rel="noreferrer">{l}</a>)}</div></div></div>
  <p className="border-t border-white/10 py-4 text-center text-xs text-mute">© {new Date().getFullYear()} {c.name}, {c.college}. Sample content for demonstration.</p></footer>}

export function PublicLayout(){const{data:c,error}=useService(clubService.getClubSettings),loc=useLocation(),ready=!!c
 useEffect(()=>{if(!ready)return;if(loc.hash)setTimeout(()=>{const el=document.getElementById(loc.hash.slice(1));if(el)smoothScrollTo(el)},60);else smoothScrollTo(0,true)},[loc,ready])
 if(!c)return error?<div className="mx-auto max-w-6xl px-5 py-16"><Empty title="The club site could not load" hint={error}/></div>:<Spinner/>
 return<><Nav c={c}/><main key={loc.pathname} className="page-in"><Outlet/></main><Footer c={c}/></>}

const Sec=({id,kicker,title,children}:{id:string;kicker:string;title:string;children:ReactNode})=><section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-36"><Reveal><p className="text-sm font-semibold text-droid">{kicker}</p><h2 className="mb-8 mt-1 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2></Reveal>{children}</section>

// Big heading shaped like a transparent glass "screen": green/white liquid blobs flow inside ANDROID / CLUB.
// Any extra words (e.g. VIT-AP) are plain white, no fluid.
function FluidTitle({text}:{text:string}){const r=useRef<SVGSVGElement>(null);useEffect(()=>{const el=r.current;if(!el)return;const o=new IntersectionObserver(([e])=>el.classList.toggle('fpaused',!e.isIntersecting));o.observe(el);return()=>o.disconnect()},[]);const w=text.trim().split(/\s+/),big=w.slice(0,2),rest=w.slice(2).join(' '),mx=Math.max(...big.map(x=>x.length),1)
 const L=big.map((s,i)=><text key={s} x="6" y={175+i*175} fontSize={190} textLength={960*s.length/mx} lengthAdjust="spacingAndGlyphs" style={{fontFamily:'Inter,system-ui,sans-serif',fontWeight:900}}>{s}</text>)
 const blobs:[number,number,number,string,string][]=[[150,120,130,'#3DDC84','d1'],[520,300,150,'#00E676','d2'],[820,140,120,'#0E8F57','d3'],[300,380,110,'#CFFFE5','d4'],[700,380,140,'#3DDC84','d5'],[60,320,90,'#7CFFC4','d6']]
 return<h1 className="mt-2"><svg ref={r} viewBox="0 0 1000 480" role="img" aria-label={text} className="block w-full max-w-[680px] overflow-visible"><title>{text}</title>
  <defs><clipPath id="ft-clip">{L}</clipPath>
   <filter id="ft-goo" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="680"><feGaussianBlur stdDeviation="22"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9"/></filter>
   <filter id="ft-line" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1060" height="520"><feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d"/><feComposite in="d" in2="SourceAlpha" operator="out" result="r"/><feFlood floodColor="#fff"/><feComposite in2="r" operator="in"/></filter>
   <linearGradient id="ft-base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0c2a1c"/><stop offset="1" stopColor="#050805"/></linearGradient>
   <linearGradient id="ft-glare" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".4"/><stop offset=".5" stopColor="#fff" stopOpacity=".05"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
   <linearGradient id="ft-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#fff" stopOpacity=".55"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
  <g fill="rgba(255,255,255,.04)">{L}</g>
  <g clipPath="url(#ft-clip)"><rect width="1000" height="480" fill="url(#ft-base)"/><g filter="url(#ft-goo)">{blobs.map(([x,y,r,f,c])=><circle key={c} className={`fl ${c}`} cx={x} cy={y} r={r} fill={f}/>)}</g><rect width="1000" height="480" fill="url(#ft-glare)"/><rect className="sweep" x="-300" width="160" height="480" fill="url(#ft-sweep)"/></g>
  <g filter="url(#ft-line)" fill="#fff">{L}</g>
  {rest&&<text x="6" y="455" fontSize="84" fill="#fff" textLength={Math.min(960,rest.length*62)} lengthAdjust="spacingAndGlyphs" style={{fontFamily:'Inter,system-ui,sans-serif',fontWeight:900}}>{rest}</text>}</svg></h1>}

// Hidden admin entrance: click the empty area next to the title and type the access key. Only tiny asterisks appear
// (no box, no error message). A wrong key just fades away silently. The key is only a UX gate:
// it is bundled into the client and grants no permissions; Supabase Auth and RLS protect the data.
function SecretLock(){const nav=useNavigate(),[open,setO]=useState(false),[s,setS]=useState(''),ref=useRef<HTMLInputElement>(null),t=useRef(0)
 useEffect(()=>{if(open)ref.current?.focus();return()=>clearTimeout(t.current)},[open])
  const chg=async(v:string)=>{const n=v.length<s.length?s.slice(0,v.length):s+v.slice(s.length);setS(n);clearTimeout(t.current);t.current=window.setTimeout(()=>setS(''),4000);if(await authService.verifyAccessKey(n))nav('/admin/login')}
 return<><div className="absolute left-[62%] top-[40%] h-[44%] w-[24%]">{open?<input ref={ref} type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Access key" className="absolute inset-0 h-full w-full cursor-default bg-transparent opacity-0 caret-transparent" value={'*'.repeat(s.length)} onChange={e=>chg(e.target.value)} onBlur={()=>{setO(false);setS('')}} onKeyDown={e=>{if(e.key==='Escape'){setO(false);setS('')}if(e.key==='Enter')setS('')}}/>:<button type="button" aria-label="Secret access" onClick={()=>setO(true)} className="h-full w-full cursor-default rounded-2xl opacity-0 focus-visible:opacity-100"/>}</div>
  <span aria-hidden="true" className="pointer-events-none absolute left-[61%] top-[59%] flex h-[7%] w-[19%] items-center text-base tracking-[.25em] text-white/80">{'*'.repeat(s.length)}</span></>}

function Hero({c}:{c:ClubSettings}){const{data:ev}=useService(()=>eventService.getEvents({publishedOnly:true,status:'upcoming'})),{data:pe}=useService(()=>eventService.getEvents({publishedOnly:true})),{data:tm}=useService(teamService.getTeamMembers),f=ev?.[0]
 const stats=[[String(pe?.length??0).padStart(2,'0'),'Featured activities'],[String(tm?.filter(m=>m.current).length??0).padStart(2,'0'),'Team members'],['∞','Ideas to build']]
 return<section className="relative overflow-hidden"><div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-droid/20 blur-[120px]"/><div className="absolute bottom-[-12rem] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-neon/10 blur-[120px]"/></div>
 <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:min-h-[88vh] md:py-24 lg:grid-cols-[1.2fr_.8fr]"><div>
  <BlurIn><Logo src={c.logoUrl} className="h-28 w-28 shadow-[0_0_60px_-10px_rgba(61,220,132,.5)]"/><p className="mt-6 text-sm text-mute">{c.college} · Student technical community</p></BlurIn>
  <BlurIn delay={.12}><div className="relative w-full max-w-[680px]"><FluidTitle text={c.heroHeading}/><SecretLock/></div></BlurIn>
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

function News(){const{data:a,loading}=useService(()=>announcementService.getAnnouncements({activeOnly:true})),{data:evs}=useService(eventService.getEvents),[reg,setReg]=useState<any>(null)
 const info=(x:Announcement)=>{const e=evs?.find(v=>v.id===x.eventId),url=x.registrationUrl||e?.registrationUrl;return url?{title:x.title,url,images:[...(x.image?[{id:'ai',url:x.image,alt:x.title}]:[]),...(e?.regImages||[])],links:[...(x.links||[]),...(e?.links||[])]}:null}
 return<Sec id="announcements" kicker="Stay in the loop" title="Club announcements.">{loading?<Spinner/>:!a?.length?<Empty title="No announcements right now" hint="Check back soon."/>:<div className="grid gap-4 md:grid-cols-2">{a.map(x=><Reveal key={x.id} className={x.featured?'md:col-span-2':''}><article className={`glass h-full p-6 ${x.featured?'border-droid/40 bg-droid/5':''}`}>{x.image&&<img src={x.image} alt="" className="mb-4 max-h-56 w-full rounded-xl object-cover"/>}{x.featured&&<span className="rounded-full bg-droid px-2 py-0.5 text-xs font-bold text-ink">Featured</span>}<h3 className={`mt-2 font-bold ${x.featured?'text-2xl':'text-lg'}`}>{x.title}</h3><p className="mt-2 text-mute">{x.message}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="text-mute">{fmt(x.publishedOn)}</span>{x.eventId&&<Link className="text-droid underline" to={`/events/${x.eventId}`}>Related event</Link>}{parseLinks(x.links).map(l=><a key={l.url} className="text-droid underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}{info(x)&&<button className="btn-p" onClick={()=>setReg(info(x))}>Register</button>}{x.ctaUrl&&<a className="btn-g" href={x.ctaUrl} target="_blank" rel="noreferrer">{x.ctaLabel||'Learn more'}</a>}</div></article></Reveal>)}</div>}
 <RegisterModal open={!!reg} onClose={()=>setReg(null)} title={reg?.title||''} url={reg?.url||''} images={reg?.images} links={reg?.links}/></Sec>}

const Card=({m,big}:{m:TeamMember;big?:boolean})=><article className={`glass flex gap-4 p-5 ${big?'flex-col sm:flex-row sm:p-7':'flex-col items-start'}`}><Avatar src={m.image} name={m.name} className={big?'h-28 w-28 text-2xl':'h-16 w-16'}/><div><h3 className="text-lg font-bold">{m.name}</h3><p className="text-sm font-semibold text-droid">{m.designation}</p><p className="text-xs text-mute">{[m.department,m.year].filter(Boolean).join(', ')}</p><p className="mt-2 text-sm text-mute">{m.bio}</p><div className="mt-3 flex gap-3 text-sm">{m.linkedin&&<a className="text-droid underline" href={m.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}{m.github&&<a className="text-droid underline" href={m.github} target="_blank" rel="noreferrer">GitHub</a>}</div></div></article>
function Team(){const{data:m,loading}=useService(teamService.getTeamMembers),{data:r}=useService(teamService.getTeamRoles)
 const cur=(m||[]).filter(x=>x.current),rank=(d:string)=>r?.find(x=>x.name===d)?.rank??9,lead=cur.filter(x=>rank(x.designation)<=2),rest=cur.filter(x=>rank(x.designation)>2)
 return<Sec id="team" kicker="The people behind it" title="Meet the team.">{loading?<Spinner/>:!cur.length?<Empty title="Team profiles coming soon"/>:<><div className="grid gap-5 lg:grid-cols-2">{lead.map(x=><Reveal key={x.id}><Card m={x} big/></Reveal>)}</div><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map(x=><Reveal key={x.id}><Card m={x}/></Reveal>)}</div></>}</Sec>}

const split=(s:string)=>{const i=s.indexOf('|');return i<0?[s,'']:[s.slice(0,i).trim(),s.slice(i+1).trim()]}
function Pillars({c}:{c:ClubSettings}){return<Sec id="activities" kicker="What we do" title="Learn it. Build it. Ship it."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(c.pillars||[]).map((p,i)=>{const[t,d]=split(p);return<Reveal key={p}><div className="glass h-full p-7"><p className="text-5xl font-extrabold text-droid/30">{String(i+1).padStart(2,'0')}</p><h3 className="mt-4 text-xl font-bold">{t}</h3><p className="mt-2 text-mute">{d}</p></div></Reveal>})}</div></Sec>}
function Faq({c}:{c:ClubSettings}){return<Sec id="faq" kicker="Good to know" title="Questions, answered."><div className="mx-auto grid max-w-3xl gap-3">{(c.faqs||[]).map(f=>{const[q,a]=split(f);return<Reveal key={f}><details className="glass p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-3 text-mute">{a}</p></details></Reveal>})}</div></Sec>}
function Join({c}:{c:ClubSettings}){return<section className="mx-auto max-w-6xl px-5 py-20 md:py-32"><Reveal><div className="glass p-10 text-center md:p-16"><h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">Join {c.name}</h2><p className="mx-auto mt-4 max-w-xl text-lg text-mute">{c.description}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/#events" className="btn-p">Explore Events</Link>{c.email&&<a className="btn-g" href={`mailto:${c.email}`}>Email us</a>}</div></div></Reveal></section>}

export function Home(){const{data:c}=useService(clubService.getClubSettings);if(!c)return<Spinner/>;return<><Hero c={c}/><About c={c}/><Pillars c={c}/><News/><Events/><Team/><Faq c={c}/><Join c={c}/></>}

export function NotFound({what='Page'}:{what?:string}){return<div className="grid min-h-[60vh] place-items-center px-5 text-center"><div><p className="text-6xl font-extrabold text-droid">404</p><h1 className="mt-2 text-2xl font-bold">{what} not found</h1><p className="mt-2 text-mute">It may have been moved, unpublished or never existed.</p><Link to="/" className="btn-p mt-6">Back to home</Link></div></div>}

function Lightbox({imgs,i,setI,close}:{imgs:{url:string;alt:string}[];i:number;setI:(n:number)=>void;close:()=>void}){const n=imgs.length
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')close();if(e.key==='ArrowRight')setI((i+1)%n);if(e.key==='ArrowLeft')setI((i-1+n)%n)};addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[i,n])
 return<div role="dialog" aria-modal="true" aria-label="Image viewer" data-lenis-prevent className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4"><button autoFocus aria-label="Close image viewer" onClick={close} className="absolute right-4 top-4 rounded-full bg-white/10 p-3"><X/></button><button aria-label="Previous image" onClick={()=>setI((i-1+n)%n)} className="absolute left-3 rounded-full bg-white/10 p-3"><ChevronLeft/></button><img src={imgs[i].url} alt={imgs[i].alt} className="max-h-[85vh] max-w-full rounded-xl"/><button aria-label="Next image" onClick={()=>setI((i+1)%n)} className="absolute right-3 rounded-full bg-white/10 p-3"><ChevronRight/></button><p className="absolute bottom-4 text-sm text-mute">{i+1} / {n}</p></div>}

export function EventDetail(){const{id}=useParams(),{data:e,loading}=useService(()=>eventService.getEventById(id!),[id]),{data:t}=useService(teamService.getTeamMembers),[lb,setLb]=useState<number|null>(null),[reg,setReg]=useState(false)
 if(loading)return<Spinner/>;if(!e||!e.published)return<NotFound what="Event"/>
 const org=(t||[]).filter(m=>e.organizerIds.includes(m.id))
 return<article className="mx-auto max-w-4xl px-5 py-10"><Link to="/#events" className="inline-flex items-center gap-1 text-sm text-droid"><ArrowLeft size={16}/>Back to events</Link>
 <img src={e.cover} alt={`${e.title} cover`} className="mt-4 aspect-[16/8] w-full rounded-2xl object-cover"/>
 <p className="mt-6 text-sm font-semibold text-droid">{e.category} · {e.status==='upcoming'?'Upcoming':'Completed'}</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">{e.title}</h1>
 <p className="mt-3 flex flex-wrap items-center gap-x-4 text-mute"><span>{fmt(e.date)}, {e.time}</span><span className="flex items-center gap-1"><MapPin size={16}/>{e.venue}</span></p>
 <p className="mt-6 text-lg leading-relaxed text-mute">{e.description}</p>
 {e.registrationUrl&&<><button className="btn-p mt-6" onClick={()=>setReg(true)}>Register now</button><RegisterModal open={reg} onClose={()=>setReg(false)} title={e.title} url={e.registrationUrl} images={e.regImages} links={e.links}/></>}
 {!!parseLinks(e.links).length&&<div className="mt-4 flex flex-wrap gap-2">{parseLinks(e.links).map(l=><a key={l.url} className="btn-g" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}</div>}
 {!!e.regImages?.length&&<section className="mt-10"><h2 className="text-xl font-bold">Posters &amp; info</h2><ul className="mt-3 grid gap-3 sm:grid-cols-2">{e.regImages.map(g=><li key={g.id}><img src={g.url} alt={g.alt} className="w-full rounded-xl object-cover"/></li>)}</ul></section>}
 {!!e.highlights.length&&<section className="mt-10"><h2 className="text-xl font-bold">Highlights</h2><ul className="mt-3 grid gap-2">{e.highlights.map(h=><li key={h} className="flex gap-2 text-mute"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-droid"/>{h}</li>)}</ul></section>}
 {!!org.length&&<section className="mt-10"><h2 className="text-xl font-bold">Organizers</h2><ul className="mt-3 flex flex-wrap gap-3">{org.map(m=><li key={m.id} className="glass flex items-center gap-3 p-3"><Avatar src={m.image} name={m.name} className="h-10 w-10 text-sm"/><div><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-mute">{m.designation}{!m.current&&' (former)'}</p></div></li>)}</ul></section>}
 <section className="mt-10"><h2 className="text-xl font-bold">Gallery</h2>{e.gallery.length?<ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">{e.gallery.map((g,i)=><li key={g.id}><button className="block w-full overflow-hidden rounded-xl" aria-label={`Open photo ${i+1}: ${g.alt}`} onClick={()=>setLb(i)}><img src={g.url} alt={g.alt} loading="lazy" className="aspect-video w-full object-cover transition hover:scale-105"/></button></li>)}</ul>:<p className="mt-3 text-mute">No photographs yet.</p>}</section>
 {lb!==null&&<Lightbox imgs={e.gallery} i={lb} setI={setLb} close={()=>setLb(null)}/>}</article>}
