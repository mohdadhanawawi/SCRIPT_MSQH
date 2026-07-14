const COLLECTION_NAME = "kawasanRecords";
const FIREBASE_SDK_VERSION = "10.14.1";

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

let db = null;
let recordsCache = {};
let firstLoadDone = false;

// Populated once the Firebase SDK modules load successfully (see init()).
let fs = {
  collection: null,
  doc: null,
  setDoc: null,
  deleteDoc: null,
  onSnapshot: null,
  writeBatch: null,
  serverTimestamp: null,
};

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
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
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
        await fs.deleteDoc(fs.doc(db, COLLECTION_NAME, kawasanId));
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
  data.savedAt = fs.serverTimestamp();

  btnSave.disabled = true;
  setStatus("Menyimpan...");
  try {
    await fs.setDoc(fs.doc(db, COLLECTION_NAME, slugify(kawasan)), data);
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
  const exportable = {};
  Object.keys(recordsCache).forEach((id) => {
    const rec = { ...recordsCache[id] };
    if (rec.savedAt && typeof rec.savedAt.toDate === "function") {
      rec.savedAt = rec.savedAt.toDate().toISOString();
    }
    exportable[id] = rec;
  });
  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
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
      const batch = fs.writeBatch(db);
      Object.keys(imported).forEach((key) => {
        const rec = { ...imported[key] };
        if (!rec.kawasan) rec.kawasan = key;
        const kawasanId = slugify(rec.kawasan);
        if (typeof rec.savedAt === "string") {
          // kept as ISO string on import; Firestore stores it as-is (not a native Timestamp),
          // formatTimestamp() falls back to `new Date(ts)` so display still works.
        } else {
          rec.savedAt = fs.serverTimestamp();
        }
        batch.set(fs.doc(db, COLLECTION_NAME, kawasanId), rec);
      });
      await batch.commit();
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

async function init() {
  let firebaseConfig, initializeApp, getFirestore, firestoreExports;
  try {
    [{ firebaseConfig }, { initializeApp }, firestoreExports] = await Promise.all([
      import("./firebase-config.js"),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`),
    ]);
    getFirestore = firestoreExports.getFirestore;
    fs.collection = firestoreExports.collection;
    fs.doc = firestoreExports.doc;
    fs.setDoc = firestoreExports.setDoc;
    fs.deleteDoc = firestoreExports.deleteDoc;
    fs.onSnapshot = firestoreExports.onSnapshot;
    fs.writeBatch = firestoreExports.writeBatch;
    fs.serverTimestamp = firestoreExports.serverTimestamp;
  } catch (e) {
    console.error(e);
    setStatus("Gagal memuatkan sistem storan awan (Firebase). Sila semak sambungan internet — jika di rangkaian hospital, pastikan domain gstatic.com/googleapis.com tidak disekat firewall.", true);
    return;
  }

  if (String(firebaseConfig.apiKey || "").startsWith("GANTI_DENGAN")) {
    setStatus("Config Firebase belum ditetapkan (firebase-config.js). Sila lengkapkan config projek Firebase terlebih dahulu.", true);
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.error(e);
    setStatus("Gagal berhubung dengan storan awan. Sila semak config Firebase.", true);
    return;
  }

  fs.onSnapshot(
    fs.collection(db, COLLECTION_NAME),
    (snapshot) => {
      recordsCache = {};
      snapshot.forEach((docSnap) => {
        recordsCache[docSnap.id] = docSnap.data();
      });
      renderRecordsList();
      if (!firstLoadDone) {
        firstLoadDone = true;
        areaSelect.disabled = false;
        areaSelect.options[0].textContent = "— Pilih kawasan —";
      }
    },
    (error) => {
      console.error(error);
      setStatus("Gagal menyambung ke pangkalan data. Sila semak sambungan internet.", true);
    }
  );
}

init();
