import logo from './logo.svg';
import './App.css';

import Login from './pages/login';
import Dashboard from './pages/dashboard';
import EmployeeManagement from './pages/employeemanagement'; // modify to test CEemployee
import TimeTracking from "./pages/timetracking";
import PayrollPage from './pages/payroll'; 

import { HRNavbar } from './components/Navbar';
import ProfileDetails from "./components/EmployeeProfileDetails/ProfileDetails";
import Contract from "./pages/contract";
import {
  PrimaryButton,
  SecondaryButton,
  IconButton,
  DropdownButton,
} from "./components/button";
import Pagination from './components/pagination'

import {
    BrowserRouter as Router,
    Routes,
    Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";

function App() {
  return (
    <ThemeProvider>
    <Router>
      <div className="h-screen flex flex-col">
        <HRNavbar />
        
        <main className="flex-1 relative">
          {/*
          <PrimaryButton text="Save" onClick={() => alert("Saved!")} />
          <SecondaryButton text="Cancel" onClick={() => alert("Cancelled!")} />
          <IconButton icon={<FaSearch />} label="Search" onClick={() => alert("Searching...")} />
          <IconButton icon={<FaTrash />} label="Delete" onClick={() => alert("Deleted!")} /> */}
          {/* <DropdownButton
            label="Select Report"
            options={[
              { label: "Monthly Report", onClick: () => alert("Monthly selected") },
              { label: "Yearly Report", onClick: () => alert("Yearly selected") },
            ]}
          /> */}
            {/* <div className="p-4 md:p-8"> dùng để canh lề (margin)*/}
            <div className="p-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employeemanagement/profile/:id" element={<ProfileDetails />} />
                <Route path="/employeemanagement" element={<EmployeeManagement />} />
                <Route path="/contract" element={<Contract />} />
                <Route path="/timetracking" element={<TimeTracking />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/" element={
                  Boolean(localStorage.getItem('isAuthenticated')) ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } />
              </Routes>
            </div>
        </main>
      </div>
    </Router>
    </ThemeProvider>
  );
}

export default App;