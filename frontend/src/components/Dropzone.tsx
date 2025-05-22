import React, { useState, useRef, DragEvent } from 'react';
import { Upload, FileUp, RefreshCw } from 'lucide-react';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  error: string | null;
  onReset: () => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelected, error, onReset }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
          <span className="mr-2">⚠️</span>
          <div>
            <p className="font-medium">Erreur</p>
            <p>{error}</p>
            <button 
              onClick={onReset}
              className="mt-2 flex items-center text-sm font-medium text-red-600 hover:text-red-800"
            >
              <RefreshCw size={14} className="mr-1" /> Réessayer
            </button>
          </div>
        </div>
      )}

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 
          transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-white'}
          ${error ? 'border-red-300 hover:border-red-400' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ minHeight: '240px' }}
      >
        <div className={`
          p-4 rounded-full mb-4
          ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
        `}>
          <Upload size={36} />
        </div>

        <h3 className="text-xl font-medium text-gray-700 mb-2">
          {isDragging ? 'Déposez ici' : 'Glissez-déposez votre PDF ici'}
        </h3>
        
        <p className="text-gray-500 mb-4 text-center">
          ou
        </p>
        
        <button
          onClick={handleButtonClick}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md
            transition-colors duration-300 flex items-center"
        >
          <FileUp size={18} className="mr-2" />
          Sélectionner un fichier
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="application/pdf"
          className="hidden"
        />
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          Formats acceptés: PDF uniquement<br />
          Taille maximum: 10 Mo
        </p>
      </div>
    </div>
  );
};

export default Dropzone;