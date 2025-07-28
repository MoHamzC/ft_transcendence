import { useState, use } from 'react'
import './App.css'

import Galaxy from './Galaxy.tsx';
import Login from './Login.tsx';
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

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
				<div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
					<h1><strong>transcendence</strong></h1>

					<div>
						<Button onClick={startPong}>pong</Button>
						<Button>game2</Button>
						<Login></Login>
					</div>
				</div>		
	)
}

function LoginView()
{
	return (
				<div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
					<h1><strong>Login to play</strong></h1>

					<div>
						<Button>Login</Button>
						<Button>Signin</Button>
					</div>
				</div>		
	)
}

function App() 
{
  return (
    <>
		<Router>
		<div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
			<Galaxy>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/login" element={<LoginView />} />
			</Routes>
			</Galaxy>
		</div>
	</Router>
    </>
  )
  
}

export default App
