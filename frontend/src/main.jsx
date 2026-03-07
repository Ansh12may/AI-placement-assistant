import { StrictMode } from 'react'
 import { createRoot } from 'react-dom/client'
import './index.css';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import App from "./App";
import { ResumeProvider } from "./context/ResumeContext";



createRoot(document.getElementById('root')).render(
<StrictMode>
  <BrowserRouter>
  <ResumeProvider>
      <App/>
    </ResumeProvider>
  </BrowserRouter>
</StrictMode>
 
 
)
