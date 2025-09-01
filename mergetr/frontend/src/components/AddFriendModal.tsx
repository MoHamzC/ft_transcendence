// components/AddFriendModal.tsx
import React, { useState } from 'react';
import FriendsService from '../services/friendsService';
import TargetCursor from '../TargetCursor';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendAdded: () => void;
}

export default function AddFriendModal({ isOpen, onClose, onFriendAdded }: AddFriendModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await FriendsService.sendFriendRequest(username.trim());
      setSuccess(result.message);
      setUsername('');
      onFriendAdded();
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      aria-modal="true"
      role="dialog"
    >
      <TargetCursor hideDefaultCursor={true} />
      <div
        className="w-full max-w-md mx-4 rounded-xl cursor-target shadow-2xl overflow-hidden hover:scale-102 active:scale-98 transition-transform"
        style={{ background: '#0f1720', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
            <div className="flex-1 flex justify-center">
            <h2 className="text-xl font-extrabold text-white text-center">Add a friend</h2>
            </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-white rounded-full p-2 hover:opacity-80 transition-opacity cursor-pointer"
            style={{ background: 'transparent' }}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-sm text-gray-300">Enter the username of the person you want to add:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="here :)"
              className="px-4 py-3 rounded text-white outline-none cursor-target hover:scale-103 active:scale-98 transition-transform"
              style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
              disabled={loading}
            />

            {error && (
              <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(255,40,40,0.08)', color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                {success}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-2">
              

              <button
                type="submit"
                className="px-5 py-2 rounded-full text-white font-semibold hover:scale-103 active:scale-95 cursor-target transition-transform shadow-xl cursor-pointer"
                style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                disabled={loading || !username.trim()}
              >
                {loading ? 'Sending...' : 'Send friend request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
