import type{MediaAsset}from'../types'
import{emitChange,fail,requireSupabase}from'./client'

const EXT:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}

function check(f:File){
 if(!EXT[f.type])throw new Error('Only PNG, JPG, WebP or GIF images are allowed.')
 if(f.size>3*1024*1024)throw new Error('Image must be under 3 MB.')
}

export const mediaService={
  async previewImage(f:File):Promise<MediaAsset>{
  check(f)
  return{id:crypto.randomUUID(),url:URL.createObjectURL(f),name:f.name,size:f.size,temporary:true}
 },

 async uploadImage(f:File):Promise<MediaAsset>{
  check(f)
  const sb=requireSupabase()
  const{data:auth}=await sb.auth.getUser()
  if(!auth.user)throw new Error('Sign in to upload images.')
  const path=`content/${new Date().getFullYear()}/${crypto.randomUUID()}.${EXT[f.type]}`
  const{error}=await sb.storage.from('media').upload(path,f,{
   contentType:f.type,cacheControl:'31536000',upsert:false
  })
  if(error)fail(error,'Could not upload the image.')
  const url=sb.storage.from('media').getPublicUrl(path).data.publicUrl
  const{data,error:dbError}=await sb.from('media')
   .insert({path,url,name:f.name,mime:f.type,size:f.size,uploaded_by:auth.user.id})
   .select('id').single()
  if(dbError){
      await sb.storage.from('media').remove([path])
   fail(dbError,'Could not save the image details.')
  }
  return{id:(data as{id:string}).id,url,name:f.name,size:f.size,temporary:false}
 },

 async deleteImage(id:string):Promise<boolean>{
  const sb=requireSupabase()
  const{data,error}=await sb.rpc('delete_media',{p_media_id:id})
  if(error)fail(error,'Could not delete the image.')
  if(typeof data==='string'&&data){
   const{error:removeError}=await sb.storage.from('media').remove([data])
   if(removeError)fail(removeError,'The image record was removed but the file could not be deleted.')
  }
  emitChange()
  return true
 }
}
