// Mock Service for simulating backend API responses
import { apiService } from './api';

// Configuration flag - set to false to use real API
const USE_MOCK = false; // Change to false when backend is ready

const initialCameras = [
    { id: 'CAM-01', name: 'Main Entrance', status: 'Online', lastActive: '2 mins ago', type: 'rtsp' },
    { id: 'CAM-02', name: 'Parking Lot', status: 'Online', lastActive: '10 mins ago', type: 'rtsp' },
    { id: 'CAM-03', name: 'Server Room', status: 'Offline', lastActive: '1 hour ago', type: 'rtsp' },
    { id: 'CAM-04', name: 'Back Alley', status: 'Online', lastActive: 'Just now', type: 'rtsp' },
    { id: 'WEBCAM', name: 'Webcam Feed', status: 'Online', lastActive: 'Just now', type: 'webcam' },
];

const initialEmployees = [
    { empNo: 'EMP001', name: 'John Doe', enrolledAt: '2025-12-01' },
    { empNo: 'EMP002', name: 'Jane Smith', enrolledAt: '2025-12-15' },
    { empNo: 'EMP003', name: 'Robert Brown', enrolledAt: '2026-01-10' },
];

const initialLogs = [
    { id: 1, empNo: 'EMP001', name: 'John Doe', date: '2026-01-29', time: '09:00:15', type: 'Entry' },
    { id: 2, empNo: 'EMP002', name: 'Jane Smith', date: '2026-01-29', time: '09:15:22', type: 'Entry' },
    { id: 3, empNo: 'EMP001', name: 'John Doe', date: '2026-01-29', time: '12:30:45', type: 'Exit' },
    { id: 4, empNo: 'EMP003', name: 'Robert Brown', date: '2026-01-29', time: '13:00:10', type: 'Entry' },
    { id: 5, empNo: 'EMP002', name: 'Jane Smith', date: '2026-01-29', time: '18:05:30', type: 'Exit' },
];

// Mock AI Event Logs
const initialAIEvents = [
    {
        id: 1,
        event_type: 'face_detected',
        confidence: 0.92,
        details: JSON.stringify({ bbox: [100, 150, 200, 250], track_id: 1 }),
        frame_timestamp: new Date(Date.now() - 30000).toISOString(),
        created_at: new Date(Date.now() - 30000).toISOString()
    },
    {
        id: 2,
        event_type: 'person_recognized',
        confidence: 0.88,
        details: JSON.stringify({ employee_id: 'EMP001', name: 'John Doe', bbox: [120, 160, 220, 260], track_id: 1 }),
        frame_timestamp: new Date(Date.now() - 25000).toISOString(),
        created_at: new Date(Date.now() - 25000).toISOString()
    },
    {
        id: 3,
        event_type: 'face_detected',
        confidence: 0.85,
        details: JSON.stringify({ bbox: [300, 200, 400, 300], track_id: 2 }),
        frame_timestamp: new Date(Date.now() - 20000).toISOString(),
        created_at: new Date(Date.now() - 20000).toISOString()
    },
    {
        id: 4,
        event_type: 'person_recognized',
        confidence: 0.91,
        details: JSON.stringify({ employee_id: 'EMP002', name: 'Jane Smith', bbox: [320, 210, 420, 310], track_id: 2 }),
        frame_timestamp: new Date(Date.now() - 15000).toISOString(),
        created_at: new Date(Date.now() - 15000).toISOString()
    },
    {
        id: 5,
        event_type: 'track_lost',
        confidence: null,
        details: JSON.stringify({ track_id: 1, last_label: 'EMP001' }),
        frame_timestamp: new Date(Date.now() - 10000).toISOString(),
        created_at: new Date(Date.now() - 10000).toISOString()
    },
];

class MockService {
    constructor() {
        this.cameras = [...initialCameras];
        this.employees = [...initialEmployees];
        this.logs = [...initialLogs];
        this.aiEvents = [...initialAIEvents];
        this.useMock = USE_MOCK;
        this.streamStatus = {
            enabled: true,
            connected: true,
            stream_stats: { fps: 25, frame_count: 1250, errors: 2 },
            ai_stats: { fps: 2, detections: 42, recognitions: 15, errors: 0 }
        };
        this.systemStatus = {
            gallery_size: 3,
            stream_active: true,
            ai_processing: { detections: 42, recognitions: 15 },
            config: { models: { runtime: 'onnx' } }
        };
    }

    // =================================
    // SYSTEM & STREAMING METHODS
    // =================================

    async getStatus() {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(this.systemStatus), 300);
            });
        }
        try {
            return await apiService.getStatus();
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return this.systemStatus;
        }
    }

    async getStreamStatus() {
        if (this.useMock) {
            return new Promise((resolve) => {
                // Simulate occasional disconnection
                if (Math.random() < 0.1) {
                    this.streamStatus.connected = false;
                } else {
                    this.streamStatus.connected = true;
                    // Update mock stats
                    this.streamStatus.stream_stats.fps = Math.floor(Math.random() * 10) + 20;
                    this.streamStatus.ai_stats.detections += Math.floor(Math.random() * 3);
                }
                setTimeout(() => resolve(this.streamStatus), 200);
            });
        }
        try {
            return await apiService.getStreamStatus();
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return this.streamStatus;
        }
    }

    async getStreamLogs(limit = 50) {
        if (this.useMock) {
            return new Promise((resolve) => {
                // Add new mock events periodically
                if (Math.random() < 0.3) {
                    const newEvent = {
                        id: this.aiEvents.length + 1,
                        event_type: Math.random() > 0.5 ? 'face_detected' : 'person_recognized',
                        confidence: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
                        details: JSON.stringify({
                            bbox: [
                                Math.floor(Math.random() * 500),
                                Math.floor(Math.random() * 400),
                                Math.floor(Math.random() * 500) + 100,
                                Math.floor(Math.random() * 400) + 100
                            ],
                            track_id: Math.floor(Math.random() * 3) + 1
                        }),
                        frame_timestamp: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    };
                    if (newEvent.event_type === 'person_recognized') {
                        const emp = this.employees[Math.floor(Math.random() * this.employees.length)];
                        newEvent.details = JSON.stringify({
                            employee_id: emp.empNo,
                            name: emp.name,
                            bbox: JSON.parse(newEvent.details).bbox,
                            track_id: JSON.parse(newEvent.details).track_id
                        });
                    }
                    this.aiEvents.unshift(newEvent);
                }

                setTimeout(() => resolve({
                    logs: this.aiEvents.slice(0, limit)
                }), 400);
            });
        }
        try {
            return await apiService.getStreamLogs(limit);
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return { logs: this.aiEvents.slice(0, limit) };
        }
    }

    getStreamUrl() {
        if (this.useMock) {
            // Return a placeholder for mock mode
            return '/mock-stream.jpg';
        }
        return apiService.getStreamUrl();
    }

    getCameraStreamUrl(cameraId) {
        return this.getStreamUrl();
    }

    // =================================
    // CAMERA MANAGEMENT
    // =================================

    async getCameras() {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(this.cameras), 500);
            });
        }
        try {
            return await apiService.getCameras();
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return this.cameras;
        }
    }

    // =================================
    // EMPLOYEE MANAGEMENT
    // =================================

    async getEmployees() {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(this.employees), 500);
            });
        }
        try {
            const data = await apiService.getEmployees();
            // Transform API response to match frontend format if needed
            return data.map(emp => ({
                empNo: emp.employee_id || emp.id,
                name: emp.name,
                enrolledAt: emp.created_at || new Date().toISOString().split('T')[0]
            }));
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return this.employees;
        }
    }

    async fetchEmployeeByNo(empNo) {
        if (this.useMock) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const emp = this.employees.find(e => e.empNo === empNo);
                    if (emp) resolve(emp);
                    else reject(new Error('Employee not found'));
                }, 800);
            });
        }
        try {
            const data = await apiService.getEmployee(empNo);
            return {
                empNo: data.employee_id,
                name: data.name
            };
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Employee not found');
            }
            throw new Error('Failed to fetch employee');
        }
    }

    async enrollPerson(data) {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const newEmp = {
                        empNo: data.empNo,
                        name: data.name,
                        enrolledAt: new Date().toISOString().split('T')[0]
                    };
                    this.employees.push(newEmp);
                    resolve(newEmp);
                }, 1000);
            });
        }
        try {
            const result = await apiService.enrollPerson(
                data.empNo,
                data.name,
                data.photo
            );
            return {
                empNo: result.employee_id,
                name: result.name,
                enrolledAt: new Date().toISOString().split('T')[0]
            };
        } catch (error) {
            console.error('Enrollment error:', error);
            throw new Error('Failed to enroll person');
        }
    }

    async deletePerson(empNo) {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.employees = this.employees.filter(e => e.empNo !== empNo);
                    resolve(true);
                }, 800);
            });
        }
        try {
            await apiService.deleteEmployee(empNo);
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            throw new Error('Failed to delete person');
        }
    }

    // =================================
    // LOGS & EVENTS
    // =================================

    async getLogs() {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(this.logs), 500);
            });
        }
        try {
            return await apiService.getLogs();
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return this.logs;
        }
    }

    async getAllEvents(limit = 100) {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => resolve({
                    logs: this.aiEvents.slice(0, limit)
                }), 500);
            });
        }
        try {
            return await apiService.getAllEvents(limit);
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return { logs: this.aiEvents.slice(0, limit) };
        }
    }

    async getEventStats(hours = 24) {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        event_stats: [
                            { event_type: 'face_detected', count: 42, avg_confidence: 0.85 },
                            { event_type: 'person_recognized', count: 15, avg_confidence: 0.92 },
                            { event_type: 'track_lost', count: 8, avg_confidence: null },
                            { event_type: 'ai_error', count: 2, avg_confidence: null },
                        ],
                        hourly_stats: Array.from({ length: 6 }, (_, i) => ({
                            hour: new Date(Date.now() - (5 - i) * 3600000).toISOString().replace(/\.\d+Z$/, '00:00Z').replace('T', ' ').replace('Z', ''),
                            events: Math.floor(Math.random() * 10) + 5
                        }))
                    });
                }, 400);
            });
        }
        try {
            return await apiService.getEventStats(hours);
        } catch (error) {
            console.error('API Error, falling back to mock data:', error);
            return {
                event_stats: [],
                hourly_stats: []
            };
        }
    }

    // =================================
    // SYSTEM CONTROL
    // =================================

    async restartStream() {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.streamStatus.connected = true;
                    resolve({ success: true, message: 'Stream restarted successfully' });
                }, 1000);
            });
        }
        try {
            return await apiService.restartStream();
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to restart stream');
        }
    }

    async clearLogs() {
        if (this.useMock) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.aiEvents = [];
                    this.logs = [];
                    resolve({ success: true, message: 'All logs cleared' });
                }, 800);
            });
        }
        try {
            return await apiService.clearLogs();
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to clear logs');
        }
    }

    // =================================
    // UTILITY METHODS
    // =================================

    // Method to switch between mock and real API
    setUseMock(useMock) {
        this.useMock = useMock;
        console.log(`Mock mode ${useMock ? 'enabled' : 'disabled'}`);
    }

    // Get current mode
    getUseMock() {
        return this.useMock;
    }

    // Add test AI event (for development)
    addTestAIEvent(eventType, details) {
        const newEvent = {
            id: this.aiEvents.length + 1,
            event_type: eventType,
            confidence: Math.random() * 0.3 + 0.7,
            details: JSON.stringify(details),
            frame_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        this.aiEvents.unshift(newEvent);
        return newEvent;
    }
}

export const mockService = new MockService();
export default mockService;