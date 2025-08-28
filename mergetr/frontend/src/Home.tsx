import React from 'react';
import SplashCursor from './SplashCursor.tsx';
import FuzzyText from './FuzzyText';
import { useNavigate } from 'react-router-dom';

export default function Home()
{
	const navigate = useNavigate();
	
	return (
		<>
		<FuzzyText>transcendence</FuzzyText>

			<div className='mt-3'>
				<button 
					className="px-4 py-2 active:scale-90 hover:scale-105 text-white mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl"
					style={{ borderRadius: '8px', backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
					onClick={() => navigate('/pong')}
				>
					PLAY
				</button>
				<SplashCursor />

				{/* <button 
					className="px-4 py-2 hover:scale-105 active:scale-90 bg-zinc-600 text-white mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl"
					style={{ borderRadius: '8px', backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
					onClick={startPong}
				>
					gnop
				</button> */}
			</div>
		</>
	)
}