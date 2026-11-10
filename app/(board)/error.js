'use client';

export default function BoardError({ reset }) {
  return (
    <div className="error-box" role="alert">
      <h1>Something went wrong</h1>
      <p>The change wasn't saved, or the page couldn't load. Try again. If it keeps happening, check that you're still signed in and that you have editor access for changes.</p>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
        <a className="btn btn-link" href="/">Back to Today</a>
      </div>
    </div>
  );
}
