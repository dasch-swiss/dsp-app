# Temporary commands for prototype development

# Serve the prototype on port 4201
proto-serve:
    lsof -ti:4201 | xargs kill 2>/dev/null || true
    sleep 1
    npx nx serve prototype --port 4201

# Build the prototype
proto-build:
    npx nx build prototype

# Build and show only errors
proto-check:
    npx nx build prototype 2>&1 | grep -E "error TS|Error:" | head -20

# Kill the prototype server
proto-kill:
    lsof -ti:4201 | xargs kill 2>/dev/null || true

# Full restart: kill, reset Nx cache, serve fresh
proto-restart:
    lsof -ti:4201 | xargs kill 2>/dev/null || true
    npx nx reset
    npx nx serve prototype --port 4201

# Take a screenshot with agent-browser
proto-screenshot name:
    agent-browser screenshot "../dasch-specs/specs/2026-03-19-advanced-search-redesign/assets/{{name}}.png"

# Navigate agent-browser to a path
proto-goto path:
    agent-browser goto "http://localhost:4201{{path}}"
