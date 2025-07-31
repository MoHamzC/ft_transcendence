import { useState } from "react";
import "./SideMenu.css";
import "./App.tsx";
import { useNavigate } from 'react-router-dom';





export default function SideMenu({isLogged, setIsLogged}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();



function gotoleaderbord()
{
	navigate('/leaderbord');
}

function gotofriends()
{
	navigate('/friends');
}

function gotosettings()
{
	navigate('/settings');
}

function gotomyprofile()
{
	navigate('/profile');
}

function goStats()
{
	navigate('/stats');
}
  return (
    <div>
	<button
	  className="profile-button"
	  onClick={() => {
		if (!isLogged) {
			setIsLogged(true);
			navigate('/login');
		} else {
		setIsOpen((prev) => !prev);
		}
	  }}
	>
	  👤
	</button>
      {isOpen && (
        <div className="side-menu">
          <div className="profile-icon"></div>
		<button className="menu-item" onClick={gotomyprofile}>profile</button>
          <button onClick={goStats} className="menu-item">STATS</button>
          <button onClick={gotoleaderbord} className="menu-item">LEADERBORD</button>
          <button onClick={gotofriends} className="menu-item">FRIENDS</button>
          <button onClick={gotosettings} className="menu-item">SETTINGS</button>
          <button className="menu-item">LOGOUT</button>
        </div>
      )}
    </div>
  );
}
