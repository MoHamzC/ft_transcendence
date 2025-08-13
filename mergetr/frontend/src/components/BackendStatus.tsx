// components/BackendStatus.tsx
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    try {
      await ApiService.healthCheck();
      setStatus('online');
      setLastCheck(new Date());
    } catch {
      setStatus('offline');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return '✅';
      case 'offline': return '❌';
      default: return '🔄';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
      <div className="flex items-center gap-2">
        <span>{getStatusIcon()}</span>
        <span className={`font-medium ${getStatusColor()}`}>
          Backend: {status}
        </span>
      </div>
      {lastCheck && (
        <div className="text-xs text-white/70 mt-1">
          Last check: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default BackendStatus;
