import React, { useState } from 'react';
import Dropzone from '../components/Dropzone';
import ProcessingStatus from '../components/ProcessingStatus';

const CompressPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setStatus('error');
      setMessage('Seuls les fichiers PDF sont autorisés.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setStatus('error');
      setMessage('Fichier trop volumineux (>10 Mo).');
      return;
    }

    setFile(selectedFile);
    setStatus('uploading');
    setMessage('Téléversement...');

    try {
      const formData = new FormData();
      formData.append('files', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Échec du téléversement.');
      }

      const data = await response.json();
      setJobId(data.job_id);
      setStatus('processing');
      setMessage('Traitement en cours...');
      
      checkStatus(data.job_id);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite.');
    }
  };

  const checkStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/status/${id}`);
      const data = await response.json();

      if (data.status === 'done') {
        setStatus('done');
        setMessage('Traitement terminé !');
      } else if (data.status === 'error') {
        setStatus('error');
        setMessage(data.details || 'Erreur pendant le traitement.');
      } else {
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la vérification du statut.');
    }
  };

  const resetState = () => {
    setFile(null);
    setStatus('idle');
    setMessage('');
    setJobId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">OCR & Compression PDF</h1>
        <p className="text-gray-600">
          Téléchargez votre PDF pour le compresser et y ajouter une couche OCR
        </p>
      </div>

      {status === 'idle' || status === 'error' ? (
        <Dropzone 
          onFileSelected={handleFileSelected} 
          error={status === 'error' ? message : null}
          onReset={resetState}
        />
      ) : (
        <ProcessingStatus 
          status={status} 
          message={message} 
          fileName={file?.name || ''} 
          fileSize={file?.size || 0}
          jobId={jobId}
          onReset={resetState}
        />
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">À propos de ce service</h3>
        <p className="text-sm text-blue-700">
          Ce service vous permet de compresser vos documents PDF tout en y ajoutant une couche OCR (reconnaissance optique de caractères).
          Cela rend votre PDF plus léger et permet d'effectuer des recherches dans le texte du document, même s'il s'agit d'un scan.
        </p>
      </div>
    </div>
  );
};

export default CompressPage;