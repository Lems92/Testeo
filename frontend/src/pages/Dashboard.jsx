import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Clock, Database, CheckCircle, MoreVertical, Loader2, Search, PlayCircle, User as UserIcon, MessageSquare, ExternalLink } from 'lucide-react';
import apiClient from '../api/client';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const userRole = profile?.role || 'candidate';
      setRole(userRole);

      if (userRole === 'admin') {
        const adminSubsRes = await apiClient.get('/submissions');
        setAdminSubmissions(adminSubsRes.data);
      } else {
        const [testsRes, subsRes] = await Promise.all([
          apiClient.get('/tests'),
          supabase.from('submissions').select('test_id').eq('user_id', authUser.id)
        ]);
        setTests(testsRes.data);
        setSubmissions(subsRes.data.map(s => s.test_id));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', error);
      toast.error('Erreur lors de la récupération des données: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
      <p className="text-outline italic">Chargement des défis...</p>
    </div>
  );

  return (
    <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
      {role === 'admin' ? (
        <div className="space-y-6">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black font-headline text-white mb-2 tracking-tight">Vue d'ensemble Recruteur</h1>
              <p className="text-outline">Surveillez les performances des candidats sur tous les défis actifs.</p>
            </div>
            <Link to="/admin" className="text-primary hover:underline text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              Aller au Studio <ExternalLink className="w-3 h-3" />
            </Link>
          </header>

          <div className="bg-[#161618] border border-[#2C2C2E] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#2C2C2E] bg-[#0A0A0B]">
              <h3 className="text-white font-bold text-lg">Soumissions Récentes des Candidats</h3>
            </div>
            
            {adminSubmissions.length === 0 ? (
              <div className="p-20 text-center text-outline italic">
                Aucune soumission reçue pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-[#2C2C2E]">
                {adminSubmissions.map(sub => (
                  <div key={sub.id} className="p-6 hover:bg-[#1C1C1E]/50 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{sub.profiles?.email || 'Candidat Anonyme'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{sub.tests?.title}</span>
                            <span className="text-[10px] text-outline uppercase tracking-widest">{new Date(sub.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a href={sub.video_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-[#1000a9] text-xs font-bold rounded-sm hover:bg-[#8083ff] transition-all flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          Réviser le travail
                        </a>
                      </div>
                    </div>
                    {sub.comments && (
                      <div className="mt-4 ml-14 bg-[#0A0A0B] p-3 rounded border border-[#2C2C2E] flex gap-3">
                        <MessageSquare className="w-4 h-4 text-outline shrink-0 mt-1" />
                        <p className="text-outline text-xs italic">"{sub.comments}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-black font-headline text-white mb-2 tracking-tight">Défis Disponibles</h1>
              <p className="text-outline">Sélectionnez un test pour démontrer vos compétences.</p>
            </div>
            <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {tests.length} Défis Disponibles
            </div>
          </header>

          {tests.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-[#2C2C2E] rounded-lg">
              <Search className="text-outline w-12 h-12 mx-auto mb-4" />
              <p className="text-outline text-lg">Aucun défi disponible pour le moment.</p>
              <p className="text-outline text-sm mt-2">Revenez plus tard ou contactez votre recruteur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => {
                const isSubmitted = submissions.includes(test.id);
                return (
                  <div key={test.id} className={`bg-[#161618] border border-[#2C2C2E] p-6 rounded-lg hover:border-primary/50 transition-all group flex flex-col h-full ${isSubmitted ? 'opacity-75' : ''}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-2 flex-wrap">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm border border-primary/20">
                          {test.difficulty === 'Beginner' ? 'Débutant' : test.difficulty === 'Intermediate' ? 'Intermédiaire' : 'Expert'}
                        </div>
                        {isSubmitted && (
                          <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-green-500/20 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Soumis
                          </div>
                        )}
                      </div>
                      <MoreVertical className="text-outline group-hover:text-primary transition-colors cursor-pointer w-5 h-5" />
                    </div>
                    
                    <h3 className="text-white font-headline font-bold text-xl mb-3">{test.title}</h3>
                    <p className="text-outline text-sm leading-relaxed flex-1 mb-6 line-clamp-3">
                      {test.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 border-y border-[#2C2C2E] py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="text-outline w-4 h-4" />
                        <span className="text-outline text-xs">{test.time_limit} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="text-outline w-4 h-4" />
                        <span className="text-outline text-xs">{test.asset_size}</span>
                      </div>
                    </div>
                    
                    <Link to={isSubmitted ? '#' : `/challenge/${test.id}`} 
                      className={`w-full py-3 border border-[#2C2C2E] text-white text-center font-bold font-headline rounded-sm ${isSubmitted ? 'cursor-default bg-[#2C2C2E]/50 text-outline' : 'hover:bg-primary hover:text-[#1000a9] hover:border-primary'} transition-all active:scale-95`}
                    >
                      {isSubmitted ? 'Défi Terminé' : 'Commencer le Défi'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Dashboard;
