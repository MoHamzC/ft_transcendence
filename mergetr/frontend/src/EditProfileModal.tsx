import React, { useState, useRef } from 'react';
import './Profile.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onSave: (updatedProfile: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave
}) => {
  const [formData, setFormData] = useState({
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    favoriteGame: userProfile?.favoriteGame || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(userProfile?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload avatar if changed
      let avatarUrl = userProfile.avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const avatarResponse = await fetch('/api/users/avatar', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          avatarUrl = avatarData.avatar_url;
        }
      }

      // Update profile data
      const updatedProfile = {
        ...userProfile,
        ...formData,
        avatarUrl
      };

      onSave(updatedProfile);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier le profil</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="avatar-upload-section">
            <div className="avatar-preview">
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="avatar-preview-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/uploads/avatars/default_avatar.svg';
                }}
              />
              <button
                type="button"
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="form-textarea"
              rows={3}
              placeholder="Parlez-nous de vous..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Localisation</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Votre ville, pays..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="favoriteGame">Jeu favori</label>
            <input
              type="text"
              id="favoriteGame"
              name="favoriteGame"
              value={formData.favoriteGame}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Votre jeu préféré..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
