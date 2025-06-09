/**
 * Main application controller
 * Handles initialization and global state management
 */
class PDFCompressApp {
  constructor() {
    this.currentLang = 'fr';
    this.apiBase = '/api';
    this.fileManager = null;
    this.uiManager = null;
    this.langManager = null;
    
    this.init();
  }

  async init() {
    // Initialize managers
    this.langManager = new LanguageManager(this.currentLang);
    this.uiManager = new UIManager(this.langManager);
    this.fileManager = new FileManager(this.apiBase, this.uiManager, this.langManager);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize UI
    this.uiManager.init();
    this.langManager.updateAllTexts();
  }

  setupEventListeners() {
    // Language switching
    document.querySelectorAll('.flag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        if (lang === 'fr' || lang === 'en') {
          this.currentLang = lang;
          this.langManager.setLanguage(lang);
          this.uiManager.updateLanguageDependentElements();
        }
      });
    });

    // Global error handling
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.uiManager.showError(
        this.langManager.getText('errors.GENERAL_ERROR') || 'Une erreur inattendue s\'est produite'
      );
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pdfApp = new PDFCompressApp();
});