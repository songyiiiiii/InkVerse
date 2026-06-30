import { UserManager } from '../utils/user-manager.js';
const users = new UserManager(process.env.DATA_DIR || './data');

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '请先登录' });
  const decoded = users.verifyToken(auth.slice(7));
  if (!decoded) return res.status(401).json({ error: '登录已过期' });
  req.username = decoded.username;
  next();
}

export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const decoded = users.verifyToken(auth.slice(7));
    if (decoded) req.username = decoded.username;
  }
  next();
}
