import { ConfigsController } from "./ConfigsController";
import { ProjectsController } from "./ProjectsController";
import { TranslationsController } from "./TranslationsController";

export class APIController {
    private _backendUrl!: string;
    configs!: ConfigsController;
    projects!: ProjectsController;
    translations!: TranslationsController;

    constructor(backendUrl: string) {
        this.backendUrl = backendUrl;
    }

    get backendUrl() {
        return this._backendUrl;
    }

    set backendUrl(backendUrl: string) {
        this._backendUrl = backendUrl;
        this.configs = new ConfigsController(backendUrl);
        this.projects = new ProjectsController(backendUrl);
        this.translations = new TranslationsController(backendUrl);
    }
}
