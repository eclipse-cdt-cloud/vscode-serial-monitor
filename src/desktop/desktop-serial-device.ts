/**
 * Copyright (C) 2022 Arm Limited
 */

import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-cpp';
import { SerialDevice } from '../serial-device';

export const getName = (port: PortInfo) => (port.manufacturer || port.serialNumber) ? `${port.path} (${port.manufacturer || port.serialNumber})` : port.path;

export class DesktopSerialDevice extends SerialDevice {
    protected serialPort: SerialPort | undefined;
    protected decoder = new TextDecoder();

    constructor(protected port: PortInfo) {
        super();
    }

    public get handle(): string {
        return this.port.path;
    }

    public get name(): string {
        return getName(this.port);
    }

    public async open(options: SerialOptions): Promise<void> {
        this.currentOptions = options;
        const dataBits = options.dataBits ? options.dataBits as 5 | 6 | 7 | 8 : undefined;
        const stopBits = options.stopBits ? options.stopBits as 1 | 1.5 | 2 : undefined;

        this.serialPort = new SerialPort({
            path: this.port.path,
            baudRate: options.baudRate,
            dataBits,
            parity: options.parity,
            stopBits
        });

        this.serialPort.on('end', () => this._onEnd.fire());
        this.serialPort.on('close', () => this._onEnd.fire());
        this.serialPort.on('data', data => this.emit(data));
        this.serialPort.on('error', error => {
            this._onData.fire(error.message);
            this.close();
        });
        this.serialPort.on('open', () => {
            if (this.serialPort) {
                // This sets the defaults for the port
                this.serialPort.set({});
            }
        });
    }

    public async send(data: string): Promise<void> {
        if (this.serialPort) {
            this.serialPort.write(data);
        }
    }

    public async close(): Promise<void> {
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close();
        }
    }

    protected async emit(data: Uint8Array): Promise<void> {
        this._onData.fire(this.decoder.decode(data));
    }

    public async pause(): Promise<void> {
        if (this.serialPort) {
            this.serialPort.pause();
        }
    }

    public async resume(): Promise<void> {
        if (this.serialPort) {
            this.serialPort.resume();
        }
    }
}
