import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Branches from './Branches';
import StorageMonitor from './StorageMonitor';
import UserManagement from './UserManagement';
import Products from './Products';
import Transactions from './Transactions';
import DashboardHome from './DashboardHome'; 
import Reports from './Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* ONLY ONE DASHBOARD ROUTE */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="branches" element={<Branches />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="storage" element={<StorageMonitor />} />
          <Route path="products" element={<Products />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;