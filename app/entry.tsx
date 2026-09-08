import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from './page';
import Community from './community';
import './globals.css';
const community=new URLSearchParams(window.location.search).get('page')==='community';
document.title=community?'人才社区 · 恣优 FlowIn':'恣优 FlowIn · 项目机会发现平台';
createRoot(document.getElementById('root')!).render(community?<Community/>:<Home/>);
