import React from 'react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  available: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  description, 
  icon, 
  to, 
  available 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!available) {
      e.preventDefault();
      alert('Service à venir bientôt !');
    }
  };

  return (
    <Link
      to={to}
      className={`
        block bg-white rounded-lg shadow-lg transform transition-transform duration-300 
        hover:-translate-y-1 hover:shadow-xl 
        ${!available ? 'opacity-80 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-full mr-4 ${available ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            {icon}
          </div>
          <h2 className={`text-xl font-semibold ${available ? 'text-gray-800' : 'text-gray-600'}`}>{title}</h2>
        </div>
        <p className="text-gray-600">{description}</p>
        {!available && (
          <div className="mt-4 inline-block py-1 px-3 bg-gray-100 text-gray-600 text-sm rounded-full">
            Bientôt disponible
          </div>
        )}
      </div>
    </Link>
  );
};

export default ServiceCard;