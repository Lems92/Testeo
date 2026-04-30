import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, session, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      if (requiredRole) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!error) {
            setProfile(data);
          }
        } catch (err) {
          console.error('Error checking role:', err);
        }
      }
      setLoading(false);
    };

    checkAccess();
  }, [session, requiredRole]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
