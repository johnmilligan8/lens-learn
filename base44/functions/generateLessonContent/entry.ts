import { base44 } from '@/api/base44Client';

export async function generateLessonContent(lessonId, lessonTitle, lessonContent) {
  // Check if supplement already exists
  const existing = await base44.entities.LessonSupplement.filter({ lesson_id: lessonId }, '-created_date', 1);
  if (existing.length > 0) {
    return existing[0];
  }

  // Generate all content via single LLM call
  const prompt = `You are an expert educational content creator. Based on the following lesson, generate supplementary learning materials:

LESSON TITLE: ${lessonTitle}

LESSON CONTENT:
${lessonContent}

Please provide a JSON response with the following structure:
{
  "summary": "A detailed 3-4 paragraph summary of the key concepts covered in this lesson, formatted in Markdown with headers (###) for main topics",
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Why this is correct"
    }
  ],
  "external_resources": [
    {
      "title": "Resource title",
      "description": "Brief description",
      "url": "https://example.com",
      "type": "article|video|course|tool|documentation"
    }
  ]
}

Guidelines:
- Create 4-5 multiple choice questions that test understanding of key concepts
- Ensure quiz questions are clear and unambiguous
- Generate 4-6 relevant external resources for deeper learning
- Make the summary comprehensive but concise
- Focus on practical, relevant resources`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        quiz: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              correct_answer: { type: 'number' },
              explanation: { type: 'string' },
            },
            required: ['question', 'options', 'correct_answer'],
          },
        },
        external_resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              url: { type: 'string' },
              type: { type: 'string' },
            },
            required: ['title', 'url', 'type'],
          },
        },
      },
      required: ['summary', 'quiz', 'external_resources'],
    },
  });

  // Store in database
  const supplement = await base44.entities.LessonSupplement.create({
    lesson_id: lessonId,
    lesson_title: lessonTitle,
    summary: result.summary,
    quiz: result.quiz,
    external_resources: result.external_resources,
  });

  return supplement;
}