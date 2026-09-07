import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'恣优 FlowIn｜让自由成为一种工作方式',description:'面向知识工作者的项目机会发现平台，探索短期、兼职与项目合作机会。'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
