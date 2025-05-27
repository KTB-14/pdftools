const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const fileStatusList = document.getElementById('fileStatusList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadAllContainer = document.getElementById('downloadAllContainer');

let jobId = null;

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

selectBtn.onclick = () => fileInput.click();
fileInput.setAttribute('multiple', true);

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
    statusDiv.classList.remove('hidden');
    statusText.innerHTML = `
      <div class="font-medium">Téléversement de ${files.length} fichiers...</div>
    `;

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Échec du téléversement');

    const data = await uploadRes.json();
    jobId = data.job_id;
    statusText.innerHTML = `<div class="font-medium">Traitement en cours...</div>`;

    fileStatusList.classList.remove('hidden');
    fileStatusList.innerHTML = '';

    // Affichage initial de la liste
    Array.from(files).forEach(file => {
      const li = document.createElement('li');
      li.id = `file-${file.name}`;
      li.innerHTML = `
        <span class="progress">${file.name}</span>
        <button class="hidden">Télécharger</button>
      `;
      fileStatusList.appendChild(li);
    });

    await pollStatus();
  } catch (err) {
    statusText.innerHTML = `<div class="text-red-600 font-medium">Erreur : ${err.message}</div>`;
  }
}

async function pollStatus() {
  if (!jobId) return;

  try {
    const res = await fetch(`/api/status/${jobId}`);
    const data = await res.json();

    if (data.status === 'done' && Array.isArray(data.files)) {
      let allDone = true;

      data.files.forEach(filename => {
        const li = document.getElementById(`file-${filename.replace('_compressed.pdf', '.pdf')}`);
        if (!li) return;

        const progress = li.querySelector('.progress');
        const button = li.querySelector('button');

        progress.innerText = `${filename} – 100% ✅`;
        button.classList.remove('hidden');
        button.onclick = () => downloadFile(`/api/download/${jobId}?file=${encodeURIComponent(filename)}`);
      });

      downloadAllContainer.classList.remove('hidden');
      downloadAllBtn.onclick = () => {
        data.files.forEach(filename => {
          downloadFile(`/api/download/${jobId}?file=${encodeURIComponent(filename)}`);
        });
      };

    } else if (data.status === 'error') {
      statusText.innerHTML = `<div class="text-red-600 font-medium">Erreur : ${data.details}</div>`;
    } else {
      // Pas encore fini
      setTimeout(pollStatus, 2000);
    }
  } catch (err) {
    console.error("Erreur polling :", err);
    setTimeout(pollStatus, 3000);
  }
}

function downloadFile(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
