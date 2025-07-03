import React from 'react';

const InputField = ({ label, id, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full p-3 rounded-lg
                  bg-light-bg-tertiary/60 border-light-border/50
                  text-light-text-primary 
                  placeholder-light-text-secondary 
                  focus:outline-none focus:ring-1 focus:ring-gray-100
                  backdrop-blur-[10px]
                  ${className}`}
        {...props}
      />
    </div>
  );
};

export default InputField;