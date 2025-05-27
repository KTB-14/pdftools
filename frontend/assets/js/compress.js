const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const fileStatusList = document.getElementById('fileStatusList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadAllContainer = document.getElementById('downloadAllContainer');

let jobId = null;

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
    // Affichage initial
    dropzone.querySelector('p').innerText = `Traitement de ${files.length} fichier(s)...`;
    fileStatusList.innerHTML = '';
    fileStatusList.classList.remove('hidden');

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
      const li = document.createElement('li');
      li.id = `file-${file.name}`;
      li.innerHTML = `
        <span class="progress">${file.name} – en attente...</span>
        <button class="hidden">Télécharger</button>
      `;
      fileStatusList.appendChild(li);
    });

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) throw new Error("Erreur lors du téléversement.");

    const data = await uploadRes.json();
    jobId = data.job_id;

    pollStatus();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
}

async function pollStatus() {
  if (!jobId) return;

  try {
    const res = await fetch(`/api/status/${jobId}`);
    const data = await res.json();

    if (data.status === 'done' && Array.isArray(data.files)) {
      data.files.forEach(filename => {
        const originalName = filename.replace('_compressed.pdf', '.pdf');
        const li = document.getElementById(`file-${originalName}`);
        if (!li) return;

        const progress = li.querySelector('.progress');
        const button = li.querySelector('button');

        progress.innerText = `${filename} – 100% ✅`;
        button.classList.remove('hidden');
        button.onclick = () => downloadFile(`/api/download/${jobId}/${encodeURIComponent(filename)}`);
      });

      downloadAllContainer.classList.remove('hidden');
      downloadAllBtn.onclick = () => {
        data.files.forEach(filename => {
          downloadFile(`/api/download/${jobId}/${encodeURIComponent(filename)}`);
        });
      };

    } else if (data.status === 'error') {
      alert("Erreur : " + data.details);
    } else {
      setTimeout(pollStatus, 2000);
    }
  } catch (err) {
    console.error("Erreur dans pollStatus :", err);
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
