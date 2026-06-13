import React, { createContext, useContext, useRef } from "react";

const AudioContext = createContext<{ stopAll: () => void }>({
  stopAll: () => {},
});
//@ts-ignore
export const AudioProvider: React.FC = ({ children }) => {
  const audiosRef = useRef<HTMLAudioElement[]>([]);

  const stopAll = () => {
    audiosRef.current.forEach((audio) => audio.pause());
  };

  return (
    //@ts-ignore
    <AudioContext.Provider value={{ stopAll, audiosRef }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => useContext(AudioContext);
