import React, { useState, Profiler, useEffect } from 'react'
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

import Particles from './Particles.tsx';
import Error from './Error.tsx';

import Register from './Register.tsx';
import Logout from './Logout.tsx'
import Home from './Home.tsx';
import ResetPassword from './ResetPassword.tsx';


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
	const BACKEND_URL = 'http://localhost:5001';

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const response = await fetch(`${BACKEND_URL}/api/users/protected`, {
					method: 'GET',
					credentials: 'include',
				});

				if (response.ok) {

					setIsLogged(true);
				} else {

					setIsLogged(false);
				}
			} catch (err)
			{
				console.error('Error checking auth status:', err);
				setIsLogged(false);
			}
		};

		checkAuthStatus();
	}, []);

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
								<Route path="/login" element={<LoginView setIsLogged={setIsLogged} />} />
								<Route path="/pong" element={<PongGames />} />
								<Route path="/pong/play" element={<PongGame />} />
								<Route path="/aboutus" element={<ProfilePage />} />
								<Route path="/leaderbord" element={<Leaderbord/>} />
								<Route path="/friends" element={<Friends />} />
								<Route path="/settings" element={<Settings />} />
								<Route path="/profile" element={<MyProfile />} />
								<Route path="/stats" element={<Stats/>} />
								<Route path="/register" element={<Register/>} />
								<Route path="/logout" element={<Logout setIsLogged={setIsLogged} />} />
								<Route path="/error" element={<Error/>} />
								<Route path="/ResetPassword" element={<ResetPassword />} />
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
