// React import removed (unused in JSX runtime with TypeScript)
import SplashCursor from './SplashCursor.tsx';
import FuzzyText from './FuzzyText';
import { useNavigate } from 'react-router-dom';
import CreateTournement from './components/CreateTournement.tsx';

export default function Home()
{
    const navigate = useNavigate();
    return (
        <>
        <FuzzyText>transcendence</FuzzyText>

            <div className='mt-3'>
                <button
                    className="px-4 py-2 active:scale-90 hover:scale-105 transition-transform text-white mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl"
                    style={{ borderRadius: '8px', backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                    onClick={() => navigate('/pong')}
                >
                    1<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline mx-1">
                      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
                    </svg>
                    1
                </button>
                <button
                    className="px-4 py-2 active:scale-90 hover:scale-105 transition-transform text-white mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl"
                    style={{ borderRadius: '8px', backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                    onClick={() => navigate('/tournament')}
                >
                    TOURNAMENT
                </button>
                <SplashCursor />

            </div>


            <CreateTournement
                isOpen={showJoin}
                onClose={() => setShowJoin(false)}
                onTournamentCreated={() => {
                    navigate('/pong');
                }}
            />
        </>
    )
}
