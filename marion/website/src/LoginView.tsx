import { useNavigate } from 'react-router-dom';

export default function LoginView()
{
    const navigate = useNavigate(); // Ajouter useNavigate

    function authentification42()
    {
        //todo
    }

    function goHome() {
        navigate('/'); // Fonction corrigée
    }

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h1 className='transcendence'><strong>Login to play</strong></h1>
                <input 
                    className="px-4 py-3 bg-zinc-600 rounded text-white" 
                    type="text" 
                    placeholder="Username" 
                />
                <input 
                    className="px-4 py-3 bg-zinc-600 rounded text-white" 
                    type="password" 
                    placeholder="Password" 
                />
                <button 
                    className="px-4 py-2 bg-zinc-600 rounded-full text-black mx-2 hover:cursor-pointer hover:bg-gray-500 shadow-xl" 
                    type="submit" 
                    onClick={goHome}
                >
                    connect
                </button>
            </div>
            
            <img onClick={authentification42} src="/assets/42.png" alt="42 logo" className="logo" />
        </>
    )
}