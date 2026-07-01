import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './stores/useStore';
import { TopBar } from './components/TopBar';
import { BoardSidebar } from './components/BoardSidebar';
import { Canvas } from './components/Canvas';
import { AIAssistant } from './components/AIAssistant';
import { NodeDetail } from './components/NodeDetail';
import { HomePage } from './components/HomePage';
import { ChapterEditor } from './components/ChapterEditor';
import { AuthModal } from './components/AuthModal';
import { api } from './api';

export default function App() {
  const { user, token, login, logout, project, setProject, projects, setProjects, activeView, setActiveView, undo, redo } = useStore();
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo]);

  // Fetch projects
  useEffect(() => {
    const refresh = () => {
      api.get('/api/projects').then(data => setProjects(Array.isArray(data) ? data : [])).catch(() => setProjects([]));
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [token, setProjects]);

  const createProject = async (name, config = {}) => {
    const proj = await api.post('/api/projects', { name, config: { genre: config.genre || '悬疑', totalChapters: config.totalChapters || 65, ...config } });
    setProject(proj);
    setActiveView('canvas');
    return proj;
  };

  if (!project) {
    return (
      <>
        <HomePage projects={projects} onCreate={createProject} onSelect={setProject}
          user={user} onLoginClick={() => setShowAuth(true)} onLogout={logout} />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)}
          onLoginSuccess={(u, t) => login(u, t)} />
      </>
    );
  }

  return (
    <div style={styles.layout}>
      <TopBar />
      <BoardSidebar />
      {activeView === 'editor' ? <ChapterEditor /> : (
        <>
          <Canvas onNodeClick={setSelectedNode} />
          <AIAssistant projectId={project.id} />
        </>
      )}
      <AnimatePresence>
        {selectedNode && <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' },
};
