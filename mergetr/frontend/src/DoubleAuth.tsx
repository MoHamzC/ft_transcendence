import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FuzzyText from "./FuzzyText";
import TargetCursor from './TargetCursor';
import { use2FA } from './hooks/use2FA';


export default function DoubleAuth() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
     const BACKEND_URL = 'http://localhost:5001';

    async function validateCode() {

        try {
            const response = await fetch(`${BACKEND_URL}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
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
        <div>

            <form onSubmit={(e) => { e.preventDefault(); validateCode(); }}>
                <FuzzyText>Double Auth</FuzzyText>
                <input type="text" placeholder="Enter code" />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
}
