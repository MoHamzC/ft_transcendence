import { useMemo } from 'react';
import TargetCursor from './TargetCursor';
import FuzzyText from './FuzzyText';

type Match = {
  id: string;
  date: string; // ISO
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  score: string; // e.g. 5-3
  mode?: string;
};

const SAMPLE_MATCHES: Match[] = [
  { id: '1', date: '2025-08-30T19:32:00Z', opponent: 'alice', result: 'win', score: '5-2', mode: '1v1' },
  { id: '2', date: '2025-08-28T21:15:00Z', opponent: 'bob', result: 'loss', score: '3-5', mode: '1v1' },
  { id: '3', date: '2025-08-25T18:05:00Z', opponent: 'carol', result: 'draw', score: '4-4', mode: 'tournament' },
  { id: '4', date: '2025-08-20T15:42:00Z', opponent: 'dan', result: 'win', score: '5-0', mode: '1v1' },
  { id: '5', date: '2025-08-18T17:00:00Z', opponent: 'eve', result: 'loss', score: '2-5', mode: '3D' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MatchHistory() {
  const matches = useMemo(() => {
    const list = SAMPLE_MATCHES.slice();
    list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return list;
  }, []);

  return (
    <div className="min-h-screen p-8 text-white">
       <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      <div className="p-10 max-w-4xl mx-auto text-center mb-6">
        <FuzzyText fontSize="clamp(1.6rem, 4vw, 3rem)">Match History</FuzzyText>
      </div>

      <div className="hover:scale-103 transition-transform max-w-4xl  bg-[#0f1720]  rounded-2xl p-6 cursor-target">
        <div className="flex items-center justify-between mb-6">
          
          <div className="flex items-center gap-3">
            
          </div>
        </div>

  <div className="mb-6" />

        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="p-6 rounded bg-white/3 text-gray-200">No matches found.</div>
          ) : (
            matches.map(m => (
                <div key={m.id} className="p-4 rounded bg-blue-800/40 flex items-center justify-between cursor-target">
                <div>
                  <div className="flex items-center gap-3">
                    
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#6d28d9] text-white font-bold">
                      {m.opponent.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">vs {m.opponent}</div>
                      <div className="text-sm text-white-300">{m.mode} • {formatDate(m.date)}</div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg">{m.score}</div>
                  
                  <div className="text-sm text-[#c084fc]">{m.result.toUpperCase()}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
