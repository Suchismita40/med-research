const CustomWebSocket = typeof window !== 'undefined' ? window.WebSocket : class DummyWebSocket {};
export const WebSocket = CustomWebSocket;
export default CustomWebSocket;
