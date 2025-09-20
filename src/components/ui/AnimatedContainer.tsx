import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  fadeInUp,
  fadeIn,
  slideInFromLeft,
  slideInFromRight,
  scaleIn,
  bounceIn,
  staggerContainer,
  staggerItem,
  resourceCard,
  timelineItem,
  canvasZoom,
  animationPresets
} from '@/utils/animations';

type AnimationType = 
  | 'fadeInUp'
  | 'fadeIn'
  | 'slideInFromLeft'
  | 'slideInFromRight'
  | 'scaleIn'
  | 'bounceIn'
  | 'staggerContainer'
  | 'staggerItem'
  | 'resourceCard'
  | 'timelineItem'
  | 'canvasZoom'
  | 'none';

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: AnimationType;
  customVariants?: Variants;
  className?: string;
  delay?: number;
  duration?: number;
  staggerDelay?: number;
  layoutId?: string;
  initial?: boolean;
  animate?: boolean;
  exit?: boolean;
  whileHover?: any;
  whileTap?: any;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
}

const animationMap: Record<AnimationType, Variants | null> = {
  fadeInUp,
  fadeIn,
  slideInFromLeft,
  slideInFromRight,
  scaleIn,
  bounceIn,
  staggerContainer,
  staggerItem,
  resourceCard,
  timelineItem,
  canvasZoom,
  none: null,
};

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeInUp',
  customVariants,
  className,
  delay = 0,
  duration,
  staggerDelay,
  layoutId,
  initial = true,
  animate = true,
  exit = true,
  whileHover,
  whileTap,
  onAnimationComplete,
  style,
}) => {
  const variants = customVariants || animationMap[animation];

  if (!variants || animation === 'none') {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // Create modified variants with custom timing
  const modifiedVariants = duration || delay || staggerDelay ? {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate?.transition,
        ...(duration && { duration }),
        ...(delay && { delay }),
        ...(staggerDelay && { staggerChildren: staggerDelay }),
      },
    },
  } : variants;

  return (
    <motion.div
      variants={modifiedVariants}
      initial={initial ? 'initial' : false}
      animate={animate ? 'animate' : false}
      exit={exit ? 'exit' : false}
      whileHover={whileHover}
      whileTap={whileTap}
      layoutId={layoutId}
      className={className}
      style={style}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
};

// Specialized animated components
export const AnimatedList: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.1 }) => (
  <AnimatedContainer
    animation="staggerContainer"
    className={className}
    staggerDelay={staggerDelay}
  >
    {children}
  </AnimatedContainer>
);

export const AnimatedListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay }) => (
  <AnimatedContainer
    animation="staggerItem"
    className={className}
    delay={delay}
  >
    {children}
  </AnimatedContainer>
);

export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => (
  <AnimatedContainer
    animation="resourceCard"
    className={cn('cursor-pointer', className)}
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
  >
    {children}
  </AnimatedContainer>
);

export const AnimatedModal: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}> = ({ children, isOpen, onClose, className }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
            className
          )}
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const AnimatedNotification: React.FC<{
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}> = ({ children, isVisible, className }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const AnimatedPage: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={animationPresets.smooth}
    className={className}
  >
    {children}
  </motion.div>
);

// Loading animations
export const AnimatedSpinner: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 24, className }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    }}
    className={cn('inline-block', className)}
    style={{ width: size, height: size }}
  >
    <div className="w-full h-full border-2 border-current border-t-transparent rounded-full" />
  </motion.div>
);

export const AnimatedPulse: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    animate={{
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Utility component for AnimatePresence
export const AnimatedPresence: React.FC<{
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}> = ({ children, mode = 'wait' }) => (
  <AnimatePresence mode={mode}>
    {children}
  </AnimatePresence>
);

export default AnimatedContainer;