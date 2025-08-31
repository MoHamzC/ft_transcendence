// ScrollablePage.tsx - Wrapper pour les pages qui ont besoin de défilement
import React from 'react';

interface ScrollablePageProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollablePage: React.FC<ScrollablePageProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`scrollable-page ${className}`}
      style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        // Styles pour une scrollbar personnalisée (optionnel)
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 107, 157, 0.5) rgba(255, 255, 255, 0.1)'
      }}
    >
      <style>{`
        .scrollable-page::-webkit-scrollbar {
          width: 8px;
        }
        
        .scrollable-page::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .scrollable-page::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #ff6b9d, #c942ff);
          border-radius: 10px;
        }
        
        .scrollable-page::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ff8bb3, #d662ff);
        }
      `}</style>
      {children}
    </div>
  );
};

export default ScrollablePage;
