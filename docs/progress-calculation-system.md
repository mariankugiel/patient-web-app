# Comprehensive Progress Calculation System

## Overview

The health goal progress calculation system is designed to accurately measure progress toward health goals based on the type of metric, target operator, and improvement direction.

## Core Concepts

### 1. Target Operators

- **`below`**: Goal is to achieve a value below the target (e.g., weight < 90kg)
- **`above`**: Goal is to achieve a value above the target (e.g., steps > 10000)
- **`equal`**: Goal is to achieve an exact value (e.g., blood pressure = 120/80)
- **`between`**: Goal is to achieve a value within a range (e.g., BMI 18.5-24.9)
- **`maintain`**: Goal is to maintain a value within a small tolerance (e.g., maintain weight ±2kg)

### 2. Improvement Direction

The system automatically determines improvement direction based on metric type:

- **Weight-related metrics** (weight, BMI): Decrease is usually better
- **Performance metrics** (steps, distance, duration): Increase is usually better
- **Blood pressure**: Depends on specific value and context
- **Heart rate**: Depends on context (resting vs max)

### 3. Baseline Value

The baseline value represents the starting point when the goal was created. This is crucial for accurate progress calculation.

## Progress Calculation Examples

### Example 1: Weight Loss Goal
- **Goal**: "Lose weight below 90kg"
- **Baseline**: 100kg (when goal was created)
- **Current**: 98kg
- **Calculation**: 
  - Target operator: `below`
  - Target value: 90kg
  - Progress = (100kg - 98kg) / (100kg - 90kg) × 100 = 20%
- **Database storage**: Store baseline_value = 100kg, target_value = 90kg, target_operator = "below"

### Example 2: Steps Goal
- **Goal**: "Walk more than 10000 steps daily"
- **Baseline**: 5000 steps (when goal was created)
- **Current**: 8500 steps
- **Calculation**:
  - Target operator: `above`
  - Target value: 10000 steps
  - Progress = (8500 - 5000) / (10000 - 5000) × 100 = 70%
- **Database storage**: Store baseline_value = 5000, target_value = 10000, target_operator = "above"

### Example 3: Blood Pressure Range Goal
- **Goal**: "Keep blood pressure between 120-140 mmHg"
- **Baseline**: 150 mmHg (when goal was created)
- **Current**: 135 mmHg
- **Calculation**:
  - Target operator: `between`
  - Target range: 120-140 mmHg
  - Current is within range: 100% progress
- **Database storage**: Store baseline_value = 150, target_min = 120, target_max = 140, target_operator = "between"

### Example 4: Maintenance Goal
- **Goal**: "Maintain current weight of 75kg"
- **Baseline**: 75kg (when goal was created)
- **Current**: 76.5kg
- **Calculation**:
  - Target operator: `maintain`
  - Target value: 75kg
  - Tolerance: 5% = 3.75kg
  - Deviation: 1.5kg (within tolerance)
  - Progress = 100% (within acceptable range)
- **Database storage**: Store baseline_value = 75, target_value = 75, target_operator = "maintain"

## Database Schema Recommendations

### Health Goals Table
```sql
CREATE TABLE health_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    metric_id INTEGER REFERENCES health_metrics(id),
    target_value DECIMAL(10,2),
    target_min DECIMAL(10,2), -- For 'between' operator
    target_max DECIMAL(10,2), -- For 'between' operator
    target_operator VARCHAR(20) DEFAULT 'equal', -- 'below', 'above', 'equal', 'between', 'maintain'
    baseline_value DECIMAL(10,2), -- Starting value when goal was created
    current_value DECIMAL(10,2), -- Latest recorded value
    progress_percentage INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Health Metrics Table
```sql
CREATE TABLE health_metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    metric_type VARCHAR(100), -- 'weight', 'steps', 'blood_pressure', etc.
    improvement_direction VARCHAR(20), -- 'increase', 'decrease', 'maintain'
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Logic

### 1. Goal Creation
When a user creates a health goal:
1. Capture the current metric value as `baseline_value`
2. Parse the target string to extract operator and value(s)
3. Store all components in the database

### 2. Progress Updates
When a user updates a metric value:
1. Retrieve the goal configuration from database
2. Calculate new progress using the comprehensive formula
3. Update the `current_value` and `progress_percentage` in database
4. Display updated progress to user

### 3. Progress Calculation Formula

```typescript
const calculateProgress = (current, target, metricId, baselineValue) => {
  // Parse target and determine operator
  // Calculate progress based on operator type
  // Return percentage (0-100)
}
```

## Edge Cases and Considerations

### 1. No Baseline Value
If baseline value is not available:
- Estimate based on current value and target
- Use conservative estimates to avoid inflated progress

### 2. Goal Already Achieved
If current value already meets the target:
- Return 100% progress
- Consider marking goal as completed

### 3. Regression
If current value moves away from target:
- Progress can decrease (but not below 0%)
- Provide motivational messaging

### 4. Range Goals
For 'between' operator:
- Progress is 100% when within range
- Progress decreases based on distance from range boundaries

## Benefits of This System

1. **Accurate Progress Tracking**: Considers baseline, target type, and improvement direction
2. **Flexible Target Types**: Supports various goal types (below, above, between, maintain)
3. **Contextual Intelligence**: Automatically determines improvement direction based on metric type
4. **Comprehensive Coverage**: Handles edge cases and various scenarios
5. **Database Efficiency**: Stores all necessary data for accurate calculations
6. **User Experience**: Provides meaningful progress feedback

## Future Enhancements

1. **Trend Analysis**: Track progress over time with charts
2. **Predictive Progress**: Estimate time to goal completion
3. **Adaptive Targets**: Adjust targets based on progress patterns
4. **Milestone Celebrations**: Celebrate progress milestones
5. **Goal Recommendations**: Suggest new goals based on progress patterns
