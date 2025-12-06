import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "../utils/cn";

interface ForceBtnProps {
  onShake: (force: number) => void;
  disabled?: boolean;
  shakesRemaining: number;
}

export const ForceBtn = ({
  onShake,
  disabled,
  shakesRemaining,
}: ForceBtnProps) => {
  const [isHolding, setIsHolding] = useState(false);
  const force = useMotionValue(0);
  const [displayForce, setDisplayForce] = useState(0);
  const animationRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1); // 1 for increasing, -1 for decreasing

  // Update display value when motion value changes
  useEffect(() => {
    const unsubscribe = force.on("change", (latest) => {
      setDisplayForce(Math.round(latest));
    });
    return unsubscribe;
  }, [force]);

  useEffect(() => {
    if (isHolding && !disabled) {
      let currentValue = 0;

      const animate = () => {
        currentValue += directionRef.current * 2;

        if (currentValue >= 100) {
          currentValue = 100;
          directionRef.current = -1;
        } else if (currentValue <= 0) {
          currentValue = 0;
          directionRef.current = 1;
        }

        force.set(currentValue);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHolding, disabled, force]);

  const handleMouseDown = () => {
    if (!disabled) {
      setIsHolding(true);
      force.set(0);
      directionRef.current = 1;
    }
  };

  const handleMouseUp = () => {
    if (!disabled && isHolding) {
      setIsHolding(false);
      onShake(force.get() / 100); // Convert to 0-1 range
      force.set(0);
      directionRef.current = 1;
    }
  };

  const handleMouseLeave = () => {
    if (isHolding) {
      handleMouseUp();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex gap-3 items-center text-2xl text-white">
        <motion.div
          className="h-fit"
          animate={isHolding ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ repeat: isHolding ? Infinity : 0, duration: 0.6 }}
        >
          {shakesRemaining}x
        </motion.div>
        <motion.button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={cn(
            "bg-blue-600 text-white font-semibold text-2xl shadow-lg transition-colors p-2 px-4 uppercase relative overflow-hidden",
            disabled
              ? "hover:cursor-not-allowed bg-gray-900"
              : "hover:cursor-pointer active:bg-blue-700"
          )}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          {/* Force indicator background */}
          <motion.div className="absolute inset-0 bg-blue-400" />
          <span className="relative z-10">Shake</span>
        </motion.button>
      </div>
      {/* Force meter */}
      <div className="flex-1 w-full mt-2">
        <div className="w-full bg-gray-700 h-4 rounded overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
            style={{ width: `${displayForce}%` }}
          />
        </div>
        <motion.div
          className="text-white text-center mt-1 text-sm"
          animate={isHolding ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
          transition={{ repeat: isHolding ? Infinity : 0, duration: 0.6 }}
        >
          {displayForce}%
        </motion.div>
      </div>
    </div>
  );
};
