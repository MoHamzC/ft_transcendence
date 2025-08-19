import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:5001';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const disconnect = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', 
        });

        if (response.ok) {
          const result = await response.text();
          console.log(result);
          navigate('/');
        } else {
          const error = await response.json();
          alert(error.error || 'Logout failed');
        }
      } catch (err) {
        console.error('Logout error:', err);
        alert('Logout error occurred');
      }
    };

    disconnect();
  }, [navigate]);

  return <p>Login out...</p>;
}
