#!/usr/bin/env node

import { Command } from 'commander';

import { SetupVLEICommand } from './commands/setup-vlei.command';
import { StorageService } from './services/storage.service';
import { ConsoleUtils } from './utils/console.utils';

const program = new Command();

program
    .name('vlei-cli')
    .description('vLEI TypeScript CLI - Production-ready GLEIF implementation')
    .version('2.0.0');



program
    .command('setup-vlei')
    .description('Create complete vLEI trust chain for all organizations in config.json')
    .action(async () => {
        try {
            const command = new SetupVLEICommand();
            await command.execute();
        } catch (error: any) {
            ConsoleUtils.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('list-identities')
    .description('List all created identities')
    .action(() => {
        const identities = StorageService.getIdentities();
        if (identities.length === 0) {
            ConsoleUtils.warning('No identities found. Run setup-vlei first.');
            return;
        }
        ConsoleUtils.title('📋 vLEI Identities');
        identities.forEach(identity => {
            ConsoleUtils.section(`${identity.alias} (${identity.type})`);
            ConsoleUtils.data('  Prefix', identity.prefix);
            if (identity.lei) ConsoleUtils.data('  LEI', identity.lei);
            if (identity.role) ConsoleUtils.data('  Role', identity.role);
            if (identity.registry) ConsoleUtils.data('  Registry', identity.registry);
            ConsoleUtils.data('  Created', identity.createdAt);
            console.log();
        });
    });

program
    .command('list-credentials')
    .description('List all issued credentials')
    .action(() => {
        const credentials = StorageService.getCredentials();
        if (credentials.length === 0) {
            ConsoleUtils.warning('No credentials found. Run setup-vlei first.');
            return;
        }
        ConsoleUtils.title('📜 vLEI Credentials');
        credentials.forEach(cred => {
            ConsoleUtils.section(`${cred.type}`);
            ConsoleUtils.data('  SAID', cred.said);
            ConsoleUtils.data('  Issuer', cred.issuer);
            ConsoleUtils.data('  Issuee', cred.issuee);
            ConsoleUtils.data('  Status', cred.status);
            if (cred.lei) ConsoleUtils.data('  LEI', cred.lei);
            console.log();
        });
    });

program
    .command('list-registries')
    .description('List all credential registries')
    .action(() => {
        const registries = StorageService.getRegistries();
        if (registries.length === 0) {
            ConsoleUtils.warning('No registries found. Run setup-vlei first.');
            return;
        }
        ConsoleUtils.title('🗃️  Credential Registries');
        registries.forEach(reg => {
            ConsoleUtils.section(reg.name);
            ConsoleUtils.data('  Identifier', reg.identifier);
            ConsoleUtils.data('  AID', reg.aidPrefix);
            console.log();
        });
    });

program
    .command('clear')
    .description('Clear all stored data')
    .action(() => {
        StorageService.clearAll();
        ConsoleUtils.success('All data cleared successfully!');
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
