import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css'; 
import SplashCursor from './SplashCursor'


export default function AboutUs() 
{
	const navigate = useNavigate();
	return (
		<>
		{/* <SplashCursor /> */}
		<p className="about-us" onClick={() => navigate('/aboutus')}>about us</p>
		</>
	);

}
