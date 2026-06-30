import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'inkverse-secret-change-in-production';
const JWT_EXPIRY = '7d';

export class UserManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.usersFile = path.join(dataDir, 'users.json');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(this.usersFile)) fs.writeFileSync(this.usersFile, '{}', 'utf-8');
  }
  _read() { return JSON.parse(fs.readFileSync(this.usersFile, 'utf-8')); }
  _write(data) { fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2), 'utf-8'); }
  _hash(pw) { return crypto.createHash('sha256').update(pw + 'inkverse-salt').digest('hex'); }

  register(username, password, email = '') {
    const users = this._read();
    if (users[username]) return { success: false, error: '用户名已存在' };
    if (password.length < 6) return { success: false, error: '密码至少6位' };
    const user = { username, password: this._hash(password), email, createdAt: new Date().toISOString(), projects: [] };
    users[username] = user;
    this._write(users);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return { success: true, user: { username, email, createdAt: user.createdAt }, token };
  }

  login(username, password) {
    const users = this._read();
    const user = users[username];
    if (!user || user.password !== this._hash(password)) return { success: false, error: '用户名或密码错误' };
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return { success: true, user: { username, email: user.email, createdAt: user.createdAt }, token };
  }

  verifyToken(token) {
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
  }

  getUser(username) {
    const u = this._read()[username];
    return u ? { username: u.username, email: u.email, createdAt: u.createdAt, projects: u.projects || [] } : null;
  }

  addProject(username, projectId) {
    const users = this._read();
    if (users[username]) { users[username].projects = [...(users[username].projects || []), projectId]; this._write(users); }
  }

  getUserProjects(username) { return this.getUser(username)?.projects || []; }

  removeProject(username, projectId) {
    const users = this._read();
    if (users[username]) { users[username].projects = (users[username].projects || []).filter(id => id !== projectId); this._write(users); }
  }
}
