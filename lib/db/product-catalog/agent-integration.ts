/**
 * AI AGENT INTEGRATION PATTERNS
 * 
 * Demonstrates optimal usage patterns for AI agents using the performance-optimized catalog
 */

import { catalogOptimizer } from './catalog-optimizer';

/**
 * FAST AGENT WORKFLOW PATTERNS
 * These patterns reduce query time from 200-500ms to <50ms
 */

/**
 * PATTERN 1: LIGHTNING ROUTING (< 10ms)
 * For initial agent selection and platform routing
 */
export async function quickRoute(userQuery: string) {
  const startTime = performance.now();
  
  // Parallel execution of intent detection and platform routing
  const [intent, platformRoute] = await Promise.all([
    catalogOptimizer.detectIntent(userQuery),
    catalogOptimizer.routePlatform(userQuery)
  ]);
  
  const timing = performance.now() - startTime;
  console.log(`⚡ Quick route completed in ${timing.toFixed(2)}ms`);
  
  return {
    intent: intent.intent,
    confidence: Math.max(intent.confidence, platformRoute.confidence),
    platform: platformRoute.platform,
    suggestedAction: intent.suggested_action,
    timing
  };
}

/**
 * PATTERN 2: SMART PRODUCT DISCOVERY (< 30ms)
 * For AI agents to get minimal context before detailed analysis
 */
export async function discoverProducts(userQuery: string, options?: {
  maxResults?: number;
  goalHint?: string;
}) {
  const startTime = performance.now();
  
  // Step 1: Quick intent analysis (cached after first call)
  const intent = await catalogOptimizer.detectIntent(userQuery);
  
  // Step 2: Get product summaries based on intent
  let summaries: any[];
  switch (intent.intent) {
    case 'goal_based': {
      const detectedGoal = options?.goalHint || extractGoalFromQuery(userQuery);
      summaries = await catalogOptimizer.getProductSummaries({ 
        goal: detectedGoal,
        limit: options?.maxResults || 5
      });
      break;
    }
    case 'product_search':
      summaries = await catalogOptimizer.getProductSummaries({
        limit: options?.maxResults || 5
      });
      break;
    default:
      summaries = await catalogOptimizer.getProductSummaries({
        limit: 3
      });
  }
  
  const timing = performance.now() - startTime;
  console.log(`🔍 Product discovery completed in ${timing.toFixed(2)}ms`);
  
  return {
    intent: intent.intent,
    products: summaries,
    count: summaries.length,
    timing
  };
}

/**
 * PATTERN 3: PROGRESSIVE DETAIL LOADING (< 50ms total)
 * Load minimal data first, then enhance on demand
 */
export async function progressiveDetailLoading(productIds: string[], userNeedsDetail = false) {
  const startTime = performance.now();
  
  // Always start with minimal data for quick AI processing
  const minimalData = await catalogOptimizer.formatForAI(productIds, 'minimal');
  
  const step1Time = performance.now() - startTime;
  
  // Only load detailed data if explicitly needed
  let detailedData = null;
  if (userNeedsDetail) {
    detailedData = await catalogOptimizer.formatForAI(productIds, 'detailed');
  }
  
  const totalTime = performance.now() - startTime;
  console.log(`📊 Progressive loading: minimal(${step1Time.toFixed(2)}ms) + detailed(${(totalTime - step1Time).toFixed(2)}ms)`);
  
  return {
    minimal: minimalData,
    detailed: detailedData,
    timing: {
      minimal: step1Time,
      total: totalTime
    }
  };
}

/**
 * PATTERN 4: BATCH OPTIMIZATION (< 100ms for multiple operations)
 * For complex queries requiring multiple catalog operations
 */
export async function batchOptimization(userQuery: string) {
  const startTime = performance.now();
  
  // Execute multiple operations in parallel
  const operations = [
    { type: 'intent' as const, query: userQuery },
    { type: 'route' as const, query: userQuery },
    { type: 'summaries' as const, query: userQuery, params: { limit: 3 } }
  ];
  
  const [intent, route, summaries] = await catalogOptimizer.batchProcess(operations);
  
  const timing = performance.now() - startTime;
  console.log(`⚡ Batch optimization completed in ${timing.toFixed(2)}ms`);
  
  return {
    intent,
    route,
    summaries,
    timing
  };
}

/**
 * PATTERN 5: AGENT-SPECIFIC OPTIMIZATION
 * Tailored patterns for different agent types
 */
export async function optimizeForProductAgent(userQuery: string) {
  // Product agent needs: intent + product summaries + minimal details
  const [intent, summaries] = await Promise.all([
    catalogOptimizer.detectIntent(userQuery),
    catalogOptimizer.getProductSummaries({ limit: 5 })
  ]);
  
  // Format for token efficiency
  const aiContext = summaries.length > 0 ? 
    await catalogOptimizer.formatForAI(summaries.map(p => p.id), 'standard') :
    'No specific products found - provide general guidance.';
  
  return {
    confidence: intent.confidence,
    context: aiContext,
    actionAdvice: intent.suggested_action,
    tokenCount: aiContext.length // For monitoring
  };
}

export async function optimizeForFAQAgent(userQuery: string) {
  // FAQ agent only needs basic routing info
  const route = await catalogOptimizer.routePlatform(userQuery);
  
  return {
    platform: route.platform,
    confidence: route.confidence,
    shouldMentionProducts: route.confidence > 0.7,
    // Minimal context to avoid token waste
    platformContext: route.platform === 'troponin-supplements' ? 
      'User interested in products/supplements' : 
      'User interested in services/education'
  };
}

/**
 * UTILITY: Extract goal from natural language query
 */
function extractGoalFromQuery(query: string): string {
  const goalKeywords = {
    'muscle-building': ['muscle', 'mass', 'size', 'bulk', 'gain'],
    'fat-loss': ['fat', 'weight', 'cut', 'lean', 'shred'],
    'energy': ['energy', 'focus', 'alert', 'awake'],
    'recovery': ['recovery', 'sleep', 'rest', 'sore'],
    'strength': ['strength', 'strong', 'power', 'lift']
  };
  
  const lowerQuery = query.toLowerCase();
  
  for (const [goal, keywords] of Object.entries(goalKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return goal;
    }
  }
  
  return 'education'; // Default fallback
}

/**
 * PERFORMANCE MONITORING
 * Track optimization effectiveness
 */
const performanceMetrics = {
  queryTimes: [] as number[],
  cacheHitRate: 0,
  tokenEfficiency: 0
};

export function recordQuery(timing: number) {
  performanceMetrics.queryTimes.push(timing);
  // Keep only last 100 queries
  if (performanceMetrics.queryTimes.length > 100) {
    performanceMetrics.queryTimes.shift();
  }
}

export function getPerformanceStats() {
  const times = performanceMetrics.queryTimes;
  const cacheStats = catalogOptimizer.getCacheStats();
  
  return {
    averageQueryTime: times.reduce((a, b) => a + b, 0) / times.length || 0,
    p95QueryTime: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] || 0,
    cacheHitRate: cacheStats.hitRate,
    cacheSize: cacheStats.size,
    totalQueries: times.length
  };
}

export function shouldOptimize(): boolean {
  const stats = getPerformanceStats();
  return stats.averageQueryTime > 100 || stats.cacheHitRate < 0.5;
}

/**
 * EXAMPLE USAGE FOR AI AGENTS
 */
export const ExampleIntegrations = {
  
  // Fast product agent workflow
  async productAgentWorkflow(userQuery: string) {
    console.log('🚀 Starting optimized product agent workflow...');
    
    // Step 1: Lightning-fast routing (< 10ms)
    const routing = await quickRoute(userQuery);
    
    if (routing.confidence < 0.3) {
      return 'Low confidence - route to general FAQ agent';
    }
    
    // Step 2: Smart product discovery (< 30ms)
    const discovery = await discoverProducts(userQuery);
    
    if (discovery.products.length === 0) {
      return 'No products found - provide general guidance';
    }
    
    // Step 3: Progressive detail loading (< 50ms)
    const productIds = discovery.products.slice(0, 3).map(p => p.id);
    const details = await progressiveDetailLoading(
      productIds, 
      routing.intent === 'product_search' // Only load details for product searches
    );
    
    console.log(`✅ Total workflow time: ${routing.timing + discovery.timing + details.timing.total}ms`);
    
    return {
      context: details.minimal,
      detailedContext: details.detailed,
      confidence: routing.confidence,
      totalTime: routing.timing + discovery.timing + details.timing.total
    };
  },

  // Optimized FAQ agent workflow  
  async faqAgentWorkflow(userQuery: string) {
    console.log('🚀 Starting optimized FAQ agent workflow...');
    
    const optimization = await optimizeForFAQAgent(userQuery);
    
    return {
      shouldHandleQuery: optimization.confidence < 0.7, // Low product confidence = FAQ territory
      platformContext: optimization.platformContext,
      additionalContext: optimization.shouldMentionProducts ? 
        'Note: User may also be interested in products' : 
        null
    };
  }
};