import Lenis from'lenis'
let lenis:Lenis|null=null
export function initSmooth(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return
 lenis=new Lenis({lerp:.055,wheelMultiplier:.75,touchMultiplier:1.2,syncTouch:true,syncTouchLerp:.08})
 let id=requestAnimationFrame(function raf(t){lenis?.raf(t);id=requestAnimationFrame(raf)})
 return()=>{cancelAnimationFrame(id);lenis?.destroy();lenis=null}}
export function smoothScrollTo(target:number|HTMLElement,immediate=false){
 if(lenis)lenis.scrollTo(target,{offset:typeof target==='number'?0:-72,duration:2.8,immediate})
 else if(typeof target==='number')window.scrollTo({top:target})
 else target.scrollIntoView({behavior:'smooth'})}
