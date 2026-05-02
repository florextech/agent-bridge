'use client';

import { use } from 'react';
import { Heading, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, Text } from '@florexlabs/ui';
import { ArrowLeft, ClockCounterClockwise, Code, Info, Robot } from '@phosphor-icons/react';
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
        <a href="/" className="inline-flex items-center gap-1.5 text-(--muted) text-xs hover:text-(--foreground) transition-colors mb-4">
          <ArrowLeft size={12} /> {t('session.backToSessions')}
        </a>
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-(--surface-muted) flex items-center justify-center shrink-0">
            <Robot size={22} weight="duotone" className="text-(--brand-600)" />
          </div>
          <div>
            <Heading as="h2" size="lg">{session.projectName}</Heading>
            <div className="flex items-center gap-2 text-xs text-(--muted)">
              <span className="flx-pill text-[10px] py-0">{session.channelType}</span>
              <span>{session.agentName}</span>
            </div>
          </div>
        </div>
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
