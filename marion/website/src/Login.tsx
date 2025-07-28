
import { useState } from 'react';
import { Route } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="login">
            <button onClick={goToLogin}>
                Login
            </button>
        </div>
    );
}