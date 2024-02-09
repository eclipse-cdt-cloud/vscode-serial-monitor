/**
 * Copyright (C) 2022 Arm Limited
 */

import * as vscode from 'vscode';
import { DesktopDeviceProvider } from './desktop-device-provider';
import { SerialManager } from '../serial-manager';
import { SerialMonitorExtension } from '../../api/serial-monitor';
import { SerialMonitorImpl } from '../api';

export const activate = async (context: vscode.ExtensionContext): Promise<SerialMonitorExtension> => {
    const deviceProvider = new DesktopDeviceProvider();
    const serialManager = new SerialManager(deviceProvider);

    await serialManager.activate(context);

    // Return the extension API to expose it to other extensions
    return new SerialMonitorImpl(serialManager);
};

export const deactivate = async (): Promise<void> => {
    // Do nothing for now
};
