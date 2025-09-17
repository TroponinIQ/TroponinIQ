'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Activity,
  Target,
  Brain,
  Calendar,
  Weight,
  Ruler,
  Timer,
  Apple,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useReducer } from 'react';
import { toast } from 'sonner';
import { calculateProfileCompletion } from '@/lib/utils';

interface NutritionProfile {
  id?: string;
  userId?: string;
  preferred_name?: string | null;
  height_feet?: number | null;
  height_inches?: number | null;
  weight_lbs?: number | null;
  body_fat_percentage?: number | null;
  age?: number | null;
  gender?: string | null;
  gender_description?: string | null;
  years_training?: number | null;
  training_time_preference?: string | null;
  current_activity_level?: string | null;
  current_diet?: string | null;
  dietary_restrictions?: string | null;
  supplement_stack?: string | null;
  primary_goal?: string | null;
  timeline_weeks?: number | null;
  target_weight_lbs?: number | null;
  health_conditions?: string | null;
  additional_notes?: string | null;
  enable_profile_agent?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface FormState {
  preferredName: string;
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  bodyFatPercentage: string;
  age: string;
  gender: string;
  genderDescription: string;
  yearsTraining: string;
  trainingTimePreference: string;
  activityLevel: string;
  currentDietDetails: string;
  dietRestrictions: string;
  currentSupplements: string;
  goals: string;
  goalTimeline: string;
  targetWeightLbs: string;
  medicalIssues: string;
  additionalNotes: string;
  enableProfileAgent: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | boolean }
  | { type: 'RESET_FORM' }
  | { type: 'POPULATE_FORM'; profile: NutritionProfile };

const initialFormState: FormState = {
  preferredName: '',
  heightFeet: '',
  heightInches: '',
  weightLbs: '',
  bodyFatPercentage: '',
  age: '',
  gender: '',
  genderDescription: '',
  yearsTraining: '',
  trainingTimePreference: '',
  activityLevel: '',
  currentDietDetails: '',
  dietRestrictions: '',
  currentSupplements: '',
  goals: '',
  goalTimeline: '',
  targetWeightLbs: '',
  medicalIssues: '',
  additionalNotes: '',
  enableProfileAgent: true,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_FORM':
      return initialFormState;
    case 'POPULATE_FORM': {
      const profile = action.profile;
      return {
        preferredName: profile.preferred_name || '',
        heightFeet: profile.height_feet?.toString() || '',
        heightInches: profile.height_inches?.toString() || '',
        weightLbs: profile.weight_lbs?.toString() || '',
        bodyFatPercentage: profile.body_fat_percentage?.toString() || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        genderDescription: profile.gender_description || '',
        yearsTraining: profile.years_training?.toString() || '',
        trainingTimePreference: profile.training_time_preference || '',
        activityLevel: profile.current_activity_level || '',
        currentDietDetails: profile.current_diet || '',
        dietRestrictions: profile.dietary_restrictions || '',
        currentSupplements: profile.supplement_stack || '',
        goals: profile.primary_goal || '',
        goalTimeline: profile.timeline_weeks?.toString() || '',
        targetWeightLbs: profile.target_weight_lbs?.toString() || '',
        medicalIssues: profile.health_conditions || '',
        additionalNotes: profile.additional_notes || '',
        enableProfileAgent: profile.enable_profile_agent !== false,
      };
    }
    default:
      return state;
  }
}

interface AIProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileSaved?: () => void;
}

export function AIProfileDialog({
  open,
  onOpenChange,
  onProfileSaved,
}: AIProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  // Use THE UNIFIED completion calculation
  const profileForCalculation = {
    preferred_name: formState.preferredName?.trim() || null,
    age: formState.age?.trim() ? Number(formState.age) : null,
    weight_lbs: formState.weightLbs?.trim()
      ? Number(formState.weightLbs)
      : null,
    height_feet: formState.heightFeet?.trim()
      ? Number(formState.heightFeet)
      : null,
    height_inches: formState.heightInches?.trim()
      ? Number(formState.heightInches)
      : null,
    gender: formState.gender?.trim() || null,
    current_activity_level: formState.activityLevel?.trim() || null,
    primary_goal: formState.goals?.trim() || null,
    years_training: formState.yearsTraining?.trim()
      ? Number(formState.yearsTraining)
      : null,
    training_time_preference: formState.trainingTimePreference?.trim() || null,
    current_diet: formState.currentDietDetails?.trim() || null,
    dietary_restrictions: formState.dietRestrictions?.trim() || null,
    supplement_stack: formState.currentSupplements?.trim() || null,
    target_weight_lbs: formState.targetWeightLbs?.trim()
      ? Number(formState.targetWeightLbs)
      : null,
    timeline_weeks: formState.goalTimeline?.trim()
      ? Number(formState.goalTimeline)
      : null,
    health_conditions: formState.medicalIssues?.trim() || null,
    additional_notes: formState.additionalNotes?.trim() || null,
    body_fat_percentage: formState.bodyFatPercentage?.trim()
      ? Number(formState.bodyFatPercentage)
      : null,
    enable_profile_agent: formState.enableProfileAgent,
  };

  console.log('DEBUG - Profile for calculation:', profileForCalculation);

  const completionPercentage = calculateProfileCompletion(
    profileForCalculation,
  );

  // Define sections for step-by-step flow
  const sections = [
    {
      id: 'basics',
      title: 'Basic Info',
      icon: User,
      description: 'Essential details for coaching',
    },
    {
      id: 'training',
      title: 'Training',
      icon: Activity,
      description: 'Your fitness background',
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      icon: Apple,
      description: 'Diet and supplement details',
    },
    {
      id: 'goals',
      title: 'Goals',
      icon: Target,
      description: 'What you want to achieve',
    },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        console.error('Failed to load profile - response not ok');
        toast.error('Failed to load profile');
        return;
      }
      const data = await response.json();
      console.log('Profile data received:', data);
      setProfile(data.profile);
      if (data.profile) {
        console.log('Populating form with profile data');
        dispatch({ type: 'POPULATE_FORM', profile: data.profile });
      } else {
        console.log('No profile data received - keeping existing form state');
        // DO NOT reset form if no profile data - keep existing state
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      // DO NOT reset form on error - keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProfile();
    } else {
      // Reset form when dialog closes to prepare for next open
      setTimeout(() => {
        dispatch({ type: 'RESET_FORM' });
        setCurrentSection(0);
      }, 300); // Delay to prevent flash during close animation
    }
  }, [open, fetchProfile]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const profileData = {
        preferred_name: formState.preferredName || null,
        height_feet: formState.heightFeet ? Number(formState.heightFeet) : null,
        height_inches: formState.heightInches
          ? Number(formState.heightInches)
          : null,
        weight_lbs: formState.weightLbs ? Number(formState.weightLbs) : null,
        body_fat_percentage: formState.bodyFatPercentage
          ? Number(formState.bodyFatPercentage)
          : null,
        age: formState.age ? Number(formState.age) : null,
        gender: formState.gender || null,
        gender_description:
          formState.gender === 'other'
            ? formState.genderDescription || null
            : null,
        years_training: formState.yearsTraining
          ? Number(formState.yearsTraining)
          : null,
        training_time_preference: formState.trainingTimePreference || null,
        activity_level: formState.activityLevel || null,
        current_diet_details: formState.currentDietDetails || null,
        diet_restrictions: formState.dietRestrictions || null,
        current_supplements: formState.currentSupplements || null,
        goals: formState.goals || null,
        goal_timeline: formState.goalTimeline
          ? Number(formState.goalTimeline)
          : null,
        target_weight_lbs: formState.targetWeightLbs
          ? Number(formState.targetWeightLbs)
          : null,
        medical_issues: formState.medicalIssues || null,
        additional_notes: formState.additionalNotes || null,
        enable_profile_agent: formState.enableProfileAgent,
      };

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        toast.error('Failed to save profile');
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
      toast.success('Training Profile saved successfully!');

      // Refresh the sidebar profile completion
      if (onProfileSaved) {
        onProfileSaved();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = useCallback(
    (field: keyof FormState, value: string | boolean) => {
      dispatch({ type: 'SET_FIELD', field, value });
      if (field === 'gender' && value !== 'other') {
        dispatch({ type: 'SET_FIELD', field: 'genderDescription', value: '' });
      }
    },
    [],
  );

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderFormSection = () => {
    const baseClasses = 'space-y-6 max-w-2xl mx-auto';

    switch (currentSection) {
      case 0: // Basic Info
        return (
          <div className={baseClasses}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="preferred-name"
                  className="flex items-center gap-2"
                >
                  <User className="size-4" />
                  Preferred Name *
                </Label>
                <Input
                  id="preferred-name"
                  value={formState.preferredName}
                  onChange={(e) => updateField('preferredName', e.target.value)}
                  placeholder="What should I call you?"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  Age *
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="120"
                  value={formState.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  placeholder="25"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formState.gender}
                  onValueChange={(value) => updateField('gender', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formState.gender === 'other' && (
                  <Input
                    value={formState.genderDescription}
                    onChange={(e) =>
                      updateField('genderDescription', e.target.value)
                    }
                    placeholder="Please specify"
                    className="mt-2 h-11"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Weight className="size-4" />
                  Current Weight (lbs) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min="50"
                  max="1000"
                  value={formState.weightLbs}
                  onChange={(e) => updateField('weightLbs', e.target.value)}
                  placeholder="180"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="height-feet"
                  className="flex items-center gap-2"
                >
                  <Ruler className="size-4" />
                  Height (feet) *
                </Label>
                <Input
                  id="height-feet"
                  type="number"
                  min="3"
                  max="8"
                  value={formState.heightFeet}
                  onChange={(e) => updateField('heightFeet', e.target.value)}
                  placeholder="5"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height-inches">Height (inches)</Label>
                <Input
                  id="height-inches"
                  type="number"
                  min="0"
                  max="11"
                  value={formState.heightInches}
                  onChange={(e) => updateField('heightInches', e.target.value)}
                  placeholder="8"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body-fat">
                  Body Fat (%){' '}
                  <span className="text-xs text-muted-foreground">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="body-fat"
                  type="number"
                  min="3"
                  max="50"
                  step="0.1"
                  value={formState.bodyFatPercentage}
                  onChange={(e) =>
                    updateField('bodyFatPercentage', e.target.value)
                  }
                  placeholder="15.0"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Training
        return (
          <div className={baseClasses}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="years-training"
                  className="flex items-center gap-2"
                >
                  <Timer className="size-4" />
                  Years Training
                </Label>
                <Input
                  id="years-training"
                  type="number"
                  min="0"
                  max="50"
                  value={formState.yearsTraining}
                  onChange={(e) => updateField('yearsTraining', e.target.value)}
                  placeholder="2"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-level">Activity Level *</Label>
                <Select
                  value={formState.activityLevel}
                  onValueChange={(value) => updateField('activityLevel', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">
                      Sedentary (desk job, little exercise)
                    </SelectItem>
                    <SelectItem value="lightly_active">
                      Lightly Active (1-3 days/week)
                    </SelectItem>
                    <SelectItem value="moderately_active">
                      Moderately Active (3-5 days/week)
                    </SelectItem>
                    <SelectItem value="very_active">
                      Very Active (6-7 days/week)
                    </SelectItem>
                    <SelectItem value="extremely_active">
                      Extremely Active (2x/day or physical job)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-time">
                Preferred Training Time{' '}
                <span className="text-xs text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formState.trainingTimePreference}
                onValueChange={(value) =>
                  updateField('trainingTimePreference', value)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="When do you prefer to train?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="early_morning">
                    Early Morning (5-7 AM)
                  </SelectItem>
                  <SelectItem value="morning">Morning (7-11 AM)</SelectItem>
                  <SelectItem value="afternoon">
                    Afternoon (11 AM-5 PM)
                  </SelectItem>
                  <SelectItem value="evening">Evening (5-9 PM)</SelectItem>
                  <SelectItem value="late_night">Late Night (9+ PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2: // Nutrition
        return (
          <div className={baseClasses}>
            <div className="space-y-2">
              <Label htmlFor="current-diet" className="flex items-center gap-2">
                <Apple className="size-4" />
                Current Diet
              </Label>
              <Textarea
                id="current-diet"
                value={formState.currentDietDetails}
                onChange={(e) =>
                  updateField('currentDietDetails', e.target.value)
                }
                placeholder="Describe your current eating habits, meal timing, typical foods..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diet-restrictions">
                Dietary Restrictions{' '}
                <span className="text-xs text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="diet-restrictions"
                value={formState.dietRestrictions}
                onChange={(e) =>
                  updateField('dietRestrictions', e.target.value)
                }
                placeholder="Any allergies, intolerances, dietary preferences (vegetarian, keto, etc.) - leave blank if none..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplements">
                Current Supplements{' '}
                <span className="text-xs text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="supplements"
                value={formState.currentSupplements}
                onChange={(e) =>
                  updateField('currentSupplements', e.target.value)
                }
                placeholder="List supplements you're taking (protein, creatine, vitamins, etc.) - leave blank if none..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        );

      case 3: // Goals
        return (
          <div className={baseClasses}>
            <div className="space-y-2">
              <Label htmlFor="goals" className="flex items-center gap-2">
                <Target className="size-4" />
                Primary Goal *
              </Label>
              <Select
                value={formState.goals}
                onValueChange={(value) => updateField('goals', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="What's your main fitness goal?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Lose Weight</SelectItem>
                  <SelectItem value="gain_weight">Gain Weight</SelectItem>
                  <SelectItem value="maintain_weight">
                    Maintain Weight
                  </SelectItem>
                  <SelectItem value="build_muscle">Build Muscle</SelectItem>
                  <SelectItem value="improve_strength">
                    Improve Strength
                  </SelectItem>
                  <SelectItem value="improve_endurance">
                    Improve Endurance
                  </SelectItem>
                  <SelectItem value="general_fitness">
                    General Fitness
                  </SelectItem>
                  <SelectItem value="body_recomposition">
                    Body Recomposition
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-timeline">Timeline (weeks)</Label>
                <Input
                  id="goal-timeline"
                  type="number"
                  min="1"
                  max="104"
                  value={formState.goalTimeline}
                  onChange={(e) => updateField('goalTimeline', e.target.value)}
                  placeholder="12"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-weight">Target Weight (lbs)</Label>
                <Input
                  id="target-weight"
                  type="number"
                  min="50"
                  max="1000"
                  value={formState.targetWeightLbs}
                  onChange={(e) =>
                    updateField('targetWeightLbs', e.target.value)
                  }
                  placeholder="175"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical-issues">
                Health Conditions{' '}
                <span className="text-xs text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="medical-issues"
                value={formState.medicalIssues}
                onChange={(e) => updateField('medicalIssues', e.target.value)}
                placeholder="Any medical conditions, injuries, or health concerns I should know about - leave blank if none..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-notes">
                Additional Notes{' '}
                <span className="text-xs text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="additional-notes"
                value={formState.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
                placeholder="Anything else you'd like me to know to provide better coaching - leave blank if none..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 relative">
          <div className="flex items-center justify-between pr-12">
            <div className="flex items-center gap-3">
              {/* Hide brand icon on mobile/tablet to save space */}
              <div className="hidden lg:flex size-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl items-center justify-center text-primary-foreground shadow-lg">
                <Brain className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Training Profile
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Share your details to get personalized coaching and nutrition
                  recommendations
                </p>
              </div>
            </div>

            {/* Completion Status - Repositioned to avoid close button */}
            <div className="hidden sm:flex items-center gap-3 absolute right-16 top-1/2 -translate-y-1/2">
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {completionPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              {completionPercentage === 100 ? (
                <CheckCircle2 className="size-8 text-green-500" />
              ) : (
                <div className="relative size-8">
                  <svg
                    className="size-8 transform -rotate-90"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-muted/20"
                      strokeWidth="3"
                      fill="none"
                      stroke="currentColor"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${completionPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="size-3 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full size-12 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">
                Loading your profile...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:w-64 bg-muted/30 p-4 flex-col gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Sections</h3>
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === index;
                  return (
                    <button
                      type="button"
                      key={section.id}
                      onClick={() => setCurrentSection(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-4" />
                        <div>
                          <div className="font-medium text-sm">
                            {section.title}
                          </div>
                          <div
                            className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                          >
                            {section.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Mobile Header */}
              <div className="lg:hidden px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(sections[currentSection].icon, {
                      className: 'size-5 text-primary',
                    })}
                    <div>
                      <h2 className="font-semibold">
                        {sections[currentSection].title}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {sections[currentSection].description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {currentSection + 1} of {sections.length}
                    </Badge>
                    <div className="text-sm font-medium text-primary">
                      {completionPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content - Fixed height to prevent jumping */}
              <div className="flex-1 overflow-y-auto">
                <div className="min-h-[500px] p-4 lg:p-6">
                  <div className="transform-none will-change-auto">
                    {renderFormSection()}
                  </div>
                </div>
              </div>

              {/* Footer - Improved mobile layout */}
              <div className="border-t bg-background">
                {profile?.updated_at && (
                  <div className="text-xs text-muted-foreground py-2 text-center border-b">
                    Last updated{' '}
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </div>
                )}

                <div className="p-4 lg:p-6">
                  {/* Mobile Navigation */}
                  <div className="lg:hidden space-y-3 mb-4">
                    <div className="flex gap-2">
                      {currentSection > 0 && (
                        <Button
                          variant="outline"
                          onClick={prevSection}
                          className="flex-1 h-11"
                        >
                          Previous
                        </Button>
                      )}
                      {currentSection < sections.length - 1 && (
                        <Button onClick={nextSection} className="flex-1 h-11">
                          Next
                        </Button>
                      )}
                    </div>
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2">
                      {sections.map((section, index) => (
                        <div
                          key={section.id}
                          className={`h-2 w-8 rounded-full transition-colors ${
                            index === currentSection ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                      className="w-full sm:w-auto sm:min-w-24 h-11 order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="w-full sm:w-auto sm:min-w-32 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg h-11 order-1 sm:order-2"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Saving...
                        </div>
                      ) : (
                        'Save Profile'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
