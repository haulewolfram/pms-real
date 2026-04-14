import { useState, useEffect } from 'react';
import api from '../api/axios';
import { History, Search, User, Database, Globe, Info, Clock, ArrowRight } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      // res.data is paginated { data: [], current_page: 1, ... }
      setLogs(res.data.data);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'create': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30';
      case 'update': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30';
      case 'delete': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30';
      case 'refund': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30';
    }
  };

  if (loading) return <div className="flex justify-center p-10">Searching archives...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
              <History size={20} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">System Audit Log</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Review a permanent record of all administrative activities.</p>
           </div>
        </div>
        
        <div className="relative w-full md:w-64">
           <Search size={16} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
           <input 
            type="text" 
            placeholder="Search by action, user, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 text-slate-900 dark:text-slate-100 transition-all outline-none text-sm"
           />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card overflow-hidden transition-colors duration-300">
         <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Model</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                       <Clock size={12} className="mr-2 text-slate-400 dark:text-slate-500" />
                       {new Date(log.created_at).toLocaleString('un-US', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                       <span className="mx-2 text-slate-300 dark:text-slate-600 font-normal">|</span>
                       <span className="text-slate-400 dark:text-slate-500 font-medium">
                         {new Date(log.created_at).toLocaleDateString()}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center group-hover:translate-x-1 transition-transform">
                        <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-[10px] font-black mr-2 uppercase">
                           {log.user?.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.user?.name}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                       {log.action}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                        <Database size={12} className="mr-2 text-slate-400 dark:text-slate-500" />
                        {log.model || 'System'}
                        <span className="ml-1 text-slate-300 dark:text-slate-500 font-medium">#{log.model_id}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        <Globe size={11} className="mr-1.5" />
                        {log.ip_address}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="p-2 text-slate-300 dark:text-slate-500 hover:text-medical-600 dark:hover:text-medical-400 hover:bg-medical-50 dark:hover:bg-medical-900/30 transition-all rounded-lg" title="View Data Change">
                        <Info size={16} />
                     </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                   <td colSpan="6" className="py-20 text-center text-slate-400 dark:text-slate-500 italic">No logs found matching your search.</td>
                </tr>
              )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
