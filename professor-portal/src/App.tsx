// ============================================
// Professor Portal - Main App
// ============================================

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Groups from './pages/Groups';
import Profile from './pages/Profile';

// ============================================
// Protected Route Wrapper
// ============================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, profileLoading } = useAuth();
    const location = useLocation();

    // Show loading only during initial auth check
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full" />
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Show content even if profile is still loading (non-blocking)
    return <>{children}</>;
}

// ============================================
// App Component
// ============================================
function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected routes */}
                    <Route path="/" element={<ProtectedRoute><Navigate to="/home" replace /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/home" replace /></ProtectedRoute>} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

                    {/* Attendance */}
                    <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
                    <Route path="/attendance/take/:classSubjectId" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

                    {/* Marks */}
                    <Route path="/marks" element={<ProtectedRoute><Marks /></ProtectedRoute>} />

                    {/* Timetable - redirect to home since we integrated it there */}
                    <Route path="/timetable" element={<ProtectedRoute><Home /></ProtectedRoute>} />

                    {/* Groups & Communication */}
                    <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                    <Route path="/groups/:groupId" element={<ProtectedRoute><Groups /></ProtectedRoute>} />

                    {/* Profile */}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* Notifications placeholder */}
                    <Route path="/notifications" element={
                        <ProtectedRoute>
                            <div className="min-h-screen bg-bg-primary p-4 pb-20">
                                <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
                                <p className="text-text-secondary mt-2">Coming soon...</p>
                            </div>
                        </ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
