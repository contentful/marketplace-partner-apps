import { z } from "zod";
export declare const AuthenticatedDtoSchema: z.ZodObject<{
    generatedToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    generatedToken: string;
}, {
    generatedToken: string;
}>;
export type AuthenticatedDto = z.infer<typeof AuthenticatedDtoSchema>;
//# sourceMappingURL=AuthenticatedDto.d.ts.map