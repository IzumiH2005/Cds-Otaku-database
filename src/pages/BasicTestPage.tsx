import React from 'react';

const BasicTestPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-3xl font-bold mb-4">Page de test basique</h1>
      <p className="text-lg">Cette page ne dépend pas d'IndexedDB.</p>
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <p className="font-semibold">Informations de débogage :</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Date: {new Date().toLocaleString()}</li>
          <li>User Agent: {navigator.userAgent}</li>
          <li>IndexedDB disponible: {typeof indexedDB !== 'undefined' ? 'Oui' : 'Non'}</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicTestPage;