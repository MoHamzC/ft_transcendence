import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import TargetCursor from './TargetCursor';
import FuzzyText from "./FuzzyText";

export default function Register() {
    
    const BACKEND_URL = 'http://localhost:5001';
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
   const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        if (!username || !email || !password) {
            alert('Please fill in all fields');
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            if (response.ok) {
                alert('Registration successful!');
                navigate('/login');
              
            } else {
                const error = await response.json();
                alert(error.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert('Network error occurred');
        }
    }

    return (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TargetCursor spinDuration={2} hideDefaultCursor={true} />
            <h1 className="transcendence cursor-target"><FuzzyText>Register</FuzzyText></h1>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="px-4 py-3 rounded text-white cursor-target"
                style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
            />
            <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-4 py-3 rounded text-white cursor-target"
                style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-4 py-3 rounded text-white cursor-target"
                style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                    style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                    type="submit"
                >
                    Register
                </button>
                <button
                    className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                    style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                    type="button"
                    onClick={() => navigate('/login')}
                >
                    Back to Login
                </button>
            </div>
        </form>
    );
}