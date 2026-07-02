import { UserManager } from '../utils/user-manager.js';
const users = new UserManager(process.env.DATA_DIR || './data');

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    // 游客模式：未登录时使用默认游客身份
    req.username = 'guest';
    return next();
  }
  const decoded = users.verifyToken(auth.slice(7));
  if (!decoded) {
    req.username = 'guest';
    return next();
  }
  req.username = decoded.username;
  next();
}

export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const decoded = users.verifyToken(auth.slice(7));
    if (decoded) req.username = decoded.username;
  }
  if (!req.username) req.username = 'guest';
  next();
}
