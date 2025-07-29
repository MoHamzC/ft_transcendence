import { useState, use } from 'react'
import './App.css'

import Galaxy from './Galaxy.tsx';
import Login from './Login.tsx';
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import AboutUs from './AboutUs.tsx';
import BackHome from './BackHome.tsx';
import SideMenu from './SideMenu.tsx';
import ProfilePage from './ProfilePage.tsx'; 
import SplashCursor from './SplashCursor.tsx';
function startPong()
{
	//todo
}


function Button({children, onClick}: any)
{
	return(
		<button className="button" onClick={onClick}>{children}</button>
	)
}


function Home()
{
	return (
		<>
			<h1><strong>transcendence</strong></h1>

			<div>
				<SplashCursor />
				<Button onClick={startPong}>pong</Button>
				<Button>game2</Button>
			</div>
		</>
	)
}

function goHome()
{
	const navigate = useNavigate();
	return () => {
		navigate('/');
	}
}

function LoginView()
{
	return (
		<>
			<h1><strong>Login to play</strong></h1>

			<div>
				<input type="text" placeholder="Username" />
				<input type="password" placeholder="Password" />
				<button type="submit" onClick={goHome()}>connect</button>


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
			<Galaxy>
				<div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/login" element={<LoginView />} />
						<Route path="/aboutus" element={<ProfilePage />} />
					</Routes>
				
					<AboutUs />
					<BackHome />
					<SideMenu isLogged={isLogged} setIsLogged={setIsLogged} />
				</div>		
			</Galaxy>
		</div>
	</Router>
    </>
  )
  
}

export default App
