const API_BASE = "/api";  // <= impératif : slash devant “api”
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

// Crée l’élément DOM pour chaque fichier, en recevant aussi l’ID unique
// (on passe désormais `id` en paramètre, pas seulement `file`)
function createFileItem(file, id) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';

  // Nom + taille
  const infoDiv = document.createElement('div');
  infoDiv.className = 'file-info';
  infoDiv.innerHTML = `
    <div class="file-name">${file.name}</div>
    <div class="file-size">${formatFileSize(file.size)}</div>
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

  // Bouton “Télécharger” (toujours présent dans le DOM, mais invisible via .hidden)
  const downloadButton = document.createElement('button');
  downloadButton.className = 'button button-secondary download-button hidden';
  downloadButton.textContent = 'Télécharger';

  // =======> ON STOCKE l’ID du fichier dans data-id, pour retrouver facilement après
  downloadButton.dataset.fileId = id;
  // On peut aussi stocker le nom original dans data-original, si besoin
  downloadButton.dataset.original = file.name;

  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusDiv);
  fileItem.appendChild(downloadButton);
  return fileItem;
}

function resetInterface() {
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

  const fileItems = new Map(); // Clé = fileId, Valeur = élément DOM
  const fileIdMap = {};       // Clé = nomOriginal, Valeur = fileId

  // On crée les éléments <div class="file-item">, on collecte dans FormData…
  const formData = new FormData();
  for (const file of files) {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append('files', file);

    // Now, PASSER l’ID en plus du fichier
    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name });
  }
  formData.append('file_ids', JSON.stringify(fileIdMap));

  // =========> Ça reste un XMLHttpRequest pour suivre l’avancement Upload
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`, true);

  const startTime = Date.now();

  // Un petit message général “Début du téléversement…”
  const globalInfo = document.createElement('div');
  globalInfo.className = 'status-text processing';
  globalInfo.textContent = 'Début du téléversement…';
  fileList.parentElement.insertBefore(globalInfo, fileList);

  xhr.upload.addEventListener('progress', (e) => {
    if (!e.lengthComputable) return;
    const percentComplete = (e.loaded / e.total) * 100;
    const elapsed = (Date.now() - startTime) / 1000; // en secondes
    const speed = e.loaded / elapsed;                 // octets/seconde
    const remaining = (e.total - e.loaded) / speed;   // secondes restantes

    // On met à jour la barre « globale » pour chaque fileItem
    fileItems.forEach(({ fileItem }) => {
      const progressFill = fileItem.querySelector('.progress-fill');
      progressFill.style.width = `${percentComplete.toFixed(1)}%`;
    });

    // Message “Téléversement : XX % — Temps estimé : YY s”
    globalInfo.textContent = `Téléversement : ${percentComplete.toFixed(1)} % — Temps estimé : ${Math.ceil(remaining)} s`;
  });

  xhr.onload = async function () {
    if (xhr.status === 200) {
      globalInfo.textContent = 'Téléversement terminé ✓';
      globalInfo.className = 'status-text uploaded';

      // Dès que l’upload est OK, on passe à “Traitement en cours…”
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
  // Remplacer le message global “Upload ✓” → “Traitement en cours…”
  const globalInfo = document.querySelector('.status-text.uploaded');
  if (globalInfo) {
    globalInfo.textContent = 'Traitement en cours…';
    globalInfo.className = 'status-text processing';
  }

  // Pour chaque fichier, on change le texte + on affiche le spinner
  fileItems.forEach(({ fileItem }) => {
    const statusText = fileItem.querySelector('.status-text');
    const spinner = fileItem.querySelector('.spinner');
    const checkIcon = fileItem.querySelector('.check-icon');

    statusText.textContent = 'Traitement en cours…';
    statusText.className = 'status-text processing';
    spinner.style.display = 'block';
    checkIcon.classList.remove('show');
  });

  // Lancer le polling sur /status/<jobId>
  await checkStatus(jobId, fileItems);
}

async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();

    if (data.status === 'done' && data.files) {
      // Dès que le backend renvoie status="done", on itère sur chaque {id, original, output}
      data.files.forEach(fileInfo => {
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return; 
        const { fileItem } = entry;

        const statusText = fileItem.querySelector('.status-text');
        const spinner = fileItem.querySelector('.spinner');
        const checkIcon = fileItem.querySelector('.check-icon');
        const downloadButton = fileItem.querySelector('.download-button');

        // Statut “Traitement terminé ✓”
        statusText.textContent = 'Traitement terminé ✓';
        statusText.className = 'status-text processed';
        spinner.style.display = 'none';
        checkIcon.classList.add('show');

        // =========> On rend le bouton visible, puis on rattache directement un addEventListener
        downloadButton.classList.remove('hidden');
        downloadButton.disabled = false;

        // ATTENTION : ici on utilise le data-attrib “data-file-id” et “data-original”
        downloadButton.addEventListener('click', () => {
          downloadFile(jobId, fileInfo.id, fileInfo.original);
        });
      });

      // Afficher le bouton “Télécharger tous les fichiers”
      downloadAllSection.classList.remove('hidden');
      downloadAllButton.onclick = () => downloadAllFiles(jobId, data.files);

      // Résumé final
      showSummary(data.files);

    } else if (data.status === 'error') {
      throw new Error(data.details || 'Erreur pendant le traitement');
    } else {
      // Si le job n’est pas encore done, on relance dans 2 s
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (error) {
    showError(error.message);
    dropzone.classList.remove('hidden');
  }
}

async function downloadFile(jobId, fileId, originalName) {
  // On repère directement le bouton qui a data-file-id = fileId
  const selector = `.download-button[data-file-id="${fileId}"]`;
  const downloadButton = document.querySelector(selector);
  if (!downloadButton) return;

  // On retrouve la ligne complète (= parent .file-item)
  const fileItem = downloadButton.closest('.file-item');
  const statusText = fileItem.querySelector('.status-text');
  const spinner = fileItem.querySelector('.spinner');
  const checkIcon = fileItem.querySelector('.check-icon');

  // On passe en “Téléchargement en cours…”
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

    // Statut “Téléchargement terminé ✓”
    statusText.textContent = 'Téléchargement terminé ✓';
    statusText.className = 'status-text downloaded';
    spinner.style.display = 'none';
    checkIcon.classList.add('show');
    downloadButton.textContent = 'Téléchargement ✓';
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
