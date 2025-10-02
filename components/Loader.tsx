import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Connecting the dots...",
  "Synthesizing knowledge...",
  "Delving into the rabbit hole...",
  "Uncovering hidden patterns...",
  "Generating a universe of ideas...",
  "Brewing a fresh pot of insights...",
  "Asking the silicon oracle...",
];

const Loader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-16">
        <svg
            className="animate-spin h-12 w-12 text-cyan-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            ></circle>
            <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        <p className="text-gray-300 text-lg text-center transition-opacity duration-500" key={messageIndex}>
            {loadingMessages[messageIndex]}
        </p>
    </div>
  );
};

export default Loader;