import React, { useState, Profiler } from 'react'
import './App.css'

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import AboutUs from './AboutUs.tsx';
import BackHome from './BackHome.tsx';
import SideMenu from './SideMenu.tsx';
import ProfilePage from './ProfilePage.tsx'; 
import SplashCursor from './SplashCursor.tsx';
import FuzzyText from './FuzzyText';
import Leaderbord from './Leaderbord.tsx';
import Friends from './Friends.tsx';
import Settings from './Settings.tsx';
import MyProfile from './MyProfile.tsx';
import Stats from './Stats.tsx';
import LoginView from './LoginView.tsx';
import PongGames from './PongGames.tsx';
import PongGame from './games/PongGame.jsx';
import Galaxy from './Galaxy.tsx';
import Particles from './Particles.tsx';

function startPong()
{
	//todo
}


function Home()
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
					Pong
				</button>
				<SplashCursor />

				<button 
					className="px-4 py-2 hover:scale-105 active:scale-90 bg-zinc-600 text-white mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl"
					style={{ borderRadius: '8px', backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
					onClick={startPong}
				>
					gnop
				</button>
			</div>
		</>
	)
}

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
  interactions: Set<any>
) {
  console.log(`[Profiler] ${id} (${phase}) - actualDuration: ${actualDuration}ms`);
}

function App()
{
	const [isLogged, setIsLogged] = useState(false);
	return (
		<>
			<div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
				<Particles
					particleColors={['#ffffff', '#ffffff']}
					particleCount={75}
					particleSpread={10}
					speed={0.1}
					particleBaseSize={100}
					moveParticlesOnHover={false}
					alphaParticles={false}
					disableRotation={false}
				/>
				<Router>
					<Profiler id="MainRoutes" onRender={onRenderCallback}>
						<div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
							<Routes>
								<Route path="/" element={<Home />} />
								<Route path="/login" element={<LoginView />} />
								<Route path="/pong" element={<PongGames />} />
								<Route path="/pong/play" element={<PongGame />} />
								<Route path="/aboutus" element={<ProfilePage />} />
								<Route path="/leaderbord" element={<Leaderbord/>} />
								<Route path="/friends" element={<Friends />} />
								<Route path="/settings" element={<Settings />} />
								<Route path="/profile" element={<MyProfile />} />
								<Route path="/stats" element={<Stats/>} />
							</Routes>
						</div>
					</Profiler>
					<SideMenu isLogged={isLogged} setIsLogged={setIsLogged} />
					<BackHome />

				</Router>
			</div>
		</>
	)
}

export default App
