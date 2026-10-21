import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Branches from './Branches';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<h1>Welcome to the ZWMPC Dashboard</h1>} />
          <Route path="branches" element={<Branches />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;