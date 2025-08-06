
import type { LanguageMapping } from "../interfaces/translationstudio";


export type ConnectorMap = {
    [id:string]:LanguageMapping
}

export type SelectedConnector = {
    id: string;
    machineTranslation: boolean;
    urgent: boolean;
}