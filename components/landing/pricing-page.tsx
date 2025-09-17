'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageCircle, User, Calendar, Zap, Sparkles, Brain, Trophy, Target } from 'lucide-react';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="relative size-6 sm:size-8">
                  <Image 
                    src="/tn_logo_dark.png" 
                    alt="TroponinIQ Logo" 
                    fill
                    sizes="(max-width: 640px) 24px, 32px"
                    className="object-contain dark:hidden"
                  />
                  <Image 
                    src="/tn_logo_light.png" 
                    alt="TroponinIQ Logo" 
                    fill
                    sizes="(max-width: 640px) 24px, 32px"
                    className="object-contain hidden dark:block"
                  />
                </div>
                <div className="tracking-wide text-sm sm:text-lg font-semibold">
                  <span className="text-gray-600 dark:text-[#9DA1A7] hidden sm:inline">Troponin</span>
                  <span className="text-gray-900 dark:text-white font-bold hidden sm:inline">IQ</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 sm:mb-6 text-xs sm:text-sm px-2 sm:px-3">
                🏆 Elite Coaching Knowledge, Now Accessible to Everyone
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 sm:mb-6 lg:mb-8 leading-tight">
                Your Personal{' '}
                <span className="text-primary">Justin Harris</span>{' '}
                Coach
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 lg:mb-12 max-w-2xl lg:max-w-none leading-relaxed">
                Get instant access to 20+ years of elite bodybuilding wisdom. Chat with an AI trained on Justin Harris&apos;s proven methodologies.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 w-full sm:w-auto">
                    Start Your Transformation
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end order-first lg:order-last">
              <div className="relative size-64 sm:size-72 md:size-80 lg:size-96">
                <Image 
                  src="/justin_harris_professional_coach.webp" 
                  alt="Justin Harris - Professional Coach" 
                  fill
                  sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
                  className="object-contain rounded-2xl shadow-2xl"
                  priority
                  quality={95}
                  unoptimized={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-muted/30">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Early Adopter Special
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Join now at our special launch pricing. Early adopters get preferred rates and access to all new features as we continue expanding the platform.
          </p>
        </div>
        
        <div className="flex justify-center">
          <Card className="relative flex flex-col max-w-md w-full border-2 border-primary/20 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-6 py-1">
                Limited Time
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl mb-2">Elite Access</CardTitle>
              <CardDescription className="text-base">Complete coaching platform</CardDescription>
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl line-through text-muted-foreground">$49.99</span>
                  <Badge variant="destructive" className="text-xs font-semibold">40% OFF</Badge>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">$29</span>
                  <span className="text-lg text-muted-foreground">.99/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Billed monthly • Cancel anytime
                </p>
              </div>
            </CardHeader>
            <CardContent className="grow space-y-6 px-6">
                             <div className="space-y-3">
                 {[
                   'Unlimited AI coaching sessions',
                   'Personalized profile-based guidance',
                   'Expert supplement recommendations',
                   'Contest prep guidance',
                   '24/7 instant access',
                   'All future features included',
                   'Early adopter preferred pricing',
                   'Priority feature requests'
                 ].map((feature) => (
                  <div key={feature} className="flex items-start space-x-3">
                    <CheckCircle className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
                             <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                 <p className="text-sm text-center font-medium">
                   🔥 Special launch pricing - limited time offer
                 </p>
               </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Link href="/register" className="block">
                <Button className="w-full" size="lg">
                  Secure Your Spot Now
                </Button>
              </Link>
                             <p className="text-xs text-center text-muted-foreground mt-3">
                 Limited time launch pricing
               </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 border-y border-border/40 bg-muted/30">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">Trusted expertise that&apos;s shaped champions</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">20+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Years Coaching</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">100+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Pro Athletes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">1000+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Transformations</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Access the complete toolkit that&apos;s helped elite athletes achieve their physique goals.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="size-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Coaching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Chat with an AI trained on Justin&apos;s complete coaching methodology. Get personalized advice on nutrition, training, supplementation, and contest prep that adapts to your specific goals and situation.
              </p>
            </CardContent>
          </Card>

                     <Card className="text-center hover:shadow-lg transition-shadow">
             <CardHeader>
               <div className="mx-auto mb-4 size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                 <User className="size-6 text-primary" />
               </div>
               <CardTitle>Personalized Profile</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground">
                 Your AI coach uses your personal profile - goals, stats, preferences, and experience level - to provide tailored advice that fits your specific situation and objectives.
               </p>
             </CardContent>
           </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="size-6 text-primary" />
              </div>
              <CardTitle>Supplement Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Access Justin&apos;s supplement expertise and recommendations from Troponin Nutrition. Get guidance on what to take, when to take it, and how to optimize your stack for your goals.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="size-6 text-primary" />
              </div>
              <CardTitle>24/7 Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No scheduling required. Get instant answers to your questions whenever inspiration strikes or challenges arise. Your coach is always available when you need guidance.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Trophy className="size-6 text-primary" />
              </div>
              <CardTitle>Contest Prep Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Whether you&apos;re preparing for your first show or aiming for pro status, get guidance based on proven strategies that have brought athletes to the top of the sport.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="size-6 text-primary" />
              </div>
              <CardTitle>Continuous Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your subscription includes access to all new features as they&apos;re released. Help shape the platform&apos;s development by requesting features that matter to you.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Innovation Pipeline Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative overflow-hidden">
        {/* Background OG Image */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 w-96 h-72 rotate-12">
            <Image 
              src="/Troponin-Nutrition-OG-Cover.webp" 
              alt="Troponin Nutrition" 
              fill
              sizes="384px"
              className="object-cover rounded-lg"
              quality={85}
            />
          </div>
          <div className="absolute left-0 bottom-10 -translate-x-16 w-80 h-60 -rotate-12 opacity-60">
            <Image 
              src="/Troponin-Nutrition-OG-Cover.webp" 
              alt="Troponin Nutrition" 
              fill
              sizes="320px"
              className="object-cover rounded-lg"
              quality={85}
            />
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Innovation Pipeline
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              We&apos;re constantly expanding the platform with cutting-edge features. Here&apos;s what&apos;s coming next for our community.
            </p>
          </div>
          
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
             <Card className="text-center bg-background/95 backdrop-blur-sm border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
               <CardHeader>
                 <div className="mx-auto mb-4 size-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                   <User className="size-6 text-primary" />
                 </div>
                 <CardTitle className="text-lg">
                   Visual Progress Dashboard
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   Watch your transformation unfold with comprehensive tracking, goal visualization, and progress analytics. See your journey mapped out beautifully.
                 </p>
               </CardContent>
             </Card>

             <Card className="text-center bg-background/95 backdrop-blur-sm border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
               <CardHeader>
                 <div className="mx-auto mb-4 size-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                   <Calendar className="size-6 text-primary" />
                 </div>
                 <CardTitle className="text-lg">
                   Complete Program Generation
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   Fully customized training and nutrition programs that evolve with you. AI-generated plans that adapt to your progress, preferences, and lifestyle.
                 </p>
               </CardContent>
             </Card>

             <Card className="text-center bg-background/95 backdrop-blur-sm border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
               <CardHeader>
                 <div className="mx-auto mb-4 size-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                   <Zap className="size-6 text-primary" />
                 </div>
                 <CardTitle className="text-lg">
                   Proactive AI Coaching
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   Your AI coach monitors your progress and reaches out when it&apos;s time to adjust your plan, celebrate wins, or get back on track.
                 </p>
               </CardContent>
             </Card>
           </div>
          
          <div className="text-center mt-12">
            <div className="inline-block bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
              <div className="flex items-center justify-center gap-4">
                <Sparkles className="size-6 text-primary" />
                <div>
                  <p className="text-lg font-semibold mb-1">
                    Shape the Future
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your feedback drives our development roadmap. Request features and help us build what you need most.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 sm:p-16 text-center border border-primary/20">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Badge variant="secondary" className="text-xs">
              ⚡ Start immediately
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🔒 Cancel anytime
            </Badge>
            <Badge variant="secondary" className="text-xs">
              ✓ Secure payments
            </Badge>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Your Transformation Starts Today
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Ready to unlock your genetic potential? Join elite athletes who&apos;ve already transformed their physiques with TroponinIQ.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 py-6 w-full sm:w-auto shadow-lg">
                Start Your Journey Today
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 w-full sm:w-auto border-2">
                I Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 TroponinIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}