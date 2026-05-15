export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AMCE Inventory — Error</title>
    <style>
      :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; }
      main { width: min(90vw, 28rem); text-align: center; }
      h1 { margin: 0; font-size: 2rem; line-height: 1.15; }
      p { margin: 0.75rem 0 1.5rem; color: #475569; line-height: 1.5; }
      .actions { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
      a, button { border-radius: 0.375rem; border: 1px solid #cbd5e1; padding: 0.65rem 1rem; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
      button { background: #0f172a; color: #fff; border-color: #0f172a; }
      a { background: #fff; color: #0f172a; }
    </style>
  </head>
  <body>
    <main>
      <h1>Something went wrong</h1>
      <p>The inventory app could not load. Please refresh, or return to the home page.</p>
      <div class="actions">
        <button onclick="location.reload()">Retry</button>
        <a href="/">Go home</a>
      </div>
    </main>
  </body>
</html>`;
}