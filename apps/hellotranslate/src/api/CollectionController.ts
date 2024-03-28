export class CollectionController {
    private backendUrl: string;

    constructor(backendUrl: string) {
        this.backendUrl = backendUrl;
    }

    protected async execute<T>(input: string | URL, init?: RequestInit | undefined) {
        const response = await fetch(new URL(input, this.backendUrl).href, init);

        if (!response.ok) throw new Error(response.statusText);

        const json = await response.json();

        return json as T;
    }
}
