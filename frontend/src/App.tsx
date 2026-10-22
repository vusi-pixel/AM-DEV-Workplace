import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { WorkMode } from './pages/WorkMode';
import { LeaveManagement } from './pages/LeaveManagement';
import { Directory } from './pages/Directory';
import { Workspaces } from './pages/Workspaces';
import { Admin } from './pages/Admin';

// Department Modular Interfaces
import { EmployeePortal } from './departments/employee/pages/EmployeePortal';
import { HrPortal } from './departments/hr/pages/HrPortal';
import { FinancePortal } from './departments/finance/pages/FinancePortal';
import { FrontDeskPortal } from './departments/frontdesk/pages/FrontDeskPortal';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public login */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              
              {/* Dedicated Department Interfaces */}
              <Route path="/employee" element={<EmployeePortal />} />
              <Route path="/hr" element={<HrPortal />} />
              <Route path="/hr-portal" element={<HrPortal />} />
              <Route path="/finance" element={<FinancePortal />} />
              <Route path="/front-desk" element={<FrontDeskPortal />} />

              {/* Operations & Workspaces */}
              <Route path="/workspaces" element={<Workspaces />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/work-mode" element={<WorkMode />} />
              <Route path="/leave" element={<LeaveManagement />} />
              <Route path="/directory" element={<Directory />} />

              {/* Admin specific portal */}
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
