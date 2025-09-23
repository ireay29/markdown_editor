import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { AlertTriangle, X, Info } from 'lucide-react';

export const SyntaxErrorPanel: React.FC = () => {
  const { syntaxErrors } = useEditorStore();

  if (syntaxErrors.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-secondary-200 dark:border-secondary-700 bg-yellow-50 dark:bg-yellow-900/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Syntax Issues ({syntaxErrors.length})
          </span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {syntaxErrors.map((error) => (
          <div 
            key={error.id}
            className={`flex items-start space-x-2 p-2 rounded text-xs border ${
              error.severity === 'error' 
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}
          >
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
              error.severity === 'error' 
                ? 'bg-red-500' 
                : 'bg-yellow-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${
                error.severity === 'error' 
                  ? 'text-red-800 dark:text-red-200' 
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                Line {error.line + 1}: {error.message}
              </div>
              <div className={`text-xs mt-1 ${
                error.severity === 'error' 
                  ? 'text-red-600 dark:text-red-300' 
                  : 'text-yellow-600 dark:text-yellow-300'
              }`}>
                {error.error_type.replace(/_/g, ' ')} • Column {error.column + 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};