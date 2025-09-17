import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/chat/data-stream-handler';
import type { Attachment, UIMessage } from 'ai';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await auth(); // Get session first to have user ID

  // Strict authentication check - redirect to main page (login screen) if no session
  if (!session) {
    redirect('/');
  }

  // Pass current user's ID to getChatById
  const chat = await getChatById({ id, currentUserId: session.user?.id });

  // Handle non-existent chats - treat as new chat instead of 404
  if (!chat) {
    console.log(
      `[Chat Page] Chat ${id} not found in database, treating as new chat`,
    );

    // For new chats, create a default chat object
    const newChatData = {
      id: id,
      userId: session.user?.id || '',
      title: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return (
      <>
        <Chat
          key={id}
          id={newChatData.id}
          initialMessages={[]}
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler key={`handler-${id}`} id={id} />
      </>
    );
  }

  // Existing chat - check permissions (all chats are now private)
  if (!session.user) {
    return notFound();
  }

  if (session.user.id !== chat.userId) {
    return notFound();
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  console.log(
    `[Chat Page] Loaded ${messagesFromDb.length} messages from database for chat ${id}`,
  );
  console.log(
    `[Chat Page] Raw messages from DB:`,
    messagesFromDb.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content?.slice(0, 50),
    })),
  );

  function convertToUIMessages(messages: Array<any>): Array<UIMessage> {
    const converted = messages
      .sort((a, b) => {
        // Ensure proper chronological ordering
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      })
      .map((message) => {
        // Handle both new parts format and legacy content format
        let parts = message.parts;
        if (!parts && message.content) {
          // Convert legacy content to parts format
          parts = [{ type: 'text', text: message.content }];
        }

        return {
          id: message.id,
          parts: parts as UIMessage['parts'],
          role: message.role as UIMessage['role'],
          // Note: content will soon be deprecated in @ai-sdk/react
          content: message.content || parts?.[0]?.text || '',
          createdAt:
            message.createdAt instanceof Date
              ? message.createdAt
              : new Date(message.createdAt),
          attachments: (message.attachments as Array<Attachment>) ?? [],
        };
      });

    console.log(
      `[Chat Page] Converted ${converted.length} messages to UI format for chat ${id}`,
    );
    console.log(
      `[Chat Page] Converted messages:`,
      converted.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content?.slice(0, 50),
      })),
    );

    return converted;
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler key={`handler-${id}`} id={id} />
    </>
  );
}
