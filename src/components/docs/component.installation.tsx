import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import InstallationCmd from '../shared/installation-cmd';
import CodePreview from '../shared/code-preview';

interface ComponentInstallationProps {
  filename: string;
}

export default function ComponentInstallation({ filename }: ComponentInstallationProps) {
  return (
    <div className={cn('group relative flex flex-col space-y-2')}>
      <Tabs defaultValue="cli" className="relative mr-auto w-full">
        <div className="flex items-center justify-between pb-2">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="cli" className="table-trigger">
              CLI
            </TabsTrigger>
            <TabsTrigger value="manual" className="table-trigger">
              Manual
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="cli">
          <InstallationCmd filename={filename} />
        </TabsContent>
        <TabsContent value="manual">
          <p className="text-muted-foreground pb-2">Copy the following code and paste it into your project.</p>
          <CodePreview filename={filename} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
