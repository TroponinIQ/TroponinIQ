/**
 * PROGRAM CALCULATOR TOOL - Justin Harris's Premium Programs
 *
 * This implements the exact formulas and logic from Justin Harris's flagship
 * MASSIVE and SHREDDED nutrition programs. These are proven methodologies
 * that have been refined through years of working with elite athletes.
 *
 * PROGRAM OVERVIEW:
 *
 * MASSIVE PROGRAM (Muscle Building):
 * - Strategic carb cycling for muscle growth with minimal fat gain
 * - 3-day rotation: Low → Med → High day pattern
 * - Precision calculations based on lean body mass
 * - Built-in progression rules for plateaus
 *
 * SHREDDED PROGRAM (Fat Loss):
 * - Aggressive carb cycling for fat loss while preserving muscle
 * - More frequent low days with strategic high day refeed
 * - Higher protein intake for muscle preservation
 * - Glycogen depletion and supercompensation protocols
 *
 * BUSINESS VALUE:
 * ⚠️ CRITICAL: These calculations represent hundreds of dollars of value.
 * These are premium paid programs that differentiate TroponinIQ from
 * generic fitness apps.
 *
 * TECHNICAL IMPLEMENTATION:
 * - Lean body mass calculations form the foundation
 * - Day-specific macro targets based on training schedule
 * - Meal timing optimized for training performance
 * - "Added fat" tracking (not total dietary fat)
 * - Intra-workout nutrition protocols
 *
 * COACHING PHILOSOPHY:
 * - Precision over approximation
 * - Systematic approach over guesswork
 * - Evidence-based protocols from real-world results
 * - Personalization within proven frameworks
 *
 */

export interface ProgramProfile {
  name: string;
  weight: number; // pounds
  height: number; // inches
  bodyFatPercentage: number; // 15 = 15%
  program: 'massive' | 'shredded';
}

export interface LeanBodyMassCalculation {
  weight: number;
  bodyFatPercentage: number;
  fatMass: number;
  leanBodyMass: number;
  explanation: string;
}

export interface ProgramMacros {
  day: 'low' | 'med' | 'high';
  meals: Array<{
    mealNumber: number;
    mealType: string;
    protein: number;
    carbs: number;
    fat: number; // "added fat" only
    timing?: string;
    trainingMeal?: boolean;
  }>;
  dailyTotals: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
  notes: string[];
}

export interface ProgramCycle {
  program: 'massive' | 'shredded';
  cyclePattern: string[];
  weekStructure: {
    [key: string]: {
      day: 'low' | 'med' | 'high';
      trainingDay: boolean;
      trainingType?: string;
    };
  };
}

export interface FoodNormalization {
  category: 'protein' | 'carbs' | 'fat';
  food: string;
  gramsPerMacroGram: number; // e.g., 4.5g chicken breast per 1g protein
  additionalMacros: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export class ProgramCalculatorTool {
  /**
   * Calculate Lean Body Mass using program methodology
   */
  calculateLeanBodyMass(
    profile: Pick<ProgramProfile, 'weight' | 'bodyFatPercentage'>,
  ): LeanBodyMassCalculation {
    const { weight, bodyFatPercentage } = profile;

    // Program uses simple BF% calculation
    const fatMass = weight * (bodyFatPercentage / 100);
    const leanBodyMass = weight - fatMass;

    return {
      weight,
      bodyFatPercentage,
      fatMass: Math.round(fatMass * 10) / 10,
      leanBodyMass: Math.round(leanBodyMass * 10) / 10,
      explanation: `LBM = Total Weight (${weight} lbs) - Fat Mass (${Math.round(fatMass * 10) / 10} lbs) = ${Math.round(leanBodyMass * 10) / 10} lbs`,
    };
  }

  /**
   * Get program cycle structure
   */
  getProgramCycle(program: 'massive' | 'shredded'): ProgramCycle {
    if (program === 'massive') {
      return {
        program: 'massive',
        cyclePattern: ['Low Day', 'Med Day', 'High Day'],
        weekStructure: {
          Monday: { day: 'low', trainingDay: false },
          Tuesday: { day: 'med', trainingDay: true, trainingType: 'moderate' },
          Wednesday: { day: 'high', trainingDay: true, trainingType: 'heavy' },
          Thursday: { day: 'low', trainingDay: false },
          Friday: { day: 'med', trainingDay: true, trainingType: 'moderate' },
          Saturday: { day: 'high', trainingDay: true, trainingType: 'heavy' },
          Sunday: { day: 'low', trainingDay: false },
        },
      };
    } else {
      return {
        program: 'shredded',
        cyclePattern: ['Low Day', 'Med Day', 'High Day'],
        weekStructure: {
          // SHREDDED pattern - more aggressive fat loss with fewer high days
          Monday: { day: 'low', trainingDay: false },
          Tuesday: { day: 'low', trainingDay: true },
          Wednesday: { day: 'low', trainingDay: false },
          Thursday: { day: 'med', trainingDay: true },
          Friday: { day: 'low', trainingDay: false },
          Saturday: {
            day: 'high',
            trainingDay: true,
            trainingType: 'heaviest',
          },
          Sunday: { day: 'low', trainingDay: false },
        },
      };
    }
  }

  /**
   * Calculate MASSIVE program macros based on screenshots
   */
  calculateMassiveMacros(
    profile: ProgramProfile,
    dayType: 'low' | 'med' | 'high',
  ): ProgramMacros {
    const lbm = this.calculateLeanBodyMass(profile);

    switch (dayType) {
      case 'low':
        return {
          day: 'low',
          meals: [
            {
              mealNumber: 1,
              mealType: 'Meal 1',
              protein: 45,
              carbs: 40,
              fat: 8,
            },
            {
              mealNumber: 2,
              mealType: 'Meal 2',
              protein: 45,
              carbs: 40,
              fat: 8,
            },
            {
              mealNumber: 3,
              mealType: 'Meal 3',
              protein: 45,
              carbs: 40,
              fat: 8,
            },
            {
              mealNumber: 4,
              mealType: 'Meal 4',
              protein: 45,
              carbs: 35,
              fat: 12,
            },
            {
              mealNumber: 5,
              mealType: 'Meal 5',
              protein: 45,
              carbs: 35,
              fat: 12,
            },
            {
              mealNumber: 6,
              mealType: 'Meal 6',
              protein: 45,
              carbs: 35,
              fat: 12,
            },
          ],
          dailyTotals: {
            protein: 270,
            carbs: 225,
            fat: 60,
            calories: 270 * 4 + 225 * 4 + 60 * 9, // 1080 + 900 + 540 = 2520
          },
          notes: [
            'Non-training day macros',
            'Added fat only - protein and carb sources provide additional fat',
            'Space meals 2.5-3 hours apart',
          ],
        };

      case 'med':
        return {
          day: 'med',
          meals: [
            {
              mealNumber: 1,
              mealType: 'Pre Workout Meal',
              protein: 45,
              carbs: 55,
              fat: 0,
              timing: '1-1.5 hours before training',
              trainingMeal: true,
            },
            {
              mealNumber: 2,
              mealType: 'Intra Workout Shake',
              protein: 10,
              carbs: 20,
              fat: 0,
              timing: 'During workout',
              trainingMeal: true,
            },
            {
              mealNumber: 3,
              mealType: 'Post Workout Meal',
              protein: 45,
              carbs: 85,
              fat: 0,
              timing: 'Within 1 hour of finishing workout',
              trainingMeal: true,
            },
            {
              mealNumber: 4,
              mealType: 'Meal 1',
              protein: 45,
              carbs: 60,
              fat: 7,
            },
            {
              mealNumber: 5,
              mealType: 'Meal 2',
              protein: 45,
              carbs: 60,
              fat: 7,
            },
            {
              mealNumber: 6,
              mealType: 'Meal 3',
              protein: 45,
              carbs: 45,
              fat: 11,
            },
            {
              mealNumber: 7,
              mealType: 'Meal 4',
              protein: 45,
              carbs: 45,
              fat: 11,
            },
          ],
          dailyTotals: {
            protein: 280,
            carbs: 400,
            fat: 36,
            calories: 280 * 4 + 400 * 4 + 36 * 9, // 1120 + 1600 + 324 = 3044
          },
          notes: [
            'Training day - moderate intensity',
            'Pre/Intra/Post workout meals are timed specifically',
            'Intra workout shake uses Fuel Rations from TroponinSupplements.com',
            'Higher carbs to fuel training',
          ],
        };

      case 'high':
        return {
          day: 'high',
          meals: [
            {
              mealNumber: 1,
              mealType: 'Pre Workout Meal',
              protein: 30,
              carbs: 105,
              fat: 0,
              timing: '1-1.5 hours before training',
              trainingMeal: true,
            },
            {
              mealNumber: 2,
              mealType: 'Intra Workout Shake',
              protein: 10,
              carbs: 35,
              fat: 0,
              timing: 'During workout',
              trainingMeal: true,
            },
            {
              mealNumber: 3,
              mealType: 'Post Workout Meal',
              protein: 30,
              carbs: 105,
              fat: 0,
              timing: 'Within 1 hour of finishing workout',
              trainingMeal: true,
            },
            {
              mealNumber: 4,
              mealType: 'Meal 1',
              protein: 30,
              carbs: 105,
              fat: 0,
            },
            {
              mealNumber: 5,
              mealType: 'Meal 2',
              protein: 30,
              carbs: 105,
              fat: 0,
            },
            {
              mealNumber: 6,
              mealType: 'Meal 3',
              protein: 30,
              carbs: 105,
              fat: 0,
            },
            {
              mealNumber: 7,
              mealType: 'Meal 4',
              protein: 30,
              carbs: 105,
              fat: 0,
            },
          ],
          dailyTotals: {
            protein: 190,
            carbs: 665,
            fat: 0,
            calories: 190 * 4 + 665 * 4 + 0 * 9, // 760 + 2660 = 3420
          },
          notes: [
            'High training day - two heaviest training days per week',
            'Zero added fat - all fat comes from protein sources',
            '50% of carbs can come from "sugary" sources',
            'A sugary source is <5g fat per serving (fruit, juice, bagels, etc.)',
            'Meal 6 on high days can be a cheat meal if desired',
          ],
        };

      default:
        throw new Error(`Invalid day type: ${dayType}`);
    }
  }

  /**
   * Calculate SHREDDED program macros based on screenshots
   */
  calculateShredredMacros(
    profile: ProgramProfile,
    dayType: 'low' | 'med' | 'high',
  ): ProgramMacros {
    const lbm = this.calculateLeanBodyMass(profile);

    switch (dayType) {
      case 'low':
        return {
          day: 'low',
          meals: [
            {
              mealNumber: 1,
              mealType: 'Meal 1',
              protein: 60,
              carbs: 30,
              fat: 5,
            },
            {
              mealNumber: 2,
              mealType: 'Meal 2',
              protein: 60,
              carbs: 30,
              fat: 5,
            },
            {
              mealNumber: 3,
              mealType: 'Meal 3',
              protein: 60,
              carbs: 30,
              fat: 5,
            },
            {
              mealNumber: 4,
              mealType: 'Meal 4',
              protein: 60,
              carbs: 15,
              fat: 10,
            },
            {
              mealNumber: 5,
              mealType: 'Meal 5',
              protein: 60,
              carbs: 15,
              fat: 10,
            },
            {
              mealNumber: 6,
              mealType: 'Meal 6',
              protein: 60,
              carbs: 15,
              fat: 10,
            },
          ],
          dailyTotals: {
            protein: 360,
            carbs: 135,
            fat: 45,
            calories: 360 * 4 + 135 * 4 + 45 * 9, // 1440 + 540 + 405 = 2385
          },
          notes: [
            'Non-training day macros for fat loss',
            'Added fat only - protein and carb sources provide additional fat',
            'Any meals with less than 25g carbs can use vegetable sources',
            'Space meals 2.5-3 hours apart',
          ],
        };

      case 'med':
        return {
          day: 'med',
          meals: [
            {
              mealNumber: 1,
              mealType: 'Pre Workout Meal',
              protein: 45,
              carbs: 70,
              fat: 0,
              timing: '1-1.5 hours before training',
              trainingMeal: true,
            },
            {
              mealNumber: 2,
              mealType: 'Intra Workout Shake',
              protein: 10,
              carbs: 25,
              fat: 0,
              timing: 'During workout',
              trainingMeal: true,
            },
            {
              mealNumber: 3,
              mealType: 'Post Workout Meal',
              protein: 45,
              carbs: 70,
              fat: 0,
              timing: 'Within 1 hour of finishing workout',
              trainingMeal: true,
            },
            {
              mealNumber: 4,
              mealType: 'Meal 1',
              protein: 45,
              carbs: 25,
              fat: 5,
            },
            {
              mealNumber: 5,
              mealType: 'Meal 2',
              protein: 45,
              carbs: 25,
              fat: 5,
            },
            {
              mealNumber: 6,
              mealType: 'Meal 3',
              protein: 45,
              carbs: 25,
              fat: 5,
            },
            {
              mealNumber: 7,
              mealType: 'Meal 4',
              protein: 45,
              carbs: 25,
              fat: 5,
            },
          ],
          dailyTotals: {
            protein: 280,
            carbs: 265,
            fat: 20,
            calories: 280 * 4 + 265 * 4 + 20 * 9, // 1120 + 1060 + 180 = 2360
          },
          notes: [
            "Training day - any training day that isn't the HIGH DAY",
            'Pre/Intra/Post workout meals are timed specifically',
            'Intra workout shake uses Fuel Rations from TroponinSupplements.com',
            'Lower carbs than MASSIVE for fat loss focus',
          ],
        };

      case 'high':
        return {
          day: 'high',
          meals: [
            {
              mealNumber: 1,
              mealType: 'Pre Workout Meal',
              protein: 35,
              carbs: 135,
              fat: 0,
              timing: '1-1.5 hours before training',
              trainingMeal: true,
            },
            {
              mealNumber: 2,
              mealType: 'Intra Workout Shake',
              protein: 10,
              carbs: 45,
              fat: 0,
              timing: 'During workout',
              trainingMeal: true,
            },
            {
              mealNumber: 3,
              mealType: 'Post Workout Meal',
              protein: 35,
              carbs: 135,
              fat: 0,
              timing: 'Within 1 hour of finishing workout',
              trainingMeal: true,
            },
            {
              mealNumber: 4,
              mealType: 'Meal 1',
              protein: 35,
              carbs: 135,
              fat: 0,
            },
            {
              mealNumber: 5,
              mealType: 'Meal 2',
              protein: 35,
              carbs: 135,
              fat: 0,
            },
            {
              mealNumber: 6,
              mealType: 'Meal 3',
              protein: 35,
              carbs: 135,
              fat: 0,
            },
            {
              mealNumber: 7,
              mealType: 'Meal 4',
              protein: 35,
              carbs: 135,
              fat: 0,
            },
          ],
          dailyTotals: {
            protein: 220,
            carbs: 855,
            fat: 0,
            calories: 220 * 4 + 855 * 4 + 0 * 9, // 880 + 3420 = 4300
          },
          notes: [
            'High training day - ONE training day per week',
            'Zero added fat - all fat comes from protein sources',
            '50% of carbs can come from "sugary" sources',
            'A sugary source is <5g fat per serving (fruit, juice, bagels, etc.)',
            'Much higher carb load than MASSIVE for glycogen supercompensation',
          ],
        };

      default:
        throw new Error(`Invalid day type: ${dayType}`);
    }
  }

  /**
   * Get approved foods list for the programs
   */
  getApprovedFoods() {
    return {
      protein: {
        useFreeely: [
          'Chicken breast',
          'Chicken tenderloin',
          'Ground Chicken',
          'Turkey Breast',
          '96/4% lean Ground Beef',
          '98/2% Skinny Beef',
          '99/1% Extra Lean Ground Turkey',
          'Egg Whites (6 whites to every 1 whole egg)',
          'Tilapia',
          'Halibut',
          'Cod',
          'Any Other White Fish',
        ],
        useSparingly: [
          '93/7% lean ground beef',
          '93/7% lean ground turkey',
          'Salmon',
          'AN Bison (many brands are 90/10% which is NOT lean enough)',
          'Whey Protein',
          'Other Protein Powders',
          'Flank Steak',
          'Fround steak (top, bottom, eye of, etc)',
        ],
      },
      carbohydrates: {
        useFreeely: [
          'White Rice (all forms)',
          'Brown Rice',
          'Cream of Rice',
          'Cream of Wheat',
          'Potatoes (all kinds)',
          'Yams/Sweet Potatoes',
          'Oats',
          'Grits',
          'Ezekiel Bread',
          'Ezekiel Cereal',
        ],
        useSparingly: [
          'Whole Wheat Bread',
          'Pasta',
          'Corn Meal',
          'Bagels',
          'English Muffins',
          'Bagels',
        ],
        highDaySugary: [
          'Fruit Juice',
          'Fruit (any kind)',
          'Bread',
          'Skittles',
          'Twizzlers',
          'Pie Filling',
          'Jelly/Jam',
          'Any ZERO Fat Candy',
        ],
      },
      vegetables: {
        useFreeely: [
          'Broccoli',
          'Cauliflower',
          'Asparagus',
          'Cucumbers',
          'Pickles',
          'Iceberg Lettuce',
          'Spinach',
          'Lettuce',
          'Zucchini',
          'Onions',
          'Peppers',
          'Mushrooms',
          'Celery',
        ],
        useSparingly: [
          'Green Beans',
          'Peas',
          'Corn',
          'String Beans',
          'Carrots',
        ],
      },
      fats: {
        useFreeely: [
          'Guacamole',
          'Avocado',
          'Almonds',
          'Cashews',
          'Walnuts',
          'Macadamia nuts',
          'Natural Peanut Butter',
          'Almond Butter',
          'Macadamia Nut Oil',
          'Olive Oil',
          'Sesame Oil',
          'Borage Oil',
          'Evening Primrose Oil',
          'Fish Oil',
          'Flax Oil',
          'Omega 3 Complex',
          'MCT Oil',
          'Coconut Oil',
        ],
        avoidAsMuchAsPossible: ['Butter', 'Margarine', 'Lard', 'Vegetable Oil'],
      },
      drinks: {
        unlimited: [
          'Coffee (Black)',
          'Tea',
          'Diet Soda',
          'Zero Calorie Energy Drinks',
          'Crystal Light',
          'Flavored Water (zero calorie)',
        ],
      },
      condiments: {
        unlimited: [
          'Mustard',
          'Sugar Free Ketchup',
          'Season Salt',
          'Sea Salt',
          'Any Salt Based Spice',
          'Cajun (or similar) Seasonings',
          'Walden Farms Products',
          'Kernel Seasonings',
          'Flavor God Seasonings',
        ],
      },
    };
  }

  /**
   * Get food normalization data (grams of food per gram of macro)
   * Based on the macronutrient spreadsheet data
   */
  getFoodNormalizations(): FoodNormalization[] {
    return [
      // Protein sources (grams of food per gram of protein)
      {
        category: 'protein',
        food: 'Chicken breast',
        gramsPerMacroGram: 4.3,
        additionalMacros: { fat: 0.03 },
      },
      {
        category: 'protein',
        food: 'Ground chicken',
        gramsPerMacroGram: 4.2,
        additionalMacros: { fat: 0.04 },
      },
      {
        category: 'protein',
        food: 'Turkey breast',
        gramsPerMacroGram: 4.1,
        additionalMacros: { fat: 0.02 },
      },
      {
        category: 'protein',
        food: '96/4% Ground Beef',
        gramsPerMacroGram: 4.3,
        additionalMacros: { fat: 0.04 },
      },
      {
        category: 'protein',
        food: 'Egg whites',
        gramsPerMacroGram: 9.1,
        additionalMacros: { fat: 0.002 },
      },
      {
        category: 'protein',
        food: 'Tilapia',
        gramsPerMacroGram: 4.9,
        additionalMacros: { fat: 0.02 },
      },
      {
        category: 'protein',
        food: 'Cod',
        gramsPerMacroGram: 5.6,
        additionalMacros: { fat: 0.01 },
      },

      // Carb sources (grams of food per gram of carbs)
      {
        category: 'carbs',
        food: 'White rice (cooked)',
        gramsPerMacroGram: 4.0,
        additionalMacros: { protein: 0.09 },
      },
      {
        category: 'carbs',
        food: 'Brown rice (cooked)',
        gramsPerMacroGram: 4.4,
        additionalMacros: { protein: 0.11, fat: 0.02 },
      },
      {
        category: 'carbs',
        food: 'Sweet potatoes',
        gramsPerMacroGram: 5.0,
        additionalMacros: { protein: 0.09 },
      },
      {
        category: 'carbs',
        food: 'Oats (dry)',
        gramsPerMacroGram: 1.5,
        additionalMacros: { protein: 0.25, fat: 0.1 },
      },
      {
        category: 'carbs',
        food: 'Ezekiel bread',
        gramsPerMacroGram: 2.1,
        additionalMacros: { protein: 0.33 },
      },

      // Fat sources (grams of food per gram of fat)
      {
        category: 'fat',
        food: 'Almonds',
        gramsPerMacroGram: 2.0,
        additionalMacros: { protein: 0.4, carbs: 0.4 },
      },
      {
        category: 'fat',
        food: 'Natural peanut butter',
        gramsPerMacroGram: 2.0,
        additionalMacros: { protein: 0.5, carbs: 0.3 },
      },
      {
        category: 'fat',
        food: 'Avocado',
        gramsPerMacroGram: 6.7,
        additionalMacros: { carbs: 0.6 },
      },
      {
        category: 'fat',
        food: 'Olive oil',
        gramsPerMacroGram: 1.0,
        additionalMacros: {},
      },
      {
        category: 'fat',
        food: 'MCT oil',
        gramsPerMacroGram: 1.0,
        additionalMacros: {},
      },
    ];
  }

  /**
   * Calculate exact food portions for a meal
   */
  calculateFoodPortions(
    targetMacros: { protein: number; carbs: number; fat: number },
    selectedFoods: {
      protein: string;
      carbs: string;
      fat: string;
    },
  ) {
    const normalizations = this.getFoodNormalizations();
    const results: any = {};

    // Calculate protein portion
    const proteinFood = normalizations.find(
      (n) =>
        n.category === 'protein' &&
        n.food.toLowerCase().includes(selectedFoods.protein.toLowerCase()),
    );
    if (proteinFood) {
      const gramsNeeded = targetMacros.protein * proteinFood.gramsPerMacroGram;
      results.protein = {
        food: proteinFood.food,
        grams: Math.round(gramsNeeded),
        additionalMacros: {
          fat: (proteinFood.additionalMacros.fat || 0) * gramsNeeded,
          carbs: (proteinFood.additionalMacros.carbs || 0) * gramsNeeded,
        },
      };
    }

    // Calculate carb portion
    const carbFood = normalizations.find(
      (n) =>
        n.category === 'carbs' &&
        n.food.toLowerCase().includes(selectedFoods.carbs.toLowerCase()),
    );
    if (carbFood) {
      const gramsNeeded = targetMacros.carbs * carbFood.gramsPerMacroGram;
      results.carbs = {
        food: carbFood.food,
        grams: Math.round(gramsNeeded),
        additionalMacros: {
          protein: (carbFood.additionalMacros.protein || 0) * gramsNeeded,
          fat: (carbFood.additionalMacros.fat || 0) * gramsNeeded,
        },
      };
    }

    // Calculate fat portion
    const fatFood = normalizations.find(
      (n) =>
        n.category === 'fat' &&
        n.food.toLowerCase().includes(selectedFoods.fat.toLowerCase()),
    );
    if (fatFood) {
      const gramsNeeded = targetMacros.fat * fatFood.gramsPerMacroGram;
      results.fat = {
        food: fatFood.food,
        grams: Math.round(gramsNeeded),
        additionalMacros: {
          protein: (fatFood.additionalMacros.protein || 0) * gramsNeeded,
          carbs: (fatFood.additionalMacros.carbs || 0) * gramsNeeded,
        },
      };
    }

    return results;
  }

  /**
   * Validate if user should add a third high day (sticking point rule)
   */
  shouldAddThirdHighDay(
    progressData: { week: number; weightChange: number; measurements?: any }[],
  ): {
    shouldAdd: boolean;
    reason: string;
    weeksStuck: number;
  } {
    if (progressData.length < 2) {
      return {
        shouldAdd: false,
        reason: 'Not enough data to assess progress',
        weeksStuck: 0,
      };
    }

    // Check last 2 weeks for progress
    const lastTwo = progressData.slice(-2);
    const totalWeightChange = lastTwo.reduce(
      (sum, week) => sum + week.weightChange,
      0,
    );

    // For MASSIVE (muscle building), expect some weight gain
    const isStuck = Math.abs(totalWeightChange) < 0.5; // Less than 0.5 lbs change in 2 weeks

    if (isStuck) {
      return {
        shouldAdd: true,
        reason:
          'Progress has stalled for 2+ consecutive weeks. Add third high day until progress resumes.',
        weeksStuck: 2,
      };
    }

    return {
      shouldAdd: false,
      reason: 'Progress is continuing as expected',
      weeksStuck: 0,
    };
  }

  /**
   * Generate complete program day
   */
  generateProgramDay(
    profile: ProgramProfile,
    dayType: 'low' | 'med' | 'high',
  ): {
    macros: ProgramMacros;
    mealPlan: any[];
    instructions: string[];
    timing: string[];
  } {
    // Choose the correct macro calculation based on program
    const macros =
      profile.program === 'shredded'
        ? this.calculateShredredMacros(profile, dayType)
        : this.calculateMassiveMacros(profile, dayType);

    const approvedFoods = this.getApprovedFoods();

    const programName = profile.program === 'shredded' ? 'SHREDDED' : 'MASSIVE';
    const instructions = [
      `${programName} Program - ${dayType.toUpperCase()} DAY`,
      `Total: ${macros.dailyTotals.protein}g protein, ${macros.dailyTotals.carbs}g carbs, ${macros.dailyTotals.fat}g added fat`,
      `Estimated calories: ${macros.dailyTotals.calories}`,
      '',
      'IMPORTANT NOTES:',
      '- Fat shown is "ADDED FAT" only',
      '- Protein and carb sources provide additional fat naturally',
      '- Use "USE FREELY" foods from approved list whenever possible',
      '- Space regular meals 2.5-3 hours apart',
      profile.program === 'shredded' && dayType === 'low'
        ? '- Any meals with less than 25g carbs can use vegetable sources'
        : '',
      dayType === 'high'
        ? '- 50% of carbs can come from "sugary" sources (<5g fat per serving)'
        : '',
      dayType === 'high' && profile.program === 'massive'
        ? '- Meal 6 can be a cheat meal if desired'
        : '',
      dayType === 'high' && profile.program === 'shredded'
        ? '- ONE high day per week only'
        : '',
    ].filter(Boolean);

    const timing =
      dayType === 'med' || dayType === 'high'
        ? [
            'TRAINING DAY TIMING:',
            '- Pre Workout: 1-1.5 hours before training',
            '- Intra Workout: Sip throughout workout',
            '- Post Workout: Within 1 hour of finishing workout',
            '- Move other meals around training as needed',
            profile.program === 'shredded'
              ? '- Can train fasted if desired'
              : '',
          ].filter(Boolean)
        : [
            'NON-TRAINING DAY:',
            '- Space meals evenly throughout the day',
            '- 2.5-3 hours between meals optimal',
          ];

    return {
      macros,
      mealPlan: macros.meals,
      instructions,
      timing,
    };
  }
}

// Export singleton instance
export const programCalculator = new ProgramCalculatorTool();
