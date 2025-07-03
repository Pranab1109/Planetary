import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import AuthModal from '../components/AuthModal';
import Header from '../components/Header';
import RoadmapCardSkeleton from '../components/RoadmapCardSkeleton';
import Button from '../components/Button';
import { useRoadmap } from '../context/roadmapContext';
import { v4 as uuidv4 } from 'uuid';

const RoadmapDetailsPage = () => {
  const { id } = useParams();
  const { getRoadmapDetails, getCachedRoadmapDetails, deleteRoadmap, roadmaps, updateRoadmap } = useRoadmap();
  const { isAuthenticated, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const latestRoadmapRef = useRef(roadmap);
  useEffect(() => {
    latestRoadmapRef.current = roadmap;
  }, [roadmap]);


  const [hoveredTaskIndex, setHoveredTaskIndex] = useState(null);
  const [showAddTaskInput, setShowAddTaskInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const newTaskInputRef = useRef(null);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const newTaskDescriptionInputRef = useRef(null);


  const handleToggleTask = useCallback(async (taskId) => {
    if (!latestRoadmapRef.current) return;
    const currentRoadmap = latestRoadmapRef.current;

    const updatedTasks = currentRoadmap.tasks_list.map(task =>
      task._id === taskId ? { ...task, completed: !task.completed } : task
    );

    const allTasksCompleted = updatedTasks.every(task => task.completed);
    const optimisticRoadmap = { ...currentRoadmap, tasks_list: updatedTasks, completed: allTasksCompleted };

    setRoadmap(optimisticRoadmap);

    try {
      const resultRoadmap = await updateRoadmap(currentRoadmap._id, optimisticRoadmap);
      setRoadmap(resultRoadmap);
      console.log('Task toggled successfully and backend updated.');
    } catch (err) {
      console.error('Error toggling task:', err.message);
      alert(`Failed to toggle task: ${err.message}. Reverting changes.`);
      setRoadmap(currentRoadmap);
    }
  }, [updateRoadmap]);

  const handleToggleSubTask = useCallback(async (taskId, subTaskId) => {
    if (!latestRoadmapRef.current) return;
    const currentRoadmap = latestRoadmapRef.current;

    const updatedTasks = currentRoadmap.tasks_list.map(task => {
      if (task._id === taskId) {
        const updatedSubTasks = task.sub_tasks.map(subTask =>
          subTask._id === subTaskId ? { ...subTask, completed: !subTask.completed } : subTask
        );
        const allSubTasksCompleted = updatedSubTasks.every(st => st.completed);
        return { ...task, sub_tasks: updatedSubTasks, completed: allSubTasksCompleted };
      }
      return task;
    });

    const allTasksCompleted = updatedTasks.every(task => task.completed);
    const optimisticRoadmap = { ...currentRoadmap, tasks_list: updatedTasks, completed: allTasksCompleted };

    setRoadmap(optimisticRoadmap);

    try {
      const resultRoadmap = await updateRoadmap(currentRoadmap._id, optimisticRoadmap);
      setRoadmap(resultRoadmap);
      console.log('Sub-task toggled successfully and backend updated.');
    } catch (err) {
      console.error('Error toggling sub-task:', err.message);
      alert(`Failed to toggle sub-task: ${err.message}. Reverting changes.`);
      setRoadmap(currentRoadmap);
    }
  }, [updateRoadmap]);

  const handleUpdateTask = useCallback(async (taskId, updates) => {
    if (!latestRoadmapRef.current) return;
    const currentRoadmap = latestRoadmapRef.current;

    const updatedTasks = currentRoadmap.tasks_list.map(task =>
      task._id === taskId ? { ...task, ...updates } : task
    );

    const allTasksCompleted = updatedTasks.every(task => task.completed);
    const optimisticRoadmap = { ...currentRoadmap, tasks_list: updatedTasks, completed: allTasksCompleted };

    setRoadmap(optimisticRoadmap);

    try {
      const resultRoadmap = await updateRoadmap(currentRoadmap._id, optimisticRoadmap);
      setRoadmap(resultRoadmap);
      console.log('Task updated successfully and backend updated.');
    } catch (err) {
      console.error('Error updating task:', err.message);
      alert(`Failed to update task: ${err.message}. Reverting changes.`);
      setRoadmap(currentRoadmap);
    }
  }, [updateRoadmap]);

  const handleUpdateSubTask = useCallback(async (taskId, subTaskId, updates) => {
    if (!latestRoadmapRef.current) return;
    const currentRoadmap = latestRoadmapRef.current;

    const updatedTasks = currentRoadmap.tasks_list.map(task => {
      if (task._id === taskId) {
        const updatedSubTasks = task.sub_tasks.map(subTask =>
          subTask._id === subTaskId ? { ...subTask, ...updates } : subTask
        );
        const allSubTasksCompleted = updatedSubTasks.every(st => st.completed);
        return { ...task, sub_tasks: updatedSubTasks, completed: allSubTasksCompleted };
      }
      return task;
    });

    const allTasksCompleted = updatedTasks.every(task => task.completed);
    const optimisticRoadmap = { ...currentRoadmap, tasks_list: updatedTasks, completed: allTasksCompleted };

    setRoadmap(optimisticRoadmap);

    try {
      const resultRoadmap = await updateRoadmap(currentRoadmap._id, optimisticRoadmap);
      setRoadmap(resultRoadmap);
      console.log('Sub-task updated successfully and backend updated.');
    } catch (err) {
      console.error('Error updating sub-task:', err.message);
      alert(`Failed to update sub-task: ${err.message}. Reverting changes.`);
      setRoadmap(currentRoadmap);
    }
  }, [updateRoadmap]);


  const handleAddSubTask = useCallback(async (taskId, insertIndex, newSubtaskTitle, newSubtaskDescription) => {
    if (!latestRoadmapRef.current) return;
    const currentRoadmap = latestRoadmapRef.current;

    const clientTempSubtaskId = uuidv4();


    const optimisticTasks = currentRoadmap.tasks_list.map(task => {
      if (task._id === taskId) {
        const newSubtask = {
          _id: clientTempSubtaskId,
          action_title: newSubtaskTitle,
          action_description: newSubtaskDescription,
          completed: false,
          isNew: true
        };
        const updatedSubTasks = [...task.sub_tasks];
        updatedSubTasks.splice(insertIndex, 0, newSubtask);
        const allSubTasksCompleted = updatedSubTasks.every(st => st.completed);
        return { ...task, sub_tasks: updatedSubTasks, completed: allSubTasksCompleted };
      }
      return task;
    });

    const optimisticRoadmap = {
      ...currentRoadmap,
      tasks_list: optimisticTasks,
      completed: optimisticTasks.every(task => task.completed)
    };

    setRoadmap(optimisticRoadmap);

    try {
      const payloadTasks = optimisticTasks.map(task => ({
        ...task,
        sub_tasks: task.sub_tasks.map(subtask => {
          if (subtask._id === clientTempSubtaskId && subtask.isNew) {
            const { _id, isNew, ...rest } = subtask;
            return rest;
          }
          return subtask;
        })
      }));
      const payloadRoadmap = { ...optimisticRoadmap, tasks_list: payloadTasks };

      const resultRoadmap = await updateRoadmap(currentRoadmap._id, payloadRoadmap);
      setRoadmap(resultRoadmap);
      console.log('Sub-task added successfully and backend updated.');
    } catch (err) {
      console.error('Error adding sub-task:', err.message);
      alert(`Failed to add sub-task: ${err.message}. Reverting changes.`);
      setRoadmap(currentRoadmap);
    }
  }, [updateRoadmap]);

  const handleMouseEnterTaskSeparator = useCallback((index) => {
    setHoveredTaskIndex(index);
  }, []);

  const handleMouseLeaveTaskSeparator = useCallback(() => {
    if (!showAddTaskInput) {
      setHoveredTaskIndex(null);
    }
  }, [showAddTaskInput]);

  const handleAddTaskClick = useCallback((index) => {
    setShowAddTaskInput(true);
    setHoveredTaskIndex(index);
    setTimeout(() => {
      newTaskInputRef.current?.focus();
    }, 0);
  }, []);

  const handleNewTaskTitleChange = useCallback((e) => {
    setNewTaskTitle(e.target.value);
  }, []);

  const handleNewTaskDescriptionChange = useCallback((e) => {
    setNewTaskDescription(e.target.value);
  }, []);

  const handleNewTaskSubmit = useCallback(async () => {
    if (!latestRoadmapRef.current) return;
    const currentRoadmap = latestRoadmapRef.current;

    if (newTaskTitle.trim() && newTaskDescription.trim()) {
      const clientTempTaskId = uuidv4();

      const newTask = {
        _id: clientTempTaskId,
        title: newTaskTitle.trim(),
        task_description: newTaskDescription.trim(),
        completed: false,
        sub_tasks: [],
        isNew: true
      };

      const optimisticTasks = [...currentRoadmap.tasks_list];
      optimisticTasks.splice(hoveredTaskIndex, 0, newTask);

      const optimisticRoadmap = {
        ...currentRoadmap,
        tasks_list: optimisticTasks,
        completed: optimisticTasks.every(task => task.completed)
      };

      setRoadmap(optimisticRoadmap);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowAddTaskInput(false);
      setHoveredTaskIndex(null);

      try {
        const payloadTasks = optimisticTasks.map(task => {
          if (task._id === clientTempTaskId && task.isNew) {
            const { _id, isNew, ...rest } = task;
            return rest;
          }
          return task;
        });
        const payloadRoadmap = { ...optimisticRoadmap, tasks_list: payloadTasks };

        const resultRoadmap = await updateRoadmap(currentRoadmap._id, payloadRoadmap);
        setRoadmap(resultRoadmap);
        console.log('Main task added successfully and backend updated.');
      } catch (err) {
        console.error('Error adding main task:', err.message);
        alert(`Failed to add task: ${err.message}. Reverting changes.`);
        setRoadmap(currentRoadmap);
      }
    } else {

      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowAddTaskInput(false);
      setHoveredTaskIndex(null);
    }
  }, [newTaskTitle, newTaskDescription, hoveredTaskIndex, updateRoadmap]);

  const handleNewTaskKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (e.target === newTaskInputRef.current) {
        newTaskDescriptionInputRef.current?.focus();
      } else {
        handleNewTaskSubmit();
      }
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowAddTaskInput(false);
      setHoveredTaskIndex(null);
    }
  }, [handleNewTaskSubmit]);


  useEffect(() => {
    let isMounted = true;
    setError(null);

    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const isRoadmapStillInList = roadmaps.some(roadmapItem => roadmapItem._id === id);

    const loadRoadmap = async () => {
      setIsLoading(true);

      const cached = getCachedRoadmapDetails(id);
      if (cached) {
        const roadmapWithStatus = {
          ...cached,
          tasks_list: (cached.tasks_list || []).map(task => ({
            ...task,
            completed: task.hasOwnProperty('completed') ? task.completed : false,
            sub_tasks: (task.sub_tasks || []).map(subTask => ({
              ...subTask,
              completed: subTask.hasOwnProperty('completed') ? subTask.completed : false,
            }))
          }))
        };
        roadmapWithStatus.completed = roadmapWithStatus.tasks_list.every(task => task.completed);

        if (!isMounted) return;
        setRoadmap(roadmapWithStatus);
        setIsLoading(false);

        if (roadmapWithStatus.isTemporary) return;
      } else {
        setIsLoading(true);
      }

      if (id.includes('temp') && !cached) {
        setIsLoading(false);
        setRoadmap({});
        return;
      }

      const result = await getRoadmapDetails(id);
      if (!isMounted) return;

      if (result.error) {
        setError(result.error);
        setRoadmap(null);
        setIsLoading(false);
        if (!isAuthenticated) setShowAuthModal(true);
        return;
      }

      if (result.data) {
        const fullRoadmap = {
          ...result.data,
          tasks_list: (result.data.tasks_list || []).map(task => ({
            ...task,
            completed: task.hasOwnProperty('completed') ? task.completed : false,
            sub_tasks: (task.sub_tasks || []).map(subTask => ({
              ...subTask,
              completed: subTask.hasOwnProperty('completed') ? subTask.completed : false,
            }))
          }))
        };
        fullRoadmap.completed = fullRoadmap.tasks_list.every(task => task.completed);

        setRoadmap(fullRoadmap);
        setIsLoading(false);
      } else if (!cached) {
        setRoadmap(null);
        setError("Roadmap not found or could not be loaded.");
        setIsLoading(false);
      }
    };

    if (id && (isRoadmapStillInList || (roadmap && roadmap.isTemporary && roadmap._id === id) || id.includes("temp"))) {
      loadRoadmap();
    } else if (!id) {
      navigate('/');
    }

    return () => {
      isMounted = false;
    };
  }, [id, getRoadmapDetails, getCachedRoadmapDetails, isAuthenticated, signOut, roadmaps, navigate]);


  const handleDeleteCurrentRoadmap = async () => {
    if (!roadmap || !roadmap._id) {
      alert("No roadmap to delete.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${roadmap.title}"? This action cannot be undone.`)) {
      try {
        await deleteRoadmap(roadmap._id);
        alert("Roadmap deleted successfully!");
        navigate('/dashboard');
      } catch (error) {
        console.error("Error deleting roadmap:", error);
        alert(`Failed to delete roadmap: ${error.message || "Unknown error"}`);
      }
    }
  };

  const displayTitle = (roadmap && roadmap.isTemporary) ? roadmap.title : (isLoading ? "Loading Roadmap..." : roadmap?.title || "Roadmap Not Found");
  const displayDescription = (roadmap && roadmap.isTemporary) ? roadmap.description : (isLoading ? "Generating your detailed roadmap..." : roadmap?.description || "");

  return (
    <div className="detail-page flex-1 flex flex-col bg-light-bg-primary h-auto min-h-full">
      <Header showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} />
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-start">
          <h1 className="text-4xl font-bold text-light-text-primary mb-4">{displayTitle}</h1>
          <Button
            variant="primary"
            size="md"
            className="ml-4 p-2 rounded-full hover:bg-black text-gray-600 hover:text-white focus:outline-none flex-shrink-0 w-28"
            onClick={handleDeleteCurrentRoadmap}
            title="Delete This Roadmap"
          >
            <i className="fa-solid fa-trash-can text-sm mr-2" />
            <span className='font-bold'>Delete</span>
          </Button>
        </div>
        <p className="text-light-text-secondary mb-6 text-lg">{displayDescription}</p>

        {(isLoading && !roadmap && !error) || (roadmap && roadmap.isTemporary && roadmap.tasks_list?.length === 0) ? (
          <div className="space-y-6">
            <RoadmapCardSkeleton />
            <RoadmapCardSkeleton />
            <RoadmapCardSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-red-500 min-h-[200px]">
            <span className="text-4xl mb-2">❌</span>
            <p className="mt-4 text-lg">Error: {error.message || error}</p>
            <p className="text-sm text-light-text-secondary">Please try again or go back to dashboard.</p>
          </div>
        ) : !roadmap ? (
          <div className="flex flex-col items-center justify-center bg-light-bg-primary text-light-text-primary min-h-[200px]">
            <span className="text-4xl mb-2">ℹ️</span>
            <p className="mt-4 text-lg">Roadmap not found or could not be loaded.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-light-text-primary mb-4">Tasks:</h2>
            <div className="space-y-6">
              {roadmap.tasks_list && roadmap.tasks_list.length > 0 ? (
                roadmap.tasks_list.map((task, index) => (
                  <React.Fragment key={task._id || index}>
                    {hoveredTaskIndex === index && showAddTaskInput && (
                      <div className="task-add-placeholder visible flex flex-col bg-gray-100/70 p-3 rounded-lg mb-4 ">
                        <input
                          ref={newTaskInputRef}
                          type="text"
                          placeholder="New task title"
                          value={newTaskTitle}
                          onChange={handleNewTaskTitleChange}
                          onKeyDown={handleNewTaskKeyDown}
                          className="flex-1 px-1 py-1 border-b-2 border-black focus:outline-none bg-transparent text-md mb-2"
                        />
                        <input
                          ref={newTaskDescriptionInputRef}
                          type="text"
                          placeholder="New task description"
                          value={newTaskDescription}
                          onChange={handleNewTaskDescriptionChange}
                          onKeyDown={handleNewTaskKeyDown}
                          onBlur={handleNewTaskSubmit}
                          className="flex-1 px-1 py-1 border-b-2 border-black focus:outline-none bg-transparent text-md"
                        />
                        <button onClick={handleNewTaskSubmit} className="mt-3 text-gray-500 hover:text-black text-3xl font-bold">
                          +
                        </button>
                      </div>
                    )}
                    <div
                      onMouseEnter={() => handleMouseEnterTaskSeparator(index)}
                      onMouseLeave={handleMouseLeaveTaskSeparator}
                      className="relative"
                    >
                      <TaskCard
                        key={task._id}
                        task={task}
                        index={index}
                        onToggleTask={handleToggleTask}
                        onToggleSubTask={handleToggleSubTask}
                        onUpdateTask={handleUpdateTask}
                        onUpdateSubTask={handleUpdateSubTask}
                        onAddSubTask={handleAddSubTask}
                      />

                      {(hoveredTaskIndex === index && !showAddTaskInput) && (
                        <button
                          onClick={() => handleAddTaskClick(index)}
                          className="absolute -top-4 left-1/2"
                          style={{ display: 'block' }}
                          aria-label="Add new task above"
                        >
                          <span className="text-xl font-bold absolute -top-4 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-gray-700 text-white shadow hover:bg-black transition-colors z-10 w-8 h-8 flex items-center justify-center"
                            aria-label="Add new task"
                          >+</span>
                        </button>
                      )}
                    </div>
                  </React.Fragment>
                ))
              ) : (
                // This section is for when there are NO tasks at all
                <p className="text-gray-500">No tasks found for this roadmap. This might be a very simple roadmap or an error occurred during generation.</p>
              )}

              {roadmap.tasks_list && (roadmap.tasks_list.length === 0 || hoveredTaskIndex === roadmap.tasks_list.length) && showAddTaskInput && (
                <div className="task-add-placeholder visible flex flex-col bg-gray-100/70 p-3 rounded-lg mt-6">
                  <input
                    ref={newTaskInputRef}
                    type="text"
                    placeholder="New task title"
                    value={newTaskTitle}
                    onChange={handleNewTaskTitleChange}
                    onKeyDown={handleNewTaskKeyDown}
                    className="flex-1 px-1 py-1 border-b-2 border-black focus:outline-none bg-transparent text-md mb-2"
                  />
                  <input
                    ref={newTaskDescriptionInputRef}
                    type="text"
                    placeholder="New task description"
                    value={newTaskDescription}
                    onChange={handleNewTaskDescriptionChange}
                    onKeyDown={handleNewTaskKeyDown}
                    onBlur={handleNewTaskSubmit}
                    className="flex-1 px-1 py-1 border-b-2 border-black focus:outline-none bg-transparent text-md"
                  />
                  <button onClick={handleNewTaskSubmit} className=" mt-3 text-gray-500 hover:text-black text-2xl font-bold">
                    +
                  </button>
                </div>
              )}
              {/* Always show a '+' at the bottom to add a new task if list is empty or to append */}
              <div
                onMouseEnter={() => handleMouseEnterTaskSeparator(roadmap.tasks_list ? roadmap.tasks_list.length : 0)}
                onMouseLeave={handleMouseLeaveTaskSeparator}
                onClick={() => handleAddTaskClick(roadmap.tasks_list ? roadmap.tasks_list.length : 0)}
                className="py-4 flex items-center justify-center border-t border-dashed border-gray-300 mt-6 cursor-pointer text-gray-500 hover:text-black transition-colors relative"
              >
                {(!showAddTaskInput) && (
                  <span className="text-xl font-bold absolute -top-4 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-gray-700 text-white shadow hover:bg-black transition-colors z-10 w-8 h-8 flex items-center justify-center"
                    aria-label="Add new task"
                  >+</span>
                )}

              </div>
            </div>
          </>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default RoadmapDetailsPage;