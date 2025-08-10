import { useNavigate } from 'react-router-dom';


export default function LoginView()
{
    const navigate = useNavigate(); 
    const BACKEND_URL = 'http://localhost:5001';

    function authentification42()
    {
        
        window.location.href = `${BACKEND_URL}/auth/42`;
    }

    function authentificationGithub()
    {
        
        window.location.href = `${BACKEND_URL}/auth/github`;
    }
    
    function goHome() {
        navigate('/');
    }
    
    function authentificationGoogle()
    {
        
        window.location.href = `${BACKEND_URL}/auth/google`;
    }

    async function handleLogin() {
        const email = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value;
        const password = (document.querySelector('input[type="password"]') as HTMLInputElement)?.value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const result = await response.text();
                alert(result);
                navigate('/');
            } else {
                const error = await response.json();
                alert(error.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Network error occurred');
        }
    }

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h1 className='transcendence'><strong>Login to play</strong></h1>
                <input 
                    className="px-4 py-3 bg-zinc-600 rounded text-white" 
                    type="text" 
                    placeholder="Email" 
                />
                <input 
                    className="px-4 py-3 bg-zinc-600 rounded text-white" 
                    type="password" 
                    placeholder="Password" 
                />
                <button 
                    className="px-4 py-2 bg-zinc-400 rounded-full text-black mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl" 
                    type="submit" 
                    onClick={handleLogin}
                >
                    connect
                </button>
            </div>
            <div className="flex flex-row justify-center items-center gap-0 mt-4">
                <img onClick={authentificationGithub} src="/assets/githubold.png" alt="Github logo" className="logo" />
                <img onClick={authentification42} src="/assets/42.png" alt="42 logo" className="logo" />
                <img onClick={authentificationGoogle} src="/assets/google.png" alt="Google logo" className="logo" />
            </div>
        </>
    );
}
