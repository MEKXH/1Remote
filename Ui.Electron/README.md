# 1Remote Electron UI

A modern Vue 3 + Electron frontend for the 1Remote project.

## Features

- **Dashboard**: View, filter, and connect to your remote sessions.
- **Search**: Real-time filtering of servers by name, protocol, or tags.
- **Favorites**: Mark frequently used servers for quick access (persisted locally).
- **History**: View recently connected sessions.
- **Network**: Inspect system network interfaces.
- **IPC Integration**: Communicates with the 1Remote WPF backend via Named Pipes.

## Development

### Prerequisites

- Node.js (v18+)
- 1Remote WPF Backend running (for `getServers` and `connect` IPC calls)

### Setup

```bash
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Architecture

- **Frontend**: Vue 3, Nuxt UI (Tailwind CSS), Vite.
- **Backend Communication**: Electron IPC -> Named Pipes -> C# WPF Backend.
- **State Management**: Vue Reactivity & VueUse.