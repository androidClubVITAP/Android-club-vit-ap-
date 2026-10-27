export interface ClubSettings{name:string;college:string;tagline:string;description:string;about:string;mission:string;vision:string;objectives:string[];areas:string[];email:string;instagram:string;linkedin:string;github:string;logoUrl:string;heroHeading:string;heroSubtitle:string}
export interface EventImage{id:string;url:string;alt:string}
export interface EventItem{id:string;title:string;description:string;date:string;time:string;venue:string;category:string;status:'upcoming'|'completed';published:boolean;registrationUrl?:string;cover:string;gallery:EventImage[];highlights:string[];organizerIds:string[]}
export interface TeamRole{id:string;name:string;rank:number}
export interface TeamMember{id:string;name:string;designation:string;bio:string;department:string;year:string;image:string;linkedin?:string;github?:string;current:boolean;order:number}
export interface Announcement{id:string;title:string;message:string;publishedOn:string;expiresOn?:string;published:boolean;featured:boolean;eventId?:string;ctaLabel?:string;ctaUrl?:string}
export interface AdminUser{id:string;email:string;name:string}
export interface MediaAsset{id:string;url:string;name:string;size:number;temporary:boolean}
