const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const dropzone = document.getElementById('dropzone');
const fileStatusList = document.getElementById('fileStatusList');
const fileListContainer = document.getElementById('fileList');
const downloadAllContainer = document.getElementById('downloadAllContainer');
const downloadAllBtn = document.getElementById('downloadAllBtn');

let jobId = null;
let filesMap = new Map(); // clef = nom sans extension, valeur = { originalName, row, done, compressedName }

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

function createFileRow(filename) {
  const li = document.createElement('li');
  li.innerHTML = `
    <strong>${filename}</strong> — <span class="progress">En attente</span>
    <button class="btn hidden">Télécharger</button>
  `;
  fileStatusList.appendChild(li);
  return li;
}

function getStem(filename) {
  return filename.toLowerCase().replace(/\.pdf$/, '');
}

async function uploadFiles(fileList) {
  fileListContainer.classList.remove('hidden');
  fileStatusList.innerHTML = '';
  downloadAllContainer.classList.add('hidden');
  filesMap.clear();

  const formData = new FormData();
  for (const file of fileList) {
    if (file.type !== 'application/pdf') continue;

    const originalName = file.name;
    const stem = getStem(originalName);
    const row = createFileRow(originalName);

    formData.append('files', file);

    filesMap.set(stem, {
      original: originalName,
      row,
      done: false,
      compressed: null
    });
  }

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    alert("Erreur lors de l'envoi des fichiers.");
    return;
  }

  const data = await uploadRes.json();
  jobId = data.job_id;
  pollStatus();
}

async function pollStatus() {
  const res = await fetch(`/api/status/${jobId}`);
  if (!res.ok) {
    setTimeout(pollStatus, 2000);
    return;
  }

  const data = await res.json();
  if (!data.files || data.files.length === 0) {
    setTimeout(pollStatus, 2000);
    return;
  }

  for (const compressedName of data.files) {
    const baseStem = getStem(compressedName).replace('_compressed', '');
    for (const [originalStem, fileEntry] of filesMap.entries()) {
      if (fileEntry.done) continue;

      // Match souple : si le début du nom compressé ressemble au nom original
      if (baseStem.includes(originalStem) || originalStem.includes(baseStem)) {
        const span = fileEntry.row.querySelector(".progress");
        const btn = fileEntry.row.querySelector("button");

        span.textContent = "✅ Terminé";
        btn.classList.remove("hidden");
        btn.onclick = () => downloadFile(jobId, compressedName);

        fileEntry.done = true;
        fileEntry.compressed = compressedName;
        break;
      }
    }
  }

  const allDone = [...filesMap.values()].every(f => f.done);
  if (!allDone) {
    setTimeout(pollStatus, 2000);
  } else {
    downloadAllContainer.classList.remove("hidden");
    downloadAllBtn.onclick = () => {
      const filenames = [...filesMap.values()].map(f => f.compressed);
      downloadAllFiles(jobId, filenames);
    };
  }
}

async function downloadFile(jobId, filename) {
  const response = await fetch(`/api/download/${jobId}/${filename}`);
  if (!response.ok) {
    alert(`Erreur lors du téléchargement de ${filename}`);
    return;
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
}

async function downloadAllFiles(jobId, filenames) {
  for (const filename of filenames) {
    await downloadFile(jobId, filename);
  }
}
