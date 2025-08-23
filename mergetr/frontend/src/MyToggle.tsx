import React from "react";
import { useState } from "react";

export default function MyToggle()
{
    const [Toggled, setToggled] = useState(false);
    return(
        <div className="mytoggle">
            <button 
            className="toggle-button"
            onClick={() => setToggled(!Toggled)}
            >
                <div className="thingy"></div>
            </button>
        </div>
    )
}