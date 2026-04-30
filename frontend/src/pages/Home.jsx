import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, BarChart3, Zap, Play } from 'lucide-react';
import { supabase } from '../supabase';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="pt-28 pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Plateforme Live – v2.0 (React)
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black font-headline text-white mb-8 tracking-tighter leading-none">
          Où les Meilleurs Monteurs <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#8083ff]">Prouvent leur Talent.</span>
        </h1>
        
        <p className="text-outline text-xl md:text-2xl leading-relaxed mb-12 max-w-3xl">
          La plateforme de tests techniques premium pour les monteurs vidéo. Les recruteurs postent des défis, les monteurs livrent des chefs-d'œuvre. Simple, rapide et de haute qualité.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mb-24">
          <Link to="/login" className="px-10 py-5 bg-primary text-[#1000a9] font-headline font-black text-xl rounded-sm hover:bg-[#8083ff] transition-all glow-button active:scale-95">
            Commencer Maintenant
          </Link>
          <a href="#features" className="px-10 py-5 border border-[#2C2C2E] text-white font-headline font-black text-xl rounded-sm hover:bg-[#1C1C1E] transition-all active:scale-95">
            Voir Comment ça Marche
          </a>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative w-full max-w-5xl group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-lg blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative bg-[#161618] border border-[#2C2C2E] rounded-lg overflow-hidden shadow-2xl">
            <div className="h-8 bg-[#0A0A0B] border-b border-[#2C2C2E] flex items-center px-4 gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            </div>
            <img src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=2000" 
              alt="Aperçu du Dashboard" className="w-full h-auto opacity-80 grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#2C2C2E]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6 p-8 bg-[#161618] border border-[#2C2C2E] rounded-lg hover:border-primary/50 transition-all">
            <Download className="text-primary w-10 h-10" />
            <h3 className="text-white font-headline font-black text-2xl">Assets Intelligents</h3>
            <p className="text-outline text-lg">Accès en un clic aux rushes, B-Rolls et packs audio hébergés sur Google Drive.</p>
          </div>
          <div className="space-y-6 p-8 bg-[#161618] border border-[#2C2C2E] rounded-lg hover:border-primary/50 transition-all">
            <BarChart3 className="text-primary w-10 h-10" />
            <h3 className="text-white font-headline font-black text-2xl">Dashboards en Direct</h3>
            <p className="text-outline text-lg">Suivi en temps réel des candidats et des soumissions. Tout au même endroit.</p>
          </div>
          <div className="space-y-6 p-8 bg-[#161618] border border-[#2C2C2E] rounded-lg hover:border-primary/50 transition-all">
            <Zap className="text-primary w-10 h-10" />
            <h3 className="text-white font-headline font-black text-2xl">Workflow Instantané</h3>
            <p className="text-outline text-lg">Pas de superflu. Pas d'installation complexe. Juste des tests, des montages et des résultats.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
