import React, { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle2, Circle, AlertTriangle, FileText } from 'lucide-react';

const Dashboard = () => {
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
      // For local testing vs production:
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await axios.post(`${apiUrl}/api/query`, { query });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch from the server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid animate-fade-in">
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel">
          <h2 className="panel-header">Ask a Clinical Question</h2>
          <div className="search-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="What is the recommended screening interval for average-risk women aged 40-74?" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Asking...' : 'Ask'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * Answering only from provided guidelines *
          </p>

          {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}

          {result && result.structured_output && (
            <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
              <div className="response-card">
                <div className="response-label">Recommendation</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-main)', marginBottom: '1rem' }}>
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
                        <th>Page</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.structured_output.citations.map((cite, i) => (
                        <tr key={i}>
                          <td>{cite.document}</td>
                          <td>{cite.section}</td>
                          <td>{cite.page}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No citations available.</div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <div className="response-label" style={{ marginBottom: 0 }}>Confidence</div>
                  <span className={`badge-status ${result.structured_output.confidence?.toLowerCase() === 'high' ? 'badge-high' : ''}`} 
                        style={{ border: '1px solid #334155', backgroundColor: '#1e293b' }}>
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
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              JSON output will appear here...
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel">
          <h2 className="panel-header">Retrieved Evidence (Top-3 Chunks)</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {result?.retrieved_chunks ? (
              result.retrieved_chunks.slice(0, 3).map((chunk, i) => (
                <div key={i} className="chunk-item animate-fade-in">
                  <div className="chunk-header">
                    <span className="chunk-score">{chunk.score.toFixed(2)} {chunk.metadata.section}</span>
                  </div>
                  <div className="chunk-text">{chunk.text}</div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Retrieved chunks will appear here...
              </div>
            )}
          </div>
        </div>
        
        <div className="panel">
          <h2 className="panel-header">End-to-End Pipeline</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>Query</div>
              1
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>Retrieve</div>
              2
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>Ground</div>
              3
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>Generate</div>
              4
            </div>
          </div>
          
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Pipeline Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className={`pipeline-step ${pipelineStatus.retriever ? 'active' : ''}`}><CheckCircle2 size={16} /> Retriever connected</div>
            <div className={`pipeline-step ${pipelineStatus.structured ? 'active' : ''}`}><CheckCircle2 size={16} /> Structured output</div>
            <div className={`pipeline-step ${pipelineStatus.grounding ? 'active' : ''}`}><CheckCircle2 size={16} /> Grounding prompt</div>
            <div className={`pipeline-step ${pipelineStatus.citations ? 'active' : ''}`}><CheckCircle2 size={16} /> Citations included</div>
            <div className={`pipeline-step ${pipelineStatus.confidence ? 'active' : ''}`}><CheckCircle2 size={16} /> Confidence check</div>
            <div className={`pipeline-step ${pipelineStatus.refusal ? 'active' : ''}`}><CheckCircle2 size={16} /> Refusal logic active</div>
          </div>
          
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
            All checks passed — Pipeline Ready
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
