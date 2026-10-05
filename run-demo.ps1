$taskRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $taskRoot
if (-not (Test-Path -LiteralPath (Join-Path $taskRoot 'dist/index.html'))) {
  node node_modules/typescript/bin/tsc -b
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  node node_modules/vite/bin/vite.js build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173
