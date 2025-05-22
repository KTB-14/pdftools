import React from 'react';
import { FileText, Image, AlertCircle } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';

const HomePage: React.FC = () => {
  return (
    <div className="hero bg-blue-600 text-white pb-32 pt-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Bienvenue sur PDFTools</h1>
          <p className="text-xl">Choisissez l'un des services ci-dessous :</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto -mb-32">
          <ServiceCard
            title="OCR & Compression PDF"
            description="Convertissez et compressez vos PDF avec OCR intégré"
            icon={<FileText size={32} />}
            to="/compress"
            available={true}
          />
          
          <ServiceCard
            title="Image → PDF"
            description="Convertissez vos images en fichiers PDF"
            icon={<Image size={32} />}
            to="#"
            available={false}
          />
          
          <ServiceCard
            title="Signature PDF"
            description="Ajoutez votre signature à vos documents"
            icon={<AlertCircle size={32} />}
            to="#"
            available={false}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;