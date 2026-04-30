import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Save, ArrowLeft, Loader2, Info, Plus, Trash2 } from 'lucide-react';
import apiClient from '../api/client';
import { toast } from 'react-hot-toast';

const CreateTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Intermediate',
    time_limit: 60,
    drive_link: '',
    asset_size: '500MB'
  });
  const [scenes, setScenes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    if (id) {
      fetchTest();
    } else {
      // Ajouter une scène vide pour les nouveaux tests
      setScenes([{ type: 'Intro / Hook', script: '', visual_specs: '', editing_instruction: '' }]);
    }
  }, [id]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
    } else {
      setIsAdmin(true);
    }
  };

  const fetchTest = async () => {
    setFetching(true);
    try {
      const response = await apiClient.get(`/tests/${id}`);
      const { scenes, ...data } = response.data;
      setFormData(data);
      setScenes(scenes.sort((a,b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Erreur lors de la récupération du test :', error);
    } finally {
      setFetching(false);
    }
  };

  const addScene = () => {
    setScenes([...scenes, { type: 'Intro / Hook', script: '', visual_specs: '', editing_instruction: '' }]);
  };

  const removeScene = (index) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const updateScene = (index, field, value) => {
    const newScenes = [...scenes];
    newScenes[index][field] = value;
    setScenes(newScenes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...formData, scenes, recruiter_id: user.id };

      if (id) {
        await apiClient.put(`/tests/${id}`, payload);
      } else {
        await apiClient.post('/tests', payload);
      }
      navigate('/admin');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement du test : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !isAdmin) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
      <p className="text-outline italic">{!isAdmin ? 'Vérification des permissions...' : 'Chargement des détails du test...'}</p>
    </div>
  );

  return (
    <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-outline hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>
          <h1 className="text-4xl font-black font-headline text-white tracking-tight">
            {id ? 'Modifier le Défi' : 'Créer un Nouveau Défi'}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-12 bg-[#161618] border border-[#2C2C2E] p-8 rounded-lg shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-full md:col-span-1">
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Titre du Défi</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
              placeholder="ex: Montage Gaming Dynamique"
            />
          </div>

          <div className="col-span-full md:col-span-1">
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Niveau de Difficulté</label>
            <select 
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
            >
              <option value="Beginner">Débutant</option>
              <option value="Intermediate">Intermédiaire</option>
              <option value="Advanced">Avancé</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="col-span-full">
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Description Courte</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
              rows="5"
              placeholder="Un bref aperçu de ce que le monteur doit faire..."
            ></textarea>
          </div>

          <div>
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Limite de Temps (Minutes)</label>
            <input 
              type="number" 
              required
              value={formData.time_limit}
              onChange={(e) => setFormData({...formData, time_limit: parseInt(e.target.value)})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
            />
          </div>

          <div>
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Taille du Pack d'Assets</label>
            <input 
              type="text" 
              required
              value={formData.asset_size}
              onChange={(e) => setFormData({...formData, asset_size: e.target.value})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
              placeholder="ex: 1.2GB"
            />
          </div>

          <div className="col-span-full">
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Lien Google Drive des Assets</label>
            <input 
              type="url" 
              required
              value={formData.drive_link}
              onChange={(e) => setFormData({...formData, drive_link: e.target.value})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="col-span-full">
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-3">Lien de Soumission Google Form (Optionnel)</label>
            <input 
              type="url" 
              value={formData.form_link}
              onChange={(e) => setFormData({...formData, form_link: e.target.value})}
              className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 px-4 text-white focus:border-primary focus:ring-0 transition-all"
              placeholder="https://forms.gle/..."
            />
          </div>
        </div>

        {/* Section Planification des Scènes */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-white font-headline font-bold text-2xl">Script Détaillé & Instructions de Montage</h3>
              <p className="text-outline text-sm">Planifiez le projet scène par scène avec les exigences techniques spécifiques.</p>
            </div>
            <button 
              type="button"
              onClick={addScene}
              className="px-4 py-2 bg-[#1C1C1E] border border-[#2C2C2E] text-white text-xs font-bold rounded-sm hover:bg-[#2C2C2E] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une scène
            </button>
          </div>

          <div className="bg-[#0A0A0B] border border-[#2C2C2E] rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
              <thead>
                <tr className="bg-[#161618] border-b border-[#2C2C2E] text-outline font-bold uppercase tracking-widest">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4 w-40">Type de scène</th>
                  <th className="p-4">Script / Narration</th>
                  <th className="p-4">Spécifications visuelles</th>
                  <th className="p-4">Instruction de montage</th>
                  <th className="p-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C2E]">
                {scenes.map((scene, index) => (
                  <tr key={index} className="hover:bg-[#1C1C1E]/50 transition-colors">
                    <td className="p-4 text-center font-mono text-outline">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-2">
                      <select 
                        value={scene.type}
                        onChange={(e) => updateScene(index, 'type', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-white rounded-sm"
                      >
                        <option value="Intro / Hook">Intro / Accroche</option>
                        <option value="Action Sequence">Séquence d'Action</option>
                        <option value="Dialogue">Dialogue</option>
                        <option value="Montage">Montage</option>
                        <option value="Transition / B-Roll">Transition / B-Roll</option>
                        <option value="Outro / CTA">Outro / CTA</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <textarea 
                        value={scene.script}
                        onChange={(e) => updateScene(index, 'script', e.target.value)}
                        className="w-full bg-[#0A0A0B] border-[#2C2C2E] focus:ring-primary/30 text-on-surface text-xs rounded-sm resize-none p-2" 
                        rows="3" 
                        placeholder="Texte ou narration..."
                      ></textarea>
                    </td>
                    <td className="p-2">
                      <textarea 
                        value={scene.visual_specs}
                        onChange={(e) => updateScene(index, 'visual_specs', e.target.value)}
                        className="w-full bg-[#0A0A0B] border-[#2C2C2E] focus:ring-primary/30 text-on-surface text-xs rounded-sm resize-none p-2" 
                        rows="3" 
                        placeholder="Ce que l'on voit..."
                      ></textarea>
                    </td>
                    <td className="p-2">
                      <textarea 
                        value={scene.editing_instruction}
                        onChange={(e) => updateScene(index, 'editing_instruction', e.target.value)}
                        className="w-full bg-[#0A0A0B] border-[#2C2C2E] focus:ring-primary/30 text-on-surface text-xs rounded-sm resize-none p-2" 
                        rows="3" 
                        placeholder="Effets, rythme, sound design..."
                      ></textarea>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        type="button"
                        onClick={() => removeScene(index)}
                        className="text-red-400 hover:bg-red-400/10 p-2 rounded-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2C2C2E] flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-primary text-[#1000a9] font-headline font-black text-lg rounded-sm hover:bg-[#8083ff] transition-all glow-button flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
            {id ? 'Mettre à jour le Défi' : 'Lancer le Défi'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default CreateTest;
