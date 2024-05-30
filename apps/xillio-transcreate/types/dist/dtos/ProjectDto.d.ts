import { z } from "zod";
export declare const ProjectDtoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    description?: string | undefined;
}>;
export type ProjectDto = z.infer<typeof ProjectDtoSchema>;
//# sourceMappingURL=ProjectDto.d.ts.map