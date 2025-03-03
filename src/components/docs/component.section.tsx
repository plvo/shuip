import * as React from 'react';
import InstallationCmd from './installation-cmd';

interface ComponentSectionsProps {
  // key ui component, value array of examples
  component: Record<string, string[]>;
}

export default function ComponentSections({ component }: ComponentSectionsProps) {
  const componentName = Object.keys(component)[0];

  return (
    <section>
      {JSON.stringify(componentName)}
      {/* preview */}

      {/* Installation */}
      <InstallationCmd name="" />

      {/* Usage */}

      {/* Examples */}
    </section>
  );
}
