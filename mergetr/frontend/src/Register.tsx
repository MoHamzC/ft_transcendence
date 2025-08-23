import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

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
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
            />
            <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button type="submit">Register</button>
        </form>
    );
}