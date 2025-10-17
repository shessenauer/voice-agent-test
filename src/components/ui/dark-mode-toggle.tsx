'use client';

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <label className="relative inline-block w-[3.5em] h-[2em] cursor-pointer">
      {/* Hidden checkbox */}
      <input 
        type="checkbox" 
        className="peer opacity-0 w-0 h-0" 
        checked={theme === 'dark'}
        onChange={toggleTheme}
      />

      {/* Slider */}
      <span
        className="absolute inset-0 cursor-pointer rounded-[30px] transition duration-500 bg-gray-200 peer-checked:bg-gray-400 dark:bg-[#0a1a44] dark:peer-checked:bg-[#102b6a] before:content-[''] before:absolute before:h-[1.4em] before:w-[1.4em] before:rounded-full before:left-[10%] before:bottom-[15%] before:shadow-[inset_8px_-4px_0px_0px_#fff000] before:bg-gray-200 dark:before:bg-[#0a1a44] before:transition before:duration-500 peer-checked:before:translate-x-full peer-checked:before:shadow-[inset_15px_-4px_0px_15px_#fff000]"
      />
      
      {/* Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun className="w-3 h-3 text-yellow-500" />
        <Moon className="w-3 h-3 text-blue-400" />
      </div>
    </label>
  );
};

export default DarkModeToggle;
