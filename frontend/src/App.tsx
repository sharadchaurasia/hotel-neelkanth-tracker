import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import DayBook from './pages/DayBook';
import Salary from './pages/Salary';
import MonthEnd from './pages/MonthEnd';

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
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/daybook" element={<DayBook />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/month-end" element={<MonthEnd />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
