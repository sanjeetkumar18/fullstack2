import { useMemo, useState } from 'react';

const platforms = [
  {
    id: 'twitter',
    label: 'Twitter / X',
    charLimit: 280,
    warningThreshold: 240,
    rules: [
      'No more than 280 characters.',
      'Hashtags and mentions are allowed.',
      'Keep posts concise and copy-friendly.',
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    charLimit: 63206,
    warningThreshold: 56000,
    rules: [
      'Large text allowed, but keep audiences engaged.',
      'No platform-specific media rule enforced here.',
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    charLimit: 2200,
    warningThreshold: 2000,
    rules: [
      'Caption limit is 2,200 characters.',
      'Use one or more line breaks for readability.',
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    charLimit: 1300,
    warningThreshold: 1100,
    rules: [
      'Professional tone works best.',
      'Character limit is 1,300 for regular posts.',
    ],
  },
];

const platformMap = platforms.reduce((acc, platform) => {
  acc[platform.id] = platform;
  return acc;
}, {});

function validateContent(content, selectedPlatforms) {
  const trimmed = content.trim();
  const activePlatforms = selectedPlatforms.filter((id) => platformMap[id]);
  const details = activePlatforms.map((platformId) => {
    const platform = platformMap[platformId];
    const length = trimmed.length;
    const error = length > platform.charLimit ? `Exceeded ${platform.label} limit by ${length - platform.charLimit} characters.` : null;
    const warning = !error && length >= platform.warningThreshold ? `Approaching ${platform.label} limit.` : null;
    return {
      platformId,
      label: platform.label,
      length,
      charLimit: platform.charLimit,
      warning,
      error,
    };
  });

  const hasError = details.some((detail) => detail.error);
  const hasWarning = details.some((detail) => detail.warning);
  return { details, hasError, hasWarning };
}

function App() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter']);

  const validation = useMemo(
    () => validateContent(content, selectedPlatforms),
    [content, selectedPlatforms]
  );

  const selectedLabels = selectedPlatforms.map((id) => platformMap[id]?.label).filter(Boolean);

  return (
    <div className="page-shell">
      <div className="composer-card">
        <header className="composer-header">
          <div>
            <p className="eyebrow">Social Post Composer</p>
            <h1>Create one post for multiple platforms</h1>
            <p className="description">
              Choose target platforms and compose a message with instant platform-specific validation.
            </p>
          </div>
          <div className="platform-tag-group">
            {selectedLabels.map((label) => (
              <span key={label} className="platform-tag">
                {label}
              </span>
            ))}
          </div>
        </header>

        <section className="field-group">
          <label className="field-label">Target platforms</label>
          <div className="platform-grid">
            {platforms.map((platform) => {
              const checked = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  className={`platform-toggle ${checked ? 'platform-toggle--active' : ''}`}
                  onClick={() => {
                    setSelectedPlatforms((prev) =>
                      prev.includes(platform.id)
                        ? prev.filter((id) => id !== platform.id)
                        : [...prev, platform.id]
                    );
                  }}
                >
                  <span>{platform.label}</span>
                  <span className="limit-text">{platform.charLimit} chars</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="field-group">
          <label className="field-label" htmlFor="post-content">
            Post caption
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your post here..."
            rows={10}
          />
          <div className="status-row">
            <span className="counter">
              {content.trim().length} characters
            </span>
            {validation.hasError ? (
              <span className="status-message status-message--error">
                One or more platforms exceed limits.
              </span>
            ) : validation.hasWarning ? (
              <span className="status-message status-message--warning">
                Some platforms are nearing their limits.
              </span>
            ) : (
              <span className="status-message status-message--success">
                All selected platforms are within limits.
              </span>
            )}
          </div>
        </section>

        <section className="validation-panel">
          {validation.details.length === 0 ? (
            <div className="validation-empty">Select at least one platform to validate content.</div>
          ) : (
            validation.details.map((detail) => (
              <div key={detail.platformId} className="validation-item">
                <div className="validation-header">
                  <strong>{detail.label}</strong>
                  <span>{detail.length}/{detail.charLimit}</span>
                </div>
                <div className="validation-status">
                  {detail.error ? (
                    <span className="validation-badge error">Error</span>
                  ) : detail.warning ? (
                    <span className="validation-badge warning">Warning</span>
                  ) : (
                    <span className="validation-badge success">OK</span>
                  )}
                  <p className="validation-message">
                    {detail.error || detail.warning || 'Content is valid for this platform.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="platform-rules">
          <h2>Platform rules</h2>
          <div className="rules-grid">
            {platforms.map((platform) => (
              <article key={platform.id} className="rule-card">
                <h3>{platform.label}</h3>
                <p className="rule-limit">Limit: {platform.charLimit} chars</p>
                <ul>
                  {platform.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
