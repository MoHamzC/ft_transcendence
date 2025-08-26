import FuzzyText from "./FuzzyText";
import MyToggle from "./MyToggle";
import React from "react";
import {useNavigate } from 'react-router-dom';
import './Settings.css';
import Select from "./Select"
export default function Settings () {
	const navigate = useNavigate();

	const [language, setLanguage] = React.useState('en');

	function goReset() {
		navigate('/ResetPassword');
	}
  return (
	<div className="settings">
	  <FuzzyText>Settings</FuzzyText>
	  <div>
		<div className="setting-item flex flex-direction-column gap-4">
		<h2> Double Auth</h2>
		 <MyToggle 
            onChange={(checked) => console.log('Toggle: Double Auth', checked)}
            defaultChecked={false}
        />
		<h2> Private Profile</h2>
		<MyToggle 
            onChange={(checked) => console.log('Toggle: Private Profile', checked)}
            defaultChecked={false}
        />
		<h2> Friends request</h2>
		<MyToggle 
            onChange={(checked) => console.log('Toggle: Private Profile', checked)}
            defaultChecked={false}
        />
					<h2>Language</h2>
						<Select value={language} onChange={(v) => setLanguage(v)} />
		 <button
                    className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                    style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                    type="submit"
                    onClick={goReset}
                >Reset Password </button>
		
				</div>
	  </div>
	</div>
  );
}