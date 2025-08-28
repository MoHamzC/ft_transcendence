import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TargetCursor from './TargetCursor';
import FuzzyText from './FuzzyText';
export default function LoginView({ setIsLogged }: any)
{
    const navigate = useNavigate();
    const BACKEND_URL = 'http://localhost:5001';
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {

        const urlParams = new URLSearchParams(window.location.search);
        const loginSuccess = urlParams.get('login');

        if (loginSuccess === 'success') {
            setIsLogged(true);
            navigate('/');
            return;
        }

        const checkAuthStatus = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/users/protected`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    setIsLogged(true);
                    navigate('/');
                }
            } catch (err) {
                console.error('Error checking auth status:', err);
            }
        };

        checkAuthStatus();
    }, [navigate, setIsLogged]);

    function authentification42()
    {

        window.location.href = `${BACKEND_URL}/auth/42`;
    }

    function authentificationGithub()
    {
        window.location.href = `${BACKEND_URL}/auth/github`;
    }

    function authentificationGoogle()
    {
        window.location.href = `${BACKEND_URL}/auth/google`;
    }

    function handleRegister()
    {
         navigate('/register');
    }

    async function handleLogin() {
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const result = await response.json();
                
                // Si la réponse contient step: "otp", rediriger vers la page 2FA
                if (result.step === 'otp') {
                    navigate('/doubleauth', { state: { email } });
                } else {
                    // Login réussi sans 2FA
                    alert(result.message || 'Login successful');
                    setIsLogged(true);
                    navigate('/');
                }
            } else {
                const error = await response.json();
                alert(error.error || error.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Network error occurred');
        }
    }


    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        void handleLogin();
    }

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <TargetCursor
spinDuration={2}
hideDefaultCursor={true}

/>
                <h1 className='transcendence cursor-target'><FuzzyText>Login</FuzzyText></h1>

               
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        className="px-4 py-3 rounded text-white cursor-target"
                        style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="px-4 py-3 bg-zinc-600 rounded text-white cursor-target"
                        style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                            style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                            type="submit"
                        >
                            Validate
                        </button>
                        <button
                            className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                            style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                            type="button"
                            onClick={handleRegister}
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
            <div className="flex flex-row justify-center items-center gap-4 mt-4">
                <button
                    onClick={authentificationGithub}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-3 transition-all duration-200 hover:scale-105 shadow-lg cursor-target"
                >
                    <img src="/assets/github.svg" alt="GitHub" className="w-6 h-6 cursor-target" />
                    GitHub
                </button>
                <button
                    onClick={authentification42}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-3 transition-all duration-200 hover:scale-105 shadow-lg cursor-target"
                >
                    <img src="/assets/42.svg" alt="42" className="w-6 h-6 cursor-target" />
                    Intra 42
                </button>
                <button
                    onClick={authentificationGoogle}
                    className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-lg flex items-center gap-3 transition-all duration-200 hover:scale-105 shadow-lg cursor-target"
                >
                    <img src="/assets/google.svg" alt="Google" className="w-6 h-6 cursor-target" />
                    Google
                </button>
            </div>
        </>
    );
}
