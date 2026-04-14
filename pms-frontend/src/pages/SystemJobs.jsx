import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Cpu, AlertCircle, Clock, Trash2, RefreshCw, Activity } from 'lucide-react';

export default function SystemJobs() {
  const [data, setData] = useState({ pending_count: 0, failed_jobs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFailedJob = async (id) => {
    if (window.confirm("Remove this failed job record?")) {
      try {
        await api.delete(`/jobs/${id}`);
        fetchJobs();
      } catch (error) {
        alert("Failed to delete job");
      }
    }
  };

  if (loading) return <div className="flex justify-center p-10 font-bold text-slate-500">Scanning Queues...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div className="flex items-center space-x-4">
           <div className="p-3 bg-medical-50 dark:bg-medical-900/30 text-medical-600 dark:text-medical-400 rounded-xl">
              <Cpu size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Queue Monitor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monitor background processing and dead-letter queues.</p>
           </div>
        </div>
        <button 
          onClick={fetchJobs}
          className="flex items-center px-4 py-2 text-sm font-bold text-medical-700 dark:text-medical-400 bg-medical-50 dark:bg-medical-900/30 hover:bg-medical-100 dark:hover:bg-medical-900/50 rounded-lg transition-all"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card flex items-center justify-between overflow-hidden relative group transition-colors duration-300">
           <div className="absolute right-[-10px] bottom-[-10px] text-slate-50 dark:text-slate-700 opacity-5 dark:opacity-20 group-hover:scale-110 transition-transform duration-500">
               <Clock size={120} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pending Tasks</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100">{data.pending_count}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center">
                 <Activity size={12} className="mr-1" />
                 Active Workers: 2
              </p>
           </div>
           <div className="h-16 w-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500">
              <Clock size={32} />
           </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card flex items-center justify-between overflow-hidden relative group transition-colors duration-300">
           <div className="absolute right-[-10px] bottom-[-10px] text-rose-50 dark:text-rose-900 opacity-5 dark:opacity-20 group-hover:scale-110 transition-transform duration-500">
               <AlertCircle size={120} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Failed Jobs</p>
              <h3 className="text-4xl font-black text-rose-600 dark:text-rose-400">{data.failed_jobs.length}</h3>
              <p className="text-xs text-rose-500 dark:text-rose-400 font-bold mt-2">Requires manual intervention</p>
           </div>
           <div className="h-16 w-16 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-400 dark:text-rose-500">
              <AlertCircle size={32} />
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card overflow-hidden transition-colors duration-300">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Dead Letter Queue (Recent Failures)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job Class</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Failed At</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Exception</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {data.failed_jobs.length > 0 ? data.failed_jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {job.payload ? JSON.parse(job.payload).displayName : "Unknown Job"}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {new Date(job.failed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 truncate bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded inline-block">
                      {job.exception?.split('\n')[0] || "No detail"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteFailedJob(job.id)}
                      className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic">No failed system jobs found. Queue is clean.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
