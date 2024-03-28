import { z } from "zod";
export declare const TranslationStatusDtoSchema: z.ZodObject<{
    generatedToken: z.ZodString;
    spaceId: z.ZodString;
    environmentId: z.ZodString;
    entryIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    generatedToken: string;
    spaceId: string;
    environmentId: string;
    entryIds: string[];
}, {
    generatedToken: string;
    spaceId: string;
    environmentId: string;
    entryIds: string[];
}>;
export type TranslationStatusDto = z.infer<typeof TranslationStatusDtoSchema>;
//# sourceMappingURL=TranslationStatusDto.d.ts.map