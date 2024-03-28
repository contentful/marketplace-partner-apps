import { z } from "zod";
export declare const TranslationTransitionDtoSchema: z.ZodObject<{
    generatedToken: z.ZodString;
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
    spaceId: string;
    environmentId: string;
}, {
    entries: {
        entryId: string;
        targetLanguage: string;
    }[];
    generatedToken: string;
    spaceId: string;
    environmentId: string;
}>;
export type TranslationTransitionDto = z.infer<typeof TranslationTransitionDtoSchema>;
//# sourceMappingURL=TranslationTransitionDto.d.ts.map