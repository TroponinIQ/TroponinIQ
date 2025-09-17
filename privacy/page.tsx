import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - TroponinIQ',
  description: 'Privacy Policy for TroponinIQ AI-powered fitness coaching platform.',
};

export default function PrivacyPolicyPage() {
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
            <Shield className="size-8 text-primary mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy and data security are our top priorities
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-primary">Privacy Framework in Development</CardTitle>
            <CardDescription className="text-base">
              Comprehensive privacy protections being finalized
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                We&apos;re working with privacy experts to create a comprehensive Privacy Policy that 
                clearly outlines how we protect your personal information and coaching data.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Our privacy commitments:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Your coaching conversations remain private</li>
                  <li>• No selling of personal data to third parties</li>
                  <li>• Secure encryption of all user information</li>
                  <li>• Clear data retention and deletion policies</li>
                  <li>• Full transparency in data usage</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  🛡️ Currently operating under strict data minimization principles
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  We collect only essential information needed for your coaching experience
                </p>
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
              <Link href="mailto:privacy@troponiniq.com">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Privacy Questions?
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            We&apos;re committed to protecting your privacy from day one. Our full Privacy Policy 
            will be available shortly with complete details on our data practices.
          </p>
        </div>
      </div>
    </div>
  );
} 