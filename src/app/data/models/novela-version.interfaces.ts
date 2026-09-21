import { IEscena } from "./escena.interfaces";
import { IDefiniciones } from "./motor.interfaces";

export interface INovelaVersion {
    novelaVersionId: string;
    numeroVersion: string;
    disponible: boolean;
    esBorrador: boolean;
    novelaId: string;
    escenas?: IEscena[];
    definiciones?: IDefiniciones | null;
}

export interface INovelaVersionPost {
    numeroVersion: string;
    novelaId: string;
    disponible?: boolean;
}
