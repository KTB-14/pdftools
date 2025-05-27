const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectFile');
const statusDiv = document.getElementById('status');
const fileList = document.getElementById('fileList');
const downloadAllDiv = document.getElementById('downloadAll');
const downloadAllBtn = document.getElementById('downloadAllBtn');

let filesMap = new Map(); // { filename: { status, job_id, ready } }

selectBtn.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
  if (e.target.files.length) {
    handleFiles([...e.target.files]);
  }
};

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.add('hover');
  });
});

['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove('hover');
  });
});

dropzone.addEventListener('drop', e => {
  const files = [...e.dataTransfer.files];
  if (files.length) {
    handleFiles(files);
  }
});

function handleFiles(files) {
  statusDiv.classList.remove('hidden');
  downloadAllDiv.classList.add('hidden');
  fileList.innerHTML = '';
  filesMap.clear();

  for (const file of files) {
    if (file.type !== 'application/pdf') {
      addStatusLine(file.name, '❌ Format non supporté', 'red');
      continue;
    }
    const id = crypto.randomUUID();
    filesMap.set(id, { file, status: 'En attente', ready: false, name: file.name });
    addStatusLine(id, `⏳ Téléversement de ${file.name}...`);
    uploadFile(id, file);
  }
}

function addStatusLine(id, text, color = 'black', downloadUrl = null) {
  let item = document.getElementById(id);
  if (!item) {
    item = document.createElement('li');
    item.id = id;
    fileList.appendChild(item);
  }
  item.innerHTML = `<span style="color:${color}">${text}</span>`;
  if (downloadUrl) {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    a.textContent = '📥 Télécharger';
    a.style.marginLeft = '1rem';
    item.appendChild(a);
  }
}

async function uploadFile(id, file) {
  const formData = new FormData();
  formData.append('files', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Erreur de téléversement');
    const { job_id } = await res.json();
    filesMap.get(id).job_id = job_id;

    addStatusLine(id, `🛠️ Traitement en cours pour ${file.name}...`);
    checkStatus(id, job_id, file.name);
  } catch (err) {
    addStatusLine(id, `❌ Erreur pour ${file.name} : ${err.message}`, 'red');
  }
}

async function checkStatus(id, jobId, filename) {
  try {
    const res = await fetch(`/api/status/${jobId}`);
    const data = await res.json();

    if (data.status === 'done') {
      const outputFiles = data.files || [];
      const expected = outputFiles.find(f => f.includes(filename.split('.pdf')[0]));
      const url = `/api/download/${jobId}/${expected}`;

      filesMap.get(id).ready = true;
      addStatusLine(id, `✅ ${filename} prêt`, 'green', url);

      checkIfAllReady();
    } else if (data.status === 'error') {
      addStatusLine(id, `❌ Erreur pendant le traitement : ${data.details}`, 'red');
    } else {
      setTimeout(() => checkStatus(id, jobId, filename), 2000);
    }
  } catch (err) {
    addStatusLine(id, `❌ Erreur de suivi : ${err.message}`, 'red');
  }
}

function checkIfAllReady() {
  const allReady = [...filesMap.values()].every(entry => entry.ready);
  if (allReady && filesMap.size > 1) {
    downloadAllDiv.classList.remove('hidden');
  }
}

downloadAllBtn.onclick = () => {
  for (const entry of filesMap.values()) {
    if (entry.ready) {
      const expectedName = entry.file.name.replace('.pdf', '_compressed.pdf');
      const link = document.createElement('a');
      link.href = `/api/download/${entry.job_id}/${expectedName}`;
      link.download = expectedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
