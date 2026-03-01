import { ChatPageClient } from '@/components/chat/ChatPageClient';

export const metadata = {
  title: 'Chat with TaxBuddy | International Student Tax Help',
  description: 'Ask TaxBuddy AI your tax questions. Get answers about Form 8843, FICA exemption, tax treaties, and more.',
};

export default function ChatPage() {
  return (
    <div className="fixed inset-0 flex flex-col">
      <ChatPageClient />
    </div>
  );
}
