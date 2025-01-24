import { RegistryEntry } from '@r/schema';
import fs from 'fs';
import path from 'path';

const REGISTRY_COMPONENTS_PATH = path.join(process.cwd(), 'registry/c/');
const REGISTRY_C_PATH = path.join(process.cwd(), 'public/c');

const buildRegistry = (code: string, filename: string): RegistryEntry => {
  if (!filename.endsWith('.tsx')) {
    throw new Error(`Invalid file extension for ${filename}. Expected .tsx file`);
  }

  const name = filename.replace('.tsx', '');

  const escapedCode = code.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');

  const registrySchema: RegistryEntry = {
    name,
    type: 'registry:ui',
    files: [
      {
        path: `shuip/${filename}`,
        content: escapedCode,
        type: 'registry:ui',
        target: '',
      },
    ],
  };

  return registrySchema;
};

async function main() {
  try {
    if (!fs.existsSync(REGISTRY_COMPONENTS_PATH)) {
      throw new Error(`Components directory not found: ${REGISTRY_COMPONENTS_PATH}`);
    }

    const componentsFiles = fs.readdirSync(REGISTRY_COMPONENTS_PATH, { recursive: true }) as string[];

    await Promise.all(
      componentsFiles.map(async (file) => {
        const componentDir = path.join(REGISTRY_COMPONENTS_PATH, file);
        const componentCode = fs.readFileSync(componentDir, 'utf-8');
        const componentRegistry = buildRegistry(componentCode, file);

        const outputPath = path.join(REGISTRY_C_PATH, `${file.replace('.tsx', '.json')}`);
        await fs.promises.writeFile(outputPath, JSON.stringify(componentRegistry, null, 2));

        console.log(`Generated registry for ${file}`);
      }),
    );

    console.log('Registry build completed successfully');
  } catch (error) {
    console.error('Failed to build registry:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
