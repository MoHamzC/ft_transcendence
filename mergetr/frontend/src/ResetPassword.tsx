import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import FuzzyText from "./FuzzyText";

const BACKEND_URL = 'http://localhost:5001';
export default function ResetPassword() {
    const navigate = useNavigate();
    
            
        async function resetPassword() {
        const password = (document.querySelector('input[type="password"]') as HTMLInputElement)?.value;

        if (!password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/users/reset_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                const result = await response.text();
                alert(result);
                navigate('/settings');
            } else {
                const error = await response.json();
                alert(error.error || 'Reset Password failed failed');
            }
        } catch (err) {
            console.error('Reset Password error:', err);
            alert('Network error occurred');
        }
    }
    return (
        
        <div>
            <h1><FuzzyText>Reset Password </FuzzyText></h1>
              <input
                    className="px-4 py-3 bg-zinc-600 rounded text-white cursor-target"
                    style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
                    type="password"
                    placeholder="new password"
                />
             <button
                    className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                    style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                    type="submit"
                    onClick={resetPassword}
            ></button>
        </div>
    ); 
}
