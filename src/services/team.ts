import type{TeamMember,TeamRole}from'../types'
import{emitChange,fail,requireSupabase}from'./client'
import{mapMember,mapRole,type TeamMemberRow,type TeamRoleRow}from'./rows'

function memberPatch(d:Partial<TeamMember>){
 const out:Record<string,unknown>={}
 if(d.name!==undefined)out.name=d.name
 if(d.designation!==undefined)out.designation=d.designation
 if(d.bio!==undefined)out.bio=d.bio
 if(d.department!==undefined)out.department=d.department
 if(d.year!==undefined)out.year=d.year
 if(d.image!==undefined)out.image=d.image
 if(d.linkedin!==undefined)out.linkedin=d.linkedin||''
 if(d.github!==undefined)out.github=d.github||''
 if(d.current!==undefined)out.current=d.current
 return out
}

function createPatch(d:Omit<TeamMember,'id'|'order'>){
 return{
  name:d.name,designation:d.designation,bio:d.bio??'',department:d.department??'',
  year:d.year??'',image:d.image??'',linkedin:d.linkedin||'',github:d.github||'',
  current:d.current??true
 }
}

export const teamService={
 async getTeamMembers():Promise<TeamMember[]>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('team_members').select('*').order('sort_order',{ascending:true})
  if(error)fail(error,'Could not load the team.')
  return((data??[])as TeamMemberRow[]).map(mapMember)
 },

 async createTeamMember(d:Omit<TeamMember,'id'|'order'>):Promise<TeamMember>{
  const sb=requireSupabase()
  const{data:last,error:lastError}=await sb.from('team_members')
   .select('sort_order').order('sort_order',{ascending:false}).limit(1).maybeSingle()
  if(lastError)fail(lastError,'Could not add the team member.')
  const next=Number((last as{sort_order?:number}|null)?.sort_order??0)+1
  const{data,error}=await sb.from('team_members')
   .insert({...createPatch(d),sort_order:next}).select('*').single()
  if(error)fail(error,'Could not add the team member.')
  emitChange()
  return mapMember(data as TeamMemberRow)
 },

 async updateTeamMember(id:string,d:Partial<TeamMember>):Promise<TeamMember>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('team_members').update(memberPatch(d)).eq('id',id).select('*').maybeSingle()
  if(error)fail(error,'Could not update the team member.')
  if(!data)throw new Error('Team member not found, or you do not have permission to edit it.')
  emitChange()
  return mapMember(data as TeamMemberRow)
 },
 async deleteTeamMember(id:string):Promise<boolean>{
  const sb=requireSupabase()
  const{error}=await sb.rpc('delete_team_member',{p_member_id:id})
  if(error)fail(error,'Could not remove the team member.')
  emitChange()
  return true
 },

 async reorderTeamMembers(ids:string[]):Promise<boolean>{
  const sb=requireSupabase()
  const{error}=await sb.rpc('reorder_team_members',{p_ids:ids})
  if(error)fail(error,'Could not save the new team order.')
  emitChange()
  return true
 },

 async getTeamRoles():Promise<TeamRole[]>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('team_roles').select('*').order('rank',{ascending:true}).order('name',{ascending:true})
  if(error)fail(error,'Could not load team roles.')
  return((data??[])as TeamRoleRow[]).map(mapRole)
 },

 async createTeamRole(d:Omit<TeamRole,'id'>):Promise<TeamRole>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('team_roles').insert({name:d.name,rank:d.rank}).select('*').single()
  if(error)fail(error,'Could not create the team role.')
  emitChange()
  return mapRole(data as TeamRoleRow)
 },

 async updateTeamRole(id:string,d:Partial<TeamRole>):Promise<TeamRole>{
  const sb=requireSupabase()
  const patch:Record<string,unknown>={}
  if(d.name!==undefined)patch.name=d.name
  if(d.rank!==undefined)patch.rank=d.rank
  const{data,error}=await sb.from('team_roles').update(patch).eq('id',id).select('*').maybeSingle()
  if(error)fail(error,'Could not update the team role.')
  if(!data)throw new Error('Team role not found, or you do not have permission to edit it.')
  emitChange()
  return mapRole(data as TeamRoleRow)
 },

 async deleteTeamRole(id:string):Promise<boolean>{
  const sb=requireSupabase()
  const{data,error}=await sb.from('team_roles').delete().eq('id',id).select('id')
  if(error)fail(error,'Could not delete the team role.')
  if(!data?.length)throw new Error('Team role not found, or you do not have permission to delete it.')
  emitChange()
  return true
 }
}
