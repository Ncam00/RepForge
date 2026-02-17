"use client";

import { useEffect, useState } from "react";
import { Trophy, X, Flame, Target, Dumbbell } from "lucide-react";

interface PRCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  prTypes: string[];
  exerciseName: string;
}

export function PRCelebration({ isOpen, onClose, prTypes, exerciseName }: PRCelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Create confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981', '#ec4899'][Math.floor(Math.random() * 5)],
      }));
      setParticles(newParticles);

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getPRIcon = (type: string) => {
    switch (type) {
      case "1RM":
        return <Dumbbell className="w-5 h-5" />;
      case "Volume":
        return <Target className="w-5 h-5" />;
      case "Reps":
        return <Flame className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.id * 50}ms`,
          }}
        />
      ))}

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-1 rounded-2xl shadow-2xl animate-bounce-in z-10">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 min-w-[320px] text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trophy icon with glow */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            New Personal Record!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {exerciseName}
          </p>

          {/* PR Types */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {prTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium"
              >
                {getPRIcon(type)}
                {type}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep pushing your limits! 💪
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
