'use client';

import { use } from 'react';
import { Heading, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, Text } from '@florexlabs/ui';
import { ArrowLeft, ClockCounterClockwise, Code, Info } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/queries';
import { TimelineTab } from '@/components/session/TimelineTab';
import { InstructionsTab } from '@/components/session/InstructionsTab';
import { InfoTab } from '@/components/session/InfoTab';

export default function SessionDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { t } = useI18n();
  const { data: session, isLoading, error } = useSession(id);

  if (error) return <Text variant="danger">{error.message}</Text>;
  if (isLoading || !session) return <div className="flex items-center justify-center h-32"><Spinner className="size-5" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <a href="/" className="inline-flex items-center gap-1.5 text-(--muted) text-sm hover:text-(--foreground) transition-colors mb-2">
          <ArrowLeft size={14} /> {t('session.backToSessions')}
        </a>
        <Heading as="h2" size="lg">{session.projectName}</Heading>
        <Text variant="muted" size="sm">{t('session.agentPrefix')}: {session.agentName}</Text>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline"><span className="inline-flex items-center gap-1.5"><ClockCounterClockwise size={15} weight="duotone" /> {t('session.timeline')}</span></TabsTrigger>
          <TabsTrigger value="instructions"><span className="inline-flex items-center gap-1.5"><Code size={15} weight="duotone" /> {t('session.instructions')}</span></TabsTrigger>
          <TabsTrigger value="info"><span className="inline-flex items-center gap-1.5"><Info size={15} weight="duotone" /> {t('session.info')}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="timeline"><TimelineTab sessionId={id} /></TabsContent>
        <TabsContent value="instructions"><InstructionsTab session={session} /></TabsContent>
        <TabsContent value="info"><InfoTab session={session} /></TabsContent>
      </Tabs>
    </div>
  );
}
