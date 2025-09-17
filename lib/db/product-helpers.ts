import catalogIndex from './product-catalog/product-catalog-index.json';
import supplements from './product-catalog/supplements.json';
import stacks from './product-catalog/stacks.json';
import booksPrograms from './product-catalog/books-programs.json';
import quickRef from './product-catalog/products-quick-ref.json';

export type Platform = 'troponin-nutrition' | 'troponin-supplements';

export type Product = {
  id: string;
  name: string;
  category: string;
  type: 'supplement' | 'stack' | 'book' | 'program';
  availableOn: Platform[];
  description: string;
  keyBenefits?: string[];
  tags: string[];
  websiteUrl?: string;
  // ... other fields vary by type
};

export type ProductStack = Product & {
  type: 'stack';
  subtitle?: string;
  availability?: {
    status: string;
    message: string;
  };
  components: Array<{
    productId: string;
    quantity: number;
    role?: string;
  }>;
  stackBenefits: string[];
};

/**
 * AI ROUTING FUNCTIONS
 * Optimized for AI agent decision-making with modular data loading
 */

/**
 * Determine which platform to recommend based on user query/intent
 */
export function determinePlatformRecommendation(userQuery: string): {
  recommendedPlatform: Platform;
  confidence: number;
  reasoning: string;
} {
  const query = userQuery.toLowerCase();
  
  // Check for coaching-related keywords
  const coachingKeywords = catalogIndex.routingLogic['troponin-nutrition'].keywords;
  const coachingMatches = coachingKeywords.filter(keyword => query.includes(keyword)).length;
  
  // Check for product shopping keywords
  const shoppingKeywords = catalogIndex.routingLogic['troponin-supplements'].keywords;
  const shoppingMatches = shoppingKeywords.filter(keyword => query.includes(keyword)).length;
  
  // Check for supplement stack specific keywords using quick reference
  const stackKeywordMatches = ['stack', 'bundle', 'combo', 'combination'].filter(keyword => 
    query.includes(keyword)
  ).length;
  
  if (coachingMatches > 0) {
    return {
      recommendedPlatform: 'troponin-nutrition',
      confidence: Math.min(coachingMatches * 0.3, 1.0),
      reasoning: 'User query indicates need for coaching or personalized services'
    };
  }
  
  if (stackKeywordMatches > 0) {
    return {
      recommendedPlatform: 'troponin-supplements',
      confidence: Math.min(stackKeywordMatches * 0.4, 1.0),
      reasoning: 'User query indicates interest in supplement stacks/bundles'
    };
  }
  
  if (shoppingMatches > 0) {
    return {
      recommendedPlatform: 'troponin-supplements',
      confidence: Math.min(shoppingMatches * 0.25, 0.7),
      reasoning: 'User query indicates product shopping intent'
    };
  }
  
  // Default recommendation
  return {
    recommendedPlatform: 'troponin-nutrition',
    confidence: 0.1,
    reasoning: 'No clear platform indicators - defaulting to full-service platform'
  };
}

/**
 * Get platform information for AI routing
 */
export function getPlatformInfo(platform: Platform) {
  return catalogIndex.platforms[platform];
}

/**
 * Get all platforms with their key differences
 */
export function getPlatformComparison() {
  const nutrition = catalogIndex.platforms['troponin-nutrition'];
  const supplementsPlatform = catalogIndex.platforms['troponin-supplements'];
  
  return {
    nutrition: {
      ...nutrition,
      keyDifferences: [
        'Offers personal coaching and consultations',
        'Custom meal and training plans available',
        'Professional services and guidance',
        'Educational content and courses'
      ]
    },
    supplements: {
      ...supplementsPlatform,
      keyDifferences: [
        'Supplement stacks/bundles exclusive to this platform',
        'E-commerce focused for supplement shopping',
        'No coaching or consultation services',
        'Individual supplements available'
      ]
    }
  };
}

/**
 * PRODUCT QUERY FUNCTIONS - Updated for modular structure
 */

/**
 * Get all products (supplements, stacks, books, programs)
 */
export function getAllProducts(): Product[] {
  const allProducts: Product[] = [
    ...supplements.products as Product[],
    ...stacks.products as Product[],
    ...booksPrograms.books as Product[],
    ...booksPrograms.programs as Product[]
  ];
  return allProducts;
}

/**
 * Get products available on a specific platform
 */
export function getProductsByPlatform(platform: Platform): Product[] {
  return getAllProducts().filter(p => 
    p.availableOn.includes(platform)
  );
}

/**
 * Get individual supplements only (excludes stacks, books, programs)
 */
export function getIndividualProducts(): Product[] {
  return supplements.products as Product[];
}

/**
 * Get supplement stacks only (exclusive to troponin-supplements)
 */
export function getProductStacks(): ProductStack[] {
  return stacks.products as ProductStack[];
}

/**
 * Get books and programs (educational content)
 */
export function getBooksAndPrograms() {
  return {
    books: booksPrograms.books as Product[],
    programs: booksPrograms.programs as Product[]
  };
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): Product[] {
  return getAllProducts().filter(p => p.category === category);
}

/**
 * Get a product by ID (searches across all product types)
 */
export function getProductById(id: string): Product | null {
  const allProducts = getAllProducts();
  const product = allProducts.find(p => p.id === id);
  return product || null;
}

/**
 * Get detailed stack information with component product details
 */
export function getStackWithComponents(stackId: string) {
  const stack = stacks.products.find(p => p.id === stackId) as ProductStack | undefined;
  
  if (!stack) return null;

  // Get full details for each component product
  const componentsWithDetails = stack.components.map(component => {
    const product = getProductById(component.productId);
    return {
      ...component,
      product: product
    };
  });

  return {
    ...stack,
    componentsWithDetails
  };
}

/**
 * Search products by term using the unified search across all product types
 */
export function searchProducts(searchTerm: string, options?: {
  includeStacks?: boolean;
  includeIndividual?: boolean;
  includeBooks?: boolean;
  includePrograms?: boolean;
  platform?: Platform;
}): Product[] {
  const { 
    includeStacks = true, 
    includeIndividual = true, 
    includeBooks = true,
    includePrograms = true,
    platform 
  } = options || {};
  
  let productsToSearch: Product[] = [];
  
  if (includeIndividual) {
    productsToSearch.push(...supplements.products as Product[]);
  }
  if (includeStacks) {
    productsToSearch.push(...stacks.products as Product[]);
  }
  if (includeBooks) {
    productsToSearch.push(...booksPrograms.books as Product[]);
  }
  if (includePrograms) {
    productsToSearch.push(...booksPrograms.programs as Product[]);
  }
  
  // Filter by platform if specified
  if (platform) {
    productsToSearch = productsToSearch.filter(p => p.availableOn.includes(platform));
  }

  const lowercaseSearch = searchTerm.toLowerCase();
  
  return productsToSearch.filter(product => {
    // Search in name, description, tags, and benefits
    const searchableText = [
      product.name,
      product.description,
      ...(product.tags || []),
      ...(product.keyBenefits || []),
      ...(product.type === 'stack' ? (product as ProductStack).stackBenefits || [] : [])
    ].join(' ').toLowerCase();
    
    return searchableText.includes(lowercaseSearch);
  });
}

/**
 * QUICK REFERENCE FUNCTIONS - Using the optimized quick-ref file
 */

/**
 * Get products by goal using the quick reference mapping
 */
export function getProductsByGoal(goal: string): {
  products: Product[];
  stacks: ProductStack[];
  description: string;
} {
  const goalData = quickRef.byGoal[goal as keyof typeof quickRef.byGoal];
  
  if (!goalData) {
    return { products: [], stacks: [], description: 'Goal not found' };
  }

  const products = goalData.products.map(id => getProductById(id)).filter(Boolean) as Product[];
  const stacksForGoal = goalData.stacks.map(id => getProductById(id)).filter(Boolean) as ProductStack[];

  return {
    products,
    stacks: stacksForGoal,
    description: goalData.description
  };
}

/**
 * Get products by category using quick reference
 */
export function getProductsByQuickCategory(category: string): Product[] {
  const categoryData = quickRef.byCategory[category as keyof typeof quickRef.byCategory];
  
  if (!categoryData) return [];
  
  const allIds: string[] = [
    ...('products' in categoryData ? categoryData.products : []),
    ...('books' in categoryData ? categoryData.books : []),
    ...('programs' in categoryData ? categoryData.programs : [])
  ];
  
  return allIds.map((id: string) => getProductById(id)).filter(Boolean) as Product[];
}

/**
 * Get popular stacks with details
 */
export function getPopularStacks() {
  return quickRef.popularStacks.items.map(stackInfo => ({
    ...stackInfo,
    product: getProductById(stackInfo.id) as ProductStack
  }));
}

/**
 * AI RECOMMENDATION FUNCTIONS - Enhanced with quick reference
 */

/**
 * Get product recommendations based on user query and preferred platform
 */
export function getRecommendedProducts(userQuery: string, options?: {
  maxResults?: number;
  preferredPlatform?: Platform;
}) {
  const { maxResults = 5, preferredPlatform } = options || {};
  
  // Determine best platform if not specified
  const platformRecommendation = preferredPlatform 
    ? { recommendedPlatform: preferredPlatform, confidence: 1.0, reasoning: 'User specified' }
    : determinePlatformRecommendation(userQuery);
  
  // Search products on recommended platform
  const products = searchProducts(userQuery, { 
    platform: platformRecommendation.recommendedPlatform 
  }).slice(0, maxResults);
  
  return {
    platformRecommendation,
    products,
    alternativePlatform: platformRecommendation.recommendedPlatform === 'troponin-nutrition' 
      ? 'troponin-supplements' 
      : 'troponin-nutrition'
  };
}

/**
 * Get smart recommendations by detecting user goals
 */
export function getSmartRecommendations(userQuery: string): {
  detectedGoals: string[];
  recommendedProducts: Product[];
  recommendedStacks: ProductStack[];
  platform: Platform;
} {
  const query = userQuery.toLowerCase();
  const detectedGoals: string[] = [];
  
  // Goal detection based on keywords
  Object.keys(quickRef.byGoal).forEach(goal => {
    const goalKeywords = [goal.replace('-', ' '), goal];
    if (goalKeywords.some(keyword => query.includes(keyword))) {
      detectedGoals.push(goal);
    }
  });
  
  // If no specific goals detected, try broader keyword matching
  if (detectedGoals.length === 0) {
    if (query.includes('energy') || query.includes('focus')) detectedGoals.push('energy');
    if (query.includes('recovery') || query.includes('sleep')) detectedGoals.push('recovery');
    if (query.includes('muscle') || query.includes('strength')) detectedGoals.push('muscle-building');
    if (query.includes('fat') || query.includes('weight')) detectedGoals.push('fat-loss');
  }
  
  let allRecommendedProducts: Product[] = [];
  let allRecommendedStacks: ProductStack[] = [];
  
  // Get products for detected goals
  detectedGoals.forEach(goal => {
    const goalProducts = getProductsByGoal(goal);
    allRecommendedProducts.push(...goalProducts.products);
    allRecommendedStacks.push(...goalProducts.stacks);
  });
  
  // Remove duplicates
  allRecommendedProducts = Array.from(new Set(allRecommendedProducts.map(p => p.id)))
    .map(id => allRecommendedProducts.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  allRecommendedStacks = Array.from(new Set(allRecommendedStacks.map(s => s.id)))
    .map(id => allRecommendedStacks.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  
  // Determine best platform
  const platform = determinePlatformRecommendation(userQuery).recommendedPlatform;
  
  return {
    detectedGoals,
    recommendedProducts: allRecommendedProducts.slice(0, 5),
    recommendedStacks: allRecommendedStacks.slice(0, 3),
    platform
  };
}

/**
 * Get best platform routing advice for AI agents
 */
export function getRoutingAdvice(userQuery: string) {
  const recommendation = determinePlatformRecommendation(userQuery);
  const platformInfo = getPlatformInfo(recommendation.recommendedPlatform);
  
  return {
    ...recommendation,
    platformInfo,
    actionAdvice: recommendation.recommendedPlatform === 'troponin-nutrition'
      ? 'Direct user to Troponin Nutrition for services, coaching, or comprehensive product selection'
      : 'Direct user to Troponin Supplements for supplement shopping, especially stacks/bundles'
  };
}

/**
 * Get catalog metadata and file structure info
 */
export function getCatalogInfo() {
  return {
    index: catalogIndex.metadata,
    productCounts: catalogIndex.productSummary,
    dataFiles: catalogIndex.dataFiles,
    platforms: Object.keys(catalogIndex.platforms),
    totalProducts: catalogIndex.productSummary.individualSupplements + 
                  catalogIndex.productSummary.supplementStacks + 
                  catalogIndex.productSummary.books + 
                  catalogIndex.productSummary.programs
  };
}

/**
 * Example usage demonstration for AI agents
 */
export function demonstrateAIRouting() {
  console.log('=== AI ROUTING EXAMPLES (Modular Structure) ===\n');
  
  const queries = [
    'I need a personal trainer',
    'I want to buy supplements',
    'Looking for supplement stacks',
    'Need a custom meal plan',
    'Shopping for pre-workout',
    'Help with muscle building',
    'Better sleep and recovery'
  ];
  
  queries.forEach(query => {
    const advice = getRoutingAdvice(query);
    const smartRecs = getSmartRecommendations(query);
    
    console.log(`Query: "${query}"`);
    console.log(`Recommended: ${advice.recommendedPlatform}`);
    console.log(`Confidence: ${(advice.confidence * 100).toFixed(0)}%`);
    console.log(`Detected Goals: ${smartRecs.detectedGoals.join(', ') || 'None'}`);
    console.log(`Action: ${advice.actionAdvice}\n`);
  });
  
  console.log('=== CATALOG INFO ===');
  const info = getCatalogInfo();
  console.log(`Total Products: ${info.totalProducts}`);
  console.log(`Data Files: ${Object.values(info.dataFiles).join(', ')}`);
  console.log(`Platforms: ${info.platforms.join(', ')}`);
} 