import { RegistryEntry } from '@r/schema';
import fs from 'fs';
import path from 'path';

const REGISTRY_COMPONENTS_PATH = path.join(process.cwd(), 'registry/c/');
const REGISTRY_C_PATH = path.join(process.cwd(), 'public/c');

interface Dependencies {
  dependencies: string[];
  registryDependencies: string[];
}

const buildRegistry = (code: string, filename: string, dependencies: Dependencies): RegistryEntry => {
  if (!filename.endsWith('.tsx')) {
    throw new Error(`Invalid file extension for ${filename}. Expected .tsx file`);
  }

  const name = filename.replace('.tsx', '');
  const registrySchema: RegistryEntry = {
    name,
    type: 'registry:ui',
    dependencies: dependencies.dependencies || [],
    files: [
      {
        path: filename,
        content: code,
        type: 'registry:ui',
        target: `./components/ui/shuip/${filename}`,
      },
    ],
    registryDependencies: dependencies.registryDependencies || [],
  };

  return registrySchema;
};

const parseDependencies = (sourceCode: string): Dependencies => {
  const excludeDeps = ['react', 'react-dom'];
  
  const importRegex = /import\s+(?:type\s+)?(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"](.*?)['"];?/g;
  const npmDependencies = new Set<string>();
  const registryDependencies = new Set<string>();
  let match;

  while ((match = importRegex.exec(sourceCode)) !== null) {
    const dep = match[1];
    
    if (
      !dep.startsWith('@/') && 
      !dep.startsWith('.') && 
      !excludeDeps.includes(dep)
    ) {
      const packageName = dep.split('/')[0].replace(/^@/, '');
      npmDependencies.add(packageName);
    }
    
    if (dep.startsWith('@/components/ui/')) {
      const componentName = dep.split('/').pop();
      if (componentName) {
        registryDependencies.add(componentName);
      }
    }
  }

  return {
    dependencies: Array.from(npmDependencies),
    registryDependencies: Array.from(registryDependencies),
  };
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
        const componentDeps = parseDependencies(componentCode)
        console.log("File deps : ", componentDeps);
        const componentRegistry = buildRegistry(componentCode, file, componentDeps);

        const outputPath = path.join(REGISTRY_C_PATH, file.replace('.tsx', '.json'));
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
