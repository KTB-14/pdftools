/* ------------------------------------------------------------------ */
/*  PDFTools – compress.js (version “taille avant → après”)           */
/* ------------------------------------------------------------------ */

/* ---------- CONFIG ------------------------------------------------ */
const API_BASE = "/api";
const dropzone           = document.getElementById("dropzone");
const fileInput          = document.getElementById("fileInput");
const selectBtn          = document.getElementById("selectFile");
const fileList           = document.getElementById("fileList");
const downloadAllButton  = document.getElementById("downloadAllButton");
const restartButton      = document.getElementById("restartButton");
const summaryDiv         = document.getElementById("summary");

/* ---------- HELPERS ---------------------------------------------- */
function generateUniqueId(){
  return Math.random().toString(36).substring(2,10)+Date.now().toString(36);
}
// Convertit des octets → Ko / Mo / Go
function formatBytes(b){
  if(!b) return "0 B";
  const k=1024, u=["B","KB","MB","GB","TB"];
  const i=Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(2)+" "+u[i];
}

/* ---------- UI : création d’une carte fichier -------------------- */
function createFileItem(file,id){
  const fileItem=document.createElement("div");
  fileItem.className="file-item";

  // Colonne 1 : Nom + taille AVANT
  const infoDiv=document.createElement("div");
  infoDiv.className="file-info";
  infoDiv.innerHTML=`
    <div class="file-name" title="${file.name}">${file.name}</div>
    <div class="file-size">${formatBytes(file.size)}</div>
  `;

  // Colonne 2 : statut + barre
  const statusBlock=document.createElement("div");
  statusBlock.className="status-block";
  statusBlock.innerHTML=`
    <div class="status-area">
      <span class="status-text uploading" aria-live="polite">Téléversement en cours…</span>
      <div class="spinner"></div>
      <div class="check-icon">✓</div>
    </div>
    <div class="progress-container">
      <div class="progress-fill" style="width:0%"></div>
    </div>
  `;

  // Colonne 3 : bouton
  const downloadButton=document.createElement("button");
  downloadButton.className="button button-secondary download-button hidden";
  downloadButton.textContent="Télécharger";
  downloadButton.dataset.fileId=id;

  fileItem.append(infoDiv,statusBlock,downloadButton);
  return fileItem;
}

/* ---------- RESET ------------------------------------------------- */
function resetInterface(){
  document.querySelectorAll(".status-text").forEach(el=>el.remove());
  fileList.innerHTML="";
  summaryDiv.classList.add("hidden");
  dropzone.classList.remove("hidden");
  fileInput.value="";
}
selectBtn.onclick=()=>fileInput.click();
restartButton.onclick=resetInterface;

/* ---------- DRAG & DROP ------------------------------------------ */
["dragenter","dragover"].forEach(evt=>{
  dropzone.addEventListener(evt,e=>{
    e.preventDefault();e.stopPropagation();dropzone.classList.add("hover");
  });
});
["dragleave","drop"].forEach(evt=>{
  dropzone.addEventListener(evt,e=>{
    e.preventDefault();e.stopPropagation();dropzone.classList.remove("hover");
  });
});
dropzone.addEventListener("drop",e=>{
  if(e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
});

/* ---------- UPLOAD ------------------------------------------------ */
async function uploadFiles(files){
  fileList.innerHTML="";
  summaryDiv.classList.add("hidden");
  dropzone.classList.add("hidden");

  const fileItems=new Map();       // id → {fileItem, sizeBefore}
  const fileIdMap={}, formData=new FormData();

  for(const file of files){
    const id=generateUniqueId();
    fileIdMap[file.name]=id;
    formData.append("files",file);

    const fileItem=createFileItem(file,id);
    fileList.appendChild(fileItem);
    fileItems.set(id,{fileItem,sizeBefore:file.size});
  }
  formData.append("file_ids",JSON.stringify(fileIdMap));

  /* XHR avec barre de progression */
  const xhr=new XMLHttpRequest();
  xhr.open("POST",`${API_BASE}/upload`,true);

  const globalInfo=document.createElement("div");
  globalInfo.className="status-text processing";
  globalInfo.textContent="Début du téléversement…";
  fileList.parentElement.insertBefore(globalInfo,fileList);

  const t0=Date.now();
  xhr.upload.addEventListener("progress",e=>{
    if(!e.lengthComputable) return;
    const pct=e.loaded/e.total*100;
    const dt=(Date.now()-t0)/1000;      // s
    const speed=e.loaded/dt;
    const remain=(e.total-e.loaded)/speed;

    fileItems.forEach(({fileItem})=>{
      fileItem.querySelector(".progress-fill").style.width=`${pct.toFixed(1)}%`;
    });
    globalInfo.textContent=`Téléversement : ${pct.toFixed(1)} % — ${Math.ceil(remain)} s restants`;
  });

  xhr.onload=()=>{
    if(xhr.status===200){
      globalInfo.textContent="Téléversement terminé ✓";
      globalInfo.className="status-text uploaded";
      const jobId=JSON.parse(xhr.responseText).job_id;
      setTimeout(()=>beginProcessingPhase(fileItems,jobId),500);
    }else{
      showError("Erreur lors du téléversement");dropzone.classList.remove("hidden");
    }
  };
  xhr.onerror=()=>{showError("Erreur réseau lors du téléversement");dropzone.classList.remove("hidden");};

  xhr.send(formData);
}

/* ---------- PROCESSING STATUS POLLING ----------------------------- */
async function beginProcessingPhase(fileItems,jobId){
  const gInfo=document.querySelector(".status-text.uploaded");
  if(gInfo){gInfo.textContent="Traitement en cours…";gInfo.className="status-text processing";}

  fileItems.forEach(({fileItem})=>{
    const st=fileItem.querySelector(".status-text");
    st.textContent="Traitement en cours…";st.className="status-text processing";
    fileItem.querySelector(".spinner").style.display="block";
    fileItem.querySelector(".check-icon").classList.remove("show");
  });

  await checkStatus(jobId,fileItems);
}

async function checkStatus(jobId,fileItems){
  try{
    const res=await fetch(`${API_BASE}/status/${jobId}`);
    const data=await res.json();

    if(data.status==="done" && data.files){
      const gInfo=document.querySelector(".status-text.processing");
      if(gInfo){gInfo.textContent="Traitement terminé ✓";gInfo.className="status-text processed";}

      data.files.forEach(f=>{
        const entry=fileItems.get(f.id);if(!entry) return;
        const {fileItem,sizeBefore}=entry;

        fileItem.querySelector(".status-text").textContent="Traitement terminé ✓";
        fileItem.querySelector(".status-text").className="status-text processed";
        fileItem.querySelector(".spinner").style.display="none";
        fileItem.querySelector(".check-icon").classList.add("show");

        // Afficher taille avant → après
        const sizeDiv=fileItem.querySelector(".file-size");
        sizeDiv.textContent=`${formatBytes(sizeBefore)} → ${formatBytes(f.size_after)}`;

        const btn=fileItem.querySelector(".download-button");
        btn.classList.remove("hidden");btn.disabled=false;
        btn.addEventListener("click",()=>downloadFile(jobId,f.id,f.original));
      });

      // Gère bouton « tout télécharger »
      summaryDiv.classList.remove("hidden");
      if(data.files.length<=1){downloadAllButton.style.display="none";}
      else{downloadAllButton.style.display="inline-block";}
      downloadAllButton.onclick=()=>downloadAllFiles(jobId,data.files);
      showSummary(data.files);

    }else if(data.status==="error"){
      throw new Error(data.details||"Erreur pendant le traitement");
    }else{
      setTimeout(()=>checkStatus(jobId,fileItems),2000);
    }
  }catch(err){
    showError(err.message);dropzone.classList.remove("hidden");
  }
}

/* ---------- DOWNLOAD ---------------------------------------------- */
async function downloadFile(jobId,fileId,originalName){
  const btn=document.querySelector(`.download-button[data-file-id="${fileId}"]`);
  if(!btn) return;
  const fileItem=btn.closest(".file-item");
  const st=fileItem.querySelector(".status-text");
  const sp=fileItem.querySelector(".spinner");
  const ck=fileItem.querySelector(".check-icon");

  btn.disabled=true;btn.textContent="Téléchargement…";
  st.textContent="Téléchargement en cours…";st.className="status-text downloading";
  sp.style.display="block";ck.classList.remove("show");

  try{
    const res=await fetch(`${API_BASE}/download/${jobId}/file/${fileId}`);
    if(!res.ok) throw new Error("Erreur lors du téléchargement");
    const blob=await res.blob();
    const url=window.URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=originalName;document.body.appendChild(a);a.click();
    document.body.removeChild(a);window.URL.revokeObjectURL(url);

    st.textContent="Téléchargement terminé ✓";st.className="status-text downloaded";
    sp.style.display="none";ck.classList.add("show");
    btn.disabled=false;btn.textContent="Télécharger à nouveau";
  }catch(e){
    st.textContent="Erreur de téléchargement";st.className="status-text";
    showError(e.message);btn.disabled=false;btn.textContent="Télécharger";
  }
}

async function downloadAllFiles(jobId,files){
  for(const f of files){ await downloadFile(jobId,f.id,f.original); }
}

/* ---------- SUMMARY ------------------------------------------------ */
function showSummary(files){
  const ul=summaryDiv.querySelector("ul");
  ul.innerHTML="";
  files.forEach(f=>{
    const li=document.createElement("li");
    li.textContent=f.original;ul.appendChild(li);
  });
}

/* ---------- ERROR -------------------------------------------------- */
function showError(msg){
  const err=document.createElement("div");
  err.className="error-message";err.textContent=msg;fileList.appendChild(err);
}
