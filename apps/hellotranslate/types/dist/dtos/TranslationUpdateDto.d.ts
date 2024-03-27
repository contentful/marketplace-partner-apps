import { z } from "zod";
export declare const TranslationUpdateDtoSchema: z.ZodObject<{
    generatedToken: z.ZodString;
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
    dueDate: string;
    spaceId: string;
    environmentId: string;
}, {
    entries: {
        entryId: string;
        targetLanguage: string;
    }[];
    generatedToken: string;
    dueDate: string;
    spaceId: string;
    environmentId: string;
}>;
export type TranslationUpdateDto = z.infer<typeof TranslationUpdateDtoSchema>;
//# sourceMappingURL=TranslationUpdateDto.d.ts.map