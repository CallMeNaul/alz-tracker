
import React, { useEffect } from "react";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  useEffect(() => {
    // Set a timer to complete loading after 2 seconds
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center dark:bg-[#000000] light:bg-white bg-white dark:text-white text-black"
    >
      <div className="flex flex-col items-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-40 h-40 md:w-60 md:h-60"
        >
          <img
            src= "https://i.postimg.cc/jqfHbSsP/black-on-white-removebg-preview.png"//"/lovable-uploads/d874b633-eabc-45db-bfba-1cb2f2e22d35.png"
            alt="AlzTracker Logo"
            className="w-full h-full object-contain"
          />
        </motion.div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-[#02646f]/20 rounded-full blur-3xl -z-10"
        />
        
        <motion.h1 
          animate={{ 
            opacity: [0.5, 1, 0.5],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-3xl md:text-4xl font-bold dark:text-white text-black mb-8 font-space-mono"
        >
          AlzTracker
        </motion.h1>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
