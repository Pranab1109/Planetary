import React, { useState } from 'react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ExampleCard from '../components/ExampleCard';

import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { useRoadmap } from '../context/roadmapContext';
import SplitText from '../Reactbits/SplitText/SplitText';



const DashboardPage = () => {

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [roadmapsError, setRoadmapsError] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated, signIn, signOut, user, token } = useAuth();
  const { createRoadmap, viewRoadmap, viewDashboard } = useRoadmap();
  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };


  const loadingMessages = [
    "Generating your roadmap...",
    "Please wait...",
    "Almost there...",
    "Final preparation..."
  ];
  const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState(0);
  const messageIntervalRef = useRef(null); // Ref to hold the interval ID
  // Effect to cycle through loading messages
  useEffect(() => {
    if (isGenerating) {
      // Clear any existing interval before setting a new one
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      messageIntervalRef.current = setInterval(() => {
        setCurrentLoadingMessageIndex(prevIndex =>
          (prevIndex + 1) % loadingMessages.length
        );
      }, 2000); // Change message every 2 seconds
    } else {
      // Clear interval when not generating
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
      setCurrentLoadingMessageIndex(0); // Reset message index
    }

    // Cleanup function: Clear interval when component unmounts or dependencies change
    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, [isGenerating, loadingMessages.length]);

  const examplePrompts = [
    { title: 'I want to visit Murshidabad, make an itenary for me.', icon: 'fa-solid fa-compass' },
    { title: 'I want to crack DSA interview, prepare a roadmap for me.', icon: 'fa-solid fa-code' },
    { title: 'I want to learn full stack development, how should I start from sratch?', icon: 'fa-regular fa-file-code' },
    { title: 'I want to go on a trek to Tunganath Chandrashila, prepare a planner for me.', icon: 'fa-solid fa-plane-departure' },
  ];


  const handleGenerateRoadmap = async (queryToGenerate) => {
    if (!isAuthenticated) {
      setShowAuthModal(true); // Prompt login if not authenticated
      return;
    }

    if (!queryToGenerate || queryToGenerate.trim() === '') {
      setRoadmapsError('Please enter a query to generate a roadmap.');
      return;
    }

    setIsGenerating(true);
    setRoadmapsError(null);
    setCurrentLoadingMessageIndex(0);

    const tempId = uuidv4();
    console.log("DashboardPage: Generated temporary ID:", tempId);

    try {
      viewRoadmap(tempId);
      console.log("QUEERRYYY TO GENERATE: ", queryToGenerate)
      const newRoadmap = await createRoadmap(queryToGenerate.trim(), tempId);
      setIsGenerating(false);
      setUserQuery('')

      if (newRoadmap && newRoadmap._id) {
        viewRoadmap(newRoadmap._id);
      } else {
        throw new Error("Generated roadmap ID not found in response.");
      }

    } catch (err) {
      console.error('Error generating roadmap:', err.response ? err.response.data : err.message);
      setGenerationError(err.message || 'Failed to generate roadmap. Please try again.');
      setIsGenerating(false);
      viewDashboard()
      if (err.message && (err.message.includes("Authentication required") || err.message.includes("Authentication issue"))) {
        signOut();
        setShowAuthModal(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDownOnInput = (e) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerateRoadmap(userQuery);
    }
  };

  return (
    <div className='main h-full flex-[1] pb-[15vh] relative bg-accent-blue'>
      <Header showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} />
      <div className="main-container p-10 w-full h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center greet text-6xl ">
          <p><span>Hello</span> <span className='text-blue-500'>{user ? user.name : 'User'}</span>,</p>
          <SplitText
            text={`How can I help you today?`}
            className="text-4xl text-gray-400  font-semibold text-center"
            delay={50}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}

          />
        </div>
        <div className="flex items-start space-x-3 w-full mt-20 px-20">
          <div className="flex-grow items-center ">
            <InputField
              type="text"
              placeholder="Type your query here"
              className="pl-5 pr-4 py-2 
                                    rounded-lg
                                    bg-light-bg-tertiary 
                                    border-light-border
                                    text-light-text-primary
                                    placeholder-light-text-secondary
                                    focus:outline-none focus:ring-1 focus:ring-accent-purple w-full"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={handleKeyDownOnInput}
              disabled={isGenerating}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            className="flex-shrink-0 w-28"
            onClick={() => handleGenerateRoadmap(userQuery)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate'}</span>

          </Button>
        </div>
        {generationError && <p className="text-black text-center mt-2">{generationError}</p>}
        {roadmapsError && <p className="text-black text-center mt-2">{roadmapsError}</p>}

        <div className="cards w-full mx-auto max-w-4xl flex flex-wrap justify-center gap-4 pb-8 pt-8">
          {examplePrompts.map((example, index) => (
            <ExampleCard
              key={index}
              title={example.title}
              iconName={example.icon}
              onClick={() => { handleGenerateRoadmap(example.title) }}
              className="card flex-auto w-1/2 md:w-1/4 max-w-[200px]"
            />
          ))}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default DashboardPage;
