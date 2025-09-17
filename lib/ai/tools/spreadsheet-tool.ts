/**
 * SPREADSHEET TOOL - Simple CSV Generation for Downloads
 *
 * Lightweight tool focused on generating CSV exports for the download API.
 * Simplified and scalable approach.
 */

export interface NutritionSummary {
  userInfo: {
    name?: string;
    age: number;
    weight: number;
    height: number;
    gender: string;
    goal: string;
    activityLevel: string;
  };
  calculations: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  };
  mealPlan?: any[];
  generatedDate: string;
}

export class SpreadsheetTool {
  /**
   * Generate nutrition summary CSV
   */
  generateNutritionSummaryCSV(summary: NutritionSummary): string {
    const lines: string[] = [];

    lines.push('NUTRITION PLAN SUMMARY');
    lines.push(`Generated: ${summary.generatedDate}`);
    lines.push('');

    // User info
    lines.push('USER INFORMATION');
    lines.push(`Name,${summary.userInfo.name || 'User'}`);
    lines.push(`Age,${summary.userInfo.age} years`);
    lines.push(`Weight,${summary.userInfo.weight} lbs`);
    lines.push(`Height,${summary.userInfo.height} inches`);
    lines.push(`Gender,${summary.userInfo.gender}`);
    lines.push(`Goal,${summary.userInfo.goal}`);
    lines.push(`Activity Level,${summary.userInfo.activityLevel}`);
    lines.push('');

    // Calculations
    lines.push('NUTRITION CALCULATIONS');
    lines.push(`BMR,${summary.calculations.bmr} calories`);
    lines.push(`TDEE,${summary.calculations.tdee} calories`);
    lines.push(
      `Target Calories,${summary.calculations.targetCalories} calories`,
    );
    lines.push(`Protein,${summary.calculations.proteinGrams}g`);
    lines.push(`Carbs,${summary.calculations.carbGrams}g`);
    lines.push(`Fat,${summary.calculations.fatGrams}g`);

    return lines.join('\n');
  }

  /**
   * Generate progress tracking template
   */
  generateProgressTrackingTemplate(): string {
    const lines: string[] = [];

    lines.push('Date,Weight,Body_Fat_%,Chest,Waist,Hips,Arms,Thighs,Notes');
    lines.push(
      `${new Date().toLocaleDateString()},,,,,,,,"Starting measurements"`,
    );

    // Add 4 weeks of empty rows for tracking
    for (let i = 1; i <= 28; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      lines.push(
        `${date.toLocaleDateString()},,,,,,,,"Week ${Math.ceil(i / 7)} Day ${((i - 1) % 7) + 1}"`,
      );
    }

    return lines.join('\n');
  }

  /**
   * Generate macro tracking template
   */
  generateMacroTrackingTemplate(
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number,
  ): string {
    const lines: string[] = [];

    lines.push(
      'Date,Target_Calories,Actual_Calories,Target_Protein,Actual_Protein,Target_Carbs,Actual_Carbs,Target_Fat,Actual_Fat,Adherence_%,Notes',
    );

    // Add 2 weeks of tracking rows
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      lines.push(
        `${date.toLocaleDateString()},${targetCalories},,${targetProtein},,${targetCarbs},,${targetFat},,,,"Day ${i + 1}"`,
      );
    }

    return lines.join('\n');
  }

  /**
   * Generate detailed meal plan template
   */
  generateDetailedMealPlanTemplate(): string {
    const lines: string[] = [];

    lines.push('MEAL PLANNING TEMPLATE');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push(
      'Day,Meal,Time,Food_Item,Amount,Calories,Protein_g,Carbs_g,Fat_g,Notes',
    );

    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const meals = [
      'Breakfast',
      'Snack 1',
      'Lunch',
      'Snack 2',
      'Pre-Workout',
      'Post-Workout',
      'Dinner',
    ];

    days.forEach((day) => {
      meals.forEach((meal) => {
        lines.push(`${day},${meal},,,,,,,,`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Generate meal plan CSV from meal data
   */
  generateMealPlanCSV(mealPlan: any[]): string {
    const lines: string[] = [];
    lines.push('Day,Meal,Food,Amount,Calories,Protein,Carbs,Fat,Notes');

    mealPlan.forEach((item) => {
      lines.push(
        `${item.day || ''},${item.meal || ''},${item.food || ''},${item.amount || ''},${item.calories || 0},${item.protein || 0},${item.carbs || 0},${item.fat || 0},${item.notes || ''}`,
      );
    });

    return lines.join('\n');
  }

  /**
   * Generate shopping list CSV
   */
  generateShoppingListCSV(mealPlan: any[]): string {
    const lines: string[] = [];
    lines.push('SHOPPING LIST');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('Category,Item,Estimated_Amount');

    // Extract unique food items
    const foods = [
      ...new Set(mealPlan.map((item) => item.food).filter(Boolean)),
    ];

    foods.forEach((food) => {
      lines.push(`Food,${food},As needed`);
    });

    return lines.join('\n');
  }

  /**
   * Generate weekly summary CSV
   */
  generateWeeklySummaryCSV(weekData: any): string {
    const lines: string[] = [];
    lines.push('WEEKLY SUMMARY');
    lines.push(
      `Week Starting: ${weekData.weekStartDate || new Date().toLocaleDateString()}`,
    );
    lines.push('');
    lines.push('Metric,Value,Unit');
    lines.push(
      `Average Calories,${weekData.averageCalories || 0},calories/day`,
    );
    lines.push(`Average Protein,${weekData.averageProtein || 0},grams/day`);
    lines.push(`Average Carbs,${weekData.averageCarbs || 0},grams/day`);
    lines.push(`Average Fat,${weekData.averageFat || 0},grams/day`);
    lines.push(`Adherence Rate,${weekData.adherenceRate || 0},%`);

    if (weekData.weightChange !== undefined) {
      lines.push(`Weight Change,${weekData.weightChange},lbs`);
    }

    return lines.join('\n');
  }

  /**
   * Generate analysis report
   */
  generateAnalysisReport(data: any): string {
    const lines: string[] = [];
    lines.push('NUTRITION ANALYSIS REPORT');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');

    if (data.userProfile) {
      lines.push('USER PROFILE');
      lines.push(`Age,${data.userProfile.age || 'N/A'} years`);
      lines.push(`Weight,${data.userProfile.weight || 'N/A'} lbs`);
      lines.push(`Goal,${data.userProfile.goal || 'N/A'}`);
      lines.push('');
    }

    if (data.recommendations) {
      lines.push('RECOMMENDATIONS');
      data.recommendations.forEach((rec: string, index: number) => {
        lines.push(`${index + 1},${rec}`);
      });
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const spreadsheetTool = new SpreadsheetTool();
