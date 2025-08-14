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
import { SerialDeviceProvider } from '../serial-manager';
import { SerialDevice, SerialPortDevice } from '../serial-device';
import { SerialFilter, SerialInfo } from '../../api/serial-monitor';

const WEBSERIAL_COMMAND = 'workbench.experimental.requestSerialPort';

export class BrowserDeviceProvider implements SerialDeviceProvider {

    public async listPorts(): Promise<SerialInfo[]> {
        const ports = await navigator.serial.getPorts();
        const portInfos = await Promise.all(ports.map(port => port.getInfo()));
        return portInfos.map(port => ({
            productId: port.usbProductId?.toString(),
            vendorId: port.usbVendorId?.toString()
        }));
    }

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
