import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (isAdmin && adminCode !== import.meta.env.VITE_ADMIN_CODE) {
          throw new Error("Code administrateur invalide");
        }
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              role: isAdmin ? 'admin' : 'user'
            }
          }
        });
        if (error) throw error;
        toast.success('Vérifiez vos e-mails pour la confirmation !');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-[#161618] border border-[#2C2C2E] p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black font-headline text-white mb-2">
            {mode === 'login' ? 'Bon Retour' : 'Rejoindre Testeo'}
          </h2>
          <p className="text-outline text-sm">
            {mode === 'login' ? 'Connectez-vous pour accéder à votre tableau de bord' : 'Créez un compte pour commencer les défis'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Adresse E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 pl-11 pr-4 text-white focus:border-primary focus:ring-0 transition-all"
                placeholder="monteur@exemple.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 pl-11 pr-4 text-white focus:border-primary focus:ring-0 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="rounded border-[#2C2C2E] bg-[#0b1326] text-primary focus:ring-primary"
                />
                <span className="text-outline text-sm font-bold">S'inscrire en tant qu'administrateur</span>
              </label>

              {isAdmin && (
                <div>
                  <label className="block text-outline text-[10px] font-bold uppercase tracking-widest mb-2">Code d'accès Admin</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                    <input 
                      type="password" 
                      required={isAdmin}
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      className="w-full bg-[#0b1326] border-[#2C2C2E] rounded-sm py-3 pl-11 pr-4 text-white focus:border-primary focus:ring-0 transition-all"
                      placeholder="Code secret"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-[#1000a9] font-headline font-black text-lg rounded-sm hover:bg-[#8083ff] transition-all glow-button disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'login' ? 'Se Connecter' : 'Créer un Compte')}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#2C2C2E] text-center">
          <p className="text-outline text-sm">
            {mode === 'login' ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="ml-2 text-primary hover:underline font-bold"
            >
              {mode === 'login' ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
