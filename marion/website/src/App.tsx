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

function authentification42()
{
	//todo
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
            
            <img onClick={authentification42} src="https://videos.openai.com/vg-assets/assets%2Ftask_01k1em5hpxezbagnsaf8yqxjxr%2F1753911434_img_1.webp?st=2025-07-30T20%3A17%3A52Z&se=2025-08-05T21%3A17%3A52Z&sks=b&skt=2025-07-30T20%3A17%3A52Z&ske=2025-08-05T21%3A17%3A52Z&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skoid=8ebb0df1-a278-4e2e-9c20-f2d373479b3a&skv=2019-02-02&sv=2018-11-09&sr=b&sp=r&spr=https%2Chttp&sig=iOKszktU%2FX12O4nJ9Bi%2FtelsvXyVKshI%2FXpTS4%2BcDWY%3D&az=oaivgprodscus" alt="42 logo" className="logo" />
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
