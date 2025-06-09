/**
 * UI Manager
 * Handles all UI interactions and updates
 */
class UIManager {
  constructor(langManager) {
    this.langManager = langManager;
    this.elements = {};
    this.fileItems = new Map();
  }

  init() {
    this.cacheElements();
    this.setupDropzone();
    this.setupButtons();
  }

  cacheElements() {
    this.elements = {
      dropzone: document.getElementById('dropzone'),
      fileInput: document.getElementById('fileInput'),
      selectBtn: document.getElementById('selectFile'),
      fileList: document.getElementById('fileList'),
      downloadAllButton: document.getElementById('downloadAllButton'),
      restartButton: document.getElementById('restartButton'),
      summaryDiv: document.getElementById('summary')
    };
  }

  setupDropzone() {
    const { dropzone, fileInput } = this.elements;
    
    // Drag and drop events
    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('hover');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('hover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length && window.pdfApp?.fileManager) {
        window.pdfApp.fileManager.handleFiles(files);
      }
    });
  }

  setupButtons() {
    const { selectBtn, fileInput, restartButton } = this.elements;
    
    if (selectBtn && fileInput) {
      selectBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length && window.pdfApp?.fileManager) {
          window.pdfApp.fileManager.handleFiles(e.target.files);
        }
      });
    }

    if (restartButton) {
      restartButton.addEventListener('click', () => this.resetInterface());
    }
  }

  updateLanguageDependentElements() {
    // Update dropzone content
    this.updateDropzoneContent();
    
    // Update any dynamic content that depends on language
    this.langManager.updateAllTexts();
  }

  updateDropzoneContent() {
    const { dropzone } = this.elements;
    if (!dropzone) return;

    dropzone.innerHTML = `
      <p>${this.langManager.getText('dropzonePrompt')}</p>
      <button id="selectFile" class="button">${this.langManager.getText('selectButton')}</button>
      <input type="file" id="fileInput" accept="application/pdf" multiple hidden />
      <p class="text-muted">${this.langManager.getText('acceptedFormat')}</p>
    `;

    // Re-cache elements and setup after recreation
    this.cacheElements();
    this.setupButtons();
  }

  createFileItem(file, id) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileId = id;

    fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="file-size">${this.formatBytes(file.size)}</div>
      </div>
      <div class="status-block">
        <div class="status-area">
          <span class="status-text uploading" aria-live="polite">${this.langManager.getText('uploading')}</span>
          <div class="spinner"></div>
          <div class="check-icon">✓</div>
        </div>
        <div class="progress-container">
          <div class="progress-fill"></div>
        </div>
      </div>
      <button class="button button-secondary download-button hidden" data-file-id="${id}">
        ${this.langManager.getText('downloadStart')}
      </button>
    `;

    this.fileItems.set(id, { fileItem, fileName: file.name, sizeBefore: file.size });
    return fileItem;
  }

  updateFileProgress(fileId, percentage) {
    const entry = this.fileItems.get(fileId);
    if (!entry) return;

    const progressFill = entry.fileItem.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  }

  updateFileStatus(fileId, status, message = '') {
    const entry = this.fileItems.get(fileId);
    if (!entry) return;

    const statusText = entry.fileItem.querySelector('.status-text');
    const spinner = entry.fileItem.querySelector('.spinner');
    const checkIcon = entry.fileItem.querySelector('.check-icon');
    const progressFill = entry.fileItem.querySelector('.progress-fill');

    if (statusText) {
      statusText.textContent = message || this.langManager.getText(status);
      statusText.className = `status-text ${status}`;
    }

    switch (status) {
      case 'processing':
        if (spinner) spinner.style.display = 'block';
        if (checkIcon) checkIcon.classList.remove('show');
        if (progressFill) progressFill.classList.add('indeterminate');
        break;
      case 'processed':
      case 'downloaded':
        if (spinner) spinner.style.display = 'none';
        if (checkIcon) checkIcon.classList.add('show');
        if (progressFill) {
          progressFill.classList.remove('indeterminate');
          progressFill.style.width = '100%';
        }
        break;
      case 'error':
        if (spinner) spinner.style.display = 'none';
        if (checkIcon) checkIcon.classList.remove('show');
        if (progressFill) {
          progressFill.classList.remove('indeterminate');
          progressFill.style.width = '0%';
        }
        break;
    }
  }

  showDownloadButton(fileId, jobId, finalName) {
    const entry = this.fileItems.get(fileId);
    if (!entry) return;

    const downloadButton = entry.fileItem.querySelector('.download-button');
    if (downloadButton) {
      downloadButton.textContent = this.langManager.getText('downloadStart');
      downloadButton.classList.remove('hidden');
      downloadButton.disabled = false;
      
      downloadButton.addEventListener('click', () => {
        if (window.pdfApp?.fileManager) {
          window.pdfApp.fileManager.downloadFile(jobId, fileId, finalName);
        }
      });
    }
  }

  updateFileSizeInfo(fileId, originalBytes, compressedBytes, ratio) {
    const entry = this.fileItems.get(fileId);
    if (!entry) return;

    const sizeDiv = entry.fileItem.querySelector('.file-size');
    if (sizeDiv) {
      const reductionPercent = (100 - ratio).toFixed(1);
      sizeDiv.textContent = this.langManager.getText('fileSizeInfo',
        this.formatBytes(originalBytes),
        this.formatBytes(compressedBytes),
        reductionPercent
      );
    }
  }

  showSummary(files) {
    const { summaryDiv } = this.elements;
    if (!summaryDiv) return;

    const ul = summaryDiv.querySelector('ul');
    if (ul) {
      ul.innerHTML = '';
      files.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f.original + (f.error ? ` — ${this.langManager.getText(`errors.${f.error}`) || f.error}` : '');
        ul.appendChild(li);
      });
    }

    summaryDiv.classList.remove('hidden');
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'error-close';
    closeBtn.onclick = () => errorDiv.remove();
    errorDiv.appendChild(closeBtn);
    
    this.elements.fileList?.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => errorDiv.remove(), 10000);
  }

  resetInterface() {
    // Clear file items
    this.fileItems.clear();
    
    // Reset UI elements
    if (this.elements.fileList) {
      this.elements.fileList.innerHTML = '';
    }
    
    if (this.elements.summaryDiv) {
      this.elements.summaryDiv.classList.add('hidden');
    }
    
    if (this.elements.dropzone) {
      this.elements.dropzone.classList.remove('hidden');
    }
    
    if (this.elements.fileInput) {
      this.elements.fileInput.value = '';
    }
    
    // Remove any global status messages
    document.querySelectorAll('.status-text.processing, .status-text.uploaded, .status-text.uploading')
      .forEach(el => el.remove());
    
    // Update language-dependent content
    this.updateLanguageDependentElements();
  }

  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  generateUniqueId() {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
}