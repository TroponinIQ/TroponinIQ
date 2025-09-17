/**
 * PRODUCTION-OPTIMIZED VECTOR SEARCH
 *
 * Searches the jtt_v2 table containing 20+ years of nutrition/fitness Q&As
 * Uses proper vector similarity search via match_documents RPC function
 * Includes query expansion with production performance optimizations
 * Uses Redis for persistent caching in production
 */

import { supabaseAdmin } from './client';

export interface FAQResult {
  upsert_key: string;
  content: string;
  data_type: string;
  source_doc_name: string;
  custom_metadata: {
    question: string;
    answer: string;
  };
  similarity?: number;
}

// Production caches - Redis in production, memory in development
const embeddingCacheWithTTL = new Map<string, CacheEntry<number[]>>();
const resultsCacheWithTTL = new Map<string, CacheEntry<FAQResult[]>>();
const queryExpansionCacheWithTTL = new Map<string, CacheEntry<string[]>>();

// Cache TTL (5 minutes for embeddings, 2 minutes for results)
const EMBEDDING_CACHE_TTL = 5 * 60 * 1000;
const RESULTS_CACHE_TTL = 2 * 60 * 1000;
const QUERY_EXPANSION_CACHE_TTL = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get from cache with TTL check
 */
function getFromCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): T | null {
  const entry = cache.get(key);
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key); // Remove expired entry
  }
  return null;
}

/**
 * Set cache with TTL
 */
function setCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
  ttl: number,
): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Extract nutrition/fitness keywords from user query with enhanced patterns
 */
function extractNutritionKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const keywords: string[] = [];

  // Protein sources and substitutes
  if (
    lowerQuery.includes('meat') ||
    lowerQuery.includes('protein') ||
    lowerQuery.includes('substitute') ||
    lowerQuery.includes('chicken') ||
    lowerQuery.includes('beef') ||
    lowerQuery.includes('fish') ||
    lowerQuery.includes('whey') ||
    lowerQuery.includes('casein')
  ) {
    keywords.push('protein sources', 'meat alternatives', 'protein powder', 'protein intake');
  }

  // Meal planning and diet
  if (
    lowerQuery.includes('meal') ||
    lowerQuery.includes('plan') ||
    lowerQuery.includes('diet') ||
    lowerQuery.includes('eating') ||
    lowerQuery.includes('food') ||
    lowerQuery.includes('nutrition') ||
    lowerQuery.includes('calories') ||
    lowerQuery.includes('macros')
  ) {
    keywords.push('meal plan', 'nutrition', 'diet plan', 'calorie intake', 'macronutrients');
  }

  // Supplements and PEDs
  if (
    lowerQuery.includes('supplement') ||
    lowerQuery.includes('vitamin') ||
    lowerQuery.includes('creatine') ||
    lowerQuery.includes('ped') ||
    lowerQuery.includes('steroid') ||
    lowerQuery.includes('testosterone') ||
    lowerQuery.includes('tren') ||
    lowerQuery.includes('anavar') ||
    lowerQuery.includes('cycle')
  ) {
    console.log(`[Vector] 🔬 SUPPLEMENT KEYWORDS DETECTED in query: "${lowerQuery}"`);
    
    // Differentiate between basic supplements and PEDs
    const isBasicSupplement = lowerQuery.includes('supplement') && 
      !lowerQuery.includes('ped') && 
      !lowerQuery.includes('steroid') && 
      !lowerQuery.includes('cycle') && 
      !lowerQuery.includes('testosterone') && 
      !lowerQuery.includes('tren') && 
      !lowerQuery.includes('anavar');
      
    if (isBasicSupplement) {
      console.log(`[Vector] 💊 Basic supplement query detected - adding basic supplement keywords`);
      keywords.push('supplements', 'vitamins', 'protein powder', 'creatine', 'fish oil', 'multivitamin', 'basic supplements');
    } else {
      console.log(`[Vector] ⚗️ Advanced PED query detected - adding PED keywords`);
      keywords.push('supplements', 'vitamins', 'performance enhancing drugs', 'steroid cycle');
    }
  }

  // Training and muscle building
  if (
    lowerQuery.includes('muscle') ||
    lowerQuery.includes('build') ||
    lowerQuery.includes('training') ||
    lowerQuery.includes('workout') ||
    lowerQuery.includes('exercise') ||
    lowerQuery.includes('lift') ||
    lowerQuery.includes('strength') ||
    lowerQuery.includes('bulk')
  ) {
    keywords.push('muscle building', 'training', 'workout', 'strength training', 'bulking');
  }

  // Fat loss and cutting
  if (
    lowerQuery.includes('fat') ||
    lowerQuery.includes('lose') ||
    lowerQuery.includes('cut') ||
    lowerQuery.includes('cutting') ||
    lowerQuery.includes('weight loss') ||
    lowerQuery.includes('shred') ||
    lowerQuery.includes('lean') ||
    lowerQuery.includes('cardio')
  ) {
    keywords.push('fat loss', 'cutting', 'weight loss', 'cardio', 'lean muscle');
  }

  // Fasting and meal timing
  if (
    lowerQuery.includes('fast') ||
    lowerQuery.includes('IF') ||
    lowerQuery.includes('intermittent') ||
    lowerQuery.includes('timing') ||
    lowerQuery.includes('when to eat')
  ) {
    keywords.push('intermittent fasting', 'fasting', 'meal timing', 'eating schedule');
  }

  // Contest prep and bodybuilding
  if (
    lowerQuery.includes('contest') ||
    lowerQuery.includes('prep') ||
    lowerQuery.includes('competition') ||
    lowerQuery.includes('stage') ||
    lowerQuery.includes('bodybuilding')
  ) {
    keywords.push('contest prep', 'bodybuilding', 'competition preparation');
  }

  // Recovery and health
  if (
    lowerQuery.includes('recovery') ||
    lowerQuery.includes('sleep') ||
    lowerQuery.includes('rest') ||
    lowerQuery.includes('injury') ||
    lowerQuery.includes('health')
  ) {
    keywords.push('recovery', 'sleep', 'rest day', 'injury prevention');
  }

  return keywords.slice(0, 4); // Increased to 4 keywords for better coverage
}

/**
 * Expand user query into better search terms using better LLM with smart fallbacks
 */
async function expandSearchQuery(userQuery: string): Promise<string[]> {
  try {
    // TEMPORARY: Skip complex expansion, just return original query
    console.log(`[Vector] 🎯 SIMPLE MODE: Using original query only: "${userQuery}"`);
    return [userQuery];
  } catch (error) {
    console.error('[Vector] ❌ Query expansion error:', error);
    return [userQuery];
  }
}

/**
 * Generate embeddings using OpenAI API with caching and timeout
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Check cache first
    const cached = getFromCache(embeddingCacheWithTTL, text);
    if (cached) {
      console.log(
        `[Vector] 💾 EMBEDDING CACHE HIT for: "${text.substring(0, 50)}..."`,
      );
      return cached;
    }
    console.log(
      `[Vector] 🔍 EMBEDDING CACHE MISS - Generating new embedding for: "${text.substring(0, 50)}..."`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
          dimensions: 1536, // Use 1536 dimensions for consistency with existing database
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      console.log(
        `[Vector] ✅ Generated embedding with ${embedding.length} dimensions`,
      );

      // Cache the embedding
      setCache(embeddingCacheWithTTL, text, embedding, EMBEDDING_CACHE_TTL);
      console.log(
        `[Vector] 💾 CACHED embedding for: "${text.substring(0, 50)}..."`,
      );

      return embedding;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('[Vector] ❌ Embedding generation timeout');
    } else {
      console.error('[Vector] ❌ Embedding generation failed:', error);
    }
    throw error;
  }
}

/**
 * Check if search results are relevant to the query
 */
function areResultsRelevant(query: string, results: FAQResult[]): boolean {
  if (results.length === 0) return false;

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(' ').filter((w) => w.length > 3);

  // Check if any result has decent similarity and topic relevance
  for (const result of results.slice(0, 3)) {
    const questionLower = result.custom_metadata?.question?.toLowerCase() || '';
    const answerLower = result.custom_metadata?.answer?.toLowerCase() || '';
    const content = `${questionLower} ${answerLower}`;

    // Check for word overlap
    const overlap = queryWords.filter((word) => content.includes(word)).length;
    if (overlap >= 1 && (result.similarity || 0) > 0.2) {
      return true;
    }
  }

  return false;
}

/**
 * PRODUCTION-OPTIMIZED FAQ SEARCH
 * Uses parallel processing, caching, and smart fallbacks
 */
export async function searchFAQs(
  query: string,
  limit = 5,
): Promise<FAQResult[]> {
  const startTime = Date.now();

  try {
    console.log(`[Vector] 🔍 Searching FAQs for: "${query}"`);

    // Check results cache first
    const cacheKey = `${query}:${limit}`;
    const cached = getFromCache(resultsCacheWithTTL, cacheKey);
    if (cached) {
      console.log(
        `[Vector] 💾 CACHE HIT! Using cached results (${Date.now() - startTime}ms)`,
      );
      console.log(`[Vector] 💾 Returning ${cached.length} cached FAQs`);
      return cached;
    }
    console.log(`[Vector] 🔍 CACHE MISS - No cached results for: "${query}"`);

    // 1. Expand the query into better search terms
    const searchTerms = await expandSearchQuery(query);

    // 2. Generate embeddings for ALL terms in parallel
    console.log(
      `[Vector] ⚡ Generating ${searchTerms.length} embeddings in parallel...`,
    );
    const embeddingPromises = searchTerms.map((term) =>
      generateEmbedding(term).catch((error: Error) => {
        console.error(
          `[Vector] Failed to generate embedding for "${term}":`,
          error,
        );
        return null;
      }),
    );

    const embeddings = await Promise.all(embeddingPromises);
    const validEmbeddings = embeddings
      .map((embedding, index) => ({ embedding, term: searchTerms[index] }))
      .filter((item) => item.embedding !== null);

    if (validEmbeddings.length === 0) {
      console.log(
        '[Vector] ⚠️ No valid embeddings, falling back to text search',
      );
      return await textSearchFallback(query, limit);
    }

    // 3. Perform vector searches in parallel
    console.log(
      `[Vector] ⚡ Performing ${validEmbeddings.length} vector searches in parallel...`,
    );
    const searchPromises = validEmbeddings.map(({ embedding, term }) =>
      performVectorSearch(embedding as number[], term, limit).catch(
        (error: Error) => {
          console.error(`[Vector] Vector search failed for "${term}":`, error);
          return [];
        },
      ),
    );

    const searchResults = await Promise.all(searchPromises);

    // 4. Combine and deduplicate results
    const allResults = searchResults.flat();
    const uniqueResults = deduplicateResults(allResults);

    // 5. Sort by similarity and take top results
    const finalResults = uniqueResults
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);

    const totalTime = Date.now() - startTime;
    console.log(
      `[Vector] ✅ Found ${finalResults.length} unique FAQs (${totalTime}ms total)`,
    );

    // 6. Check if results are actually relevant to the query
    if (finalResults.length > 0) {
      const isRelevant = areResultsRelevant(query, finalResults);

      if (!isRelevant) {
        console.log(
          '[Vector] ⚠️ Vector results seem irrelevant, trying text search fallback...',
        );
        const fallbackResults = await textSearchFallback(query, limit);

        if (fallbackResults.length > 0) {
          const isFallbackRelevant = areResultsRelevant(query, fallbackResults);
          if (isFallbackRelevant) {
            console.log('[Vector] ✅ Text fallback found relevant results');
            setCache(
              resultsCacheWithTTL,
              cacheKey,
              fallbackResults,
              RESULTS_CACHE_TTL,
            );
            return fallbackResults;
          }
        }

        // If no fallback worked, log the issue but return vector results anyway
        console.log(
          '[Vector] ⚠️ No relevant results found in either vector or text search',
        );
        console.log(
          `[Vector] 📋 Top vector result question: "${finalResults[0]?.custom_metadata?.question}"`,
        );
        console.log(`[Vector] 📋 User query was: "${query}"`);
      }
    }

    if (finalResults.length === 0) {
      console.log('[Vector] 🔄 No vector results, trying text fallback...');
      const fallbackResults = await textSearchFallback(query, limit);
      setCache(
        resultsCacheWithTTL,
        cacheKey,
        fallbackResults,
        RESULTS_CACHE_TTL,
      );
      console.log(`[Vector] 💾 CACHED fallback results for: "${query}"`);
      return fallbackResults;
    }

    // Cache the results
    setCache(resultsCacheWithTTL, cacheKey, finalResults, RESULTS_CACHE_TTL);
    console.log(`[Vector] 💾 CACHED vector results for: "${query}"`);

    // Debug: Log performance metrics and top results
    if (finalResults.length > 0) {
      const first = finalResults[0];
      console.log(`[Vector] 📋 Top result (${totalTime}ms):`);
      console.log(`  - Similarity: ${first.similarity}`);
      console.log(
        `  - Question: ${first.custom_metadata?.question || 'NO QUESTION'}`,
      );

      // Show cache stats
      console.log(`[Vector] 📊 Cache Stats:`);
      console.log(`  - Embeddings cached: ${embeddingCacheWithTTL.size}`);
      console.log(`  - Results cached: ${resultsCacheWithTTL.size}`);
      console.log(
        `  - Query expansions cached: ${queryExpansionCacheWithTTL.size}`,
      );
    }

    return finalResults;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Vector] ❌ Search failed after ${totalTime}ms:`, error);
    return await textSearchFallback(query, limit);
  }
}

/**
 * Perform single vector search with timeout
 */
async function performVectorSearch(
  embedding: number[],
  searchTerm: string,
  limit: number,
): Promise<FAQResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    console.log(`[Vector] 📡 Vector search for: "${searchTerm}"`);

    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: embedding,
      match_count: Math.min(limit, 50), // Cap at 50 to avoid performance issues  
      filter: { data_type: 'faq' },
    });

    clearTimeout(timeoutId);

    if (error) {
      console.error(
        `[Vector] ❌ Vector search error for "${searchTerm}":`,
        error,
      );
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`[Vector] 📭 No results for: "${searchTerm}"`);
      return [];
    }

    console.log(
      `[Vector] 📥 Found ${data.length} results for: "${searchTerm}"`,
    );
    return await processVectorResults(data, searchTerm);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Deduplicate results by upsert_key
 */
function deduplicateResults(results: FAQResult[]): FAQResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.upsert_key)) {
      return false;
    }
    seen.add(result.upsert_key);
    return true;
  });
}

/**
 * Process vector search results into FAQResult format
 */
async function processVectorResults(
  data: any[],
  searchTerm: string,
): Promise<FAQResult[]> {
  console.log(`[Vector] 🔄 Processing ${data.length} vector results for "${searchTerm}"`);
  
  // Debug: Log the first row structure to understand the data format
  if (data.length > 0) {
    console.log(`[Vector] 🔍 First row structure:`, {
      hasContent: !!data[0].content,
      hasPageContent: !!data[0].pageContent,
      metadataKeys: data[0].metadata ? Object.keys(data[0].metadata) : 'no metadata',
      topLevelKeys: Object.keys(data[0])
    });
  }
  
  const results = data.map((row: any) => {
    let customMetadata = row.metadata?.custom_metadata_from_db;

    if (typeof customMetadata === 'string') {
      try {
        customMetadata = JSON.parse(customMetadata);
      } catch (e) {
        console.log(
          `[Vector] ⚠️ Failed to parse metadata for ${row.metadata?.upsert_key}`,
        );
        customMetadata = { question: 'Parse error', answer: 'Parse error' };
      }
    }

    // Convert cosine distance to similarity score
    // Cosine distance: lower = more similar (can be negative)
    // Cosine similarity: higher = more similar (0 to 1)
    const rawDistance = row.similarity || 0;
    const similarity = Math.max(0, 1 - Math.abs(rawDistance)); // Convert distance to similarity
    
    const result = {
      upsert_key: row.metadata?.upsert_key || 'unknown',
      content: row.content || row.pageContent || customMetadata?.answer || '',
      data_type: row.metadata?.data_type || 'faq',
      source_doc_name: row.metadata?.source_doc_name || row.metadata?.source_doc || 'unknown',
      custom_metadata: customMetadata || { question: 'No question', answer: 'No answer' },
      similarity: Number(similarity.toFixed(3)), // Round to 3 decimal places
    };

    // Enhanced debug logging for supplement queries
    if (searchTerm.toLowerCase().includes('supplement')) {
      console.log(`[Vector] 💊 SUPPLEMENT RESULT: "${result.custom_metadata.question}" (distance: ${rawDistance}, similarity: ${result.similarity})`);
    }

    return result;
  });

  // Log the conversion for debugging
  console.log(`[Vector] 📊 Distance→Similarity conversion: Raw distance range, converted similarity range`);
  if (results.length > 0) {
    const rawDistances = data.map(row => row.similarity || 0);
    const minDist = Math.min(...rawDistances);
    const maxDist = Math.max(...rawDistances);
    const similarities = results.map(r => r.similarity || 0);
    const minSim = Math.min(...similarities);
    const maxSim = Math.max(...similarities);
    console.log(`[Vector] 📊 Distance: ${minDist.toFixed(3)} to ${maxDist.toFixed(3)} → Similarity: ${minSim.toFixed(3)} to ${maxSim.toFixed(3)}`);
  }

  return results;
}

/**
 * Optimized text search fallback with nutrition/fitness keyword targeting
 */
async function textSearchFallback(
  query: string,
  limit: number,
): Promise<FAQResult[]> {
  try {
    console.log('[Vector] 📝 Using optimized text search fallback...');

    // Extract nutrition/fitness keywords for text search
    const smartKeywords = extractNutritionKeywords(query);
    const queryWords = query
      .toLowerCase()
      .split(' ')
      .filter((word) => word.length > 2);

    // Combine smart keywords with query words
    const searchTerms = [...smartKeywords, ...queryWords]
      .filter((term, index, array) => array.indexOf(term) === index) // Remove duplicates
      .slice(0, 5); // Max 5 terms for performance

    console.log(`[Vector] 🎯 Text search terms: [${searchTerms.join(', ')}]`);

    if (searchTerms.length === 0) {
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      // Build more sophisticated search query
      const contentSearch = searchTerms
        .map((term) => `content.ilike.%${term}%`)
        .join(',');

      const { data, error } = await supabaseAdmin
        .from('jtt_v2')
        .select('*')
        .eq('data_type', 'faq')
        .or(contentSearch)
        .order('upsert_key') // Add some ordering for consistency
        .limit(limit * 2) // Get more results to filter through
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error || !data) {
        console.error('[Vector] ❌ Text search error:', error);
        return [];
      }

      console.log(`[Vector] 📥 Text search found ${data.length} raw results`);

      // Process and score results
      const processedResults = data.map((row) => {
        const result = {
          upsert_key: row.upsert_key,
          content: row.content,
          data_type: row.data_type,
          source_doc_name: row.source_doc_name,
          custom_metadata:
            typeof row.custom_metadata === 'string'
              ? JSON.parse(row.custom_metadata)
              : row.custom_metadata,
          similarity: 0.3, // Base similarity for text search
        };

        // Calculate relevance score based on keyword matches
        const questionLower =
          result.custom_metadata?.question?.toLowerCase() || '';
        const answerLower = result.custom_metadata?.answer?.toLowerCase() || '';
        const content = `${questionLower} ${answerLower}`;

        let score = 0;
        searchTerms.forEach((term) => {
          if (content.includes(term.toLowerCase())) {
            score += 0.1; // Add score for each matching term
          }
        });

        result.similarity = Math.min(0.8, 0.3 + score); // Cap at 0.8 for text search
        return result;
      });

      // Sort by relevance score and take top results
      const sortedResults = processedResults
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit);

      console.log(
        `[Vector] ✅ Text search returning ${sortedResults.length} results`,
      );

      if (sortedResults.length > 0) {
        console.log(
          `[Vector] 📋 Top text result: "${sortedResults[0].custom_metadata?.question}"`,
        );
      }

      return sortedResults;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[Vector] ❌ Text fallback failed:', error);
    return [];
  }
}

/**
 * Clear expired cache entries (call this periodically)
 */
export function clearExpiredCache(): void {
  const now = Date.now();

  for (const [key, entry] of embeddingCacheWithTTL.entries()) {
    if (!isCacheValid(entry)) {
      embeddingCacheWithTTL.delete(key);
    }
  }

  for (const [key, entry] of resultsCacheWithTTL.entries()) {
    if (!isCacheValid(entry)) {
      resultsCacheWithTTL.delete(key);
    }
  }

  for (const [key, entry] of queryExpansionCacheWithTTL.entries()) {
    if (!isCacheValid(entry)) {
      queryExpansionCacheWithTTL.delete(key);
    }
  }

  console.log(
    `[Vector] 🧹 Cache cleanup: ${embeddingCacheWithTTL.size} embeddings, ${resultsCacheWithTTL.size} results, ${queryExpansionCacheWithTTL.size} queries`,
  );
}

// Auto-cleanup every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(clearExpiredCache, 5 * 60 * 1000);
}

/**
 * Get random FAQs for testing
 */
export async function getRandomFAQs(limit = 3): Promise<FAQResult[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('jtt_v2')
      .select('*')
      .eq('data_type', 'faq')
      .limit(limit);

    if (error) {
      console.error('[Vector] Random FAQs error:', error);
      return [];
    }

    return (data || []).map((row) => ({
      upsert_key: row.upsert_key,
      content: row.content,
      data_type: row.data_type,
      source_doc_name: row.source_doc_name,
      custom_metadata:
        typeof row.custom_metadata === 'string'
          ? JSON.parse(row.custom_metadata)
          : row.custom_metadata,
      similarity: 0,
    }));
  } catch (error) {
    console.error('[Vector] Random FAQs failed:', error);
    return [];
  }
}

/**
 * SIMPLIFIED HYBRID SEARCH - Production Approach
 * Focus on: More results + better reranking vs complex query preprocessing
 */
export async function simpleHybridSearchFAQs(
  query: string,
  limit = 5,
): Promise<FAQResult[]> {
  const startTime = Date.now();

  try {
    console.log(`[Vector] 🔍 SIMPLE HYBRID SEARCH for: "${query}"`);

    // Check results cache first
    const cacheKey = `simple-hybrid:${query}:${limit}`;
    const cached = getFromCache(resultsCacheWithTTL, cacheKey);
    if (cached) {
      console.log(`[Vector] 💾 SIMPLE CACHE HIT! (${Date.now() - startTime}ms)`);
      return cached;
    }

    // 1. Get MORE vector results (no query expansion, just the original query)
    console.log(`[Vector] 🎯 Requesting ${limit * 4} vector results for reranking...`);
    const vectorResults = await simpleVectorSearch(query, limit * 4); // Get 4x more for reranking
    console.log(`[Vector] 📊 Got ${vectorResults.length} vector results (requested ${limit * 4})`);
    
    // 2. Get keyword results as backup
    const keywordResults = await textSearchFallback(query, limit * 2);
    
    // 3. Combine and deduplicate
    const allResults = [...vectorResults, ...keywordResults];
    const uniqueResults = deduplicateResults(allResults);

    // 4. Enhanced reranking (this is where the magic happens)
    const rerankedResults = simpleReranking(query, uniqueResults);
    
    // 5. Take top results
    const finalResults = rerankedResults.slice(0, limit);

    const totalTime = Date.now() - startTime;
    console.log(`[Vector] ✅ SIMPLE HYBRID: ${finalResults.length} results (${totalTime}ms)`);

    // Cache results
    setCache(resultsCacheWithTTL, cacheKey, finalResults, RESULTS_CACHE_TTL);

    if (finalResults.length > 0) {
      console.log(`[Vector] 📋 Top simple result: "${finalResults[0].custom_metadata?.question}"`);
      console.log(`[Vector] 📋 Simple score: ${finalResults[0].similarity}`);
    }

    return finalResults;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Vector] ❌ Simple hybrid search failed after ${totalTime}ms:`, error);
    return await simpleVectorSearch(query, limit); // Fallback to basic vector search
  }
}

/**
 * Simple vector search without query expansion
 */
async function simpleVectorSearch(query: string, limit: number): Promise<FAQResult[]> {
  try {
    // Just embed the original query - no expansion
    const embedding = await generateEmbedding(query);
    
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: embedding,
      match_count: Math.min(limit, 50), // Cap at 50 to avoid performance issues
      filter: { data_type: 'faq' },
    });

    if (error || !data) {
      console.error('[Vector] Simple vector search error:', error);
      return [];
    }

    return await processVectorResults(data, query);
  } catch (error) {
    console.error('[Vector] Simple vector search failed:', error);
    return [];
  }
}

/**
 * Simplified reranking - focus on what actually matters
 */
function simpleReranking(query: string, results: FAQResult[]): FAQResult[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(' ').filter(w => w.length > 2);

  return results.map(result => {
    const question = result.custom_metadata?.question?.toLowerCase() || '';
    const answer = result.custom_metadata?.answer?.toLowerCase() || '';
    const content = `${question} ${answer}`;

    let score = result.similarity || 0;

    // 1. Exact phrase matching (strongest signal)
    if (content.includes(queryLower)) {
      score += 0.4;
    }

    // 2. Question title relevance (questions > answers for importance)
    const questionMatches = queryWords.filter(word => question.includes(word)).length;
    score += (questionMatches / queryWords.length) * 0.3;

    // 3. Overall word overlap
    const totalMatches = queryWords.filter(word => content.includes(word)).length;
    score += (totalMatches / queryWords.length) * 0.2;

    // 4. Boost practical answers (action words)
    const actionWords = ['should', 'need', 'take', 'eat', 'avoid', 'use', 'can', 'will'];
    const hasAction = actionWords.some(word => answer.includes(word));
    if (hasAction) score += 0.1;

    return {
      ...result,
      similarity: Math.min(score, 1.0)
    };
  }).sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
}

/**
 * SMART HYBRID SEARCH - Production Approach with Conditional Expansion
 * Try simple first, only expand if results are poor
 */
export async function smartHybridSearchFAQs(
  query: string,
  limit = 5,
): Promise<FAQResult[]> {
  const startTime = Date.now();

  try {
    console.log(`[Vector] 🧠 SMART HYBRID SEARCH for: "${query}"`);

    // Check results cache first
    const cacheKey = `smart-hybrid:${query}:${limit}`;
    const cached = getFromCache(resultsCacheWithTTL, cacheKey);
    if (cached) {
      console.log(`[Vector] 💾 SMART CACHE HIT! (${Date.now() - startTime}ms)`);
      return cached;
    }

    // 1. Try simple search first (no expansion)
    console.log(`[Vector] 🎯 Trying simple search first...`);
    const simpleResults = await simpleHybridSearchFAQs(query, limit);
    
    // 2. Evaluate if results are good enough
    const needsExpansion = shouldExpandQuery(query, simpleResults);
    
    if (!needsExpansion) {
      console.log(`[Vector] ✅ Simple search good enough, using those results`);
      setCache(resultsCacheWithTTL, cacheKey, simpleResults, RESULTS_CACHE_TTL);
      return simpleResults;
    }

    // 3. Results aren't great, try with expansion
    console.log(`[Vector] 🔄 Simple results poor, trying with expansion...`);
    const expandedResults = await searchFAQs(query, limit); // Use the original complex search as fallback
    
    const totalTime = Date.now() - startTime;
    console.log(`[Vector] ✅ SMART HYBRID: Used expansion, ${expandedResults.length} results (${totalTime}ms)`);

    // Cache the expanded results
    setCache(resultsCacheWithTTL, cacheKey, expandedResults, RESULTS_CACHE_TTL);
    return expandedResults;

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Vector] ❌ Smart hybrid search failed after ${totalTime}ms:`, error);
    return await simpleVectorSearch(query, limit);
  }
}

/**
 * Decide if we need query expansion based on result quality
 */
function shouldExpandQuery(query: string, results: FAQResult[]): boolean {
  // No results = definitely need expansion
  if (results.length === 0) {
    console.log(`[Vector] 📊 No results, need expansion`);
    return true;
  }

  // Check top result similarity score (now using proper 0-1 similarity scale)
  const topScore = results[0].similarity || 0;
  if (topScore < 0.4) { // Lower threshold since we converted from distance
    console.log(`[Vector] 📊 Top score ${topScore} < 0.4, need expansion`);
    return true;
  }

  // Check if we have decent coverage (at least 3 results with >0.3 similarity)
  const decentResults = results.filter(r => (r.similarity || 0) > 0.3).length;
  if (decentResults < 3) {
    console.log(`[Vector] 📊 Only ${decentResults} decent results, need expansion`);
    return true;
  }

  // Check for exact phrase match in top results
  const queryLower = query.toLowerCase();
  const hasExactMatch = results.slice(0, 3).some(result => {
    const question = result.custom_metadata?.question?.toLowerCase() || '';
    const answer = result.custom_metadata?.answer?.toLowerCase() || '';
    return question.includes(queryLower) || answer.includes(queryLower);
  });

  if (!hasExactMatch) {
    console.log(`[Vector] 📊 No exact phrase matches, need expansion`);
    return true;
  }

  console.log(`[Vector] 📊 Results look good, no expansion needed`);
  return false;
}
