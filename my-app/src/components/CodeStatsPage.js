import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function formatDate(value) {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
}

function buildShortUrl(code, apiShortUrl) {
  if (apiShortUrl) return apiShortUrl;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/${code}`;
  }
  return `/${code}`;
}

const CodeStatsPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/links/${encodeURIComponent(code)}`);
        if (res.status === 404) {
          setError('Link not found');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          console.error('CodeStatsPage non-JSON response', txt);
          throw new Error('Failed to load stats');
        }
        const data = await res.json();
        setLink(data);
      } catch (err) {
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [code]);

  const shortUrl = link ? buildShortUrl(link.code, link.shortUrl) : '';

  return (
    <div className="app-root">
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">Stats for {code}</h1>
          <p className="page-subtitle">Details for a single short code.</p>
        </header>

        <section className="card">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/')}
          >
             Back to dashboard
          </button>

          {loading ? (
            <div className="status">Loading stats...</div>
          ) : error ? (
            <div className="status status-error">{error}</div>
          ) : !link ? (
            <div className="status">No data.</div>
          ) : (
            <div className="stats-grid">
              <div className="stats-item">
                <div className="label">Short code</div>
                <div className="value code-pill">{link.code}</div>
              </div>
              <div className="stats-item">
                <div className="label">Short link</div>
                <div className="value value-inline">
                  <a href={shortUrl} target="_blank" rel="noreferrer">
                    {shortUrl}
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() =>
                      navigator.clipboard.writeText(shortUrl).catch(() => {})
                    }
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="stats-item">
                <div className="label">Original URL</div>
                <div className="value">
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.url}
                  </a>
                </div>
              </div>
              <div className="stats-item">
                <div className="label">Total clicks</div>
                <div className="value">{link.clickCount ?? 0}</div>
              </div>
              <div className="stats-item">
                <div className="label">Created time</div>
                <div className="value">{formatDate(link.createdAt)}</div>
              </div>
              <div className="stats-item">
                <div className="label">Last clicked</div>
                <div className="value">{formatDate(link.lastClickedAt)}</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CodeStatsPage;
