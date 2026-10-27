import Lenis from'lenis'
let lenis:Lenis|null=null
// Slow, eased scrolling for wheel/trackpad/touch. Disabled when the user prefers reduced motion.
export function initSmooth(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return
 lenis=new Lenis({duration:1.9,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),wheelMultiplier:.6,touchMultiplier:1.1})
 let id=requestAnimationFrame(function raf(t){lenis?.raf(t);id=requestAnimationFrame(raf)})
 return()=>{cancelAnimationFrame(id);lenis?.destroy();lenis=null}}
export function smoothScrollTo(target:number|HTMLElement,immediate=false){
 if(lenis)lenis.scrollTo(target,{offset:typeof target==='number'?0:-72,duration:2.2,immediate})
 else if(typeof target==='number')window.scrollTo({top:target})
 else target.scrollIntoView({behavior:'smooth'})}
