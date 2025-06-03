const API_BASE = "api";
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const fileList = document.getElementById('fileList');
const downloadAllSection = document.getElementById('downloadAll');
const downloadAllButton = document.getElementById('downloadAllButton');
const restartButton = document.getElementById('restartButton');

function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createFileItem(file) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.innerHTML = `
    <div class="file-info">
      <div class="file-name">${file.name}</div>
      <div class="file-size">${formatFileSize(file.size)}</div>
    </div>
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
    </div>
    <button class="button button-secondary download-button hidden">
      Télécharger
    </button>
  `;
  return fileItem;
}

function resetInterface() {
  fileList.innerHTML = '';
  downloadAllSection.classList.add('hidden');
  dropzone.classList.remove('hidden');
  fileInput.value = '';
}

selectBtn.onclick = () => fileInput.click();
restartButton.onclick = resetInterface;

fileInput.onchange = (e) => {
  if (e.target.files.length) {
    uploadFiles(e.target.files);
  }
};

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('hover');
  });
});

['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('hover');
  });
});

dropzone.addEventListener('drop', e => {
  const files = e.dataTransfer.files;
  if (files.length) {
    uploadFiles(files);
  }
});

async function uploadFiles(files) {
  fileList.innerHTML = '';
  downloadAllSection.classList.add('hidden');
  dropzone.classList.add('hidden');

  const fileItems = new Map();
  const fileIdMap = {};

  const formData = new FormData();
  for (const file of files) {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;

    formData.append('files', file);

    const fileItem = createFileItem(file);
    fileList.appendChild(fileItem);
    fileItems.set(id, fileItem);
  }

  formData.append('file_ids', JSON.stringify(fileIdMap));

  // Passer à XMLHttpRequest pour progression
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`, true);

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      fileItems.forEach(fileItem => {
        const progressFill = fileItem.querySelector('.progress-fill');
        progressFill.style.width = `${percentComplete}%`;
      });
    }
  });

  xhr.onload = async function () {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      await checkStatus(response.job_id, fileItems);
    } else {
      showError('Erreur lors de l\'upload');
      dropzone.classList.remove('hidden');
    }
  };

  xhr.onerror = function () {
    showError('Erreur réseau lors de l\'upload');
    dropzone.classList.remove('hidden');
  };

  xhr.send(formData);
}

async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();

    if (data.status === 'done' && data.files) {
      downloadAllSection.classList.remove('hidden');

      data.files.forEach(fileInfo => {
        const fileItem = fileItems.get(fileInfo.id);
        if (fileItem) {
          const progressFill = fileItem.querySelector('.progress-fill');
          progressFill.style.width = '100%';
          const downloadButton = fileItem.querySelector('.download-button');
          downloadButton.classList.remove('hidden');
          downloadButton.onclick = () => downloadFile(jobId, fileInfo.id, fileInfo.original);
        }
      });

      downloadAllButton.onclick = () => downloadAllFiles(jobId, data.files);
    } else if (data.status === 'error') {
      throw new Error(data.details || 'Une erreur est survenue pendant le traitement');
    } else {
      fileItems.forEach(fileItem => {
        const progressFill = fileItem.querySelector('.progress-fill');
        progressFill.style.width = '50%';
      });
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (error) {
    showError(error.message);
    dropzone.classList.remove('hidden');
  }
}

async function downloadFile(jobId, fileId, originalName) {
  try {
    const response = await fetch(`${API_BASE}/download/${jobId}/file/${fileId}`);
    if (!response.ok) throw new Error('Erreur lors du téléchargement');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    showError(`Erreur de téléchargement : ${error.message}`);
  }
}

async function downloadAllFiles(jobId, files) {
  if (!files || files.length === 0) {
    showError('Aucun fichier disponible');
    return;
  }

  for (const fileInfo of files) {
    await downloadFile(jobId, fileInfo.id, fileInfo.original);
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}
