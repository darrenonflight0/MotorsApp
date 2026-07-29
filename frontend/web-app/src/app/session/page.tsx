import { getSession } from '@/app/actions/authActions';
import Heading from '@/app/components/Heading';

export default async function SessionPage() {
  const session = await getSession();

  return (
    <div className="flex flex-col gap-4">
      <Heading title="Session dashboard" subtitle="Development view of the current NextAuth session" />
      <pre className="readout overflow-auto rounded-xl border border-line/60 bg-ink p-4 text-xs text-racing">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
