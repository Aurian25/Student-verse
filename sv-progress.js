// sv-progress.js

// ✅ Import Supabase client
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 🔑 Your Supabase Project URL + anon key
const supabaseUrl = "https://etsmyrbvariwkedryzey.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c215cmJ2YXJpd2tlZHJ5emV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTAwNDcsImV4cCI6MjA3MjQ4NjA0N30.-Sylp9U5ZQGD3JkbpF6aFCgFClT9JhSv20WTd0x8kOk";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🏫 Detect which class dashboard we’re on
const standard = window.CLASS_KEY || "unknown";

// 📌 Save Progress
async function saveProgress() {
  const email = prompt("Enter your email to save progress:");
  if (!email) return;

  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  const { error } = await supabase.from("progress").upsert({
    email: email.trim().toLowerCase(),
    standard,
    data: JSON.stringify(data),
    created_at: new Date()
  });

  if (error) {
    alert("❌ Error saving progress: " + error.message);
  } else {
    alert(`✅ Progress saved for ${standard}`);
  }
}

// 📌 Restore Progress
async function restoreProgress() {
  const email = prompt("Enter your email to restore progress:");
  if (!email) return;

  const { data, error } = await supabase
    .from("progress")
    .select("data")
    .eq("email", email.trim().toLowerCase())
    .eq("standard", standard)
    .single();

  if (error || !data) {
    alert("❌ No saved progress found!");
    return;
  }

  const savedData = JSON.parse(data.data);
  for (let key in savedData) {
    localStorage.setItem(key, savedData[key]);
  }

  alert(`✅ Progress restored for ${standard}! Refresh the page to see changes.`);
}

// 🔗 Expose globally
window.saveProgress = saveProgress;
window.restoreProgress = restoreProgress;
