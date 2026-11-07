import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage'; // <-- Changed from Auth
import Dashboard from './Dashboard';
import Branches from './Branches';
import StorageMonitor from './StorageMonitor';
import UserManagement from './UserManagement';
import SuperAdminHome from './SuperAdminHome';
import AdminHome from './AdminHome';
import StaffHome from './StaffHome';
import Products from './Products'; 

function App() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Change this route to use LandingPage */}
        <Route path="/" element={<LandingPage />} /> 
        
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={
            !user ? <div>Loading...</div> :
            user.role === 'super_admin' ? <SuperAdminHome /> :
            user.role === 'admin' ? <AdminHome /> : 
            <StaffHome />
          } />
          <Route path="branches" element={<Branches />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="storage" element={<StorageMonitor />} />
          <Route path="products" element={<Products />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;