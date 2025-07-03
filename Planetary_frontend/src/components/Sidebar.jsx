import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoadmap } from '../context/roadmapContext';



const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const sidebarRef = useRef();
  const measureRef = useRef();
  const newChatTextRef = useRef();
  const hasMounted = useRef(false);
  const { signOut, isAuthenticated } = useAuth();
  const { roadmaps, loading: loadingRoadmaps, error: roadmapsError, fetchRoadmaps, viewDashboard } = useRoadmap();
  const navigate = useNavigate();
  const location = useLocation();


  const pathParts = location.pathname.split('/');
  const currentRoadmapId = location.pathname.startsWith('/roadmaps/') ? pathParts[pathParts.length - 1] : null;
  const isDashboardActive = location.pathname === '/';



  // Measure natural width on toggle
  useEffect(() => {
    if (!sidebarRef.current || !measureRef.current) return;

    // Skip animation on first render
    if (!hasMounted.current) {
      hasMounted.current = true;
      sidebarRef.current.style.width = `${measureRef.current.offsetWidth}px`;
      return;
    }

    // Run GSAP animation on toggle only
    const targetWidth = measureRef.current.offsetWidth;

    gsap.to(sidebarRef.current, {
      width: targetWidth,
      duration: 0.3,
      ease: 'power2.inOut',
    });

    if (newChatTextRef.current) {
      gsap.to(newChatTextRef.current, {
        opacity: extended ? 1 : 0,
        x: extended ? 0 : -10,
        duration: 0.3,
        delay: extended ? 0.1 : 0,
        ease: 'power2.out',
      });
    }
  }, [extended]);


  return (
    <>

      <div
        ref={sidebarRef}
        className={`sidebar h-screen inline-flex flex-col justify-between p-6 overflow-hidden border-2
                    border-gray-50 max-w-2xs`}
        style={{ width: 'fit-content' }}
      >
        <div className="top">
          <p
            className="block ml-2.5 cursor-pointer"
            onClick={() => setExtended((prev) => !prev)}
          >
            <i className="fa-solid fa-bars w-5" />
          </p>

          <div
            className={`relative mt-9 flex items-center gap-2.5 p-2.5 px-3.5 bg-white transition-colors duration-300 hover:bg-gray-200 text-sm rounded-md cursor-pointer overflow-hidden
                        ${isDashboardActive ? 'bg-gray-200' : ''} `}
            onClick={() => navigate('/')}
          >
            <p className="text-xl z-10">
              <i className="fa-solid fa-plus" />
            </p>
            <p
              ref={newChatTextRef}
              className="absolute left-10 opacity-0 whitespace-nowrap"
            >
              New Chat
            </p>
          </div>
          <p className="recent-title mt-7 mb-5 text-sm font-semibold text-gray-700">Recent</p>
          <div className={extended ? "flex-1 overflow-y-scroll mt-4 pr-1" : ""} style={extended ? { maxHeight: "calc(100vh - 260px)" } : {}}>
            {extended && (
              <div className="recent flex flex-col ">
                {loadingRoadmaps ? (
                  <p className="text-sm text-gray-500">Loading roadmaps...</p>
                ) : roadmapsError ? (
                  <p className="text-sm text-red-500">Error: {roadmapsError}</p>
                ) : roadmaps.length > 0 ? (
                  roadmaps.map((item) => (
                    <div
                      key={item._id}
                      className={`recent-entry  flex items-start p-2.5 rounded-md text-gray-800 cursor-pointer hover:bg-gray-200
                                     ${currentRoadmapId === item._id ? 'bg-gray-200 font-semibold' : ''}`}
                      onClick={() => navigate(`/roadmaps/${item._id}`)}
                    >
                      <p className='pr-2'>
                        <i className="fa-solid fa-message" />
                      </p>
                      <p className="truncate">{item.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent items.</p>
                )}
              </div>
            )}
          </div>
        </div>



        {isAuthenticated && <div className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-gray-200 rounded-md" onClick={async () => {
          if (location.pathname !== '/') {
            await navigate('/');
          }
          signOut()
        }}>
          <p>
            <i className="fa-solid fa-right-from-bracket" />
          </p>
          {extended && <p>Logout</p>}
        </div>}
      </div>

      {/* Hidden clone to measure width */}
      <div
        ref={measureRef}
        className={`sidebar pointer-events-none invisible absolute top-0 left-0 z-[-1] min-h-screen inline-flex flex-col justify-between bg-blue-200 p-6 max-w-5xl`}
        style={{
          width: 'fit-content',
          position: 'absolute',
          visibility: 'hidden',
        }}
      >
        <div className="top">
          <div className="mt-9 flex items-center gap-2.5 p-2.5 px-3.5 text-sm">
            <p className="text-xl">
              <i className="fa-solid fa-plus" />
            </p>
            {extended && <p>New Chat</p>}
          </div>
          {extended && (
            <div className="recent flex flex-col">
              <p className="recent-title mt-7 mb-5">Recent</p>
              {roadmaps.map((item) => (
                <div key={item._id} className="recent-entry flex items-start gap-2.5 p-2.5">
                  <i className="fa-solid fa-message" />
                  <p>{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;