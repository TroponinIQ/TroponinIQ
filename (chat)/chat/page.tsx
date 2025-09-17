import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';

export default async function ChatPage() {
  // Check authentication first
  const session = await auth();
  
  if (!session) {
    // Redirect unauthenticated users to login
    redirect('/login');
  }

  // Generate a new chat ID and redirect to it for authenticated users
  const newChatId = generateUUID();
  redirect(`/chat/${newChatId}`);
} 