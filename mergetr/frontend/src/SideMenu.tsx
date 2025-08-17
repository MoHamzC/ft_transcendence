import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import PillNav from './PillNav.tsx';
import logo from './assets/logo.png'; // Chemin réel du logo
import "./SideMenu.css";
import "./App.tsx";

export default function SideMenu({ isLogged, setIsLogged }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Navigation handlers
  function handleNav(href: string) {
    navigate(href);
    setIsOpen(false);
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
        <div
          className="side-menu"
          style={{
            boxShadow: "none",
            borderTopLeftRadius: "30px",
            borderBottomLeftRadius: "30px",
            paddingTop: "70px", // espace pour le bouton profil
            paddingLeft: "10px",
            paddingRight: "10px",
            width: "100%",
            maxHeight: "100vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "20px",
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 999,
          }}
        >
          <PillNav
            logo={logo}
            logoAlt="Company Logo"
            items={[
              { label: 'Home', href: '/' },
              { label: 'Profile', href: '/profile' },
              { label: 'Stats', href: '/stats' },
              { label: 'Leaderboard', href: '/leaderbord' },
              { label: 'Friends', href: '/friends' },
              { label: 'Settings', href: '/settings' },
              { label: 'Logout', href: '/logout' }
            ]}
            activeHref={window.location.pathname}
            className="custom-nav"
            ease="power2.easeOut"
            baseColor="oklch(25.7% 0.09 281.288)" // <-- couleur de l'actif
            pillColor="oklch(38% 0.189 293.745)"   // <-- couleur normale
            hoveredPillTextColor="#ffffff"
            pillTextColor="#ffffff"
            onItemClick={item => handleNav(item.href)}
          />
        </div>
      )}
    </div>
  );
}
