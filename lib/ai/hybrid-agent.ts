/**
 * HYBRID SINGLE AGENT
 *
 * Simple, robust approach: One smart agent with selective tool access
 * No rigid routing, no refusals, no over-engineering
 *
 * 🎯 Philosophy: Answer EVERYTHING, use tools when helpful
 * 🛡️ Security: Input validation, not rigid refusal
 * ⚡ Performance: Single LLM call with parallel tool access
 */

import { openRouterRequest, openRouterStream } from './openrouter';
import { smartHybridSearchFAQs } from '@/lib/supabase/vector-search';
import { buildProfileContextForAI } from '@/lib/firebase/profile';
import { nutritionCalculator } from './tools/calculator-tool';
import {
  programCalculator,
  type ProgramProfile,
} from './tools/program-calculator-tool';

import { formatDateTimeForAI, getTimeContext } from './tools/datetime-tool';

import { optimizeForProductAgent } from '@/lib/db/product-catalog/agent-integration';
import { SYSTEM_PROMPT, buildUnifiedAgentPrompt } from './prompts';

// Agent context interface
export interface HybridAgentContext {
  userQuery: string;
  userId: string;
  sessionId?: string;
  conversationHistory?: any[];
  userProfile?: any;
  currentDateTime?: string;
  timeContext?: string;
}

// Agent response interface
export interface HybridAgentResponse {
  response: string;
  confidence: number;
  sourceKnowledge: string[];
  toolsUsed: string[];
  metadata: any;
  easterEgg?: {
    type: string;
    content: string;
  };
}

export class HybridAgent {
  private initialized = false;

  /**
   * Initialize the hybrid agent
   */
  async initialize() {
    if (this.initialized) return;

    console.log('[Hybrid Agent] Initializing unified agent system...');
    this.initialized = true;
    console.log('[Hybrid Agent] System ready - will handle ALL queries');
  }

  /**
   * Process any user query with intelligent tool selection
   */
  async processQuery(
    context: HybridAgentContext,
  ): Promise<HybridAgentResponse> {
    await this.initialize();

    try {
      console.log(`\n🤖 [HYBRID AGENT] Processing: "${context.userQuery}"`);

      // SEMANTIC ROUTER: Comprehensive intent detection for all query types
      const queryIntents = this.analyzeQueryIntents(context.userQuery);

      const needsCalculation = queryIntents.needsCalculation;
      const needsProgram = queryIntents.needsProgram;
      const needsProducts = queryIntents.needsProducts;

      console.log(`🔍 [HYBRID AGENT] Semantic Router Analysis:`);
      console.log(`   Detected intents: [${queryIntents.intents.join(', ')}]`);
      console.log(`   Needs calculation: ${needsCalculation}`);
      console.log(`   Needs program: ${needsProgram}`);
      console.log(`   Needs products: ${needsProducts}`);
      console.log(`   Query: "${context.userQuery}"`);

      // FAQ search is ALWAYS done - it's our primary knowledge source
      const knowledgeResults = await this.searchKnowledgeBase(
        context.userQuery,
      );

      // ALWAYS load profile if available - it's lightweight and enables personalization
      // The AI will intelligently use it when relevant and ignore when not
      const userContext = context.userProfile
        ? this.buildUserContext(context.userProfile)
        : 'No user profile available.';

      // ALWAYS analyze tools when ANY intent is detected - no more bypassing
      const toolAnalysis =
        needsCalculation || needsProducts || needsProgram
          ? this.analyzeToolNeeds(context.userQuery)
          : {
              availableTools: [],
              needsNutritionCalc: false,
              needsProductInfo: false,
              needsProgramCalc: false,
              needsArithmetic: false,
              hasEasterEgg: false,
            };

      console.log(`📊 [HYBRID AGENT] Context gathered:`);
      console.log(`   Knowledge sources: ${knowledgeResults.length}`);
      console.log(`   User profile: ${!!context.userProfile}`);
      console.log(
        `   Tools available: ${toolAnalysis.availableTools.join(', ')}`,
      );

      // Store Easter egg data for later if triggered
      let easterEggData = null;
      if (toolAnalysis.hasEasterEgg) {
        console.log(
          `🥚 [HYBRID AGENT] Easter egg detected, will include with normal response`,
        );
        easterEggData = {
          type: toolAnalysis.easterEggType,
          content: toolAnalysis.easterEggResponse,
        };

        // Don't modify the query - let the AI respond normally, the Easter egg will be shown separately
      }

      // Execute any needed tools in parallel
      const toolResults = await this.executeTools(toolAnalysis, context);

      // Build comprehensive prompt using centralized prompt builder
      const prompt = buildUnifiedAgentPrompt({
        userQuery: context.userQuery,
        knowledgeContext: knowledgeResults,
        userContext,
        toolResults,
        conversationHistory: context.conversationHistory,
        currentDateTime: context.currentDateTime || formatDateTimeForAI(),
        timeContext: context.timeContext || JSON.stringify(getTimeContext()),
      });

      // VOICE-FIRST MODEL SELECTION: Always use Claude 4 for authentic Justin Harris voice
      // Only use GPT for very specific lightweight tasks where voice doesn't matter
      // Since Justin's personality and coaching style are core to the experience
      const modelToUse = undefined; // Always use Claude 4 (DEFAULT_CHAT_MODEL)

      console.log(
        `🧠 [HYBRID AGENT] Using Claude 4 - Authentic Justin Harris voice`,
      );

      // Get response from selected model with centralized system prompt
      const response = await openRouterRequest({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Balanced for helpful but accurate responses
        maxTokens: 4000, // Both models can handle good response lengths
      });

      console.log(`✅ [HYBRID AGENT] Response generated successfully`);

      return {
        response: response,
        confidence: 0.9, // High confidence since we handle everything
        sourceKnowledge: knowledgeResults.map(
          (r) => r.custom_metadata?.question || 'Knowledge',
        ),
        toolsUsed: toolResults.toolsUsed,
        metadata: {
          knowledgeSources: knowledgeResults.length,
          hasUserProfile: !!context.userProfile,
          toolsExecuted: toolResults.toolsUsed.length,
          easterEggTriggered: !!easterEggData,
        },
        easterEgg: easterEggData || undefined,
      };
    } catch (error) {
      console.error('\n❌ [HYBRID AGENT] Error processing query:', error);
      console.error(
        '❌ [HYBRID AGENT] Error stack:',
        error instanceof Error ? error.stack : 'No stack available',
      );
      console.error(
        '❌ [HYBRID AGENT] Query that caused error:',
        context.userQuery,
      );
      console.error('❌ [HYBRID AGENT] Context details:', {
        hasUserProfile: !!context.userProfile,
        userQuery: context.userQuery,
        sessionId: context.sessionId,
      });

      return {
        response:
          "I'm here to help! There was a technical issue, but please feel free to ask me anything about fitness, nutrition, supplements, or calculations.",
        confidence: 0.1,
        sourceKnowledge: [],
        toolsUsed: [],
        metadata: {
          error: true,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        },
      };
    }
  }

  /**
   * Process query with streaming response
   */
  async processQueryStream(
    context: HybridAgentContext,
  ): Promise<ReadableStream<string>> {
    await this.initialize();

    try {
      console.log(
        `\n🚀 [HYBRID AGENT STREAM] Processing: "${context.userQuery}"`,
      );

      // SIMPLIFIED: Same as non-streaming - FAQ always, tools only when needed
      // SEMANTIC ROUTER: Use same comprehensive intent detection as regular flow
      const queryIntents = this.analyzeQueryIntents(context.userQuery);

      const needsCalculation = queryIntents.needsCalculation;
      const needsProgram = queryIntents.needsProgram;
      const needsProducts = queryIntents.needsProducts;

      // FAQ search is ALWAYS done
      const knowledgeResults = await this.searchKnowledgeBase(
        context.userQuery,
      );

      // ALWAYS load profile if available (streaming version)
      const userContext = context.userProfile
        ? this.buildUserContext(context.userProfile)
        : 'No user profile available.';

      // ALWAYS analyze tools when ANY intent is detected - consistent with main flow
      const toolAnalysis =
        needsCalculation || needsProducts || needsProgram
          ? this.analyzeToolNeeds(context.userQuery)
          : {
              availableTools: [],
              needsNutritionCalc: false,
              needsProductInfo: false,
              needsProgramCalc: false,
              needsArithmetic: false,
              hasEasterEgg: false,
            };

      // Execute tools
      const toolResults = await this.executeTools(toolAnalysis, context);

      // Build prompt using centralized prompt builder
      const prompt = buildUnifiedAgentPrompt({
        userQuery: context.userQuery,
        knowledgeContext: knowledgeResults,
        userContext,
        toolResults,
        conversationHistory: context.conversationHistory,
        currentDateTime: context.currentDateTime || formatDateTimeForAI(),
        timeContext: context.timeContext || JSON.stringify(getTimeContext()),
      });

      // VOICE-FIRST MODEL SELECTION: Always use Claude 4 for authentic Justin Harris voice
      const modelToUse = undefined; // Always use Claude 4 (DEFAULT_CHAT_MODEL)

      console.log(
        `🧠 [HYBRID AGENT STREAM] Using Claude 4 - Authentic Justin Harris voice`,
      );

      // Get stream response from selected model with centralized system prompt
      return await openRouterStream({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        maxTokens: 4000, // Both models can handle good response lengths
      });
    } catch (error) {
      console.error('\n❌ [HYBRID AGENT STREAM] Error:', error);

      return new ReadableStream<string>({
        start(controller) {
          controller.enqueue(
            "I'm here to help! Please ask me anything about fitness, nutrition, supplements, or calculations.",
          );
          controller.close();
        },
      });
    }
  }

  /**
   * Search knowledge base for relevant information
   */
  private async searchKnowledgeBase(query: string): Promise<any[]> {
    try {
      return await smartHybridSearchFAQs(query);
    } catch (error) {
      console.log(
        `[Hybrid Agent] Knowledge search failed, continuing without: ${error}`,
      );
      return [];
    }
  }

  /**
   * Build user context safely
   */
  private buildUserContext(userProfile: any): string {
    if (!userProfile) {
      return 'No user profile available.';
    }

    try {
      return buildProfileContextForAI(userProfile);
    } catch (error) {
      console.log(
        `[Hybrid Agent] Profile context error, using fallback: ${error}`,
      );
      return 'User profile temporarily unavailable.';
    }
  }

  /**
   * Get comprehensive program context for MASSIVE/SHREDDED
   */
  private getProgramContext(program: 'massive' | 'shredded'): string {
    if (program === 'massive') {
      return `**MASSIVE PROGRAM - Complete Muscle Building System**

**Core Philosophy:**
MASSIVE is Justin Harris's precision nutrition program designed to take the guesswork out of building muscle through strategic carb cycling. Unlike generic "eat more" approaches, MASSIVE uses a calculated 3-day rotating cycle that optimizes muscle growth while minimizing fat gain.

**The 3-Day Carb Cycling System:**
- **LOW DAYS** (Non-training): 270g protein, 225g carbs, 60g added fat (~2,520 calories)
- **MED DAYS** (Moderate training): 280g protein, 400g carbs, 36g added fat (~3,044 calories)  
- **HIGH DAYS** (Heavy training): 190g protein, 665g carbs, 0g added fat (~3,420 calories)

**Intra-Workout Protocol:**
- Use Field Rations from TroponinSupplements.com to get your protein and carbs for the intra workout
- Med Days: 10g protein + 20g carbs during training
- High Days: 10g protein + 35g carbs during training

**Weekly Structure:**
- Monday: Low Day (rest)
- Tuesday: Med Day (moderate training)
- Wednesday: High Day (heavy training)
- Thursday: Low Day (rest)
- Friday: Med Day (moderate training)
- Saturday: High Day (heavy training)
- Sunday: Low Day (rest)

**Key Features:**
- Fully customized based on exact body composition stats and goals
- Automatic nutrition adjustments as your body changes
- Detailed breakdowns of daily calories, macronutrients, and optimal meal timing
- Strategic meal timing around workouts (pre/intra/post workout protocols)
- Uses proven scientific principles refined through years of working with competitive athletes

**Implementation Details:**
- **Cardio Protocol**: 12 min HIIT post workout 3x per week (can skip if you get 12,000 steps that day)
- **Fat Tracking**: Only "added fat" is counted towards totals - protein and carb sources provide additional fat naturally
- **Meal Timing**: Pre-workout 1-1.5 hours before, intra during workout, post within 1 hour

**What Makes It Unique:**
- Precise calculations based on lean body mass and training schedule
- Built-in progression rules (like adding a 3rd high day if progress stalls)
- Specific approved food lists with "use freely" vs "use sparingly" categories

**High Day Special Rules:**
- 50% of carbs can come from "sugary" sources (fruit, juice, bagels, bread, dry cereal, fat-free candies)
- A sugary source is any carb source that is <5g of fat per serving
- Meal 6 on high days can be a cheat meal if desired
- High days should be on your heaviest training days of the week, but non-consecutive if at all possible`;
    } else {
      return `**SHREDDED PROGRAM - Precision Fat Loss System**

**Core Philosophy:**
SHREDDED is Justin Harris's advanced fat loss program that uses aggressive carb cycling to strip fat while preserving muscle mass. This isn't a starvation diet - it's a calculated approach that manipulates carb intake strategically.

**The 3-Day Carb Cycling System:**
- **LOW DAYS** (Most days): 360g protein, 135g carbs, 45g added fat (~2,385 calories)
- **MED DAYS** (Some training): 280g protein, 265g carbs, 20g added fat (~2,360 calories)
- **HIGH DAYS** (One per week): 220g protein, 855g carbs, 0g added fat (~4,300 calories)

**Intra-Workout Protocol:**
- Recommended to get your protein and carbs for the intra workout from a product like Field Rations from TroponinSupplements.com 
- Med Days: 10g protein + 25g carbs during training
- High Days: 10g protein + 45g carbs during training

**Weekly Structure (More Aggressive):**
- Monday: Low Day (rest)
- Tuesday: Low Day (training)
- Wednesday: Low Day (rest)
- Thursday: Med Day (training)
- Friday: Low Day (rest)
- Saturday: High Day (heaviest training)
- Sunday: Low Day (rest)

**Key Features:**
- Much higher protein intake for muscle preservation during fat loss
- Fewer high days compared to MASSIVE (only 1 per week vs 2)
- Strategic glycogen depletion and supercompensation
- Any meals with less than 25g carbs can use vegetable sources
- Much higher carb load on high days (855g) for metabolic reset
- Zero added fat on high days - all fat comes from protein sources

**Advanced Fat Loss Strategies:**
- Glycogen supercompensation on high days
- Metabolic flexibility training
- Precise meal timing for maximum fat oxidation
- Can train fasted if desired
- Strategic refeed days to prevent metabolic slowdown`;
    }
  }

  /**
   * Check for easter eggs in the query
   */
  private checkEasterEggs(
    query: string,
  ): { response: string; type: string } | null {
    const lowerQuery = query.toLowerCase().trim();

    // Easter egg patterns with low probability but high viral potential
    const easterEggs = [
      {
        type: 'project-superheavyweight',
        patterns: [
          'show me the best workout ever',
          'what is the best workout ever',
          'best workout of all time',
        ],
        response: `The best workout ever? That's subjective, but I'll share something special with you - back in 2007, I documented my training methodology in "Project Super Heavyweight." It captures the exact approach I used during my competitive powerlifting career when I was totaling Elite numbers.

You can check it out here: https://www.youtube.com/watch?v=Ld41RdDru40&t

This isn't just another workout video - it's a deep dive into the mindset, programming, and techniques that took me to championship level. The principles still apply whether you're a beginner or advanced lifter.

What specific aspect of training are you most interested in improving?`,
      },
      {
        type: 'project-superheavyweight',
        patterns: [
          'tell me about project super heavyweight',
          'what is project super heavyweight',
        ],
        response: `Project Super Heavyweight was my 2007 training documentary that captured my powerlifting methodology during my championship years. It's raw, unfiltered training wisdom from when I was totaling Elite in competition.

Here's the full documentary: https://www.youtube.com/watch?v=Ld41RdDru40&t

This wasn't some polished commercial production - it was me sharing exactly how I trained, thought, and approached the big three lifts. The principles are timeless and applicable to anyone serious about strength training.

Are you looking to improve your squat, bench, or deadlift specifically?`,
      },
      {
        type: 'mr-michigan',
        patterns: ['who won mr michigan 2004', 'mr michigan 2004 winner'],
        response: `That would be me! I won the overall title at the 2004 Mr. Michigan bodybuilding competition. That victory was significant because it validated years of applying scientific principles to both training and nutrition.

The combination of my Kinesiology background and practical application really came together that year. What made it special wasn't just the win, but proving that evidence-based approaches could compete at the highest levels.

Are you interested in competitive bodybuilding or just curious about my background?`,
      },
      {
        type: 'powerlifting-champion',
        patterns: ['michigan powerlifting champion', 'apf michigan champion'],
        response: `I was the APF Michigan powerlifting champion in both 2007 and 2008, totaling Elite in both competitions. Those were incredible years where everything clicked - the training, nutrition, and mental preparation.

What made those championships special was applying my physics background to optimize biomechanics and leverage. It's amazing how understanding force vectors and mechanical advantage can transform your lifts.

Are you into powerlifting, or are you curious about how to apply scientific principles to strength training?`,
      },
    ];

    for (const egg of easterEggs) {
      for (const pattern of egg.patterns) {
        if (lowerQuery.includes(pattern)) {
          console.log(`🥚 [EASTER EGG TRIGGERED] Pattern: "${pattern}"`);
          return { response: egg.response, type: egg.type };
        }
      }
    }

    return null;
  }

  /**
   * SEMANTIC ROUTER: Comprehensive intent analysis for query routing
   * Detects multiple intents simultaneously and handles complex queries
   */
  private analyzeQueryIntents(query: string): {
    needsCalculation: boolean;
    needsProgram: boolean;
    needsProducts: boolean;
    needsWorkout: boolean;
    needsPEDs: boolean;
    intents: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const intents: string[] = [];

    // CALCULATION INTENT - Much more comprehensive
    const calculationKeywords = [
      // Direct calculation terms
      'calculate',
      'computation',
      'math',
      'formula',
      // Body composition
      'lean body mass',
      'lbm',
      'body fat',
      'body weight',
      'weight',
      'mass',
      'body composition',
      'fat percentage',
      'muscle mass',
      // Nutrition calculations
      'macro',
      'macros',
      'calorie',
      'calories',
      'tdee',
      'bmr',
      'metabolic rate',
      'protein',
      'carb',
      'carbs',
      'carbohydrate',
      'fat',
      'fats',
      'daily calories',
      'target calories',
      'caloric intake',
      'caloric needs',
      'nutrition plan',
      'diet plan',
      'meal plan',
      // Goals and targets
      'cutting calories',
      'bulking calories',
      'maintenance calories',
      'deficit',
      'surplus',
      'recomp',
    ];

    const calculationPhrases = [
      'how many calories',
      'how much protein',
      'what should my macros',
      'calculate my',
      'figure out my',
      'determine my',
      'what are my',
      'daily intake',
      'nutritional needs',
      'caloric requirements',
      'macro breakdown',
      'macro split',
      'macro distribution',
    ];

    const needsCalculation =
      calculationKeywords.some((keyword) => lowerQuery.includes(keyword)) ||
      calculationPhrases.some((phrase) => lowerQuery.includes(phrase)) ||
      /\b(my|what)\s+(macros?|calories?|protein|carbs?|fat)\b/i.test(query);

    if (needsCalculation) intents.push('calculation');

    // PROGRAM INTENT - MASSIVE/SHREDDED programs
    const programKeywords = [
      'massive',
      'shredded',
      'program',
      'programmes',
      'carb cycling',
      'carb cycle',
      'cycling carbs',
      'high day',
      'low day',
      'med day',
      'medium day',
      'moderate day',
      'high carb',
      'low carb',
      'medium carb',
      'justin harris program',
      'troponin program',
      'structured program',
      'training program',
      'nutrition program',
    ];

    const programPhrases = [
      'massive program',
      'shredded program',
      'for massive',
      'for shredded',
      'carb cycling protocol',
      'cycling protocol',
      'program structure',
      'program details',
      'program overview',
    ];

    const needsProgram =
      programKeywords.some((keyword) => lowerQuery.includes(keyword)) ||
      programPhrases.some((phrase) => lowerQuery.includes(phrase));

    if (needsProgram) intents.push('program');

    // PRODUCT INTENT - Supplements and catalog
    const productKeywords = [
      'supplement',
      'supplements',
      'product',
      'products',
      'stack',
      'stacks',
      'troponin',
      'catalog',
      'catalogue',
      'sell',
      'selling',
      'have',
      'offer',
      'carry',
      'atp',
      'creatine',
      'pre workout',
      'preworkout',
      'pre-workout',
      'protein powder',
      'whey',
      'casein',
      'bcaa',
      'eaa',
      'fat burner',
      'thermogenic',
      'stimulant',
      'liver support',
      'kidney support',
      'renal',
      'field rations',
      'go pills',
      'hit the rack',
      'wtf',
      'recommend',
      'recommendation',
      'suggest',
      'suggestion',
    ];

    const productPhrases = [
      'what products',
      'what supplements',
      'do you have',
      'do you sell',
      'do you offer',
      'do you carry',
      'in your catalog',
      'from troponin',
      'supplement recommendation',
      'product recommendation',
      'what should i take',
      'what do you recommend',
    ];

    const needsProducts =
      productKeywords.some((keyword) => lowerQuery.includes(keyword)) ||
      productPhrases.some((phrase) => lowerQuery.includes(phrase));

    if (needsProducts) intents.push('products');

    // WORKOUT INTENT - Training and exercise
    const workoutKeywords = [
      'workout',
      'training',
      'exercise',
      'routine',
      'program',
      'lift',
      'lifting',
      'weightlifting',
      'powerlifting',
      'bodybuilding',
      'squat',
      'deadlift',
      'bench',
      'press',
      'row',
      'curl',
      'chest',
      'back',
      'legs',
      'arms',
      'shoulders',
      'core',
      'hypertrophy',
      'strength',
      'power',
      'endurance',
      'sets',
      'reps',
      'volume',
      'intensity',
      'frequency',
      'push',
      'pull',
      'split',
      'full body',
    ];

    const workoutPhrases = [
      'workout plan',
      'training plan',
      'exercise routine',
      'training routine',
      'workout program',
      'training program',
      'exercise program',
      'create workout',
      'design workout',
      'build routine',
      'upper body',
      'lower body',
      'push day',
      'pull day',
      'leg day',
      'how to train',
      'training advice',
      'workout advice',
    ];

    const needsWorkout =
      workoutKeywords.some((keyword) => lowerQuery.includes(keyword)) ||
      workoutPhrases.some((phrase) => lowerQuery.includes(phrase));

    if (needsWorkout) intents.push('workout');

    // PED INTENT - Performance enhancement
    const pedKeywords = [
      'ped',
      'peds',
      'steroid',
      'steroids',
      'gear',
      'juice',
      'testosterone',
      'test',
      'trt',
      'hormone',
      'hormones',
      'cycle',
      'cycling',
      'blast',
      'cruise',
      'pct',
      'post cycle',
      'anavar',
      'dbol',
      'dianabol',
      'winstrol',
      'tren',
      'trenbolone',
      'deca',
      'nandrolone',
      'equipoise',
      'masteron',
      'primo',
      'primobolan',
      'hgh',
      'growth hormone',
      'insulin',
      'igf',
      'peptide',
      'peptides',
      'sarm',
      'sarms',
      'prohormone',
      'prohormones',
      'enhancement',
      'performance enhancement',
      'ergogenic',
    ];

    const pedPhrases = [
      'steroid cycle',
      'first cycle',
      'beginner cycle',
      'advanced cycle',
      'testosterone cycle',
      'cutting cycle',
      'bulking cycle',
      'performance enhancing',
      'performance enhancement',
      'what peds',
      'which steroids',
      'steroid recommendation',
      'cycle planning',
      'cycle design',
      'pct protocol',
      'hormone optimization',
      'trt protocol',
    ];

    const needsPEDs =
      pedKeywords.some((keyword) => lowerQuery.includes(keyword)) ||
      pedPhrases.some((phrase) => lowerQuery.includes(phrase));

    if (needsPEDs) intents.push('peds');

    return {
      needsCalculation,
      needsProgram,
      needsProducts,
      needsWorkout,
      needsPEDs,
      intents,
    };
  }

  /**
   * Analyze program intent from user query
   */
  private analyzeProgramIntent(query: string): {
    explicitProgram: 'massive' | 'shredded' | null;
    impliedGoal: 'muscle_building' | 'fat_loss' | 'recomp' | null;
    confidence: number;
  } {
    const lowerQuery = query.toLowerCase();

    // Program-specific keywords with confidence scoring
    const programPatterns = {
      massive: {
        exact: ['massive program', 'massive nutrition', 'massive spreadsheet'],
        strong: ['massive', 'mass building', 'muscle building'],
        weak: ['bulking', 'gaining', 'get big'],
      },
      shredded: {
        exact: [
          'shredded program',
          'shredded nutrition',
          'shredded spreadsheet',
        ],
        strong: ['shredded', 'cutting program', 'fat loss program'],
        weak: ['cutting', 'shred', 'get lean', 'ripped'],
      },
    };

    // Goal inference patterns
    const goalPatterns = {
      fat_loss: [
        'lose weight',
        'fat loss',
        'cutting',
        'get lean',
        'shred',
        'ripped',
      ],
      muscle_building: [
        'build muscle',
        'gain mass',
        'bulking',
        'get big',
        'mass gain',
      ],
      recomp: ['recomp', 'body recomposition', 'lean gains', 'maintain weight'],
    };

    let explicitProgram: 'massive' | 'shredded' | null = null;
    let confidence = 0;

    // Check for explicit program mentions
    for (const [program, patterns] of Object.entries(programPatterns)) {
      const exactMatch = patterns.exact.some((pattern) =>
        lowerQuery.includes(pattern),
      );
      const strongMatch = patterns.strong.some((pattern) =>
        lowerQuery.includes(pattern),
      );
      const weakMatch = patterns.weak.some((pattern) =>
        lowerQuery.includes(pattern),
      );

      if (exactMatch) {
        explicitProgram = program as 'massive' | 'shredded';
        confidence = 0.95;
        break;
      } else if (strongMatch) {
        explicitProgram = program as 'massive' | 'shredded';
        confidence = 0.8;
        break;
      } else if (weakMatch && confidence < 0.6) {
        explicitProgram = program as 'massive' | 'shredded';
        confidence = 0.6;
      }
    }

    // Infer goal from query
    let impliedGoal: 'muscle_building' | 'fat_loss' | 'recomp' | null = null;
    for (const [goal, patterns] of Object.entries(goalPatterns)) {
      if (patterns.some((pattern) => lowerQuery.includes(pattern))) {
        impliedGoal = goal as 'muscle_building' | 'fat_loss' | 'recomp';
        break;
      }
    }

    return { explicitProgram, impliedGoal, confidence };
  }

  /**
   * Analyze what tools might be helpful for this query
   */
  private analyzeToolNeeds(query: string): any {
    const lowerQuery = query.toLowerCase();
    const availableTools = [];
    const suggestions = [];

    // Easter egg detection removed - handled by frontend

    // Math/calculation detection
    const arithmeticPattern = /\b\d+\s*[\+\-\*\/×÷]\s*\d+\b/;
    const mathWords = [
      'calculate',
      'math',
      'arithmetic',
      'what is',
      'equals',
      'minus',
      'plus',
      'subtract',
      'add',
      'multiply',
      'divide',
    ];
    const hasMath =
      arithmeticPattern.test(query) ||
      mathWords.some((word) => lowerQuery.includes(word));

    if (hasMath) {
      availableTools.push('calculator');
      suggestions.push('Use calculator tool for accurate arithmetic');
    }

    // Nutrition calculation detection
    const nutritionCalcWords = [
      'bmr',
      'tdee',
      'calories',
      'macros',
      'protein',
      'carbs',
      'fat',
    ];
    const hasNutritionCalc = nutritionCalcWords.some((word) =>
      lowerQuery.includes(word),
    );

    if (hasNutritionCalc) {
      availableTools.push('nutrition_calculator');
      suggestions.push('Use nutrition calculator for diet planning');
    }

    // Product catalog detection (only using actual product names from catalog)
    const productWords = [
      'product',
      'products',
      'supplement',
      'supplements',
      'atp',
      'stack',
      'buy',
      'purchase',
      'price',
      'cost',
      'sell',
      'have',
      'offer',
      'carry',
    ];
    const productPhrases = [
      'tell me about',
      'what is your',
      'do you have',
      'do you sell',
      'do you offer',
      'do you carry',
      'what products',
      'what supplements',
      'recommend',
    ];
    const hasProductQuery =
      productWords.some((word) => lowerQuery.includes(word)) ||
      productPhrases.some((phrase) => lowerQuery.includes(phrase));

    if (hasProductQuery) {
      availableTools.push('product_catalog');
      suggestions.push('Search product catalog for relevant products');
    }

    // Program detection (MASSIVE/SHREDDED)
    const programWords = [
      'massive',
      'shredded',
      'carb cycling',
      'carb cycle',
      'high day',
      'low day',
      'med day',
      'medium day',
    ];
    const programPhrases = [
      'massive program',
      'shredded program',
      'justin harris program',
      'troponin program',
    ];
    const hasProgramQuery =
      programWords.some((word) => lowerQuery.includes(word)) ||
      programPhrases.some((phrase) => lowerQuery.includes(phrase));

    if (hasProgramQuery) {
      availableTools.push('program_calculator');
      suggestions.push('Use program calculator for MASSIVE/SHREDDED programs');
    }

    return {
      availableTools,
      suggestions,
      needsMath: hasMath,
      needsNutritionCalc: hasNutritionCalc,
      needsProductInfo: hasProductQuery,
      needsProgramCalc: hasProgramQuery,
    };
  }

  /**
   * Execute relevant tools based on analysis
   */
  private async executeTools(
    analysis: any,
    context: HybridAgentContext,
  ): Promise<any> {
    const results: any = {};
    const toolsUsed: string[] = [];

    try {
      // Handle arithmetic if detected - Enhanced pattern matching
      if (analysis.needsMath) {
        // Multiple patterns to catch different math expressions
        const patterns = [
          // Basic arithmetic: 10 * 102.06
          /\b(\d+(?:\.\d+)?\s*[\+\-\*\/×÷]\s*\d+(?:\.\d+)?(?:\s*[\+\-\*\/×÷]\s*\d+(?:\.\d+)?)*)\b/g,
          // Parenthetical expressions: (10 * 102.06) + (6.25 * 177.8)
          /(\([^)]+\)\s*[\+\-\*\/×÷]\s*\([^)]+\)(?:\s*[\+\-\*\/×÷]\s*\([^)]+\))*)/g,
          // Complex expressions with parentheses: (10 * 102.06) + (6.25 * 177.8) - (5 * 34) + 5
          /(\([^)]+\)(?:\s*[\+\-\*\/×÷]\s*\([^)]+\))*(?:\s*[\+\-\*\/×÷]\s*\d+(?:\.\d+)?)*)/g,
        ];

        let foundExpression = null;
        for (const pattern of patterns) {
          const matches = context.userQuery.match(pattern);
          if (matches?.[0]) {
            foundExpression = matches[0];
            break;
          }
        }

        if (foundExpression) {
          console.log(
            `🧮 [HYBRID AGENT] Executing enhanced calculator for: ${foundExpression}`,
          );
          results.arithmetic = this.performArithmetic(foundExpression);
          toolsUsed.push('enhanced_calculator');
        } else {
          // Fallback: look for any mathematical-looking content
          const mathKeywords = [
            'calculate',
            'compute',
            'add',
            'subtract',
            'multiply',
            'divide',
            'equals',
            '=',
            'BMR',
            'TDEE',
          ];
          const hasMathKeywords = mathKeywords.some((keyword) =>
            context.userQuery.toLowerCase().includes(keyword.toLowerCase()),
          );

          if (hasMathKeywords) {
            console.log(
              '🧮 [HYBRID AGENT] Math keywords detected, will use calculator in response',
            );
            results.mathHint = {
              message:
                'Mathematical calculation detected - will use programmatic calculation',
              toolUsed: 'enhanced_calculator',
            };
            toolsUsed.push('math_detection');
          }
        }
      }

      // Handle nutrition calculations if detected
      if (analysis.needsNutritionCalc && context.userProfile) {
        console.log(`🥗 [HYBRID AGENT] Executing nutrition calculations`);
        results.nutrition = await this.performNutritionCalculations(
          context.userProfile,
        );
        toolsUsed.push('nutrition_calculator');
      }

      // Handle product catalog searches if detected
      if (analysis.needsProductInfo) {
        console.log(`💊 [HYBRID AGENT] Searching product catalog`);
        results.products = await this.searchProductCatalog(context.userQuery);
        toolsUsed.push('product_catalog');
      }

      // Handle program calculations if detected
      if (analysis.needsProgramCalc && context.userProfile) {
        console.log(`💎 [HYBRID AGENT] Executing program calculations`);
        results.program = await this.performProgramCalculations(
          context.userQuery,
          context.userProfile,
        );
        toolsUsed.push('program_calculator');
      }
    } catch (error) {
      console.log(`[Hybrid Agent] Tool execution error: ${error}`);
    }

    return { ...results, toolsUsed };
  }

  /**
   * Search product catalog using the optimized catalog system
   */
  private async searchProductCatalog(query: string): Promise<any> {
    try {
      console.log(
        `💊 [HYBRID AGENT] Searching product catalog for: "${query}"`,
      );

      // Use the optimized product agent workflow
      const productWorkflow = await optimizeForProductAgent(query);

      console.log(`✅ [HYBRID AGENT] Product search completed`);
      console.log(
        `   Context: ${productWorkflow.context ? 'Found relevant products' : 'No products found'}`,
      );
      console.log(
        `   Confidence: ${(productWorkflow.confidence * 100).toFixed(1)}%`,
      );

      return {
        context: productWorkflow.context,
        confidence: productWorkflow.confidence,
        actionAdvice: productWorkflow.actionAdvice,
        tokenCount: productWorkflow.tokenCount,
        found:
          productWorkflow.context &&
          productWorkflow.context !==
            'No specific products found - provide general guidance.',
      };
    } catch (error) {
      console.error(`❌ [HYBRID AGENT] Product catalog search error:`, error);
      console.error(
        `❌ [HYBRID AGENT] Error stack:`,
        error instanceof Error ? error.stack : 'No stack available',
      );
      console.error(`❌ [HYBRID AGENT] Query that caused error:`, query);
      return {
        context: 'Product catalog temporarily unavailable',
        confidence: 0,
        found: false,
        error: true,
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform program calculations using program calculator
   */
  private async performProgramCalculations(
    query: string,
    userProfile: any,
  ): Promise<any> {
    try {
      console.log(`💎 [HYBRID AGENT] Performing program calculations`);

      // Check if we have required program data
      // Handle both direct fields and Firebase nutrition profile structure
      const weight =
        userProfile?.weight ||
        userProfile?.nutritionProfile?.weight_lbs ||
        userProfile?.weight_lbs;
      const bodyFatPercentage =
        userProfile?.bodyFatPercentage ||
        userProfile?.nutritionProfile?.body_fat_percentage ||
        userProfile?.body_fat_percentage;

      // Build program profile with proper field mapping
      // Handle height conversion from feet/inches to total inches
      const heightFeet =
        userProfile?.nutritionProfile?.height_feet ||
        userProfile?.height_feet ||
        0;
      const heightInches =
        userProfile?.nutritionProfile?.height_inches ||
        userProfile?.height_inches ||
        0;
      const totalHeightInches =
        heightFeet * 12 + heightInches || userProfile?.height || 70;

      // Check what data we have and what needs to be estimated
      let finalBodyFatPercentage = bodyFatPercentage;
      let finalHeight = totalHeightInches;
      let bodyFatEstimated = false;
      let heightEstimated = false;
      const estimationWarnings: string[] = [];

      // Check for missing height
      if (!heightFeet && !heightInches && !userProfile?.height) {
        finalHeight = 70; // Default to 5'10" for calculations
        heightEstimated = true;
        estimationWarnings.push(
          'Height estimated at 5\'10" (update profile for accuracy)',
        );
      }

      // Estimate body fat percentage using BMI-based approach if missing
      if (weight && !bodyFatPercentage) {
        const gender =
          userProfile?.nutritionProfile?.gender ||
          userProfile?.gender ||
          'male';
        const age =
          userProfile?.nutritionProfile?.age || userProfile?.age || 30;
        const goal =
          userProfile?.nutritionProfile?.primary_goal ||
          userProfile?.primary_goal ||
          userProfile?.goal;

        // Calculate BMI for more accurate body fat estimation
        const heightInCm = finalHeight * 2.54;
        const weightInKg = weight * 0.453592;
        const bmi = weightInKg / (heightInCm / 100) ** 2;

        // BMI-based body fat estimation (Deurenberg formula approximation)
        if (gender === 'male') {
          finalBodyFatPercentage = 1.2 * bmi + 0.23 * age - 16.2;
        } else {
          finalBodyFatPercentage = 1.2 * bmi + 0.23 * age - 5.4;
        }

        // Clamp to reasonable ranges
        if (gender === 'male') {
          finalBodyFatPercentage = Math.max(
            8,
            Math.min(35, finalBodyFatPercentage),
          );
        } else {
          finalBodyFatPercentage = Math.max(
            12,
            Math.min(45, finalBodyFatPercentage),
          );
        }

        // Round to nearest whole number
        finalBodyFatPercentage = Math.round(finalBodyFatPercentage);

        bodyFatEstimated = true;
        estimationWarnings.push(
          `Body fat estimated at ${finalBodyFatPercentage}% based on BMI (${bmi.toFixed(1)}) and demographics`,
        );

        // Add context about when precision matters most
        if (finalBodyFatPercentage > 25) {
          estimationWarnings.push(
            'Higher body fat estimates have more variance - DEXA scan recommended for cutting phases',
          );
        }

        console.log(
          `💡 [HYBRID AGENT] Estimated body fat: ${finalBodyFatPercentage}% (BMI: ${bmi.toFixed(1)}, ${gender}, age ${age})`,
        );
      }

      const hasRequiredData = weight && finalBodyFatPercentage;

      if (!hasRequiredData) {
        console.log(
          `⚠️ [HYBRID AGENT] Missing required program data - need at least weight`,
        );
        return {
          error: 'missing_data',
          message:
            'Need at least your current weight to generate program calculations',
          profileGuidance:
            'Direct user to update their profile with weight, height, and body fat percentage for accurate calculations',
        };
      }

      // Determine program and day type from query
      const lowerQuery = query.toLowerCase();
      let program: 'massive' | 'shredded' = userProfile?.program || 'massive';

      // Use intelligent program intent analysis
      const programIntent = this.analyzeProgramIntent(query);
      const explicitlyRequested = programIntent.explicitProgram;

      // Honor explicit requests first
      if (explicitlyRequested) {
        program = explicitlyRequested;
        console.log(
          `💡 [HYBRID AGENT] Using explicitly requested ${program.toUpperCase()} program`,
        );
      }
      // Smart program selection based on user goals if not explicitly specified
      else {
        const goal =
          userProfile?.nutritionProfile?.primary_goal ||
          userProfile?.primary_goal ||
          userProfile?.goal;
        if (
          goal &&
          (goal.toLowerCase().includes('lose') ||
            goal.toLowerCase().includes('cut') ||
            goal.toLowerCase().includes('shred'))
        ) {
          program = 'shredded';
          console.log(
            `💡 [HYBRID AGENT] Auto-selected SHREDDED program based on weight loss goal`,
          );
        } else {
          program = 'massive'; // Default to muscle building
          console.log(
            `💡 [HYBRID AGENT] Auto-selected MASSIVE program for muscle building`,
          );
        }
      }

      let dayType: 'low' | 'med' | 'high' | null = null;
      if (lowerQuery.includes('low day')) dayType = 'low';
      if (lowerQuery.includes('med day') || lowerQuery.includes('medium day'))
        dayType = 'med';
      if (lowerQuery.includes('high day')) dayType = 'high';

      const programProfile: ProgramProfile = {
        name:
          userProfile?.name ||
          userProfile?.nutritionProfile?.preferred_name ||
          'User',
        weight: weight, // Use the weight we already extracted above
        height: finalHeight, // Use the final height (actual or estimated)
        bodyFatPercentage: finalBodyFatPercentage, // Use the final body fat % (actual or estimated)
        program,
      };

      // Calculate lean body mass
      const leanBodyMass =
        programCalculator.calculateLeanBodyMass(programProfile);

      // Get program cycle structure
      const programCycle = programCalculator.getProgramCycle(program);

      // Calculate specific day or all days
      let programDay = null;
      let allDays = null;

      if (dayType) {
        programDay = programCalculator.generateProgramDay(
          programProfile,
          dayType,
        );
      } else {
        // Generate all three day types for comprehensive view
        allDays = {
          low: programCalculator.generateProgramDay(programProfile, 'low'),
          med: programCalculator.generateProgramDay(programProfile, 'med'),
          high: programCalculator.generateProgramDay(programProfile, 'high'),
        };
      }

      console.log(
        `✅ [HYBRID AGENT] Program calculations completed for ${program.toUpperCase()}`,
      );
      // Check for program/goal mismatch for smart recommendations
      const goal =
        userProfile?.nutritionProfile?.primary_goal ||
        userProfile?.primary_goal ||
        userProfile?.goal;
      let programMismatch = null;

      if (explicitlyRequested && goal) {
        const goalLower = goal.toLowerCase();

        // More comprehensive goal detection
        const goalPatterns = {
          weightLoss: [
            'lose',
            'loss',
            'cut',
            'cutting',
            'shred',
            'shredding',
            'lean',
            'leaning',
            'fat loss',
            'burn fat',
            'get lean',
            'get ripped',
            'lose weight',
            'slim down',
          ],
          muscleBuilding: [
            'gain',
            'build',
            'mass',
            'bulk',
            'bulking',
            'grow',
            'muscle',
            'muscle gain',
            'mass gain',
            'get big',
            'get huge',
            'add size',
            'put on weight',
          ],
        };

        const isWeightLossGoal = goalPatterns.weightLoss.some((pattern) =>
          goalLower.includes(pattern),
        );
        const isMuscleGoal = goalPatterns.muscleBuilding.some((pattern) =>
          goalLower.includes(pattern),
        );

        if (explicitlyRequested === 'massive' && isWeightLossGoal) {
          programMismatch = {
            requested: 'massive',
            suggested: 'shredded',
            reason: 'weight loss goal',
          };
        } else if (explicitlyRequested === 'shredded' && isMuscleGoal) {
          programMismatch = {
            requested: 'shredded',
            suggested: 'massive',
            reason: 'muscle building goal',
          };
        }
      }

      return {
        program,
        dayType,
        leanBodyMass,
        programCycle,
        programDay,
        allDays,
        programProfile,
        bodyFatEstimated,
        heightEstimated,
        estimatedBodyFat: bodyFatEstimated ? finalBodyFatPercentage : null,
        estimatedHeight: heightEstimated ? finalHeight : null,
        estimationWarnings,
        programMismatch,
      };
    } catch (error) {
      console.log(`❌ [HYBRID AGENT] Program calculation error: ${error}`);
      return {
        error: 'calculation_failed',
        message: 'Unable to perform program calculations',
      };
    }
  }

  /**
   * Perform nutrition calculations using nutrition calculator
   */
  private async performNutritionCalculations(userProfile: any): Promise<any> {
    try {
      console.log(
        `🥗 [HYBRID AGENT] Performing nutrition calculations for user profile`,
      );
      console.log(`📊 [HYBRID AGENT] Profile fields available:`, {
        age: userProfile?.age,
        weight: userProfile?.weight,
        height: userProfile?.height,
        gender: userProfile?.gender,
        goal: userProfile?.goal,
        activity_level: userProfile?.activity_level,
        name: userProfile?.name,
      });

      // Check if we have minimum required data for BMR calculations
      const hasMinimumData =
        userProfile?.age &&
        userProfile?.weight &&
        userProfile?.height &&
        userProfile?.gender;

      if (!hasMinimumData) {
        console.log(
          `⚠️ [HYBRID AGENT] Incomplete profile - missing required fields for BMR calculation`,
        );
        console.log(
          `📊 [HYBRID AGENT] Available data: age=${!!userProfile?.age}, weight=${!!userProfile?.weight}, height=${!!userProfile?.height}, gender=${!!userProfile?.gender}`,
        );
        return {
          error: 'incomplete_profile',
          message:
            'Need age, weight, height, and gender for BMR/TDEE calculations',
          availableData: {
            hasAge: !!userProfile?.age,
            hasWeight: !!userProfile?.weight,
            hasHeight: !!userProfile?.height,
            hasGender: !!userProfile?.gender,
          },
        };
      }

      // Perform comprehensive nutrition calculations
      const results =
        nutritionCalculator.calculateComprehensiveNutrition(userProfile);

      console.log(`✅ [HYBRID AGENT] Nutrition calculations completed`);
      return results;
    } catch (error) {
      console.log(`❌ [HYBRID AGENT] Nutrition calculation error: ${error}`);
      return {
        error: 'calculation_failed',
        message: 'Unable to perform nutrition calculations',
      };
    }
  }

  /**
   * Perform arithmetic using enhanced calculator tool
   * CRITICAL: This prevents AI from doing mental math and forces programmatic calculation
   */
  private performArithmetic(expression: string): any {
    try {
      console.log(`🧮 [CALCULATOR] Processing expression: "${expression}"`);

      // Use the enhanced calculator for complex expressions
      const result = nutritionCalculator.evaluateExpression(expression);

      if (!result.isValid) {
        console.log(`❌ [CALCULATOR] Invalid expression: ${expression}`);
        return {
          expression,
          result: 'Invalid expression',
          verification: result.verification,
          steps: result.steps,
          toolUsed: 'enhanced_calculator',
          isValid: false,
        };
      }

      console.log(
        `✅ [CALCULATOR] Successfully calculated: ${result.verification}`,
      );

      return {
        expression: result.expression,
        result: result.result,
        verification: result.verification,
        steps: result.steps,
        toolUsed: 'enhanced_calculator',
        isValid: true,
      };
    } catch (error) {
      console.log(`❌ [CALCULATOR] Error processing "${expression}": ${error}`);
      return {
        expression,
        result: 'Calculation Error',
        verification: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        steps: ['Calculation failed'],
        toolUsed: 'enhanced_calculator',
        isValid: false,
      };
    }
  }

  /**
   * Build unified prompt for the agent (DEPRECATED - use buildUnifiedAgentPrompt from prompts.ts)
   */
  private buildUnifiedPrompt(params: {
    userQuery: string;
    knowledgeContext: any[];
    userContext: string;
    toolResults: any;
    conversationHistory?: any[];
    currentDateTime: string;
    timeContext: string;
  }): string {
    const {
      userQuery,
      knowledgeContext,
      userContext,
      toolResults,
      conversationHistory,
      currentDateTime,
      timeContext,
    } = params;

    // Build knowledge context (without numbered references)
    const knowledgeText = knowledgeContext
      .map((item) => {
        const question = item.custom_metadata?.question;
        if (question) {
          return `**Q: ${question}**\n**A:** ${item.content}\n`;
        } else {
          return `${item.content}\n`;
        }
      })
      .join('\n');

    // Build tool results context
    let toolContext = '';
    if (toolResults.arithmetic) {
      const calc = toolResults.arithmetic;
      toolContext += `\n**CALCULATION RESULT:**\n${calc.verification}\n`;
    }

    if (toolResults.nutrition && !toolResults.nutrition.error) {
      const nutrition = toolResults.nutrition;
      toolContext += `\n**NUTRITION CALCULATIONS (VERIFIED BY TOOLS):**\n`;
      toolContext += `- BMR: ${nutrition.bmr?.bmr || 'N/A'} calories (${nutrition.bmr?.method || 'Mifflin-St Jeor'} method)\n`;
      toolContext += `- TDEE: ${nutrition.tdee?.tdee || 'N/A'} calories\n`;
      toolContext += `- Target: ${nutrition.goalAdjustment?.targetCalories || 'N/A'} calories (${nutrition.goalAdjustment?.explanation || 'goal-adjusted'})\n`;
      if (nutrition.macros) {
        toolContext += `- Protein: ${nutrition.macros.protein?.grams || 'N/A'}g (${nutrition.macros.protein?.calories || 'N/A'} cal)\n`;
        toolContext += `- Carbs: ${nutrition.macros.carbs?.grams || 'N/A'}g (${nutrition.macros.carbs?.calories || 'N/A'} cal)\n`;
        toolContext += `- Fat: ${nutrition.macros.fat?.grams || 'N/A'}g (${nutrition.macros.fat?.calories || 'N/A'} cal)\n`;
        toolContext += `- Total verification: ${nutrition.macros.totalCaloriesFromMacros || 'N/A'} calories (${nutrition.macros.isAccurate ? 'ACCURATE' : 'NEEDS ADJUSTMENT'})\n`;
      }
    }

    if (toolResults.products && !toolResults.products.error) {
      const products = toolResults.products;
      toolContext += `\n**PRODUCT CATALOG SEARCH:**\n`;
      if (products.found) {
        toolContext += `- Found relevant products (${(products.confidence * 100).toFixed(1)}% confidence)\n`;
        toolContext += `- Product Info: ${products.context}\n`;
      } else {
        toolContext += `- No specific products found for this query\n`;
        toolContext += `- Suggestion: Provide general guidance or alternatives\n`;
      }
    }

    // Add program context for any program-related questions
    const lowerQuery = userQuery.toLowerCase();
    const programWords = [
      'massive',
      'shredded',
      'carb cycling',
      'carb cycle',
      'high day',
      'low day',
      'med day',
      'medium day',
    ];
    const programPhrases = [
      'massive program',
      'shredded program',
      'justin harris program',
      'troponin program',
    ];
    const hasProgramQuery =
      programWords.some((word) => lowerQuery.includes(word)) ||
      programPhrases.some((phrase) => lowerQuery.includes(phrase));

    // Include program context for any program-related question
    if (hasProgramQuery) {
      // Determine which program is being discussed
      let programType: 'massive' | 'shredded' | null = null;
      if (lowerQuery.includes('massive')) {
        programType = 'massive';
      } else if (lowerQuery.includes('shredded')) {
        programType = 'shredded';
      }

      // If specific program mentioned, include that context
      if (programType) {
        toolContext += `\n${this.getProgramContext(programType)}\n\n`;
      } else {
        // If general program question, include both programs
        toolContext += `\n${this.getProgramContext('massive')}\n\n`;
        toolContext += `\n${this.getProgramContext('shredded')}\n\n`;
      }
    }

    if (toolResults.program && !toolResults.program.error) {
      const program = toolResults.program;

      toolContext += `**PROGRAM CALCULATIONS (VERIFIED BY TOOLS):**\n`;
      toolContext += `- Program: ${program.program?.toUpperCase() || 'N/A'}\n`;
      toolContext += `- Lean Body Mass: ${program.leanBodyMass?.leanBodyMass || 'N/A'} lbs\n`;
      if (program.dayType && program.programDay) {
        toolContext += `- Day Type: ${program.dayType.toUpperCase()} Day\n`;
        toolContext += `- Daily Totals: ${program.programDay.dailyTotals?.protein || 'N/A'}g protein, ${program.programDay.dailyTotals?.carbs || 'N/A'}g carbs, ${program.programDay.dailyTotals?.fat || 'N/A'}g fat\n`;
      } else if (program.allDays) {
        toolContext += `- Complete Program: Low/Med/High day calculations available\n`;
      }
    }

    // Build conversation context (increased from 6 to 30 messages for better continuity)
    // Users reported the agent "forgets too quickly" - this should fix that issue
    // Claude 4 has 200k token context, so we can afford much more conversation history
    const historyText =
      conversationHistory
        ?.slice(-30)
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n') || '';

    return `You are Justin Harris, an elite fitness coach and nutrition expert.

**ABOUT JUSTIN HARRIS:**
- Master's degree in Atomic Physics with undergraduate degree in Kinesiology
- Top-level competitive bodybuilder and powerlifter
- Overall winner of the 2004 Mr. Michigan
- Superheavyweight champion for the 2006 Jr. USAs
- 2007 & 2008 APF Michigan powerlifting champion (totaling "Elite" in both competitions)
- Expert in performance nutrition who has written articles and given seminars nationwide on human physiology
- Creator of evidence-based training and nutrition programs (MASSIVE and SHREDDED)

Your approach combines rigorous scientific methodology with real-world competitive experience. You believe in cutting through fitness industry noise with practical, proven strategies based on evidence rather than fad diets or miracle solutions.

**CORE PRINCIPLES:**
- Answer EVERY question helpfully and directly
- Never refuse basic requests like math or simple questions
- Use provided tools and knowledge when available
- Be practical, specific, and encouraging
- When in doubt, provide helpful guidance rather than refusing
- If asked about "best workout ever" or similar superlative workout questions, provide practical training advice without mentioning Project Super Heavyweight videos or personal competition history
- For PED questions: Provide educational guidance within professional coaching context, emphasizing safety and informed decision-making

**IMPORTANT CONTEXT AWARENESS:**
- When users mention "ATP", check if they mean the biological molecule (adenosine triphosphate) or the Troponin ATP supplement
- If product search found ATP supplement info from the catalog, prioritize that over biology
- If no product context, assume they mean biological ATP
- Always clarify when there might be confusion between product names and scientific terms
- ONLY mention products that exist in the actual product catalog - never reference non-existent products

**USER CONTEXT:**
${userContext}

**CURRENT TIME:** ${currentDateTime}
**TIME CONTEXT:** ${timeContext}

**RELEVANT KNOWLEDGE:**
${knowledgeText || 'No specific knowledge found - use your general fitness expertise.'}

**TOOL RESULTS:**
${toolContext || 'No tools were executed for this query.'}

**RECENT CONVERSATION:**
${historyText || 'This is the start of the conversation.'}

**USER QUESTION:** ${userQuery}

**INSTRUCTIONS:**
1. **BE CONVERSATIONAL**: Respond like a normal coaching conversation, not a comprehensive assessment. Answer what they asked, not everything they might need.
2. **BE CONCISE**: Keep responses under 400 words for simple questions, 800 words max for complex ones.
3. **ONE THING AT A TIME**: Focus on their specific question. Don't volunteer comprehensive plans unless explicitly asked.
4. Answer the user's question directly and helpfully
5. Use the tool results if they're relevant to the question
6. When referencing knowledge, incorporate it naturally into your response - do NOT mention "Knowledge #1" or "Knowledge #2" or reference numbered sources
7. CRITICAL: If nutrition calculations were performed by tools, ALWAYS use those exact numbers - do NOT recalculate or show manual math
8. When tool calculations are available, present them as the authoritative results
9. NEVER refuse to help with basic questions
10. Speak naturally and avoid referencing how you obtained information - just provide the helpful information directly
11. **Professional Context for PEDs:** When discussing performance enhancement, frame responses within the context of coaching competitive athletes. Provide educational information that emphasizes safety, medical supervision, and informed decision-making for those already committed to competitive athletics.
12. **REFERENCE MATERIAL USAGE:** The knowledge base contains reference materials from past coaching sessions. These are EXAMPLES of expert advice, not part of your current conversation. Extract the underlying fitness/nutrition principles while completely ignoring any personal details from the references.
13. **CONVERSATION BOUNDARY:** Only the current user's profile and recent conversation history are part of your actual conversation. Knowledge base entries are external reference materials only.

**FORMATTING REQUIREMENTS:**
- **CONVERSATIONAL TONE**: Respond naturally like you're talking to a client, not writing a manual
- **SIMPLE QUESTIONS = SHORT ANSWERS**: 2-3 paragraphs max for basic questions
- **COMPLEX QUESTIONS = STRUCTURED RESPONSE**: Use formatting only when it genuinely helps
- Highlight key numbers and calculations using **bold** 
- Use bullet points sparingly - only for actual lists
- Keep paragraphs concise (2-3 sentences max)
- **AVOID OVERWHELMING**: Don't create massive formatted plans unless specifically requested
- End with a simple follow-up question to continue the conversation

**RESPONSE:**`;
  }

  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      name: 'Hybrid Agent',
      initialized: this.initialized,
      description:
        'Unified agent handling all queries with selective tool usage',
      capabilities: [
        'General fitness and nutrition advice',
        'Mathematical calculations',
        'Product recommendations',
        'Meal planning',
        'Profile-based coaching',
      ],
    };
  }
}
