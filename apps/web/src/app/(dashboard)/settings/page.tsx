'use client';

import { useState } from 'react';
import { Heading, Text, Tabs, TabsList, TabsTrigger, TabsContent } from '@florexlabs/ui';
import { TelegramLogo, Robot, Users } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { TelegramTab } from '@/components/settings/TelegramTab';
import { SessionsTab } from '@/components/settings/SessionsTab';
import { TeamTab } from '@/components/settings/TeamTab';

export default function SettingsPage() {
  const { t } = useI18n();
  const [botToken, setBotToken] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h2" size="lg">{t('settings.title')}</Heading>
        <Text variant="muted" size="sm">{t('settings.subtitle')}</Text>
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections"><span className="inline-flex items-center gap-1.5"><TelegramLogo size={15} weight="duotone" /> {t('settings.connections')}</span></TabsTrigger>
          <TabsTrigger value="sessions"><span className="inline-flex items-center gap-1.5"><Robot size={15} weight="duotone" /> {t('settings.sessions')}</span></TabsTrigger>
          <TabsTrigger value="team"><span className="inline-flex items-center gap-1.5"><Users size={15} weight="duotone" /> {t('settings.team')}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="connections"><TelegramTab botToken={botToken} onBotTokenChange={setBotToken} /></TabsContent>
        <TabsContent value="sessions"><SessionsTab botToken={botToken} /></TabsContent>
        <TabsContent value="team"><TeamTab /></TabsContent>
      </Tabs>
    </div>
  );
}
