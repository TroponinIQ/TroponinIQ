import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - TroponinIQ',
  description: 'Terms of Service for TroponinIQ AI-powered fitness coaching platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="size-8 text-primary mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Legal documents being finalized for your protection and clarity
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-primary">Document in Development</CardTitle>
            <CardDescription className="text-base">
              We&apos;re finalizing our comprehensive Terms of Service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Our legal team is currently finalizing our Terms of Service to ensure they provide 
                clear, comprehensive protection and guidance for all TroponinIQ users.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">What to expect:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Clear usage guidelines for the AI coaching platform</li>
                  <li>• Subscription and billing terms</li>
                  <li>• User responsibilities and platform rules</li>
                  <li>• Dispute resolution procedures</li>
                  <li>• Data handling and privacy protections</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>Expected completion:</strong> Within the next few business days
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Continue Registration
                </Button>
              </Link>
              <Link href="mailto:support@troponiniq.com">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Questions? Contact Us
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            By using TroponinIQ, you agree to be bound by our Terms of Service once published.
            We&apos;ll notify all users when the final version is available.
          </p>
        </div>
      </div>
    </div>
  );
} 