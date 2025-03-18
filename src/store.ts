import { create } from 'zustand';

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
}

export const useGameStore = create<GameState>((set) => ({
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
}));