import FuzzyText from "./FuzzyText";
import MyToggle from "./MyToggle";
import React from "react";
import {useNavigate } from 'react-router-dom';
import './Settings.css';
import Select from "./Select"

export default function Settings () {
    const navigate = useNavigate();
    const BACKEND_URL = 'https://localhost:8443';

    const [language, setLanguage] = React.useState('en');
    const [doubleAuth, setDoubleAuth] = React.useState(false);
    const [privateProfile, setPrivateProfile] = React.useState(false);
    const [friendsRequest, setFriendsRequest] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [loadingSettings, setLoadingSettings] = React.useState(true);
    const [message, setMessage] = React.useState('');

    // Load existing settings on mount
    React.useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch(`${BACKEND_URL}/api/users/user-settings`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    const result = await response.json();
                    const settings = result.settings;

                    // Initialize states with DB values
                    setDoubleAuth(settings.two_factor_enabled || false);
                    setPrivateProfile(settings.profile_private || false);
                    setFriendsRequest(settings.add_friend || false);
                    setLanguage(settings.language || 'en');

                    console.log('Settings loaded:', settings);
                } else {
                    console.error('Failed to load settings');
                    setMessage('Unable to load settings');
                }
            } catch (err) {
                console.error('Error loading settings:', err);
                setMessage('Error loading settings');
            } finally {
                setLoadingSettings(false);
            }
        }

        loadSettings();
    }, []);

    function goReset() {
        navigate('/ResetPassword');
    }

    async function saveSettings() {
        setLoading(true);
        setMessage('');

        try {
            console.log('Sending settings:', {
                two_factor_enabled: doubleAuth,
                language: language,
                add_friend: friendsRequest,
                profile_private: privateProfile
            });

            const response = await fetch(`${BACKEND_URL}/api/users/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    two_factor_enabled: doubleAuth,
                    language: language,
                    add_friend: friendsRequest,
                    profile_private: privateProfile
                }),
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                setMessage('Settings saved successfully!');
                console.log('Settings saved:', result);
            } else {
                const error = await response.json();
                console.error('Error response:', error);
                setMessage(`Error: ${error.error || 'cant save'}`);
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            const errorMessage = err instanceof Error ? err.message : 'Cant connect';
            setMessage(`Network: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }
  return (
    <div className="settings">
      <FuzzyText>Settings</FuzzyText>
      <div>
        {loadingSettings ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading settings...</p>
            </div>
        ) : (
        <div className="setting-item flex flex-direction-column gap-4">
        <h2>Two-Factor Authentication</h2>
         <MyToggle
            onChange={(checked) => setDoubleAuth(checked)}
            defaultChecked={doubleAuth}
            key={`double-auth-${doubleAuth}`}
        />
        <h2>Private Profile</h2>
        <MyToggle
            onChange={(checked) => setPrivateProfile(checked)}
            defaultChecked={privateProfile}
            key={`private-profile-${privateProfile}`}
        />
        <h2>Friend Requests</h2>
        <MyToggle
            onChange={(checked) => setFriendsRequest(checked)}
            defaultChecked={friendsRequest}
            key={`friends-request-${friendsRequest}`}
        />
                    <h2>Language</h2>
                        <Select value={language} onChange={(v) => setLanguage(v)} />

        {message && (
            <div style={{
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: message.includes('Error') || message.includes('Unable') ? '#fee' : '#efe',
                color: message.includes('Error') || message.includes('Unable') ? '#c33' : '#363',
                border: `1px solid ${message.includes('Error') || message.includes('Unable') ? '#faa' : '#afa'}`
            }}>
                {message}
            </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
                className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                style={{
                    backgroundColor: loading ? '#666' : 'oklch(25.7% 0.09 281.288)',
                    opacity: loading ? 0.7 : 1
                }}
                type="button"
                onClick={saveSettings}
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Save settings'}
            </button>

            <button
                className="px-4 py-2 rounded-full text-white mx-2 hover:cursor-pointer hover:bg-gray-500 active:scale-95 shadow-xl cursor-target"
                style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                type="button"
                onClick={goReset}
            >
                Reset Password
            </button>
        </div>

                </div>
        )}
      </div>
    </div>
  );
}
