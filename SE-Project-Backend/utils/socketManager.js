let ioInstance = null;

export const setIo = (io) => {
    ioInstance = io;
};

export const getIo = () => ioInstance;

// Return a Set of counsellor userIds that currently have connected sockets.
export const getOnlineCounsellors = () => {
    const s = new Set();
    try {
        const io = ioInstance;
        if (!io) return s;
        const socketsMap = io.sockets && io.sockets.sockets ? io.sockets.sockets : null;
        if (!socketsMap) return s;
        for (const socket of socketsMap.values()) {
            try {
                if (socket && socket.role === 'counsellor' && socket.userId) {
                    s.add(String(socket.userId));
                }
            } catch (e) { continue; }
        }
    } catch (e) { /* ignore */ }
    return s;
};

export default { setIo, getIo, getOnlineCounsellors };
