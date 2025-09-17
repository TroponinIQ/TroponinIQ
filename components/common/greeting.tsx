import { motion } from 'framer-motion';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-none sm:max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto mt-4 sm:mt-8 md:mt-12 lg:mt-20 px-2 sm:px-3 md:px-4 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-lg sm:text-xl md:text-2xl font-semibold leading-tight"
      >
        Welcome to TroponinIQ! 💪
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-base sm:text-lg md:text-xl lg:text-2xl text-zinc-500 leading-relaxed mt-1 sm:mt-2"
      >
        20+ years of world-class coaching at your fingertips
      </motion.div>
    </div>
  );
};
