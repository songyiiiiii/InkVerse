import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './stores/useStore';
import { Navbar } from './components/Navbar';
import { Canvas } from './components/Canvas';
import { AIAssistant } from './components/AIAssistant';
import { NodeDetail } from './components/NodeDetail';
import { HomePage } from './components/HomePage';
import { VRMAvatar } from './components/VRMAvatar';
import { TransitionOverlay } from './components/TransitionOverlay';
import { ChapterEditor } from './components/ChapterEditor';
import { AuthModal } from './components/AuthModal';
import { api } from './api.js';

export default function App() {
  const { user, token, login, logout, project, setProject, projects, setProjects, activeView, setActiveView, undo, redo } = useStore();
  const [selectedNode, setSelectedNode] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const isHome = !project;

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  useEffect(() => {
    const refresh = () => {
      fetch('/api/projects')
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setProjects(data) : setProjects([]))
        .catch(() => setProjects([]));
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const createProject = async (name, config = {}) => {
    const proj = await api.post('/api/projects', { name, config: { genre: config.genre || '悬疑', totalChapters: config.totalChapters || 65, ...config } });
    setTransitioning(true);
    setTimeout(() => { setProject(proj); setActiveView('canvas'); }, 100);
    return proj;
  };

  const handleSelectProject = (proj) => {
    setTransitioning(true);
    setTimeout(() => {
      setProject(proj);
      setActiveView('canvas');
    }, 100);
  };

  // 转场结束后清除状态
  useEffect(() => {
    if (transitioning && project) {
      const timer = setTimeout(() => setTransitioning(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [transitioning, project]);

  return (
    <>
      {/* 转场覆盖层 */}
      <AnimatePresence>
        {transitioning && (
          <TransitionOverlay onDone={() => {}} />
        )}
      </AnimatePresence>

      {/* 首页 */}
      {isHome && !transitioning && (
        <>
          {/* 光晕 */}
          <div style={{
            position: 'fixed', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
            top: '40%', right: -350, pointerEvents: 'none', zIndex: 9998,
            animation: 'floatGlow 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'fixed', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)',
            bottom: '-5%', right: -310, pointerEvents: 'none', zIndex: 9998,
            animation: 'floatGlow2 5s ease-in-out infinite',
          }} />

          {/* VRM 浮在最顶层 */}
          <div style={{
            position: 'fixed',
            right: 0, top: 0,
            width: '50vw', height: '100vh',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/* 对话气泡 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              style={{
                position: 'absolute',
                top: '10%',
                right: 20,
                background: '#fff',
                borderRadius: 20,
                padding: '20px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                zIndex: 2,
                width: 220,
              }}
            >
              <div style={{ fontSize: '1em', color: '#333', lineHeight: 1.7, marginBottom: 6 }}>
                今天想写<br/>一个怎样的故事呢？
              </div>
              <div style={{ fontSize: '0.85em', color: '#6366F1', fontWeight: 600 }}>
                Let's create.
              </div>
              {/* 小三角指向模型(左边) */}
              <div style={{
                position: 'absolute',
                bottom: 10,
                left: -8,
                width: 0, height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '10px solid #fff',
              }} />
            </motion.div>

            <VRMAvatar mode="home" isThinking={false} isSpeaking={false} height={'100vh'} />
          </div>

          {/* 主页内容 */}
          <div style={styles.homeLayout}>
            <div style={styles.homeContent}>
              <HomePage projects={projects} onCreate={createProject} onSelect={handleSelectProject}
                user={user} onLoginClick={() => setShowAuth(true)} onLogout={logout} />
            </div>
          </div>
        </>
      )}

      {/* 项目页（转场中隐藏） */}
      {!isHome && !transitioning && (
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
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)}
        onLoginSuccess={(u, t) => login(u, t)} />
    </>
  );
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  homeLayout: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  homeContent: {
    width: '50vw',
    overflow: 'hidden',
  },
  vrmSidebar: {
    width: 560,
    minWidth: 560,
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
};
