import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ActivitySquare, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials provided');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      
      {/* Background mesh hint */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-medical-50 dark:bg-medical-900/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[400px] px-6 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl mb-6">
            <ActivitySquare size={32} strokeWidth={2.5} className="text-medical-600 dark:text-medical-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Sign in to PharmaCore</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Enter your admin credentials</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-crisp p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 text-[13px] font-medium p-3 rounded-lg border border-red-100 flex items-start">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[14px] rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 dark:focus:bg-slate-900 transition-colors"
                placeholder="Ex. admin@example.com"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[14px] rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 dark:focus:bg-slate-900 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-[14px] font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Continue</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
