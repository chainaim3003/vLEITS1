import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class ConsoleUtils {
    private static spinner: Ora | null = null;

    static title(message: string): void {
        console.log('\n' + chalk.bold.black.bgBlue(` ${message} `) + '\n');
    }

    static message(message: string): void {
        console.log(chalk.bold.cyan(message));
    }

    static success(message: string): void {
        console.log(chalk.bold.green('✓ ' + message));
    }

    static warning(message: string): void {
        console.log(chalk.bold.yellow('⚠ ' + message));
    }

    static error(message: string): void {
        console.log(chalk.bold.red('✗ ' + message));
    }

    static info(message: string): void {
        console.log(chalk.cyan('ℹ ' + message));
    }

    static data(label: string, value: string): void {
        console.log(chalk.gray(label + ':'), chalk.white(value));
    }

    static section(title: string): void {
        console.log('\n' + chalk.bold.underline.cyan(title));
    }

    static startSpinner(message: string): void {
        this.spinner = ora(message).start();
    }

    static updateSpinner(message: string): void {
        if (this.spinner) {
            this.spinner.text = message;
        }
    }

    static succeedSpinner(message?: string): void {
        if (this.spinner) {
            this.spinner.succeed(message);
            this.spinner = null;
        }
    }

    static failSpinner(message?: string): void {
        if (this.spinner) {
            this.spinner.fail(message);
            this.spinner = null;
        }
    }

    static continue(): void {
        console.log('\n' + chalk.bold.black.bgGreen('  You can continue ✅  ') + '\n');
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
