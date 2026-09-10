import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Lancar — Indonesian that sticks',description:'Adaptive Indonesian practice grounded in your lessons'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
