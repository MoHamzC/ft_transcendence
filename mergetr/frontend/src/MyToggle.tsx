import React from "react";
import { useState } from "react";
import "./MyToggle.css";

interface MyToggleProps {
    onChange?: (checked: boolean) => void;
    defaultChecked?: boolean;
}

export default function MyToggle({ onChange, defaultChecked = false }: MyToggleProps) {
    const [toggled, setToggled] = useState(defaultChecked);

    const handleToggle = () => {
        const newValue = !toggled;
        setToggled(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div className="mytoggle">
            <button 
                className={`toggle-button ${toggled ? 'toggled' : ''}`}
                onClick={handleToggle}
                aria-checked={toggled}
                role="switch"
            >
                <div className="toggle-slider"></div>
            </button>
        </div>
    );
}