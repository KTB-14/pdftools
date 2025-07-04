/* ------------- CONFIG ------------------------------------------------- */
const API_BASE = "./api";

// Langue courante (fr ou en)
let currentLang = "fr";

// Dictionnaire de textes FR/EN
const texts = {
  fr: {
    dropzonePrompt: `Déposez vos fichiers PDF ici<br/><span class="text-muted">ou</span>`,
    selectButton: "Sélectionner des fichiers",
    acceptedFormat: "Format accepté : PDF",
    uploading: "Téléversement en cours…",
    uploadProgress: (pct, remaining) => `Téléversement : ${pct} % — Temps estimé : ${remaining} s`,
    uploadStart: "Début du téléversement…",
    uploadDone: "Téléversement terminé",
    processing: "Traitement en cours…",
    processingDone: "Traitement terminé",
    summaryTitle: "Fichiers traités :",
    downloadAll: "Télécharger tout",
    restart: "↻ Réinitialiser",
    fileSizeInfo: (orig, comp, reduction) =>
      `${orig} → ${comp} (${reduction}% de réduction)`,
    downloading: "Téléchargement en cours…",
    downloadStart: "Téléchargement…",
    downloadDone: "Téléchargement terminé ",
    downloadAgain: "Télécharger à nouveau",
    downloadError: "Erreur de téléchargement",
    errorPrefix: "Erreur : ",
    notProcessed: "Non traité", 
    footerLine1: "Plateforme dédiée à la compression de fichiers PDF.",
    footerLine2: "Merci de ne pas utiliser de services Web publics pour vos fichiers PDF sensibles.",
    footerInfo: "Partage sécurisé de fichiers volumineux : utilisez la plateforme.",
    footerLink: "DL FAREVA",
    errors: { 
      SIGNED_PDF: "PDF signé -> Traitement non prise en charge",
      TOO_LARGE: "Fichier trop volumineux",
      PASSWORD_PROTECTED: "PDF protégé par mot de passe",
      INVALID_PDF: "Fichier non-PDF ou corrompu",
      PDF_OPEN_ERROR: "Erreur lors de l'ouverture du PDF",
      OCR_FAILED: "Erreur lors du traitement OCR",
      SIZE_READ_ERROR: "Erreur de lecture de la taille"
    },
  },
  en: {
    dropzonePrompt: `Drop your PDF files here<br/><span class="text-muted">or</span>`,
    selectButton: "Select files",
    acceptedFormat: "Accepted format: PDF",
    uploading: "Uploading…",
    uploadProgress: (pct, remaining) => `Upload: ${pct}% — Estimated time: ${remaining}s`,
    uploadStart: "Starting upload…",
    uploadDone: "Upload complete ",
    processing: "Processing…",
    processingDone: "Processing complete",
    summaryTitle: "Processed files:",
    downloadAll: "Download all",
    restart: "↻ Reset",
    fileSizeInfo: (orig, comp, reduction) =>
      `${orig} → ${comp} (${reduction}% reduction)`,
    downloading: "Downloading…",
    downloadStart: "Downloading…",
    downloadDone: "Download complete",
    downloadAgain: "Download again",
    downloadError: "Download error",
    errorPrefix: "Error: ",
    notProcessed: "Not processed",   
    footerLine1: "PDF Compression Platform",
    footerLine2: "Please avoid using public web services for your sensitive PDF files.",
    footerInfo: "Secure large file sharing: use the platform",
    footerLink: "DL FAREVA",
    errors: {  
      SIGNED_PDF: "Digitally signed PDF — not modified",
      TOO_LARGE: "File too large",
      PASSWORD_PROTECTED: "Password-protected PDF",
      INVALID_PDF: "Invalid or corrupted PDF file",
      PDF_OPEN_ERROR: "Error opening PDF file",
      OCR_FAILED: "OCR processing failed",
      SIZE_READ_ERROR: "Error reading file size",
    },
  },
};

const dropzone = document.getElementById("dropzone");
let fileInput = document.getElementById("fileInput");
let selectBtn = document.getElementById("selectFile");
const fileList = document.getElementById("fileList");
const downloadAllButton = document.getElementById("downloadAllButton");
const restartButton = document.getElementById("restartButton");
const summaryDiv = document.getElementById("summary");

// Éléments du pied de page et messages d'information
const footerLogo = document.querySelector(".footer-logo img");
const footerInfoText = document.getElementById("footer-text-1");
const footerLinkEl = document.getElementById("footer-link");
const infoTitle = document.querySelector(".footer-text-title");
const infoWarning = document.querySelector(".footer-text-warning");

// Boutons de changement de langue (drapeaux)
const langButtons = document.querySelectorAll(".flag-btn");

/* ------------- INITIALISATION LANGUE & UI FIXE ----------------------- */
window.addEventListener("DOMContentLoaded", () => {
  // Afficher le texte initial en FR
  updateStaticText();

  // Lier les boutons de langue
  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.dataset.lang;
      if (selected === "fr" || selected === "en") {
        currentLang = selected;
        updateStaticText();
      }
    });
  });
});

/**
 * Met à jour tous les textes statiques et dynamiques en fonction de currentLang
 */
function updateStaticText() {
  const t = texts[currentLang];

  // --- DROPZONE ---
  // On remplace uniquement les enfants du dropzone pour éviter de casser la structure
  dropzone.innerHTML = `
    <p>${t.dropzonePrompt}</p>
    <button id="selectFile" class="button">${t.selectButton}</button>
    <input type="file" id="fileInput" accept="application/pdf" multiple hidden />
    <p class="text-muted">${t.acceptedFormat}</p>
  `;

  // Ré-associer l'input et le bouton sélectionné (car recréés)
  selectBtn = document.getElementById("selectFile");
  fileInput = document.getElementById("fileInput");

  if (selectBtn && fileInput) {
    selectBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) {
        uploadFiles(e.target.files);
      }
    });
  }

  // --- RÉSUMÉ ---
  const summaryTitle = summaryDiv.querySelector("h2");
  if (summaryTitle) summaryTitle.textContent = t.summaryTitle;
  if (downloadAllButton) downloadAllButton.textContent = t.downloadAll;
  if (restartButton) restartButton.textContent = t.restart;

  // --- PIED DE PAGE ET MESSAGES ---
  if (infoTitle) infoTitle.textContent = t.footerLine1;
  if (infoWarning) infoWarning.textContent = t.footerLine2;
  if (footerInfoText) footerInfoText.textContent = t.footerInfo;
  if (footerLinkEl && t.footerLink) footerLinkEl.textContent = t.footerLink;

  // --- Si un upload est déjà en cours, on rafraîchit le statut global ---
  const globalInfo = document.querySelector(".status-text.processing, .status-text.uploaded, .status-text.uploading");
  if (globalInfo) {
    // On ne sait pas exactement où en est, on peut forcer le texte "upload start"
    globalInfo.textContent = t.uploadStart;
  }
}

/* ------------- HELPERS ------------------------------------------------ */
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function formatBytes(b) {
  if (!b) return "0 B";
  const k = 1024,
    u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(2) + " " + u[i];
}

/* ------------- UI ELEMENTS ------------------------------------------- */
function createFileItem(file, id) {
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";

  const infoDiv = document.createElement("div");
  infoDiv.className = "file-info";
  infoDiv.innerHTML = `
    <div class="file-name" title="${file.name}">${file.name}</div>
    <div class="file-size">${formatBytes(file.size)}</div>
  `;

  const statusBlock = document.createElement("div");
  statusBlock.className = "status-block";
  statusBlock.innerHTML = `
    <div class="status-area">
      <span class="status-text uploading" aria-live="polite">${
        texts[currentLang].uploading
      }</span>
      <div class="spinner"></div>
      <div class="check-icon">✓</div>
    </div>
    <div class="progress-container">
      <div class="progress-fill"></div>
    </div>
  `;

  const downloadButton = document.createElement("button");
  downloadButton.className = "button button-secondary download-button hidden";
  downloadButton.textContent =
    currentLang === "fr" ? "Télécharger" : "Download";
  downloadButton.dataset.fileId = id;

  fileItem.appendChild(infoDiv);
  fileItem.appendChild(statusBlock);
  fileItem.appendChild(downloadButton);

  return fileItem;
}

function resetInterface() {
  document.querySelectorAll(".status-text").forEach((el) => el.remove());
  fileList.innerHTML = "";
  summaryDiv.classList.add("hidden");
  dropzone.classList.remove("hidden");
  if (fileInput) fileInput.value = "";
  updateStaticText();
}

selectBtn.onclick = () => fileInput.click();
restartButton.onclick = resetInterface;

fileInput.onchange = (e) => {
  if (e.target.files.length) {
    uploadFiles(e.target.files);
  }
};

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

async function uploadFiles(files) {
  fileList.innerHTML = "";
  summaryDiv.classList.add("hidden");
  dropzone.classList.add("hidden");

  const fileItems = new Map();
  const fileIdMap = {};
  const formData = new FormData();

  for (const file of files) {
    const id = generateUniqueId();
    fileIdMap[file.name] = id;
    formData.append("files", file);

    const fileItem = createFileItem(file, id);
    fileList.appendChild(fileItem);
    fileItems.set(id, { fileItem, fileName: file.name, sizeBefore: file.size });
  }
  formData.append("file_ids", JSON.stringify(fileIdMap));

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API_BASE}/upload`, true);

  const startTime = Date.now();
  const globalInfo = document.createElement("div");
  globalInfo.className = "status-text processing";
  globalInfo.textContent = texts[currentLang].uploadStart;
  fileList.parentElement.insertBefore(globalInfo, fileList);

  xhr.upload.addEventListener("progress", (e) => {
    if (!e.lengthComputable) return;
    const percentComplete = (e.loaded / e.total) * 100;
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = e.loaded / elapsed;
    const remaining = Math.ceil((e.total - e.loaded) / speed);

    fileItems.forEach(({ fileItem }) => {
      const progressFill = fileItem.querySelector(".progress-fill");
      progressFill.style.width = `${percentComplete.toFixed(1)}%`;
    });
    globalInfo.textContent = texts[currentLang].uploadProgress(
      percentComplete.toFixed(1),
      remaining
    );
  });

  xhr.onload = async function () {
    if (xhr.status === 200) {
      globalInfo.textContent = texts[currentLang].uploadDone;
      globalInfo.className = "status-text uploaded";
      setTimeout(() => {
        beginProcessingPhase(fileItems, JSON.parse(xhr.responseText).job_id);
      }, 500);
    } else {
      showError(
        texts[currentLang].errorPrefix + "Erreur lors du téléversement"
      );
      dropzone.classList.remove("hidden");
    }
  };

  xhr.onerror = function () {
    showError(
      texts[currentLang].errorPrefix +
        (currentLang === "fr"
          ? "Erreur réseau lors du téléversement"
          : "Network error during upload")
    );
    dropzone.classList.remove("hidden");
  };

  xhr.send(formData);
}

async function beginProcessingPhase(fileItems, jobId) {
  const globalInfo = document.querySelector(".status-text.uploaded");
  if (globalInfo) {
    globalInfo.textContent = texts[currentLang].processing;
    globalInfo.className = "status-text processing";
  }

  fileItems.forEach(({ fileItem }) => {
    const statusText = fileItem.querySelector(".status-text");
    const spinner = fileItem.querySelector(".spinner");
    const checkIcon = fileItem.querySelector(".check-icon");
    const progressFill = fileItem.querySelector(".progress-fill");

    statusText.textContent = texts[currentLang].processing;
    statusText.className = "status-text processing";
    spinner.style.display = "block";
    checkIcon.classList.remove("show");

    // Démarrer l'animation infinie
    progressFill.classList.add("indeterminate");
  });

  await checkStatus(jobId, fileItems);
}

async function checkStatus(jobId, fileItems) {
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();

    if (data.status === "done" && data.files) {
      const globalInfo = document.querySelector(".status-text.processing");
      if (globalInfo) {
        globalInfo.textContent = texts[currentLang].processingDone;
        globalInfo.className = "status-text processed";
      }

      data.files.forEach((fileInfo) => {
        const entry = fileItems.get(fileInfo.id);
        if (!entry) return;
        const { fileItem } = entry;

        const statusText = fileItem.querySelector(".status-text");     // (déclaré en premier)
        const spinner = fileItem.querySelector(".spinner");           // (déclaré en premier)
        const checkIcon = fileItem.querySelector(".check-icon");      // (déclaré en premier)
        const downloadButton = fileItem.querySelector(".download-button"); // (déclaré en premier)
        const sizeDiv = fileItem.querySelector(".file-size");         // (déclaré en premier)
        const progressFill = fileItem.querySelector(".progress-fill");// (déclaré en premier)

        if (fileInfo.error) {  // Gestion d'un fichier en erreur
          spinner.style.display = "none";
          checkIcon.classList.remove("show");

          progressFill.classList.remove("indeterminate");
          progressFill.style.width = "0%";

          statusText.textContent = texts[currentLang].errors[fileInfo.error] || fileInfo.error;
          statusText.className = "status-text error";  
          
          sizeDiv.textContent = currentLang === "fr" ? "Non traité" : "Not processed";

          downloadButton.classList.add("hidden");
          downloadButton.disabled = true;
          return; // ne pas continuer plus bas
        }

        // --- Le fichier est traité normalement
        const originalBytes = entry.sizeBefore;
        const compressedBytes = fileInfo.size_after;
        const ratioRetained = fileInfo.ratio || 0;
        const reductionPercent = (100 - ratioRetained).toFixed(1);

        progressFill.classList.remove("indeterminate");
        progressFill.style.width = "100%";

        sizeDiv.textContent = texts[currentLang].fileSizeInfo(
          formatBytes(originalBytes),
          formatBytes(compressedBytes),
          reductionPercent
        );

        statusText.textContent = texts[currentLang].processingDone;
        statusText.className = "status-text processed";
        spinner.style.display = "none";
        checkIcon.classList.add("show");

        downloadButton.textContent =
          currentLang === "fr" ? "Télécharger" : "Download";
        downloadButton.classList.remove("hidden");
        downloadButton.disabled = false;
        downloadButton.addEventListener("click", () => {
          downloadFile(jobId, fileInfo.id, fileInfo.final_name);
        });
      });

      summaryDiv.classList.remove("hidden");
      if (data.files.length <= 1) {
        downloadAllButton.style.display = "none";
      } else {
        downloadAllButton.style.display = "inline-block";
      }

      downloadAllButton.textContent = texts[currentLang].downloadAll;
      downloadAllButton.onclick = () =>
        downloadAllFiles(jobId, data.files);
      showSummary(data.files);
    } else if (data.status === "error") {
      throw new Error(data.details || "Erreur pendant le traitement");
    } else {
      setTimeout(() => checkStatus(jobId, fileItems), 2000);
    }
  } catch (error) {
    showError(texts[currentLang].errorPrefix + error.message);
    dropzone.classList.remove("hidden");
  }
}

async function downloadFile(jobId, fileId, finalName) {
  const selector = `.download-button[data-file-id="${fileId}"]`;
  const downloadButton = document.querySelector(selector);
  if (!downloadButton) return;

  const fileItem = downloadButton.closest(".file-item");
  const statusText = fileItem.querySelector(".status-text");
  const spinner = fileItem.querySelector(".spinner");
  const checkIcon = fileItem.querySelector(".check-icon");

  downloadButton.disabled = true;
  downloadButton.textContent = texts[currentLang].downloadStart;
  statusText.textContent = texts[currentLang].downloading;
  statusText.className = "status-text downloading";
  spinner.style.display = "block";
  checkIcon.classList.remove("show");

  try {
    const response = await fetch(
      `${API_BASE}/download/${jobId}/file/${fileId}`
    );
    if (!response.ok) throw new Error("Erreur lors du téléchargement");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    statusText.textContent = texts[currentLang].downloadDone;
    statusText.className = "status-text downloaded";
    spinner.style.display = "none";
    checkIcon.classList.add("show");

    downloadButton.disabled = false;
    downloadButton.textContent = texts[currentLang].downloadAgain;
  } catch (error) {
    statusText.textContent = texts[currentLang].downloadError;
    statusText.className = "status-text";
    showError(texts[currentLang].errorPrefix + error.message);
    downloadButton.disabled = false;
    downloadButton.textContent =
      currentLang === "fr" ? "Télécharger" : "Download";
  }
}

async function downloadAllFiles(jobId, files) {
  for (const fileInfo of files) {
    if (fileInfo.error) continue;
    await downloadFile(jobId, fileInfo.id, fileInfo.final_name);
  }
}

function showSummary(files) {
  const ul = summaryDiv.querySelector("ul");
  ul.innerHTML = "";
  files.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f.original + (f.error ? ` — ${texts[currentLang].errors[f.error] || f.error}` : "");
    ul.appendChild(li);
  });
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  fileList.appendChild(errorDiv);
}
