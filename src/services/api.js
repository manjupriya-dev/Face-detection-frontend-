import axios from 'axios';
const JETSON_IP = '192.168.30.199';   // <-- CHANGE THIS to your Jetson's IP
export const API_BASE_URL = `http://${JETSON_IP}:8080`;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Optional: global error logging
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ============================
// API SERVICE
// ============================

export const apiService = {

    // --------------------------
    // SYSTEM STATUS
    // --------------------------

    getStatus: async () => {
        const res = await api.get('/status');
        return res.data;
    },

    // --------------------------
    // HLS STREAM
    // --------------------------

    getCameraStreamUrl: () => {
        return `${API_BASE_URL}/stream/hls/playlist.m3u8`;
    },

    // --------------------------
    // CAMERAS
    // --------------------------

    getCameras: async () => {
        const res = await api.get('/cameras');
        return res.data;
    },

    captureSnapshot: async () => {
        const res = await api.get('/capture/snapshot/base64');
        return res.data;
    },

    // --------------------------
    // ATTENDANCE LOGS
    // --------------------------

    getLogs: async (limit = 100) => {
        const res = await api.get('/logs', {
            params: { limit }
        });
        return res.data;
    },

    // --------------------------
    // STREAM LOGS (Placeholder)
    // --------------------------

    getStreamLogs: async (limit = 50) => {
        const res = await api.get('/stream/logs', {
            params: { limit }
        });
        return res.data;
    },

    // --------------------------
    // CAPTURED IMAGES
    // --------------------------

    /**
     * Unified endpoint — returns { unknown: [...], known: { folder: [...] } }
     * Path values are relative to captured-images/, e.g. "unknown/u1.jpg"
     */
    getCapturedImages: async () => {
        const res = await api.get('/captured-images');
        return res.data;
    },

    /** Legacy: list of known employee sub-folders with image arrays */
    getCapturedImagesKnown: async () => {
        const res = await api.get('/captured-images/known');
        return res.data;
    },

    /** Legacy: { images: [...] } for unknown/ */
    getCapturedImagesUnknown: async () => {
        const res = await api.get('/captured-images/unknown');
        return res.data;
    },

    /**
     * Delete a single captured image.
     * @param {string} path  Relative path, e.g. "unknown/u1.jpg" or "person1/img1.jpg"
     */
    deleteCapturedImage: async (path) => {
        const res = await api.delete('/captured-images/image', {
            params: { path },
        });
        return res.data;
    },

    /**
     * Delete an entire captured-images folder.
     * For "unknown" this clears all files but keeps the folder.
     * For a known sub-folder it removes the folder entirely.
     * @param {string} folderName  e.g. "unknown" or "emp_001"
     */
    deleteCapturedFolder: async (folderName) => {
        const res = await api.delete(`/captured-images/folder/${encodeURIComponent(folderName)}`);
        return res.data;
    },

    // --------------------------
    // ENROLL PERSON
    // --------------------------

    enrollPerson: async (employeeId, name, photoFile) => {

        const formData = new FormData();
        formData.append('employee_id', employeeId);
        formData.append('name', name);
        formData.append('files', photoFile);

        const res = await api.post('/enroll', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return res.data;
    },

    // --------------------------
    // EMPLOYEE MANAGEMENT
    // --------------------------

    getEmployee: async (employeeId) => {
        const res = await api.get(`/employee/${employeeId}`);
        return res.data;
    },

    deleteEmployee: async (employeeId) => {
        const res = await api.delete(`/employee/${employeeId}`);
        return res.data;
    },

    // --------------------------
    // PERFORMANCE LOGS
    // --------------------------

    getPerformanceLogs: async (limit = 100, offset = 0, order = 'desc', face_only = undefined) => {
        const res = await api.get('/performance-logs', {
            params: { limit, offset, order, ...(face_only !== undefined ? { face_only } : {}) }
        });
        return res.data;
    },

    // --------------------------
    // DELETE ATTENDANCE LOGS
    // --------------------------

    deleteLog: async (id) => {
        const res = await api.delete(`/logs/${id}`);
        return res.data;
    },

    deleteLogsBulk: async (ids) => {
        const responses = await Promise.all(ids.map(id => api.delete(`/logs/${id}`)));
        return responses.map(res => res.data);
    },

    // --------------------------
    // DELETE PERFORMANCE LOGS
    // --------------------------

    deletePerformanceLog: async (id) => {
        const res = await api.delete(`/performance-logs/${id}`);
        return res.data;
    },

    deletePerformanceLogsBulk: async (ids) => {
        const responses = await Promise.all(ids.map(id => api.delete(`/performance-logs/${id}`)));
        return responses.map(res => res.data);
    },
};

export default api;