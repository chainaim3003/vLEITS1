"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleUtils = void 0;
exports.sleep = sleep;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
class ConsoleUtils {
    static title(message) {
        console.log('\n' + chalk_1.default.bold.black.bgBlue(` ${message} `) + '\n');
    }
    static message(message) {
        console.log(chalk_1.default.bold.cyan(message));
    }
    static success(message) {
        console.log(chalk_1.default.bold.green('✓ ' + message));
    }
    static warning(message) {
        console.log(chalk_1.default.bold.yellow('⚠ ' + message));
    }
    static error(message) {
        console.log(chalk_1.default.bold.red('✗ ' + message));
    }
    static info(message) {
        console.log(chalk_1.default.cyan('ℹ ' + message));
    }
    static data(label, value) {
        console.log(chalk_1.default.gray(label + ':'), chalk_1.default.white(value));
    }
    static section(title) {
        console.log('\n' + chalk_1.default.bold.underline.cyan(title));
    }
    static startSpinner(message) {
        this.spinner = (0, ora_1.default)(message).start();
    }
    static updateSpinner(message) {
        if (this.spinner) {
            this.spinner.text = message;
        }
    }
    static succeedSpinner(message) {
        if (this.spinner) {
            this.spinner.succeed(message);
            this.spinner = null;
        }
    }
    static failSpinner(message) {
        if (this.spinner) {
            this.spinner.fail(message);
            this.spinner = null;
        }
    }
    static continue() {
        console.log('\n' + chalk_1.default.bold.black.bgGreen('  You can continue ✅  ') + '\n');
    }
}
exports.ConsoleUtils = ConsoleUtils;
ConsoleUtils.spinner = null;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=console.utils.js.map