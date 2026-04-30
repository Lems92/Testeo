import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Plus, Eye, Edit, Trash2, Loader2, PlayCircle, X, Save, MessageSquare } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTests: 0, totalSubmissions: 0 });
  const [selectedTest, setSelectedTest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      // Check if user is admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return navigate('/dashboard');

      const response = await axios.get(`http://localhost:5000/api/tests?recruiter_id=${user.id}`);
      const allTests = response.data;
      
      setTests(allTests);
      
      const totalSubs = allTests.reduce((acc, test) => acc + (test.submissions_count || 0), 0);
      setStats({ totalTests: allTests.length, totalSubmissions: totalSubs });
    } catch (error) {
      console.error('Erreur lors de la récupération des données admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tests/${id}`);
      setTests(prevTests => prevTests.filter(t => t.id !== id));
      setConfirmingDelete(null);
      alert('Test supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du test:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert('Erreur lors de la suppression du test: ' + errorMsg);
    }
  };

  const viewSubmissions = async (test) => {
    setSelectedTest(test);
    setModalLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/submissions/${test.id}`);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions:', error);
      alert('Erreur lors de la récupération des soumissions: ' + (error.response?.data?.error || error.message));
    } finally {
      setModalLoading(false);
    }
  };

  const saveFeedback = async (subId, feedback, score) => {
    try {
      await axios.put(`http://localhost:5000/api/submissions/${subId}`, { feedback, score });
      alert('Évaluation enregistrée avec succès !');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement de l\'évaluation: ' + error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
      <p className="text-outline italic">Chargement de vos tests...</p>
    </div>
  );

  return (
    <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-headline text-white mb-2 tracking-tight">Studio Recruteur</h1>
          <p className="text-outline">Gérez vos évaluations et surveillez les candidats.</p>
        </div>
        <Link to="/admin/create" 
          className="px-6 py-3 bg-primary text-[#1000a9] font-headline font-bold rounded-sm shadow-lg shadow-primary/20 hover:bg-[#8083ff] transition-all active:scale-95 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Créer un Nouveau Test
        </Link>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#161618] border border-[#2C2C2E] p-6 rounded-lg">
          <p className="text-outline text-xs uppercase tracking-widest font-bold mb-2">Total des Tests</p>
          <p className="text-3xl font-black text-white font-headline">{stats.totalTests}</p>
        </div>
        <div className="bg-[#161618] border border-[#2C2C2E] p-6 rounded-lg">
          <p className="text-outline text-xs uppercase tracking-widest font-bold mb-2">Total des Soumissions</p>
          <p className="text-3xl font-black text-white font-headline">{stats.totalSubmissions}</p>
        </div>
        <div className="bg-[#161618] border border-[#2C2C2E] p-6 rounded-lg">
          <p className="text-outline text-xs uppercase tracking-widest font-bold mb-2">Candidats Actifs</p>
          <p className="text-3xl font-black text-white font-headline">0</p>
        </div>
      </div>

      <div className="bg-[#161618] border border-[#2C2C2E] rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-[#0A0A0B] border-b border-[#2C2C2E]">
            <tr>
              <th className="p-6 font-bold text-outline uppercase tracking-widest text-[10px]">Titre du Test</th>
              <th className="p-6 font-bold text-outline uppercase tracking-widest text-[10px]">Difficulté</th>
              <th className="p-6 font-bold text-outline uppercase tracking-widest text-[10px]">Soumissions</th>
              <th className="p-6 font-bold text-outline uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C2C2E]">
            {tests.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-20 text-center text-outline">
                  Vous n'avez pas encore créé de tests. 
                  <Link to="/admin/create" className="text-primary underline ml-1">Créez votre premier défi.</Link>
                </td>
              </tr>
            ) : (
              tests.map(test => (
                <tr key={test.id} className="hover:bg-[#1C1C1E]/50 transition-colors">
                  <td className="p-6">
                    <p className="text-white font-bold">{test.title}</p>
                    <p className="text-outline text-[10px] mt-1 font-mono">{new Date(test.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm border border-primary/20">
                      {test.difficulty === 'Beginner' ? 'Débutant' : test.difficulty === 'Intermediate' ? 'Intermédiaire' : 'Expert'}
                    </span>
                  </td>
                  <td className="p-6">
                    <button onClick={() => viewSubmissions(test)} className="flex items-center gap-2 text-white hover:text-primary transition-colors">
                      <span className="text-lg font-bold">{test.submissions_count || 0}</span>
                      <span className="text-[10px] uppercase tracking-widest text-outline">Voir Tout</span>
                    </button>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <Link to={`/challenge/${test.id}`} target="_blank" className="text-outline hover:text-white p-2 inline-block">
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link to={`/admin/edit/${test.id}`} className="text-outline hover:text-white p-2 inline-block">
                      <Edit className="w-5 h-5" />
                    </Link>
                    
                    {confirmingDelete === test.id ? (
                      <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-1 rounded">
                        <button 
                          onClick={() => deleteTest(test.id)}
                          className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded hover:bg-red-600 transition-all"
                        >
                          Confirmer
                        </button>
                        <button 
                          onClick={() => setConfirmingDelete(null)}
                          className="px-2 py-1 text-outline text-[10px] hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmingDelete(test.id);
                        }} 
                        className="text-outline hover:text-red-400 p-2 transition-colors"
                        title="Supprimer le Test"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submissions Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0b1326]/80 backdrop-blur-sm" onClick={() => setSelectedTest(null)}></div>
          <div className="bg-[#161618] border border-[#2C2C2E] w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-lg shadow-2xl relative z-10 flex flex-col">
            <div className="p-6 border-b border-[#2C2C2E] flex justify-between items-center">
              <h2 className="text-white font-headline font-bold text-xl">Soumissions pour : {selectedTest.title}</h2>
              <button className="text-outline hover:text-white" onClick={() => setSelectedTest(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {modalLoading ? (
                <div className="text-center py-10"><Loader2 className="animate-spin inline-block w-8 h-8 text-primary" /></div>
              ) : submissions.length === 0 ? (
                <p className="text-outline text-center py-10">Aucune soumission pour ce défi pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <SubmissionItem key={sub.id} sub={sub} onSave={saveFeedback} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const SubmissionItem = ({ sub, onSave }) => {
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [score, setScore] = useState(sub.score || '');

  return (
    <div className="bg-[#0A0A0B] border border-[#2C2C2E] p-6 rounded-lg space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-[#2C2C2E] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-lg">{sub.candidate_name || sub.profiles?.full_name || 'Candidat Anonyme'}</p>
            {sub.candidate_whatsapp && (
              <a href={`https://wa.me/${sub.candidate_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-400 transition-colors" title="Contacter sur WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-outline text-[11px]">
            <p className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">email</span>
              {sub.candidate_email || sub.profiles?.email || 'N/A'}
            </p>
            {sub.candidate_whatsapp && (
              <p className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">phone</span>
                {sub.candidate_whatsapp}
              </p>
            )}
            <p>• Soumis le {new Date(sub.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href={sub.video_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-[#1000a9] text-xs font-bold rounded hover:bg-[#8083ff] transition-all flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Regarder la Vidéo
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2 flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Commentaires du Candidat
          </h4>
          <p className="text-on-surface text-sm bg-[#1C1C1E] p-3 rounded border border-[#2C2C2E] italic">
            "{sub.comments || 'Aucun commentaire fourni.'}"
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Commentaires du Recruteur</h4>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full bg-[#0A0A0B] border-[#2C2C2E] border text-on-surface text-sm rounded p-3 focus:border-primary focus:ring-0 transition-all" 
              rows="2" 
              placeholder="Bon timing, mais attention à l'étalonnage..."
            ></textarea>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Score :</span>
              <select 
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="bg-[#0A0A0B] border-[#2C2C2E] border text-on-surface text-xs rounded py-1 px-2 focus:border-primary focus:ring-0"
              >
                <option value="">-</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
              </select>
            </div>
            <button 
              onClick={() => onSave(sub.id, feedback, score)}
              className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <Save className="w-3 h-3" />
              Enregistrer l'évaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
