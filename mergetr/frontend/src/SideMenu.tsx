import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import PillNav from './PillNav.tsx';
import logo from './assets/logo.png';
import "./SideMenu.css";

export default function SideMenu({ isLogged, setIsLogged }: any) {

  const navigate = useNavigate();

  function handleNav(href: string) {
    navigate(href);
    setIsLogged(true);
  }

  return (
    <div>
      {!isLogged && (
        <div className="side-menu">
          <PillNav
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
            items={[
              {
                label: 'Home',
                href: '/',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleNav('/');
                }
              },
              {
                label: 'Profile',
                href: '/profile',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleNav('/profile');
                }
              },
              {
                label: 'Stats',
                href: '/stats',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleNav('/stats');
                }
              },
              {
                label: 'Leaderboard',
                href: '/leaderboard',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleNav('/leaderboard');
                }
              },
              {
                label: 'Friends',
                href: '/friends',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleNav('/friends');
                }
              },
              {
                label: 'Settings',
                href: '/settings',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleNav('/settings');
                }
              },
              {
                label: 'Logout',
                href: '/logout',
                onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  setIsLogged(false);
                  navigate('/');
                }
              }
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
