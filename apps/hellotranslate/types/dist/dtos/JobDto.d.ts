import { z } from "zod";
export declare const JobDtoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    submitter: z.ZodOptional<z.ZodString>;
    recursive: z.ZodOptional<z.ZodBoolean>;
    dueDate: z.ZodOptional<z.ZodString>;
    requestedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description?: string | undefined;
    submitter?: string | undefined;
    recursive?: boolean | undefined;
    dueDate?: string | undefined;
    requestedAt?: string | undefined;
}, {
    id: string;
    name: string;
    description?: string | undefined;
    submitter?: string | undefined;
    recursive?: boolean | undefined;
    dueDate?: string | undefined;
    requestedAt?: string | undefined;
}>;
export type JobDto = z.infer<typeof JobDtoSchema>;
//# sourceMappingURL=JobDto.d.ts.map