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
import MyProfile from './MyProfile.tsx';
import Stats from './Stats.tsx';
import LoginView from './LoginView.tsx';
import PongGames from './PongGames.tsx';
// @ts-ignore - JS component without full TS types
import PongGame from './games/PongGame.jsx';
import MatchHistory from './MatchHistory';
import TournamentTemp from './TournamentTemp.tsx';
import TournamentPlay from './TournamentPlay.tsx';
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
import Tournament from './Tournament.tsx';
import PongGame from './games/PongGame.jsx';
import MatchHistory from './MatchHistory.tsx';
import JoinTournamentPage from './JoinTournamentPage.tsx';
import TournamentPlay from './TournamentPlay.tsx';
// profiler callback removed (unused)

function App()
{
	const [isLogged, setIsLogged] = useState<boolean | null>(null);
	const location = useLocation();
	const BACKEND_URL = 'https://localhost:8443';

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
				<Router>
					{/* <Profiler id="MainRoutes" onRender={onRenderCallback}> */}
						<div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
							<Routes>
								<Route path="/" element={<Home />} />
								<Route path="/login" element={<LoginView setIsLogged={setIsLogged} />} />
								<Route path="/pong" element={<PongGames />} />
								<Route path="/pong/play" element={<PongGame />} />
								<Route path="/aboutus" element={<AboutUs />} />
								<Route path="/leaderbord" element={<Leaderbord/>} />
								<Route path="/friends" element={<Friends />} />
								<Route path="/settings" element={<Settings />} />
								<Route path="/profile" element={<Profile />} />
								<Route path="/stats" element={<Stats/>} />
								<Route path="/register" element={<Register/>} />
								<Route path="/logout" element={<Logout setIsLogged={setIsLogged} />} />
								<Route path="/error" element={<Error/>} />
								<Route path="/doubleauth" element={<DoubleAuth />} />
								<Route path="/ResetPassword" element={<ResetPassword />} />
								<Route path="/selectplayers" element={<SelectPlayers />} />
								<Route path="/tournament" element={<Tournament />} />
								<Route path="/tournament/:tournamentId/join" element={<JoinTournamentPage />} />
								<Route path="/tournament/:tournamentId/play" element={<TournamentPlay />} />
								<Route path="/matchhistory" element={<MatchHistory />} />
							</Routes>
						</div>
					{/* </Profiler> */}
					<SideMenu isLogged={isLogged} setIsLogged={setIsLogged} />
					<BackHome />

				</Router>
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
