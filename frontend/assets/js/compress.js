// -----------------------------------------------------------------------------
// compress.js – Interface « OCR & Compression »
// Ce script gère tout le cycle :
//  1. Sélection / drag & drop de fichiers PDF
//  2. Affichage de la barre d’upload + progression globale + temps estimé
//  3. Polling du statut / traitement (API /status/{jobId})
//  4. Mise à jour des statuts individuels, affichage « taille avant → taille après »
//  5. Gestion des boutons « Télécharger » individuels et « Télécharger tous »
//  6. Gestion du bouton « Recommencer » pour réinitialiser l’interface
// -----------------------------------------------------------------------------

const API_BASE = "/api";
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const selectBtn = document.getElementById("selectFile");
const fileList = document.getElementById("fileList");
const actionBar = document.getElementById("actionBar");
const downloadAllButton = document.getElementById("downloadAllButton");
const restartButton = document.getElementById("restartButton");
const summaryDiv = document.getElementById("summary");

// -----------------------------------------------------------------------------
// UTILITAIRES
// -----------------------------------------------------------------------------

/**
 * Génère un ID unique pour chaque fichier (cliqué/glissé). 
 * On concatène un morceau aléatoire + timestamp.
 */
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Convertit une taille en octets (bytes) en chaîne lisible (Bytes, KB, MB, GB).
 * Par ex. 12515063 → "11.93 MB" (si on arrondit à deux chiffres après la virgule).
 */
function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes) || bytes < 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Affiche un message d'erreur sous forme d'une div rouge.
 */
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}

// -----------------------------------------------------------------------------
// FONCTIONS DE CRÉATION D’ELÉMENTS HTML PAR FICHIER
// -----------------------------------------------------------------------------

/**
 * Crée le bloc HTML correspondant à un fichier que l’on vient d’uploader.
 * @param {File} file – objet File issu du FileList
 * @param {string} id – identifiant unique qu’on associe à ce fichier
 * @returns {HTMLElement} – un <div> .file-item tout prêt à injecter
 */
function createFileItem(file, id) {
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";
  fileItem.dataset.fileId = id;

  // 1) Nom de fichier + taille initiale
  const infoDiv = document.createElement("div");
  infoDiv.className = "file-info";
  infoDiv.innerHTML = `
    <div class="file-name">${file.name}</div>
    <div class="file-size" data-original-size="${file.size}">${formatFileSize(file.size)}</div>
  `;

  // 2) Statut (progression + texte + spinner + check icon)
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

  // 3) Bouton « Télécharger » (masqué au départ)
  const downloadButton = document.createElement("button");
  downloadButton.className = "button button-secondary download-button hidden";
  downloadButton.textContent = "Télécharger";
  downloadButton.disabled = true;

  // On retourne l’élément complet
  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusDiv);
  fileItem.appendChild(downloadButton);
  return fileItem;
}

// -----------------------------------------------------------------------------
// RÉINITIALISATION DE L’INTERFACE
// -----------------------------------------------------------------------------

/**
 * Vide complètement la liste des fichiers, cache la barre d’actions,
 * remet à zéro la dropzone. On est revenu à l’état initial.
 */
function resetInterface() {
  // Supprimer tout message de statut (upload, processing…) s’il reste
  document.querySelectorAll(".status-text").forEach((el) => el.remove());

  fileList.innerHTML = "";
  actionBar.classList.add("hidden");
  summaryDiv.classList.add("hidden");
  dropzone.classList.remove("hidden");
  fileInput.value = "";
}

// -----------------------------------------------------------------------------
// GESTIONNAIRES D’ÉVÉNEMENTS DRAG & DROP + BOUTON « Choisir un fichier »
// -----------------------------------------------------------------------------

selectBtn.addEventListener("click", () => fileInput.click());
restartButton.addEventListener("click", resetInterface);

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    uploadFiles(e.target.files);
  }
});
["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("hover");
  });
});
["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("hover");
  });
});
dropzone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files.length) {
    uploadFiles(files);
  }
});

// -----------------------------------------------------------------------------
// PHASE 1 : UPLOAD DES FICHIERS AU SERVEUR AVEC XHR (pour suivre progression globale)
// -----------------------------------------------------------------------------

/**
 * Lance un XMLHttpRequest vers /api/upload avec FormData.
 * Met à jour la barre de progression globale et individuelle.
 * @param {FileList} files 
 */
async function uploadFiles(files) {
  // 1) Réinitialiser interface
  fileList.innerHTML = "";
  actionBar.classList.add("hidden");
  summaryDiv.classList.add("hidden");
  dropzone.classList.add("hidden");

  // 2) Préparer les structures de tracking
  const fileItems = new Map(); // id → { fileItem, fileName }
  const fileIdMap = {};        // filename → generatedId
  const formData = new FormData();

  // 3) Créer les blocs HTML et remplir FormData
  Array.from(files).forEach((file) => {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append("files", file);

    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name });
  });
  formData.append("file_ids", JSON.stringify(fileIdMap));

  // 4) Préparer XHR
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API_BASE}/upload`, true);

  // Ajout d’une div au-dessus de la liste pour la progression globale
  const globalInfo = document.createElement("div");
  globalInfo.className = "status-text processing";
  globalInfo.textContent = "Début du téléversement…";
  fileList.parentElement.insertBefore(globalInfo, fileList);

  const startTime = Date.now();

  xhr.upload.addEventListener("progress", (e) => {
    if (!e.lengthComputable) return;
    const percentComplete = (e.loaded / e.total) * 100;
    const elapsed = (Date.now() - startTime) / 1000; // en secondes
    const speed = e.loaded / elapsed;                // octets/seconde
    const remainingSec = (e.total - e.loaded) / speed;

    // Mettre à jour chaque barre individuelle
    fileItems.forEach(({ fileItem }) => {
      const progressFill = fileItem.querySelector(".progress-fill");
      progressFill.style.width = `${percentComplete.toFixed(1)}%`;
    });

    // Mettre à jour le texte global
    globalInfo.textContent = `Téléversement : ${percentComplete.toFixed(1)} % — Temps restant : ${Math.ceil(
      remainingSec
    )} s`;
  });

  xhr.onload = function () {
    if (xhr.status === 200) {
      globalInfo.textContent = "Téléversement terminé ✓";
      globalInfo.className = "status-text uploaded";

      // Attendre 500 ms puis passer à la phase traitement
      setTimeout(() => {
        const jobId = JSON.parse(xhr.responseText).job_id;
        beginProcessingPhase(fileItems, jobId);
      }, 500);
    } else {
      showError("Erreur lors du téléversement");
      dropzone.classList.remove("hidden");
    }
  };

  xhr.onerror = function () {
    showError("Erreur réseau lors du téléversement");
    dropzone.classList.remove("hidden");
  };

  xhr.send(formData);
}

// -----------------------------------------------------------------------------
// PHASE 2 : POLLING /status/{jobId} POUR METTRE À JOUR LE STATUT DE CHAQUE FICHIER
// -----------------------------------------------------------------------------

/**
 * Passe chaque fichier en « Traitement en cours » (texte + spinner),
 * lance le checkStatus périodiquement.
 * @param {Map} fileItems 
 * @param {string} jobId 
 */
async function beginProcessingPhase(fileItems, jobId) {
  const globalInfo = document.querySelector(".status-text.uploaded");
  if (globalInfo) {
    globalInfo.textContent = "Traitement en cours…";
    globalInfo.className = "status-text processing";
  }

  fileItems.forEach(({ fileItem }) => {
    const statusText = fileItem.querySelector(".status-text");
    const spinner = fileItem.querySelector(".spinner");
    const checkIcon = fileItem.querySelector(".check-icon");
    // Changer le texte + couleur, afficher le spinner, cacher le check
    statusText.textContent = "Traitement en cours…";
    statusText.className = "status-text processing";
    spinner.style.display = "block";
    checkIcon.style.display = "none";
  });

  await checkStatus(jobId, fileItems);
}

/**
 * Interroge périodiquement /api/status/{jobId} jusqu’à ce que status === "done".
 * À la fin, on met à jour chaque bloc pour :
 *  - Afficher « Traitement terminé ✓ » en vert
 *  - Mettre à jour la taille « avant → après »
 *  - Afficher un unique ✓ (check-icon)
 *  - Afficher le bouton « Télécharger », activé
 *  - Afficher la barre d’actions (Télécharger tous / Recommencer)
 *  - Afficher le résumé final
 * @param {string} jobId 
 * @param {Map} fileItems 
 */
async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();

    if (data.status === "done" && Array.isArray(data.files)) {
      // Pour chaque fichier traité
      data.files.forEach((fileInfo) => {
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return;
        const { fileItem } = entry;

        const statusText = fileItem.querySelector(".status-text");
        const spinner = fileItem.querySelector(".spinner");
        const checkIcon = fileItem.querySelector(".check-icon");
        const downloadButton = fileItem.querySelector(".download-button");
        const sizeElement = fileItem.querySelector(".file-size");

        // 1) Statut terminé
        statusText.textContent = "Traitement terminé ✓";
        statusText.className = "status-text processed";
        spinner.style.display = "none";
        checkIcon.style.display = "inline"; // on affiche une seule fois le ✓

        // 2) Bouton « Télécharger »
        downloadButton.classList.remove("hidden");
        downloadButton.disabled = false;
        downloadButton.addEventListener("click", () => {
          downloadFile(jobId, fileInfo.id, fileInfo.original);
        });

        // 3) Mise à jour de la taille (avant → après)
        const originalSize = parseInt(sizeElement.dataset.originalSize, 10) || 0;
        const afterSize = fileInfo.size_after || 0;
        sizeElement.textContent = `${formatFileSize(originalSize)} → ${formatFileSize(afterSize)}`;
      });

      // 4) Afficher la barre d’actions globale
      actionBar.classList.remove("hidden");
      downloadAllButton.addEventListener("click", () => {
        downloadAllFiles(jobId, data.files);
      });

      // 5) Afficher le résumé final
      showSummary(data.files);
    } else if (data.status === "error") {
      throw new Error(data.details || "Erreur pendant le traitement sur le serveur.");
    } else {
      // Toujours en cours → on relance après 2 s
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (err) {
    showError(err.message);
    dropzone.classList.remove("hidden");
  }
}

// -----------------------------------------------------------------------------
// PHASE 3 : TÉLÉCHARGEMENT INDIVIDUEL
// -----------------------------------------------------------------------------

/**
 * Télécharge un PDF compressé (via fetch + blob) et met à jour le statut :
 *  - Bouton désactivé puis clignotant « Téléchargement… » (en bleu)
 *  - À la fin : « Téléchargement terminé ✓ » (en vert)
 *  - Bouton repasse en « Télécharger à nouveau »
 * @param {string} jobId 
 * @param {string} fileId 
 * @param {string} originalName 
 */
async function downloadFile(jobId, fileId, originalName) {
  // Récupérer le bouton qui a l’attribut data-file-id = fileId
  const selector = `.download-button[data-file-id="${fileId}"]`;
  const downloadButton = document.querySelector(selector);
  if (!downloadButton) return;

  const fileItem = downloadButton.closest(".file-item");
  const statusText = fileItem.querySelector(".status-text");
  const spinner = fileItem.querySelector(".spinner");
  const checkIcon = fileItem.querySelector(".check-icon");

  // 1) Passer en « Téléchargement en cours… »
  downloadButton.disabled = true;
  downloadButton.textContent = "Téléchargement…";
  statusText.textContent = "Téléchargement en cours…";
  statusText.className = "status-text downloading";
  spinner.style.display = "block";
  checkIcon.style.display = "none";

  try {
    const response = await fetch(`${API_BASE}/download/${jobId}/file/${fileId}`);
    if (!response.ok) throw new Error("Erreur lors du téléchargement");

    // Récupération du blob pour forcer le téléchargement
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // 2) Affichage statut « Téléchargement terminé ✓ »
    statusText.textContent = "Téléchargement terminé ✓";
    statusText.className = "status-text downloaded";
    spinner.style.display = "none";
    checkIcon.style.display = "inline";

    // 3) Réactiver le bouton pour « Télécharger à nouveau »
    downloadButton.disabled = false;
    downloadButton.textContent = "Télécharger à nouveau";
  } catch (error) {
    statusText.textContent = "Erreur de téléchargement";
    statusText.className = "status-text";
    showError(`Erreur de téléchargement : ${error.message}`);
    downloadButton.disabled = false;
    downloadButton.textContent = "Télécharger";
  }
}

// -----------------------------------------------------------------------------
// PHASE 4 : TÉLÉCHARGER TOUS LES FICHIERS
// -----------------------------------------------------------------------------

/**
 * On boucle sur la liste fournie (data.files) et on appelle
 * downloadFile() séquentiellement pour chaque fichier.
 * @param {string} jobId 
 * @param {Array} files – tableau d’objets { id, original, ... }
 */
async function downloadAllFiles(jobId, files) {
  for (const fileInfo of files) {
    await downloadFile(jobId, fileInfo.id, fileInfo.original);
  }
}

// -----------------------------------------------------------------------------
// PHASE 5 : AFFICHER LE RÉSUMÉ FINAL À LA FIN
// -----------------------------------------------------------------------------

/**
 * Affiche la liste des noms de fichiers traités dans un encart en bas.
 * @param {Array} files 
 */
function showSummary(files) {
  summaryDiv.innerHTML = "";
  summaryDiv.classList.remove("hidden");

  const heading = document.createElement("h2");
  heading.textContent = "Résumé des fichiers traités :";
  summaryDiv.appendChild(heading);

  const ul = document.createElement("ul");
  files.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f.original;
    ul.appendChild(li);
  });
  summaryDiv.appendChild(ul);
}
