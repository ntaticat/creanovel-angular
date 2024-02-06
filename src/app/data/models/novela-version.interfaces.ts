import { IEscena } from "./escena.interfaces";

export interface INovelaVersion {
    novelaVersionId: string;
    numeroVersion: string;
    disponible: boolean;
    novelaId: string;
    escenas?: IEscena[];
}