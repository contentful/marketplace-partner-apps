import { ConfigsController } from "./ConfigsController";
import { ProjectsController } from "./ProjectsController";
import { TranslationsController } from "./TranslationsController";

export class APIController {
    configs!: ConfigsController;
    projects!: ProjectsController;
    translations!: TranslationsController;

    constructor(backendUrl: string) {
        this.configs = new ConfigsController(backendUrl);
        this.projects = new ProjectsController(backendUrl);
        this.translations = new TranslationsController(backendUrl);
    }
}
