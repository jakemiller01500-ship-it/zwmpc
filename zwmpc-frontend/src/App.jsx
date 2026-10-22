import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Branches from './Branches';
import StorageMonitor from './StorageMonitor';
import UserManagement from './UserManagement';
import SuperAdminHome from './SuperAdminHome';
import AdminHome from './AdminHome';
import StaffHome from './StaffHome';

function App() {
  // Read the user from local storage to determine which dashboard to show
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          
          {/* Dynamically load the Home component based on the role */}
          <Route index element={
            !user ? <div>Loading...</div> :
            user.role === 'super_admin' ? <SuperAdminHome /> :
            user.role === 'admin' ? <AdminHome /> : 
            <StaffHome />
          } />
          
          <Route path="branches" element={<Branches />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="storage" element={<StorageMonitor />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;