import { useState } from "react";
import "./SideMenu.css";
import "./App.tsx";
import { useNavigate } from 'react-router-dom';
export default function SideMenu({isLogged, setIsLogged}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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

          <button className="menu-item">STATS</button>
          <button className="menu-item">LEADERBORD</button>
          <button className="menu-item">FRIENDS</button>
          <button className="menu-item">SETTINGS</button>
          <button className="menu-item">LOGOUT</button>
        </div>
      )}
    </div>
  );
}
