import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FuzzyText from "./FuzzyText";

export default function DoubleAuth() {
    const navigate = useNavigate();


    function validateCode() {
        navigate('/');
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
  