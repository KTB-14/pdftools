// assets/js/lang.js

// Dictionnaire des textes
const translations = {
  fr: {
    'Plateforme de Compression PDF': 'Plateforme de Compression PDF',
    'Déposez vos fichiers PDF ici': 'Déposez vos fichiers PDF ici',
    'ou': 'ou',
    'Sélectionner des fichiers': 'Sélectionner des fichiers',
    'Format accepté : PDF': 'Format accepté : PDF',
    'Fichiers traités :': 'Fichiers traités :',
    'Télécharger tout': 'Télécharger tout',
    '↻ Réinitialiser': '↻ Réinitialiser',
    'Plateforme dédiée à la compression de fichiers PDF.': 'Plateforme dédiée à la compression de fichiers PDF.',
    'Merci de ne pas utiliser de services Web publics pour vos fichiers PDF sensibles.': 'Merci de ne pas utiliser de services Web publics pour vos fichiers PDF sensibles.',
    'Partage sécurisé de fichiers volumineux : utilisez la plateforme.': 'Partage sécurisé de fichiers volumineux : utilisez la plateforme.',
    'DL FAREVA': 'DL FAREVA'
  },
  en: {
    'Plateforme de Compression PDF': 'PDF Compression Platform',
    'Déposez vos fichiers PDF ici': 'Drop your PDF files here',
    'ou': 'or',
    'Sélectionner des fichiers': 'Select files',
    'Format accepté : PDF': 'Accepted format: PDF',
    'Fichiers traités :': 'Processed files:',
    'Télécharger tout': 'Download all',
    '↻ Réinitialiser': '↻ Reset',
    'Plateforme dédiée à la compression de fichiers PDF.': 'PDF Compression Platform.',
    'Merci de ne pas utiliser de services Web publics pour vos fichiers PDF sensibles.': 'Please avoid using public web services for your sensitive PDF files.',
    'Partage sécurisé de fichiers volumineux : utilisez la plateforme.': 'Secure large file sharing: use the platform',
    'DL FAREVA': 'DL FAREVA'
  }
};

// Fonction de changement de langue
function setLanguage(lang) {
  const title = document.getElementById('title-main');
  if (title) title.textContent = translations[lang]['Plateforme de Compression PDF'];

  const dropText = document.getElementById('drop-text');
  if (dropText) {
    dropText.innerHTML =
      translations[lang]['Déposez vos fichiers PDF ici'] +
      '<br/><span class="text-muted">' +
      translations[lang]['ou'] +
      '</span>';
  }

  const selectBtn = document.getElementById('selectFile');
  if (selectBtn)
    selectBtn.textContent = translations[lang]['Sélectionner des fichiers'];

  const accepted = document.getElementById('accepted-format');
  if (accepted)
    accepted.textContent = translations[lang]['Format accepté : PDF'];

  const summaryTitle = document.getElementById('summary-title');
  if (summaryTitle)
    summaryTitle.textContent = translations[lang]['Fichiers traités :'];

  const downloadAll = document.getElementById('downloadAllButton');
  if (downloadAll)
    downloadAll.textContent = translations[lang]['Télécharger tout'];

  const restart = document.getElementById('restartButton');
  if (restart) restart.textContent = translations[lang]['↻ Réinitialiser'];

  const infoTitle = document.querySelector('.footer-text-title');
  if (infoTitle)
    infoTitle.textContent = translations[lang]['Plateforme dédiée à la compression de fichiers PDF.'];

  const infoWarning = document.querySelector('.footer-text-warning');
  if (infoWarning)
    infoWarning.textContent =
      translations[lang]['Merci de ne pas utiliser de services Web publics pour vos fichiers PDF sensibles.'];

  const footerInfo = document.getElementById('footer-text-1');
  if (footerInfo)
    footerInfo.textContent = translations[lang]['Partage sécurisé de fichiers volumineux : utilisez la plateforme.'];
  const footerLink = document.getElementById('footer-link');
  if (footerLink)
    footerLink.textContent = translations[lang]['DL FAREVA'];
}

// Détection du clic sur les drapeaux
document.querySelectorAll('.flag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedLang = btn.getAttribute('data-lang');
    setLanguage(selectedLang);
  });
});

// Langue par défaut
setLanguage('fr');
