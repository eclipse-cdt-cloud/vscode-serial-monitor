/*********************************************************************
 * Copyright (c) 2024 Arm Limited and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

import * as vscode from 'vscode';

const createId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export abstract class SerialDevice {
    protected _onData: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    public readonly onData: vscode.Event<string> = this._onData.event;

    protected _onEnd: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onEnd: vscode.Event<void> = this._onEnd.event;

    public abstract handle: string;
    public abstract name: string;
    public currentOptions: SerialOptions | undefined;

    public abstract open(options: SerialOptions): Promise<void>;
    public abstract send(data: string): Promise<void>;
    public abstract close(): Promise<void>;

    public abstract pause(): Promise<void>;
    public abstract resume(): Promise<void>;
}

export class SerialPortDevice extends SerialDevice {
    protected decoder = new TextDecoder();
    protected reader: ReadableStreamDefaultReader | undefined;
    protected reading = false;
    protected paused = false;

    constructor(protected port: SerialPort, public handle = createId()) {
        super();
    }

    public get name(): string {
        const info = this.port.getInfo();
        return `${info.usbVendorId || 'Unknown Vendor'} - ${info.usbProductId || 'Unknown Product'}`;
    }

    public async open(options: SerialOptions): Promise<void> {
        this.currentOptions = options;

        await this.port.open(options);
        this.reading = true;

        while (this.port.readable && this.reading && !this.paused) {
            this.reader = this.port.readable.getReader();

            try {
                while(true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        break;
                    }
                    const data = this.decoder.decode(value);
                    this._onData.fire(data);
                }
            } catch(error) {
                const message = error instanceof Error ? error.message : 'Unknown Error';
                this._onData.fire(message);
            } finally {
                this.reader.releaseLock();
            }
        }

        await this.port.close();
        this.reader = undefined;

        if (!this.paused) {
            this.reading = false;
            this._onEnd.fire();
        }
    }

    public async send(data: string): Promise<void> {
        if (this.port.writable) {
            const writer = this.port.writable.getWriter();
            const encoder = new TextEncoder();
            const encoded = encoder.encode(data);
            writer.write(encoded);
            writer.releaseLock();
        }
    }

    public async close(): Promise<void> {
        if (this.reader) {
            this.reading = false;
            this.reader.cancel();
        }
    }

    public async pause(): Promise<void> {
        if (!this.paused) {
            this.paused = true;
        }
    }

    public async resume(): Promise<void> {
        if (this.paused) {
            this.paused = false;
            if (this.reading && this.currentOptions) {
                await this.open(this.currentOptions);
            }
        }
    }
}
