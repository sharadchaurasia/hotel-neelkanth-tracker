import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
// import NewBooking from './pages/NewBooking';
import Inventory from './pages/Inventory';
import Ledger from './pages/Ledger';
import AgentLedger from './pages/AgentLedger';
import Reports from './pages/Reports';
import DayBook from './pages/DayBook';
import Salary from './pages/Salary';
import KOT from './pages/KOT';
import AksOffice from './pages/AksOffice';
import Agents from './pages/Agents';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return !token ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(17,24,39,0.9)',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        },
        success: { style: { borderColor: 'rgba(34,197,94,0.3)' } },
        error: { style: { borderColor: 'rgba(244,63,94,0.3)' } },
      }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          {/* <Route path="/new-booking" element={<NewBooking />} /> */}
          {/* <Route path="/bookings/new" element={<NewBooking />} /> */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/agent-ledger" element={<AgentLedger />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/daybook" element={<DayBook />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/kot" element={<KOT />} />
          <Route path="/aks-office" element={<AksOffice />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/users" element={<Users />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
