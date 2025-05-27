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
  try {
    // Réinitialisation
    statusDiv.classList.remove('hidden');
    downloadDiv.classList.add('hidden');
    statusText.innerHTML = `
      <div class="font-medium">Téléversement en cours...</div>
      <div class="text-sm text-gray-500">Nombre de fichiers : ${files.length}</div>
    `;

    const formData = new FormData();
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        showError('Tous les fichiers doivent être au format PDF');
        return;
      }
      formData.append('files', file);
    }

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

// Suivi de traitement OCR
async function checkStatus(jobId) {
  try {
    statusText.innerHTML = `
      <div class="font-medium">Traitement en cours...</div>
      <div class="text-sm text-gray-500">Veuillez patienter...</div>
    `;

    const response = await fetch(`/api/status/${jobId}`);
    const data = await response.json();
    console.log("🟢 Données status reçues :", data);

    if (data.status === 'done') {
      // Masquer le spinner
      statusDiv.classList.add('hidden');

      // Afficher le bouton
      downloadDiv.classList.remove('hidden');
      downloadDiv.style.display = 'block';

      // Lancer le téléchargement automatiquement
      downloadAllFiles(jobId, data.files);
      resultLink.onclick = null;

    } else if (data.status === 'error') {
      throw new Error(data.details || 'Une erreur est survenue pendant le traitement');
    } else {
      setTimeout(() => checkStatus(jobId), 2000);
    }
  } catch (error) {
    showError(error.message);
  }
}

// En cas d'erreur
function showError(message) {
  statusDiv.classList.remove('hidden');
  statusText.innerHTML = `
    <div class="text-red-600 font-medium">Erreur</div>
    <div class="text-sm text-gray-500">${message}</div>
  `;
}

// Téléchargement de tous les fichiers
async function downloadAllFiles(jobId, files) {
  if (!files || files.length === 0) {
    alert("Aucun fichier disponible à télécharger.");
    return;
  }

  for (const filename of files) {
    try {
      const response = await fetch(`/api/download/${jobId}/${filename}`);
      if (!response.ok) {
        console.error(`Erreur de téléchargement pour ${filename}`);
        continue;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Téléchargement échoué pour : " + filename, e);
    }
  }
}
