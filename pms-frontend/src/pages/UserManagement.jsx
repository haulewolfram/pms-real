import { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserPlus, Pencil, Trash2, ShieldCheck, Mail, User } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      console.log("Submitting User Payload:", payload);
      
      // If editing and password is empty, don't send it
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (error) {
      console.error("User Creation Error:", error.response?.data);
      const errorData = error.response?.data;
      let errorMsg = errorData?.message || "Check fields";
      
      if (errorData?.errors) {
        const details = Object.values(errorData.errors).flat().join(", ");
        errorMsg += ": " + details;
      }
      
      alert("Error saving user: " + errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || "Delete failed");
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show password
      role: user.role,
    });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center p-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm italic">Manage system access for Administrators, Pharmacists, and Cashiers.</p>
        <button 
          onClick={() => { setEditingUser(null); setFormData({name:'', email:'', password:'', role:'cashier'}); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-medical-600 dark:bg-medical-500 text-white rounded-lg hover:bg-medical-700 dark:hover:bg-medical-600 transition-all font-medium shadow-sm"
        >
          <UserPlus size={18} className="mr-2" />
          Add New User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card overflow-hidden border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center">
                    <Mail size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                    {u.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                    u.role === 'pharmacist' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => openEditModal(u)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-medical-600 dark:hover:text-medical-400 hover:bg-medical-50 dark:hover:bg-medical-900/30 rounded-md transition-all"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                   <User className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
                   <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 text-slate-900 dark:text-slate-100 transition-all outline-none"
                   />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
                   <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 text-slate-900 dark:text-slate-100 transition-all outline-none"
                   />
                </div>
              </div>
              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Password</span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal normal-case italic text-[10px]">Min. 8 characters</span>
                  </label>
                  <input 
                    type="password" 
                    required 
                    minLength={8}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 text-slate-900 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Role</label>
                <div className="relative">
                   <ShieldCheck className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
                   <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 text-slate-900 dark:text-slate-100 transition-all outline-none appearance-none"
                   >
                    <option value="cashier">Cashier</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Admin</option>
                   </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-medical-600 dark:bg-medical-500 text-white rounded-lg hover:bg-medical-700 dark:hover:bg-medical-600 transition-all font-medium shadow-md shadow-medical-600/10"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
