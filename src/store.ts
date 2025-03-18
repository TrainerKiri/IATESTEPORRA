import { create } from 'zustand';
import { supabase } from './lib/supabase';

interface GameState {
  palavra: string;
  setPalavra: (palavra: string) => void;
  tentativas: number;
  setTentativas: (tentativas: number) => void;
  letrasUsadas: Set<string>;
  setLetrasUsadas: (letras: Set<string>) => void;
  palavraAtual: string[];
  setPalavraAtual: (palavra: string[]) => void;
  pontuacaoIA: number;
  setPontuacaoIA: (pontuacao: number) => void;
  pontuacaoJogador: number;
  setPontuacaoJogador: (pontuacao: number) => void;
  modo: 'ia' | 'pvp';
  setModo: (modo: 'ia' | 'pvp') => void;
  user: any | null;
  setUser: (user: any) => void;
  ranking: any[];
  loadRanking: () => Promise<void>;
  updateRanking: (victory: boolean) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  palavra: '',
  setPalavra: (palavra) => set({ palavra }),
  tentativas: 0,
  setTentativas: (tentativas) => set({ tentativas }),
  letrasUsadas: new Set(),
  setLetrasUsadas: (letras) => set({ letrasUsadas: letras }),
  palavraAtual: [],
  setPalavraAtual: (palavra) => set({ palavraAtual: palavra }),
  pontuacaoIA: 0,
  setPontuacaoIA: (pontuacao) => set({ pontuacaoIA: pontuacao }),
  pontuacaoJogador: 0,
  setPontuacaoJogador: (pontuacao) => set({ pontuacaoJogador: pontuacao }),
  modo: 'ia',
  setModo: (modo) => set({ modo }),
  user: null,
  setUser: (user) => set({ user }),
  ranking: [],
  
  loadRanking: async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select('*')
      .order('victories', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Erro ao carregar ranking:', error);
      return;
    }
    
    set({ ranking: data });
  },
  
  updateRanking: async (victory: boolean) => {
    const { user } = get();
    if (!user) return;

    const { data: existingRanking } = await supabase
      .from('rankings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingRanking) {
      await supabase
        .from('rankings')
        .update({ 
          victories: victory ? existingRanking.victories + 1 : existingRanking.victories 
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('rankings')
        .insert({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Jogador Anônimo',
          victories: victory ? 1 : 0
        });
    }

    get().loadRanking();
  }
}));