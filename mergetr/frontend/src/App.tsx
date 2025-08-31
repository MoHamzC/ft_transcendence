import { useState, useEffect } from 'react'
import './App.css'

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import AboutUs from './AboutUs.tsx';
import BackHome from './BackHome.tsx';
import SideMenu from './SideMenu.tsx';
import Leaderbord from './Leaderbord.tsx';
import Friends from './Friends.tsx';
import Settings from './Settings.tsx';
import Profile from './Profile.tsx';
import Stats from './Stats.tsx';
import LoginView from './LoginView.tsx';
import PongGames from './PongGames.tsx';
import PongGame from './games/PongGame.jsx';
import JoinTournamentPage from './JoinTournamentPage';
import CreateTournamentPage from './CreateTournamentPage';

import Particles from './Particles.tsx';
import Error from './Error.tsx';

import Register from './Register.tsx';
import Logout from './Logout.tsx'
import Home from './Home.tsx';
import ResetPassword from './ResetPassword.tsx';
import DoubleAuth from './DoubleAuth.tsx';
import SelectPlayers from './SelectPlayers.tsx';
import TournamentTemp from './TournamentTemp.tsx';

// function onRenderCallback(
//   id: string,
//   phase: 'mount' | 'update',
//   actualDuration: number,
//   baseDuration: number,
//   startTime: number,
//   commitTime: number,
//   interactions: Set<any>
// ) {
//   console.log(`[Profiler] ${id} (${phase}) - actualDuration: ${actualDuration}ms`);
// }

function AppContent()
{
	const [isLogged, setIsLogged] = useState<boolean | null>(null);
	const location = useLocation();
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
	}, [location.pathname]);

	// Show loading while checking authentication
	if (isLogged === null) {
		return (
			<div style={{ width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<div>Loading...</div>
			</div>
		);
	}

	return (
		<>
			<div style={{ width: '100vw', minHeight: '100vh', position: 'relative', overflow: 'auto' }}>
				<Particles
					particleColors={['#ffffff', '#ffffff']}
					particleCount={75}
					particleSpread={10}
					speed={0.1}
					particleBaseSize={100}
					moveParticlesOnHover={false}
					alphaParticles={false}
					disableRotation={false}
					className=""
				/>
				{/* <Profiler id="MainRoutes" onRender={onRenderCallback}> */}
					<div style={{ position: 'relative', zIndex: 10, width: '100%', minHeight: '100vh' }}>
						<Routes>
							<Route path="/" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Home /></div>} />
							<Route path="/login" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><LoginView setIsLogged={setIsLogged} /></div>} />
							<Route path="/pong" element={<PongGames />} />
							<Route path="/pong/play" element={<PongGame />} />
							<Route path="/aboutus" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><AboutUs /></div>} />
							<Route path="/leaderbord" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Leaderbord/></div>} />
							<Route path="/friends" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Friends /></div>} />
							<Route path="/settings" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Settings /></div>} />
							<Route path="/profile" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Profile /></div>} />
							<Route path="/stats" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Stats/></div>} />
							<Route path="/register" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Register/></div>} />
							<Route path="/logout" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Logout setIsLogged={setIsLogged} /></div>} />
							<Route path="/error" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><Error/></div>} />
							<Route path="/doubleauth" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><DoubleAuth /></div>} />
							<Route path="/ResetPassword" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><ResetPassword /></div>} />
							<Route path="/selectplayers" element={<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><SelectPlayers /></div>} />
							<Route path="/tournament" element={<TournamentTemp />} />
							<Route path="/jointournament/:tournamentId" element={<JoinTournamentPage />} />
							<Route path="/createtournament" element={<CreateTournamentPage />} />
						</Routes>
					</div>
				{/* </Profiler> */}
				<SideMenu isLogged={isLogged} setIsLogged={setIsLogged} />
				<BackHome />
			</div>
		</>
	)
}

function App()
{
	return (
		<Router>
			<AppContent />
		</Router>
	)
}

export default App
