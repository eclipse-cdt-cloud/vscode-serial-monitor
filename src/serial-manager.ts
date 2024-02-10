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
import * as manifest from './manifest';
import { SerialTerminal } from './serial-terminal';
import { SerialDevice, SerialPortDevice } from './serial-device';
import { SerialFilter, SerialMonitorApiV1 } from '../api/serial-monitor';

export interface SerialDeviceProvider {
    getDevice: (filter?: SerialFilter) => Promise<SerialDevice | undefined>;
}

const BAUD_RATES = ['115200', '57600', '38400', '19200', '9600', '4800', '2400', '1800', '1200', '600'];

const isSerialPort = (portOrFilter?: SerialPort | SerialFilter): portOrFilter is SerialPort => !!(portOrFilter as SerialPort)?.getInfo;

export class SerialManager implements SerialMonitorApiV1 {
    public static openCommand = `${manifest.PACKAGE_NAME}.openSerial`;
    public static statusCommand = `${manifest.PACKAGE_NAME}.changeBaudrate`;

    protected serialHandles = new Map<string, SerialDevice>();
    protected serialTerms = new Map<SerialDevice, vscode.Terminal>();
    protected statusBarItem: vscode.StatusBarItem | undefined;
    protected willReopenBaud: number | undefined;

    public constructor(protected serialDeviceProvider: SerialDeviceProvider) {
    }

    public async activate(context: vscode.ExtensionContext): Promise<void> {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        this.statusBarItem.command = SerialManager.statusCommand;

        context.subscriptions.push(
            this.statusBarItem,
            vscode.commands.registerCommand(SerialManager.openCommand, () => this.openSerial()),
            vscode.commands.registerCommand(SerialManager.statusCommand, () => this.changeBaudrate()),
        );

        this.updateStatus();
    }

    public async openSerial(portOrFilter?: SerialPort | SerialFilter, options?: SerialOptions, name?: string): Promise<string | undefined> {
        let device: SerialDevice | undefined;

        if (isSerialPort(portOrFilter)) {
            device = new SerialPortDevice(portOrFilter);
        } else {
            device = await this.serialDeviceProvider.getDevice(portOrFilter);
        }

        if (!device) {
            return;
        }

        const success = await this.openSerialPort(device, options, name);
        if (success) {
            const handle = device.handle;
            this.serialHandles.set(handle, device);
            return handle;
        }
    }

    protected async openSerialPort(serialDevice: SerialDevice, options?: SerialOptions, name?: string): Promise<boolean> {
        if (!serialDevice) {
            return false;
        }

        let success = !!this.showTerminal(serialDevice);
        if (success) {
            return true;
        }

        try {
            if (!options) {
                const initialBaud = await this.getBaudrate();
                if (!initialBaud) {
                    return false;
                }

                const baudRate = parseInt(initialBaud);
                options = {
                    baudRate,
                    dataBits: 8,
                    parity: 'none',
                    stopBits: 1
                };
            }

            if (!name) {
                name = serialDevice.name;
            }

            const pty = new SerialTerminal(serialDevice, options);
            pty.onDidClose(() => {
                this.cleanup(serialDevice);
                this.updateStatus();

                if (this.willReopenBaud !== undefined) {
                    this.openSerialPort(serialDevice, {
                        ...options,
                        baudRate: this.willReopenBaud
                    }, name);
                    this.willReopenBaud = undefined;
                }
            });

            const term = vscode.window.createTerminal({ name, pty });
            this.serialTerms.set(serialDevice, term);
            term.show();
            success = true;
        } catch (error) {
            if (vscode.window.state.focused) {
                const message = error instanceof Error ? error.message : 'Unknown Error';
                vscode.window.showWarningMessage(message);
            }
        }

        this.updateStatus();
        return success;
    }

    public async revealSerial(handle: string): Promise<boolean> {
        const device = this.serialHandles.get(handle);
        if (!device) {
            return false;
        }

        const success = !!this.showTerminal(device);
        return success;
    }

    public async pauseSerial(handle: string): Promise<boolean> {
        const device = this.serialHandles.get(handle);
        if (!device) {
            return false;
        }

        await device.pause();
        return true;
    }

    public async resumeSerial(handle: string): Promise<boolean> {
        const device = this.serialHandles.get(handle);
        if (!device) {
            return false;
        }

        await device.resume();
        return true;
    }

    protected async getBaudrate(currentBaudrate?: string): Promise<string | undefined> {
        if (!currentBaudrate) {
            currentBaudrate = vscode.workspace.getConfiguration(manifest.PACKAGE_NAME).get<string>(manifest.CONFIG_DEFAULT_BAUD) || manifest.DEFAULT_DEFAULT_BAUD;
        }
        return vscode.window.showQuickPick(BAUD_RATES, { title: 'Select a baud rate', placeHolder: currentBaudrate });
    }

    protected async getDevice(): Promise<SerialDevice | undefined> {
        if (this.serialTerms.size < 2) {
            return [...this.serialTerms.keys()][0];
        }

        const deviceMap = new Map<string, SerialDevice>();

        let uniqueMarker = 0;
        for (const device of this.serialTerms.keys()) {
            const name = deviceMap.has(device.name) ? `${device.name} (${++uniqueMarker})` : device.name;
            deviceMap.set(name, device);
        }

        const selected = await vscode.window.showQuickPick([...deviceMap.keys()], { title: 'Select a device' });
        return selected ? deviceMap.get(selected) : undefined;
    }

    protected async changeBaudrate(): Promise<void> {
        const serialDevice = await this.getDevice();
        if (!serialDevice) {
            return;
        }

        const currentBaud = serialDevice.currentOptions?.baudRate;
        const baudRate = await this.getBaudrate(currentBaud?.toString());
        if (!baudRate) {
            // Cancelled
            return;
        }

        // Queue the serial reopen
        this.willReopenBaud = parseInt(baudRate);

        // Close existing terminal
        this.cleanup(serialDevice);
    }

    protected showTerminal(serialDevice: SerialDevice): vscode.Terminal | undefined {
        const existingTerm = this.serialTerms.get(serialDevice);

        if (existingTerm) {
            if (existingTerm.exitStatus === undefined) {
                // Still active
                existingTerm.show();
                return existingTerm;
            } else {
                this.cleanup(serialDevice);
            }
        }
    }

    protected cleanup(serialDevice: SerialDevice): void {
        const term = this.serialTerms.get(serialDevice);
        if (term && term.exitStatus === undefined) {
            term.dispose();
        }
        this.serialTerms.delete(serialDevice);
    }

    protected async updateStatus(): Promise<void> {
        if (this.statusBarItem) {
            if (this.serialTerms.size > 0) {
                this.statusBarItem.text = '$(console)';
                this.statusBarItem.tooltip = 'Change serial baud rate';
                this.statusBarItem.show();
            } else {
                this.statusBarItem.hide();
            }
        }
    }
}
