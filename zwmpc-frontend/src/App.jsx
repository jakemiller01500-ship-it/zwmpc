import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Branches from './Branches';
import StorageMonitor from './StorageMonitor';
import UserManagement from './UserManagement';
import Products from './Products';
import Transactions from './Transactions';
import DashboardHome from './DashboardHome'; // NEW
import Reports from './Reports'; // NEW

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />}>
          
          {/* Use the dynamic DashboardHome for all roles */}
          <Route index element={<DashboardHome />} />
          
          <Route path="branches" element={<Branches />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="storage" element={<StorageMonitor />} />
          <Route path="products" element={<Products />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} /> {/* NEW */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;