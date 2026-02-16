import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import RoleProtectedRoute from "@/components/layout/RoleProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import CreateTask from "./pages/CreateTask";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Onboarding from "./pages/Onboarding";
import VerificationPending from "./pages/VerificationPending";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import SafetyPolicy from "./pages/legal/SafetyPolicy";
import TrustSafety from "./pages/legal/TrustSafety";
import EscrowTerms from "./pages/legal/EscrowTerms";
import DisputeResolution from "./pages/legal/DisputeResolution";
import Contact from "./pages/legal/Contact";
import Safety from "./pages/Safety";
import AdminModeration from "./pages/AdminModeration";
import UserVerification from "./pages/admin/UserVerification";
import DisputeDetail from "./pages/DisputeDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SupabaseAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/verification-pending" element={<VerificationPending />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/safety-policy" element={<SafetyPolicy />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/trust" element={<TrustSafety />} />
              <Route path="/escrow" element={<EscrowTerms />} />
              <Route path="/disputes" element={<DisputeResolution />} />
              <Route path="/contact" element={<Contact />} />

              {/* Legacy redirect */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* ACE routes */}
              <Route path="/ace/dashboard" element={
                <RoleProtectedRoute allowedRoles={['task_doer']}>
                  <Dashboard />
                </RoleProtectedRoute>
              } />
              <Route path="/ace/tasks" element={
                <RoleProtectedRoute allowedRoles={['task_doer']}>
                  <Tasks />
                </RoleProtectedRoute>
              } />
              <Route path="/ace/task/:id" element={
                <RoleProtectedRoute allowedRoles={['task_doer']}>
                  <TaskDetail />
                </RoleProtectedRoute>
              } />

              {/* CAPTAIN routes */}
              <Route path="/captain/dashboard" element={
                <RoleProtectedRoute allowedRoles={['task_poster']}>
                  <Dashboard />
                </RoleProtectedRoute>
              } />
              <Route path="/captain/create-task" element={
                <RoleProtectedRoute allowedRoles={['task_poster']}>
                  <CreateTask />
                </RoleProtectedRoute>
              } />
              <Route path="/captain/task/:id" element={
                <RoleProtectedRoute allowedRoles={['task_poster']}>
                  <TaskDetail />
                </RoleProtectedRoute>
              } />

              {/* Shared authenticated routes (both roles) */}
              <Route path="/tasks" element={
                <RoleProtectedRoute allowedRoles={['task_doer', 'task_poster']}>
                  <Tasks />
                </RoleProtectedRoute>
              } />
              <Route path="/task/:id" element={
                <RoleProtectedRoute allowedRoles={['task_doer', 'task_poster']}>
                  <TaskDetail />
                </RoleProtectedRoute>
              } />
              <Route path="/create-task" element={
                <RoleProtectedRoute allowedRoles={['task_poster']}>
                  <CreateTask />
                </RoleProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin/moderation" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminModeration />
                </RoleProtectedRoute>
              } />
              <Route path="/admin/verification" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <UserVerification />
                </RoleProtectedRoute>
              } />
              <Route path="/dispute/:id" element={
                <RoleProtectedRoute allowedRoles={['task_doer', 'task_poster', 'admin']}>
                  <DisputeDetail />
                </RoleProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SupabaseAuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
