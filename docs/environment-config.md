# Environment Configuration

This project uses environment-specific configuration to support different settings between development and production environments.

## Configuration Files

The environment-specific configuration is stored in YAML files:

- `src-tauri/config.dev.yaml` - Development environment configuration
- `src-tauri/config.prod.yaml` - Production environment configuration

## Environment Selection

The environment is selected using the `APP_ENV` environment variable, which is set in the package.json scripts:

```json
"dev:app": "cross-env APP_ENV=dev npm run sync-config && cross-env APP_ENV=dev npm run tauri dev",
"prod:app": "cross-env APP_ENV=prod npm run sync-config && cross-env APP_ENV=prod npm run tauri dev",
```

## Configuration Management

### Backend (Rust)

In the Rust backend code, configuration is loaded from the appropriate YAML file based on the `APP_ENV` environment variable. The configuration is loaded in the `config.rs` module and can be accessed throughout the application.

```rust
// Load configuration based on environment
let app_config = config::get_config();
let api_url = app_config.api_url;
```

### Frontend (TypeScript/React)

In the frontend code, you can access the configuration using the utilities in `src/config.ts`:

```typescript
import { getEnvironment, EnvConfig, getConfig } from '../config';

// Get the current environment
const env = await getEnvironment();  // Returns 'dev' or 'prod'

// Use environment-specific values from the static config
const apiUrl = EnvConfig.API_URL[env];

// Or get values from the backend configuration
const debugMode = await getConfig<boolean>('debug_mode', false);
```

## Configuration Synchronization

A script is provided to ensure configuration files exist and keep them in sync:

```bash
# Ensure all configuration files exist
npm run sync-config

# Update a specific value in all configuration files
node ./scripts/sync-config.js update key value
```

## Best Practices

1. **Don't store secrets in configuration files**: Use environment variables or a secure secrets management solution for sensitive data.

2. **Keep configuration DRY**: Avoid duplicating configuration values. Use the sync-config.js script to update values across environments.

3. **Use type-safe configuration**: The configuration system is designed to be type-safe in both Rust and TypeScript.

4. **Default values**: Always provide sensible defaults for configuration values that might be missing.
