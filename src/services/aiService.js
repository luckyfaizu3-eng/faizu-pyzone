// aiService.js - IMPROVED VERSION

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const LEVEL_PROMPTS = {
  basic: `You are a Python exam generator. Create EXACTLY 60 UNIQUE basic Python MCQs.

STRICT RULES:
1. Each question MUST be different (no repetition)
2. Each question MUST have code (2-5 lines)
3. Test ONLY these topics:
   - Variables (x = 5, type conversion)
   - Basic operators (+, -, *, /, //, %)
   - If/else statements
   - For/while loops (simple iteration)
   - Print statements
   - String indexing/slicing
   - List basics (append, len, [0])

DIFFICULTY: Beginner friendly
CODE STYLE: Simple, clean, no tricks

Example question format:
{
  "id": 1,
  "question": "What is the output of this code?",
  "code": "x = 10\\ny = 3\\nprint(x // y)",
  "options": ["3.33", "3", "10", "Error"],
  "correct": 1
}`,

  advanced: `You are a Python exam generator. Create EXACTLY 60 UNIQUE advanced Python MCQs.

STRICT RULES:
1. NO duplicate questions
2. Each question MUST have code (5-10 lines)
3. Test ONLY these topics:
   - List/dict comprehensions
   - Lambda functions
   - Decorators (@property, @staticmethod)
   - Classes and OOP (__init__, inheritance)
   - Try/except handling
   - File operations
   - *args, **kwargs
   - Map/filter/reduce

DIFFICULTY: Medium-Hard
CODE STYLE: Real-world scenarios

Example:
{
  "id": 1,
  "question": "What will this code print?",
  "code": "nums = [1, 2, 3, 4]\\nsquared = [x**2 for x in nums if x % 2 == 0]\\nprint(squared)",
  "options": ["[1, 4, 9, 16]", "[4, 16]", "[2, 4]", "Error"],
  "correct": 1
}`,

  pro: `You are a Python interview question generator. Create EXACTLY 60 UNIQUE pro-level MCQs.

STRICT RULES:
1. NO repetition - each question unique
2. Each question MUST have code (8-15 lines)
3. Test ONLY these topics:
   - Algorithm complexity (O notation)
   - Data structures (stacks, queues, trees)
   - Design patterns (singleton, factory)
   - Async/await, generators
   - Metaclasses, descriptors
   - Memory optimization
   - Advanced OOP (MRO, multiple inheritance)
   - Recursion, dynamic programming

DIFFICULTY: Interview/Expert level
CODE STYLE: Production quality

Example:
{
  "id": 1,
  "question": "What is the time complexity of this function?",
  "code": "def find_duplicates(arr):\\n    seen = set()\\n    duplicates = []\\n    for num in arr:\\n        if num in seen:\\n            duplicates.append(num)\\n        seen.add(num)\\n    return duplicates",
  "options": ["O(n²)", "O(n log n)", "O(n)", "O(1)"],
  "correct": 2
}`,
};

// Unique ID generator to avoid duplicates
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateMockQuestions = async (level, count = 60) => {
  try {
    console.log(`🤖 Generating ${count} ${level} questions via Groq...`);
    
    const systemPrompt = `You are an expert Python programming instructor and exam creator.

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY ${count} UNIQUE questions
2. NO duplicate questions allowed
3. EVERY question must have working Python code
4. Return ONLY valid JSON - no markdown, no explanations
5. Maintain consistent difficulty for ${level} level
6. Test different concepts in each question

Quality checklist:
✓ Code is syntactically correct
✓ One clear correct answer
✓ Options are plausible but distinct
✓ Questions test understanding, not memorization`;

    const userPrompt = `${LEVEL_PROMPTS[level]}

Generate ${count} questions NOW. Return ONLY the JSON array:
[
  {"id": 1, "question": "...", "code": "...", "options": [...], "correct": 0},
  {"id": 2, "question": "...", "code": "...", "options": [...], "correct": 1},
  ...
]`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5, // REDUCED for consistency
        max_tokens: 10000, // INCREASED
        top_p: 0.9,
        frequency_penalty: 0.5, // PREVENT REPETITION
        presence_penalty: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API Error:', response.status, errorText);
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content;
    
    // Clean response
    generatedText = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[^[]*/, '') // Remove everything before first [
      .replace(/[^\]]*$/, '') // Remove everything after last ]
      .trim();
    
    let questions;
    try {
      questions = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.log('Problematic response:', generatedText.substring(0, 500));
      throw new Error('Invalid JSON response');
    }
    
    // VALIDATION & DEDUPLICATION
    const validQuestions = validateAndDeduplicate(questions, level, count);

    if (validQuestions.length < count * 0.8) { // At least 80% success
      throw new Error(`Only ${validQuestions.length}/${count} valid questions`);
    }

    console.log(`✅ Generated ${validQuestions.length} unique ${level} questions`);
    
    return {
      success: true,
      questions: validQuestions,
      level: level,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Generation Error:', error);
    return {
      success: false,
      error: error.message,
      questions: []
    };
  }
};

// VALIDATION FUNCTION
function validateAndDeduplicate(questions, level, targetCount) {
  if (!Array.isArray(questions)) return [];
  
  const seen = new Set();
  const valid = [];
  
  for (let q of questions) {
    // Basic validation
    if (!q.question || !q.code || !Array.isArray(q.options) || 
        q.options.length !== 4 || q.correct === undefined) {
      console.warn('⚠️ Invalid question skipped:', q.id);
      continue;
    }
    
    // Check for duplicates (by code similarity)
    const codeKey = q.code.replace(/\s+/g, '').toLowerCase();
    if (seen.has(codeKey)) {
      console.warn('⚠️ Duplicate question skipped:', q.id);
      continue;
    }
    
    // Validate correct answer index
    if (q.correct < 0 || q.correct > 3) {
      console.warn('⚠️ Invalid correct index:', q.id);
      continue;
    }
    
    seen.add(codeKey);
    valid.push({
      id: valid.length + 1, // Re-index
      question: q.question.trim(),
      code: q.code.trim(),
      options: q.options.map(opt => String(opt).trim()),
      correct: parseInt(q.correct),
      level: level
    });
    
    if (valid.length >= targetCount) break;
  }
  
  return valid;
}

// Test connection (same as before)
export const testAIConnection = async () => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Reply: "Connected!"' }],
        max_tokens: 20
      })
    });

    if (!response.ok) throw new Error(`Failed: ${response.status}`);
    
    const data = await response.json();
    console.log('✅ Groq Connected:', data.choices[0].message.content);
    return { success: true };
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return { success: false, error: error.message };
  }
};

export const isCacheValid = (cacheTimestamp) => {
  if (!cacheTimestamp) return false;
  const hoursDiff = (Date.now() - new Date(cacheTimestamp)) / (1000 * 60 * 60);
  return hoursDiff < 24;
};