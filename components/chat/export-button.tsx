'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  content: string;
  filename?: string;
  className?: string;
}

export function ExportButton({
  content,
  filename = 'export',
  className,
}: ExportButtonProps) {
  const exportToCSV = () => {
    try {
      let csvData = '';
      let contentType = 'general';

      // Detect content type and use appropriate conversion
      if (isNutritionPlan(content)) {
        csvData = convertNutritionPlanToCSV(content);
        contentType = 'nutrition plan';
      } else if (isMealPlan(content)) {
        csvData = convertMealPlanToCSV(content);
        contentType = 'meal plan';
      } else if (isWorkoutPlan(content)) {
        csvData = convertWorkoutToCSV(content);
        contentType = 'workout plan';
      } else {
        // Generic structured content export
        csvData = convertStructuredContentToCSV(content);
        contentType = 'content';
      }

      // Validate that we have meaningful data
      const lines = csvData.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error('No structured data found to export');
        return;
      }

      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `${contentType} exported to CSV! (${lines.length - 1} rows)`,
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export content. Please try again.');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      className={className}
      title="Export structured data as CSV for Excel/Sheets"
    >
      <FileSpreadsheet className="w-4 h-4 mr-1" />
      Export to Excel
    </Button>
  );
}

// Content type detection functions
function isNutritionPlan(content: string): boolean {
  return (
    content.includes('Daily Caloric Target') &&
    content.includes('Macronutrient Breakdown') &&
    (content.includes('Protein:') ||
      content.includes('Fat:') ||
      content.includes('Carbs:'))
  );
}

function isMealPlan(content: string): boolean {
  const mealKeywords = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Pre-workout',
    'Post-workout',
  ];
  return (
    mealKeywords.some((keyword) => content.includes(keyword)) &&
    (content.includes('calories') || content.includes('cal'))
  );
}

function isWorkoutPlan(content: string): boolean {
  // More robust detection for workout plans
  const hasWorkoutIndicators =
    content.includes('workout') ||
    content.includes('exercise') ||
    content.includes('training');
  const hasStructuredData =
    content.includes('sets') ||
    content.includes('reps') ||
    content.includes('rest');
  const hasTableStructure =
    content.includes('|') ||
    content.includes('Day') ||
    content.includes('MONDAY') ||
    content.includes('TUESDAY');

  return (hasWorkoutIndicators && hasStructuredData) || hasTableStructure;
}

// Enhanced conversion functions
function convertNutritionPlanToCSV(content: string): string {
  const lines = content.split('\n').filter((line) => line.trim());
  let csv = 'Category,Item,Value,Unit,Details\n';

  // Add program info if available
  const programMatch = content.match(/personalized\s+(\w+)\s+program/i);
  if (programMatch) {
    csv += `Program,Type,${programMatch[1]},program,"Nutrition plan type"\n`;
  }

  // Extract daily caloric target
  const calorieMatch = content.match(
    /Daily Caloric Target:\s*(\d+,?\d*)\s*calories/i,
  );
  if (calorieMatch) {
    const calories = calorieMatch[1].replace(',', '');
    csv += `Calories,Daily Target,${calories},calories/day,"Total daily caloric intake"\n`;
  }

  // Extract macros
  const proteinMatch = content.match(
    /Protein:\s*(\d+)g\s*\((\d+)\s*calories\)/i,
  );
  if (proteinMatch) {
    csv += `Macros,Protein,${proteinMatch[1]},grams,"${proteinMatch[2]} calories"\n`;
  }

  const fatMatch = content.match(/Fat:\s*(\d+)g\s*\((\d+)\s*calories\)/i);
  if (fatMatch) {
    csv += `Macros,Fat,${fatMatch[1]},grams,"${fatMatch[2]} calories"\n`;
  }

  const carbMatch = content.match(/Carbs:\s*(\d+)g\s*\((\d+)\s*calories\)/i);
  if (carbMatch) {
    csv += `Macros,Carbs,${carbMatch[1]},grams,"${carbMatch[2]} calories"\n`;
  }

  // Extract meal schedule
  let currentMeal = '';
  lines.forEach((line) => {
    const trimmed = line.trim();

    // Detect meal headers like "1. Breakfast (6-8 AM): 506 calories"
    const mealMatch = trimmed.match(
      /^(\d+\.?\s*)?(Breakfast|Lunch|Dinner|Pre-workout|Post-workout|Evening).*?\s*(\d+)\s*calories/i,
    );
    if (mealMatch) {
      currentMeal = mealMatch[2];
      const calories = mealMatch[3];
      const timeMatch = trimmed.match(/\(([^)]+)\)/);
      const time = timeMatch ? timeMatch[1] : '';
      csv += `Meals,${currentMeal},${calories},calories,"${time}"\n`;
    }

    // Extract individual macro breakdown for meals
    if (currentMeal && trimmed.match(/^\s*(\d+)g\s*protein/i)) {
      const protein = trimmed.match(/(\d+)g\s*protein/i)?.[1];
      const fat = trimmed.match(/(\d+)g\s*fat/i)?.[1];
      const carbs = trimmed.match(/(\d+)g\s*carbs/i)?.[1];

      if (protein)
        csv += `${currentMeal},Protein,${protein},grams,"Meal breakdown"\n`;
      if (fat) csv += `${currentMeal},Fat,${fat},grams,"Meal breakdown"\n`;
      if (carbs)
        csv += `${currentMeal},Carbs,${carbs},grams,"Meal breakdown"\n`;
    }
  });

  // Add hydration target
  const hydrationMatch = content.match(
    /Hydration Target:\s*Minimum\s*(\d+)\s*oz/i,
  );
  if (hydrationMatch) {
    csv += `Hydration,Daily Target,${hydrationMatch[1]},oz,"Minimum daily water intake"\n`;
  }

  // Add carb cycling info
  if (content.includes('Weekly Carb Cycling')) {
    csv += `Cycling,High Days,Follow plan,days,"M/W/F or as shown"\n`;
    if (content.includes('Reduce carbs by 50%')) {
      csv += `Cycling,Low Days,50% reduction,percent,"T/Th/Sun"\n`;
    }
    if (content.includes('Reduce carbs by 25%')) {
      csv += `Cycling,Medium Days,25% reduction,percent,"Saturday"\n`;
    }
  }

  csv += `\nMeta,Generated,${new Date().toLocaleDateString()},date,"Exported from AI Coach"\n`;
  return csv;
}

function convertMealPlanToCSV(content: string): string {
  const lines = content.split('\n');
  let csv = 'Meal,Time,Food_Item,Portion,Calories,Protein,Carbs,Fat,Notes\n';

  let currentMeal = '';
  let currentTime = '';
  let currentCalories = '';

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Detect meal headers
    if (
      trimmed.match(
        /^(\d+\.?\s*)?(Breakfast|Lunch|Dinner|Snack|Pre-Workout|Post-Workout)/i,
      )
    ) {
      const parts = trimmed.split(':');
      currentMeal = parts[0].replace(/^\d+\.?\s*/, '').trim();
      const timeMatch = trimmed.match(/\(([^)]+)\)/);
      currentTime = timeMatch ? timeMatch[1] : '';
      const calMatch = trimmed.match(/(\d+)\s*cal/i);
      currentCalories = calMatch ? calMatch[1] : '';
    }

    // Detect food items (lines with bullets or numbered lists)
    if (trimmed.match(/^[•\-\*]|^\d+\.|\w+.*\d+.*g/)) {
      const foodItem = trimmed.replace(/^[•\-\*]\s*|^\d+\.\s*/, '').trim();
      csv += `"${currentMeal}","${currentTime}","${foodItem}","","${currentCalories}","","","",""\n`;
    }
  });

  return csv;
}

function convertWorkoutToCSV(content: string): string {
  console.log(`Converting workout content: ${content.substring(0, 200)}...`);

  // Create a DOM parser to handle table structures
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  // Try to extract from HTML table first
  const tables = doc.querySelectorAll('table');
  if (tables.length > 0) {
    return extractFromHTMLTable(tables[0]);
  }

  // If no HTML table, try markdown-style table parsing
  if (content.includes('|')) {
    return extractFromMarkdownTable(content);
  }

  // Fallback to text-based parsing for structured workout content
  return extractFromTextStructure(content);
}

function extractFromHTMLTable(table: Element): string {
  let csv = '';
  const rows = table.querySelectorAll('tr');

  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('th, td');
    const rowData: string[] = [];

    cells.forEach((cell) => {
      // Clean up cell content
      let cellText = cell.textContent?.trim() || '';
      // Escape quotes and wrap in quotes if contains comma
      if (cellText.includes(',') || cellText.includes('"')) {
        cellText = `"${cellText.replace(/"/g, '""')}"`;
      }
      rowData.push(cellText);
    });

    if (rowData.length > 0) {
      csv += `${rowData.join(',')}\n`;
    }
  });

  return csv;
}

function extractFromMarkdownTable(content: string): string {
  const lines = content.split('\n');
  let csv = '';
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip separator lines (|---|---|)
    if (trimmed.match(/^\|[\s\-|:]+\|$/)) {
      continue;
    }

    // Process table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      // Split by | and clean up
      const cells = trimmed
        .split('|')
        .slice(1, -1) // Remove first and last empty elements
        .map((cell) => {
          let cleaned = cell.trim();
          // Escape quotes and wrap if needed
          if (cleaned.includes(',') || cleaned.includes('"')) {
            cleaned = `"${cleaned.replace(/"/g, '""')}"`;
          }
          return cleaned;
        });

      if (cells.length > 0) {
        csv += `${cells.join(',')}\n`;
      }
    } else if (inTable && trimmed === '') {
      // Empty line ends table
      break;
    }
  }

  return csv;
}

function extractFromTextStructure(content: string): string {
  let csv = 'Day,Exercise,Sets_x_Reps,Rest,Notes\n';
  const lines = content.split('\n');
  let currentDay = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect day headers (MONDAY, TUESDAY, etc.)
    const dayMatch = trimmed.match(
      /^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)[\s\-]*(.*)/i,
    );
    if (dayMatch) {
      currentDay = dayMatch[1] + (dayMatch[2] ? ` - ${dayMatch[2]}` : '');
      continue;
    }

    // Detect exercise entries
    if (
      trimmed &&
      !trimmed.toLowerCase().includes('warmup') &&
      !trimmed.toLowerCase().includes('finish')
    ) {
      // Try to extract exercise details
      const exerciseMatch = trimmed.match(
        /^(\d+)?\s*(.+?)\s+(\d+\s*[x×]\s*\d+[-–]?\d*)\s*(.*)$/,
      );
      if (exerciseMatch) {
        const exerciseNum = exerciseMatch[1] || '';
        const exerciseName = exerciseMatch[2].trim();
        const setsReps = exerciseMatch[3].trim();
        const rest = exerciseMatch[4].trim();

        csv += `"${currentDay}","${exerciseNum} ${exerciseName}","${setsReps}","${rest}",""\n`;
      } else if (
        trimmed.includes('x') ||
        trimmed.includes('×') ||
        trimmed.includes('sets') ||
        trimmed.includes('reps')
      ) {
        // Basic fallback parsing
        csv += `"${currentDay}","${trimmed}","","",""\n`;
      }
    }
  }

  return csv;
}

function convertStructuredContentToCSV(content: string): string {
  const lines = content.split('\n').filter((line) => line.trim());
  let csv = 'Type,Content,Details\n';

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Detect structured patterns
    if (trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      csv += `"Data","${key.trim()}","${value}"\n`;
    } else if (trimmed.match(/^[•\-\*]/)) {
      const item = trimmed.replace(/^[•\-\*]\s*/, '');
      csv += `"List Item","${item}",""\n`;
    } else if (trimmed.match(/^\d+\./)) {
      const item = trimmed.replace(/^\d+\.\s*/, '');
      csv += `"Numbered Item","${item}",""\n`;
    } else {
      csv += `"Text","${trimmed.replace(/"/g, '""')}",""\n`;
    }
  });

  csv += `\n"Meta","Generated","${new Date().toLocaleDateString()} - Exported from AI Coach"\n`;
  return csv;
}
