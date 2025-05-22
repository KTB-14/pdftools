import React, { useEffect, useState } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';

interface ProcessingStatusProps {
  status: 'uploading' | 'processing' | 'done' | 'error';
  message: string;
  fileName: string;
  fileSize: number;
  jobId: string | null;
  onReset: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  message,
  fileName,
  fileSize,
  jobId,
  onReset
}) => {
  const [progress, setProgress] = useState(0);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    let interval: number;
    
    if (status === 'uploading') {
      interval = window.setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 40));
      }, 200);
    } else if (status === 'processing') {
      setProgress(50);
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 1;
        });
      }, 300);
    } else if (status === 'done') {
      setProgress(100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start mb-4">
        <div className={`
          p-3 rounded-full mr-4
          ${status === 'done' ? 'bg-green-100 text-green-600' : 
            status === 'error' ? 'bg-red-100 text-red-600' : 
            'bg-blue-100 text-blue-600'}
        `}>
          <FileText size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{fileName}</h3>
          <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{message}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              status === 'error' ? 'bg-red-600' : 
              status === 'done' ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%`, 
              transition: 'width 0.5s ease-in-out' 
            }}
          ></div>
        </div>
      </div>

      {status === 'done' && jobId && (
        <a 
          href={`/api/download/${jobId}`}
          download
          className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 
            text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
        >
          <Download size={18} className="mr-2" />
          Télécharger le PDF OCRisé
        </a>
      )}

      {status === 'error' && (
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 
            text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
        >
          <RefreshCw size={18} className="mr-2" />
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ProcessingStatus;