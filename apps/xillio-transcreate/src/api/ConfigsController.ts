import { ConfigDto } from "@contentful-lochub/shared";
import { CollectionController } from "./CollectionController";

export class ConfigsController extends CollectionController {
    async create(body: ConfigDto) {
        return this.execute<string>(`/config`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }
}
