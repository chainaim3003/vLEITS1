export declare class ConsoleUtils {
    private static spinner;
    static title(message: string): void;
    static message(message: string): void;
    static success(message: string): void;
    static warning(message: string): void;
    static error(message: string): void;
    static info(message: string): void;
    static data(label: string, value: string): void;
    static section(title: string): void;
    static startSpinner(message: string): void;
    static updateSpinner(message: string): void;
    static succeedSpinner(message?: string): void;
    static failSpinner(message?: string): void;
    static continue(): void;
}
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=console.utils.d.ts.map