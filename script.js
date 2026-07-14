(function () {
  "use strict";

  var STORAGE_KEY = "msqh_supervisor_script_records";

  var form = document.getElementById("script-form");
  var areaSelect = document.getElementById("kawasan-select");
  var btnSave = document.getElementById("btn-save");
  var btnPrint = document.getElementById("btn-print");
  var btnClear = document.getElementById("btn-clear");
  var saveStatus = document.getElementById("save-status");
  var recordsList = document.getElementById("records-list");
  var btnExport = document.getElementById("btn-export");
  var importInput = document.getElementById("import-input");
  var printKawasanEl = document.getElementById("print-kawasan");
  var printTimestampEl = document.getElementById("print-timestamp");

  function loadAllRecords() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Gagal membaca data tersimpan:", e);
      return {};
    }
  }

  function saveAllRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function getFormData() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value;
    });
    return data;
  }

  function fillForm(data) {
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) el.value = data && data[el.name] != null ? data[el.name] : "";
    });
  }

  function clearForm(keepArea) {
    var current = areaSelect.value;
    form.reset();
    if (keepArea) areaSelect.value = current;
    var nameField = form.elements["kawasanNama"];
    if (nameField && areaSelect.value) nameField.value = areaSelect.value;
  }

  function formatTimestamp(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return d.toLocaleString("ms-MY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderRecordsList() {
    var records = loadAllRecords();
    var keys = Object.keys(records);
    recordsList.innerHTML = "";

    if (keys.length === 0) {
      var empty = document.createElement("li");
      empty.className = "records-empty";
      empty.textContent = "Belum ada rekod disimpan.";
      recordsList.appendChild(empty);
      return;
    }

    keys.sort(function (a, b) {
      return (records[b].savedAt || "").localeCompare(records[a].savedAt || "");
    });

    keys.forEach(function (kawasan) {
      var rec = records[kawasan];
      var li = document.createElement("li");

      var label = document.createElement("span");
      label.innerHTML =
        "<strong>" + escapeHtml(kawasan) + "</strong> " +
        '<span class="record-meta">— disimpan ' + formatTimestamp(rec.savedAt) + "</span>";

      var actions = document.createElement("span");
      actions.className = "record-actions";

      var btnLoad = document.createElement("button");
      btnLoad.type = "button";
      btnLoad.className = "btn btn-ghost";
      btnLoad.textContent = "Muat";
      btnLoad.addEventListener("click", function () {
        areaSelect.value = kawasan;
        fillForm(rec);
        setStatus('Rekod "' + kawasan + '" dimuatkan.');
      });

      var btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn btn-ghost";
      btnDelete.textContent = "Padam";
      btnDelete.addEventListener("click", function () {
        if (!confirm('Padam rekod "' + kawasan + '"?')) return;
        var all = loadAllRecords();
        delete all[kawasan];
        saveAllRecords(all);
        renderRecordsList();
        setStatus('Rekod "' + kawasan + '" dipadam.');
      });

      actions.appendChild(btnLoad);
      actions.appendChild(btnDelete);
      li.appendChild(label);
      li.appendChild(actions);
      recordsList.appendChild(li);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function setStatus(msg) {
    saveStatus.textContent = msg;
    if (msg) {
      window.clearTimeout(setStatus._t);
      setStatus._t = window.setTimeout(function () {
        saveStatus.textContent = "";
      }, 4000);
    }
  }

  areaSelect.addEventListener("change", function () {
    var kawasan = areaSelect.value;
    if (!kawasan) {
      clearForm(false);
      return;
    }
    var records = loadAllRecords();
    if (records[kawasan]) {
      fillForm(records[kawasan]);
      setStatus('Rekod sedia ada untuk "' + kawasan + '" dimuatkan.');
    } else {
      clearForm(true);
      setStatus("");
    }
  });

  btnSave.addEventListener("click", function () {
    var kawasan = areaSelect.value;
    if (!kawasan) {
      alert("Sila pilih kawasan terlebih dahulu sebelum menyimpan.");
      areaSelect.focus();
      return;
    }
    var records = loadAllRecords();
    var data = getFormData();
    data.savedAt = new Date().toISOString();
    records[kawasan] = data;
    saveAllRecords(records);
    renderRecordsList();
    setStatus('Data untuk "' + kawasan + '" berjaya disimpan pada peranti ini.');
  });

  btnClear.addEventListener("click", function () {
    if (!confirm("Kosongkan semua ruang dalam borang ini? (Rekod tersimpan tidak akan terjejas sehingga anda tekan Simpan.)")) return;
    clearForm(true);
  });

  btnPrint.addEventListener("click", function () {
    var kawasan = areaSelect.value || getFormData().kawasanNama || "—";
    printKawasanEl.textContent = kawasan;
    var records = loadAllRecords();
    var rec = records[areaSelect.value];
    printTimestampEl.textContent = rec ? formatTimestamp(rec.savedAt) : formatTimestamp(new Date().toISOString());
    window.print();
  });

  btnExport.addEventListener("click", function () {
    var records = loadAllRecords();
    if (Object.keys(records).length === 0) {
      alert("Tiada rekod untuk dimuat turun.");
      return;
    }
    var blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "sandaran-script-msqh-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener("change", function () {
    var file = importInput.files && importInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(String(reader.result));
        var existing = loadAllRecords();
        var merged = Object.assign({}, existing, imported);
        saveAllRecords(merged);
        renderRecordsList();
        setStatus("Sandaran berjaya dimuat naik dan digabungkan.");
      } catch (e) {
        alert("Fail sandaran tidak sah. Sila pastikan ia fail JSON yang betul.");
      } finally {
        importInput.value = "";
      }
    };
    reader.readAsText(file);
  });

  renderRecordsList();
})();
