import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Branches from './Branches';
import StorageMonitor from './StorageMonitor';
import UserManagement from './UserManagement';
import Products from './Products';
import Transactions from './Transactions';
import DashboardHome from './DashboardHome'; // Make sure this file exists!
import Reports from './Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* The Main Dashboard Wrapper (Sidebar + Content Area) */}
        <Route path="/dashboard" element={<Dashboard />}>
          
          {/* 1. THE HOME PAGE (When you click "Home" in the sidebar) */}
          <Route index element={<DashboardHome />} />
          
          {/* 2. OTHER PAGES */}
          <Route path="branches" element={<Branches />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="storage" element={<StorageMonitor />} />
          <Route path="products" element={<Products />} />
          <Route path="transactions" element={<Transactions />} />
          
          {/* 3. THE REPORTS PAGE (When you click "Sales & Reports") */}
          <Route path="reports" element={<Reports />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;