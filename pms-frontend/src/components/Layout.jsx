import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { LayoutDashboard, Package, LogOut, ActivitySquare, ShoppingCart, Pill, Receipt, Users, BarChart3, ClipboardList, Cpu, History, Sun, Moon } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard', roles: ['admin', 'pharmacist', 'cashier'] },
    { name: 'Inventory', icon: <Package size={18} />, path: '/inventory', roles: ['admin', 'pharmacist'] },
    { name: 'Medicines', icon: <Pill size={18} />, path: '/medicines', roles: ['admin', 'pharmacist'] },
    { name: 'Batches', icon: <History size={18} />, path: '/batches', roles: ['admin', 'pharmacist'] },
    { name: 'Terminal', icon: <ShoppingCart size={18} />, path: '/pos', roles: ['admin', 'pharmacist', 'cashier'] },
    { name: 'Sales Ledger', icon: <Receipt size={18} />, path: '/sales', roles: ['admin', 'pharmacist', 'cashier'] },
    { name: 'Users', icon: <Users size={18} />, path: '/users', roles: ['admin'] },
    { name: 'Reports', icon: <BarChart3 size={18} />, path: '/reports', roles: ['admin', 'pharmacist', 'cashier'] },
    { name: 'Audit Logs', icon: <ClipboardList size={18} />, path: '/audit-logs', roles: ['admin'] },
    { name: 'System Jobs', icon: <Cpu size={18} />, path: '/jobs', roles: ['admin'] },
  ];

  const menu = allMenu.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar - Clean, crisp white panel */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0 transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-100/60 dark:border-slate-800 mb-4">
          <ActivitySquare className="text-medical-600 dark:text-medical-500 mr-2" size={24} strokeWidth={2.5} />
          <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100">PharmaCore</span>
        </div>
        
        <div className="px-4 mb-3">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 mb-2">Main Menu</p>
          <nav className="space-y-0.5">
            {menu.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 relative group ${
                    isActive 
                      ? 'bg-medical-50 dark:bg-medical-900/30 text-medical-700 dark:text-medical-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-medical-600 dark:bg-medical-500 rounded-r-md"></div>}
                  <div className={`mr-3 ${isActive ? 'text-medical-600 dark:text-medical-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'} transition-colors duration-150`}>
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto px-4 pb-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 flex items-center space-x-3 mb-2 shadow-subtle group">
            <div className="h-9 w-9 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{user?.name}</p>
              <p className="uppercase font-medium text-[10px] text-slate-500 dark:text-slate-400 tracking-wider truncate border border-slate-200 dark:border-slate-700 inline-block px-1.5 py-0.5 rounded mt-0.5">{user?.role}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-500 transition-colors duration-150 font-medium group"
          >
            <LogOut size={16} className="mr-2" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Flow Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-colors duration-300">
        <header className="h-16 flex items-center justify-between px-10 border-b border-transparent shrink-0 pt-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight capitalize">
            {location.pathname.replace('/', '') || 'Dashboard'}
          </h1>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-medical-600 dark:hover:text-medical-400 shadow-sm transition-all"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        
        <div className="flex-1 overflow-auto px-10 pb-10 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
