/**
 * PRODUCT CATALOG TOOL
 * 
 * AI agent tool wrapper for the performance-optimized product catalog system.
 * Provides a clean interface for agents to interact with product data.
 */

import { catalogOptimizer } from '@/lib/db/product-catalog/catalog-optimizer';
import { getProductById, getAllProducts } from '@/lib/db/product-helpers';

interface ProductSearchResult {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  availableOn: string[];
  keyBenefits?: string[];
  tags: string[];
  relevanceScore?: number;
}

interface IntentAnalysis {
  intent: 'product_search' | 'product_details' | 'goal_based' | 'category_browse' | 'platform_routing';
  confidence: number;
  suggestedCategory?: string;
  keywords: string[];
}

export class ProductCatalogTool {

  /**
   * Detect user intent from their query
   */
  async detectIntent(query: string): Promise<IntentAnalysis> {
    const quickIntent = await catalogOptimizer.detectIntent(query);
    
    return {
      intent: quickIntent.intent as any,
      confidence: quickIntent.confidence,
      suggestedCategory: this.extractCategoryFromQuery(query),
      keywords: quickIntent.keywords
    };
  }

  /**
   * Search for products based on query and optional category filter
   */
  async searchProducts(query: string, category?: string): Promise<ProductSearchResult[]> {
    try {
      // Use the catalog optimizer for fast product discovery
      const summaries = await catalogOptimizer.getProductSummaries({
        category,
        limit: 10
      });

             // Convert summaries to full product data if needed
       const products: ProductSearchResult[] = [];
       
       for (const summary of summaries) {
         const fullProduct = getProductById(summary.id);
         if (fullProduct) {
           products.push({
             id: fullProduct.id,
             name: fullProduct.name,
             category: fullProduct.category,
             type: fullProduct.type,
             description: fullProduct.description,
             availableOn: fullProduct.availableOn,
             keyBenefits: fullProduct.keyBenefits,
             tags: fullProduct.tags,
             relevanceScore: this.calculateRelevance(query, fullProduct)
           });
         }
       }

       // Sort by relevance
       return products.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      console.error('❌ [ProductCatalogTool] Error searching products:', error);
      return [];
    }
  }

  /**
   * Format a product for AI consumption
   */
  async formatProductForAI(product: ProductSearchResult): Promise<string> {
    try {
      const fullProduct = getProductById(product.id);
      if (!fullProduct) {
        return `**${product.name}**\n${product.description}\nAvailable on: ${product.availableOn.join(', ')}`;
      }

      let formatted = `**${fullProduct.name}**\n`;
      formatted += `${fullProduct.description}\n\n`;
      
      if (fullProduct.keyBenefits && fullProduct.keyBenefits.length > 0) {
        formatted += `**Key Benefits:**\n${fullProduct.keyBenefits.map(b => `- ${b}`).join('\n')}\n\n`;
      }

      if ((fullProduct as any).keyIngredients && (fullProduct as any).keyIngredients.length > 0) {
        const ingredients = (fullProduct as any).keyIngredients.slice(0, 3).map((ing: any) => ing.name).join(', ');
        formatted += `**Key Ingredients:** ${ingredients}\n\n`;
      }

      if ((fullProduct as any).usage) {
        formatted += `**Usage:** ${(fullProduct as any).usage.dosage} ${(fullProduct as any).usage.timing}\n\n`;
      }

      formatted += `**Available on:** ${fullProduct.availableOn.join(', ')}\n`;

      if (fullProduct.websiteUrl) {
        formatted += `**More info:** ${fullProduct.websiteUrl}`;
      }

      return formatted;
    } catch (error) {
      console.error('❌ [ProductCatalogTool] Error formatting product:', error);
      return `**${product.name}**\n${product.description}`;
    }
  }

  /**
   * Get available product categories
   */
  async getCategories(): Promise<Record<string, { name: string; description: string }>> {
    try {
      const allProducts = getAllProducts();
      const categories: Record<string, { name: string; description: string }> = {};

      // Extract unique categories from products
      const uniqueCategories = [...new Set(allProducts.map(p => p.category))];

      uniqueCategories.forEach(category => {
        categories[category] = {
          name: this.formatCategoryName(category),
          description: this.getCategoryDescription(category)
        };
      });

      return categories;
    } catch (error) {
      console.error('❌ [ProductCatalogTool] Error getting categories:', error);
      return {};
    }
  }

  /**
   * Get platform routing recommendation
   */
  async getPlatformRoute(query: string): Promise<{
    platform: 'troponin-nutrition' | 'troponin-supplements';
    confidence: number;
    reasoning: string;
  }> {
    return await catalogOptimizer.routePlatform(query);
  }

  // Private helper methods
  private extractCategoryFromQuery(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    
    const categoryMappings = {
      'individual-supplements': ['supplement', 'individual', 'single'],
      'supplement-stacks': ['stack', 'bundle', 'combo'],
      'books': ['book', 'ebook', 'read'],
      'programs': ['program', 'training', 'plan'],
      'coaching-services': ['coaching', 'coach', 'consultation']
    };

    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return category;
      }
    }

    return undefined;
  }

  private calculateRelevance(query: string, product: any): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Name match
    if (product.name.toLowerCase().includes(lowerQuery)) score += 10;
    
    // Description match
    if (product.description.toLowerCase().includes(lowerQuery)) score += 5;
    
    // Tag matches
    if (product.tags) {
      const tagMatches = product.tags.filter((tag: string) => 
        lowerQuery.includes(tag.toLowerCase()) || tag.toLowerCase().includes(lowerQuery)
      ).length;
      score += tagMatches * 3;
    }

    // Benefits match
    if (product.keyBenefits) {
      const benefitMatches = product.keyBenefits.filter((benefit: string) =>
        benefit.toLowerCase().includes(lowerQuery)
      ).length;
      score += benefitMatches * 2;
    }

    return score;
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      'individual-supplements': 'Single supplement products for specific needs',
      'supplement-stacks': 'Curated bundles of supplements for comprehensive support',
      'books': 'Educational books and e-books on nutrition and training',
      'programs': 'Training and nutrition programs',
      'coaching-services': 'Personal coaching and consultation services'
    };

    return descriptions[category as keyof typeof descriptions] || 'Product category';
  }
} 