import{useEffect,useMemo,useRef,useState,type FormEvent,type ReactNode}from'react'
import{motion,useReducedMotion,useScroll,useTransform,useMotionValue,animate,type MotionValue}from'framer-motion'
import{X,Loader2,Upload}from'lucide-react'
import{onChange,mediaService,teamService,onAuthChange,getAuthSnapshot}from'./services'
import{initSmooth}from'./smooth'
import{siAndroid}from'simple-icons'

export function useService<T>(fn:()=>Promise<T>,deps:unknown[]=[]){
 const[s,setS]=useState<{d?:T;ready:boolean;err?:string}>({ready:false})
 useEffect(()=>{let ok=true;const run=()=>fn().then(d=>{if(ok)setS({d,ready:true})},e=>{if(ok)setS({ready:true,err:e.message})});run();const off=onChange(run);return()=>{ok=false;off()}},deps)
 return{data:s.d,loading:!s.ready,error:s.err}}

// Cached auth snapshot. Re-renders guards when the session is restored, expired
// or signed out, without changing any existing markup.
export function useAuth(){const[a,setA]=useState(getAuthSnapshot());useEffect(()=>onAuthChange(()=>setA(getAuthSnapshot())),[]);return a}

let push:(m:string,k?:string)=>void=()=>{}
export const toast=(m:string,k='ok')=>push(m,k)
export function Toaster(){const[l,setL]=useState<{id:number;m:string;k:string}[]>([])
 useEffect(()=>{push=(m,k='ok')=>{const id=Math.random();setL(x=>[...x,{id,m,k}]);setTimeout(()=>setL(x=>x.filter(i=>i.id!==id)),3800)}},[])
 return<div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex max-w-[90vw] flex-col gap-2">{l.map(t=><div key={t.id} className={`glass px-4 py-3 text-sm ${t.k==='err'?'border-red-400/60 text-red-200':'border-droid/50'}`}>{t.m}</div>)}</div>}

export function Logo({src,className='h-10 w-10'}:{src:string;className?:string}){const[bad,setBad]=useState(false)
 return bad?<div role="img" aria-label="Club logo placeholder" className={`${className} grid place-items-center rounded-full bg-droid/20 text-xs font-bold text-droid`}>AC</div>:<img src={src} alt="Android Club VIT-AP logo" onError={()=>setBad(true)} className={`${className} rounded-full object-cover`}/>}
export const Avatar=({src,name,className='h-16 w-16'}:{src?:string;name:string;className?:string})=>src?<img src={src} alt={name} className={`${className} shrink-0 rounded-full object-cover`}/>:<div role="img" aria-label={name} className={`${className} grid shrink-0 place-items-center rounded-full bg-droid/15 font-bold text-droid`}>{name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
// iOS-26-style entrance: content starts blurred/faded and sharpens as it scrolls in (and re-blurs scrolling back up).
// The filter is removed completely once sharp so glass cards keep their backdrop blur.
const BLUR=18
function useBlur(p:MotionValue<number>){return{opacity:useTransform(p,[0,1],[0,1]),filter:useTransform(p,v=>v>=.999?'none':`blur(${(1-v)*BLUR}px)`),y:useTransform(p,[0,1],[36,0]),scale:useTransform(p,[0,1],[.97,1])}}
export const Reveal=({children,className=''}:{children:ReactNode;className?:string})=>{const r=useReducedMotion(),ref=useRef<HTMLDivElement>(null),{scrollYProgress}=useScroll({target:ref,offset:['start 112%','start 60%']}),st=useBlur(scrollYProgress)
 return r?<div className={className}>{children}</div>:<motion.div ref={ref} className={className} style={st}>{children}</motion.div>}
export const BlurIn=({children,delay=0,className=''}:{children:ReactNode;delay?:number;className?:string})=>{const r=useReducedMotion(),p=useMotionValue(r?1:0),st=useBlur(p)
 useEffect(()=>{if(r)return;const a=animate(p,1,{duration:1.2,delay,ease:[.22,1,.36,1]});return()=>a.stop()},[])
 return<motion.div className={className} style={st}>{children}</motion.div>}
export const Spinner=()=><div role="status" className="grid place-items-center py-16 text-droid"><Loader2 className="animate-spin" aria-label="Loading"/></div>
export const Empty=({title,hint}:{title:string;hint?:string})=><div className="glass p-10 text-center"><p className="font-semibold">{title}</p>{hint&&<p className="mt-1 text-sm text-mute">{hint}</p>}</div>

export function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:ReactNode}){const r=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const d=r.current;if(!d)return;if(open&&!d.open)d.showModal();if(!open&&d.open)d.close()},[open])
 return<dialog ref={r} onClose={onClose} onMouseDown={e=>{if(e.target===r.current)onClose()}} aria-label={title} data-lenis-prevent className="m-auto max-h-[90vh] w-[min(92vw,46rem)] overflow-y-auto rounded-2xl border border-white/10 bg-surface p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"><div className="p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-full p-2 hover:bg-white/10"><X size={18}/></button></div>{open&&children}</div></dialog>}
export const Confirm=({open,title,text,onYes,onNo}:{open:boolean;title:string;text:string;onYes:()=>void;onNo:()=>void})=><Modal open={open} onClose={onNo} title={title}><p className="text-mute">{text}</p><div className="mt-6 flex justify-end gap-2"><button className="btn-g" onClick={onNo}>Cancel</button><button className="btn-d" onClick={onYes}>Delete</button></div></Modal>

export type F={k:string;label:string;t:'text'|'area'|'date'|'time'|'select'|'combo'|'check'|'img'|'imgs'|'lines'|'members';opts?:[string,string][];req?:boolean}
export const clean=(fs:F[],v:any)=>{const o={...v};fs.forEach(f=>{if(f.t==='lines')o[f.k]=(o[f.k]||[]).map((s:string)=>s.trim()).filter(Boolean)});return o}
export function Fields({fields,v,set}:{fields:F[];v:any;set:(k:string,x:any)=>void}){
 const{data:team}=useService(teamService.getTeamMembers)
 const up=async(files:FileList|null,k:string,multi:boolean)=>{if(!files?.length)return;try{const a=await Promise.all([...files].map(f=>mediaService.uploadImage(f)));if(multi)set(k,[...(v[k]||[]),...a.map(x=>({id:x.id,url:x.url,alt:x.name}))]);else set(k,a[0].url);toast('Image uploaded.')}catch(e:any){toast(e.message,'err')}}
 return<div className="grid gap-4 sm:grid-cols-2">{fields.map(f=>{
  const id='f-'+f.k,val=v[f.k],wide=!['text','date','time','select','combo'].includes(f.t),chg=(e:any)=>set(f.k,e.target.value)
  let c:ReactNode
  if(f.t==='check')c=<label className="flex items-center gap-2 py-2"><input type="checkbox" className="h-4 w-4 accent-[#3DDC84]" checked={!!val} onChange={e=>set(f.k,e.target.checked)}/>{f.label}</label>
  else{let ctl:ReactNode
   if(f.t==='area')ctl=<textarea id={id} rows={4} className="in" value={val||''} onChange={chg}/>
   else if(f.t==='lines')ctl=<textarea id={id} rows={5} className="in" value={(val||[]).join('\n')} onChange={e=>set(f.k,e.target.value.split('\n'))}/>
   else if(f.t==='select')ctl=<select id={id} className="in" value={val||''} onChange={chg}><option value="">None</option>{f.opts?.map(([o,l])=><option key={o} value={o}>{l}</option>)}</select>
   else if(f.t==='img')ctl=<div className="flex flex-wrap items-center gap-4">{val?<img src={val} alt="Selected preview" className="h-20 w-32 rounded-lg object-cover"/>:<span className="text-sm text-mute">No image selected</span>}<label className="btn-g cursor-pointer focus-within:outline"><Upload size={16}/>{val?'Replace image':'Choose image'}<input type="file" accept="image/*" className="sr-only" onChange={e=>up(e.target.files,f.k,false)}/></label></div>
   else if(f.t==='imgs')ctl=<div>{(val||[]).length?<ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">{val.map((im:any)=><li key={im.id} className="relative"><img src={im.url} alt={im.alt} className="aspect-video w-full rounded-lg object-cover"/><button type="button" aria-label={`Remove image ${im.alt}`} onClick={()=>set(f.k,val.filter((x:any)=>x.id!==im.id))} className="absolute right-1 top-1 rounded-full bg-black/80 p-1 hover:bg-red-500"><X size={14}/></button></li>)}</ul>:<p className="text-sm text-mute">No gallery images yet.</p>}<label className="btn-g mt-2 w-fit cursor-pointer focus-within:outline"><Upload size={16}/>Add images<input multiple type="file" accept="image/*" className="sr-only" onChange={e=>up(e.target.files,f.k,true)}/></label></div>
   else if(f.t==='members')ctl=<div className="grid gap-1 sm:grid-cols-2">{(team||[]).map(m=><label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#3DDC84]" checked={(val||[]).includes(m.id)} onChange={e=>set(f.k,e.target.checked?[...(val||[]),m.id]:(val||[]).filter((x:string)=>x!==m.id))}/>{m.name}{!m.current&&' (former)'}</label>)}</div>
   else ctl=<><input id={id} type={f.t==='combo'?'text':f.t} list={f.t==='combo'?id+'l':undefined} className="in" value={val||''} onChange={chg}/>{f.t==='combo'&&<datalist id={id+'l'}>{f.opts?.map(([o])=><option key={o} value={o}/>)}</datalist>}</>
   c=<div><label htmlFor={id} className="mb-1 block text-sm font-medium">{f.label}{f.req&&<span className="text-droid"> *</span>}</label>{ctl}</div>}
  return<div key={f.k} className={wide?'sm:col-span-2':''}>{c}</div>})}</div>}

export function FormBody({fields,init,onSave,onCancel,label='Save'}:{fields:F[];init:any;onSave:(v:any)=>Promise<unknown>;onCancel:()=>void;label?:string}){
 const[v,setV]=useState(init),[busy,setBusy]=useState(false),[err,setErr]=useState<string>()
 const set=(k:string,x:any)=>setV((p:any)=>({...p,[k]:x}))
 const submit=async(e:FormEvent)=>{e.preventDefault();const m=fields.find(f=>f.req&&!String(v[f.k]??'').trim());if(m)return setErr(`${m.label} is required.`);setBusy(true);setErr(undefined);try{await onSave(clean(fields,v))}catch(x:any){setErr(x.message)}setBusy(false)}
 return<form onSubmit={submit} noValidate><Fields fields={fields} v={v} set={set}/>{err&&<p role="alert" className="mt-4 text-sm text-red-300">{err}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-g" onClick={onCancel}>Cancel</button><button className="btn-p" disabled={busy}>{busy?'Saving…':label}</button></div></form>}

// ---- Background grid + logo tiles + cursor glow ----
// Background tiles use only the Android mark (simple-icons).
const LOGO:Record<string,string>={android:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${siAndroid.path}"/></svg>`)}
type Item={k:string;x:number;y:number;s:number;big:boolean}
const SMALL:[string,number,number][]=[['android',.07,.12],['android',.04,.3],['android',.1,.7],['android',.16,.92],['android',.3,.14],['android',.36,.52],['android',.45,.82],['android',.5,.34],['android',.58,.1],['android',.62,.64],['android',.72,.9],['android',.8,.62],['android',.9,.8],['android',.93,.5]]
function layout(w:number,h:number){const cols=Math.floor(w/48),rows=Math.floor(h/48),big=w>=768,s=big?96:48,sx=(cols-(big?2:1))*48,items:Item[]=[]
 SMALL.forEach(([k,fx,fy])=>{const x=Math.round(fx*(cols-1))*48,y=Math.round(fy*(rows-1))*48;if(x+48<=sx)items.push({k,x,y,s:48,big:false})})
 // Right-edge column: big logos stacked one below another for the full height, cycling through the set again when it runs out.
 const seq=['android'];for(let i=0,y=48;y+s<=h-24;i++,y+=s+48)items.push({k:seq[i%seq.length],x:sx,y,s,big})
 return{items,sx}}
const mask=(u:string)=>({WebkitMaskImage:`url("${u}")`,maskImage:`url("${u}")`})

// Soft glow trailing the pointer, glow on the glass card under it, and glowing logo tiles near it.
// Pointer effects run for fine pointers only; the trailing glow is off for reduced motion.
export function Effects(){
 const[sz,setSz]=useState({w:innerWidth,h:innerHeight}),lay=useMemo(()=>layout(sz.w,sz.h),[sz]),items=lay.items,ref=useRef(items),els=useRef<(HTMLDivElement|null)[]>([])
 ref.current=items
 useEffect(()=>initSmooth(),[])
 useEffect(()=>{const f=()=>setSz(p=>p.w!==innerWidth||Math.abs(p.h-innerHeight)>120?{w:innerWidth,h:innerHeight}:p);addEventListener('resize',f);return()=>removeEventListener('resize',f)},[])
 useEffect(()=>{
  if(!matchMedia('(pointer:fine)').matches)return
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches,glow=document.getElementById('cur-glow')!,root=document.documentElement.style
  let x=innerWidth/2,y=innerHeight/2,gx=x,gy=y,id=0
  const mv=(e:MouseEvent)=>{x=e.clientX;y=e.clientY;root.setProperty('--cx',x+'px');root.setProperty('--cy',y+'px');if(!still)glow.style.opacity='1'
   ref.current.forEach((it,i)=>{const el=els.current[i];if(el)el.style.setProperty('--g',String(Math.max(0,1-Math.hypot(x-it.x-it.s/2,y-it.y-it.s/2)/(it.big?340:220))**1.6))})
   const g=(e.target as Element).closest('.glass') as HTMLElement|null
   if(g){const r=g.getBoundingClientRect();g.style.setProperty('--mx',e.clientX-r.left+'px');g.style.setProperty('--my',e.clientY-r.top+'px')}}
  const off=()=>{glow.style.opacity='0';root.setProperty('--cx','-999px');els.current.forEach(el=>el?.style.setProperty('--g','0'))}
  const tick=()=>{gx+=(x-gx)*.07;gy+=(y-gy)*.07;glow.style.transform=`translate(${gx-320}px,${gy-320}px)`;id=requestAnimationFrame(tick)}
  addEventListener('mousemove',mv);document.documentElement.addEventListener('mouseleave',off);if(!still)id=requestAnimationFrame(tick)
  return()=>{cancelAnimationFrame(id);removeEventListener('mousemove',mv);document.documentElement.removeEventListener('mouseleave',off)}},[])
 const g=`linear-gradient(to right,#000 ${lay.sx}px,transparent ${lay.sx}px)` // no grid behind the big-logo column
 return<><div id="grid-bg" aria-hidden="true"><div className="absolute inset-0" style={{WebkitMaskImage:g,maskImage:g}}><div className="grid-base"/><div className="grid-hot"/></div>{items.map((it,i)=><div key={it.k+i} ref={el=>{els.current[i]=el}} className="bg-logo" style={{left:it.x,top:it.y,width:it.s,height:it.s}}><span className="lg-dim" style={{...mask(LOGO[it.k]),width:it.s*.5,height:it.s*.5}}/><span className="lg-hot" style={{...mask(LOGO[it.k]),width:it.s*.5,height:it.s*.5}}/></div>)}</div><div id="cur-glow" aria-hidden="true"/></>}
