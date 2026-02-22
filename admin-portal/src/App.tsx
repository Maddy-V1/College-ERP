// ============================================
// Admin Portal - Main App
// ============================================

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Professors from './pages/Professors';
import Students from './pages/Students';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import CourseDetail from './pages/CourseDetail';
import Sections from './pages/Sections';
import ClassManagement from './pages/ClassManagement';
import Subjects from './pages/Subjects';
import Courses from './pages/Courses';
import CourseBranches from './pages/CourseBranches';
import CourseBatches from './pages/CourseBatches';
import CourseBatchBranches from './pages/CourseBatchBranches';
import Notifications from './pages/Notifications';
import { Layout } from './components/layout/Layout';

// ============================================
// Protected Route Component
// ============================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-10 h-10 border-3 border-secondary border-t-transparent rounded-full" />
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

// ============================================
// Placeholder Pages (to be implemented)
// ============================================
function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-2xl font-bold text-text-primary mb-4">{title}</h1>
            <p className="text-text-secondary">Coming soon...</p>
        </div>
    );
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

                    {/* Protected routes with Layout */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />

                        {/* User Management */}
                        <Route path="students" element={<Students />} />
                        <Route path="students/new" element={<Students />} />
                        <Route path="professors" element={<Professors />} />
                        <Route path="professors/new" element={<Professors />} />

                        {/* Academic Structure - Batch to Class Flow */}
                        <Route path="batches" element={<Batches />} />
                        <Route path="batches/:batchId" element={<BatchDetail />} />
                        <Route path="batches/:batchId/courses/:courseId" element={<CourseDetail />} />
                        <Route path="batches/:batchId/courses/:courseId/branches/:branchId/sections" element={<Sections />} />

                        {/* Class Management */}
                        <Route path="classes" element={<ClassManagement />} />
                        <Route path="classes/:classId" element={<ClassManagement />} />

                        {/* Other pages */}
                        {/* Courses Management - Course → Batches → Branches/Classes */}
                        <Route path="courses" element={<Courses />} />
                        <Route path="courses/:courseId" element={<CourseBatches />} />
                        <Route path="courses/:courseId/branches" element={<CourseBranches />} />
                        <Route path="courses/:courseId/batches/:batchId" element={<CourseBatchBranches />} />

                        <Route path="subjects" element={<Subjects />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
