'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoaderIcon } from '@/components/common/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Shield,
  ArrowLeft,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and metrics'
  },
  {
    title: 'System Messages',
    href: '/admin/system-messages',
    icon: MessageSquare,
    description: 'Manage platform announcements'
  }
  // Additional features will be added in future updates
];

function AdminSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-3 w-full">
              {/* Brand Logo */}
              <div className="flex flex-row items-center justify-between w-full">
                <div className="px-2 tracking-wide text-lg font-semibold">
                  <span className="text-gray-600 dark:text-[#9DA1A7]">Troponin</span>
                  <span className="text-gray-900 dark:text-white font-bold">IQ</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="size-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin</span>
                </div>
              </div>
              
              {/* Back to Chat button */}
              <Link href="/chat">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8"
                >
                  <ArrowLeft className="size-4" />
                  Back to Chat
                </Button>
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href} className="flex items-center gap-3">
                    <Icon className="size-4" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex-shrink-0">
                <div className="size-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {session?.user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin access
  useEffect(() => {
    async function checkAdminAccess() {
      if (status === 'loading') return;
      
      if (!session?.user?.email) {
        router.push('/login');
        return;
      }

      try {
        const { isAdminUser } = await import('@/lib/admin/auth');
        const hasAccess = isAdminUser(session.user.email);
        
        setIsAdmin(hasAccess);
        
        if (!hasAccess) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/');
      }
    }

    checkAdminAccess();
  }, [session, status, router]);

  // Loading state
  if (status === 'loading' || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <LoaderIcon size={32} />
          <p className="text-muted-foreground mt-2">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Shield className="size-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don&apos;t have admin privileges.</p>
          <Link href="/chat">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider 
      defaultOpen={true}
      className="min-h-screen h-screen bg-background overflow-hidden"
    >
      <AdminSidebar />
      <SidebarInset className="h-full overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
} 