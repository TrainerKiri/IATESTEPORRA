import React, { useState, useEffect } from 'react';
import { Brain, Trophy, Users, User } from 'lucide-react';
import { useGameStore } from './store';
import { ForcaIA } from './forca';

function App() {
  const { 
    palavra, setPalavra,
    tentativas, setTentativas,
    letrasUsadas, setLetrasUsadas,
    palavraAtual, setPalavraAtual,
    pontuacaoIA, setPontuacaoIA,
    pontuacaoJogador, setPontuacaoJogador,
    modo, setModo
  } = useGameStore();

  const [ia] = useState(() => new ForcaIA());
  const [loading, setLoading] = useState(false);

  const iniciarJogo = async () => {
    if (!palavra) return;
    
    setLoading(true);
    ia.iniciar_jogo(palavra);
    setPalavraAtual(Array(palavra.length).fill('_'));
    setLetrasUsadas(new Set());
    setTentativas(0);
    setLoading(false);
  };

  const jogarIA = async () => {
    if (loading) return;
    
    setLoading(true);
    const letra = ia.tentar_letra();
    
    if (letra) {
      setLetrasUsadas(new Set([...letrasUsadas, letra]));
      setTentativas(t => t + 1);
      
      const novasPosicoes = [];
      const palavraNorm = ia.normalizar_palavra(palavra);
      
      for (let i = 0; i < palavraNorm.length; i++) {
        if (palavraNorm[i] === letra) {
          novasPosicoes.push(i);
        }
      }
      
      if (novasPosicoes.length > 0) {
        const novaPalavra = [...palavraAtual];
        novasPosicoes.forEach(pos => {
          novaPalavra[pos] = palavra[pos];
        });
        setPalavraAtual(novaPalavra);
        
        if (!novaPalavra.includes('_')) {
          ia.registrar_palavra(palavra);
          setPontuacaoIA(p => p + 1);
          setTimeout(() => alert('A IA venceu!'), 100);
        }
      }
    }
    
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    iniciarJogo();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Forca com IA</h1>
          <div className="flex justify-center gap-8 text-xl">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6" />
              <span>IA: {pontuacaoIA}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6" />
              <span>Jogador: {pontuacaoJogador}</span>
            </div>
          </div>
        </header>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setModo('ia')}
              className={`flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 ${
                modo === 'ia' ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <Brain className="w-5 h-5" />
              Jogar contra IA
            </button>
            <button
              onClick={() => setModo('pvp')}
              className={`flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 ${
                modo === 'pvp' ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <Users className="w-5 h-5" />
              Jogador vs Jogador
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-4">
              <input
                type="text"
                value={palavra}
                onChange={(e) => setPalavra(e.target.value.toLowerCase())}
                placeholder="Digite a palavra secreta..."
                className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/50"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Iniciar Jogo
            </button>
          </form>

          <div className="text-center mb-8">
            <div className="text-4xl font-mono tracking-wider mb-4">
              {palavraAtual.join(' ')}
            </div>
            <div className="text-sm opacity-75">
              Tentativas: {tentativas}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from('abcdefghijklmnopqrstuvwxyz').map((letra) => (
              <button
                key={letra}
                className={`p-2 rounded ${
                  letrasUsadas.has(letra)
                    ? 'bg-gray-500 opacity-50'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                disabled={letrasUsadas.has(letra) || loading}
                onClick={() => modo === 'ia' && jogarIA()}
              >
                {letra}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center opacity-75">
          <p>Dica: Use palavras do português com ou sem acentos</p>
        </div>
      </div>
    </div>
  );
}

export default App;