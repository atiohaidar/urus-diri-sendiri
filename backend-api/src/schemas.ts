import { z } from 'zod';

// Shared schemas
const timestampSchema = z.string().datetime().optional().nullable();
const booleanOrIntSchema = z.union([z.boolean(), z.number().int().min(0).max(1)]).transform((val) => {
    if (typeof val === 'boolean') return val;
    return val === 1;
});

// JSON Schema helper for text fields that store JSON
const jsonStringSchema = z.any().transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
}).optional().nullable();

export const prioritySchema = z.object({
    id: z.string(),
    text: z.string().optional().default(''),
    completed: booleanOrIntSchema.optional().default(false),
    updatedAt: timestampSchema
});

export const routineSchema = z.object({
    id: z.string(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    activity: z.string().optional().default(''),
    category: z.string().optional().nullable(),
    completedAt: timestampSchema,
    updatedAt: timestampSchema,
    description: z.string().optional().nullable()
});

export const noteSchema = z.object({
    id: z.string(),
    title: z.string().optional().default(''),
    content: z.string().optional().default(''),
    category: z.string().optional().nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    isEncrypted: booleanOrIntSchema.optional().default(false),
    encryptionSalt: z.string().optional().nullable(),
    encryptionIv: z.string().optional().nullable(),
    passwordHash: z.string().optional().nullable()
});

export const noteHistorySchema = z.object({
    id: z.string(),
    noteId: z.string(),
    title: z.string().optional().default(''),
    content: z.string().optional().default(''),
    savedAt: timestampSchema,
    updatedAt: timestampSchema
});

export const habitSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    frequency: z.string(),
    interval: z.number().int().optional().nullable(),
    specificDays: jsonStringSchema,
    allowedDayOff: z.number().int().optional().default(1),
    targetCount: z.number().int().optional().default(1),
    isArchived: booleanOrIntSchema.optional().default(false),
    createdAt: timestampSchema,
    updatedAt: timestampSchema
});

export const habitLogSchema = z.object({
    id: z.string(),
    habitId: z.string(),
    date: z.string(),
    completed: booleanOrIntSchema.optional().default(false),
    completedAt: timestampSchema,
    count: z.number().int().optional().default(1),
    note: z.string().optional().nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema
});

export const logSchema = z.object({
    id: z.string(),
    timestamp: timestampSchema,
    type: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    mediaUrl: z.string().optional().nullable(),
    mediaId: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    updatedAt: timestampSchema
});

export const reflectionSchema = z.object({
    id: z.string(),
    date: z.string().optional().nullable(),
    winOfDay: z.string().optional().nullable(),
    hurdle: z.string().optional().nullable(),
    priorities: jsonStringSchema,
    smallChange: z.string().optional().nullable(),
    todayRoutines: jsonStringSchema,
    todayPriorities: jsonStringSchema,
    images: jsonStringSchema,
    updatedAt: timestampSchema
});

// Batch schemas
export const batchPrioritySchema = z.array(prioritySchema).or(prioritySchema);
export const batchRoutineSchema = z.array(routineSchema).or(routineSchema);
export const batchNoteSchema = z.array(noteSchema).or(noteSchema);
export const batchNoteHistorySchema = z.array(noteHistorySchema).or(noteHistorySchema);
export const batchHabitSchema = z.array(habitSchema).or(habitSchema);
export const batchHabitLogSchema = z.array(habitLogSchema).or(habitLogSchema);
export const batchLogSchema = z.array(logSchema).or(logSchema);
export const batchReflectionSchema = z.array(reflectionSchema).or(reflectionSchema);
