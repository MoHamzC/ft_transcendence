import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AboutUs.css'; 
import SplashCursor from './SplashCursor'


export default function AboutUs() 
{
	const location = useLocation();
	const hideAboutUs = location.pathname.startsWith('/pong/play');
	if( hideAboutUs) return null;
	const navigate = useNavigate();
	return (
		<>
		{/* <SplashCursor /> */}
		<p className="about-us" onClick={() => navigate('/aboutus')}>about us</p>
		</>
	);

}
