import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    return `${window.location.origin.replace('3000', '4000')}/${code}`;
  }
  return `/${code}`;
}

const Dashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState({ url: '', code: '' });
  const [success, setSuccess] = useState('');
  const [deletingCode, setDeletingCode] = useState('');

  const navigate = useNavigate();

  async function loadLinks() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/links');
      if (!res.ok) {
        const txt = await res.text();
        console.error('loadLinks non-JSON response', txt);
        throw new Error('Failed to load links');
      }
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  function validateUrl(value) {
    if (!value.trim()) return 'URL is required';
    if (!/^https?:\/\//i.test(value.trim())) {
      return 'URL must start with http:// or https://';
    }
    return '';
  }

  function validateCode(value) {
    if (!value) return '';
    if (!/^[A-Za-z0-9]{6,8}$/.test(value)) {
      return 'Code must be 6-8 letters or digits';
    }
    return '';
  }

  function handleUrlChange(e) {
    const value = e.target.value;
    setUrl(value);
    setFormErrors((prev) => ({ ...prev, url: validateUrl(value) }));
    setSuccess('');
  }

  function handleCodeChange(e) {
    const value = e.target.value;
    setCode(value);
    setFormErrors((prev) => ({ ...prev, code: validateCode(value) }));
    setSuccess('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    const urlError = validateUrl(url);
    const codeError = validateCode(code);

    if (urlError || codeError) {
      setFormErrors({ url: urlError, code: codeError });
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:4000/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), code: code.trim() || undefined }),
      });

      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        setFormErrors((prev) => ({ ...prev, code: body.error || 'Code already exists' }));
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        console.error('handleCreate non-JSON response', txt);
        const body = await res.json().catch(() => ({}));
        const msg = body.error || 'Failed to create link';
        setError(msg);
        return;
      }

      const created = await res.json();
      setUrl('');
      setCode('');
      setFormErrors({ url: '', code: '' });
      setSuccess(`Created short link for ${created.url}`);
      await loadLinks();
    } catch (err) {
      setError(err.message || 'Failed to create link');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(codeToDelete) {
    if (!window.confirm(`Delete link ${codeToDelete}?`)) return;

    setDeletingCode(codeToDelete);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:4000/api/links/${encodeURIComponent(codeToDelete)}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) {
        const txt = await res.text();
        console.error('handleDelete non-JSON response', txt);
        const body = await res.json().catch(() => ({}));
        const msg = body.error || 'Failed to delete link';
        setError(msg);
        return;
      }

      setLinks((prev) => prev.filter((item) => item.code !== codeToDelete));
      setSuccess(`Deleted link ${codeToDelete}`);
    } catch (err) {
      setError(err.message || 'Failed to delete link');
    } finally {
      setDeletingCode('');
    }
  }

  const filteredLinks = links.filter((link) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      link.code.toLowerCase().includes(term) ||
      (link.url && link.url.toLowerCase().includes(term))
    );
  });

  const isSubmitDisabled =
    creating || !!formErrors.url || !!formErrors.code || !url.trim();

  return (
    <div className="app-root">
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">URL Shortener Dashboard</h1>
          <p className="page-subtitle">
            Create, manage, and track mini bit.ly-style short links.
          </p>
        </header>

        <section className="card">
          <h2 className="section-title">Add New Link</h2>
          <form className="form-grid" onSubmit={handleCreate} noValidate>
            <div className="form-field">
              <label className="label" htmlFor="url">
                Long URL
              </label>
              <input
                id="url"
                type="url"
                className={`input ${formErrors.url ? 'input-error' : ''}`}
                placeholder="https://example.com/very/long/url"
                value={url}
                onChange={handleUrlChange}
              />
              {formErrors.url && <div className="field-error">{formErrors.url}</div>}
            </div>
            <div className="form-field">
              <label className="label" htmlFor="code">
                Custom code (optional)
              </label>
              <input
                id="code"
                type="text"
                className={`input ${formErrors.code ? 'input-error' : ''}`}
                placeholder="6-8 letters or digits"
                value={code}
                onChange={handleCodeChange}
              />
              <div className="field-help">Auto-generated if left blank.</div>
              {formErrors.code && <div className="field-error">{formErrors.code}</div>}
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitDisabled}
              >
                {creating ? 'Creating...' : 'Create Short Link'}
              </button>
            </div>
          </form>
          {success && <div className="status status-success">{success}</div>}
          {error && <div className="status status-error">{error}</div>}
        </section>

        <section className="card">
          <div className="card-header-row">
            <h2 className="section-title">All Links</h2>
            <input
              type="text"
              className="input input-sm"
              placeholder="Search by code or URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="status">Loading links...</div>
          ) : filteredLinks.length === 0 ? (
            <div className="status">No links yet. Create one above.</div>
          ) : (
            <div className="table-wrapper">
              <table className="links-table">
                <thead>
                  <tr>
                    <th>Short code</th>
                    <th>Target URL</th>
                    <th>Total clicks</th>
                    <th>Last clicked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => {
                    const shortUrl = buildShortUrl(link.code, link.shortUrl);
                    return (
                      <tr key={link.code}>
                        <td>
                          <span className="code-pill">{link.code}</span>
                        </td>
                        <td>
                          <div className="url-cell" title={link.url}>
                            {link.url}
                          </div>
                        </td>
                        <td>{link.clickCount ?? 0}</td>
                        <td>{formatDate(link.lastClickedAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(shortUrl)
                                  .catch(() => {});
                              }}
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => navigate(`/code/${link.code}`)}
                            >
                              Stats
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDelete(link.code)}
                              disabled={deletingCode === link.code}
                            >
                              {deletingCode === link.code ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
