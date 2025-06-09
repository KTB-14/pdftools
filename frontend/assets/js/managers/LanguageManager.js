/**
 * Language Manager
 * Handles all internationalization logic
 */
class LanguageManager {
  constructor(defaultLang = 'fr') {
    this.currentLang = defaultLang;
    this.texts = {
      fr: {
        dropzonePrompt: `Déposez vos fichiers PDF ici<br/><span class="text-muted">ou</span>`,
        selectButton: "Sélectionner des fichiers",
        acceptedFormat: "Format accepté : PDF",
        uploading: "Téléversement en cours…",
        uploadProgress: (pct, remaining) => `Téléversement : ${pct}% — Temps estimé : ${remaining}s`,
        uploadStart: "Début du téléversement…",
        uploadDone: "Téléversement terminé",
        processing: "Traitement en cours…",
        processingDone: "Traitement terminé",
        summaryTitle: "Fichiers traités :",
        downloadAll: "Télécharger tout",
        restart: "↻ Réinitialiser",
        fileSizeInfo: (orig, comp, reduction) => `${orig} → ${comp} (${reduction}% de réduction)`,
        downloading: "Téléchargement en cours…",
        downloadStart: "Téléchargement…",
        downloadDone: "Téléchargement terminé",
        downloadAgain: "Télécharger à nouveau",
        downloadError: "Erreur de téléchargement",
        errorPrefix: "Erreur : ",
        notProcessed: "Non traité",
        footerLine1: "Plateforme dédiée à la compression de fichiers PDF.",
        footerLine2: "Merci de ne pas utiliser de services Web publics pour vos fichiers PDF sensibles.",
        footerInfo: "Partage sécurisé de fichiers volumineux : utilisez la plateforme.",
        footerLink: "DL FAREVA",
        errors: {
          SIGNED_PDF: "PDF signé → Traitement non pris en charge",
          TOO_LARGE: "Fichier trop volumineux",
          PASSWORD_PROTECTED: "PDF protégé par mot de passe",
          INVALID_PDF: "Fichier non-PDF ou corrompu",
          PDF_OPEN_ERROR: "Erreur lors de l'ouverture du PDF",
          OCR_FAILED: "Erreur lors du traitement OCR",
          SIZE_READ_ERROR: "Erreur de lecture de la taille",
          GENERAL_ERROR: "Une erreur inattendue s'est produite",
          NETWORK_ERROR: "Erreur réseau",
          UPLOAD_ERROR: "Erreur lors du téléversement"
        }
      },
      en: {
        dropzonePrompt: `Drop your PDF files here<br/><span class="text-muted">or</span>`,
        selectButton: "Select files",
        acceptedFormat: "Accepted format: PDF",
        uploading: "Uploading…",
        uploadProgress: (pct, remaining) => `Upload: ${pct}% — Estimated time: ${remaining}s`,
        uploadStart: "Starting upload…",
        uploadDone: "Upload complete",
        processing: "Processing…",
        processingDone: "Processing complete",
        summaryTitle: "Processed files:",
        downloadAll: "Download all",
        restart: "↻ Reset",
        fileSizeInfo: (orig, comp, reduction) => `${orig} → ${comp} (${reduction}% reduction)`,
        downloading: "Downloading…",
        downloadStart: "Downloading…",
        downloadDone: "Download complete",
        downloadAgain: "Download again",
        downloadError: "Download error",
        errorPrefix: "Error: ",
        notProcessed: "Not processed",
        footerLine1: "PDF Compression Platform",
        footerLine2: "Please avoid using public web services for your sensitive PDF files.",
        footerInfo: "Secure large file sharing: use the platform",
        footerLink: "DL FAREVA",
        errors: {
          SIGNED_PDF: "Digitally signed PDF — not modified",
          TOO_LARGE: "File too large",
          PASSWORD_PROTECTED: "Password-protected PDF",
          INVALID_PDF: "Invalid or corrupted PDF file",
          PDF_OPEN_ERROR: "Error opening PDF file",
          OCR_FAILED: "OCR processing failed",
          SIZE_READ_ERROR: "Error reading file size",
          GENERAL_ERROR: "An unexpected error occurred",
          NETWORK_ERROR: "Network error",
          UPLOAD_ERROR: "Upload error"
        }
      }
    };
  }

  setLanguage(lang) {
    if (this.texts[lang]) {
      this.currentLang = lang;
      this.updateAllTexts();
    }
  }

  getText(key, ...args) {
    const keys = key.split('.');
    let value = this.texts[this.currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value === 'function') {
      return value(...args);
    }
    
    return value || key;
  }

  updateAllTexts() {
    // Update static elements
    this.updateElement('#title-main', 'Plateforme de Compression PDF');
    this.updateElement('.footer-text-title', 'footerLine1');
    this.updateElement('.footer-text-warning', 'footerLine2');
    this.updateElement('#footer-text-1', 'footerInfo');
    this.updateElement('#footer-link', 'footerLink');
    
    // Update summary if visible
    const summaryTitle = document.querySelector('#summary-title');
    if (summaryTitle) {
      summaryTitle.textContent = this.getText('summaryTitle');
    }
    
    // Update buttons
    const downloadAllBtn = document.getElementById('downloadAllButton');
    if (downloadAllBtn) {
      downloadAllBtn.textContent = this.getText('downloadAll');
    }
    
    const restartBtn = document.getElementById('restartButton');
    if (restartBtn) {
      restartBtn.textContent = this.getText('restart');
    }
  }

  updateElement(selector, textKey) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = this.getText(textKey);
    }
  }
}