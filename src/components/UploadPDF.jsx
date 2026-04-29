import { useState } from "react";
import { Upload } from "lucide-react";
import "./UploadPDF.css";

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    setMessage("PDF upload functionality - coming soon!");
  };

  return (
    <div className="upload-container">
      <h1>Upload Bank Statement</h1>
      <div className="upload-card">
        <form onSubmit={handleUpload}>
          <label htmlFor="file-upload" className="upload-area">
            <div className="upload-icon">
              <Upload size={32} color="#10b981" />
            </div>
            <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>
              {file ? file.name : "Click to upload or drag and drop"}
            </h3>
            <p className="upload-text">PDF files only (Max 10MB)</p>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <div className="file-info">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}

          <button type="submit" className="upload-btn" disabled={!file}>
            Upload Statement
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes("coming soon") ? "info" : "success"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
