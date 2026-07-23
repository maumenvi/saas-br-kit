export interface DatabasePort {
    run<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>
}
