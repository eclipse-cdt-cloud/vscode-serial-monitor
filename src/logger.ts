/**
 * Copyright (C) 2023 Arm Limited
 */

import * as vscode from 'vscode';
import * as manifest from './manifest';

export enum Verbosity {
    off = 0,
    error = 1,
    warn = 2,
    info = 3,
    debug = 4
}

abstract class Logger {
    protected logVerbosity: Verbosity;

    protected constructor() {
        this.logVerbosity = this.getVerbosity();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(`${manifest.PACKAGE_NAME}.${manifest.CONFIG_LOGGING_VERBOSITY}`)) {
                this.logVerbosity = this.getVerbosity();
            }
        });
    }

    protected getVerbosity(): Verbosity {
        const config = vscode.workspace.getConfiguration(manifest.PACKAGE_NAME).get<string>(manifest.CONFIG_LOGGING_VERBOSITY) || manifest.DEFAULT_LOGGING_VERBOSITY;
        return Verbosity[config as keyof typeof Verbosity];
    }

    protected abstract logMessage(message: string): void;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public log(verbosity: Verbosity, message: string | any): void {
        if (this.logVerbosity === Verbosity.off) {
            return;
        }

        if (typeof message !== 'string') {
            message = JSON.stringify(message, undefined, '\t');
        }

        if (verbosity <= this.logVerbosity) {
            this.logMessage(message);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public error = (message: string | any): void => this.log(Verbosity.error, message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public warn = (message: string | any): void => this.log(Verbosity.warn, message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public info = (message: string | any): void => this.log(Verbosity.info, message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public debug = (message: string | any): void => this.log(Verbosity.debug, message);
}

class OutputChannelLogger extends Logger {
    public static instance = new OutputChannelLogger();

    protected outputChannel: vscode.OutputChannel | undefined;

    protected override logMessage(message: string): void {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel(manifest.DISPLAY_NAME);
        }
        this.outputChannel.appendLine(message);
    }
}

export const logger = OutputChannelLogger.instance;
