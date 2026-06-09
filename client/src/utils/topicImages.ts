// client/src/utils/topicImages.ts

export interface TopicImageConfig {
  category: string;
  fallbackGradient: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  addition:            'linear-gradient(160deg, #fca5a5 0%, #ef4444 45%, #7f1d1d 100%)',
  subtraction:         'linear-gradient(160deg, #fdba74 0%, #f97316 45%, #7c2d12 100%)',
  multiplication:      'linear-gradient(160deg, #93c5fd 0%, #2563eb 45%, #1e1b4b 100%)',
  division:            'linear-gradient(160deg, #67e8f9 0%, #0891b2 45%, #0c2a4a 100%)',
  fractions:           'linear-gradient(160deg, #d8b4fe 0%, #9333ea 45%, #2e1065 100%)',
  decimals:            'linear-gradient(160deg, #a5b4fc 0%, #4f46e5 45%, #1e1b4b 100%)',
  numbers:             'linear-gradient(160deg, #86efac 0%, #16a34a 45%, #052e16 100%)',
  geometry:            'linear-gradient(160deg, #fda4af 0%, #e11d48 45%, #4c0519 100%)',
  'word-problems':     'linear-gradient(160deg, #fde68a 0%, #d97706 45%, #451a03 100%)',
  time:                'linear-gradient(160deg, #cbd5e1 0%, #475569 45%, #0f172a 100%)',
  patterns:            'linear-gradient(160deg, #c4b5fd 0%, #7c3aed 45%, #2e1065 100%)',
  measurement:         'linear-gradient(160deg, #d6d3d1 0%, #78716c 45%, #1c1917 100%)',
  'order-of-operations': 'linear-gradient(160deg, #6ee7b7 0%, #059669 45%, #064e3b 100%)',
  data:                'linear-gradient(160deg, #7dd3fc 0%, #0369a1 45%, #0c2a4a 100%)',
  percentages:         'linear-gradient(160deg, #bef264 0%, #65a30d 45%, #1a2e05 100%)',
  ratio:               'linear-gradient(160deg, #fef08a 0%, #ca8a04 45%, #422006 100%)',
  'roman-numbers':     'linear-gradient(160deg, #fde68a 0%, #92400e 45%, #1c0600 100%)',
};

const TOPIC_CATEGORY_MAP: Record<string, string> = {
  // Addition
  g1_addition:                    'addition',
  g2_addition_subtraction:        'addition',
  g3_addition_subtraction:        'addition',
  g4_addition_subtraction:        'addition',
  // Subtraction
  g1_subtraction:                 'subtraction',
  // Multiplication
  g2_multiplication_intro:        'multiplication',
  g3_multiplication_table:        'multiplication',
  g4_long_multiplication_division:'multiplication',
  g5_large_number_operations:     'multiplication',
  g6_fractions_mul_div:           'multiplication',
  // Division
  g2_division_intro:              'division',
  g3_division_remainder:          'division',
  // Fractions
  g3_simple_fractions:            'fractions',
  g4_fractions_extended:          'fractions',
  g5_fractions_operations:        'fractions',
  g5_fraction_decimal_conversion: 'fractions',
  g6_fractions_decimals_add_sub:  'fractions',
  // Decimals
  g5_decimal_numbers:             'decimals',
  g6_decimals_mul_div:            'decimals',
  // Numbers
  g1_numbers_1_20:                'numbers',
  g1_odd_even:                    'numbers',
  g1_place_value:                 'numbers',
  g2_natural_numbers_1000:        'numbers',
  g3_natural_numbers_10000:       'numbers',
  g4_large_numbers:               'numbers',
  g4_prime_composite_numbers:     'numbers',
  // Geometry
  g1_2d_shapes:                   'geometry',
  g2_geometry_polygons:           'geometry',
  g4_perimeter_area:              'geometry',
  g5_geometry_polygons_area:      'geometry',
  g6_circles:                     'geometry',
  // Word problems
  g1_word_problems:               'word-problems',
  g2_word_problems:               'word-problems',
  g3_two_step_word_problems:      'word-problems',
  g4_multi_step_word_problems:    'word-problems',
  g5_multi_step_word_problems:    'word-problems',
  // Time
  g1_time_clock:                  'time',
  g2_time_clock:                  'time',
  // Patterns
  g2_patterns:                    'patterns',
  // Measurement
  g3_measurement_units:           'measurement',
  g6_metric_system:               'measurement',
  // Order of operations
  g3_order_of_operations:         'order-of-operations',
  g4_order_of_operations_advanced:'order-of-operations',
  // Data
  g5_averages:                    'data',
  g6_data_probability:            'data',
  // Percentages
  g6_percentages:                 'percentages',
  // Ratio
  g6_ratio_proportion:            'ratio',
  // Roman numbers
  g5_roman_numbers:               'roman-numbers',
};

export function getTopicImageConfig(topicId: string): TopicImageConfig {
  const category = TOPIC_CATEGORY_MAP[topicId] ?? 'numbers';
  const fallbackGradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS['numbers'];
  return { category, fallbackGradient };
}
