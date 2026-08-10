import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostViteConfig } from '@medmate/vite-config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default createHostViteConfig({
  rootDir,
  name: 'pharmacy_portal_host',
  port: 5173,
  // Remotes may mount Redux via @medmate/mfe-kit — share singletons with host.
  shareRedux: true,
});
