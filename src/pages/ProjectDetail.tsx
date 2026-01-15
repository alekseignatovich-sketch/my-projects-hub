import { useI18n } from '../lib/useI18n';

export default function ProjectDetailPage() {
  const { t } = useI18n();
  return <div>{t('loading')}...</div>;
}
