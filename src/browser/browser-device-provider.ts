/**
 * Copyright (C) 2022 Arm Limited
 */

import * as vscode from 'vscode';
import { SerialDeviceProvider } from '../serial-manager';
import { SerialDevice, SerialPortDevice } from '../serial-device';
import { SerialFilter } from '../../api/serial-monitor';

const WEBSERIAL_COMMAND = 'workbench.experimental.requestSerialPort';

export class BrowserDeviceProvider implements SerialDeviceProvider {

    public async getDevice(filter?: SerialFilter): Promise<SerialDevice | undefined> {
        let port: SerialPort | undefined;
        const ports = await this.getPortsByDevice(filter?.vendorId, filter?.productId);
        if (ports.length === 1) {
            // Use previously authorised port
            port = ports[0];
        } else {
            const commands = await vscode.commands.getCommands();
            if (commands.includes(WEBSERIAL_COMMAND)) {
                try {
                    const filters = filter?.vendorId || filter?.productId ? [{
                        usbVendorId: filter?.vendorId,
                        usbProductId: filter?.productId
                    }] : [];

                    const portInfo: SerialPortInfo = await vscode.commands.executeCommand(WEBSERIAL_COMMAND, { filters });
                    if (portInfo) {
                        // Command only returns readonly properties, find the actual port
                        const ports = await this.getPortsByDevice(portInfo.usbVendorId, portInfo.usbProductId);
                        // We have to assume the first one as there's no other criteria
                        port = ports[0];
                    }
                } catch (error) {
                    // User cancelled picker
                }
            }
        }

        if (!port) {
            return undefined;
        }

        return new SerialPortDevice(port);
    }

    protected async getPortsByDevice(usbVendorId?: number, usbProductId?: number): Promise<SerialPort[]> {
        if (!usbVendorId || !usbProductId) {
            return [];
        }

        const ports = await navigator.serial.getPorts();
        return ports.filter(item => {
            const info = item.getInfo();
            return info.usbVendorId === usbVendorId && info.usbProductId === usbProductId;
        });
    }
}
