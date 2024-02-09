/**
 * Copyright (C) 2022 Arm Limited
 */

import * as vscode from 'vscode';
import { SerialDevice } from './serial-device';

export class SerialTerminal implements vscode.Pseudoterminal {

    private writeEmitter = new vscode.EventEmitter<string>();
    public onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    private closeEmitter = new vscode.EventEmitter<number>();
    public onDidClose: vscode.Event<number> = this.closeEmitter.event;
    public closed = false;

    public constructor(protected serialDevice: SerialDevice, protected options: SerialOptions) {
    }

    public async open(_initialDimensions: vscode.TerminalDimensions | undefined): Promise<void> {
        this.serialDevice.onData(data => this.writeOutput(data));
        this.serialDevice.onEnd(() => {
            if (!this.closed) {
                this.closed = true;
                this.closeEmitter.fire(0);
            }
        });

        this.serialDevice.open(this.options);
        this.writeLine(`Opened with baud rate: ${this.options.baudRate}`);
    }

    public close(): void {
        this.serialDevice.close();
    }

    public handleInput(data: string): void {
        this.writeOutput(data);
        this.serialDevice.send(data);
    }

    protected writeLine(message: string): void {
        this.writeOutput(`${message}\n`);
    }

    protected writeOutput(message: string): void {
        // VS Code terminal needs carriage returns
        const output = message.replace(/\r/g, '').replace(/\n/g, '\r\n');
        this.writeEmitter.fire(output);
    }
}
