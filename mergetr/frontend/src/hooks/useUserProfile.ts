import { useState, useEffect, useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  lastLogin: string;
  rank: number;
  level: number;
  experience: number;
  bio?: string;
  location?: string;
  favoriteGame?: string;
  achievements: string[];
}

interface UserSettings {
  two_factor_enabled: boolean;
  language: string;
  add_friend: boolean;
  profile_private: boolean;
  avatar_url: string;
  pong_color?: string;
  pong_skin_type?: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch user settings
      let userSettings = null;
      try {
        const settingsResponse = await fetch('/api/users/user-settings', {
          credentials: 'include',
        });

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          userSettings = settingsData.settings;
          setSettings(userSettings);
        } else {
          console.warn('Failed to fetch user settings, using defaults');
        }
      } catch (settingsError) {
        console.warn('Error fetching settings:', settingsError);
      }

      // Create profile data with fallback values
      const profileData: UserProfileData = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: userSettings?.avatar_url || '/uploads/avatars/default_avatar.svg',
        joinDate: '2024-01-15',
        lastLogin: new Date().toISOString(),
        rank: 42,
        level: 15,
        experience: 2450,
        bio: 'Passionate gamer and developer',
        location: 'Paris, France',
        favoriteGame: 'Pong 3D',
        achievements: ['First Win', 'Speed Demon', 'Perfect Game', 'Social Butterfly']
      };

      setProfile(profileData);
    } catch (err) {
      console.error('Error in fetchUserData:', err);
      
      // Even if there's an error, create a basic profile from user data
      if (user) {
        const fallbackProfile: UserProfileData = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: '/uploads/avatars/default_avatar.svg',
          joinDate: '2024-01-15',
          lastLogin: new Date().toISOString(),
          rank: 0,
          level: 1,
          experience: 0,
          bio: '',
          location: '',
          favoriteGame: '',
          achievements: []
        };
        setProfile(fallbackProfile);
      }
      
      setError('Some profile data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData: Partial<UserProfileData>) => {
    if (!profile) return;

    try {
      // Update local state immediately for better UX
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);

      // Here you would make the actual API call to update the profile
      // await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify(updatedData)
      // });
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Revert changes on error
      await fetchUserData();
    }
  };

  const updateSettings = async (updatedSettings: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      setSettings(prev => prev ? { ...prev, ...updatedSettings } : null);

      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      // Also update the avatar URL in profile if it was changed
      if (updatedSettings.avatar_url && profile) {
        setProfile(prev => prev ? { ...prev, avatarUrl: updatedSettings.avatar_url! } : null);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      // Revert changes on error
      await fetchUserData();
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  return {
    profile,
    settings,
    loading,
    error,
    updateProfile,
    updateSettings,
    refetch: fetchUserData
  };
};

export default useUserProfile;
