interface IVersionStatus {
  esBorrador: boolean;
  disponible: boolean;
}

export function versionStatusLabel(version: IVersionStatus): string {
  if (version.esBorrador) {
    return 'Borrador';
  }
  if (version.disponible) {
    return 'Publicada';
  }
  return 'Archivada';
}

export function versionStatusBadgeClass(version: IVersionStatus): string {
  if (version.esBorrador) {
    return 'badge-warning';
  }
  if (version.disponible) {
    return 'badge-success';
  }
  return 'badge-neutral';
}
