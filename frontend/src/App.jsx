import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import DashboardPage from './pages/DashboardPage';
import TripPage from './pages/TripPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'var(--gradient-warm)', boxShadow: '0 0 30px rgba(var(--brand-rgb),0.45)' }}>S</div>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500"
              style={{ animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/trips/:id" element={<ProtectedRoute><TripPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function AppShell() {
  const { isClassic } = useTheme();

  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: isClassic ? '#1a1a2e' : '#ffffff',
                color: isClassic ? '#e2e8f0' : '#3d3128',
                border: isClassic ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(25,30,15,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: isClassic ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(61,49,40,0.12)',
              },
              success: { iconTheme: { primary: isClassic ? '#34d399' : '#5f7e44', secondary: isClassic ? '#1a1a2e' : '#ffffff' } },
              error: { iconTheme: { primary: isClassic ? '#f87171' : '#d63f3f', secondary: isClassic ? '#1a1a2e' : '#ffffff' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
