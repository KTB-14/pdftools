/**
 * compress.js
 * 
 * Script de gestion du téléversement (upload), du suivi de statut, et du téléchargement.
 * 
 * Le déroulé :
 * 1. L'utilisateur sélectionne ou glisse-dépose ses fichiers (PDF uniquement).
 * 2. On affiche un spinner et une barre de progression pendant le téléversement (XHR).
 * 3. Une fois l’upload terminé, on lance le polling sur /status/{jobId} pour suivre le traitement OCR.
 * 4. Lorsque le traitement est terminé, on active le bouton “Télécharger” à côté de chaque fichier,
 *    on affiche la nouvelle taille, on active “Télécharger tous les fichiers”.
 * 5. Lorsqu’on clique sur “Télécharger” ou “Télécharger tous”, on effectue un fetch() + Blob + a.click()
 *    en affichant le spinner jusqu’à la fin du téléchargement, puis on réactive le bouton.
 */

const API_BASE        = "/api";
const dropzone        = document.getElementById("dropzone");
const fileInput       = document.getElementById("fileInput");
const selectBtn       = document.getElementById("selectFile");
const fileList        = document.getElementById("fileList");
const globalStatus    = document.getElementById("globalStatus");
const actionBar       = document.getElementById("actionBar");
const downloadAllBtn  = document.getElementById("downloadAllButton");
const restartBtn      = document.getElementById("restartButton");
const summaryDiv      = document.getElementById("summary");

/**
 * Génère un identifiant unique (chaîne alphanumérique).
 */
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Convertit une taille (en octets) en quelque-chose de lisible (Bytes, KB, MB, GB).
 */
function formatFileSize(bytes) {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Crée et retourne l’élément DOM correspondant à un fichier avant/après traitement.
 *
 * @param {File} file       - Le fichier local sélectionné (avant upload).
 * @param {string} id       - L’identifiant unique généré pour ce fichier.
 * @returns {HTMLElement}   - La <div class="file-item"> construite.
 */
function createFileItem(file, id) {
  // Conteneur principal
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";
  fileItem.dataset.fileStatus = "uploading"; // "uploading", "processing", "processed"

  // Colonne 1 : Nom + taille d’origine
  const infoDiv = document.createElement("div");
  infoDiv.className = "file-info";
  infoDiv.innerHTML = `
    <div class="file-name">${file.name}</div>
    <div class="file-size" data-original-size="${file.size}">
      ${formatFileSize(file.size)}
    </div>
  `;

  // Colonne 2 : Zone de progression + status text + spinner + check
  const statusDiv = document.createElement("div");
  statusDiv.className = "status-area";
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

  // Colonne 3 : Bouton Télécharger (initialement masqué)
  const downloadButton = document.createElement("button");
  downloadButton.className = "button button-secondary download-button hidden";
  downloadButton.textContent = "Télécharger";
  downloadButton.dataset.fileId = id;
  downloadButton.dataset.original = file.name;
  downloadButton.disabled = true; // sera activé après traitement

  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusDiv);
  fileItem.appendChild(downloadButton);

  return fileItem;
}

/**
 * Réinitialise l’interface pour un nouvel envoi :
 * - Vide la liste des fichiers.
 * - Masque le résumé final.
 * - Réaffiche la dropzone.
 * - Désactive le bouton “Télécharger tous les fichiers”.
 * - Masque le texte globalStatus.
 */
function resetInterface() {
  // Efface tout le contenu de fileList
  fileList.innerHTML = "";

  // Réinitialise les statuts globaux
  globalStatus.classList.add("hidden");
  globalStatus.textContent = "";

  // Masque résumé
  summaryDiv.classList.add("hidden");
  summaryDiv.innerHTML = "";

  // Masque “Télécharger tous” ou désactive-le
  downloadAllBtn.disabled = true;

  // Réaffiche la dropzone
  dropzone.classList.remove("hidden");

  // Vide l’input file
  fileInput.value = "";

  // Supprime tout message d’erreur éventuel
  document.querySelectorAll(".error-message").forEach(e => e.remove());
}

/**
 * Gestion du clic sur “Sélectionner un ou plusieurs fichiers”.
 */
selectBtn.onclick = () => {
  fileInput.click();
};

/**
 * Gestion du clic sur “Recommencer”.
 */
restartBtn.onclick = resetInterface;

/**
 * Quand l’utilisateur choisit un fichier via l’input.
 */
fileInput.onchange = (e) => {
  if (e.target.files.length) {
    uploadFiles(e.target.files);
  }
};

/**
 * Interaction “Drag & Drop” sur la dropzone :
 * - Change la classe “hover” pour l’effet visuel.
 * - Lorsque l’on drop des fichiers, on appelle uploadFiles().
 */
["dragenter", "dragover"].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("hover");
  });
});
["dragleave", "drop"].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("hover");
  });
});
dropzone.addEventListener("drop", e => {
  const files = e.dataTransfer.files;
  if (files.length) {
    uploadFiles(files);
  }
});

/**
 * uploadFiles(files)
 *
 * - Masque la dropzone, affiche la liste de “file-item” pour chaque fichier.
 * - Initialise un XHR pour l’upload (afin d’afficher le % global).
 * - Dès que l’upload XHR est terminé, appelle beginProcessingPhase() pour suivre le statut OCR.
 *
 * @param {FileList|File[]} files
 */
async function uploadFiles(files) {
  // 1) Réinitialisation visuelle
  fileList.innerHTML = "";
  globalStatus.classList.remove("hidden");
  globalStatus.classList.remove("processed", "downloaded");
  globalStatus.classList.add("processing");
  globalStatus.textContent = "Téléversement en cours…";
  summaryDiv.classList.add("hidden");
  summaryDiv.innerHTML = "";
  downloadAllBtn.disabled = true;
  dropzone.classList.add("hidden");

  // 2) Création des file-items et préparation du FormData
  const fileItems = new Map(); // clé = id, valeur = { fileItem, fileName }
  const fileIdMap = {};        // clé = nom original, valeur = id
  const formData = new FormData();

  for (const file of files) {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append("files", file);

    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name });
  }
  formData.append("file_ids", JSON.stringify(fileIdMap));

  // 3) Lancement du XHR pour le téléversement
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API_BASE}/upload`, true);

  const startTime = Date.now();

  // Événement “progress” de l’upload : mise à jour de toutes les barres
  xhr.upload.addEventListener("progress", (e) => {
    if (!e.lengthComputable) return;
    const percentComplete = (e.loaded / e.total) * 100;
    const elapsed = (Date.now() - startTime) / 1000;    // secondes écoulées
    const speed = e.loaded / elapsed;                   // octets/seconde
    const remaining = Math.ceil((e.total - e.loaded) / speed); // sec restantes

    // Mise à jour de la barre de chaque file-item
    fileItems.forEach(({ fileItem }) => {
      const progressFill = fileItem.querySelector(".progress-fill");
      progressFill.style.width = `${percentComplete.toFixed(1)}%`;
    });

    // Texte global
    globalStatus.textContent = `Téléversement : ${percentComplete.toFixed(1)} % — Temps estimé : ${remaining}s`;
  });

  // Événement “load” XHR (upload terminé)
  xhr.onload = async function () {
    if (xhr.status === 200) {
      globalStatus.textContent = "Téléversement terminé ✓";
      globalStatus.classList.remove("processing");
      globalStatus.classList.add("processed");

      // Court délai avant de passer à l’étape “traitement”
      setTimeout(() => {
        beginProcessingPhase(fileItems, JSON.parse(xhr.responseText).job_id);
      }, 300);

    } else {
      showError("Erreur lors du téléversement");
      dropzone.classList.remove("hidden");
      globalStatus.classList.add("error");
      globalStatus.textContent = "Erreur de téléversement";
    }
  };

  xhr.onerror = function () {
    showError("Erreur réseau lors du téléversement");
    dropzone.classList.remove("hidden");
    globalStatus.classList.add("error");
    globalStatus.textContent = "Erreur réseau";
  };

  xhr.send(formData);
}

/**
 * beginProcessingPhase(fileItems, jobId)
 *
 * - Met à jour le texte global pour “Traitement en cours…”.
 * - Modifie chaque file-item pour indiquer le statut “processing”.
 * - Cache le spinner initial (upload) et fait apparaître le spinner de traitement si besoin.
 * - Démarre le polling via checkStatus().
 *
 * @param {Map<string, {fileItem:HTMLElement, fileName:string}>} fileItems
 * @param {string} jobId
 */
async function beginProcessingPhase(fileItems, jobId) {
  // Texte global
  globalStatus.textContent = "Traitement en cours…";
  globalStatus.classList.remove("processed");
  globalStatus.classList.add("processing");

  // Pour chaque file-item, on passe en “processing”
  fileItems.forEach(({ fileItem }) => {
    fileItem.dataset.fileStatus = "processing";
    const statusText = fileItem.querySelector(".status-text");
    const spinner    = fileItem.querySelector(".spinner");
    const checkIcon  = fileItem.querySelector(".check-icon");

    statusText.textContent = "Traitement en cours…";
    statusText.className   = "status-text processing";
    spinner.style.display  = "block";
    checkIcon.classList.remove("show");
    // On garde la barre de progression pleine (100%) après upload
    const progressFill = fileItem.querySelector(".progress-fill");
    progressFill.style.width = "100%";
  });

  // Démarre le polling sur /status/{jobId}
  await checkStatus(jobId, fileItems);
}

/**
 * checkStatus(jobId, fileItems)
 *
 * - Interroge /api/status/{jobId}.
 * - Si “done” avec files[], on met à jour chaque file-item :
 *     • statut “Traitement terminé” + couleur verte.
 *     • On récupère size_after (octets) pour l’afficher.
 *     • On active le bouton “Télécharger” pour chaque fichier.
 * - On active aussi “Télécharger tous les fichiers”.
 * - Sinon, on attend 2 secondes puis on ré-appelle checkStatus().
 *
 * @param {string} jobId
 * @param {Map<string, {fileItem:HTMLElement, fileName:string}>} fileItems
 */
async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    if (!response.ok) {
      throw new Error(`Statut HTTP : ${response.status}`);
    }
    const data = await response.json();

    if (data.status === "done" && Array.isArray(data.files)) {
      // Mise à jour globale
      globalStatus.textContent = "Traitement terminé ✓";
      globalStatus.classList.remove("processing");
      globalStatus.classList.add("processed");

      // Pour chaque fichier traité
      data.files.forEach(fileInfo => {
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return;
        const { fileItem } = entry;

        // 1) Changer le statut du file-item
        fileItem.dataset.fileStatus = "processed";
        const statusText  = fileItem.querySelector(".status-text");
        const spinner     = fileItem.querySelector(".spinner");
        const checkIcon   = fileItem.querySelector(".check-icon");
        const downloadBtn = fileItem.querySelector(".download-button");
        const fileSizeEl  = fileItem.querySelector(".file-size");

        statusText.textContent = "Traitement terminé ✓";
        statusText.className   = "status-text processed";
        spinner.style.display  = "none";
        checkIcon.classList.add("show");

        // 2) Mise à jour de la taille : “<ancienne> → <nouvelle>”
        const originalSize = parseInt(fileSizeEl.dataset.originalSize, 10);
        const afterSize    = fileInfo.size_after || 0;
        fileSizeEl.textContent = `${formatFileSize(originalSize)} → ${formatFileSize(afterSize)}`;

        // 3) Activer et afficher le bouton “Télécharger”
        downloadBtn.classList.remove("hidden");
        downloadBtn.disabled = false;

        // Lorsque l’on clique dessus, on appelle downloadFile()
        downloadBtn.onclick = () => {
          downloadFile(jobId, fileInfo.id, fileInfo.original);
        }
      });

      // 4) Activer “Télécharger tous les fichiers”
      downloadAllBtn.disabled = false;
      downloadAllBtn.onclick = () => {
        downloadAllFiles(jobId, data.files);
      };

      // 5) Afficher le résumé final
      showSummary(data.files);

    } else if (data.status === "error") {
      throw new Error(data.details || "Erreur pendant le traitement");
    } else {
      // Pas encore terminé → on patiente 2 secondes
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (err) {
    showError(err.message);
    globalStatus.textContent = "Erreur de statut";
    globalStatus.classList.add("error");
    dropzone.classList.remove("hidden");
  }
}

/**
 * downloadFile(jobId, fileId, originalName)
 *
 * - Désactive et change le texte du bouton “Télécharger” pour indiquer “Téléchargement en cours…”.
 * - Affiche le spinner et masque le ✓.
 * - Envoie un fetch() pour récupérer le PDF compressé.
 * - Crée un Blob et déclenche le download “a.click()” côté client.
 * - Lorsque terminé, change le statut en “Téléchargement terminé ✓” et réactive le bouton.
 *
 * @param {string} jobId
 * @param {string} fileId
 * @param {string} originalName
 */
async function downloadFile(jobId, fileId, originalName) {
  const selector = `.download-button[data-file-id="${fileId}"]`;
  const downloadBtn = document.querySelector(selector);
  if (!downloadBtn) return;

  const fileItem = downloadBtn.closest(".file-item");
  const statusText = fileItem.querySelector(".status-text");
  const spinner    = fileItem.querySelector(".spinner");
  const checkIcon  = fileItem.querySelector(".check-icon");

  // Mise à jour visuelle avant fetch
  downloadBtn.disabled = true;
  downloadBtn.textContent = "Téléchargement…";
  statusText.textContent = "Téléchargement en cours…";
  statusText.className = "status-text downloading";
  spinner.style.display = "block";
  checkIcon.classList.remove("show");

  try {
    const response = await fetch(`${API_BASE}/download/${jobId}/file/${fileId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Lorsque le téléchargement est terminé
    statusText.textContent = "Téléchargement terminé ✓";
    statusText.className   = "status-text downloaded";
    spinner.style.display  = "none";
    checkIcon.classList.add("show");

    downloadBtn.disabled = false;
    downloadBtn.textContent = "Télécharger à nouveau";

  } catch (err) {
    statusText.textContent = "Erreur de téléchargement";
    statusText.className   = "status-text";
    showError(`Erreur de téléchargement : ${err.message}`);
    downloadBtn.disabled   = false;
    downloadBtn.textContent = "Télécharger";
  }
}

/**
 * downloadAllFiles(jobId, filesArray)
 *
 * - Appelle séquentiellement downloadFile() pour chaque fichier du tableau “files”.
 * - “files” est l’array renvoyé par /status avec {id, original, size_after, …}.
 *
 * @param {string} jobId
 * @param {Array} filesArray
 */
async function downloadAllFiles(jobId, filesArray) {
  for (const fileInfo of filesArray) {
    await downloadFile(jobId, fileInfo.id, fileInfo.original);
  }
}

/**
 * showSummary(filesArray)
 *
 * - Affiche la liste des noms de fichiers traités (final) dans #summary.
 * - Met en évidence une section “Résumé” sous la liste.
 *
 * @param {Array} filesArray
 */
function showSummary(filesArray) {
  summaryDiv.innerHTML = "";
  summaryDiv.classList.remove("hidden");

  const heading = document.createElement("h2");
  heading.textContent = "Résumé des fichiers traités :";
  summaryDiv.appendChild(heading);

  const ul = document.createElement("ul");
  filesArray.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f.original;
    ul.appendChild(li);
  });
  summaryDiv.appendChild(ul);
}

/**
 * showError(message)
 *
 * - Ajoute un <div class="error-message"> sous la liste pour informer l’utilisateur.
 * - L’erreur peut provenir de l’upload, du polling, du téléchargement, etc.
 */
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}

