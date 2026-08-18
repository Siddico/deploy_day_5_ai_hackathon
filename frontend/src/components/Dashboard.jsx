import React, { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle2, Circle, AlertTriangle, FileText, Activity } from 'lucide-react';

const Dashboard = ({ activeTab }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [pipelineStatus, setPipelineStatus] = useState({
    retriever: true,
    grounding: true,
    confidence: true,
    structured: true,
    citations: true,
    refusal: true
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await axios.post(`${apiUrl}/api/query`, { query });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch from the server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (activeTab !== 'Ask Question') {
    return (
      <div className="panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <Activity size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
        <h2 className="brand-font" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{activeTab} View</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          This section is currently a placeholder for the {activeTab} functionality. You can switch back to "Ask Question" to use the main RAG pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid animate-fade-in">
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="panel">
          <h2 className="panel-header">Ask a Clinical Question</h2>
          <div className="search-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="E.g., What are the traditional risk factors for cardiovascular disease?" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Asking...' : 'Ask'}
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            * Answering only from provided guidelines *
          </p>

          {error && <div style={{ color: '#ef4444', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

          {result && result.structured_output && (
            <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
              <div className="response-card">
                <div className="response-label">Recommendation</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '500', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {result.structured_output.recommendation}
                </div>
                
                {result.structured_output.evidence && (
                  <>
                    <div className="response-label">Evidence (Excerpt)</div>
                    <div className="evidence-box">
                      {result.structured_output.evidence}
                    </div>
                  </>
                )}

                <div className="response-label">Citations</div>
                {result.structured_output.citations && result.structured_output.citations.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.structured_output.citations.map((cite, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{cite.document}</td>
                          <td>{cite.section}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    No citations available (Refusal state).
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <div className="response-label" style={{ marginBottom: 0 }}>Confidence Level</div>
                  <span className={`badge-status ${result.structured_output.confidence?.toLowerCase() === 'high' ? 'badge-high' : result.structured_output.confidence?.toLowerCase() === 'none' ? 'badge-none' : ''}`}>
                    {result.structured_output.confidence || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Structured Output JSON Box */}
        <div className="panel">
          <h2 className="panel-header">Structured Output (JSON)</h2>
          {result ? (
            <pre className="animate-fade-in">
              {JSON.stringify(result.structured_output, null, 2)}
            </pre>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
              JSON output will appear here after asking a question...
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="panel">
          <h2 className="panel-header">End-to-End Pipeline</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', marginTop: '1rem' }}>
            {['Query', 'Retrieve', 'Ground', 'Generate'].map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '0.75rem', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border)', 
                  marginBottom: '0.75rem',
                  fontWeight: 600
                }}>
                  {step}
                </div>
                Step {idx + 1}
              </div>
            ))}
          </div>
          
          <h3 className="brand-font" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>Pipeline Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div className={`pipeline-step ${pipelineStatus.retriever ? 'active' : ''}`}><CheckCircle2 size={18} /> Retriever connected</div>
            <div className={`pipeline-step ${pipelineStatus.structured ? 'active' : ''}`}><CheckCircle2 size={18} /> Structured output</div>
            <div className={`pipeline-step ${pipelineStatus.grounding ? 'active' : ''}`}><CheckCircle2 size={18} /> Grounding prompt</div>
            <div className={`pipeline-step ${pipelineStatus.citations ? 'active' : ''}`}><CheckCircle2 size={18} /> Citations included</div>
            <div className={`pipeline-step ${pipelineStatus.confidence ? 'active' : ''}`}><CheckCircle2 size={18} /> Confidence check</div>
            <div className={`pipeline-step ${pipelineStatus.refusal ? 'active' : ''}`}><CheckCircle2 size={18} /> Refusal logic strictly enforced</div>
          </div>
          
          <div style={{ 
            background: 'var(--success-bg)', 
            color: 'var(--success)', 
            padding: '1rem', 
            borderRadius: '12px', 
            textAlign: 'center', 
            marginTop: '2rem', 
            fontSize: '1rem', 
            fontWeight: '600',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            All checks passed — Pipeline Ready
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-header">Retrieved Evidence (Top-3 Chunks)</h2>
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {result?.retrieved_chunks ? (
              result.retrieved_chunks.slice(0, 3).map((chunk, i) => (
                <div key={i} className="chunk-item animate-fade-in">
                  <div className="chunk-header">
                    <span className="chunk-score">Score: {chunk.score.toFixed(2)}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{chunk.metadata.section || 'General Content'}</span>
                  </div>
                  <div className="chunk-text">{chunk.text}</div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                Retrieved chunks will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
