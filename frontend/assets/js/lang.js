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
    'Accès direct Fareva Intranet': 'Accès direct Fareva Intranet'
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
    'Accès direct Fareva Intranet': 'Direct access to Fareva Intranet'
  }
};

// Fonction de changement de langue
function setLanguage(lang) {
  document.getElementById('title-main').textContent = translations[lang]['Compression PDF'];
  document.getElementById('drop-text').innerHTML = translations[lang]['Glissez-déposez vos fichiers PDF ici'] + '<br/><span class="text-muted">' + translations[lang]['ou'] + '</span>';
  document.getElementById('selectFile').textContent = translations[lang]['Sélectionner un ou plusieurs fichiers'];
  document.getElementById('accepted-format').textContent = translations[lang]['Format accepté : PDF uniquement'];
  document.getElementById('summary-title').textContent = translations[lang]['Résumé des fichiers traités :'];
  document.getElementById('downloadAllButton').textContent = translations[lang]['Télécharger tous les fichiers'];
  document.getElementById('restartButton').textContent = translations[lang]['↻ Recommencer'];
  document.getElementById('footer-text-1').textContent = translations[lang]['Mise à disposition plateforme Compression PDF'];
  document.getElementById('footer-text-2').textContent = translations[lang]['Veuillez ne pas utiliser de plateformes Web publiques pour vos fichiers PDF sensibles.'];
  document.getElementById('footer-link').textContent = translations[lang]['Accès direct Fareva Intranet'];
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
