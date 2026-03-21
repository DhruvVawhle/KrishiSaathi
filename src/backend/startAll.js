import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as net from 'net'

const __filename = fileURLToPath(
  import.meta.url
)
const __dirname = dirname(__filename)

// Server configurations
const SERVERS = [
  {
    name: 'MAIN',
    file: 'server.js',
    port: 3000,
    color: '\x1b[32m' // green
  },
  {
    name: 'ORDERS',
    file: 'ordersServer.js',
    port: 5001,
    color: '\x1b[34m' // blue
  },
  {
    name: 'USERS',
    file: 'userserver.js',
    port: 5002,
    color: '\x1b[35m' // magenta
  },
  {
    name: 'PAYMENT',
    file: 'payment.js',
    port: 5000,
    color: '\x1b[33m' // yellow
  }
]

const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'
const RED   = '\x1b[31m'
const CYAN  = '\x1b[36m'

// Check if port is in use
const isPortInUse = (port) =>
  new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () =>
      resolve(true)
    )
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    server.listen(port)
  })

// Log with server prefix
const log = (serverName, color, message) => {
  const timestamp = new Date()
    .toLocaleTimeString('en-IN')
  console.log(
    `${color}${BOLD}[${serverName}]${RESET}` +
    ` ${CYAN}${timestamp}${RESET}` +
    ` ${message}`
  )
}

// Start a single server
const startServer = async (config) => {
  const { name, file, port, color } = config

  // Check if port is already in use
  const portBusy = await isPortInUse(port)
  if (portBusy) {
    log(
      name, RED,
      `⚠️  Port ${port} already in use!` +
      ` Skipping...`
    )
    return null
  }

  const serverPath = join(__dirname, file)

  const proc = spawn(
    'node',
    [serverPath],
    {
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: process.env.NODE_ENV
          || 'development'
      }
    }
  )

  // Handle stdout
  proc.stdout.on('data', (data) => {
    const lines = data.toString()
      .trim()
      .split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        log(name, color, line)
      }
    })
  })

  // Handle stderr
  proc.stderr.on('data', (data) => {
    const lines = data.toString()
      .trim()
      .split('\n')
    lines.forEach(line => {
      if (line.trim() &&
          !line.includes('DeprecationWarning') &&
          !line.includes('ExperimentalWarning')
      ) {
        log(name, RED, `❌ ${line}`)
      }
    })
  })

  // Handle exit
  proc.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      log(
        name, RED,
        `💀 Exited with code ${code}`
      )
    }
  })

  // Handle errors
  proc.on('error', (err) => {
    log(
      name, RED,
      `❌ Failed to start: ${err.message}`
    )
  })

  log(
    name, color,
    `🚀 Starting on port ${port}...`
  )

  return proc
}

// Main startup function
const startAll = async () => {
  console.log('\n' +
    BOLD + CYAN +
    '╔════════════════════════════════╗\n' +
    '║   KrishiSaathi Backend         ║\n' +
    '║   Starting all servers...      ║\n' +
    '╚════════════════════════════════╝' +
    RESET + '\n'
  )

  const processes = []

  // Start all servers
  for (const config of SERVERS) {
    const proc = await startServer(config)
    if (proc) processes.push({
      name: config.name,
      proc,
      port: config.port
    })

    // Small delay between starts
    await new Promise(r =>
      setTimeout(r, 500)
    )
  }

  // Wait then show status
  await new Promise(r =>
    setTimeout(r, 3000)
  )

  console.log('\n' +
    BOLD + CYAN +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  All servers started!\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' +
    RESET
  )
  console.log(
    `${BOLD}  Frontend:${RESET}` +
    ` http://localhost:5173`
  )
  SERVERS.forEach(s => {
    console.log(
      `${BOLD}  ${s.name}:${RESET}` +
      `    http://localhost:${s.port}`
    )
  })
  console.log(
    CYAN + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    + RESET + '\n'
  )

  // Handle shutdown
  const shutdown = () => {
    console.log('\n' +
      RED + BOLD +
      '🛑 Shutting down all servers...'
      + RESET
    )
    processes.forEach(({ name, proc }) => {
      log(name, RED, '🛑 Stopping...')
      proc.kill('SIGTERM')
    })
    setTimeout(() => process.exit(0), 1000)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('uncaughtException', (err) => {
    console.error(
      RED + '❌ Uncaught Exception:',
      err.message + RESET
    )
  })
}

startAll()
