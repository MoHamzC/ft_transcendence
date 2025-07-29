import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackHome.css'; 

export default function BackHome() 
{
	const navigate = useNavigate();
	return (
		<>
		<p className="backhome" onClick={() => navigate('/')}>transcendance logo</p>
		</>
	);
}
