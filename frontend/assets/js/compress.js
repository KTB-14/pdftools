const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const downloadDiv = document.getElementById('downloadLink');
const resultLink = document.getElementById('resultLink');

// Fonction pour formater la taille du fichier
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

selectBtn.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
  if (e.target.files.length) {
    uploadFile(e.target.files[0]);
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
    uploadFile(files[0]);
  }
});

async function uploadFile(file) {
  // Vérification du type de fichier
  if (file.type !== 'application/pdf') {
    showError('Seuls les fichiers PDF sont autorisés');
    return;
  }

  // Vérification de la taille
  if (file.size > 10 * 1024 * 1024) {
    showError(`Fichier trop volumineux (${formatFileSize(file.size)} > 10 MB)`);
    return;
  }

  try {
    statusDiv.classList.remove('hidden');
    statusText.innerHTML = `
      <div class="font-medium">Téléversement en cours...</div>
      <div class="text-sm text-gray-500">${file.name} (${formatFileSize(file.size)})</div>
    `;

    const formData = new FormData();
    formData.append('files', file);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error('Échec du téléversement');
    }

    const { job_id } = await uploadRes.json();
    await checkStatus(job_id);
  } catch (error) {
    showError(error.message);
  }
}

async function checkStatus(jobId) {
  try {
    statusText.innerHTML = `
      <div class="font-medium">Traitement en cours...</div>
      <div class="text-sm text-gray-500">Veuillez patienter pendant que nous traitons votre fichier</div>
    `;

    const response = await fetch(`/api/status/${jobId}`);
    const data = await response.json();

    if (data.status === 'done') {
      statusText.innerHTML = `
        <div class="font-medium text-green-600">Traitement terminé !</div>
        <div class="text-sm text-gray-500">Votre fichier est prêt à être téléchargé</div>
      `;
      downloadDiv.classList.remove('hidden');
      resultLink.href = `/api/download/${jobId}`;
    } else if (data.status === 'error') {
      throw new Error(data.details || 'Une erreur est survenue pendant le traitement');
    } else {
      setTimeout(() => checkStatus(jobId), 2000);
    }
  } catch (error) {
    showError(error.message);
  }
}

function showError(message) {
  statusDiv.classList.remove('hidden');
  statusText.innerHTML = `
    <div class="text-red-600 font-medium">Erreur</div>
    <div class="text-sm text-gray-500">${message}</div>
  `;
}