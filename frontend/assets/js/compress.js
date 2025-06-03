const API_BASE = "/api";
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const fileList = document.getElementById('fileList');
const downloadAllSection = document.getElementById('downloadAll');
const downloadAllButton = document.getElementById('downloadAllButton');
const restartButton = document.getElementById('restartButton');
const summaryDiv = document.getElementById('summary');

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

// Crée l’élément DOM pour chaque fichier
function createFileItem(file, id) {
  console.log('🧐 File envoyé à createFileItem :', file);
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';

  // Nom et taille avant traitement
  const infoDiv = document.createElement('div');
  infoDiv.className = 'file-info';
  infoDiv.innerHTML = `
    <div class="file-name">${file.name}</div>
    <div class="file-size" data-original-size="${file.size}">${formatFileSize(file.size)}</div>
  `;

  // Zone de progression + statut + spinner + check
  const statusDiv = document.createElement('div');
  statusDiv.className = 'status-area';
  statusDiv.innerHTML = `
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
    </div>
    <div class="status-text uploading">Téléversement en cours…</div>
    <div class="spinner"></div>
    <div class="check-icon">✓</div>
  `;

  // Bouton “Télécharger” (initialement masqué)
  const downloadButton = document.createElement('button');
  downloadButton.className = 'button button-secondary download-button hidden';
  downloadButton.textContent = 'Télécharger';
  downloadButton.dataset.fileId = id;
  downloadButton.dataset.original = file.name;

  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusDiv);
  fileItem.appendChild(downloadButton);
  return fileItem;
}

function resetInterface() {
  document.querySelectorAll('.status-text').forEach(el => el.remove());
  fileList.innerHTML = '';
  downloadAllSection.classList.add('hidden');
  summaryDiv.classList.add('hidden');
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
  summaryDiv.classList.add('hidden');
  dropzone.classList.add('hidden');

  const fileItems = new Map();
  const fileIdMap = {};
  const formData = new FormData();

  for (const file of files) {
    console.log("Nom du fichier :", file.name, "Taille détectée (bytes) :", file.size);
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append('files', file);

    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name });
  }
  formData.append('file_ids', JSON.stringify(fileIdMap));

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`, true);

  const startTime = Date.now();
  const globalInfo = document.createElement('div');
  globalInfo.className = 'status-text processing';
  globalInfo.textContent = 'Début du téléversement…';
  fileList.parentElement.insertBefore(globalInfo, fileList);

  xhr.upload.addEventListener('progress', (e) => {
    if (!e.lengthComputable) return;
    const percentComplete = (e.loaded / e.total) * 100;
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = e.loaded / elapsed;
    const remaining = (e.total - e.loaded) / speed;

    fileItems.forEach(({ fileItem }) => {
      const progressFill = fileItem.querySelector('.progress-fill');
      progressFill.style.width = `${percentComplete.toFixed(1)}%`;
    });
    globalInfo.textContent = `Téléversement : ${percentComplete.toFixed(1)} % — Temps estimé : ${Math.ceil(remaining)} s`;
  });

  xhr.onload = async function () {
    if (xhr.status === 200) {
      globalInfo.textContent = 'Téléversement terminé ✓';
      globalInfo.className = 'status-text uploaded';
      setTimeout(() => {
        beginProcessingPhase(fileItems, JSON.parse(xhr.responseText).job_id);
      }, 500);
    } else {
      showError('Erreur lors du téléversement');
      dropzone.classList.remove('hidden');
    }
  };

  xhr.onerror = function () {
    showError('Erreur réseau lors du téléversement');
    dropzone.classList.remove('hidden');
  };

  xhr.send(formData);
}

async function beginProcessingPhase(fileItems, jobId) {
  const globalInfo = document.querySelector('.status-text.uploaded');
  if (globalInfo) {
    globalInfo.textContent = 'Traitement en cours…';
    globalInfo.className = 'status-text processing';
  }

  fileItems.forEach(({ fileItem }) => {
    const statusText = fileItem.querySelector('.status-text');
    const spinner = fileItem.querySelector('.spinner');
    const checkIcon = fileItem.querySelector('.check-icon');

    statusText.textContent = 'Traitement en cours…';
    statusText.className = 'status-text processing';
    spinner.style.display = 'block';
    checkIcon.classList.remove('show');
  });

  await checkStatus(jobId, fileItems);
}

async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();

    if (data.status === 'done' && data.files) {
      data.files.forEach(fileInfo => {
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return;
        const { fileItem } = entry;

        const statusText = fileItem.querySelector('.status-text');
        const spinner = fileItem.querySelector('.spinner');
        const checkIcon = fileItem.querySelector('.check-icon');
        const downloadButton = fileItem.querySelector('.download-button');

        statusText.textContent = 'Traitement terminé ✓';
        statusText.className = 'status-text processed';
        spinner.style.display = 'none';
        checkIcon.classList.add('show');

        downloadButton.classList.remove('hidden');
        downloadButton.disabled = false;
        downloadButton.addEventListener('click', () => {
          downloadFile(jobId, fileInfo.id, fileInfo.original);
        });

        // ➔ Ici on met à jour la taille affichée
        const fileSizeElement = fileItem.querySelector('.file-size');
        const originalSize = parseInt(fileSizeElement.dataset.originalSize, 10);
        fileSizeElement.textContent = `${formatFileSize(originalSize)} → ${formatFileSize(fileInfo.size_after)}`;
      });

      downloadAllSection.classList.remove('hidden');
      downloadAllButton.onclick = () => downloadAllFiles(jobId, data.files);
      showSummary(data.files);

    } else if (data.status === 'error') {
      throw new Error(data.details || 'Erreur pendant le traitement');
    } else {
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (error) {
    showError(error.message);
    dropzone.classList.remove('hidden');
  }
}

async function downloadFile(jobId, fileId, originalName) {
  const selector = `.download-button[data-file-id="${fileId}"]`;
  const downloadButton = document.querySelector(selector);
  if (!downloadButton) return;

  const fileItem = downloadButton.closest('.file-item');
  const statusText = fileItem.querySelector('.status-text');
  const spinner = fileItem.querySelector('.spinner');
  const checkIcon = fileItem.querySelector('.check-icon');

  downloadButton.disabled = true;
  downloadButton.textContent = 'Téléchargement…';
  statusText.textContent = 'Téléchargement en cours…';
  statusText.className = 'status-text downloading';
  spinner.style.display = 'block';
  checkIcon.classList.remove('show');

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

    statusText.textContent = 'Téléchargement terminé ✓';
    statusText.className = 'status-text downloaded';
    spinner.style.display = 'none';
    checkIcon.classList.add('show');

    // ✅ On réactive le bouton pour téléchargement multiple
    downloadButton.disabled = false;
    downloadButton.textContent = 'Télécharger à nouveau';
  } catch (error) {
    statusText.textContent = 'Erreur de téléchargement';
    statusText.className = 'status-text';
    showError(`Erreur de téléchargement : ${error.message}`);
    downloadButton.disabled = false;
    downloadButton.textContent = 'Télécharger';
  }
}

async function downloadAllFiles(jobId, files) {
  for (const fileInfo of files) {
    await downloadFile(jobId, fileInfo.id, fileInfo.original);
  }
}

function showSummary(files) {
  summaryDiv.innerHTML = '';
  summaryDiv.classList.remove('hidden');
  const heading = document.createElement('h2');
  heading.textContent = 'Résumé des fichiers traités :';
  summaryDiv.appendChild(heading);

  const ul = document.createElement('ul');
  files.forEach(f => {
    const li = document.createElement('li');
    li.textContent = `${f.original}`;
    ul.appendChild(li);
  });
  summaryDiv.appendChild(ul);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}
