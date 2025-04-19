import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from "@/lib/supabase";
import { useUser } from "@/components/UserContext";

// Define level thresholds (adjust if needed)
const levelThresholds = [
  { level: 1, core: 2 },
  { level: 2, core: 4 },
  { level: 3, core: 8 },
  { level: 4, core: 16 },
  { level: 5, core: 32 },
  { level: 6, core: 64 },
  { level: 7, core: 125 },
  { level: 8, core: 250 },
  { level: 9, core: 500 },
  { level: 10, core: 1000 },
  { level: 11, core: 2000 },
  { level: 12, core: 4000 },
  { level: 13, core: 8000 },
  { level: 14, core: 16000 },
  { level: 15, core: 32000 },
  { level: 16, core: 64000 },
  { level: 17, core: 125000 },
  { level: 18, core: 250000 },
  { level: 19, core: 500000 },
  { level: 20, core: 1000000 },
  { level: 21, core: 2000000 },
  { level: 22, core: 4000000 },
  { level: 23, core: 8000000 },
  { level: 24, core: 16000000 },
  { level: 25, core: 32000000 },
  { level: 26, core: 64000000 },
  { level: 27, core: 125000000 },
  { level: 28, core: 250000000 },
  { level: 29, core: 500000000 },
  { level: 30, core: 1000000000 },
];

// Function to calculate level based on core
const calculateLevel = (core: number): number => {
  let calculatedLevel = 0;
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (core >= levelThresholds[i].core) {
      calculatedLevel = levelThresholds[i].level;
      break;
    }
  }
  return calculatedLevel;
};

const supabase = createClientSupabaseClient();

export const useLevelCheck = () => {
  const { dbUser, refreshUserData } = useUser();
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<{
    isOpen: boolean;
    newLevel: number | null;
    oldLevel: number | null;
  } | null>(null);

  useEffect(() => {
    if (dbUser && !isUpdatingLevel) {
      const currentAiCoreBalance = dbUser.aicore_balance || 0;
      const currentLevel = dbUser.level || 0;
      const calculatedLevel = calculateLevel(currentAiCoreBalance);

      if (calculatedLevel > currentLevel) {
        setIsUpdatingLevel(true);

        const updateUserLevel = async () => {
          try {
            const { error } = await supabase
              .from('users')
              .update({ level: calculatedLevel })
              .eq('id', dbUser.id);

            if (error) {
              console.error("Error updating user level:", error);
              setIsUpdatingLevel(false);
            } else {
              setLevelUpModal({
                isOpen: true,
                newLevel: calculatedLevel,
                oldLevel: currentLevel
              });
            }
          } catch (err) {
            console.error("Unexpected error updating level:", err);
            setIsUpdatingLevel(false);
          }
        };

        updateUserLevel();
      }
    }
  }, [dbUser?.aicore_balance, dbUser?.level, isUpdatingLevel, dbUser?.id]);

  const handleLevelUpModalClose = () => {
    setLevelUpModal(null);
    setIsUpdatingLevel(false);
    refreshUserData();
  };

  return {
    levelUpModal,
    handleLevelUpModalClose,
    levelThresholds
  };
}; 