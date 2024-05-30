import { z } from "zod";
export declare const ConfigDtoSchema: z.ZodObject<{
    appInstallationId: z.ZodString;
    locHubUrl: z.ZodString;
    locHubUsername: z.ZodString;
    locHubPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    appInstallationId: string;
    locHubUrl: string;
    locHubUsername: string;
    locHubPassword: string;
}, {
    appInstallationId: string;
    locHubUrl: string;
    locHubUsername: string;
    locHubPassword: string;
}>;
export type ConfigDto = z.infer<typeof ConfigDtoSchema>;
//# sourceMappingURL=ConfigDto.d.ts.map