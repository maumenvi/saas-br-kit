export interface RepositoryPort<Entity> {
  save(entity: Entity): Promise<void>;
  changeStatus(entity: Entity): Promise<void>;
  update(entity: Entity): Promise<void>;
  findById(id: string): Promise<Entity | null>;
}
