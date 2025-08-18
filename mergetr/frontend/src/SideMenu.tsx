import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import PillNav from './PillNav.tsx';
import logo from './assets/logo.png';
import "./SideMenu.css";
import "./App.tsx";

export default function SideMenu({ isLogged, setIsLogged }: any) {
  
  const navigate = useNavigate();

  function handleNav(href: string) {
    navigate(href);
    setIsOpen(false);
    setIsLogged(true);
  }

  return (
    <div>
      {!isLogged && (
        <div className="side-menu">
          <PillNav
            logo={logo}
            logoAlt="Company Logo"
            items={[{
              label: 'Login',
              href: '/login',
              onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                setIsLogged(true);
                navigate('/login');
              }
            }]}
            activeHref={window.location.pathname}
            className="custom-nav"
            ease="power2.easeOut"
            baseColor="oklch(25.7% 0.09 281.288)" 
            pillColor="oklch(38% 0.189 293.745)"   
            pillTextColor="#ffffff"
            onMobileMenuClick={() => {}}
          />
        </div>
      )}
      {isLogged && (
        <div className="side-menu">
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
            baseColor="oklch(25.7% 0.09 281.288)" 
            pillColor="oklch(38% 0.189 293.745)"   
            pillTextColor="white"
            onMobileMenuClick={() => {}}
          />
        </div>
      )}
    </div>
  );
}
