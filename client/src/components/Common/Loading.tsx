/**
 * 加载组件
 */

import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

/**
 * 加载动画组件
 */
export const Loading: React.FC<LoadingProps> = ({ size = 'md', text }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 border-2 border-slate-700 rounded-full" />
        <div className="absolute inset-0 border-2 border-primary-500 rounded-full border-t-transparent animate-spin" />
      </div>
      {text && (
        <p className="text-slate-400 text-sm">{text}</p>
      )}
    </div>
  );
};

/**
 * 打字加载动画
 */
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};
