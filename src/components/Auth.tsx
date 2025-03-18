import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const setUser = useGameStore(state => state.setUser);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              nickname: nickname || email.split('@')[0]
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          // Criar entrada no ranking
          await supabase.from('rankings').insert({
            user_id: data.user.id,
            username: nickname || email.split('@')[0],
            victories: 0
          });
          setUser(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) setUser(data.user);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/10 backdrop-blur-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isSignUp ? 'Criar Conta' : 'Entrar'}
      </h2>
      
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Como você quer ser chamado?"
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/50"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/50"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full mt-4 text-sm text-center hover:underline"
      >
        {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se'}
      </button>
    </div>
  );
}