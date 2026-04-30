import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Clock, Database, Download, Send, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';
import { toast } from 'react-hot-toast';

const ChallengeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [videoLink, setVideoLink] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateWhatsapp, setCandidateWhatsapp] = useState('');
  const [comments, setComments] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchTest();
    checkUserAndSubmission();
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await apiClient.get(`/tests/${id}`);
      setTest(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du défi :', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAndSubmission = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupération du profil ultra-sécurisée
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!profileError && profile) {
        setUserProfile(profile);
        setCandidateName(profile.full_name || user.email.split('@')[0]);
        setCandidateEmail(profile.email || user.email);
      } else {
        // Fallback si le profil n'existe pas encore ou erreur de colonne
        setCandidateEmail(user.email);
        setCandidateName(user.email.split('@')[0]);
      }

      // Vérification de soumission existante sans .single() pour éviter le 406
      const { data: existingSub, error: subError } = await supabase
        .from('submissions')
        .select('id')
        .eq('test_id', id)
        .eq('user_id', user.id);
      
      if (!subError && existingSub && existingSub.length > 0) {
        setSubmitted(true);
      }
    } catch (err) {
      console.warn("Erreur non-critique lors de la vérification du profil/soumission:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await apiClient.post('/submissions', {
        test_id: id,
        user_id: user.id,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        candidate_whatsapp: candidateWhatsapp,
        video_link: videoLink,
        comments: comments
      });
      setSubmitted(true);
      toast.success('Travail soumis avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la soumission du travail : ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
      <p className="text-outline italic">Chargement des détails du défi...</p>
    </div>
  );

  if (!test) return (
    <div className="min-h-screen pt-32 text-center">
      <AlertCircle className="text-red-400 w-16 h-16 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white">Défi non trouvé</h1>
      <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary underline">Retour au tableau de bord</button>
    </div>
  );

  return (
    <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-outline hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux Défis
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Colonne Gauche : Instructions */}
        <div className="lg:col-span-2 space-y-8">
          <header>
            <div className="flex gap-2 mb-4">
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm border border-primary/20">
                {test.difficulty === 'Beginner' ? 'Débutant' : test.difficulty === 'Intermediate' ? 'Intermédiaire' : test.difficulty === 'Advanced' ? 'Avancé' : 'Expert'}
              </span>
            </div>
            <h1 className="text-5xl font-black font-headline text-white mb-8 tracking-tight">{test.title}</h1>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="h-px w-8 bg-primary/30"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Brief du Projet</span>
              </div>
              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
                <p className="text-white text-xl leading-relaxed whitespace-pre-wrap font-medium italic">
                  {test.description}
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-[#161618] border border-[#2C2C2E] rounded-lg">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Limite de Temps
              </p>
              <p className="text-white font-headline font-bold text-xl">{test.time_limit} Minutes</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3" /> Taille des Assets
              </p>
              <p className="text-white font-headline font-bold text-xl">{test.asset_size}</p>
            </div>
            <div className="col-span-full md:col-span-1">
              <a href={test.drive_link} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center gap-2 bg-white text-black font-bold rounded-sm hover:bg-gray-200 transition-all py-3">
                <Download className="w-4 h-4" />
                Télécharger les Assets
              </a>
            </div>
          </div>

          {test.instructions && (
            <div className="space-y-4">
              <h3 className="text-white font-headline font-bold text-2xl">Ressources & Conseils Supplémentaires</h3>
              <div className="prose prose-invert max-w-none text-outline">
                <div className="whitespace-pre-wrap font-body text-sm leading-relaxed bg-[#161618] p-6 rounded-lg border border-[#2C2C2E]">
                  {test.instructions}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne Droite : Formulaire de Soumission */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 bg-[#161618] border border-[#2C2C2E] p-8 rounded-lg shadow-xl">
            {submitted ? (
              <div className="text-center py-10">
                <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-6" />
                <h3 className="text-white font-headline font-bold text-2xl mb-4">Travail Soumis !</h3>
                <p className="text-outline text-sm mb-8">Votre défi a été envoyé au recruteur. Vous recevrez un retour bientôt.</p>
                <button onClick={() => navigate('/dashboard')} className="w-full py-3 border border-[#2C2C2E] text-white font-bold rounded-sm hover:bg-[#1C1C1E] transition-all">
                  Retour au tableau de bord
                </button>
              </div>
            ) : userProfile?.role === 'admin' ? (
              <div className="text-center py-10 border-2 border-dashed border-primary/20 rounded-lg p-6">
                <AlertCircle className="text-primary w-12 h-12 mx-auto mb-4" />
                <h3 className="text-white font-headline font-bold text-xl mb-2">Accès Recruteur</h3>
                <p className="text-outline text-xs mb-6">Les administrateurs et recruteurs ne peuvent pas soumettre de projets aux défis.</p>
                <button onClick={() => navigate('/admin')} className="w-full py-3 bg-[#1C1C1E] text-white text-xs font-bold rounded-sm hover:bg-[#2C2C2E] transition-all flex items-center justify-center gap-2">
                  Retour au Studio
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-white font-headline font-bold text-2xl mb-2">Soumettre votre Travail</h3>
                <p className="text-outline text-xs mb-8">Veuillez confirmer vos coordonnées et partager votre lien.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Nom Complet</label>
                      <input 
                        type="text" 
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-2 px-3 text-white focus:border-primary focus:ring-0 transition-all text-sm"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Email de Contact</label>
                      <input 
                        type="email" 
                        required
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-2 px-3 text-white focus:border-primary focus:ring-0 transition-all text-sm"
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Numéro WhatsApp</label>
                      <input 
                        type="tel" 
                        required
                        value={candidateWhatsapp}
                        onChange={(e) => setCandidateWhatsapp(e.target.value)}
                        className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-2 px-3 text-white focus:border-primary focus:ring-0 transition-all text-sm"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2C2C2E]">
                    <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Lien de la Vidéo Finie</label>
                    <input 
                      type="url" 
                      required
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all text-sm"
                      placeholder="Lien YouTube/Vimeo/Drive"
                    />
                  </div>

                  <div>
                    <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Commentaires</label>
                    <textarea 
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all text-sm"
                      rows="3"
                      placeholder="Choix techniques, musique, etc..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-[#1000a9] font-headline font-black text-lg rounded-sm hover:bg-[#8083ff] transition-all glow-button flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                    Envoyer le Projet
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION SCRIPT EN PLEINE LARGEUR */}
      <div className="space-y-8 mt-16">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-headline font-bold text-3xl">Script Détaillé & Instructions</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-[#2C2C2E] to-transparent"></div>
        </div>
        
        <div className="bg-[#161618] border border-[#2C2C2E] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] table-auto border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#0A0A0B] border-b border-[#2C2C2E] text-outline font-bold uppercase tracking-widest">
                <th className="p-5 w-12 text-center">#</th>
                <th className="p-5 w-32">Type</th>
                <th className="p-5 w-1/3">Script / Narration</th>
                <th className="p-5">Visuel</th>
                <th className="p-5">Montage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2E]">
              {test.scenes?.sort((a,b) => a.order_index - b.order_index).map((scene, index) => (
                <tr key={index} className="hover:bg-[#1C1C1E]/30 transition-colors">
                  <td className="p-5 text-center font-mono text-primary/50 font-bold">
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="p-5">
                    <span className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded border border-primary/10">
                      {scene.type}
                    </span>
                  </td>
                  <td className="p-5 text-on-surface whitespace-pre-wrap leading-relaxed font-medium">
                    {scene.script}
                  </td>
                  <td className="p-5 text-outline italic whitespace-pre-wrap text-[11px]">
                    {scene.visual_specs}
                  </td>
                  <td className="p-5 text-primary/80 whitespace-pre-wrap font-medium">
                    {scene.editing_instruction}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChallengeDetails;
