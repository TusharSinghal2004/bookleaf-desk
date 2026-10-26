import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { MyBooksPage } from './pages/author/MyBooksPage';
import { BookDetailPage } from './pages/author/BookDetailPage';
import { NewTicketPage } from './pages/author/NewTicketPage';
import { MyTicketsPage } from './pages/author/MyTicketsPage';
import { TicketDetailPage } from './pages/author/TicketDetailPage';
import { AdminQueuePage } from './pages/admin/AdminQueuePage';
import { AdminTicketDetailPage } from './pages/admin/AdminTicketDetailPage';
import { queryClient } from './lib/queryClient';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: 'AUTHOR' | 'ADMIN';
}> = ({ children, allowedRole }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin/tickets' : '/author/books'} replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'ADMIN' ? '/admin/tickets' : '/author/books'} replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Main Layout routes */}
            <Route element={<Layout />}>
              {/* Author Routes */}
              <Route
                path="/author/books"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <MyBooksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/books/:id"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <BookDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/tickets/new"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <NewTicketPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/tickets"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <MyTicketsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/tickets/:id"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <TicketDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/tickets"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tickets/:id"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminTicketDetailPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
