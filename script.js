import { API_URL } from "./config.js";

const POLL_INTERVAL_MS = 20000;

const form = document.getElementById("script-form");
const areaSelect = document.getElementById("kawasan-select");
const btnSave = document.getElementById("btn-save");
const btnPrint = document.getElementById("btn-print");
const btnClear = document.getElementById("btn-clear");
const saveStatus = document.getElementById("save-status");
const recordsList = document.getElementById("records-list");
const btnExport = document.getElementById("btn-export");
const importInput = document.getElementById("import-input");
const printKawasanEl = document.getElementById("print-kawasan");
const printTimestampEl = document.getElementById("print-timestamp");

let recordsCache = {};
let firstLoadDone = false;

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getFormData() {
  const data = {};
  Array.prototype.forEach.call(form.elements, (el) => {
    if (el.name) data[el.name] = el.value;
  });
  return data;
}

function fillForm(data) {
  Array.prototype.forEach.call(form.elements, (el) => {
    if (el.name) el.value = data && data[el.name] != null ? data[el.name] : "";
  });
}

function clearForm(keepArea) {
  const current = areaSelect.value;
  form.reset();
  if (keepArea) areaSelect.value = current;
  const nameField = form.elements["kawasanNama"];
  if (nameField && areaSelect.value) nameField.value = areaSelect.value;
}

function formatTimestamp(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let statusTimer = null;
function setStatus(msg, persistent) {
  saveStatus.textContent = msg;
  window.clearTimeout(statusTimer);
  if (msg && !persistent) {
    statusTimer = window.setTimeout(() => {
      saveStatus.textContent = "";
    }, 4000);
  }
}

async function apiGet() {
  const res = await fetch(API_URL, { method: "GET" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Ralat tidak diketahui");
  return json.records || [];
}

async function apiPost(payload) {
  // Sent as text/plain (not application/json) on purpose: this keeps the request a
  // CORS "simple request" so the browser skips the OPTIONS preflight that Apps Script
  // web apps don't handle. Code.gs still JSON.parses e.postData.contents normally.
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Ralat tidak diketahui");
  return json;
}

async function refreshRecords(silent) {
  try {
    const records = await apiGet();
    recordsCache = {};
    records.forEach((rec) => {
      if (rec.kawasanId) recordsCache[rec.kawasanId] = rec;
    });
    renderRecordsList();
    if (!firstLoadDone) {
      firstLoadDone = true;
      areaSelect.disabled = false;
      areaSelect.options[0].textContent = "— Pilih kawasan —";
    }
  } catch (e) {
    console.error(e);
    if (!silent) {
      setStatus(
        "Gagal memuatkan data dari Google Sheet. Sila semak sambungan internet atau config.js (API_URL).",
        !firstLoadDone
      );
    }
  }
}

function renderRecordsList() {
  const keys = Object.keys(recordsCache);
  recordsList.innerHTML = "";

  if (keys.length === 0) {
    const empty = document.createElement("li");
    empty.className = "records-empty";
    empty.textContent = "Belum ada rekod disimpan.";
    recordsList.appendChild(empty);
    return;
  }

  keys.sort((a, b) => {
    const nameA = recordsCache[a].kawasan || a;
    const nameB = recordsCache[b].kawasan || b;
    return nameA.localeCompare(nameB);
  });

  keys.forEach((kawasanId) => {
    const rec = recordsCache[kawasanId];
    const kawasanName = rec.kawasan || kawasanId;
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.innerHTML =
      "<strong>" + escapeHtml(kawasanName) + "</strong> " +
      '<span class="record-meta">— disimpan ' + formatTimestamp(rec.savedAt) + "</span>";

    const actions = document.createElement("span");
    actions.className = "record-actions";

    const btnLoad = document.createElement("button");
    btnLoad.type = "button";
    btnLoad.className = "btn btn-ghost";
    btnLoad.textContent = "Muat";
    btnLoad.addEventListener("click", () => {
      areaSelect.value = kawasanName;
      fillForm(rec);
      setStatus('Rekod "' + kawasanName + '" dimuatkan.');
    });

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-ghost";
    btnDelete.textContent = "Padam";
    btnDelete.addEventListener("click", async () => {
      if (!confirm('Padam rekod "' + kawasanName + '"? Tindakan ini memadam data untuk semua pengguna.')) return;
      try {
        await apiPost({ action: "delete", kawasanId: kawasanId });
        delete recordsCache[kawasanId];
        renderRecordsList();
        setStatus('Rekod "' + kawasanName + '" dipadam.');
      } catch (e) {
        console.error(e);
        setStatus("Gagal memadam rekod. Sila cuba lagi.");
      }
    });

    actions.appendChild(btnLoad);
    actions.appendChild(btnDelete);
    li.appendChild(label);
    li.appendChild(actions);
    recordsList.appendChild(li);
  });
}

areaSelect.addEventListener("change", () => {
  const kawasan = areaSelect.value;
  if (!kawasan) {
    clearForm(false);
    return;
  }
  const rec = recordsCache[slugify(kawasan)];
  if (rec) {
    fillForm(rec);
    setStatus('Rekod sedia ada untuk "' + kawasan + '" dimuatkan.');
  } else {
    clearForm(true);
    setStatus("");
  }
});

btnSave.addEventListener("click", async () => {
  const kawasan = areaSelect.value;
  if (!kawasan) {
    alert("Sila pilih kawasan terlebih dahulu sebelum menyimpan.");
    areaSelect.focus();
    return;
  }
  const data = getFormData();
  data.kawasan = kawasan;
  data.kawasanId = slugify(kawasan);

  btnSave.disabled = true;
  setStatus("Menyimpan...");
  try {
    const result = await apiPost({ action: "save", data: data });
    data.savedAt = result.savedAt;
    recordsCache[data.kawasanId] = data;
    renderRecordsList();
    setStatus('Data untuk "' + kawasan + '" berjaya disimpan dan boleh dilihat oleh semua pengguna.');
  } catch (e) {
    console.error(e);
    setStatus("Gagal menyimpan. Sila semak sambungan internet dan cuba lagi.");
  } finally {
    btnSave.disabled = false;
  }
});

btnClear.addEventListener("click", () => {
  if (!confirm("Kosongkan semua ruang dalam borang ini? (Rekod tersimpan tidak akan terjejas sehingga anda tekan Simpan.)")) return;
  clearForm(true);
});

btnPrint.addEventListener("click", () => {
  const kawasan = areaSelect.value || getFormData().kawasanNama || "—";
  printKawasanEl.textContent = kawasan;
  const rec = recordsCache[slugify(areaSelect.value)];
  printTimestampEl.textContent = rec ? formatTimestamp(rec.savedAt) : formatTimestamp(new Date());
  window.print();
});

btnExport.addEventListener("click", () => {
  if (Object.keys(recordsCache).length === 0) {
    alert("Tiada rekod untuk dimuat turun.");
    return;
  }
  const blob = new Blob([JSON.stringify(recordsCache, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = "sandaran-script-msqh-" + stamp + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", () => {
  const file = importInput.files && importInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(String(reader.result));
      const keys = Object.keys(imported);
      for (const key of keys) {
        const rec = { ...imported[key] };
        if (!rec.kawasan) rec.kawasan = key;
        rec.kawasanId = slugify(rec.kawasan);
        await apiPost({ action: "save", data: rec });
      }
      await refreshRecords();
      setStatus("Sandaran berjaya dimuat naik dan digabungkan.");
    } catch (e) {
      console.error(e);
      alert("Fail sandaran tidak sah atau gagal dimuat naik. Sila pastikan ia fail JSON yang betul.");
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
});

function init() {
  if (String(API_URL || "").startsWith("GANTI_DENGAN")) {
    setStatus("URL Google Apps Script belum ditetapkan (config.js). Sila lengkapkan setup terlebih dahulu — lihat README.", true);
    return;
  }
  refreshRecords();
  window.setInterval(() => refreshRecords(true), POLL_INTERVAL_MS);
}

init();
