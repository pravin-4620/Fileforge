import { createContext, useContext, useEffect, useState } from 'react'
const ThemeContext=createContext(null)
export function ThemeProvider({children}){ const [dark,setDark]=useState(()=>localStorage.getItem('fileforge_theme')==='dark'); useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('fileforge_theme',dark?'dark':'light')},[dark]); return <ThemeContext.Provider value={{dark,toggle:()=>setDark(x=>!x)}}>{children}</ThemeContext.Provider> }
export const useTheme=()=>useContext(ThemeContext)
