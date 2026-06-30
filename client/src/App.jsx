import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './stores/useStore';
import { Navbar } from './components/Navbar';
import { Canvas } from './components/Canvas';
import { AIAssistant } from './components/AIAssistant';
import { NodeDetail } from './components/NodeDetail';
import { HomePage } from './components/HomePage';

import { ChapterEditor } from './components/ChapterEditor';

export default function App() {
  const { project, setProject, projects, setProjects, activeView, setActiveView, undo, redo } = useStore();
  const [selectedNode, setSelectedNode] = useState(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  useEffect(() => {
    // Refresh project list on mount and when returning home
    const refresh = () => {
      fetch('/api/projects')
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setProjects(data) : setProjects([]))
        .catch(() => setProjects([]));
    };
    refresh();
    // Refresh every time project changes (to update list)
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const createProject = async (name, config = {}) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config: { genre: config.genre || '悬疑', totalChapters: config.totalChapters || 65, ...config } }),
    });
    const proj = await res.json();
    setProject(proj);
    setActiveView('canvas');
    return proj;
  };

  if (!project) {
    return <HomePage projects={projects} onCreate={createProject} onSelect={setProject} />;
  }

  return (
    <div style={styles.layout}>
      <Navbar />
      {activeView === 'editor' ? (
        <ChapterEditor />
      ) : (
        <>
          <Canvas onNodeClick={setSelectedNode} />
          <AIAssistant projectId={project.id} />
        </>
      )}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
};
