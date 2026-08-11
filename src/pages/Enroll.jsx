import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import { API_BASE_URL, apiService } from '../services/api';
import "./Enroll.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE_MB = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidImage(file) {
  return ACCEPTED_TYPES.includes(file.type.toLowerCase());
}

function buildErrorMessage(error, employeeId = "") {
  let text = "❌ Upload failed";
  let detail = "";

  if (error.response) {
    const { status, data } = error.response;
    const serverDetail = data?.detail || "Unknown server error";

    if (status === 422) {
      text = "❌ Face Verification Failed";
      detail = serverDetail;
      if (serverDetail.includes("No face detected")) { text = "❌ No Face Detected"; detail = "Ensure the face is clearly visible, front-facing, and well-lit."; }
      else if (serverDetail.includes("Face too small")) { text = "❌ Face Too Small"; detail = "Move closer to the camera or use a higher-resolution image."; }
      else if (serverDetail.includes("Multiple faces")) { text = "❌ Multiple Faces Found"; detail = "Only one person should appear in each image."; }
      else if (serverDetail.includes("already enrolled")) {
        text = "❌ Employee Already Enrolled";
        detail = `Employee ID "${employeeId}" already exists. You can add more photos to this profile in the Employee List.`;
        return { type: "info", text, detail, action: "view_list" };
      }
    } else if (status === 409) {
      text = "❌ Duplicate Employee";
      detail = `Employee ID "${employeeId}" already exists. Use a different ID or delete first.`;
    } else if (status === 404) {
      text = "❌ Session Expired";
      detail = "Your preview session expired. Please start the upload again.";
    } else if (status === 400) {
      text = "❌ Invalid Request";
      detail = serverDetail;
    } else if (status === 503) {
      text = "❌ Camera Not Ready";
      detail = serverDetail;
    } else {
      text = `❌ Server error (${status})`;
      detail = serverDetail;
    }
  } else {
    text = "❌ Cannot reach backend";
    detail = "Make sure the FastAPI server is running on port 8000.";
  }

  return { type: "error", text, detail };
}

// ─── Icon helpers (inline SVG) ────────────────────────────────────────────────
const Icon = {
  UserPlus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Person: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Images: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#025F67" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Camera: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  CameraLg: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Retake: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  ),
  Upload: ({ color = "#025F67" }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckSmall: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  XLarge: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  File: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Size: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  InvalidImg: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Enroll() {

  // ── Employee details ─────────────────────────────────────────────────────
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [idConflict, setIdConflict] = useState(null); // { id, name }

  const navigate = useNavigate();

  // ── Fetch existing employees for pre-check ───────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/employees`);
        setAllEmployees(Array.isArray(res.data) ? res.data : (res.data?.employees ?? []));
      } catch (err) { console.error("Pre-check fetch failed:", err); }
    };
    fetchAll();
  }, []);

  // ── ID Conflict Check ────────────────────────────────────────────────────
  useEffect(() => {
    if (!employeeId.trim()) {
      setIdConflict(null);
      return;
    }
    const conflict = allEmployees.find(e =>
      String(e.employee_id ?? e.emp_no) === employeeId.trim()
    );
    setIdConflict(conflict || null);
  }, [employeeId, allEmployees]);


  // ── Upload phase: raw file list ──────────────────────────────────────────
  const [fileEntries, setFileEntries] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // ── Camera capture state ─────────────────────────────────────────────────
  // captureMode: 'idle' | 'loading'
  // capturedImages: array of { id, b64, width, height } — multiple captures allowed
  const [captureMode, setCaptureMode] = useState("idle");
  const [capturedImages, setCapturedImages] = useState([]); // list grows with each capture
  const [captureError, setCaptureError] = useState(null);
  const captureIdRef = useRef(0);

  // ── Preview phase ────────────────────────────────────────────────────────
  const [previewFaces, setPreviewFaces] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // ── Shared state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [previewCapturing, setPreviewCapturing] = useState(false); // camera busy in preview phase

  const [lightbox, setLightbox] = useState(null);

  const fileInputRef = useRef(null);
  const addMoreFileInputRef = useRef(null);
  const entryIdRef = useRef(0);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!employeeId.trim()) {
      errs.employeeId = "Employee ID is required";
    } else if (!/^\d+$/.test(employeeId.trim())) {
      errs.employeeId = "Only numbers are allowed";
    } else if (idConflict) {
      errs.employeeId = "Employee Number already exists";
    }
    if (!name.trim()) {
      errs.name = "Employee Name is required";
    } else if (!/^[a-zA-Z\\s]+$/.test(name.trim())) {
      errs.name = "Only letters and spaces are allowed";
    }

    const hasUploadedFiles = fileEntries.filter((e) => e.valid).length > 0;
    const hasCapturedImages = capturedImages.length > 0;
    if (!hasUploadedFiles && !hasCapturedImages)
      errs.files = "Please upload an image or capture one from the camera";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Process & append incoming files ──────────────────────────────────────
  const processAndAppendFiles = useCallback(async (rawFiles) => {
    const incoming = Array.from(rawFiles);

    const newEntries = await Promise.all(
      incoming.map(
        (file) =>
          new Promise((resolve) => {
            const id = ++entryIdRef.current;
            const valid = isValidImage(file) && file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
            if (valid) {
              const reader = new FileReader();
              reader.onload = (e) => resolve({ id, file, preview: e.target.result, valid: true });
              reader.readAsDataURL(file);
            } else {
              resolve({ id, file, preview: null, valid: false });
            }
          })
      )
    );

    setFileEntries((prev) => {
      const existingKeys = new Set(prev.map((e) => `${e.file.name}-${e.file.size}`));
      return [...prev, ...newEntries.filter((e) => !existingKeys.has(`${e.file.name}-${e.file.size}`))];
    });
    setErrors((prev) => ({ ...prev, files: undefined }));
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.length) processAndAppendFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id) => setFileEntries((prev) => prev.filter((e) => e.id !== id));
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processAndAppendFiles(e.dataTransfer.files);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // CAMERA — Capture snapshot from Jetson camera via GET /capture/snapshot
  // Each click ADDS a new frame to capturedImages (no limit, supports 50+)
  // ──────────────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    setCaptureError(null);
    setCaptureMode("loading");

    try {
      const data = await apiService.captureSnapshot();
      const { image_b64, width, height } = data;

      if (!image_b64) throw new Error("No image data returned from camera");

      const id = ++captureIdRef.current;
      setCapturedImages((prev) => [...prev, { id, b64: image_b64, width, height }]);
      setCaptureMode("idle");
      setErrors((prev) => ({ ...prev, files: undefined }));

    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.code === "ECONNABORTED" ? "Camera timed out. Is the Jetson server running?" : err.message);
      setCaptureError(msg);
      setCaptureMode("idle");
    }
  };

  // Remove one captured image by id
  const removeCapturedImage = (id) =>
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));

  // Clear all captured images
  const clearAllCaptured = () => setCapturedImages([]);

  // Convert a single base64 capture → File object
  const captureToFile = ({ b64, id }) => {
    const byteStr = atob(b64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/jpeg" });
    return new File([blob], `capture_${id}_${Date.now()}.jpg`, { type: "image/jpeg" });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1 — Upload & Preview  →  POST /enroll/preview
  // ──────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;

    const validFiles = fileEntries.filter((e) => e.valid).map((e) => e.file);

    // Add all camera-captured images
    capturedImages.forEach((img) => validFiles.push(captureToFile(img)));

    try {
      setLoading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("employee_id", employeeId.trim());
      formData.append("name", name.trim());
      validFiles.forEach((file) => formData.append("files", file));

      const res = await axios.post(`${API_BASE_URL}/enroll/preview`, formData, {
        timeout: 120000,
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const { session_id, previews } = res.data;

      setSessionId(session_id);
      setPreviewFaces(previews);
      setPreviewMode(true);
      setFileEntries([]);
      setCapturedImages([]);
      setCaptureMode("idle");
      setUploadProgress(0);

    } catch (error) {
      console.error("Preview error:", error);
      setMessage(buildErrorMessage(error, employeeId.trim()));
    } finally {
      setLoading(false);
    }
  };

  // ── Remove a face from approval list ─────────────────────────────────────
  const removePreviewFace = (token) =>
    setPreviewFaces((prev) => prev.filter((f) => f.token !== token));

  // ── Add more images in preview mode ──────────────────────────────────────
  const handleAddMore = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("employee_id", employeeId.trim());
      formData.append("name", name.trim());
      formData.append("session_id", sessionId);
      files.forEach((f) => formData.append("files", f));

      const res = await axios.post(`${API_BASE_URL}/enroll/preview`, formData, {
        timeout: 120000,
      });

      const { previews } = res.data;
      setPreviewFaces((prev) => [...prev, ...previews]);

    } catch (error) {
      console.error("Add more error:", error);
      setMessage(buildErrorMessage(error, employeeId.trim()));
    } finally {
      setLoading(false);
    }
  };

  // ── Capture from camera while in preview mode ───────────────────────────
  // Grabs a live frame, converts to File, sends to /enroll/preview.
  // If the session expired (404), automatically creates a fresh session
  // and continues — user never sees a hard failure.
  const handleCaptureInPreview = async () => {
    setPreviewCapturing(true);
    setMessage(null);

    try {
      const data = await apiService.captureSnapshot();
      const { image_b64 } = data;
      if (!image_b64) throw new Error("No image data returned from camera");

      // Convert base64 → File
      const byteStr = atob(image_b64);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/jpeg" });
      const file = new File([blob], `preview_capture_${Date.now()}.jpg`, { type: "image/jpeg" });

      // Build formData — try existing session first, fall back to new session on 404
      const sendCapture = async (sid) => {
        const formData = new FormData();
        formData.append("employee_id", employeeId.trim());
        formData.append("name", name.trim());
        if (sid) formData.append("session_id", sid);
        formData.append("files", file);
        return axios.post(`${API_BASE_URL}/enroll/preview`, formData, { timeout: 30000 });
      };

      let res;
      try {
        // Attempt with current session
        res = await sendCapture(sessionId);
      } catch (sessionErr) {
        if (sessionErr.response?.status === 404) {
          // Session expired — start a fresh one (no session_id = new session)
          res = await sendCapture(null);
          // Update sessionId so all future captures use the new session
          setSessionId(res.data.session_id);
        } else {
          throw sessionErr;
        }
      }

      const { previews } = res.data;
      setPreviewFaces((prev) => [...prev, ...previews]);

    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.code === "ECONNABORTED" ? "Camera timed out." : err.message);
      setMessage({ type: "error", text: "❌ Capture failed", detail: msg });
    } finally {
      setPreviewCapturing(false);
    }
  };

  // ── Cancel preview session ────────────────────────────────────────────────
  const handleCancel = async () => {
    if (sessionId) {
      axios.delete(`${API_BASE_URL}/enroll/preview/${sessionId}`).catch(() => { });
    }
    setPreviewMode(false);
    setPreviewFaces([]);
    setSessionId(null);
    setMessage(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2 — Confirm  →  POST /enroll/confirm
  // If the session expired (404), we re-submit all approved face previews
  // as new files directly to /enroll (single-step fallback).
  // ──────────────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const approvedFaces = previewFaces.filter((f) => f.status === "ok" && f.token);
    const approvedTokens = approvedFaces.map((f) => f.token);

    if (approvedTokens.length === 0) {
      setMessage({
        type: "error",
        text: "❌ No valid images to enroll",
        detail: "Add or keep at least one successfully cropped image.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("approved_tokens", JSON.stringify(approvedTokens));

      const res = await axios.post(`${API_BASE_URL}/enroll/confirm`, formData, {
        timeout: 120000,
      });

      const processed = res.data?.num_images_processed ?? approvedTokens.length;

      setMessage({
        type: "success",
        text: "✅ Employee enrolled successfully!",
        detail: `${processed} image(s) processed and stored.`,
      });

      // Full reset
      setPreviewMode(false);
      setPreviewFaces([]);
      setSessionId(null);
      setEmployeeId("");
      setName("");
      setErrors({});
      setCapturedImages([]);
      setCaptureMode("idle");

    } catch (error) {
      // ── Session expired recovery ──────────────────────────────────────────
      // If the session expired (404), send approved face crops directly to
      // the single-step /enroll endpoint — no session needed.
      if (error.response?.status === 404) {
        try {
          setMessage({
            type: "warning",
            text: "⚠️ Session expired — re-submitting faces directly…",
            detail: "Please wait, enrolling now.",
          });

          const files = approvedFaces
            .filter((f) => f.face_b64)
            .map((f, i) => {
              const byteStr = atob(f.face_b64);
              const arr = new Uint8Array(byteStr.length);
              for (let i2 = 0; i2 < byteStr.length; i2++) arr[i2] = byteStr.charCodeAt(i2);
              const blob = new Blob([arr], { type: "image/jpeg" });
              return new File([blob], f.filename || `face_${i}_${Date.now()}.jpg`, { type: "image/jpeg" });
            });

          if (files.length === 0) throw new Error("No face images available to re-enroll");

          const formData = new FormData();
          formData.append("employee_id", employeeId.trim());
          formData.append("name", name.trim());
          files.forEach((file) => formData.append("files", file));

          const res = await axios.post(`${API_BASE_URL}/enroll`, formData, { timeout: 180000 });
          const processed = res.data?.num_images_processed ?? files.length;

          setMessage({
            type: "success",
            text: "✅ Employee enrolled successfully!",
            detail: `${processed} image(s) processed and stored.`,
          });

          setPreviewMode(false);
          setPreviewFaces([]);
          setSessionId(null);
          setEmployeeId("");
          setName("");
          setErrors({});
          setCapturedImages([]);
          setCaptureMode("idle");

        } catch (retryErr) {
          console.error("Re-enroll error:", retryErr);
          setMessage({
            type: "error",
            text: "❌ Enrollment failed — please click Cancel and try again",
            detail: retryErr.response?.data?.detail || retryErr.message,
          });
        }
      } else {
        console.error("Confirm error:", error);
        setMessage(buildErrorMessage(error, employeeId.trim()));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const validCount = fileEntries.filter((e) => e.valid).length;
  const invalidCount = fileEntries.filter((e) => !e.valid).length;
  const totalSizeBytes = fileEntries.filter((e) => e.valid).reduce((s, { file }) => s + file.size, 0);
  const approvedCount = previewFaces.filter((f) => f.status === "ok" && f.token).length;
  const errorCount = previewFaces.filter((f) => f.status !== "ok").length;

  const totalImageCount = validCount + capturedImages.length;

  const dropZoneClass = [
    "drop-zone",
    dragOver ? "drag-over" : "",
    validCount ? "has-files" : "",
    errors.files ? "drop-error" : "",
  ].filter(Boolean).join(" ");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="enroll-page-wrapper">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="enroll-page-header">
        <div className="enroll-page-icon">
          <Icon.UserPlus />
        </div>
        <div>
          <h1 className="enroll-page-title">Bulk Employee Enrollment</h1>
          <p className="enroll-page-subtitle">
            {previewMode
              ? `Review cropped faces for ${name || "employee"} — approve before enrolling`
              : "Register new personnel with multiple face images"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="enroll-step-indicator" style={{ marginLeft: "auto" }}>
          <div className={`enroll-step ${!previewMode ? "enroll-step--active" : "enroll-step--done"}`}>
            <span className="enroll-step-num">{!previewMode ? "1" : "✓"}</span>
            Upload
          </div>
          <div className="enroll-step-connector" />
          <div className={`enroll-step ${previewMode ? "enroll-step--active" : ""}`}>
            <span className="enroll-step-num">2</span>
            Review & Confirm
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 1 — Upload Form
      ══════════════════════════════════════════════════════════════════════ */}
      {!previewMode && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="enroll-grid">

            {/* ── LEFT: Employee Details ────────────────────────────────── */}
            <div className="enroll-card">
              <h2 className="enroll-card-title">
                <span className="enroll-card-title-icon"><Icon.Person /></span>
                Employee Details
              </h2>

              {/* Employee ID */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-id">
                  Employee ID <span className="required-star">*</span>
                </label>
                <input
                  id="emp-id"
                  type="text"
                  value={employeeId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmployeeId(val);
                    if (val && !/^\d+$/.test(val)) {
                      setErrors((p) => ({ ...p, employeeId: "Only numbers are allowed" }));
                    } else {
                      setErrors((p) => ({ ...p, employeeId: undefined }));
                    }
                  }}
                  className={`form-input${errors.employeeId ? " input-error" : ""}`}
                  placeholder="e.g. 1001"
                  autoComplete="off"
                />

                {idConflict && (
                  <div className="id-conflict-banner">
                    <div className="conflict-info">
                      <Icon.AlertCircle />
                      <span>
                        <strong>ID already exists:</strong> {idConflict.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="conflict-update-btn"
                      onClick={() => navigate(`/employees?update=${employeeId.trim()}`)}
                    >
                      Update Profile Instead →
                    </button>
                  </div>
                )}

                {errors.employeeId && (

                  <div className="field-error">
                    <Icon.AlertCircle /> {errors.employeeId}
                  </div>
                )}
              </div>

              {/* Employee Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-name">
                  Employee Name <span className="required-star">*</span>
                </label>
                <input
                  id="emp-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (val && !/^[a-zA-Z\\s]+$/.test(val)) {
                      setErrors((p) => ({ ...p, name: "Only letters and spaces are allowed" }));
                    } else {
                      setErrors((p) => ({ ...p, name: undefined }));
                    }
                  }}
                  className={`form-input${errors.name ? " input-error" : ""}`}
                  placeholder="e.g. Jane Smith"
                  autoComplete="off"
                />
                {errors.name && (
                  <div className="field-error">
                    <Icon.AlertCircle /> {errors.name}
                  </div>
                )}
              </div>

              {/* ── Camera Capture Section ────────────────────────────── */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span className="enroll-card-title-icon" style={{ width: 22, height: 22 }}>
                    <Icon.Camera />
                  </span>
                  Capture from Jetson Camera
                </label>

                {/* Capture button — always visible in idle, label changes after first capture */}
                {captureMode === "idle" && (
                  <button
                    type="button"
                    className="capture-btn"
                    onClick={handleCapture}
                    disabled={loading}
                  >
                    <Icon.CameraLg />
                    {capturedImages.length === 0 ? "Capture Photo" : "Capture Another"}
                  </button>
                )}

                {/* Loading state — spinner */}
                {captureMode === "loading" && (
                  <div className="capture-loading">
                    <div className="capture-spinner" />
                    <span>Grabbing frame from camera…</span>
                  </div>
                )}

                {/* Captured images grid — shows all captured frames */}
                {capturedImages.length > 0 && (
                  <div className="capture-list-wrap">
                    <div className="capture-list-header">
                      <span className="capture-list-count">
                        <Icon.CheckSmall /> {capturedImages.length} photo{capturedImages.length !== 1 ? "s" : ""} captured
                      </span>
                      <button
                        type="button"
                        className="capture-clear-btn"
                        onClick={clearAllCaptured}
                        disabled={loading}
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="capture-grid">
                      {capturedImages.map((img) => (
                        <div key={img.id} className="capture-grid-thumb">
                          <img
                            src={`data:image/jpeg;base64,${img.b64}`}
                            alt={`Capture ${img.id}`}
                            onClick={() =>
                              setLightbox({
                                face_b64: img.b64,
                                filename: `Capture #${img.id} — ${img.width}×${img.height}`,
                              })
                            }
                            title="Click to zoom"
                          />
                          <button
                            type="button"
                            className="capture-grid-remove"
                            onClick={() => removeCapturedImage(img.id)}
                            title="Remove"
                          >
                            <Icon.X />
                          </button>
                          <div className="capture-grid-num">#{img.id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capture error */}
                {captureError && (
                  <div className="field-error" style={{ marginTop: "0.5rem" }}>
                    <Icon.AlertCircle /> {captureError}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Image Upload ───────────────────────────────────── */}
            <div className="enroll-card">
              <h2 className="enroll-card-title">
                <span className="enroll-card-title-icon"><Icon.Images /></span>
                Image Upload
                {totalImageCount > 0 && (
                  <span className="mode-chip" style={{ marginLeft: "auto" }}>
                    {totalImageCount} Image{totalImageCount !== 1 ? "s" : ""} Selected
                  </span>
                )}
              </h2>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                className="file-input-hidden"
                onChange={handleFileChange}
                id="file-input-multiple"
              />

              {/* Drop zone */}
              <div
                className={dropZoneClass}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: "pointer" }}
              >
                <div className="drop-zone-icon">
                  <Icon.Upload color="#025F67" />
                </div>
                {fileEntries.length === 0 ? (
                  <>
                    <div className="drop-zone-text">Click or drag &amp; drop images</div>
                    <div className="drop-zone-subtext">
                      JPG, PNG, JPEG accepted · Max {MAX_FILE_SIZE_MB} MB each · Multiple files supported
                    </div>
                  </>
                ) : (
                  <>
                    <div className="drop-zone-count">
                      {validCount} valid image{validCount !== 1 ? "s" : ""} selected
                      {invalidCount > 0 && ` · ${invalidCount} invalid`}
                    </div>
                    <div className="drop-zone-subtext" style={{ marginTop: 4 }}>
                      Click or drop more images to add
                    </div>
                  </>
                )}
              </div>

              {errors.files && (
                <div className="field-error" style={{ marginTop: "0.5rem" }}>
                  <Icon.AlertCircle /> {errors.files}
                </div>
              )}

              {/* Add More button */}
              {fileEntries.length > 0 && (
                <button
                  type="button"
                  className="add-more-btn"
                  onClick={() => fileInputRef.current?.click()}
                  id="add-more-images-btn"
                >
                  <Icon.Plus /> Add More Images
                </button>
              )}

              {/* Stats bar */}
              {validCount > 0 && (
                <div className="upload-stats">
                  <div className="upload-stat-item">
                    <Icon.File />
                    {validCount} image{validCount !== 1 ? "s" : ""}
                  </div>
                  <div className="upload-stat-item">
                    <Icon.Size />
                    {formatBytes(totalSizeBytes)} total
                  </div>
                  {invalidCount > 0 && (
                    <div className="upload-stat-item" style={{ color: "#dc2626" }}>
                      <Icon.InvalidImg />
                      {invalidCount} skipped (invalid format/size)
                    </div>
                  )}
                </div>
              )}

              {/* Raw file preview grid */}
              {fileEntries.length > 0 && (
                <div className="preview-section">
                  <div className="preview-section-header">
                    <span className="preview-section-title">
                      Preview — {fileEntries.length} file{fileEntries.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      className="clear-all-btn"
                      onClick={() => setFileEntries([])}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="preview-grid">
                    {fileEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`preview-thumb${!entry.valid ? " invalid" : ""}`}
                        title={entry.file.name}
                      >
                        {entry.preview ? (
                          <img src={entry.preview} alt={entry.file.name} loading="lazy" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}
                        {!entry.valid && <div className="invalid-badge">Invalid</div>}
                        <div className="preview-thumb-name">{entry.file.name}</div>
                        <button
                          type="button"
                          className="preview-thumb-remove"
                          onClick={(e) => { e.stopPropagation(); removeFile(entry.id); }}
                          aria-label="Remove image"
                        >
                          <Icon.X />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status message */}
              {message && (
                <div className={`status-message status-${message.type}`}>
                  <span style={{ marginTop: 1 }}>
                    {message.type === "success" ? <Icon.Check /> : <Icon.AlertCircle />}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{message.text}</div>
                    {message.detail && (
                      <div style={{ marginTop: 4, fontSize: "0.82rem", opacity: 0.85 }}>
                        {message.detail}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload progress */}
              {loading && (
                <div className="upload-progress-wrap">
                  <div className="upload-progress-label">
                    <span>Uploading & detecting faces…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="upload-progress-bar-track">
                    <div
                      className="upload-progress-bar-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit → goes to preview */}
              <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn"
                  id="enroll-submit-btn"
                  style={{ flex: "1 1 240px" }}
                >
                  {loading ? (
                    <><div className="spinner" /> Detecting Faces…</>
                  ) : (
                    <><Icon.Eye /> Preview Cropped Faces</>
                  )}
                </button>

                {message && message.action === "view_list" && (
                  <button
                    type="button"
                    className="export-btn"
                    style={{ flex: "1 1 200px", borderColor: "#025F67", color: "#025F67", height: "48px", background: "#e6f4f5" }}
                    onClick={() => window.location.href = `/employees?update=${employeeId}`}
                  >
                    Update Existing Profile
                  </button>
                )}

                <p className="submit-hint" style={{ width: "100%", marginTop: "0.5rem" }}>
                  You'll review the cropped faces before they are enrolled.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 2 — Preview & Approval
      ══════════════════════════════════════════════════════════════════════ */}
      {previewMode && (
        <div className="approval-wrapper">

          {/* Hidden input for adding more images in preview mode */}
          <input
            ref={addMoreFileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            multiple
            className="file-input-hidden"
            onChange={handleAddMore}
          />

          {/* ── Employee info bar ────────────────────────────────────────── */}
          <div className="approval-info-bar">
            <div className="approval-info-left">
              <div className="approval-emp-badge">
                <span className="approval-emp-label">ID</span>
                <span className="approval-emp-value">{employeeId}</span>
              </div>
              <div className="approval-emp-badge">
                <span className="approval-emp-label">Name</span>
                <span className="approval-emp-value">{name}</span>
              </div>
            </div>
            <div className="approval-info-right">
              <span className="approval-count-badge approval-count-badge--ok">
                <Icon.CheckSmall /> {approvedCount} ready
              </span>
              {errorCount > 0 && (
                <span className="approval-count-badge approval-count-badge--err">
                  <Icon.AlertCircle /> {errorCount} failed
                </span>
              )}
            </div>
          </div>

          {/* ── Instruction banner ───────────────────────────────────────── */}
          <div className="approval-banner">
            <div className="approval-banner-icon">
              <Icon.Eye />
            </div>
            <div className="approval-banner-text">
              <strong>Review your cropped face images below.</strong>
              {" "}Remove any that look incorrect, then click <strong>Confirm Enrollment</strong>.
              The embedding model will only run on the images you approve.
            </div>
          </div>

          {/* ── Cropped face grid ────────────────────────────────────────── */}
          {previewFaces.length === 0 ? (
            <div className="approval-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>No images — use <strong>Add Images</strong> below to add some.</p>
            </div>
          ) : (
            <div className="approval-grid">
              {previewFaces.map((face) => (
                <div
                  key={face.token ?? face.filename}
                  className={`approval-thumb ${face.status !== "ok" ? "approval-thumb--error" : ""}`}
                >
                  {face.status === "ok" && face.face_b64 ? (
                    <>
                      <img
                        src={`data:image/jpeg;base64,${face.face_b64}`}
                        alt={face.filename}
                        className="approval-thumb-img"
                        onClick={() => setLightbox({ face_b64: face.face_b64, filename: face.filename })}
                        title="Click to zoom"
                      />
                      <div className="approval-ok-badge">
                        <Icon.CheckSmall />
                      </div>
                    </>
                  ) : (
                    <div className="approval-thumb-error-body">
                      <Icon.AlertCircle />
                      <span>{face.error || "Detection failed"}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="approval-thumb-remove"
                    onClick={() => removePreviewFace(face.token)}
                    title="Remove this image"
                  >
                    <Icon.X />
                  </button>

                  <div className="approval-thumb-name">{face.filename}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Status / error message ───────────────────────────────────── */}
          {message && (
            <div className={`status-message status-${message.type}`}>
              <span style={{ marginTop: 1 }}>
                {message.type === "success" ? <Icon.Check /> : <Icon.AlertCircle />}
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>{message.text}</div>
                {message.detail && (
                  <div style={{ marginTop: 4, fontSize: "0.82rem", opacity: 0.85 }}>
                    {message.detail}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Loading overlay for confirm ──────────────────────────────── */}
          {loading && (
            <div className="upload-progress-wrap">
              <div className="upload-progress-label">
                <span>Running embedding model…</span>
              </div>
              <div className="upload-progress-bar-track">
                <div className="upload-progress-bar-fill" style={{ width: "100%", animation: "indeterminate 1.4s ease infinite" }} />
              </div>
            </div>
          )}

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <div className="approval-actions">

            {/* ❌ Cancel */}
            <button
              type="button"
              className="approval-btn approval-btn--cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              <Icon.XLarge /> Cancel
            </button>

            {/* ➕ Add Images */}
            <button
              type="button"
              className="approval-btn approval-btn--add"
              onClick={() => addMoreFileInputRef.current?.click()}
              disabled={loading || previewCapturing}
            >
              <Icon.Plus /> Add Images
            </button>

            {/* 📷 Capture from Camera */}
            <button
              type="button"
              className="approval-btn approval-btn--capture"
              onClick={handleCaptureInPreview}
              disabled={loading || previewCapturing}
            >
              {previewCapturing ? (
                <><div className="spinner spinner--dark" /> Capturing…</>
              ) : (
                <><Icon.CameraLg /> Capture</>
              )}
            </button>

            {/* ✅ Confirm Enrollment */}
            <button
              type="button"
              className="approval-btn approval-btn--confirm"
              onClick={handleConfirm}
              disabled={loading || approvedCount === 0}
            >
              {loading ? (
                <><div className="spinner" /> Enrolling…</>
              ) : (
                <><Icon.Check /> Confirm Enrollment ({approvedCount} image{approvedCount !== 1 ? "s" : ""})</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <img
              src={`data:image/jpeg;base64,${lightbox.face_b64}`}
              alt={lightbox.filename}
              className="lightbox-img"
            />
            <div className="lightbox-name">{lightbox.filename}</div>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>
              <Icon.XLarge />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
