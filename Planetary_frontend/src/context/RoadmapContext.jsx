import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';

const RoadmapContext = createContext();
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper function for deep comparison, ignoring specified keys
const deepEqual = (obj1, obj2, ignoreKeys = []) => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) return false;

  const keys1 = Object.keys(obj1).filter(key => !ignoreKeys.includes(key));
  const keys2 = Object.keys(obj2).filter(key => !ignoreKeys.includes(key));

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key], ignoreKeys)) {
      return false;
    }
  }
  return true;
};

export const RoadmapProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token, signOut } = useAuth();

  const [roadmaps, setRoadmaps] = useState(() => {
    try {
      const storedAuthStatus = localStorage.getItem('isAuthenticated');
      if (storedAuthStatus === 'true') {
        const storedRoadmaps = localStorage.getItem('userRoadmaps');
        return storedRoadmaps ? JSON.parse(storedRoadmaps) : [];
      }
      return [];
    } catch (error) {
      console.error("Failed to parse roadmaps from localStorage in RoadmapContext", error);
      return [];
    }
  });

  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [roadmapsError, setRoadmapsError] = useState(null);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  const [roadmapDetailsCache, setRoadmapDetailsCache] = useState(() => {
    try {
      const storedCache = localStorage.getItem('roadmapDetailsCache');
      return storedCache ? JSON.parse(storedCache) : {};
    } catch (error) {
      console.error("Failed to parse roadmapDetailsCache from localStorage", error);
      return {};
    }
  });

  useEffect(() => {
    // Filter out temporary roadmaps when persisting cache to localStorage
    const persistentCache = Object.fromEntries(
      Object.entries(roadmapDetailsCache).filter(([key, value]) => !value.isTemporary)
    );
    localStorage.setItem('roadmapDetailsCache', JSON.stringify(persistentCache));
  }, [roadmapDetailsCache]);

  useEffect(() => {
    if (isAuthenticated) {
      const persistentRoadmaps = roadmaps.filter(roadmap => !roadmap.isTemporary);
      localStorage.setItem('userRoadmaps', JSON.stringify(persistentRoadmaps));
    } else {
      localStorage.removeItem('userRoadmaps');
      localStorage.removeItem('roadmapDetailsCache');
    }
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [roadmaps, isAuthenticated, setRoadmapDetailsCache]);

  const fetchRoadmaps = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoadingRoadmaps(false);
      setInitialFetchAttempted(true);
      return;
    }

    setLoadingRoadmaps(true);
    setRoadmapsError(null);
    try {
      const response = await axios.get(`${backendUrl}/api/roadmaps/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const fetchedPlans = response.data.data.plans;
      setRoadmaps(prevRoadmaps => {
        const newFetched = fetchedPlans.map(plan => ({ ...plan, isTemporary: false }));
        const existingRealIds = new Set(newFetched.map(p => p._id));
        const filteredPrev = prevRoadmaps.filter(p => p.isTemporary || !existingRealIds.has(p._id));
        return [...newFetched, ...filteredPrev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      setInitialFetchAttempted(true);
    } catch (err) {
      console.error('Error fetching roadmaps for sidebar:', err.response ? err.response.data : err.message);
      setRoadmapsError(err.response?.data?.message || 'Failed to fetch roadmaps.');
      setRoadmaps([]);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.warn("Authentication issue while fetching roadmaps in context. Logging out.");
        signOut();
      }
    } finally {
      setLoadingRoadmaps(false);
    }
  }, [isAuthenticated, token, signOut]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!initialFetchAttempted || roadmapsError) {
        fetchRoadmaps();
      }
    } else {
      setLoadingRoadmaps(false);
      setRoadmaps([]);
      setRoadmapsError(null);
      setInitialFetchAttempted(false);
    }
  }, [isAuthenticated, fetchRoadmaps, loadingRoadmaps]);

  const getRoadmapDetails = useCallback(async (id) => {
    if (!id || !isAuthenticated || !token) {
      console.warn("Attempted to get roadmap details without ID or authentication.");
      return { data: null, loading: false, error: "Authentication required or invalid ID." };
    }

    const cached = roadmapDetailsCache[id];
    if (cached) {
      // If cached and it's a temporary roadmap, DO NOT fetch from backend
      if (cached.isTemporary) {
        console.log(`RoadmapContext: Serving temporary cached roadmap ${id}. NOT fetching from backend.`);
        return { data: cached, loading: true, error: null }; // Set loading true to imply awaiting real data
      }

      // If cached and it's a real roadmap, return immediately and revalidate in background
      console.log(`RoadmapContext: Serving cached roadmap ${id}, revalidating in background.`);
      (async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/roadmaps/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fetchedRoadmap = response.data.data.plan;

          const keysToIgnore = ['createdAt', 'updatedAt'];
          const fetchedForComparison = { ...fetchedRoadmap, isTemporary: false };
          const cachedForComparison = { ...cached, isTemporary: false };

          if (!deepEqual(fetchedForComparison, cachedForComparison, keysToIgnore)) {
            setRoadmapDetailsCache(prev => ({ ...prev, [id]: { ...fetchedRoadmap, isTemporary: false } }));
            console.log(`RoadmapContext: Fresh data for roadmap ${id} fetched and updated.`);
          } else {
            console.log(`RoadmapContext: Roadmap ${id} data unchanged.`);
          }
        } catch (err) {
          console.error(`RoadmapContext: Error revalidating roadmap ${id}:`, err.response?.data?.message || err.message);
        }
      })();
      return { data: cached, loading: false, error: null };
    }

    // If not in cache and not temporary, fetch from API (this would be for direct URL access or fresh load)
    console.log(`RoadmapContext: Roadmap ${id} not in cache, fetching from API.`);
    try {
      const response = await axios.get(`${backendUrl}/api/roadmaps/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedRoadmap = response.data.data.plan;
      setRoadmapDetailsCache(prev => ({ ...prev, [id]: { ...fetchedRoadmap, isTemporary: false } }));
      return { data: { ...fetchedRoadmap, isTemporary: false }, loading: false, error: null };
    } catch (err) {
      console.error(`RoadmapContext: Error fetching roadmap ${id}:`, err.response?.data?.message || err.message);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        signOut();
        return { data: null, loading: false, error: "Authentication required." };
      }
      return { data: null, loading: false, error: err.response?.data?.message || "Failed to load roadmap." };
    }
  }, [isAuthenticated, token, signOut, roadmapDetailsCache]);

  const getCachedRoadmapDetails = useCallback((id) => {
    return roadmapDetailsCache[id] || null;
  }, [roadmapDetailsCache]);

  const createRoadmap = useCallback(async (query, tempId) => {
    if (!isAuthenticated || !token) {
      throw new Error("Authentication required to create roadmap.");
    }
    console.log("QUEERRYYY TO GENERATE: ", query)
    const optimisticRoadmap = {
      _id: tempId,
      title: query,
      description: "Generating your roadmap...",
      tasks_list: [],
      isTemporary: true,
      createdAt: new Date().toISOString(),
    };

    // Add optimistic roadmap to cache and main roadmaps list immediately
    setRoadmapDetailsCache(prevCache => ({ ...prevCache, [tempId]: optimisticRoadmap }));
    setRoadmaps(prevRoadmaps => [optimisticRoadmap, ...prevRoadmaps]);
    console.log("RoadmapContext: Optimistically added temporary roadmap:", optimisticRoadmap);

    try {
      const response = await axios.post(`${backendUrl}/api/roadmap`, { query }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let newRoadmap = null;
      if (response.data && typeof response.data === 'object') {
        if (response.data.data && typeof response.data.data === 'object') {
          if (response.data.data.plan) {
            newRoadmap = response.data.data.plan;
          } else if (Array.isArray(response.data.data.plans) && response.data.data.plans.length > 0) {
            newRoadmap = response.data.data.plans[0];
          }
        } else if (response.data.plan) {
          newRoadmap = response.data.plan;
        } else if (response.data._id) {
          newRoadmap = response.data;
        }
      }

      if (!newRoadmap || !newRoadmap._id || typeof newRoadmap._id !== 'string') {
        console.error("RoadmapContext: Backend response for new roadmap missing valid _id or invalid structure:", response.data);
        throw new Error("Invalid roadmap data received from server. Missing or invalid ID."); //
      }
      console.log("RoadmapContext: API returned real new roadmap (extracted):", newRoadmap);

      // Update cache: remove temporary entry and add real entry
      setRoadmapDetailsCache(prevCache => {
        const newCache = { ...prevCache };
        delete newCache[tempId]; // Remove the temporary entry
        newCache[newRoadmap._id] = { ...newRoadmap, isTemporary: false }; // Add the real entry, mark as not temporary
        return newCache;
      });

      // Update main roadmaps list: replace temporary with real
      setRoadmaps(prevRoadmaps => {
        return prevRoadmaps.map(roadmap =>
          roadmap._id === tempId ? { ...newRoadmap, isTemporary: false } : roadmap
        ).filter(Boolean) // Added filter(Boolean) to defensive remove any undefined/null entries
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });


      return { ...newRoadmap, isTemporary: false }; // Return the real roadmap object
    } catch (err) {
      console.error('Error creating roadmap:', err.response ? err.response.data : err.message);
      // Clean up optimistic entries on error
      setRoadmapDetailsCache(prevCache => {
        const newCache = { ...prevCache };
        delete newCache[tempId];
        return newCache;
      });
      setRoadmaps(prevRoadmaps => prevRoadmaps.filter(r => r._id !== tempId));

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        signOut();
      }
      throw new Error(err.response?.data?.message || 'Failed to create roadmap.');
    }
  }, [isAuthenticated, token, signOut, setRoadmaps, setRoadmapDetailsCache]);


  const deleteRoadmap = useCallback(async (idToDelete) => {
    if (!isAuthenticated || !token || !idToDelete) {
      throw new Error("Authentication required or invalid ID to delete roadmap.");
    }

    try {
      // Optimistically remove the roadmap from local state for immediate UI feedback
      setRoadmaps(prevRoadmaps => prevRoadmaps.filter(roadmap => roadmap._id !== idToDelete));
      setRoadmapDetailsCache(prevCache => {
        const newCache = { ...prevCache };
        delete newCache[idToDelete];
        return newCache;
      });

      // If the deleted roadmap was the currently active one, navigate to dashboard
      if (location.pathname === `/roadmaps/${idToDelete}`) {
        await navigate('/');
      }

      const response = await axios.delete(`${backendUrl}/api/roadmaps/${idToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response)

      if (response.status !== 204) {
        // If deletion fails on backend, consider re-adding to state or fetching fresh list
        console.error(`Failed to delete roadmap ${idToDelete} from backend:`, response.data);
        throw new Error(response.data.message || "Failed to delete roadmap.");
      }
      console.log(`Roadmap ${idToDelete} successfully deleted from backend.`);
    } catch (err) {
      console.error('Error deleting roadmap:', err.response ? err.response.data : err.message);
      fetchRoadmaps();
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        signOut();
      }
      throw new Error(err.response?.data?.message || 'Failed to delete roadmap.');
    }
  }, [isAuthenticated, token, signOut, setRoadmaps, setRoadmapDetailsCache, navigate, location.pathname, fetchRoadmaps]);


  const updateRoadmap = useCallback(async (idToUpdate, updatedRoadmap) => {
    if (!isAuthenticated || !token || !idToUpdate || !updatedRoadmap) {
      throw new Error("Authentication required or invalid data to update roadmap.");
    }

    // Optimistic UI update: update local state immediately
    setRoadmaps(prevRoadmaps =>
      prevRoadmaps.map(roadmap =>
        roadmap._id === idToUpdate ? { ...updatedRoadmap, isTemporary: false } : roadmap
      )
    );
    setRoadmapDetailsCache(prevCache => ({
      ...prevCache,
      [idToUpdate]: { ...updatedRoadmap, isTemporary: false }
    }));
    console.log(`RoadmapContext: Optimistically updated roadmap ${idToUpdate}.`);

    try {
      const response = await axios.put(`${backendUrl}/api/roadmaps/${idToUpdate}`, updatedRoadmap, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Backend should return the updated roadmap. Use it to ensure consistency.
      let fetchedUpdatedRoadmap = null;
      if (response.data && response.data.data && response.data.data.plan) {
        fetchedUpdatedRoadmap = response.data.data.plan;
      } else if (response.data && response.data.plan) {
        fetchedUpdatedRoadmap = response.data.plan;
      } else {
        fetchedUpdatedRoadmap = response.data;
      }


      if (!fetchedUpdatedRoadmap || !fetchedUpdatedRoadmap._id) {
        console.error("RoadmapContext: Backend response for update missing valid _id or structure:", response.data);
        throw new Error("Invalid roadmap data received after update.");
      }

      // Final update with data from backend to ensure consistency
      setRoadmaps(prevRoadmaps =>
        prevRoadmaps.map(roadmap =>
          roadmap._id === idToUpdate ? { ...fetchedUpdatedRoadmap, isTemporary: false } : roadmap
        )
      );
      setRoadmapDetailsCache(prevCache => ({
        ...prevCache,
        [idToUpdate]: { ...fetchedUpdatedRoadmap, isTemporary: false }
      }));
      console.log(`RoadmapContext: Roadmap ${idToUpdate} successfully updated on backend and state confirmed.`);

      return { ...fetchedUpdatedRoadmap, isTemporary: false }; // Return the confirmed updated roadmap

    } catch (err) {
      console.error('Error updating roadmap:', err.response ? err.response.data : err.message);
      fetchRoadmaps(); // Re-fetch all roadmaps to revert to server state
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        signOut();
      }
      throw new Error(err.response?.data?.message || 'Failed to update roadmap.');
    }
  }, [isAuthenticated, token, signOut, setRoadmaps, setRoadmapDetailsCache, fetchRoadmaps]);


  const viewDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const viewRoadmap = useCallback((id) => {
    navigate(`/roadmaps/${id}`);
  }, [navigate]);

  const pathParts = location.pathname.split('/');
  const activeRoadmapId = location.pathname.startsWith('/roadmaps/') ? pathParts[pathParts.length - 1] : null;
  const isDashboardActive = location.pathname === '/';

  const value = {
    roadmaps,
    loadingRoadmaps,
    roadmapsError,
    fetchRoadmaps,
    createRoadmap,
    viewDashboard,
    getRoadmapDetails,
    getCachedRoadmapDetails,
    viewRoadmap,
    activeRoadmapId,
    isDashboardActive,
    deleteRoadmap,
    updateRoadmap
  };

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
};

export const useRoadmap = () => useContext(RoadmapContext);