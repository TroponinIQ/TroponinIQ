import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Share,
  Plus,
  Home,
  Smartphone,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Install TroponinIQ App - Installation Guide',
  description:
    'Learn how to install the TroponinIQ app on your device for the best coaching experience.',
};

export default function InstallGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Install TroponinIQ
              </h1>
              <p className="text-muted-foreground">
                Get the best experience with our app
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-primary">
            <Smartphone className="h-5 w-5" />
            Why Install the App?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">
                Faster Access
              </h3>
              <p className="text-sm text-muted-foreground">
                Launch directly from your home screen
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">
                App-like Experience
              </h3>
              <p className="text-sm text-muted-foreground">
                Full-screen without browser UI
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">
                Offline Access
              </h3>
              <p className="text-sm text-muted-foreground">
                View previous chats without internet
              </p>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="space-y-6">
          {/* iOS Safari */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="bg-blue-500 rounded-lg p-2.5">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <span className="text-foreground">iPhone & iPad (Safari)</span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Open in Safari
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Make sure you&apos;re using Safari browser (not Chrome or other
                    browsers)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Tap the Share button
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Look for the share icon at the bottom of your screen
                  </p>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md border border-border">
                    <Share className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Share button
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  3
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Select &quot;Add to Home Screen&quot;
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Scroll down in the share menu and tap &quot;Add to Home Screen&quot;
                  </p>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md border border-border">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Add to Home Screen
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  4
                </div>
                <div>
                  <p className="font-semibold text-foreground">Tap &quot;Add&quot;</p>
                  <p className="text-sm text-muted-foreground">
                    Confirm by tapping &quot;Add&quot; in the top right corner
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Android Chrome */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="bg-green-500 rounded-lg p-2.5">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <span className="text-foreground">Android (Chrome)</span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Look for the install banner
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Chrome will show an &quot;Add to Home screen&quot; banner
                    automatically
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Tap &quot;Install&quot; or &quot;Add&quot;
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Follow the prompts to install the app
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-md p-4 mt-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Alternative:</strong> Tap
                  the menu (⋮) in Chrome, then select &quot;Add to Home screen&quot; or
                  &quot;Install app&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <div className="bg-purple-500 rounded-lg p-2.5">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <span className="text-foreground">
                Desktop (Chrome, Edge, Firefox)
              </span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Look for the install icon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    In the address bar, look for an install icon or &quot;Install
                    app&quot; option
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Click &quot;Install&quot;
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The app will be added to your desktop and start menu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-muted/20 rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Troubleshooting
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  Don&apos;t see the install option?
                </p>
                <p className="text-muted-foreground">
                  Make sure you&apos;re using a supported browser (Safari on iOS,
                  Chrome on Android)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  Installation failed?
                </p>
                <p className="text-muted-foreground">
                  Try refreshing the page and attempting the installation again
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Need help?</p>
                <p className="text-muted-foreground">
                  Contact our support team using the feedback form if you&apos;re
                  having trouble installing the app
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to App Button */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Home className="h-4 w-4 mr-2" />
              Return to TroponinIQ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
