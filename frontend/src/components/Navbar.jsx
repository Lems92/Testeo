import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, LogOut, User, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { useState, useEffect } from 'react';

const Navbar = ({ session }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (session) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [session]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (!error) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 border-b border-[#2C2C2E] bg-[#0b1326]/80 backdrop-blur-md z-50 px-6 md:px-12 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
          <Video className="text-[#1000a9] w-6 h-6" />
        </div>
        <span className="text-white font-black font-headline tracking-tight text-2xl">Testeo</span>
      </Link>

      <div className="flex items-center gap-6">
        {!session ? (
          <>
            <Link to="/login" className="text-sm font-bold text-outline hover:text-white transition-all uppercase tracking-widest">Connexion</Link>
            <Link to="/login" className="px-6 py-2 bg-primary text-[#1000a9] font-headline font-bold rounded-sm hover:bg-[#8083ff] transition-all glow-button">Rejoindre</Link>
          </>
        ) : (
          <div className="flex items-center gap-4">
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-outline hover:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Admin</span>
              </Link>
            )}
            <Link to="/dashboard" className="text-outline hover:text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Tableau de bord</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="text-outline hover:text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
