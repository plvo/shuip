import registry from '../registry.json';

const allRegistryCliNames = registry.items.map((item) => item.name);

for (const name of allRegistryCliNames) {
  console.log(`bun x shadcn@latest add "http://localhost:3000/r/${name}.json"`);
}
