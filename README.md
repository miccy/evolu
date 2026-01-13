# Evolu

Evolu is a local-first platform designed for privacy, ease of use, and no vendor lock-in. It provides a set of libraries to build apps that work offline, sync automatically, and encrypt data end-to-end.

[evolu.dev](https://www.evolu.dev)

## Features

- **Local-First**: Data lives on the device first.
- **Privacy-Centric**: End-to-end encryption by default.
- **Sync**: Automatic sync across devices using CRDTs.
- **Typed**: Built with TypeScript for type safety.
- **SQL**: SQLite support in the browser and on devices.

## Requirements

- [Bun](https://bun.sh) (latest)
- Node.js >= 22

## Development

Evolu is a monorepo managed by **Turbo** and **Bun**. We use **Biome** for linting and formatting.

### Getting Started

Install dependencies:

```bash
bun install
```

Start the development environment (web docs + examples):

```bash
bun dev
```

### Scripts

- **Linting**: `bun run lint` (Check code quality with Biome)
- **Formatting**: `bun run format` (Apply formatting with Biome)
- **Testing**: `bun run test` (Run tests with Vitest)
- **Build**: `bun run build` (Build all packages)
- **Clean**: `bun run clean` (Clean artifacts and node_modules)

## Project Structure

- `packages/`
  - `common`: Core logic, platform-agnostic.
  - `react`: React hooks and components.
  - `react-native`: React Native integration.
  - `web`: Web-specific implementations.
  - `server`: Sync and signaling server.
- `apps/`
  - `web`: Documentation and website (Next.js).
- `examples/`: Sample applications demonstrating usage.

## Community

- [GitHub Discussions](https://github.com/evoluhq/evolu/discussions)
- [Discord](https://discord.gg/2J8yyyyxtZ)
- [X (Twitter)](https://x.com/evoluhq)

## License

MIT
