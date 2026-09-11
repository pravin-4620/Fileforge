import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Converter from './pages/Converter'
import History from './pages/History'
import Admin from './pages/Admin'
import Settings from './pages/Settings'

function Guard({children,admin=false}){const{user,loading}=useAuth();if(loading)return <div className="min-h-screen grid place-items-center bg-paper dark:bg-[#101514]"><div className="w-10 h-10 rounded-full border-4 border-ink/10 border-t-teal animate-spin"/></div>;if(!user)return <Navigate to="/login" replace/>;if(admin&&!user.isAdmin)return <Navigate to="/app" replace/>;return children}
export default function App(){return <Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<Auth/>}/><Route path="/register" element={<Auth register/>}/><Route path="/app" element={<Guard><AppLayout/></Guard>}><Route index element={<Dashboard/>}/><Route path="convert" element={<Converter/>}/><Route path="history" element={<History/>}/><Route path="settings" element={<Settings/>}/><Route path="admin" element={<Guard admin><Admin/></Guard>}/></Route><Route path="*" element={<Navigate to="/"/>}/></Routes>}
