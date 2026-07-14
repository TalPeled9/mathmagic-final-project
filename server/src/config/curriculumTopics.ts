import type { MathTopicConfig } from '@mathmagic/types';

export const CURRICULUM_TOPICS: MathTopicConfig[] = [
  // ── Grade 1 ──────────────────────────────────────────────────────────────────
  {
    id: 'g1_numbers_1_20',
    name: 'Numbers 1–20',
    icon: '🔢',
    grade: 1,
    color: '#4CAF50',
    description: 'Recognizing, reading, writing, and ordering numbers; counting forward/backward',
    difficulty: {
      easy: [
        'A number up to 10 appears in the story written as a WORD (like on a sign or door); the child picks the matching digit from the answer options. NEVER an addition or subtraction problem.',
        'Say which number comes right before or right after a given number up to 10. NEVER an addition or subtraction problem.',
      ],
      medium: [
        'Compare two numbers up to 20: which is larger or smaller. NEVER an addition or subtraction problem.',
        'Order three numbers up to 20 from smallest to largest or largest to smallest. NEVER an addition or subtraction problem.',
      ],
      hard: [
        'Complete a sequence with one missing term, counting forward by 2s, 5s, or 10s, numbers up to 100. NEVER an addition or subtraction problem.',
        'Complete a sequence with one missing term, counting backward by 1s or 10s, numbers up to 100. NEVER an addition or subtraction problem.',
      ],
    },
  },
  {
    id: 'g1_addition',
    name: 'Addition up to 20',
    icon: '➕',
    grade: 1,
    color: '#F44336',
    description: 'Basic addition including making 10 and counting on',
    difficulty: {
      easy: 'Simple addition within 10, no regrouping (e.g., a + b = ?).',
      medium: 'Addition within 20, with regrouping (e.g., a + b = ?).',
      hard: 'Missing addend within 20 (e.g., a + ? = c); multi-step addition word problem.',
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g1_subtraction',
    name: 'Subtraction up to 20',
    icon: '➖',
    grade: 1,
    color: '#FF7043',
    description: 'Basic subtraction including counting back and finding the difference',
    difficulty: {
      easy: 'Simple subtraction within 10, no borrowing (e.g., a − b = ?).',
      medium: 'Subtraction within 20, with borrowing (e.g., a − b = ?).',
      hard: 'Missing minuend or subtrahend within 20 (e.g., ? − b = c); multi-step subtraction word problem.',
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g1_odd_even',
    name: 'Odd & Even Numbers',
    icon: '🔄',
    grade: 1,
    color: '#9C27B0',
    description: 'Identifying odd and even numbers; recognizing simple parity patterns',
    difficulty: {
      easy: 'Classify a single number as odd or even.',
      medium: 'Count how many odd or even numbers exist within a range.',
      hard: 'Decide whether a quantity up to 50 can be shared equally between two characters — even numbers can, odd numbers leave one left over. The question asks about odd/even, never about computing the shares.',
    },
  },
  {
    id: 'g1_place_value',
    name: 'Place Value (Ones & Tens)',
    icon: '🏛️',
    grade: 1,
    color: '#FF9800',
    description: 'Understanding two-digit numbers as tens and ones; composing and decomposing',
    difficulty: {
      easy: 'Identify the tens or ones digit in a two-digit number. Use a different two-digit number in every question.',
      medium:
        'Compose or decompose a two-digit number into tens and ones. Use a different two-digit number in every question.',
      hard: 'Recognise equivalent representations of a two-digit number. Use a different two-digit number in every question.',
    },
  },
  {
    id: 'g1_word_problems',
    name: 'Word Problems',
    icon: '📖',
    grade: 1,
    color: '#2196F3',
    description: 'Single-step problems involving altogether, how many left, or comparing',
    difficulty: {
      easy: 'Simple "add together" with very small numbers (within 5).',
      medium: '"How many left" subtraction within 15.',
      hard: '"Find the difference" comparison between two quantities within 20.',
    },
  },
  {
    id: 'g1_2d_shapes',
    name: '2D Shapes',
    icon: '🔷',
    grade: 1,
    color: '#E91E63',
    description: 'Recognizing and naming basic shapes; identifying vertices, sides, and corners',
    difficulty: {
      easy: [
        'Shape recognition ONLY: the image and story show one CIRCLE (described, not named) and the child names it. All four answer options are shape names. NEVER an addition, subtraction, or counting question.',
        'Shape recognition ONLY: the image and story show one TRIANGLE (described, not named) and the child names it. All four answer options are shape names. NEVER an addition, subtraction, or counting question.',
        'Shape recognition ONLY: the image and story show one SQUARE (described, not named) and the child names it. All four answer options are shape names. NEVER an addition, subtraction, or counting question.',
        'Shape recognition ONLY: the image and story show one RECTANGLE (described, not named) and the child names it. All four answer options are shape names. NEVER an addition, subtraction, or counting question.',
      ],
      medium: [
        'Count the sides of a named polygon (triangle, square, rectangle, pentagon, or hexagon).',
        'Count the corners (vertices) of a named polygon (triangle, square, rectangle, pentagon, or hexagon).',
      ],
      hard: 'Identify a shape from a list of its properties (number of sides, corners, equal side lengths). All four answer options are shape names.',
    },
  },
  {
    id: 'g1_time_clock',
    name: 'Time & Clock',
    icon: '⏰',
    grade: 1,
    color: '#607D8B',
    description: 'Reading and interpreting clocks at whole and half hours',
    difficulty: {
      easy: 'Read the analog clock shown beside the question and pick the time it shows (whole hours).',
      medium: 'Calculate the duration between two given times in whole hours.',
      hard: [
        'Read the analog clock shown beside the question and pick the time it shows (half hours).',
        'Calculate the duration between two given times including half hours.',
      ],
    },
    clockFor: {
      easy: { variants: 'all', minutes: [0] },
      hard: { variants: [0], minutes: [30] },
    },
  },

  // ── Grade 2 ──────────────────────────────────────────────────────────────────
  {
    id: 'g2_natural_numbers_1000',
    name: 'Natural Numbers up to 1,000',
    icon: '🔢',
    grade: 2,
    color: '#4CAF50',
    description: 'Reading, writing, comparing, and ordering numbers up to 1,000',
    difficulty: {
      easy: 'Compare two three-digit numbers (which is larger or smaller). Must be a comparison question — NEVER an addition or subtraction word problem.',
      medium: 'Order four three-digit numbers from smallest to largest or largest to smallest.',
      hard: [
        'Identify a number from its hundreds, tens, and ones place values.',
        'Find the number that is 10 or 100 more or less than a given three-digit number.',
      ],
    },
  },
  {
    id: 'g2_addition_subtraction',
    name: 'Addition & Subtraction up to 1,000',
    icon: '➕',
    grade: 2,
    color: '#F44336',
    description: 'Vertical and mental calculation including regrouping, up to 1,000',
    difficulty: {
      easy: [
        'Add two two-digit numbers within 100, no regrouping.',
        'Subtract two two-digit numbers within 100, no borrowing.',
      ],
      medium:
        'Two-step expression combining addition and subtraction of two-digit numbers within 100 (e.g., a + b − c, a − b + c), at most one regrouping.',
      hard: 'Two-step expression combining addition and subtraction of three-digit numbers within 1,000 (e.g., a + b − c, a − b + c), with regrouping.',
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g2_multiplication_intro',
    name: 'Introduction to Multiplication',
    icon: '✖️',
    grade: 2,
    color: '#2196F3',
    description: 'Multiplication as repeated addition and as rectangular arrays',
    difficulty: {
      easy: '×2, ×5, ×10 facts presented as equal groups.',
      medium: 'Other single-digit times-table facts (×3, ×4, ×6).',
      hard: 'Missing factor problem within single-digit tables.',
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g2_division_intro',
    name: 'Introduction to Division',
    icon: '➗',
    grade: 2,
    color: '#FF9800',
    description: 'Division as inverse of multiplication and as fair sharing',
    difficulty: {
      easy: 'Simple equal-sharing within ×2/×5 tables.',
      medium: 'Find the number of equal groups within ×3/×4 tables.',
      hard: [
        'Missing dividend within the single-digit tables (e.g., ? ÷ x = y).',
        'Missing divisor within the single-digit tables (e.g., x ÷ ? = y).',
      ],
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g2_word_problems',
    name: 'Word Problems',
    icon: '📖',
    grade: 2,
    color: '#9C27B0',
    description: 'Multi-step word problems combining addition, subtraction, and multiplication',
    difficulty: {
      easy: 'One-step addition within 20.',
      medium: 'One-step multiplication context (equal groups).',
      hard: 'Two-step problem combining two different operations.',
    },
  },
  {
    id: 'g2_geometry_polygons',
    name: 'Geometry – 3D Bodies & Shapes',
    icon: '📦',
    grade: 2,
    color: '#E91E63',
    description:
      'Recognizing and naming 3D bodies (cube, box, cylinder, pyramid, cone); identifying vertices, sides, and faces; matching bodies to drawings or photographs',
    difficulty: {
      easy: [
        'Name a CUBE from the image and a story description that never says its name. All four answer options are 3D body names.',
        'Name a BOX (rectangular prism) from the image and a story description that never says its name. All four answer options are 3D body names.',
        'Name a CYLINDER from the image and a story description that never says its name. All four answer options are 3D body names.',
        'Name a PYRAMID from the image and a story description that never says its name. All four answer options are 3D body names.',
        'Name a CONE from the image and a story description that never says its name. All four answer options are 3D body names.',
      ],
      medium: [
        'State the number of faces of a named 3D body (cube, box, cylinder, pyramid, or cone). The story must not state the count anywhere.',
        'State the number of edges of a named 3D body (cube, box, or pyramid). The story must not state the count anywhere.',
        'State the number of vertices of a named 3D body (cube, box, or pyramid). The story must not state the count anywhere.',
      ],
      hard: 'Given one property (e.g., "has 6 identical square faces", "has a circular base and a point on top", "can roll"), identify which 3D body matches. All four answer options are 3D body names.',
    },
  },
  {
    id: 'g2_time_clock',
    name: 'Time & Clock',
    icon: '⏰',
    grade: 2,
    color: '#607D8B',
    description: 'Reading and interpreting clocks at half and quarter hours; calculating durations',
    difficulty: {
      easy: 'Read the analog clock shown beside the question and pick the time it shows (half or quarter hours).',
      medium:
        'Given a start time and a duration in whole or half hours, find the end time. Must be a clock/time question with simple, direct wording — NEVER a generic addition word problem.',
      hard: 'Calculate the duration between two given times in half or quarter hours.',
    },
    clockFor: {
      easy: { variants: 'all', minutes: [15, 30, 45] },
    },
  },
  {
    id: 'g2_patterns',
    name: 'Patterns & Sequences',
    icon: '🔁',
    grade: 2,
    color: '#00BCD4',
    description: 'Identifying, continuing, and creating numerical patterns',
    difficulty: {
      easy: 'Continue a skip-counting sequence (by 2s).',
      medium: 'Continue a skip-counting sequence (by 5s).',
      hard: 'Fill in two missing terms in the middle of a sequence.',
    },
  },

  // ── Grade 3 ──────────────────────────────────────────────────────────────────
  {
    id: 'g3_natural_numbers_10000',
    name: 'Natural Numbers up to 10,000',
    icon: '🔢',
    grade: 3,
    color: '#4CAF50',
    description: 'Reading, writing, comparing 4-digit numbers; place value with thousands',
    difficulty: {
      easy: 'Write a 4-digit number in words or write it in digits given a number in words.',
      medium: 'Form the largest possible 4-digit number from given digits.',
      hard: 'Compare two 4-digit numbers.',
    },
  },
  {
    id: 'g3_addition_subtraction',
    name: 'Addition & Subtraction up to 10,000',
    icon: '➕',
    grade: 3,
    color: '#F44336',
    description:
      'Written and mental addition and subtraction of 4-digit numbers, including regrouping',
    difficulty: {
      easy: [
        'Add two 3-digit numbers, no regrouping. Use varied, non-round numbers — do not use numbers ending in 0.',
        'Subtract two 3-digit numbers, no borrowing. Use varied, non-round numbers — do not use numbers ending in 0.',
      ],
      medium: [
        'Add two 4-digit numbers with regrouping.',
        'Subtract two 4-digit numbers with borrowing.',
      ],
      hard: 'Two-step problem within 10,000 (add then subtract or vice versa).',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g3_multiplication_table',
    name: 'Multiplication Table & Vertical Multiplication',
    icon: '✖️',
    grade: 3,
    color: '#2196F3',
    description: 'Mastery of all multiplication facts up to 10×10; 2-digit × 1-digit vertical',
    difficulty: {
      easy: 'Single multiplication fact within the 10×10 table.',
      medium: '2-digit or 3-digit × 1-digit vertical multiplication.',
      hard: 'Find the missing digit in a 2-digit × 1-digit multiplication given the final result (e.g., a? × b = c). Show the missing digit as "?" in the expression.',
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g3_division_remainder',
    name: 'Division with Remainder',
    icon: '➗',
    grade: 3,
    color: '#FF9800',
    description: 'Division within tables, with and without remainder',
    difficulty: {
      easy: 'Exact division fact within the 10×10 table.',
      medium: 'Division with a remainder; state quotient and remainder.',
      hard: 'Word problem where the remainder must be interpreted (e.g., rounding up cars).',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g3_order_of_operations',
    name: 'Order of Operations',
    icon: '🧮',
    grade: 3,
    color: '#795548',
    description: 'Correct order of operations, including parentheses',
    difficulty: {
      easy: [
        'Evaluate an expression of the form a + b × c (multiplication first), single-digit and small two-digit numbers. Do not use any parentheses in the expression or the question.',
        'Evaluate an expression of the form a − b × c (multiplication first), single-digit and small two-digit numbers. Do not use any parentheses in the expression or the question.',
        'Evaluate an expression of the form a + b ÷ c (division first, exact), single-digit and small two-digit numbers. Do not use any parentheses in the expression or the question.',
        'Evaluate an expression of the form a × b − c, single-digit and small two-digit numbers. Do not use any parentheses in the expression or the question.',
      ],
      medium: [
        'Evaluate (a + b) × c with small numbers, where evaluating without the parentheses would give a different answer.',
        'Evaluate (a − b) × c with small numbers, where evaluating without the parentheses would give a different answer.',
        'Evaluate (a + b) ÷ c with small numbers and exact division, where evaluating without the parentheses would give a different answer.',
        'Evaluate a − (b + c) with small numbers, where evaluating without the parentheses would give a different answer.',
      ],
      hard: 'Describe a two-step situation in the story, then ask which expression solves it. All four answer options must be mathematical expressions (e.g., "(a + b) × c") differing in operations or parentheses; exactly one is correct.',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g3_simple_fractions',
    name: 'Introduction to Fractions',
    icon: '🍕',
    grade: 3,
    color: '#9C27B0',
    description: 'Basic fractions (half, third, quarter, fifth) as parts of a whole or quantity',
    difficulty: {
      easy: 'Identify a fraction (1/2, 1/3, 1/4, or 1/5) from a picture showing equal parts. The image description must state exactly how many equal parts there are and how many are shaded, matching the correct answer.',
      medium: 'Compare two unit fractions (e.g., 1/a vs 1/b).',
      hard: 'Find a unit fraction of a quantity (e.g., 1/a of b).',
    },
    expressionFor: ['hard'],
  },
  {
    id: 'g3_two_step_word_problems',
    name: 'Two-Step Word Problems',
    icon: '📖',
    grade: 3,
    color: '#F44336',
    description: 'Problems requiring two calculation steps; emphasis on identifying the steps',
    difficulty: {
      easy: 'The same operation used twice in one story situation.',
      medium: 'Two different operations (multiply then subtract).',
      hard: 'Multi-step with reasoning backward (work out an unknown component).',
    },
  },
  {
    id: 'g3_measurement_units',
    name: 'Measurement – Units & Conversion',
    icon: '📏',
    grade: 3,
    color: '#607D8B',
    description: 'Measuring with appropriate units; converting between standard units',
    difficulty: {
      easy: [
        'A direct conversion fact about WEIGHT: how many grams are in N kilograms. Must be a conversion question — NEVER a plain addition problem.',
        'A direct conversion fact about LENGTH: how many centimeters are in N meters. Must be a conversion question — NEVER a plain addition problem.',
      ],
      medium: [
        'Convert a LENGTH measurement between units (m ↔ cm or km ↔ m), including non-whole values (e.g., x.y m to cm). The focus is the conversion itself, not multiplication practice.',
        'Convert a WEIGHT measurement between units (kg ↔ g), including non-whole values (e.g., x.y kg to grams). The focus is the conversion itself, not multiplication practice.',
      ],
      hard: [
        'Word problem about LENGTH where quantities appear in two different units (m and cm, or km and m) and must be converted before adding or comparing.',
        'Word problem about WEIGHT where quantities appear in two different units (kg and g) and must be converted before adding or comparing.',
      ],
    },
  },

  // ── Grade 4 ──────────────────────────────────────────────────────────────────
  {
    id: 'g4_large_numbers',
    name: 'Natural Numbers up to 1,000,000',
    icon: '🔢',
    grade: 4,
    color: '#4CAF50',
    description: 'Reading, writing, comparing, and rounding large numbers',
    difficulty: {
      easy: 'Write a 6-digit number from its word form.',
      medium: 'Round a 6-digit number to the nearest thousand.',
      hard: 'Estimate a sum of two large numbers to the nearest 10,000.',
    },
  },
  {
    id: 'g4_addition_subtraction',
    name: 'Addition & Subtraction',
    icon: '➕',
    grade: 4,
    color: '#F44336',
    description:
      'Written and mental addition and subtraction of multi-digit numbers without an upper limit',
    difficulty: {
      easy: [
        'Add two 4-digit numbers with regrouping.',
        'Subtract two 4-digit numbers with borrowing.',
      ],
      medium: [
        'Add two large numbers (5–6 digits) with regrouping.',
        'Subtract two large numbers (5–6 digits) with borrowing.',
      ],
      hard: 'Multi-step problem combining addition and subtraction of large numbers.',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g4_long_multiplication_division',
    name: 'Long Multiplication & Division',
    icon: '✖️',
    grade: 4,
    color: '#2196F3',
    description:
      'Vertical multiplication with multi-digit factors; long division with 1- or 2-digit divisors',
    difficulty: {
      easy: ['3-digit × 1-digit multiplication.', '3-digit ÷ 1-digit exact division.'],
      medium: ['3-digit × 2-digit multiplication.', '4-digit ÷ 1-digit division.'],
      hard: ['4-digit × 2-digit multiplication.', 'Long division by a 2-digit divisor (exact).'],
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g4_fractions_extended',
    name: 'Fractions – Extended Understanding',
    icon: '🍕',
    grade: 4,
    color: '#9C27B0',
    description: 'Equivalent fractions, comparing fractions, fractions greater than 1',
    difficulty: {
      easy: [
        'Decide whether two given fractions are equivalent. Write all fractions in the question and answer options in digits (e.g., a/b), never spelled out in words.',
        'Compare two different fractions and say which is larger. Write all fractions in the question and answer options in digits (e.g., a/b), never spelled out in words.',
      ],
      medium:
        'Compare two fractions with different denominators. Write all fractions in the question and answer options in digits (e.g., a/b), never spelled out in words.',
      hard: 'Add or subtract mixed numbers with equal or related denominators. Write mixed numbers with a space (e.g., "2 3/4") and spell them out in the story (e.g., "two and three quarters").',
    },
    expressionFor: ['hard'],
  },
  {
    id: 'g4_order_of_operations_advanced',
    name: 'Order of Operations (Advanced)',
    icon: '🧮',
    grade: 4,
    color: '#FF9800',
    description:
      'Solving multi-step expressions following the conventional order, with parentheses',
    difficulty: {
      easy: [
        'Evaluate an expression of the form a + b × c (multiplication first), with two-digit numbers. Do not use any parentheses in the expression or the question.',
        'Evaluate an expression of the form a − b × c (multiplication first), with two-digit numbers. Do not use any parentheses in the expression or the question.',
        'Evaluate an expression of the form a + b ÷ c (division first, exact), with two-digit numbers. Do not use any parentheses in the expression or the question.',
        'Evaluate an expression of the form a × b − c, with two-digit numbers. Do not use any parentheses in the expression or the question.',
      ],
      medium: [
        'Evaluate (a + b) × c − d with two-digit numbers, where evaluating without the parentheses would give a different answer.',
        'Evaluate (a − b) × c with two-digit numbers, where evaluating without the parentheses would give a different answer.',
        'Evaluate (a + b) ÷ c with exact division, where evaluating without the parentheses would give a different answer.',
        'Evaluate a − (b + c) ÷ d with exact division, where evaluating without the parentheses would give a different answer.',
      ],
      hard: 'Describe a multi-step situation in the story, then ask which expression solves it. All four answer options must be mathematical expressions differing in operations or parentheses; exactly one is correct.',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g4_prime_composite_numbers',
    name: 'Prime & Composite Numbers',
    icon: '🔢',
    grade: 4,
    color: '#9C27B0',
    description:
      'Identifying prime and composite numbers; understanding divisibility and number properties',
    difficulty: {
      easy: 'Identify whether a small number (up to 20) is prime or composite.',
      medium: 'Identify whether a larger number (up to 100) is prime or composite.',
      hard: 'List all prime numbers in a given range or find all factors of a composite number.',
    },
  },
  {
    id: 'g4_perimeter_area',
    name: 'Geometry – Perimeter & Area',
    icon: '📐',
    grade: 4,
    color: '#E91E63',
    description: 'Perimeter and area of rectangles, squares, right triangles',
    difficulty: {
      easy: [
        'Calculate the perimeter of a rectangle. All lengths in meters or centimeters.',
        'Calculate the perimeter of a square. All lengths in meters or centimeters.',
        'Calculate the perimeter of a right triangle. All lengths in meters or centimeters.',
      ],
      medium: [
        'Calculate the area of a rectangle. All lengths in meters or centimeters.',
        'Calculate the area of a square. All lengths in meters or centimeters.',
        'Calculate the area of a right triangle. All lengths in meters or centimeters.',
      ],
      hard: [
        'Find a missing side of a rectangle given its area and one side. All lengths in meters or centimeters.',
        'Find a missing side of a rectangle given its perimeter and one side. All lengths in meters or centimeters.',
      ],
    },
  },
  {
    id: 'g4_multi_step_word_problems',
    name: 'Multi-Step Word Problems & Data',
    icon: '📖',
    grade: 4,
    color: '#F44336',
    description: 'Multi-step problems combining operations; reading double bar graphs and tables',
    difficulty: {
      easy: 'Two clear steps with 2-digit numbers (e.g., multiply two 2-digit quantities, then add or subtract a total).',
      medium: 'Three or more steps involving a fraction.',
      hard: 'Rate-based reasoning (e.g: pages per day, distance at a speed) requiring at least three steps or a comparison between two rates.',
    },
  },

  // ── Grade 5 ──────────────────────────────────────────────────────────────────
  {
    id: 'g5_fractions_operations',
    name: 'Fractions – Addition & Subtraction',
    icon: '🍕',
    grade: 5,
    color: '#9C27B0',
    description:
      'Equivalent/reduced fractions; adding and subtracting with same and different denominators; mixed numbers',
    difficulty: {
      easy: [
        'Add two fractions with the same denominator.',
        'Subtract two fractions with the same denominator.',
      ],
      medium: [
        'Add two fractions with different denominators using a common denominator.',
        'Subtract two fractions with different denominators using a common denominator.',
      ],
      hard: [
        'Add mixed numbers with different denominators using a common denominator. Write mixed numbers with a space (e.g., "2 3/4") and spell them out in the story.',
        'Subtract mixed numbers with different denominators using a common denominator. Write mixed numbers with a space (e.g., "2 3/4") and spell them out in the story.',
      ],
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g5_decimal_numbers',
    name: 'Decimal Numbers – Add & Subtract',
    icon: '🔣',
    grade: 5,
    color: '#FF9800',
    description: 'Tenths, hundredths, thousandths; reading, writing, comparing; add and subtract',
    difficulty: {
      easy: [
        'Add two tenths-place decimals. Use different, varied numbers in every question.',
        'Subtract two tenths-place decimals. Use different, varied numbers in every question.',
      ],
      medium: [
        'Add two hundredths-place decimals with regrouping.',
        'Subtract two hundredths-place decimals with borrowing.',
      ],
      hard: [
        'Add two thousandths-place decimals with regrouping.',
        'Subtract two thousandths-place decimals with borrowing.',
        'Compare two decimals with different numbers of decimal places and determine which is larger.',
      ],
    },
    expressionFor: ['easy', 'medium', 'hard'],
  },
  {
    id: 'g5_fraction_decimal_conversion',
    name: 'Fraction ↔ Decimal Conversion',
    icon: '🔄',
    grade: 5,
    color: '#00BCD4',
    description: 'Converting between fractions and final decimals; comparing across forms',
    difficulty: {
      easy: 'Convert a common fraction (1/2, 1/4) to decimal.',
      medium: 'Convert a less common fraction (3/4, 3/5) to decimal.',
      hard: 'Compare a fraction and a decimal and state which is larger.',
    },
  },
  {
    id: 'g5_large_number_operations',
    name: 'Operations with Large Numbers',
    icon: '✖️',
    grade: 5,
    color: '#2196F3',
    description: 'Mental and written multiplication and division of multi-digit numbers',
    difficulty: {
      easy: '3-digit × 2-digit multiplication.',
      medium: '4-digit ÷ 2-digit division.',
      hard: 'Multi-step word problem combining 3 or 4 operations on large numbers.',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g5_multi_step_word_problems',
    name: 'Multi-Step Word Problems',
    icon: '📖',
    grade: 5,
    color: '#F44336',
    description: 'Combining several operations and number types (whole, fraction, decimal)',
    difficulty: {
      easy: "Two operations with whole numbers in the hundreds (results up to 1,000). Numbers don't always end in 0 or 5. The story must not state the answer anywhere.",
      medium: 'One operation with fractions or decimals mixed with whole numbers.',
      hard: 'Sequential fraction reasoning (fraction of a fraction of a total).',
    },
  },
  {
    id: 'g5_roman_numbers',
    name: 'Roman Numbers',
    icon: '🏛️',
    grade: 5,
    color: '#795548',
    description: 'Reading and writing Roman numerals; converting between Roman and Arabic numerals',
    difficulty: {
      easy: 'Read or write a Roman numeral up to 20 (I–XX).',
      medium: 'Convert between Roman and Arabic numerals up to 100.',
      hard: 'Convert between Roman and Arabic numerals up to 1,000; apply subtractive notation (e.g., IV, IX, XL, XC).',
    },
  },
  {
    id: 'g5_geometry_polygons_area',
    name: 'Geometry – Area of Polygons',
    icon: '📐',
    grade: 5,
    color: '#E91E63',
    description:
      'Heights of triangles and parallelograms; area of triangles, parallelograms; composite shapes',
    difficulty: {
      easy: 'Area of a triangle (base × height ÷ 2). All lengths in meters or centimeters.',
      medium: 'Area of a parallelogram (base × height). All lengths in meters or centimeters.',
      hard: 'Area of a composite shape (rectangle + triangle). All lengths in meters or centimeters.',
    },
  },
  {
    id: 'g5_averages',
    name: 'Averages',
    icon: '📊',
    grade: 5,
    color: '#607D8B',
    description: 'Calculating and interpreting the arithmetic mean of a data set',
    difficulty: {
      easy: 'Calculate the mean of three numbers.',
      medium: 'Calculate the mean of four numbers.',
      hard: 'Work backward from an average to find a missing data point.',
    },
  },

  // ── Grade 6 ──────────────────────────────────────────────────────────────────
  {
    id: 'g6_fractions_decimals_add_sub',
    name: 'Fractions & Decimals – Addition & Subtraction',
    icon: '🍕',
    grade: 6,
    color: '#9C27B0',
    description: 'Adding and subtracting fractions (including mixed numbers) and decimals',
    difficulty: {
      easy: [
        'Add two fractions where one denominator is a multiple of the other (e.g., thirds and sixths).',
        'Subtract two fractions where one denominator is a multiple of the other (e.g., fourths and eighths).',
      ],
      medium: [
        'Add two fractions with unrelated denominators, requiring a common denominator.',
        'Subtract two fractions with unrelated denominators, requiring a common denominator.',
        'Add two decimals with regrouping.',
        'Subtract two decimals with borrowing.',
      ],
      hard: [
        'Add mixed numbers, or a fraction and a decimal, in a word-problem context. Write mixed numbers with a space (e.g., "2 3/4") and spell them out in the story.',
        'Subtract mixed numbers, or a fraction and a decimal, in a word-problem context. Write mixed numbers with a space (e.g., "2 3/4") and spell them out in the story.',
      ],
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g6_fractions_mul_div',
    name: 'Fractions – Multiplication & Division',
    icon: '✖️',
    grade: 6,
    color: '#E91E63',
    description: 'Multiplying and dividing fractions and mixed numbers',
    difficulty: {
      easy: [
        'Multiply a fraction by a whole number between 3 and 12.',
        'Divide a fraction by a whole number between 3 and 12.',
      ],
      medium: [
        'Multiply two fractions.',
        'Divide two fractions.',
        'Multiply a fraction by a mixed number.',
        'Divide a fraction by a mixed number.',
      ],
      hard: [
        'Multiply mixed numbers, or a fraction and a decimal, in a word-problem context.',
        'Divide mixed numbers, or a fraction and a decimal, in a word-problem context.',
      ],
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g6_decimals_mul_div',
    name: 'Decimals – Multiplication & Division',
    icon: '🔣',
    grade: 6,
    color: '#FF9800',
    description: 'Multiplying and dividing decimals; decimal-point placement',
    difficulty: {
      easy: [
        'Multiply a decimal by a whole number between 3 and 12 (e.g., x.y × c).',
        'Divide a decimal by a whole number between 3 and 12, exact result (e.g., x.y ÷ c).',
      ],
      medium: [
        'Multiply two decimals — BOTH numbers must be decimals (e.g., 0.x × 0.y), never a decimal by a whole number.',
        'Divide two decimals — BOTH numbers must be decimals with an exact result (e.g., x.y ÷ 0.z), never a decimal by a whole number.',
      ],
      hard: 'Multiply or divide by a decimal in a measurement context.',
    },
    expressionFor: ['easy', 'medium'],
  },
  {
    id: 'g6_percentages',
    name: 'Percentages',
    icon: '💯',
    grade: 6,
    color: '#4CAF50',
    description:
      'Percent as part of 100; find part, find whole, find percent; link to fractions and decimals',
    difficulty: {
      easy: [
        'Find 10% or 5% of a whole number. Vary the whole number in every question.',
        'Find 20% of a whole number. Vary the whole number in every question.',
        'Find 25% of a whole number. Vary the whole number in every question.',
        'Find 50% of a whole number. Vary the whole number in every question.',
      ],
      medium: 'Find what percent one number is of another.',
      hard: 'Find the whole given a part and its percentage (reverse percentage). Vary the scenario and the numbers in every question.',
    },
  },
  {
    id: 'g6_ratio_proportion',
    name: 'Ratio & Proportion',
    icon: '⚖️',
    grade: 6,
    color: '#2196F3',
    description: 'Ratio in problem-solving including direct proportion',
    difficulty: {
      easy: 'Simplify a ratio to its lowest terms.',
      medium: 'Solve a direct proportion (cost of N items).',
      hard: 'Multi-step ratio: find one part of a mixture given the total volume.',
    },
  },
  {
    id: 'g6_circles',
    name: 'Circles',
    icon: '⭕',
    grade: 6,
    color: '#E91E63',
    description: 'Circle properties: radius, diameter, circumference, and area',
    difficulty: {
      easy: [
        'Given the radius of a circle, find its diameter. All lengths in meters or centimeters.',
        'Given the diameter of a circle, find its radius. All lengths in meters or centimeters.',
      ],
      medium:
        'Calculate the circumference of a circle given the radius or diameter (π ≈ 3.14). All lengths in meters or centimeters.',
      hard: 'Calculate the area of a circle given the radius (π ≈ 3.14). All lengths in meters or centimeters.',
    },
  },
  {
    id: 'g6_data_probability',
    name: 'Data, Averages & Probability',
    icon: '📊',
    grade: 6,
    color: '#607D8B',
    description: 'Mean, median, analyzing data; basic probability through chance events',
    difficulty: {
      easy: 'Calculate the mean of five numbers.',
      medium: 'Find the median of five numbers.',
      hard: 'Calculate a simple probability (marbles in a bag).',
    },
  },
  {
    id: 'g6_metric_system',
    name: 'Metric System',
    icon: '📏',
    grade: 6,
    color: '#00BCD4',
    description: 'Units of length (mm, cm, m, km) and mass (mg, g, kg); converting between units',
    difficulty: {
      easy: 'Convert between adjacent units (e.g., cm to m, g to kg).',
      medium: 'Convert between non-adjacent units (e.g., mm to m, mg to kg).',
      hard: 'Solve a word problem requiring unit conversion and arithmetic (e.g., total distance in km from measurements in m).',
    },
  },
];

export function getTopicsForGrade(grade: number): MathTopicConfig[] {
  return CURRICULUM_TOPICS.filter((t) => t.grade === grade);
}

export function getCurriculumTopicById(id: string): MathTopicConfig | undefined {
  return CURRICULUM_TOPICS.find((t) => t.id === id);
}
