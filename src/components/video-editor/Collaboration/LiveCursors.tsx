import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, User } from 'lucide-react';
import { Cursor, User as UserType } from '../../../types/collaboration';

interface LiveCursorsProps {
  cursors: Record<string, Cursor>;
  users: UserType[];
  currentUserId?: string;
  className?: string;
  overlayMode?: boolean;
}

interface CursorWithUser extends Cursor {
  user: UserType;
}

const LiveCursors: React.FC<LiveCursorsProps> = ({
  cursors,
  users,
  currentUserId,
  className = '',
  overlayMode = false
}) => {
  const [activeCursors, setActiveCursors] = useState<CursorWithUser[]>([]);
  const [cursorTimeouts, setCursorTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  // Update active cursors when cursors or users change
  useEffect(() => {
    const newActiveCursors: CursorWithUser[] = [];
    const newTimeouts: Record<string, NodeJS.Timeout> = { ...cursorTimeouts };

    Object.values(cursors).forEach(cursor => {
      // Skip current user's cursor
      if (cursor.userId === currentUserId) return;

      const user = users.find(u => u.id === cursor.userId);
      if (!user || !user.isOnline) return;

      // Clear existing timeout for this cursor
      if (newTimeouts[cursor.userId]) {
        clearTimeout(newTimeouts[cursor.userId]);
      }

      // Add cursor with user info
      newActiveCursors.push({ ...cursor, user });

      // Set timeout to hide cursor after inactivity
      newTimeouts[cursor.userId] = setTimeout(() => {
        setActiveCursors(prev => prev.filter(c => c.userId !== cursor.userId));
        setCursorTimeouts(prev => {
          const updated = { ...prev };
          delete updated[cursor.userId];
          return updated;
        });
      }, 5000); // Hide after 5 seconds of inactivity
    });

    setActiveCursors(newActiveCursors);
    setCursorTimeouts(newTimeouts);

    // Cleanup function
    return () => {
      Object.values(newTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [cursors, users, currentUserId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(cursorTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const containerClass = overlayMode 
    ? `fixed inset-0 pointer-events-none z-50 ${className}`
    : `fixed inset-0 pointer-events-none z-50 ${className}`;

  return (
    <div className={containerClass}>
      <AnimatePresence>
        {activeCursors.map(cursor => (
          <CursorComponent
            key={cursor.userId}
            cursor={cursor}
            user={cursor.user}
            overlayMode={overlayMode}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface CursorComponentProps {
  cursor: Cursor;
  user: UserType;
  overlayMode?: boolean;
}

const CursorComponent: React.FC<CursorComponentProps> = ({ cursor, user, overlayMode = false }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Hide cursor if it goes outside viewport
  useEffect(() => {
    const isInViewport = 
      cursor.x >= 0 && 
      cursor.x <= window.innerWidth && 
      cursor.y >= 0 && 
      cursor.y <= window.innerHeight;
    
    setIsVisible(isInViewport);
  }, [cursor.x, cursor.y]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: cursor.x,
        y: cursor.y
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5
      }}
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${cursor.x}px, ${cursor.y}px)`,
        zIndex: overlayMode ? 1000 : 100
      }}
    >
      {/* Cursor Icon */}
      <div className="relative">
        <MousePointer2 
          className="w-5 h-5 transform -rotate-12" 
          style={{ color: user.color }}
          fill={user.color}
        />
        
        {/* User Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.1 }}
          className="absolute top-6 left-2 whitespace-nowrap"
        >
          <div 
            className="px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg flex items-center gap-1"
            style={{ backgroundColor: user.color }}
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-3 h-3 rounded-full"
              />
            ) : (
              <User className="w-3 h-3" />
            )}
            <span>{user.name}</span>
          </div>
          
          {/* Arrow pointing to cursor */}
          <div 
            className="absolute -top-1 left-2 w-2 h-2 transform rotate-45"
            style={{ backgroundColor: user.color }}
          />
        </motion.div>
        
        {/* Cursor Trail Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: user.color }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      
      {/* Element Highlight */}
      {cursor.elementId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div 
            className="absolute border-2 border-dashed rounded"
            style={{ 
              borderColor: user.color,
              left: -10,
              top: -10,
              right: -10,
              bottom: -10
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// Hook for tracking cursor position
export const useCursorTracking = (enabled: boolean = true) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        setCursorPosition({ x: event.clientX, y: event.clientY });
        
        // Track hovered element
        const element = event.target as HTMLElement;
        const elementId = element.id || element.className || null;
        setHoveredElement(elementId);
        
        throttleTimeout = null;
      }, 16); // ~60fps
    };

    const handleMouseLeave = () => {
      setHoveredElement(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [enabled]);

  return {
    cursorPosition,
    hoveredElement
  };
};

// Utility component for cursor boundaries
export const CursorBoundary: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {children}
    </div>
  );
};

export default LiveCursors;