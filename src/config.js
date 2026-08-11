// Application Configuration

const config = {
    APP_NAME: 'AI CCTV Monitoring',
    VERSION: '1.0.0',
    DEFAULT_STREAM_URL: process.env.REACT_APP_STREAM_URL || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // CCTV Placeholder for testing
    API_DELAY: 800,
    THEME_MODE: 'light',
};

export default config;
