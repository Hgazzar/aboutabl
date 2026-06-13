import { useAudioContext } from "@/context/AudioContext";
import React, { useState, useRef, useEffect } from "react";
import MicIcon from "@mui/icons-material/Mic";

interface AudioIconProps {
  /** When missing or empty, nothing is rendered (no microphone placeholder). */
  src?: string | null;
}

const AudioIcon: React.FC<AudioIconProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  //@ts-ignore
  const { stopAll, audiosRef } = useAudioContext();

  useEffect(() => {
    if (audioRef.current) {
      audiosRef.current.push(audioRef.current);
    }
  }, [audiosRef]);

  if (src == null || !String(src).trim()) {
    return null;
  }

  const toggleAudio = () => {
    stopAll();
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      onClick={toggleAudio}
      role="button"
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
      style={{
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <MicIcon
        sx={{
          color: "#16a34a",
          fontSize: 36,
          verticalAlign: "middle",
        }}
      />
      <audio ref={audioRef} src={src} onPause={() => setIsPlaying(false)} />
    </div>
  );
};

export default AudioIcon;

// import React, { useState, useRef } from 'react';

// interface AudioIconProps {
//   src: string;
// }

// const AudioIcon: React.FC<AudioIconProps> = ({ src }) => {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const audioRef = useRef<HTMLAudioElement>(null);

//   const toggleAudio = () => {
//     if (isPlaying) {
//       audioRef.current?.pause();
//     } else {
//       audioRef.current?.play();
//     }
//     setIsPlaying(!isPlaying);
//   };

//   return (
//     <div onClick={toggleAudio}>
//       <img
//         src={require("@/assets/voice.png")}
//         alt="Audio Icon"
//         style={{ cursor: "pointer" }}
//         onClick={toggleAudio}
//       />
//       <audio ref={audioRef} src={src} />
//     </div>
//   );
// };

// export default AudioIcon;
