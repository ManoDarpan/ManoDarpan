import { motion } from "framer-motion";
// This object stores animation styles for different states of the component.
// - initial: how the component appears before mounting
// - animate: how it appears after mounting
// - exit: how it appears when leaving (useful in page transitions)
const animations = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};
// This component wraps any page or content that should have transition animations.
// "children" means anything you place inside <AnimatedPage>...</AnimatedPage>
const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage; // Export the component so we can use it in other files
