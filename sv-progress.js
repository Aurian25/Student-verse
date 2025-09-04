<!-- sv-progress.js -->
<script>
(function(){
  const CLASS_KEY = window.CLASS_KEY || document.body.dataset.class || "default";
  const PREFIX = `sv:${CLASS_KEY}:`;

  function storageSet(k,v){ localStorage.setItem(PREFIX + k, v); }
  function storageGet(k){ return localStorage.getItem(PREFIX + k); }

  function fieldKey(el){
    const type = (el.type||"").toLowerCase();
    if (type === "radio") return `radio:${el.name}`;
    return `field:${el.id}`;
  }

  function saveField(el){
    const type = (el.type||"").toLowerCase();
    if (type === "radio") {
      if (el.checked) storageSet(fieldKey(el), el.value);
    } else if (type === "checkbox") {
      storageSet(fieldKey(el), el.checked ? "1" : "0");
    } else {
      storageSet(fieldKey(el), el.value);
    }
  }

  function loadField(el){
    const type = (el.type||"").toLowerCase();
    const key = fieldKey(el);
    const val = storageGet(key);
    if (val == null) return;
    if (type === "radio") {
      el.checked = (el.value === val);
    } else if (type === "checkbox") {
      el.checked = (val === "1");
    } else {
      el.value = val;
    }
  }

  function autosaveFields(){
    const fields = document.querySelectorAll("[data-autosave]");
    fields.forEach(el=>{
      const type = (el.type||"").toLowerCase();
      el.addEventListener((type==="checkbox"||type==="radio") ? "change" : "input", ()=>saveField(el));
      loadField(el); // hydrate on load
    });
  }

  function collectProgress(){
    const data = { version:1, classKey: CLASS_KEY, savedAt: Date.now(), fields:{} };
    document.querySelectorAll("[data-autosave]").forEach(el=>{
      const key = fieldKey(el);
      const type = (el.type||"").toLowerCase();
      if (type === "radio") {
        if (el.checked) data.fields[key] = el.value;
      } else if (type === "checkbox") {
        data.fields[key] = el.checked ? "1" : "0";
      } else {
        data.fields[key] = el.value;
      }
    });
    return data;
  }

  function applyProgress(data){
    if (!data || data.classKey !== CLASS_KEY) return false;
    const map = data.fields || {};
    document.querySelectorAll("[data-autosave]").forEach(el=>{
      const key = fieldKey(el);
      const val = map[key];
      if (val == null) return;
      const type = (el.type||"").toLowerCase();
      if (type === "radio") {
        el.checked = (el.value === val);
      } else if (type === "checkbox") {
        el.checked = (val === "1");
      } else {
        el.value = val;
      }
      localStorage.setItem(PREFIX + key, val); // keep local per-field in sync
    });
    return true;
  }

  function saveProfileWithEmail(){
    const email = prompt("Enter your email to SAVE progress:");
    if (!email) return;
    const data = collectProgress();
    const key = `profile:${CLASS_KEY}:${email.trim().toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(data));
    alert("✅ Progress saved for " + email);
  }

  function restoreProfileWithEmail(){
    const email = prompt("Enter your email to RESTORE progress:");
    if (!email) return;
    const key = `profile:${CLASS_KEY}:${email.trim().toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) { alert("❌ No saved progress found for " + email); return; }
    try {
      const ok = applyProgress(JSON.parse(raw));
      alert(ok ? "✅ Progress restored!" : "⚠️ Saved data is for a different class.");
    } catch {
      alert("⚠️ Could not read saved progress.");
    }
  }

  function exportProfile(){
    const data = collectProgress();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {href:url, download:`${CLASS_KEY}-progress.json`});
    a.click(); URL.revokeObjectURL(url);
  }
  function importProfile(file){
    const reader = new FileReader();
    reader.onload = e=>{
      try {
        const ok = applyProgress(JSON.parse(e.target.result));
        alert(ok ? "✅ Imported!" : "⚠️ File is for a different class.");
      } catch {
        alert("⚠️ Invalid file.");
      }
    };
    reader.readAsText(file);
  }

  window.SV = { saveProfileWithEmail, restoreProfileWithEmail, exportProfile, importProfile };
  document.addEventListener("DOMContentLoaded", autosaveFields);
})();

const { createClient } = supabase;
const supabaseUrl = "https://etsmyrbvariwkedryzey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c215cmJ2YXJpd2tlZHJ5emV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTAwNDcsImV4cCI6MjA3MjQ4NjA0N30.-Sylp9U5ZQGD3JkbpF6aFCgFClT9JhSv20WTd0x8kOk";
const supabase = createClient(supabaseUrl, supabaseKey);

let standard = "Unknown";
if (document.title.includes("class-6–8")) standard = "class-6–8";
if (document.title.includes("class-9–10")) standard = "class-9–10";
if (document.title.includes("class-11–12")) standard = "class-11–12";
if (document.title.includes("ugpg")) standard = "ugpg";

// Save Progress
async function saveProgress() {
  const email = prompt("Enter your email to save progress:");
  if (!email) return;

  // Example: save all localStorage data
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  const { error } = await supabase.from("progress").upsert({
    email: email,
    standard: standard, // dynamic per page
    data: JSON.stringify(data),
    created_at: new Date()
  });

  if (error) {
    alert("Error saving progress: " + error.message);
  } else {
    alert(`Progress saved successfully for ${standard}!`);
  }
}

// Restore Progress
async function restoreProgress() {
  const email = prompt("Enter your email to restore progress:");
  if (!email) return;

  const { data, error } = await supabase
    .from("progress")
    .select("data")
    .eq("email", email)
    .eq("standard", standard) // restore for same class only
    .single();

  if (error || !data) {
    alert("No saved progress found!");
    return;
  }

  const savedData = JSON.parse(data.data);
  for (let key in savedData) {
    localStorage.setItem(key, savedData[key]);
  }

  alert(`Progress restored for ${standard}! Refresh the page to see your data.`);
}

</script>
