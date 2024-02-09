/**
 * Copyright (C) 2023 Arm Limited
 */

import * as vscode from 'vscode';
import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-cpp';
import { DesktopSerialDevice, getName } from './desktop-serial-device';
import { SerialDeviceProvider } from '../serial-manager';
import { SerialFilter } from '../../api/serial-monitor';
import { SerialDevice } from '../serial-device';

class PortItem implements vscode.QuickPickItem {
    public label: string;
    public constructor(public port: PortInfo) {
        this.label = getName(port);
    }
}

export class DesktopDeviceProvider implements SerialDeviceProvider {

    public async getDevice(filter?: SerialFilter): Promise<SerialDevice | undefined> {
        let port = await this.getPortInfo(filter);
        if (!port) {
            port = await this.selectSerialPort();
        }

        if (!port) {
            return;
        }

        return new DesktopSerialDevice(port);
    }

    protected async getPortInfo(filter?: SerialFilter): Promise<PortInfo | undefined> {
        if (filter && (filter.serialNumber || filter.path || (filter.vendorId && filter.productId))) {
            let port: PortInfo | undefined;

            for (let i = 0; i < 3; i ++) {
                const ports = await SerialPort.list();

                if (filter.serialNumber) {
                    port = ports.find(info => info.serialNumber === filter.serialNumber);
                } else if (filter.path) {
                    port = ports.find(info => info.path === filter.path);
                } else {
                    port = ports.find(info => info.vendorId === filter.vendorId && info.productId === filter.productId);
                }

                if (port) {
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            return port;
        }
    }

    protected async selectSerialPort(): Promise<PortInfo | undefined> {
        let port: PortInfo | undefined;

        const ports = await SerialPort.list();
        const items = ports.map(port => new PortItem(port));
        const selected = await vscode.window.showQuickPick<PortItem>(items, { title: 'Please select a serial port' });
        if (selected) {
            port = selected.port;
        }

        return port;
    }
}
