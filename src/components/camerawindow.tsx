import React from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';

export default function CameraWindow({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-xl mx-4">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-gray-900 dark:text-white">Scan Wajah</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Camera frame and controls container */}
        <div className="flex gap-4">
          {/* Camera frame with 3:4 aspect ratio */}
          <div className="relative w-full">
            <div className="aspect-[3/4] bg-gray-900 rounded-lg">
              {/* Camera feed will go here */}
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="flex flex-col gap-4 justify-center items-center">
            <button
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
              title="Take photo"
            >
              <Camera className="h-6 w-6" />
            </button>
            <button
              className="p-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Retake photo"
            >
              <RotateCcw className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}