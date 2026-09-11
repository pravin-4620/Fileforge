import { useEffect, useState } from 'react'
import { HiOutlineCircleStack, HiOutlineExclamationTriangle, HiOutlineServerStack, HiOutlineUsers } from 'react-icons/hi2'
import api from '../services/api'
import StatCard from '../components/StatCard'
import { prettyBytes } from '../utils/formats'

export default function Admin() {
  const [data, setData] = useState({ users: 0, conversions: 0, failed: 0, storage: 0, recentUsers: [] })
  useEffect(() => { api.get('/admin/dashboard').then(response => setData(response.data)) }, [])

  return <div className="animate-enter min-w-0">
    <p className="mono text-xs font-bold tracking-widest text-teal">ADMINISTRATION</p><h1 className="page-heading mt-2 font-extrabold tracking-[-.045em]">System pulse</h1>
    <div className="stats-grid mt-6 sm:mt-8"><StatCard label="Users" value={data.users} detail="Registered accounts" icon={HiOutlineUsers}/><StatCard label="Conversions" value={data.conversions} detail="All time" icon={HiOutlineServerStack}/><StatCard label="Failed" value={data.failed} detail="Needs attention" icon={HiOutlineExclamationTriangle}/><StatCard label="Storage" value={prettyBytes(data.storage)} detail="Currently in use" icon={HiOutlineCircleStack}/></div>
    <section className="mt-5 rounded-2xl bg-white p-4 dark:bg-[#18201f] sm:p-6"><h2 className="font-extrabold">Server status</h2><div className="server-grid mt-5">{['API service', 'MongoDB', 'Conversion queue'].map((label, index) => <div key={label} className="rounded-xl bg-[#f3f6f5] p-4 dark:bg-black/10"><p className="text-sm font-bold">{label}</p><p className={`mt-2 text-xs font-bold ${index === 2 ? 'text-amber-600' : 'text-teal'}`}>● {index === 2 ? `${data.queued || 0} waiting` : 'Operational'}</p></div>)}</div></section>
  </div>
}
