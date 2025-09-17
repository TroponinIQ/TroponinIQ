/**
 * NUTRITION CALCULATOR TOOL - TroponinIQ Core Business Logic
 *
 * This is the heart of TroponinIQ's nutrition coaching system. It provides
 * scientifically-accurate calculations that form the foundation of all
 * personalized nutrition recommendations.
 *
 * KEY FUNCTIONS:
 * 1. BMR (Basal Metabolic Rate) calculation using validated formulas
 * 2. TDEE (Total Daily Energy Expenditure) estimation
 * 3. Macro distribution based on goals and preferences
 * 4. Goal-specific calorie adjustments for cutting/bulking/recomposition
 * 5. Mathematical expression evaluation to prevent AI calculation errors
 *
 * BUSINESS IMPORTANCE:
 * - Ensures calculation accuracy (prevents AI from doing mental math)
 * - Provides step-by-step verification for user transparency
 * - Implements evidence-based nutrition science
 * - Supports Justin Harris's proven methodologies
 *
 * SCIENTIFIC BASIS:
 * - Mifflin-St Jeor equation: Most accurate for modern populations
 * - Harris-Benedict equation: Traditional backup method
 * - Activity multipliers based on exercise science research
 * - Macro ratios optimized for bodybuilding and athletic performance
 *
 * CRITICAL FOR COACHING:
 * All nutrition advice in TroponinIQ stems from these calculations.
 * Any changes to formulas should be validated with Justin Harris.
 */

export interface BMRCalculation {
  bmr: number;
  method: 'mifflin-st-jeor' | 'harris-benedict';
  details: {
    age: number;
    weight: number;
    height: number;
    gender: string;
  };
}

export interface TDEECalculation {
  tdee: number;
  bmr: number;
  activityMultiplier: number;
  activityLevel: string;
}

export interface MacroDistribution {
  calories: number;
  protein: {
    grams: number;
    calories: number;
    percentage: number;
  };
  carbs: {
    grams: number;
    calories: number;
    percentage: number;
  };
  fat: {
    grams: number;
    calories: number;
    percentage: number;
  };
  totalCaloriesFromMacros: number;
  isAccurate: boolean;
}

export interface CalorieArithmetic {
  inputs: number[];
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  result: number;
  verification: string;
}

export class NutritionCalculator {
  /**
   * Calculate BMR using Mifflin-St Jeor equation (more accurate)
   * Now uses step-by-step calculation to prevent AI math hallucination
   */
  calculateBMR(
    age: number,
    weight: number, // kg
    height: number, // cm
    gender: 'male' | 'female',
    method: 'mifflin-st-jeor' | 'harris-benedict' = 'mifflin-st-jeor',
  ): BMRCalculation & {
    calculationSteps: any;
    verification: string;
  } {
    let steps: Array<{
      description: string;
      expression: string;
      expectedResult?: number;
    }>;

    if (method === 'mifflin-st-jeor') {
      // Mifflin-St Jeor: More accurate for modern populations
      if (gender === 'male') {
        steps = [
          {
            description: `Weight component: 10 × ${weight} kg`,
            expression: `10 * ${weight}`,
          },
          {
            description: `Height component: 6.25 × ${height} cm`,
            expression: `6.25 * ${height}`,
          },
          {
            description: `Age component: 5 × ${age} years`,
            expression: `5 * ${age}`,
          },
          {
            description: `BMR = (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) + 5`,
            expression: `(10 * ${weight}) + (6.25 * ${height}) - (5 * ${age}) + 5`,
          },
        ];
      } else {
        steps = [
          {
            description: `Weight component: 10 × ${weight} kg`,
            expression: `10 * ${weight}`,
          },
          {
            description: `Height component: 6.25 × ${height} cm`,
            expression: `6.25 * ${height}`,
          },
          {
            description: `Age component: 5 × ${age} years`,
            expression: `5 * ${age}`,
          },
          {
            description: `BMR = (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) - 161`,
            expression: `(10 * ${weight}) + (6.25 * ${height}) - (5 * ${age}) - 161`,
          },
        ];
      }
    } else {
      // Harris-Benedict: Traditional formula
      if (gender === 'male') {
        steps = [
          {
            description: `Weight component: 13.397 × ${weight} kg`,
            expression: `13.397 * ${weight}`,
          },
          {
            description: `Height component: 4.799 × ${height} cm`,
            expression: `4.799 * ${height}`,
          },
          {
            description: `Age component: 5.677 × ${age} years`,
            expression: `5.677 * ${age}`,
          },
          {
            description: `BMR = 88.362 + (13.397 × ${weight}) + (4.799 × ${height}) - (5.677 × ${age})`,
            expression: `88.362 + (13.397 * ${weight}) + (4.799 * ${height}) - (5.677 * ${age})`,
          },
        ];
      } else {
        steps = [
          {
            description: `Weight component: 9.247 × ${weight} kg`,
            expression: `9.247 * ${weight}`,
          },
          {
            description: `Height component: 3.098 × ${height} cm`,
            expression: `3.098 * ${height}`,
          },
          {
            description: `Age component: 4.330 × ${age} years`,
            expression: `4.330 * ${age}`,
          },
          {
            description: `BMR = 447.593 + (9.247 × ${weight}) + (3.098 × ${height}) - (4.330 × ${age})`,
            expression: `447.593 + (9.247 * ${weight}) + (3.098 * ${height}) - (4.330 * ${age})`,
          },
        ];
      }
    }

    const calculation = this.calculateStepByStep(steps);
    const bmr = Math.round(calculation.finalResult);

    return {
      bmr,
      method,
      details: { age, weight, height, gender },
      calculationSteps: calculation,
      verification: `${method.toUpperCase()} BMR calculation completed with ${calculation.totalSteps} steps, final result: ${bmr} calories/day`,
    };
  }

  /**
   * Calculate TDEE based on BMR and activity level
   */
  calculateTDEE(bmr: number, activityLevel: string): TDEECalculation {
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      heavy: 1.725,
      extreme: 1.9,
    };

    const multiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.2;
    const tdee = Math.round(bmr * multiplier);

    return {
      tdee,
      bmr,
      activityMultiplier: multiplier,
      activityLevel,
    };
  }

  /**
   * Calculate macro distribution ensuring calories add up correctly
   */
  calculateMacros(
    targetCalories: number,
    proteinGramsPerKg: number,
    bodyWeight: number,
    fatPercentage = 25,
    fillWithCarbs = true,
  ): MacroDistribution {
    // Calculate protein
    const proteinGrams = Math.round(proteinGramsPerKg * bodyWeight);
    const proteinCalories = proteinGrams * 4;

    // Calculate fat
    const fatCalories = Math.round(targetCalories * (fatPercentage / 100));
    const fatGrams = Math.round(fatCalories / 9);

    // Calculate carbs (remaining calories)
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);

    // Verify total calories
    const totalCaloriesFromMacros =
      proteinGrams * 4 + carbGrams * 4 + fatGrams * 9;
    const isAccurate = Math.abs(totalCaloriesFromMacros - targetCalories) <= 10; // Within 10 calories

    return {
      calories: targetCalories,
      protein: {
        grams: proteinGrams,
        calories: proteinGrams * 4,
        percentage: Math.round(((proteinGrams * 4) / targetCalories) * 100),
      },
      carbs: {
        grams: carbGrams,
        calories: carbGrams * 4,
        percentage: Math.round(((carbGrams * 4) / targetCalories) * 100),
      },
      fat: {
        grams: fatGrams,
        calories: fatGrams * 9,
        percentage: Math.round(((fatGrams * 9) / targetCalories) * 100),
      },
      totalCaloriesFromMacros,
      isAccurate,
    };
  }

  /**
   * Perform calorie arithmetic with verification
   */
  calculateCalories(
    values: number[],
    operation: 'add' | 'subtract' | 'multiply' | 'divide',
  ): CalorieArithmetic {
    let result: number;
    let verification: string;

    switch (operation) {
      case 'add':
        result = values.reduce((sum, val) => sum + val, 0);
        verification = `${values.join(' + ')} = ${result}`;
        break;

      case 'subtract':
        result = values.reduce((diff, val, index) =>
          index === 0 ? val : diff - val,
        );
        verification = `${values.join(' - ')} = ${result}`;
        break;

      case 'multiply':
        result = values.reduce((product, val) => product * val, 1);
        verification = `${values.join(' × ')} = ${result}`;
        break;

      case 'divide':
        result = values.reduce((quotient, val, index) =>
          index === 0 ? val : quotient / val,
        );
        verification = `${values.join(' ÷ ')} = ${result}`;
        break;

      default:
        result = 0;
        verification = 'Invalid operation';
    }

    return {
      inputs: values,
      operation,
      result: Math.round(result * 100) / 100, // Round to 2 decimal places
      verification,
    };
  }

  /**
   * Enhanced calculator for fitness-related mathematical expressions
   * Prevents AI hallucination by forcing programmatic calculation
   * Supports: basic arithmetic, parentheses, decimals, and percentages
   */
  evaluateExpression(expression: string): {
    expression: string;
    result: number;
    steps: string[];
    verification: string;
    isValid: boolean;
  } {
    try {
      // Preprocess only fitness-relevant math operations
      const processedExpression = this.preprocessFitnessExpression(expression);

      // Clean and validate the expression - allow basic math operations only
      const cleanExpression = processedExpression
        .replace(/[^0-9+\-*/().\s]/g, '') // Only numbers, basic operators, parentheses, decimals
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (!cleanExpression) {
        return {
          expression,
          result: 0,
          steps: ['Invalid expression: empty or contains invalid characters'],
          verification: 'INVALID',
          isValid: false,
        };
      }

      // Validate parentheses are balanced
      const openParens = (cleanExpression.match(/\(/g) || []).length;
      const closeParens = (cleanExpression.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        return {
          expression,
          result: 0,
          steps: ['Invalid expression: unbalanced parentheses'],
          verification: 'INVALID',
          isValid: false,
        };
      }

      // Use Function constructor for safe evaluation (no Math object needed for basic operations)
      const result = new Function(`return (${cleanExpression})`)();

      if (typeof result !== 'number' || !Number.isFinite(result)) {
        return {
          expression,
          result: 0,
          steps: ['Invalid result: not a finite number'],
          verification: 'INVALID',
          isValid: false,
        };
      }

      const roundedResult = Math.round(result * 100) / 100;

      return {
        expression: cleanExpression,
        result: roundedResult,
        steps: [
          `Original: ${expression}`,
          `Processed: ${processedExpression}`,
          `Cleaned: ${cleanExpression}`,
          `Calculated: ${result}`,
          `Rounded: ${roundedResult}`,
        ],
        verification: `${cleanExpression} = ${roundedResult}`,
        isValid: true,
      };
    } catch (error) {
      return {
        expression,
        result: 0,
        steps: [
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        verification: 'CALCULATION_ERROR',
        isValid: false,
      };
    }
  }

  /**
   * Preprocess fitness-related mathematical expressions
   * Only handles operations actually needed for fitness calculations
   */
  private preprocessFitnessExpression(expression: string): string {
    let processed = expression;

    // Convert percentage calculations: "15% of 200" -> "(15/100) * 200"
    processed = processed.replace(
      /(\d+(?:\.\d+)?)%\s*of\s*(\d+(?:\.\d+)?)/gi,
      '($1/100) * $2',
    );

    // Convert standalone percentage: "15%" -> "(15/100)"
    processed = processed.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // Convert × and ÷ symbols to standard operators
    processed = processed.replace(/×/g, '*');
    processed = processed.replace(/÷/g, '/');

    return processed;
  }

  /**
   * Step-by-step calculation with intermediate results
   * Ideal for complex formulas like BMR calculations
   */
  calculateStepByStep(
    steps: Array<{
      description: string;
      expression: string;
      expectedResult?: number;
    }>,
  ): {
    totalSteps: number;
    results: Array<{
      step: number;
      description: string;
      expression: string;
      result: number;
      verification: string;
      isCorrect?: boolean;
    }>;
    finalResult: number;
    allStepsValid: boolean;
  } {
    const results = [];
    let allValid = true;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const calculation = this.evaluateExpression(step.expression);

      const isCorrect =
        step.expectedResult !== undefined
          ? Math.abs(calculation.result - step.expectedResult) < 0.01
          : true;

      if (!calculation.isValid) {
        allValid = false;
      }

      results.push({
        step: i + 1,
        description: step.description,
        expression: step.expression,
        result: calculation.result,
        verification: calculation.verification,
        isCorrect,
      });
    }

    const finalResult =
      results.length > 0 ? results[results.length - 1].result : 0;

    return {
      totalSteps: steps.length,
      results,
      finalResult,
      allStepsValid: allValid,
    };
  }

  /**
   * Calculate optimal caloric deficit/surplus for goals
   */
  calculateCalorieAdjustment(
    tdee: number,
    goal: 'lose' | 'maintain' | 'gain',
    rate: 'slow' | 'moderate' | 'aggressive' = 'moderate',
  ): {
    targetCalories: number;
    adjustment: number;
    rate: string;
    timeframe: string;
  } {
    const adjustments = {
      lose: {
        slow: -250, // 0.5 lbs/week
        moderate: -500, // 1 lb/week
        aggressive: -750, // 1.5 lbs/week
      },
      maintain: {
        slow: 0,
        moderate: 0,
        aggressive: 0,
      },
      gain: {
        slow: 250, // 0.5 lbs/week
        moderate: 500, // 1 lb/week
        aggressive: 750, // 1.5 lbs/week
      },
    };

    const adjustment = adjustments[goal][rate];
    const targetCalories = tdee + adjustment;

    const timeframes = {
      slow: '0.5 lbs/week',
      moderate: '1 lb/week',
      aggressive: '1.5 lbs/week',
    };

    return {
      targetCalories: Math.round(targetCalories),
      adjustment,
      rate,
      timeframe: timeframes[rate],
    };
  }

  /**
   * Convert between units for international users
   */
  convertUnits = {
    lbsToKg: (pounds: number): number =>
      Math.round(pounds * 0.453592 * 100) / 100,
    kgToLbs: (kg: number): number => Math.round(kg * 2.20462 * 100) / 100,
    inchesToCm: (inches: number): number =>
      Math.round(inches * 2.54 * 100) / 100,
    cmToInches: (cm: number): number => Math.round(cm * 0.393701 * 100) / 100,
    feetAndInchesToCm: (feet: number, inches: number): number => {
      const totalInches = feet * 12 + inches;
      return Math.round(totalInches * 2.54 * 100) / 100;
    },
  };

  /**
   * Calculate body fat percentage using Navy method
   */
  calculateBodyFat(
    gender: 'male' | 'female',
    height: number, // cm
    waist: number, // cm
    neck: number, // cm
    hip?: number, // cm (required for females)
  ): {
    bodyFatPercentage: number;
    method: string;
    category: string;
  } {
    let bodyFat: number;

    if (gender === 'male') {
      bodyFat =
        495 /
          (1.0324 -
            0.19077 * Math.log10(waist - neck) +
            0.15456 * Math.log10(height)) -
        450;
    } else {
      if (!hip)
        throw new Error(
          'Hip measurement required for female body fat calculation',
        );
      bodyFat =
        495 /
          (1.29579 -
            0.35004 * Math.log10(waist + hip - neck) +
            0.221 * Math.log10(height)) -
        450;
    }

    // Determine category
    let category: string;
    if (gender === 'male') {
      if (bodyFat < 6) category = 'Essential fat';
      else if (bodyFat < 14) category = 'Athletes';
      else if (bodyFat < 18) category = 'Fitness';
      else if (bodyFat < 25) category = 'Average';
      else category = 'Obese';
    } else {
      if (bodyFat < 10) category = 'Essential fat';
      else if (bodyFat < 17) category = 'Athletes';
      else if (bodyFat < 25) category = 'Fitness';
      else if (bodyFat < 32) category = 'Average';
      else category = 'Obese';
    }

    return {
      bodyFatPercentage: Math.round(bodyFat * 10) / 10,
      method: 'US Navy',
      category,
    };
  }

  /**
   * Calculate lean body mass
   */
  calculateLeanBodyMass(
    weight: number,
    bodyFatPercentage: number,
  ): {
    leanBodyMass: number;
    fatMass: number;
    leanPercentage: number;
  } {
    const fatMass = weight * (bodyFatPercentage / 100);
    const leanBodyMass = weight - fatMass;
    const leanPercentage = 100 - bodyFatPercentage;

    return {
      leanBodyMass: Math.round(leanBodyMass * 10) / 10,
      fatMass: Math.round(fatMass * 10) / 10,
      leanPercentage: Math.round(leanPercentage * 10) / 10,
    };
  }

  /**
   * Calculate water intake recommendations
   */
  calculateWaterIntake(
    weight: number,
    activityLevel: string,
  ): {
    baseWater: number; // liters
    totalWater: number; // liters
    cups: number; // 8oz cups
  } {
    // Base: 35ml per kg
    const baseWater = (weight * 35) / 1000;

    // Activity adjustment
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.0,
      light: 1.1,
      moderate: 1.2,
      heavy: 1.3,
      extreme: 1.4,
    };

    const multiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.0;
    const totalWater = baseWater * multiplier;

    // Convert to 8oz cups (1 cup = 237ml)
    const cups = (totalWater * 1000) / 237;

    return {
      baseWater: Math.round(baseWater * 10) / 10,
      totalWater: Math.round(totalWater * 10) / 10,
      cups: Math.round(cups),
    };
  }

  /**
   * CONVENIENCE METHODS FOR PROFILE OBJECTS
   * These methods accept user profile objects and extract the necessary data
   */

  /**
   * Calculate BMR from user profile object
   */
  calculateBMRFromProfile(profile: any): BMRCalculation {
    return this.calculateBMR(
      profile.age || 30,
      profile.weight || 70,
      profile.height || 170,
      profile.gender || 'male',
    );
  }

  /**
   * Calculate TDEE from user profile object
   */
  calculateTDEEFromProfile(profile: any): TDEECalculation {
    const bmrResult = this.calculateBMRFromProfile(profile);
    const activityLevel = this.mapActivityLevel(
      profile.activity_level || profile.activityLevel || 'moderate',
    );
    return this.calculateTDEE(bmrResult.bmr, activityLevel);
  }

  /**
   * Map various activity level formats to standard format
   */
  private mapActivityLevel(activityLevel: string): string {
    const mappings: { [key: string]: string } = {
      sedentary: 'sedentary',
      lightly_active: 'light',
      moderately_active: 'moderate',
      very_active: 'heavy',
      extremely_active: 'extreme',
      light: 'light',
      moderate: 'moderate',
      heavy: 'heavy',
      extreme: 'extreme',
    };

    return mappings[activityLevel.toLowerCase()] || 'moderate';
  }

  /**
   * Adjust calories for specific goals
   */
  adjustCaloriesForGoal(
    tdee: number,
    goal: string,
  ): { targetCalories: number; explanation: string } {
    const goalMappings: {
      [key: string]: { multiplier: number; description: string };
    } = {
      lose_weight: {
        multiplier: 0.8,
        description: 'weight loss (20% deficit)',
      },
      maintain_weight: { multiplier: 1.0, description: 'weight maintenance' },
      gain_weight: {
        multiplier: 1.2,
        description: 'weight gain (20% surplus)',
      },
      muscle_gain: {
        multiplier: 1.15,
        description: 'muscle gain (15% surplus)',
      },
      fat_loss: { multiplier: 0.85, description: 'fat loss (15% deficit)' },
      lose: { multiplier: 0.8, description: 'weight loss (20% deficit)' },
      maintain: { multiplier: 1.0, description: 'weight maintenance' },
      gain: { multiplier: 1.2, description: 'weight gain (20% surplus)' },
    };

    const goalConfig =
      goalMappings[goal?.toLowerCase()] || goalMappings.maintain;
    const targetCalories = Math.round(tdee * goalConfig.multiplier);

    return {
      targetCalories,
      explanation: goalConfig.description,
    };
  }

  /**
   * Validate nutrition recommendation for safety
   */
  validateRecommendation(
    profile: any,
    targetCalories: number,
    macros: any,
  ): {
    isSafe: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Basic BMR check
    const bmr = this.calculateBMRFromProfile(profile);
    if (targetCalories < bmr.bmr * 0.8) {
      warnings.push(
        'Target calories are very low - consider increasing to avoid metabolic slowdown',
      );
    }

    // Protein minimum check
    const minProtein = (profile.weight || 70) * 0.8; // 0.8g per kg minimum
    if (macros.protein.grams < minProtein) {
      warnings.push(
        `Protein intake may be too low - consider at least ${Math.round(minProtein)}g`,
      );
    }

    // Fat minimum check
    const minFatPercentage = 20;
    if (macros.fat.percentage < minFatPercentage) {
      warnings.push(
        'Fat percentage may be too low for hormonal health - consider at least 20%',
      );
    }

    return {
      isSafe: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Calculate comprehensive nutrition plan from profile
   */
  calculateComprehensiveNutrition(profile: any): {
    bmr: BMRCalculation;
    tdee: TDEECalculation;
    goalAdjustment: { targetCalories: number; explanation: string };
    macros: MacroDistribution;
    validation: { isSafe: boolean; warnings: string[] };
  } {
    // Calculate BMR and TDEE
    const bmr = this.calculateBMRFromProfile(profile);
    const tdee = this.calculateTDEEFromProfile(profile);

    // Adjust for goals
    const goalAdjustment = this.adjustCaloriesForGoal(
      tdee.tdee,
      profile.goal || 'maintain',
    );

    // Calculate macros (using reasonable defaults)
    const proteinPerKg = 1.6; // 1.6g per kg body weight
    const fatPercentage = 25; // 25% of calories from fat
    const macros = this.calculateMacros(
      goalAdjustment.targetCalories,
      proteinPerKg,
      fatPercentage,
      profile.weight || 70,
    );

    // Validate the recommendation
    const validation = this.validateRecommendation(
      profile,
      goalAdjustment.targetCalories,
      macros,
    );

    return {
      bmr,
      tdee,
      goalAdjustment,
      macros,
      validation,
    };
  }
}

// Export singleton instance
export const nutritionCalculator = new NutritionCalculator();
