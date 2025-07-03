import React from 'react';

const ExampleCard = ({ title, iconName, onClick }) => {
  return (
    <div
      className="bg-light-bg-tertiary/60
                 rounded-xl p-4 cursor-pointer shadow-soft-md border
                 border-light-border
                 hover:bg-light-bg-secondary/70
                 transition-all duration-200 ease-in-out transform
                flex flex-col items-start space-y-2 w-1/3 h-1/2
                 shadow-soft-md backdrop-blur-md shadow-md hover:-translate-y-0.5 hover:shadow-xl"
      onClick={onClick}
    >

      <i className={`${iconName} pr-2`}></i>
      <h2 className="text-light-text-primary font-medium text-md">{title}</h2>
    </div>
  );
};

export default ExampleCard;