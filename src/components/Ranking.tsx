import { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../store';

export function Ranking() {
  const { ranking, loadRanking } = useGameStore();

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold">Ranking</h2>
      </div>

      <div className="space-y-2">
        {ranking.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{index + 1}º</span>
              <span>{player.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{player.victories}</span>
              <span className="text-sm opacity-75">vitórias</span>
            </div>
          </div>
        ))}

        {ranking.length === 0 && (
          <p className="text-center opacity-75">Nenhuma vitória registrada ainda</p>
        )}
      </div>
    </div>
  );
}