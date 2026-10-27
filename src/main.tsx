import{StrictMode}from'react'
import{createRoot}from'react-dom/client'
import{BrowserRouter,Navigate,Route,Routes}from'react-router-dom'
import'./index.css'
import{Toaster,Effects}from'./ui'
import{PublicLayout,Home,EventDetail,NotFound}from'./pages/public'
import{AdminLayout,Login,Dashboard,EventsAdmin,TeamAdmin,NewsAdmin,SettingsAdmin}from'./pages/admin'
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><Toaster/><Effects/><Routes>
<Route element={<PublicLayout/>}><Route index element={<Home/>}/><Route path="events/:id" element={<EventDetail/>}/></Route>
<Route path="admin/login" element={<Login/>}/>
<Route path="admin" element={<AdminLayout/>}><Route index element={<Dashboard/>}/><Route path="events" element={<EventsAdmin/>}/><Route path="team" element={<TeamAdmin/>}/><Route path="announcements" element={<NewsAdmin/>}/><Route path="settings" element={<SettingsAdmin/>}/><Route path="*" element={<Navigate to="/admin" replace/>}/></Route>
<Route path="*" element={<NotFound/>}/></Routes></BrowserRouter></StrictMode>)
