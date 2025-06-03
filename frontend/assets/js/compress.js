/**
 * compress.js
 * 
 * Front‐end JavaScript gérant :
 *  - Sélection & glisser-déposer des fichiers
 *  - Upload AJAX avec progression (xhr)
 *  - Polling de /status pour afficher l’état “traitement”
 *  - Téléchargement de chaque fichier (xhr + progression visuelle)
 *  - Affichage de la taille originale → taille compressée
 *  - Affichage d’un résumé final
 */

/* =================================================
   Sélection des éléments du DOM
================================================= */
const API_BASE           = "/api";
const dropzone           = document.getElementById("dropzone");
const fileInput          = document.getElementById("fileInput");
const selectBtn          = document.getElementById("selectFile");
const fileList           = document.getElementById("fileList");
const downloadAllSection = document.getElementById("downloadAll");
const downloadAllButton  = document.getElementById("downloadAllButton");
const restartButton      = document.getElementById("restartButton");
const summaryDiv         = document.getElementById("summary");
const actionBar          = document.getElementById("actionBar");

/* =================================================
   Génération d’un ID unique pour chaque fichier
================================================= */
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/* =================================================
   Conversion d’octets → chaîne “XX.XX MB/KB/Bytes”
================================================= */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k     = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  const size  = (bytes / Math.pow(k, i)).toFixed(2);
  return `${size} ${sizes[i]}`;
}

/* =================================================
   Création d’un “file‐item” dans la liste
   - file : objet File de l’input
   - id   : identifiant unique généré
================================================= */
function createFileItem(file, id) {
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";
  fileItem.dataset.fileId = id;

  // 1) Info : nom + taille originale
  const infoDiv = document.createElement("div");
  infoDiv.className = "file-info";
  infoDiv.innerHTML = `
    <div class="file-name">${file.name}</div>
    <div class="file-size" data-original-size="${file.size}">
      ${formatFileSize(file.size)}
    </div>
  `;

  // 2) Zone de statut : barre de progression / texte / icône
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

  // 3) Bouton Télécharger (masqué tant que pas traité)
  const downloadButton = document.createElement("button");
  downloadButton.className = "download-button hidden";
  downloadButton.textContent = "Télécharger";
  downloadButton.disabled = true;
  downloadButton.dataset.fileId = id;
  downloadButton.dataset.original = file.name;

  // Assemblage
  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusDiv);
  fileItem.appendChild(downloadButton);
  return fileItem;
}

/* =================================================
   Réinitialisation de l’interface pour recommencer
================================================= */
function resetInterface() {
  // Supprimer tous les messages de statut texte restants
  document.querySelectorAll(".status-text").forEach(el => el.remove());

  // Vider la liste de fichiers
  fileList.innerHTML = "";
  
  // Cacher la section “Télécharger tous”
  downloadAllSection.classList.add("hidden");
  
  // Cacher le résumé final
  summaryDiv.classList.add("hidden");
  
  // Réafficher la dropzone
  dropzone.classList.remove("hidden");
  
  // Réinitialiser l’input
  fileInput.value = "";
  
  // Réactiver les boutons d’action
  downloadAllButton.disabled = false;
  restartButton.disabled = false;
}

/* =================================================
   Clic sur “Sélectionner un ou plusieurs fichiers”
================================================= */
selectBtn.onclick = () => fileInput.click();

/* =================================================
   Clic sur “Recommencer”
================================================= */
restartButton.onclick = resetInterface;

/* =================================================
   Détection du changement dans l’input file (upload)
================================================= */
fileInput.onchange = e => {
  if (e.target.files.length) {
    uploadFiles(e.target.files);
  }
};

/* =================================================
   Style drag’n’drop : ajout/suppression de la classe “hover”
================================================= */
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

/* =================================================
   Drop des fichiers dans la dropzone
================================================= */
dropzone.addEventListener("drop", e => {
  const files = e.dataTransfer.files;
  if (files.length) {
    uploadFiles(files);
  }
});

/* =================================================
   Fonction principale : upload AJAX + progression
================================================= */
async function uploadFiles(files) {
  // 1) Cacher la dropzone / vider ancienne liste / masquer “Télécharger tous”
  fileList.innerHTML = "";
  downloadAllSection.classList.add("hidden");
  summaryDiv.classList.add("hidden");
  dropzone.classList.add("hidden");

  // 2) Préparer un Map pour stocker les éléments liés à chaque ID
  const fileItems = new Map();
  const fileIdMap = {};
  const formData = new FormData();

  // 3) Pour chaque fichier sélectionné :
  for (const file of files) {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append("files", file);

    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name });
  }
  // 4) Inclure la map des IDs dans le FormData (JSON)
  formData.append("file_ids", JSON.stringify(fileIdMap));

  // 5) Préparer XHR pour affiner la progression
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API_BASE}/upload`, true);

  const startTime = Date.now();
  // Message global au‐dessus de la liste
  const globalInfo = document.createElement("div");
  globalInfo.className = "status-text processing";
  globalInfo.textContent = "Début du téléversement…";
  fileList.parentElement.insertBefore(globalInfo, fileList);

  /* ----------------------------------------
     Événement “progress” pendant l’upload
  ---------------------------------------- */
  xhr.upload.addEventListener("progress", e => {
    if (!e.lengthComputable) return;
    const percentComplete = (e.loaded / e.total) * 100;
    const elapsed = (Date.now() - startTime) / 1000; // secondes
    const speed = e.loaded / elapsed;                // octets/sec
    const remaining = (e.total - e.loaded) / speed;  // sec restantes

    // Mettre à jour la barre pour chaque file‐item
    fileItems.forEach(({ fileItem }) => {
      const progressFill = fileItem.querySelector(".progress-fill");
      progressFill.style.width = `${percentComplete.toFixed(1)}%`;
    });

    // Mettre à jour le message global
    globalInfo.textContent = `Téléversement : ${percentComplete.toFixed(1)} % — Temps estimé : ${Math.ceil(remaining)} s`;
  });

  /* ----------------------------------------
     Lorsqu’upload terminé (réponse 200)
  ---------------------------------------- */
  xhr.onload = async function () {
    if (xhr.status === 200) {
      // Indiquer “Téléversement terminé”
      globalInfo.textContent = "Téléversement terminé ✓";
      globalInfo.className = "status-text processed";

      // Après un bref délai, lancer la phase “Traitement OCR” 
      setTimeout(() => {
        const { job_id } = JSON.parse(xhr.responseText);
        beginProcessingPhase(fileItems, job_id);
      }, 500);
    } else {
      showError("Erreur lors du téléversement");
      dropzone.classList.remove("hidden");
    }
  };

  /* ----------------------------------------
     Erreur réseau pendant l’upload
  ---------------------------------------- */
  xhr.onerror = function () {
    showError("Erreur réseau lors du téléversement");
    dropzone.classList.remove("hidden");
  };

  // 6) Envoyer la requête
  xhr.send(formData);
}

/* =================================================
   Phase “Traitement OCR” : modifier visuel + polling
   - fileItems : Map(id → { fileItem, fileName })
   - jobId     : identifiant du job retourné par /upload
================================================= */
async function beginProcessingPhase(fileItems, jobId) {
  // 1) Remplacer le message global “Téléversement terminé” → “Traitement en cours”
  const globalInfo = document.querySelector(".status-text.processed");
  if (globalInfo) {
    globalInfo.textContent = "Traitement en cours…";
    globalInfo.className = "status-text processing";
  }

  // 2) Pour chaque fileItem, modifier texte / afficher spinner
  fileItems.forEach(({ fileItem }) => {
    const statusText = fileItem.querySelector(".status-text");
    const spinner    = fileItem.querySelector(".spinner");
    const checkIcon  = fileItem.querySelector(".check-icon");

    statusText.textContent = "Traitement en cours…";
    statusText.className = "status-text processing";
    spinner.style.display  = "block";
    checkIcon.classList.remove("show");
  });

  // 3) Démarrer le polling vers /status/{jobId}
  await checkStatus(jobId, fileItems);
}

/* =================================================
   Polling de /status pour mettre à jour les items
================================================= */
async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data     = await response.json();

    if (data.status === "done" && data.files) {
      /* ------------------------------------------------
         1) Marquer chaque fichier “terminé” & afficher taille après
      ------------------------------------------------ */
      data.files.forEach(fileInfo => {
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return;
        const { fileItem } = entry;

        const statusText   = fileItem.querySelector(".status-text");
        const spinner      = fileItem.querySelector(".spinner");
        const checkIcon    = fileItem.querySelector(".check-icon");
        const downloadBtn  = fileItem.querySelector(".download-button");
        const fileSizeEl   = fileItem.querySelector(".file-size");

        // a) Texte + couleur “Traitement terminé”
        statusText.textContent = "Traitement terminé ✓";
        statusText.className   = "status-text processed";
        spinner.style.display  = "none";
        checkIcon.classList.add("show");

        // b) Mettre à jour la taille affichée :
        //    “XX.XX MB → YY.YY MB” (size_after en octets reçu)
        const originalSize = parseInt(fileSizeEl.dataset.originalSize, 10);
        const newSize      = fileInfo.size_after || 0;
        fileSizeEl.textContent = `${formatFileSize(originalSize)} → ${formatFileSize(newSize)}`;

        // c) Afficher & activer le bouton “Télécharger”
        downloadBtn.classList.remove("hidden");
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => downloadFile(jobId, fileInfo.id, fileInfo.original);
      });

      /* ------------------------------------------------
         2) Afficher le bouton “Télécharger tous” 
      ------------------------------------------------ */
      downloadAllSection.classList.remove("hidden");
      downloadAllButton.disabled = false;
      downloadAllButton.onclick = () => downloadAllFiles(jobId, data.files);

      /* ------------------------------------------------
         3) Afficher le résumé final
      ------------------------------------------------ */
      showSummary(data.files);

    } else if (data.status === "error") {
      throw new Error(data.details || "Erreur pendant le traitement");
    } else {
      // Si pas terminé ni error, attendre 2 s puis relancer
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (error) {
    showError(error.message);
    dropzone.classList.remove("hidden");
  }
}

/* =================================================
   Téléchargement d’un seul fichier (XHR + progression implémentable)
   - jobId        : identifiant du job
   - fileId       : ID unique du fichier
   - originalName : nom d’utilisateur pour le fichier téléchargé
================================================= */
async function downloadFile(jobId, fileId, originalName) {
  const selector       = `.download-button[data-file-id="${fileId}"]`;
  const downloadButton = document.querySelector(selector);
  if (!downloadButton) return;

  const fileItem   = downloadButton.closest(".file-item");
  const statusText = fileItem.querySelector(".status-text");
  const spinner    = fileItem.querySelector(".spinner");
  const checkIcon  = fileItem.querySelector(".check-icon");

  // 1) Verrouiller le bouton, modifier le texte, afficher spinner
  downloadButton.disabled = true;
  downloadButton.textContent = "Téléchargement…";
  statusText.textContent    = "Téléchargement en cours…";
  statusText.className      = "status-text downloading";
  spinner.style.display     = "block";
  checkIcon.classList.remove("show");

  try {
    /* ------------------------------------------------
       NB : Utilisation ici d’un simple fetch/blocage pour la progression :
       Si vous souhaitez afficher la progression, il faudrait recourir à
       XMLHttpRequest avec xhr.onprogress pour mise à jour de .progress-fill
       ou créer une barre séparée. Pour simplicité, on se contente d’un spinner.
    ------------------------------------------------ */
    const response = await fetch(`${API_BASE}/download/${jobId}/file/${fileId}`);
    if (!response.ok) throw new Error("Erreur lors du téléchargement");

    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // 2) Mise à jour visuelle “Téléchargement terminé”
    statusText.textContent = "Téléchargement terminé ✓";
    statusText.className   = "status-text downloaded";
    spinner.style.display  = "none";
    checkIcon.classList.add("show");

    // 3) Réactiver le bouton pour retélécharger si besoin
    downloadButton.disabled = false;
    downloadButton.textContent = "Télécharger à nouveau";

  } catch (error) {
    statusText.textContent = "Erreur de téléchargement";
    statusText.className   = "status-text";
    showError(`Erreur de téléchargement : ${error.message}`);
    downloadButton.disabled = false;
    downloadButton.textContent = "Télécharger";
  }
}

/* =================================================
   Téléchargement de tous les fichiers, un à un
================================================= */
async function downloadAllFiles(jobId, files) {
  // Désactiver le bouton global pendant la séquence
  downloadAllButton.disabled = true;
  for (const fileInfo of files) {
    await downloadFile(jobId, fileInfo.id, fileInfo.original);
  }
  // Après tous les téléchargements, réactiver
  downloadAllButton.disabled = false;
}

/* =================================================
   Afficher le résumé final (liste des noms originaux)
================================================= */
function showSummary(files) {
  summaryDiv.innerHTML = "";
  summaryDiv.classList.remove("hidden");

  const heading = document.createElement("h2");
  heading.textContent = "Résumé des fichiers traités :";
  summaryDiv.appendChild(heading);

  const ul = document.createElement("ul");
  files.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f.original;
    ul.appendChild(li);
  });
  summaryDiv.appendChild(ul);
}

/* =================================================
   Afficher un message d’erreur dans fileList
================================================= */
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}
