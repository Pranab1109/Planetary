import React from 'react';

const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out transform';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg',
  };

  const variantStyles = {

    primary: `bg-gray-100 text-black shadow-md hover:bg-opacity-90 hover:shadow-lg hover:-translate-y-0.5
              active:translate-y-0 active:shadow-md`,


    secondary: `bg-dark-bg-secondary text-dark-text-primary border border-dark-border shadow-sm
                hover:bg-dark-bg-tertiary hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-border focus:ring-opacity-50`,


    outline: `bg-transparent text-accent-purple border border-accent-purple shadow-sm
              hover:bg-accent-purple hover:text-white hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-opacity-50`,


    danger: `bg-red-700 text-white shadow-md hover:bg-red-800 hover:shadow-lg hover:-translate-y-0.5
             active:translate-y-0 active:shadow-md focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50`,


    icon: `p-2 rounded-full text-dark-text-secondary hover:bg-dark-bg-tertiary hover:text-accent-purple
           focus:outline-none focus:ring-2 focus:ring-dark-border focus:ring-opacity-50`,
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;