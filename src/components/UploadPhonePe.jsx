import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { Upload, Trash2, FileText } from "lucide-react";
import "./PhonePeUpload.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function UploadPhonePe() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState([]);
  const [success, setSuccess] = useState(false);

  ////////////////////////////////////////////////////////////
  // 📥 HANDLE UPLOAD
  ////////////////////////////////////////////////////////////

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      alert("Only PDF allowed ❌");
      return;
    }

    setLoading(true);
    setPreview([]);
    setSuccess(false);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const typedArray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((i) => i.str).join(" ") + "\n";
        }

        let transactions = parseTransactions(text);

        // 🔥 detect duplicates inside file
        transactions = markDuplicates(transactions);

        // 🔥 detect duplicates in DB
        transactions = await markExistingDuplicates(transactions);

        setPreview(transactions);
      } catch (err) {
        console.error(err);
        alert("PDF parsing failed ❌");
      }

      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  ////////////////////////////////////////////////////////////
  // ❌ REMOVE ONE ROW
  ////////////////////////////////////////////////////////////

  const removeRow = (index) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  ////////////////////////////////////////////////////////////
  // 🔥 REMOVE ALL DUPLICATES
  ////////////////////////////////////////////////////////////

  const removeDuplicates = () => {
    setPreview((prev) =>
      prev.filter((t) => !t.isDuplicate && !t.isExisting)
    );
  };

  ////////////////////////////////////////////////////////////
  // 💾 SAVE TO DB
  ////////////////////////////////////////////////////////////

  const saveToDb = async () => {
    if (preview.length === 0) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required ❌");
      setSaving(false);
      return;
    }

    const validRows = preview.filter(
      (t) => !t.isDuplicate && !t.isExisting
    );

    const skipped = preview.length - validRows.length;

    // 🔥 remove UI fields before insert
    const dataToInsert = validRows.map(({ isDuplicate, isExisting, ...t }) => ({
      ...t,
      user_id: user.id,
      unique_hash: makeHash(t),
    }));

    if (dataToInsert.length === 0) {
      alert("No new transactions to insert ✅");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .insert(dataToInsert);

    if (error) {
      console.error(error);
      alert("Error saving ❌");
    } else {
      alert(
        `✅ ${dataToInsert.length} inserted\n⚠ ${skipped} duplicates skipped`
      );
      setPreview([]);
      setSuccess(true);
    }

    setSaving(false);
  };

  ////////////////////////////////////////////////////////////
  // 🎨 UI
  ////////////////////////////////////////////////////////////

  return (
    <div className="phonepe-upload-container">
      <h2>
        <FileText size={28} /> Upload PhonePe PDF
      </h2>

      <div className="upload-section">
        <label className="upload-area">
        <input type="file" accept=".pdf" onChange={handleUpload} />

        <div className="upload-icon">
            <Upload size={24} />
        </div>

        <p className="upload-title">Click to upload PDF</p>
        <p className="upload-subtext">Only PhonePe statement supported</p>
        </label>

        {loading && <p>Parsing PDF...</p>}
        {saving && <p>Saving...</p>}
        {success && <p>✅ Imported successfully</p>}
      </div>

      {preview.length > 0 && (
        <div className="preview-section">
          <h3>Preview ({preview.length})</h3>

          <button
            onClick={removeDuplicates}
            disabled={!preview.some(t => t.isDuplicate || t.isExisting)}
          >
            Remove Duplicates (
            {preview.filter(t => t.isDuplicate || t.isExisting).length}
            )
          </button>

          {preview.map((t, i) => (
            <div
              key={i}
              className={`transaction-item 
                ${t.isDuplicate ? "duplicate" : ""} 
                ${t.isExisting ? "existing" : ""}`}
            >
              <div>
                <p>{t.description}</p>
                <p>₹{t.amount} | {t.type} | {t.date}</p>

                {t.isDuplicate && <span>⚠ Duplicate in file</span>}
                {t.isExisting && <span>⚠ Already in DB</span>}
              </div>

              <button onClick={() => removeRow(i)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            onClick={saveToDb}
            disabled={
              saving ||
              preview.filter(t => !t.isDuplicate && !t.isExisting).length === 0
            }
          >
            {saving ? "Saving..." : "Confirm Import"}
          </button>
        </div>
      )}
    </div>
  );
}

//////////////////////////////////////////////////////////////
// 🔥 PARSER
//////////////////////////////////////////////////////////////

function parseTransactions(text) {
  const transactions = [];

  const regex =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}.*?(CREDIT|DEBIT)\s+₹([\d,\.]+)\s+(Received from|Paid to)\s+(.+?)(?=Transaction ID|UTR|Page|$)/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    try {
      const rawDate = match[0].match(
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}/
      )[0];

      const date = new Date(rawDate).toISOString().split("T")[0];

      const type = match[2] === "CREDIT" ? "income" : "expense";
      const amount = Number(match[3].replace(/,/g, ""));
      const name = cleanText(match[5]);

      transactions.push({
        amount,
        type,
        category_id: detectCategory(name),
        description:
          (type === "income" ? "Received from " : "Paid to ") + name,
        date,
        source: "pdf",
      });
    } catch {}
  }

  return transactions;
}

//////////////////////////////////////////////////////////////
// 🧠 DUPLICATE DETECTION
//////////////////////////////////////////////////////////////

function markDuplicates(list) {
  const count = {};

  list.forEach((t) => {
    const key = makeHash(t);
    count[key] = (count[key] || 0) + 1;
  });

  return list.map((t) => ({
    ...t,
    isDuplicate: count[makeHash(t)] > 1,
  }));
}

//////////////////////////////////////////////////////////////
// 🔥 DB DUPLICATE CHECK
//////////////////////////////////////////////////////////////

async function markExistingDuplicates(list) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return list;

  const hashes = list.map((t) => makeHash(t));

  const { data } = await supabase
    .from("transactions")
    .select("unique_hash")
    .eq("user_id", user.id)
    .in("unique_hash", hashes);

  const set = new Set(data?.map((d) => d.unique_hash));

  return list.map((t) => ({
    ...t,
    isExisting: set.has(makeHash(t)),
  }));
}

//////////////////////////////////////////////////////////////
// 🧹 CLEAN
//////////////////////////////////////////////////////////////

function cleanText(text) {
  return String(text || "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

//////////////////////////////////////////////////////////////
// 🧠 CATEGORY
//////////////////////////////////////////////////////////////

function detectCategory(name) {
  const text = name.toLowerCase();

  if (
    text.includes("restaurant") ||
    text.includes("kirana") ||
    text.includes("swiggy")
  )
    return "food";

  if (text.includes("uber") || text.includes("ola"))
    return "travel";

  if (text.includes("jio") || text.includes("mobile"))
    return "bills";

  if (text.includes("salary") || text.includes("cashfree"))
    return "salary";

  return "general";
}

//////////////////////////////////////////////////////////////
// 🔐 HASH
//////////////////////////////////////////////////////////////

function makeHash(t) {
  return `${t.amount}-${t.type}-${t.description}-${t.date}`;
}