import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useState, useEffect } from "react";
import LoadingScreen from "./components/LoadingScreen";
import PageLayout from "./components/PageLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientRegister from "./pages/PatientRegister";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ProgressNotes from "./pages/ProgressNotes";
import Diagnosis from "./pages/Diagnosis";
import MedicalHistory from "./pages/MedicalHistory";
import Reports from "./pages/Reports";
import Forum from "./pages/Forum";
import Reminders from "./pages/Reminders";
import MyMriScans from "./pages/MyMriScans";
import AdminDoctorRegister from "./pages/AdminDoctorRegister";
import AdminDoctorAccounts from "./pages/AdminDoctorAccounts";
import Contact from "./pages/Contact";
import DoctorMriManagement from "./pages/DoctorMriManagement";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin role protected route
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, userData, loading, isAdmin } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser || !userData || !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Doctor role protected route - Updated to allow access to patients for their own data
const DoctorOrPatientRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser || !userData) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Patient role protected route
const PatientRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, userData, loading, isPatient } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser || !userData || !isPatient()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const DoctorOrPatientMriRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser || !userData || (userData.role !== "doctor" && userData.role !== "patient")) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const location = useLocation();
  const skipLoading = location.state?.skipLoading;

  const [isPageLoading, setIsPageLoading] = useState(!skipLoading);

  useEffect(() => {
    if (skipLoading) {
      setIsPageLoading(false);
    } else {
      // Simulate a short loading time
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [skipLoading]);

  if (isPageLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsPageLoading(false)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/patient-register" element={<PatientRegister />} />
      <Route path="/contact" element={<Contact />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/doctor-register" 
        element={
          <AdminRoute>
            <AdminDoctorRegister />
          </AdminRoute>
        } 
      />
      <Route 
        path="/progress-notes" 
        element={
          <DoctorOrPatientRoute>
            <ProgressNotes />
          </DoctorOrPatientRoute>
        } 
      />
      <Route 
        path="/diagnosis" 
        element={
          <DoctorOrPatientRoute>
            <Diagnosis />
          </DoctorOrPatientRoute>
        } 
      />
      <Route 
        path="/medical-history" 
        element={
          <DoctorOrPatientRoute>
            <MedicalHistory />
          </DoctorOrPatientRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <DoctorOrPatientRoute>
            <Reports />
          </DoctorOrPatientRoute>
        } 
      />
      <Route 
        path="/forum" 
        element={
          <ProtectedRoute>
            <Forum />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reminders" 
        element={
          <ProtectedRoute>
            <Reminders />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-mri-scans" 
        element={
          <DoctorOrPatientMriRoute>
            <MyMriScans />
          </DoctorOrPatientMriRoute>
        } 
      />
      <Route 
        path="/doctor/mri-management" 
        element={
          <ProtectedRoute>
            <DoctorMriManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/doctor-accounts" 
        element={
          <AdminRoute>
            <AdminDoctorAccounts />
          </AdminRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {isLoading ? (
              <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />
            ) : (
              <PageLayout>
                <AppRoutes />
              </PageLayout>
            )}
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
