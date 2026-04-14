import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Medicines from './pages/Medicines';
import POS from './pages/POS';
import Sales from './pages/Sales';
import UserManagement from './pages/UserManagement';
import Batches from './pages/Batches';
import Reports from './pages/Reports';
import SystemJobs from './pages/SystemJobs';
import AuditLogs from './pages/AuditLogs';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Admin & Pharmacist */}
            <Route 
              path="inventory" 
              element={<ProtectedRoute allowedRoles={['admin', 'pharmacist']}><Inventory /></ProtectedRoute>} 
            />
            <Route 
              path="medicines" 
              element={<ProtectedRoute allowedRoles={['admin', 'pharmacist']}><Medicines /></ProtectedRoute>} 
            />
            <Route 
              path="batches" 
              element={<ProtectedRoute allowedRoles={['admin', 'pharmacist']}><Batches /></ProtectedRoute>} 
            />
            
            {/* Admin, Pharmacist & Cashier shared Terminal/Sales */}
            <Route 
              path="pos" 
              element={<ProtectedRoute allowedRoles={['admin', 'pharmacist', 'cashier']}><POS /></ProtectedRoute>} 
            />
            <Route 
              path="sales" 
              element={<ProtectedRoute allowedRoles={['admin', 'pharmacist', 'cashier']}><Sales /></ProtectedRoute>} 
            />

            {/* Shared Reports */}
            <Route 
              path="reports" 
              element={<ProtectedRoute allowedRoles={['admin', 'pharmacist', 'cashier']}><Reports /></ProtectedRoute>} 
            />

            {/* Admin Only */}
            <Route 
              path="users" 
              element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} 
            />

            <Route 
              path="audit-logs" 
              element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} 
            />
            <Route 
              path="jobs" 
              element={<ProtectedRoute allowedRoles={['admin']}><SystemJobs /></ProtectedRoute>} 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
