import { z } from "zod";
export declare const TranslationRequestDtoSchema: z.ZodObject<{
    generatedToken: z.ZodString;
    projectId: z.ZodString;
    jobName: z.ZodString;
    jobDescription: z.ZodString;
    jobSubmitter: z.ZodString;
    sourceLanguage: z.ZodString;
    recursive: z.ZodBoolean;
    dueDate: z.ZodString;
    spaceId: z.ZodString;
    environmentId: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        entryId: z.ZodString;
        targetLanguage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entryId: string;
        targetLanguage: string;
    }, {
        entryId: string;
        targetLanguage: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        entryId: string;
        targetLanguage: string;
    }[];
    generatedToken: string;
    recursive: boolean;
    dueDate: string;
    sourceLanguage: string;
    projectId: string;
    jobName: string;
    jobDescription: string;
    jobSubmitter: string;
    spaceId: string;
    environmentId: string;
}, {
    entries: {
        entryId: string;
        targetLanguage: string;
    }[];
    generatedToken: string;
    recursive: boolean;
    dueDate: string;
    sourceLanguage: string;
    projectId: string;
    jobName: string;
    jobDescription: string;
    jobSubmitter: string;
    spaceId: string;
    environmentId: string;
}>;
export type TranslationRequestDto = z.infer<typeof TranslationRequestDtoSchema>;
//# sourceMappingURL=TranslationRequestDto.d.ts.map