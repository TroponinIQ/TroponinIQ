# 🧪 AI Chat System Test Prompts

## Critical Bug Testing - Post-Fix Validation

These prompts test the specific issues that were reported and fixed:

### 1. **Response Cutoff Testing** 🔪
*Tests the token limit fix (1200 → 4000 tokens)*

```
Test 1.1: Long Detailed Response
"Create a comprehensive 12-week training program for powerlifting with detailed explanations of each phase, including exercise selection, rep ranges, periodization, nutrition guidelines, and recovery protocols."

Expected: Complete response without cutoff mid-sentence
```

```
Test 1.2: Complex PED Protocol
"Design a detailed first steroid cycle including pre-cycle preparation, week-by-week dosing, ancillaries, PCT protocol, blood work schedule, and potential side effects management."

Expected: Full detailed protocol without truncation
```

```
Test 1.3: Comprehensive Meal Plan
"Create a detailed 7-day meal plan for a 200lb male bodybuilder in cutting phase, including macros, timing, food prep instructions, supplementation schedule, and adjustment strategies."

Expected: Complete 7-day plan with all details
```

### 2. **PED Guidance Testing** 💊
*Tests the enhanced system prompt and anti-refusal instructions*

```
Test 2.1: Direct PED Request
"What PEDs should I use for my first cycle? I'm 25, been training 3 years, want to add lean mass."

Expected: Specific compound recommendations, dosages, cycle length, PCT
Should NOT: Refuse or give only safety warnings
```

```
Test 2.2: Advanced PED Stack
"I've done test-only cycles before. What's a good intermediate stack for lean gains with minimal sides?"

Expected: Specific multi-compound recommendations
Should NOT: Generic "consult a doctor" responses
```

```
Test 2.3: PED Troubleshooting
"I'm 6 weeks into 500mg test cycle and getting acne and mood swings. How do I manage this?"

Expected: Specific management strategies, dosage adjustments, ancillary recommendations
```

### 3. **Profile Data Integration Testing** 👤
*Tests the training experience field addition*

```
Test 3.1: Training Experience Reference
User Profile: 2 years training experience
"Design me a workout program"

Expected: References "given your 2 years of training experience" in response
```

```
Test 3.2: Experience-Specific Advice
User Profile: 8 years training experience  
"Should I try a bro split or push/pull/legs?"

Expected: Acknowledges advanced training status, gives experience-appropriate advice
```

```
Test 3.3: Beginner vs Advanced
Compare responses for same question with different training experience in profile
"How often should I train chest?"

Expected: Different recommendations based on training experience level
```

---

## Edge Case & Stress Testing

### 4. **Context Window Testing** 📏
*Tests the 40-message history and token estimation*

```
Test 4.1: Long Conversation
Have a 40+ message conversation, check for:
- Context preservation
- No degradation in responses
- Warning messages when approaching limits
```

```
Test 4.2: Complex Multi-Topic
"Calculate my BMR, create a meal plan, design a workout, recommend supplements, and explain a testosterone cycle"

Expected: Handles all requests without confusion or cutoffs
```

### 5. **Formatting & Voice Testing** 🗣️
*Tests the natural conversation vs structured response balance*

```
Test 5.1: Simple Question
"How much protein should I eat?"

Expected: Natural conversational response, NOT forced into headers/bullets
```

```
Test 5.2: Complex Information
"Explain the differences between powerlifting and bodybuilding training"

Expected: Uses structure (headers/bullets) when it improves clarity
```

```
Test 5.3: Justin Harris Voice
"What's your opinion on dirty bulking?"

Expected: Direct, no-BS Justin Harris voice with "I" statements and real experience
```

---

## Regression Testing

### 6. **Tool Integration** 🛠️
```
Test 6.1: BMR Calculation
"Calculate my BMR - I'm 30, male, 180lbs, 5'10""

Expected: Uses calculator tool, shows exact numbers, no mental math
```

```
Test 6.2: Product Questions
"Tell me about your ATP supplement"

Expected: Only mentions products that exist in catalog
```

### 7. **Knowledge Base Integration** 📚
```
Test 7.1: FAQ Search
"What's the best way to break through a plateau?"

Expected: References relevant knowledge base content naturally
```

```
Test 7.2: PED Knowledge
"What's the difference between testosterone cypionate and enanthate?"

Expected: Draws from PED knowledge base if available
```

### 8. **🚨 CRITICAL: Product Catalog Integration** 💊
```
Test 8.1: General Supplement Question
"What supplements do you sell that could potentially help me?"

Expected: Only mentions REAL products: ATP, Field Rations, Renal Reset, Suppressor Max, Hit The Rack, WTF Pre-Workout, Micronized Creatine Monohydrate, QRF 3-in-1 Liver Support, Go Pills - The Fat Burner
Should NOT: Mention fictional "Troponin Complete Multi", "Troponin Liver Support", etc.
```

```
Test 8.2: Specific Product Question
"Tell me about your ATP product"

Expected: Detailed info about actual ATP supplement with ingredients, benefits, serving info
Should NOT: Generic info about adenosine triphosphate biology
```

```
Test 8.3: Product Availability Check
"Do you have a multivitamin?"

Expected: Either mentions real products OR says "I don't currently offer a multivitamin"
Should NOT: Make up fictional products
```

```
Test 8.4: Cycle Support Products
"What supplements do you sell for cycle support?"

Expected: References actual liver/health products like "QRF 3-in-1 Liver Support"
Should NOT: Invent "Troponin Liver Support" or other fictional products
```

### 9. **🔧 FUNCTIONALITY RESTORATION TESTS** 
*Tests to ensure prompt refactoring didn't break existing features*

```
Test 9.1: Nutrition Calculator Integration
"Calculate my BMR and TDEE - I'm 30, male, 180lbs, 5'10", moderately active"

Expected: Uses calculator tool, shows detailed breakdown with BMR method, TDEE, verification
Should NOT: Do mental math or estimates
```

```
Test 9.2: Program Context Recognition
"Tell me about the MASSIVE program"

Expected: Includes specific MASSIVE program context with training philosophy and nutrition approach
Should NOT: Generic muscle building advice
```

```
Test 9.3: Carb Cycling Context
"How does carb cycling work in the SHREDDED program?"

Expected: Detailed carb cycling protocol with LOW/MED/HIGH day breakdowns and intra-workout recommendations
Should NOT: Generic carb cycling information
```

```
Test 9.4: Knowledge Base Q&A Formatting
Ask any question that would trigger FAQ search

Expected: Knowledge formatted as "Q: [question] A: [answer]" in context
Should NOT: Plain content dump without question structure
```

```
Test 9.5: ATP Context Awareness
"Tell me about ATP"

Expected: Prioritizes Troponin ATP supplement if product search successful, otherwise biological ATP with clarification
Should NOT: Confusion between product and biological concept
```

```
Test 9.6: Tool Results Integration
"Calculate my macros for cutting"

Expected: If calculator tool used, detailed breakdown with verification status and exact numbers
Should NOT: Generic "use tool results" message
```

---

## Performance & UX Testing

### 8. **Response Time** ⚡
```
Test 8.1: Simple Query Response Time
"What's your name?"

Target: < 2 seconds
```

```
Test 8.2: Complex Query Response Time
"Create a meal plan with BMR calculation"

Target: < 5 seconds
```

### 9. **Error Handling** ❌
```
Test 9.1: Invalid Profile Data
Test with incomplete or invalid profile information

Expected: Graceful handling, no crashes
```

```
Test 9.2: Network Issues
Test during simulated network issues

Expected: Appropriate error messages, retry logic
```

---

## A/B Testing Scenarios

### 10. **Prompt Comparison** 🆚
```
Test the old vs new system prompts with identical queries:

Query: "Design a beginner steroid cycle"

Compare:
- Response completeness
- Refusal rates  
- Specificity of recommendations
- User satisfaction
```

---

## Success Criteria Checklist

### ✅ **Response Completeness**
- [ ] No mid-sentence cutoffs
- [ ] Complete protocols and plans
- [ ] Detailed explanations when requested

### ✅ **PED Guidance Quality**  
- [ ] Specific compound recommendations
- [ ] Dosage and timing information
- [ ] Safety and monitoring advice
- [ ] No generic refusals

### ✅ **Profile Integration**
- [ ] References training experience
- [ ] Personalizes recommendations
- [ ] Adapts advice to user level

### ✅ **Conversational Quality**
- [ ] Natural Justin Harris voice
- [ ] Appropriate use of formatting
- [ ] Direct, practical advice

### ✅ **Technical Performance**
- [ ] Fast response times
- [ ] No system errors
- [ ] Proper tool integration

---

## Test Execution Guide

1. **Run tests in fresh chat sessions** to avoid context contamination
2. **Test with different user profiles** to validate personalization
3. **Monitor console logs** for token usage and warnings
4. **Compare with pre-fix behavior** if possible
5. **Document any unexpected responses** for further refinement

**Priority Order:**
1. Response cutoff testing (critical bug fix)
2. PED guidance testing (critical functionality)  
3. Profile integration testing (user experience)
4. Formatting and voice testing (quality)
5. Edge cases and regression testing (stability)
