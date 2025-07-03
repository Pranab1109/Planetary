// src/App.jsx
import React, { useEffect, useRef } from 'react'; // Import useRef
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import RoadmapDetailsPage from "./pages/RoadmapDetailsPage";
import { AuthProvider } from './context/AuthContext';
import { RoadmapProvider } from './context/RoadmapContext';


const PlaceholderPage = ({ title }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-light-bg-primary text-light-text-primary text-2xl">
    <div className="w-full p-8">
      <h1 className="text-3xl font-semibold text-light-text-primary">{title} (Under Construction)</h1>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <p>This page is not yet implemented.</p>
    </div>
  </div>
);

function App() {
  const mainContentRef = useRef(null);


  return (
    <Router>
      <AuthProvider>
        <RoadmapProvider>
          <div className="flex h-screen w-full font-inter">
            <Sidebar />
            <div id="main-content-scroll-container" ref={mainContentRef} className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/roadmaps/:id" element={<RoadmapDetailsPage />} />
                <Route path="/roadmaps-list" element={<PlaceholderPage title="My Roadmaps" />} />
                <Route path="/chat" element={<PlaceholderPage title="Chat" />} />
                <Route path="/history" element={<PlaceholderPage title="History" />} />
                <Route path="*" element={<DashboardPage />} />
              </Routes>
            </div>
          </div>
        </RoadmapProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;