import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BackHome.css'; 
import logo from './assets/logo.png'; // Assurez-vous que le chemin est correct
export default function BackHome() 
{
	const location = useLocation();
	const hideBackHome = location.pathname.startsWith('/pong/play');
	if( hideBackHome) return null;
	const navigate = useNavigate();
	return (
		<>
		
		 <img  onClick={() => navigate('/')}
    src={logo}
    alt="Logo"
    className="h-16 w-16 object-contain hover:scale-110 active:scale-93"
    style={{
      marginLeft: "1rem",  
      marginTop: "1rem",    
      marginRight: "4rem",
      position: "absolute",
      zIndex: 999999999999
    }}
  /> 
		</>
	);
}
