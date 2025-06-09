/**
 * File Manager
 * Handles file upload, processing, and download logic
 */
class FileManager {
  constructor(apiBase, uiManager, langManager) {
    this.apiBase = apiBase;
    this.uiManager = uiManager;
    this.langManager = langManager;
    this.currentJobId = null;
    this.uploadController = null;
  }

  async handleFiles(files) {
    // Reset interface
    this.uiManager.resetInterface();
    this.uiManager.elements.dropzone?.classList.add('hidden');

    // Validate files
    const validFiles = this.validateFiles(files);
    if (validFiles.length === 0) {
      this.uiManager.showError(this.langManager.getText('errors.INVALID_PDF'));
      this.uiManager.elements.dropzone?.classList.remove('hidden');
      return;
    }

    // Prepare upload
    const fileIdMap = {};
    const formData = new FormData();

    for (const file of validFiles) {
      const id = this.uiManager.generateUniqueId();
      fileIdMap[file.name] = id;
      formData.append('files', file);

      // Create UI element
      const fileItem = this.uiManager.createFileItem(file, id);
      this.uiManager.elements.fileList?.appendChild(fileItem);
    }

    formData.append('file_ids', JSON.stringify(fileIdMap));

    // Start upload
    await this.uploadFiles(formData);
  }

  validateFiles(files) {
    const validFiles = [];
    const maxSize = 50 * 1024 * 1024; // 50MB

    for (const file of files) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        this.uiManager.showError(
          `${file.name}: ${this.langManager.getText('errors.INVALID_PDF')}`
        );
        continue;
      }

      if (file.size > maxSize) {
        this.uiManager.showError(
          `${file.name}: ${this.langManager.getText('errors.TOO_LARGE')}`
        );
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  async uploadFiles(formData) {
    // Create abort controller for cancellation
    this.uploadController = new AbortController();

    try {
      const response = await this.uploadWithProgress(formData);
      
      if (response.ok) {
        const result = await response.json();
        this.currentJobId = result.job_id;
        
        // Show upload complete and start processing
        this.showGlobalStatus('uploadDone');
        setTimeout(() => this.startProcessingPhase(), 500);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.uiManager.showError(this.langManager.getText('errors.UPLOAD_CANCELLED'));
      } else {
        this.uiManager.showError(
          `${this.langManager.getText('errors.UPLOAD_ERROR')}: ${error.message}`
        );
      }
      this.uiManager.elements.dropzone?.classList.remove('hidden');
    }
  }

  uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      // Create global status indicator
      this.showGlobalStatus('uploadStart');

      xhr.upload.addEventListener('progress', (e) => {
        if (!e.lengthComputable) return;

        const percentComplete = (e.loaded / e.total) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = e.loaded / elapsed;
        const remaining = Math.ceil((e.total - e.loaded) / speed);

        // Update all file progress bars
        this.uiManager.fileItems.forEach((entry, fileId) => {
          this.uiManager.updateFileProgress(fileId, percentComplete);
        });

        // Update global status
        this.updateGlobalStatus(
          this.langManager.getText('uploadProgress', percentComplete.toFixed(1), remaining)
        );
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error(this.langManager.getText('errors.NETWORK_ERROR')));
      xhr.onabort = () => reject(new Error('Upload cancelled'));

      // Handle abort controller
      this.uploadController.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      xhr.open('POST', `${this.apiBase}/upload`, true);
      xhr.send(formData);
    });
  }

  async startProcessingPhase() {
    this.showGlobalStatus('processing');

    // Update all file items to processing state
    this.uiManager.fileItems.forEach((entry, fileId) => {
      this.uiManager.updateFileStatus(fileId, 'processing');
    });

    // Start polling for status
    await this.pollJobStatus();
  }

  async pollJobStatus() {
    if (!this.currentJobId) return;

    try {
      const response = await fetch(`${this.apiBase}/status/${this.currentJobId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'done' && data.files) {
        this.handleProcessingComplete(data.files);
      } else if (data.status === 'error') {
        throw new Error(data.details || 'Processing failed');
      } else {
        // Continue polling
        setTimeout(() => this.pollJobStatus(), 2000);
      }
    } catch (error) {
      this.uiManager.showError(
        `${this.langManager.getText('errorPrefix')}${error.message}`
      );
      this.uiManager.elements.dropzone?.classList.remove('hidden');
    }
  }

  handleProcessingComplete(files) {
    this.showGlobalStatus('processingDone');

    files.forEach(fileInfo => {
      const entry = this.uiManager.fileItems.get(fileInfo.id);
      if (!entry) return;

      if (fileInfo.error) {
        // Handle file error
        this.uiManager.updateFileStatus(
          fileInfo.id, 
          'error', 
          this.langManager.getText(`errors.${fileInfo.error}`) || fileInfo.error
        );
        
        const sizeDiv = entry.fileItem.querySelector('.file-size');
        if (sizeDiv) {
          sizeDiv.textContent = this.langManager.getText('notProcessed');
        }
      } else {
        // Handle successful processing
        this.uiManager.updateFileStatus(fileInfo.id, 'processed');
        this.uiManager.updateFileSizeInfo(
          fileInfo.id,
          entry.sizeBefore,
          fileInfo.size_after,
          fileInfo.ratio || 0
        );
        this.uiManager.showDownloadButton(fileInfo.id, this.currentJobId, fileInfo.final_name);
      }
    });

    // Show summary
    this.uiManager.showSummary(files);
    this.setupDownloadAllButton(files);
  }

  setupDownloadAllButton(files) {
    const downloadAllBtn = this.uiManager.elements.downloadAllButton;
    if (!downloadAllBtn) return;

    const validFiles = files.filter(f => !f.error);
    
    if (validFiles.length <= 1) {
      downloadAllBtn.style.display = 'none';
    } else {
      downloadAllBtn.style.display = 'inline-block';
      downloadAllBtn.textContent = this.langManager.getText('downloadAll');
      
      downloadAllBtn.onclick = () => this.downloadAllFiles(validFiles);
    }
  }

  async downloadFile(jobId, fileId, finalName) {
    const downloadButton = document.querySelector(`.download-button[data-file-id="${fileId}"]`);
    if (!downloadButton) return;

    // Update UI
    downloadButton.disabled = true;
    downloadButton.textContent = this.langManager.getText('downloadStart');
    this.uiManager.updateFileStatus(fileId, 'downloading');

    try {
      const response = await fetch(`${this.apiBase}/download/${jobId}/file/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      this.triggerDownload(blob, finalName);

      // Update UI for success
      this.uiManager.updateFileStatus(fileId, 'downloaded', this.langManager.getText('downloadDone'));
      downloadButton.disabled = false;
      downloadButton.textContent = this.langManager.getText('downloadAgain');

    } catch (error) {
      // Update UI for error
      this.uiManager.updateFileStatus(fileId, 'error', this.langManager.getText('downloadError'));
      this.uiManager.showError(`${this.langManager.getText('errorPrefix')}${error.message}`);
      
      downloadButton.disabled = false;
      downloadButton.textContent = this.langManager.getText('downloadStart');
    }
  }

  async downloadAllFiles(files) {
    for (const fileInfo of files) {
      if (!fileInfo.error) {
        await this.downloadFile(this.currentJobId, fileInfo.id, fileInfo.final_name);
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  showGlobalStatus(statusKey) {
    // Remove existing global status
    document.querySelectorAll('.global-status').forEach(el => el.remove());

    // Create new global status
    const globalStatus = document.createElement('div');
    globalStatus.className = 'status-text processing global-status';
    globalStatus.textContent = this.langManager.getText(statusKey);
    
    this.uiManager.elements.fileList?.parentElement?.insertBefore(
      globalStatus, 
      this.uiManager.elements.fileList
    );
  }

  updateGlobalStatus(message) {
    const globalStatus = document.querySelector('.global-status');
    if (globalStatus) {
      globalStatus.textContent = message;
    }
  }

  cancelUpload() {
    if (this.uploadController) {
      this.uploadController.abort();
    }
  }
}