import { AuthenticatedDto, ProjectDto } from "@contentful-lochub/shared";
import { CollectionController } from "./CollectionController";

export class ProjectsController extends CollectionController {
    async read(body: AuthenticatedDto) {
        return this.execute<ProjectDto[]>(`/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }
}
