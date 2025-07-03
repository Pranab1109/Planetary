import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

const TaskCard = forwardRef(({ task, onToggleTask, onToggleSubTask, onUpdateTask, onUpdateSubTask, onAddSubTask, className, index }, refFromParent) => {
  const localRef = useRef(null);
  const finalRef = refFromParent || localRef;
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTaskTitle, setEditedTaskTitle] = useState(task.title);
  const taskTitleInputRef = useRef(null)

  const [hoveredSubtaskIndex, setHoveredSubtaskIndex] = useState(null);
  const [showAddSubtaskInput, setShowAddSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
  const newSubtaskTitleInputRef = useRef(null);
  const newSubtaskDescInputRef = useRef(null);

  const [editingSubtask, setEditingSubtask] = useState({ id: null, title: '' });
  const subtaskInputRefs = useRef({});
  useEffect(() => {
    if (isEditingTask) {
      taskTitleInputRef.current?.focus();
    }
  }, [isEditingTask]);
  useEffect(() => {
    if (task.isNew && isEditingTask) {
      taskTitleInputRef.current?.focus();
    }
  }, [task.isNew, isEditingTask]);

  const handleTaskTitleClick = () => {
    setIsEditingTask(true);
  };

  const handleTaskTitleChange = (e) => {
    setEditedTaskTitle(e.target.value);
  };

  const handleTaskTitleBlur = () => {
    if (editedTaskTitle.trim() !== task.title) {
      onUpdateTask(task._id, { title: editedTaskTitle.trim() });
    }
    setIsEditingTask(false);
  };
  const handleTaskTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTaskTitleBlur();
    } else if (e.key === 'Escape') {
      setEditedTaskTitle(task.title);
      setIsEditingTask(false);
    }
  };

  const handleSubtaskTitleClick = (subtask) => {
    setEditingSubtask({ id: subtask._id, title: subtask.action_title });
    setTimeout(() => {
      if (subtaskInputRefs.current[subtask._id]) {
        subtaskInputRefs.current[subtask._id].focus();
      }
    }, 0);
  };

  const handleSubtaskTitleChange = (e, subtaskId) => {
    setEditingSubtask(prev => ({ ...prev, title: e.target.value }));
  };

  const handleSubtaskTitleBlur = (subtaskId, originalTitle) => {
    if (editingSubtask.title.trim() !== originalTitle) {
      onUpdateSubTask(task._id, subtaskId, { title: editingSubtask.title.trim() });
    }
    setEditingSubtask({ id: null, title: '' });
  };

  const handleSubtaskTitleKeyDown = (e, subtaskId, originalTitle) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubtaskTitleBlur(subtaskId, originalTitle);
    } else if (e.key === 'Escape') {
      setEditingSubtask({ id: null, title: '' });
    }
  };

  const handleMouseEnterSubtaskSeparator = (index) => {
    setHoveredSubtaskIndex(index);
  };

  const handleMouseLeaveSubtaskSeparator = () => {
    if (!showAddSubtaskInput) {
      setHoveredSubtaskIndex(null);
    }
  };

  const handleAddSubtaskClick = (index) => {
    setShowAddSubtaskInput(true);
    setHoveredSubtaskIndex(index);
    setTimeout(() => {
      newSubtaskTitleInputRef.current?.focus();
    }, 0);
  };

  const handleNewSubtaskTitleChange = (e) => {
    setNewSubtaskTitle(e.target.value);
  };

  const handleNewSubtaskDescChange = (e) => {
    setNewSubtaskDescription(e.target.value);
  };

  const handleNewSubtaskSubmit = () => {
    if (newSubtaskTitle.trim() && newSubtaskDescription.trim()) {
      onAddSubTask(task._id, hoveredSubtaskIndex, newSubtaskTitle.trim(), newSubtaskDescription.trim());
      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setShowAddSubtaskInput(false);
      setHoveredSubtaskIndex(null);
    } else {
      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setShowAddSubtaskInput(false);
      setHoveredSubtaskIndex(null);
    }
  };

  const handleNewSubtaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewSubtaskSubmit();
    } else if (e.key === 'Escape') {
      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setShowAddSubtaskInput(false);
      setHoveredSubtaskIndex(null);
    }
  };


  useEffect(() => {
    const el = finalRef.current;
    if (!el) return;

    // Add the class initially to keep it hidden
    el.classList.add('task-card-hidden-initial');


    let r1, r2;

    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        // Animate and remove the hidden class
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            delay: index / 15,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            onStart: () => el.classList.remove('task-card-hidden-initial'),
          }
        );
      });
    });

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      gsap.killTweensOf(el);
    };
  }, [finalRef]);


  return (
    <div
      ref={finalRef}
      className={`bg-light-bg-secondary/70 rounded-lg p-6 shadow-md border transition-shadow duration-200 border-gray-200 backdrop-blur-md hover:-translate-y-1 hover:shadow-lg ${className || ''}`}
    >
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleTask(task._id)}
          className="mr-3 h-5 w-5 rounded cursor-pointer accent-black align-middle"
        />

        {isEditingTask ? (
          <input
            ref={taskTitleInputRef}
            type="text"
            value={editedTaskTitle}
            onChange={handleTaskTitleChange}
            onBlur={handleTaskTitleBlur}
            onKeyDown={handleTaskTitleKeyDown}
            className="text-xl font-semibold text-gray-800 flex-1 px-2 py-1 border-b-2 border-black focus:outline-none"
          />
        ) : (
          <h3
            className={`text-xl font-semibold text-gray-750 flex-1 cursor-pointer hover:text-black ${task.completed ? 'line-through text-gray-500' : ''}`}
            onDoubleClick={handleTaskTitleClick}
          >
            {editedTaskTitle}
          </h3>
        )}      </div>
      <p className="text-light-text-secondary mb-3">{task.task_description}</p>


      {task.sub_tasks && task.sub_tasks.length > 0 && (
        <div className="ml-6 border-l pl-4 border-gray-300 space-y-2 ">
          <h4 className="text-lg font-medium text-light-text-primary mb-2">Actions:</h4>
          {task.sub_tasks.map((subTask, subTaskIndex) => (
            <React.Fragment key={subTask._id || subTaskIndex}>

              <div className="w-full self-center cursor-pointer right-0 relative h-1"
                onMouseEnter={() => handleMouseEnterSubtaskSeparator(subTaskIndex)}
                onMouseLeave={handleMouseLeaveSubtaskSeparator}
              >

                {(hoveredSubtaskIndex === subTaskIndex && !showAddSubtaskInput) && (
                  <button
                    onClick={() => handleAddSubtaskClick(subTaskIndex)}
                    className="absolute inset-0 flex items-center justify-center text-gray-400 hover:font-bold hover:text-black transition-colors text-lg font-bold cursor-pointer"
                  >
                    +
                  </button>
                )}
              </div>
              {subTaskIndex === hoveredSubtaskIndex && showAddSubtaskInput && (
                <div className="subtask-add-placeholder visible flex items-center py-1">
                  <div className="flex flex-col w-full">

                    <input
                      ref={newSubtaskTitleInputRef}
                      type="text"
                      placeholder="New subtask title"
                      value={newSubtaskTitle}
                      onChange={handleNewSubtaskTitleChange}
                      onKeyDown={handleNewSubtaskKeyDown}
                      // onBlur={handleNewSubtaskSubmit}
                      className="flex-1 px-2 py-1 border-b-2 border-black focus:outline-none text-sm"
                    />
                    <input
                      ref={newSubtaskDescInputRef}
                      type="text"
                      placeholder="New subtask description"
                      value={newSubtaskDescription}
                      onChange={handleNewSubtaskDescChange}
                      onKeyDown={handleNewSubtaskKeyDown}
                      onBlur={handleNewSubtaskSubmit}
                      className="flex-1 px-2 py-1 border-b-2 border-black focus:outline-none text-sm"
                    />
                  </div>
                  <button onClick={handleNewSubtaskSubmit} className="ml-2 text-black hover:font-bold text-lg ">
                    +
                  </button>
                </div>
              )}

              <div
                onMouseEnter={() => handleMouseEnterSubtaskSeparator(subTaskIndex)}
                onMouseLeave={handleMouseLeaveSubtaskSeparator}
                onClick={() => onToggleSubTask(task._id, subTask._id)}
                className="flex items-center text-light-text-secondary cursor-pointer hover:-translate-y-1 transition-transform duration-200">
                <input
                  type="checkbox"
                  checked={subTask.completed}
                  onChange={() => onToggleSubTask(task._id, subTask._id)}
                  className="mr-3 rounded cursor-pointer accent-black align-middle"
                />
                <div className="w-full">
                  {editingSubtask.id === subTask._id ? (
                    <input
                      ref={el => subtaskInputRefs.current[subTask._id] = el}
                      type="text"
                      value={editingSubtask.title}
                      onChange={(e) => handleSubtaskTitleChange(e, subTask._id)}
                      onBlur={() => handleSubtaskTitleBlur(subTask._id, subTask.action_title)}
                      onKeyDown={(e) => handleSubtaskTitleKeyDown(e, subTask._id, subTask.action_title)}
                      className="text-md text-gray-700 flex-1 px-2 py-1 border-b-2 border-black focus:outline-none w-full"
                    />
                  ) : (
                    <p
                      className={`text-md text-gray-700 flex-1 cursor-pointer hover:font-bold ${subTask.completed ? 'line-through text-gray-500' : ''}`}
                      onDoubleClick={() => handleSubtaskTitleClick(subTask)}

                    >
                      {subTask.action_title}
                    </p>
                  )}
                  <p className={`text-sm ${subTask.completed ? 'line-through text-gray-500' : ''}`}>{subTask.action_description}</p>
                </div>

              </div>

            </React.Fragment>
          ))}
          <div
            className="py-1 cursor-pointer text-black hover:font-bold flex items-center justify-center border-t border-dashed border-gray-200 mt-2"
            onMouseEnter={() => handleMouseEnterSubtaskSeparator(task.sub_tasks.length)}
            onMouseLeave={handleMouseLeaveSubtaskSeparator}
            onClick={() => handleAddSubtaskClick(task.sub_tasks.length)}
          >
            {(hoveredSubtaskIndex === task.sub_tasks.length && !showAddSubtaskInput) && (
              <span className="text-lg font-bold">+</span>
            )}
          </div>
          {hoveredSubtaskIndex === task.sub_tasks.length && showAddSubtaskInput && (
            <div className="subtask-add-placeholder visible flex items-center py-1 mt-2 ">
              <div className="flex flex-col w-full">
                <input
                  ref={newSubtaskTitleInputRef}
                  type="text"
                  placeholder="New subtask title"
                  value={newSubtaskTitle}
                  onChange={handleNewSubtaskTitleChange}
                  onKeyDown={handleNewSubtaskKeyDown}
                  // onBlur={handleNewSubtaskSubmit}
                  className="flex-1 px-2 py-1 border-b-2 border-black focus:outline-none text-sm"
                />
                <input
                  ref={newSubtaskDescInputRef}
                  type="text"
                  placeholder="New subtask description"
                  value={newSubtaskDescription}
                  onChange={handleNewSubtaskDescChange}
                  onKeyDown={handleNewSubtaskKeyDown}
                  onBlur={handleNewSubtaskSubmit}
                  className="flex-1 px-2 py-1 border-b-2 border-black focus:outline-none text-sm"
                />
              </div>
              <button onClick={handleNewSubtaskSubmit} className="ml-2 text-black hover:font-bold text-lg ">
                +
              </button>
            </div>
          )}
        </div>
      )}

      {(!task.sub_tasks || task.sub_tasks.length === 0) && (
        <div className="ml-10 mt-4">
          {!showAddSubtaskInput ? (
            <button
              onClick={() => handleAddSubtaskClick(0)}
              className="text-blue-500 hover:text-blue-700 font-medium flex items-center"
            >
              <span className="text-lg font-bold mr-2">+</span> Add first subtask
            </button>
          ) : (
            <div className="subtask-add-placeholder visible flex items-center py-1">
              <div className="flex flex-col w-full">
                <input
                  ref={newSubtaskTitleInputRef}
                  type="text"
                  placeholder="New subtask title"
                  value={newSubtaskTitle}
                  onChange={handleNewSubtaskTitleChange}
                  onKeyDown={handleNewSubtaskKeyDown}
                  // onBlur={handleNewSubtaskSubmit}
                  className="flex-1 px-2 py-1 border-b-2 border-black focus:outline-none text-sm"
                />
                <input
                  ref={newSubtaskDescInputRef}
                  type="text"
                  placeholder="New subtask description"
                  value={newSubtaskDescription}
                  onChange={handleNewSubtaskDescChange}
                  onKeyDown={handleNewSubtaskKeyDown}
                  onBlur={handleNewSubtaskSubmit}
                  className="flex-1 px-2 py-1 border-b-2 border-black focus:outline-none text-sm"
                />
              </div>
              <button onClick={handleNewSubtaskSubmit} className="ml-2 text-green-600 hover:text-green-800 text-lg font-bold">
                +
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default TaskCard;
