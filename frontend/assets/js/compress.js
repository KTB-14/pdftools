const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const downloadDiv = document.getElementById('downloadLink');
const resultLink = document.getElementById('resultLink');

selectBtn.onclick = () => fileInput.click();
fileInput.onchange = () => uploadFile(fileInput.files[0]);

;['dragenter','dragover'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.add('hover');
  });
});
;['dragleave','drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove('hover');
  });
});
dropzone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
});

async function uploadFile(file) {
  if (!file.type === 'application/pdf') return alert('Seuls les PDF sont autorisés.');
  if (file.size > 50 * 1024 * 1024) return alert('Fichier trop volumineux (>50 Mo).');

  statusDiv.classList.remove('hidden');
  statusText.textContent = 'Téléversement…';

  // 1. upload
  const form = new FormData();
  form.append('files', file);

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: form
  });
  if (!uploadRes.ok) return showError('Échec téléversement.');

  const { job_id } = await uploadRes.json();
  checkStatus(job_id);
}

async function checkStatus(jobId) {
  statusText.textContent = 'Traitement en cours…';
  const res = await fetch(`/api/status/${jobId}`);
  const { status, details } = await res.json();

  if (status === 'done') {
    statusText.textContent = 'Terminé !';
    downloadDiv.classList.remove('hidden');
    resultLink.href = `/api/download/${jobId}`;
  } else if (status === 'error') {
    showError(details || 'Erreur pendant le traitement.');
  } else {
    setTimeout(() => checkStatus(jobId), 2000);
  }
}

function showError(msg) {
  statusText.textContent = `❌ ${msg}`;
}
