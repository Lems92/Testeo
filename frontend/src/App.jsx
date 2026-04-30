import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChallengeDetails from './pages/ChallengeDetails';
import CreateTest from './pages/CreateTest';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Toaster } from 'react-hot-toast';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary selection:text-[#1000a9]">
        <Toaster position="top-right" />
        <Navbar session={session} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={
            <ProtectedRoute session={session}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute session={session} requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create" element={
            <ProtectedRoute session={session} requiredRole="admin">
              <CreateTest />
            </ProtectedRoute>
          } />
          <Route path="/admin/edit/:id" element={
            <ProtectedRoute session={session} requiredRole="admin">
              <CreateTest />
            </ProtectedRoute>
          } />
          <Route path="/challenge/:id" element={
            <ProtectedRoute session={session}>
              <ChallengeDetails />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
