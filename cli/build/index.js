#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const setup_vlei_command_1 = require("./commands/setup-vlei.command");
const storage_service_1 = require("./services/storage.service");
const console_utils_1 = require("./utils/console.utils");
const program = new commander_1.Command();
program
    .name('vlei-cli')
    .description('vLEI TypeScript CLI - Production-ready GLEIF implementation')
    .version('2.0.0');
program
    .command('setup-vlei')
    .description('Create complete vLEI trust chain for all organizations in config.json')
    .action(async () => {
    try {
        const command = new setup_vlei_command_1.SetupVLEICommand();
        await command.execute();
    }
    catch (error) {
        console_utils_1.ConsoleUtils.error(`Error: ${error.message}`);
        process.exit(1);
    }
});
program
    .command('list-identities')
    .description('List all created identities')
    .action(() => {
    const identities = storage_service_1.StorageService.getIdentities();
    if (identities.length === 0) {
        console_utils_1.ConsoleUtils.warning('No identities found. Run setup-vlei first.');
        return;
    }
    console_utils_1.ConsoleUtils.title('📋 vLEI Identities');
    identities.forEach(identity => {
        console_utils_1.ConsoleUtils.section(`${identity.alias} (${identity.type})`);
        console_utils_1.ConsoleUtils.data('  Prefix', identity.prefix);
        if (identity.lei)
            console_utils_1.ConsoleUtils.data('  LEI', identity.lei);
        if (identity.role)
            console_utils_1.ConsoleUtils.data('  Role', identity.role);
        if (identity.registry)
            console_utils_1.ConsoleUtils.data('  Registry', identity.registry);
        console_utils_1.ConsoleUtils.data('  Created', identity.createdAt);
        console.log();
    });
});
program
    .command('list-credentials')
    .description('List all issued credentials')
    .action(() => {
    const credentials = storage_service_1.StorageService.getCredentials();
    if (credentials.length === 0) {
        console_utils_1.ConsoleUtils.warning('No credentials found. Run setup-vlei first.');
        return;
    }
    console_utils_1.ConsoleUtils.title('📜 vLEI Credentials');
    credentials.forEach(cred => {
        console_utils_1.ConsoleUtils.section(`${cred.type}`);
        console_utils_1.ConsoleUtils.data('  SAID', cred.said);
        console_utils_1.ConsoleUtils.data('  Issuer', cred.issuer);
        console_utils_1.ConsoleUtils.data('  Issuee', cred.issuee);
        console_utils_1.ConsoleUtils.data('  Status', cred.status);
        if (cred.lei)
            console_utils_1.ConsoleUtils.data('  LEI', cred.lei);
        console.log();
    });
});
program
    .command('list-registries')
    .description('List all credential registries')
    .action(() => {
    const registries = storage_service_1.StorageService.getRegistries();
    if (registries.length === 0) {
        console_utils_1.ConsoleUtils.warning('No registries found. Run setup-vlei first.');
        return;
    }
    console_utils_1.ConsoleUtils.title('🗃️  Credential Registries');
    registries.forEach(reg => {
        console_utils_1.ConsoleUtils.section(reg.name);
        console_utils_1.ConsoleUtils.data('  Identifier', reg.identifier);
        console_utils_1.ConsoleUtils.data('  AID', reg.aidPrefix);
        console.log();
    });
});
program
    .command('clear')
    .description('Clear all stored data')
    .action(() => {
    storage_service_1.StorageService.clearAll();
    console_utils_1.ConsoleUtils.success('All data cleared successfully!');
});
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map