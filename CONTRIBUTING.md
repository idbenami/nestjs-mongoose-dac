# Contributing to nestjs-mongoose-dac

Thank you for considering contributing to `nestjs-mongoose-dac`! Whether it's fixing a bug, adding a feature, or improving documentation - all contributions are welcome.

## Quick Start

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Create a branch for your changes
4. Make your changes
5. Run tests: `npm test`
6. Push your changes
7. Open a pull request

## Development Guide

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nestjs-mongoose-dac.git

# Install dependencies
npm install

# Run tests to verify setup
npm test
```

### Running Tests

```bash
# Run full test suite
npm test

# Run tests in watch mode
npm run test:watch
```

### Testing Your Changes

The best way to test your changes is to use the package in a real NestJS application. Here's a quick way to do that:

1. Create a new NestJS app:

```bash
nest new test-app
```

2. Link your local `nestjs-mongoose-dac`:

```bash
# In nestjs-mongoose-dac directory
npm link

# In your test app directory
npm link nestjs-mongoose-dac
```

3. Use it in your test app:

```typescript
import { MongooseModule } from 'nestjs-mongoose-dac';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/test'),
    MongooseModule.forFeature([{ name: 'Cat', schema: CatSchema }]),
  ],
})
export class AppModule {}
```

## Guidelines

### When submitting a PR:

- Make sure tests pass
- Add tests if you're adding a feature
- Update README if needed
- Update types if you're changing interfaces

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Each commit message should be structured as follows:

- `feat: <description>`

  - New features that add functionality
  - Triggers **MINOR** version bump (1.1.0 → 1.2.0)
  - Example: `feat: add support for dynamic access policies`

- `fix: <description>`

  - Bug fixes and patches
  - Triggers **PATCH** version bump (1.1.1 → 1.1.2)
  - Example: `fix: resolve issue with pre-hook execution`

- `feat!: <description>`

  - Changes that break backward compatibility
  - Triggers **MAJOR** version bump (1.0.0 → 2.0.0)
  - Example: `feat!: change access policy API to async methods`

- `docs: <description>`

  - Documentation changes only
  - **No version bump**
  - Example: `docs: improve API reference section`

- `test: <description>`

  - Adding or modifying tests
  - **No version bump**
  - Example: `test: add unit tests for access control plugin`

- `refactor: <description>`

  - Code changes that neither fix bugs nor add features
  - **No version bump**
  - Example: `refactor: simplify access policy logic`

- `chore: <description>`
  - Maintenance tasks, dependency updates, etc
  - **No version bump**
  - Example: `chore: update mongoose to v7`

## Need Help?

- 🐛 [Open an issue](https://github.com/idbenami/nestjs-mongoose-dac/issues)
- 🤝 Ask questions in PRs

Don't worry too much about getting everything perfect. We're happy to help guide you through the process and fix any issues along the way.
