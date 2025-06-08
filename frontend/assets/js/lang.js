// assets/js/lang.js

// Dictionnaire des textes
const translations = {
  fr: {
    'Compression PDF': 'Compression PDF',
    'Glissez-déposez vos fichiers PDF ici': 'Glissez-déposez vos fichiers PDF ici',
    'ou': 'ou',
    'Sélectionner un ou plusieurs fichiers': 'Sélectionner un ou plusieurs fichiers',
    'Format accepté : PDF uniquement': 'Format accepté : PDF uniquement',
    'Résumé des fichiers traités :': 'Résumé des fichiers traités :',
    'Télécharger tous les fichiers': 'Télécharger tous les fichiers',
    '↻ Recommencer': '↻ Recommencer',
    'Mise à disposition plateforme Compression PDF': 'Mise à disposition plateforme Compression PDF',
    'Veuillez ne pas utiliser de plateformes Web publiques pour vos fichiers PDF sensibles.': 'Veuillez ne pas utiliser de plateformes Web publiques pour vos fichiers PDF sensibles.',
    'Pour partager des fichiers volumineux de manière sécurisée, utilisez la plateforme': 'Pour partager des fichiers volumineux de manière sécurisée, utilisez la plateforme',
    'DL FAREVA': 'DL FAREVA'
  },
  en: {
    'Compression PDF': 'PDF Compression',
    'Glissez-déposez vos fichiers PDF ici': 'Drag and drop your PDF files here',
    'ou': 'or',
    'Sélectionner un ou plusieurs fichiers': 'Select one or more files',
    'Format accepté : PDF uniquement': 'Accepted format: PDF only',
    'Résumé des fichiers traités :': 'Summary of processed files:',
    'Télécharger tous les fichiers': 'Download all files',
    '↻ Recommencer': '↻ Restart',
    'Mise à disposition plateforme Compression PDF': 'PDF Compression Platform Access',
    'Veuillez ne pas utiliser de plateformes Web publiques pour vos fichiers PDF sensibles.': 'Please do not use public web platforms for your sensitive PDF files.',
    'Pour partager des fichiers volumineux de manière sécurisée, utilisez la plateforme': 'To share large files securely, use the platform',
    'DL FAREVA': 'DL FAREVA'
  }
};

// Fonction de changement de langue
function setLanguage(lang) {
  const title = document.getElementById('title-main');
  if (title) title.textContent = translations[lang]['Compression PDF'];

  const dropText = document.getElementById('drop-text');
  if (dropText) {
    dropText.innerHTML =
      translations[lang]['Glissez-déposez vos fichiers PDF ici'] +
      '<br/><span class="text-muted">' +
      translations[lang]['ou'] +
      '</span>';
  }

  const selectBtn = document.getElementById('selectFile');
  if (selectBtn)
    selectBtn.textContent = translations[lang]['Sélectionner un ou plusieurs fichiers'];

  const accepted = document.getElementById('accepted-format');
  if (accepted)
    accepted.textContent = translations[lang]['Format accepté : PDF uniquement'];

  const summaryTitle = document.getElementById('summary-title');
  if (summaryTitle)
    summaryTitle.textContent = translations[lang]['Résumé des fichiers traités :'];

  const downloadAll = document.getElementById('downloadAllButton');
  if (downloadAll)
    downloadAll.textContent = translations[lang]['Télécharger tous les fichiers'];

  const restart = document.getElementById('restartButton');
  if (restart) restart.textContent = translations[lang]['↻ Recommencer'];

  const infoTitle = document.querySelector('.footer-text-title');
  if (infoTitle)
    infoTitle.textContent = translations[lang]['Mise à disposition plateforme Compression PDF'];

  const infoWarning = document.querySelector('.footer-text-warning');
  if (infoWarning)
    infoWarning.textContent =
      translations[lang]['Veuillez ne pas utiliser de plateformes Web publiques pour vos fichiers PDF sensibles.'];

  const footerInfo = document.getElementById('footer-text-1');
  if (footerInfo)
    footerInfo.textContent = translations[lang]['Pour partager des fichiers volumineux de manière sécurisée, utilisez la plateforme'];

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
