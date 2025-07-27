import { useState, use } from 'react'
import './App.css'

import Galaxy from './Galaxy.tsx';
import Login from './Login.tsx';
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


function App() 
{
  return (
    <>
		<div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
			<Galaxy>
				<div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
					<h1><strong>transcendence</strong></h1>

					<div>
						<Button onClick={startPong}>pong</Button>
						<Button>game2</Button>
						<Login></Login>
					</div>
				</div>			
			</Galaxy>
		</div>

	
    </>
  )
  
}

export default App
