import { useNavigate } from 'react-router-dom';
import PillNav from './PillNav.tsx';
import "./SideMenu.css";
import "./App.tsx";

export default function SideMenu({ isLogged }: any) {
  const navigate = useNavigate();

  return (
    <div>
      {!isLogged && (
        <div className="side-menu">
          <PillNav
            items={[{
              label: 'Login',
              href: '/login',
              onClick: (e: any) => {
                e.preventDefault();
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
              { label: 'Home', href: '/' },
              { label: 'Profile', href: '/profile' },
              // { label: 'Stats', href: '/stats' },
              { label: 'Match History', href: '/match-history' },
              { label: 'Leaderboard', href: '/leaderbord' },
              { label: 'Friends', href: '/friends' },
              // { label: 'Settings', href: '/settings' },
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
