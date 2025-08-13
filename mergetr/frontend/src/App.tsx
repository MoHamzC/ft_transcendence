import { useState } from 'react'
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
			<div className='my-3'>
				<button 
					className="px-4 py-2 bg-zinc-600 rounded-full text-black mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl"
					onClick={() => navigate('/pong')}
				>
					Pong
				</button>
				<SplashCursor />

				<button className="px-4 py-2 bg-zinc-600 rounded-full text-black mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl" onClick={startPong}>gnop</button>
			</div>
		</>
	)
}




function App()
{
	const [isLogged, setIsLogged] = useState(false);
	return (
		<>
			<Router>
				<div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
					<BackHome />
					{/* <Galaxy> */}
						
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
							<AboutUs />
							<SideMenu isLogged={isLogged} setIsLogged={setIsLogged} />
						</div>
						
					{/* </Galaxy> */}
				</div>
			</Router>
		</>
	)
}

export default App
