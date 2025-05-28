import { registryIndex } from '#/registry/__index__';
import { InstallationCmd } from './item-installation';

export default function CodeAllCli() {
  const filenames = Object.keys(registryIndex).filter((f) => !f.endsWith('.example'));

  return <InstallationCmd filename={filenames} />;
}
