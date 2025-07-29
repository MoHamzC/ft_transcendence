import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css'; 

export default function AboutUs() 
{
	const navigate = useNavigate();
	return (
		<>
		<p className="about-us" onClick={() => navigate('/aboutus')}>about us</p>
		</>
	);
}
