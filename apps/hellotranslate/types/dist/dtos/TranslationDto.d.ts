import { z } from "zod";
export declare const TranslationStatuses: readonly ["pending", "confirmed", "in-progress", "paused", "cancelled", "completed", "completed-with-warnings", "failed", "rejected"];
export declare const TranslationDtoSchema: z.ZodObject<{
    entryId: z.ZodString;
    sourceLanguage: z.ZodString;
    tasks: z.ZodArray<z.ZodObject<{
        parentEntryId: z.ZodNullable<z.ZodString>;
        targetLanguage: z.ZodString;
        dueDate: z.ZodString;
        requestedAt: z.ZodString;
        scrapedAt: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["pending", "confirmed", "in-progress", "paused", "cancelled", "completed", "completed-with-warnings", "failed", "rejected"]>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "confirmed" | "in-progress" | "paused" | "cancelled" | "completed" | "completed-with-warnings" | "failed" | "rejected";
        dueDate: string;
        requestedAt: string;
        parentEntryId: string | null;
        targetLanguage: string;
        scrapedAt: string | null;
    }, {
        status: "pending" | "confirmed" | "in-progress" | "paused" | "cancelled" | "completed" | "completed-with-warnings" | "failed" | "rejected";
        dueDate: string;
        requestedAt: string;
        parentEntryId: string | null;
        targetLanguage: string;
        scrapedAt: string | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entryId: string;
    sourceLanguage: string;
    tasks: {
        status: "pending" | "confirmed" | "in-progress" | "paused" | "cancelled" | "completed" | "completed-with-warnings" | "failed" | "rejected";
        dueDate: string;
        requestedAt: string;
        parentEntryId: string | null;
        targetLanguage: string;
        scrapedAt: string | null;
    }[];
}, {
    entryId: string;
    sourceLanguage: string;
    tasks: {
        status: "pending" | "confirmed" | "in-progress" | "paused" | "cancelled" | "completed" | "completed-with-warnings" | "failed" | "rejected";
        dueDate: string;
        requestedAt: string;
        parentEntryId: string | null;
        targetLanguage: string;
        scrapedAt: string | null;
    }[];
}>;
export type TranslationStatus = (typeof TranslationStatuses)[number];
export type TranslationDto = z.infer<typeof TranslationDtoSchema>;
//# sourceMappingURL=TranslationDto.d.ts.map