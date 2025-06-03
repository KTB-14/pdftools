/* ------------- CONFIG ------------------------------------------------- */
const API_BASE = "/api";
const dropzone  = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const selectBtn = document.getElementById("selectFile");
const fileList  = document.getElementById("fileList");
const downloadAllButton  = document.getElementById("downloadAllButton");
const restartButton      = document.getElementById("restartButton");
const summaryDiv         = document.getElementById("summary");

/* ------------- HELPERS ------------------------------------------------ */
function generateUniqueId(){
  return Math.random().toString(36).substring(2,10) + Date.now().toString(36);
}

function formatFileSize(bytes){
  if (bytes === 0) return "0 Bytes";
  const k = 1024, sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ───────── NEW ─────────
// Cette fonction fait exactement la même chose (formatage),
// mais on la baptise `formatBytes` pour pouvoir l'utiliser
// quand on aura deux valeurs à afficher (avant → après).
function formatBytes(b){
  if (!b) return "0 B";
  const k = 1024, u = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(2) + " " + u[i];
}


/* ------------- UI ELEMENTS ------------------------------------------- */
function createFileItem(file, id){
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";

  /* Col 1 : infos */
  const infoDiv = document.createElement("div");
  infoDiv.className = "file-info";
  infoDiv.innerHTML = `
    <div class="file-name" title="${file.name}">${file.name}</div>
    <div class="file-size">${formatFileSize(file.size)}</div>
  `;

  /* Col 2 : statut + barre */
  const statusBlock = document.createElement("div");
  statusBlock.className = "status-block";
  statusBlock.innerHTML = `
    <div class="status-area">
      <span class="status-text uploading" aria-live="polite">Téléversement en cours…</span>
      <div class="spinner"></div>
      <div class="check-icon">✓</div>
    </div>
    <div class="progress-container">
      <div class="progress-fill" style="width:0%"></div>
    </div>
  `;

  /* Col 3 : bouton télécharger */
  const downloadButton = document.createElement("button");
  downloadButton.className = "button button-secondary download-button hidden";
  downloadButton.textContent = "Télécharger";
  downloadButton.dataset.fileId = id;
  downloadButton.dataset.original = file.name;

  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusBlock);
  fileItem.appendChild(downloadButton);

  return fileItem;
}

function resetInterface(){
  document.querySelectorAll('.status-text').forEach(el => el.remove());
  fileList.innerHTML = '';
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

async function uploadFiles(files){
  fileList.innerHTML = '';
  summaryDiv.classList.add('hidden');
  dropzone.classList.add('hidden');

  const fileItems = new Map();
  const fileIdMap = {};
  const formData = new FormData();

  for (const file of files) {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append('files', file);

    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name, sizeBefore: file.size });
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

async function beginProcessingPhase(fileItems, jobId){
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

async function checkStatus(jobId, fileItems){
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();

    if (data.status === 'done' && data.files) {
      const globalInfo = document.querySelector('.status-text.processing');
      if (globalInfo) {
        globalInfo.textContent = 'Traitement terminé ✓';
        globalInfo.className = 'status-text processed';
      }

      data.files.forEach(fileInfo => {        
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return;
        const { fileItem } = entry;

        const statusText = fileItem.querySelector('.status-text');
        const spinner = fileItem.querySelector('.spinner');
        const checkIcon = fileItem.querySelector('.check-icon');
        const downloadButton = fileItem.querySelector('.download-button');
        // Récupérer la taille avant (stockée dans fileItems) et la taille après (venue du back)
        const sizeDiv = fileItem.querySelector('.file-size');
        const originalBytes = entry.sizeBefore;
        const compressedBytes = fileInfo.size_after; // JSON renvoyé par le back
        sizeDiv.textContent = `${formatBytes(originalBytes)} → ${formatBytes(compressedBytes)}`;
        statusText.textContent = 'Traitement terminé ✓';
        statusText.className = 'status-text processed';
        spinner.style.display = 'none';
        checkIcon.classList.add('show');

        downloadButton.classList.remove('hidden');
        downloadButton.disabled = false;
        downloadButton.addEventListener('click', () => {
          downloadFile(jobId, fileInfo.id, fileInfo.original);
        });
      });

      summaryDiv.classList.remove('hidden');
      // Si un seul fichier : cacher bouton "Télécharger tous les fichiers"
      if (data.files.length <= 1) {
        downloadAllButton.style.display = 'none';
      } else {
        downloadAllButton.style.display = 'inline-block';
      }

      // Bind action      
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

async function downloadFile(jobId, fileId, originalName){
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

async function downloadAllFiles(jobId, files){
  for (const fileInfo of files) {
    await downloadFile(jobId, fileInfo.id, fileInfo.original);
  }
}

function showSummary(files){
  const ul = summaryDiv.querySelector('ul');
  ul.innerHTML = '';

  files.forEach(f => {
    const li = document.createElement('li');
    li.textContent = `${f.original}`;
    ul.appendChild(li);
  });
}

function showError(message){
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}
